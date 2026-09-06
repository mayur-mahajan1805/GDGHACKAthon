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

        setComplaints(enrichWithPriority(docs));
        setLoading(false);
        setSeeding(false);
        seedingRef.current = false;
      },
      (err) => {
        console.error('[Voice2Action] Firestore error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { complaints, loading, error, seeding };
}
