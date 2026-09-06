import { db, auth } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

/**
 * Generates a clean tracking ID e.g. V2A-8492
 */
export function generateTrackingId() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `V2A-${num}`;
}

/**
 * Ensures user is authenticated (using anonymous auth if needed) before writing.
 */
async function ensureAuth() {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      console.warn('[Voice2Action] Anonymous auth failed:', err);
    }
  }
}

/**
 * Creates a new citizen complaint in Firestore.
 */
export async function createCitizenComplaint(formData) {
  await ensureAuth();
  const trackingId = generateTrackingId();
  
  const complaintDoc = {
    tracking_id: trackingId,
    text: formData.text || '',
    summary: formData.summary || (formData.text ? formData.text.slice(0, 90) + '...' : 'Citizen reported issue'),
    category: formData.category || 'other',
    ward: formData.ward || 'Ward 1',
    lat: Number(formData.lat) || 28.6139,
    lng: Number(formData.lng) || 77.2090,
    address: formData.address || 'New Delhi',
    urgency_score: Number(formData.urgency_score) || 65,
    photo_url: formData.photo_url || null,
    photo_verified: Boolean(formData.photo_url),
    status: 'new',
    language: formData.language || 'en',
    citizen_name: formData.citizen_name || 'Anonymous Citizen',
    citizen_phone: formData.citizen_phone || '',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    uid: auth.currentUser?.uid || 'anonymous',
  };

  let firestoreSaved = false;
  let firestoreError = null;

  try {
    const docRef = doc(db, 'complaints', trackingId);
    await setDoc(docRef, complaintDoc);
    firestoreSaved = true;
  } catch (err) {
    console.error('[Voice2Action] Firestore write failed:', err);
    firestoreError = err.message || 'Firestore Permission Denied';
    
    // Backup in local storage for local resilience
    try {
      const local = JSON.parse(localStorage.getItem('v2a_citizen_complaints') || '[]');
      local.unshift({ ...complaintDoc, created_at: new Date(), updated_at: new Date() });
      localStorage.setItem('v2a_citizen_complaints', JSON.stringify(local));
    } catch (e) {
      console.warn('LocalStorage backup failed:', e);
    }
  }

  // Dispatch custom event so official dashboard in same browser syncs in real-time
  try {
    window.dispatchEvent(new CustomEvent('v2a_complaint_added', { detail: complaintDoc }));
  } catch (e) {
    // ignore in non-browser env
  }

  return {
    success: true,
    tracking_id: trackingId,
    firestoreSaved,
    firestoreError,
    data: complaintDoc,
  };
}

/**
 * Fetches a single complaint by tracking ID.
 */
export async function fetchComplaintByTrackingId(trackingId) {
  if (!trackingId) return null;
  const cleanId = trackingId.trim().toUpperCase();

  // Try direct document lookup first (since doc ID = tracking_id)
  const docRef = doc(db, 'complaints', cleanId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      created_at: data.created_at?.toDate?.() ?? new Date(),
      updated_at: data.updated_at?.toDate?.() ?? new Date(),
    };
  }

  // Fallback query by field
  const q = query(collection(db, 'complaints'), where('tracking_id', '==', cleanId));
  const querySnap = await getDocs(q);
  if (!querySnap.empty) {
    const firstDoc = querySnap.docs[0];
    const data = firstDoc.data();
    return {
      id: firstDoc.id,
      ...data,
      created_at: data.created_at?.toDate?.() ?? new Date(),
      updated_at: data.updated_at?.toDate?.() ?? new Date(),
    };
  }

  // Fallback to localStorage if offline or rules blocked Firestore write
  const local = JSON.parse(localStorage.getItem('v2a_citizen_complaints') || '[]');
  const match = local.find(c => c.tracking_id === cleanId);
  if (match) return match;

  return null;
}
