import { useState, useEffect, useRef } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  setDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { SAMPLE_COMPLAINTS } from '../utils/seedData';
import { enrichWithPriority } from '../utils/priorityScore';

/**
 * Real-time Firestore listener on `complaints` collection.
 *
 * Seeding strategy:
 *   - Uses setDoc with a fixed document ID (the tracking_id) so seeding is
 *     IDEMPOTENT — running it multiple times never creates duplicates.
 *   - Uses a ref (not state) for the seeding flag so the onSnapshot closure
 *     always reads the latest value (fixes the stale-closure seeding loop bug).
 */
export function useComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [seeding, setSeeding]       = useState(false);

  const seedingRef = useRef(false);  // real-time flag — avoids stale closure
  const seededRef  = useRef(false);  // ensure we only seed once per session

  useEffect(() => {
    const q = query(collection(db, 'complaints'), orderBy('created_at', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          // Normalize Firestore Timestamps → JS Date
          created_at: d.data().created_at?.toDate?.() ?? new Date(),
          updated_at: d.data().updated_at?.toDate?.() ?? new Date(),
        }));

        // Seed only if empty AND we haven't tried yet this session
        if (docs.length === 0 && !seedingRef.current && !seededRef.current) {
          seedingRef.current = true;
          seededRef.current  = true;
          setSeeding(true);
          try {
            // setDoc with tracking_id as the document ID → idempotent seeds
            await Promise.all(
              SAMPLE_COMPLAINTS.map((c) =>
                setDoc(doc(db, 'complaints', c.tracking_id), c)
              )
            );
            // onSnapshot will fire again with the seeded data — fall through
          } catch (seedErr) {
            console.error('[Voice2Action] Seeding failed:', seedErr);
            seedingRef.current = false;
            setSeeding(false);
          }
          return; // wait for the next snapshot with real data
        }

        // Merge with local complaints if any exist
        let merged = [...docs];
        try {
          const local = JSON.parse(localStorage.getItem('v2a_citizen_complaints') || '[]');
          const docIds = new Set(docs.map(d => d.tracking_id || d.id));
          const unsynced = local.filter(l => !docIds.has(l.tracking_id));
          merged = [...unsynced, ...docs];
        } catch (e) {
          // ignore
        }

        setComplaints(enrichWithPriority(merged));
        setLoading(false);
        setSeeding(false);
        seedingRef.current = false;
      },
      (err) => {
        console.warn('[Voice2Action] Firestore permission/network error, activating local data fallback:', err);
        setError(err.message);
        try {
          const local = JSON.parse(localStorage.getItem('v2a_citizen_complaints') || '[]');
          const combined = [...local, ...SAMPLE_COMPLAINTS];
          setComplaints(enrichWithPriority(combined));
        } catch (e) {
          setComplaints(enrichWithPriority(SAMPLE_COMPLAINTS));
        }
        setLoading(false);
      }
    );

    // Real-time synchronization for complaints added locally in citizen portal
    const handleComplaintAdded = (e) => {
      const newComplaint = e.detail;
      if (newComplaint) {
        setComplaints((prev) => {
          const exists = prev.some((c) => c.tracking_id === newComplaint.tracking_id);
          if (exists) return prev;
          return enrichWithPriority([newComplaint, ...prev]);
        });
      }
    };
    window.addEventListener('v2a_complaint_added', handleComplaintAdded);

    return () => {
      unsubscribe();
      window.removeEventListener('v2a_complaint_added', handleComplaintAdded);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { complaints, loading, error, seeding };
}
