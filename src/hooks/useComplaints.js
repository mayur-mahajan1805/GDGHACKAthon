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
 * New in this version:
 *  - Fires a custom window event `civicvoice:new-complaint` whenever a
 *    brand-new complaint arrives after the initial load. Dashboard uses this
 *    to play the notification chime + show toast.
 *
 * Seeding strategy:
 *   - Uses setDoc with a fixed document ID (the tracking_id) so seeding is
 *     IDEMPOTENT — running it multiple times never creates duplicates.
 */
export function useComplaints() {
  const [complaints, setComplaints]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [seeding, setSeeding]         = useState(false);

  const seedingRef     = useRef(false);   // real-time flag — avoids stale closure
  const seededRef      = useRef(false);   // ensure we only seed once per session
  const knownIdsRef    = useRef(null);    // null = first load (don't fire events)
  const initializedRef = useRef(false);   // true once first real data is rendered

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
            await Promise.all(
              SAMPLE_COMPLAINTS.map((c) =>
                setDoc(doc(db, 'complaints', c.tracking_id), c)
              )
            );
          } catch (seedErr) {
            console.error('[CivicVoice] Seeding failed:', seedErr);
            seedingRef.current = false;
            setSeeding(false);
          }
          return; // wait for the next snapshot with real data
        }

        const enriched = enrichWithPriority(docs);

        // ── New-complaint detection ──────────────────────────────────────────
        const incomingIds = new Set(docs.map((d) => d.id));

        if (knownIdsRef.current === null) {
          // First real snapshot — just record the IDs, no notification
          knownIdsRef.current = incomingIds;
        } else {
          // Find IDs we've never seen before
          for (const id of incomingIds) {
            if (!knownIdsRef.current.has(id)) {
              // Find the full enriched complaint object
              const newDoc = enriched.find((c) => c.id === id);
              if (newDoc && initializedRef.current) {
                // Fire a custom DOM event so Dashboard can react
                window.dispatchEvent(
                  new CustomEvent('civicvoice:new-complaint', { detail: newDoc })
                );
              }
            }
          }
          knownIdsRef.current = incomingIds;
        }
        // ────────────────────────────────────────────────────────────────────

        setComplaints(enriched);
        setLoading(false);
        setSeeding(false);
        seedingRef.current = false;

        // Mark as initialized after first paint
        setTimeout(() => { initializedRef.current = true; }, 1500);
      },
      (err) => {
        console.error('[CivicVoice] Firestore error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { complaints, loading, error, seeding };
}
