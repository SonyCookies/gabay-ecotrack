import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc,
  query, 
  where,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit,
  updateDoc,
  doc
} from "firebase/firestore";
import { db, storage } from "@/lib/firebase/client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
export { WASTE_TYPE_LABELS } from "@/lib/db/waste-labels";

export interface PickupRequest {
  id?: string;
  residentId: string;
  residentName: string;
  lat: number;
  lng: number;
  wasteType: 'general' | 'recyclable' | 'bulk' | 'hazardous' | 'biodegradable';
  extras?: string[]; // e.g. ["Contains Glass", "Heavy"]
  notes: string;
  imageUrl?: string; // New field for photo evidence
  status: 'pending' | 'scheduled' | 'collected' | 'cancelled';
  createdAt?: Timestamp;
  scheduledDate?: Timestamp;
  rating?: {
    score: number;
    criteria: string[];
  };
}



const COLLECTION_NAME = "pickup_requests";

/**
 * Check if the resident has an active (pending or scheduled) request
 */
export const hasActiveRequest = async (residentId: string) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("residentId", "==", residentId),
      where("status", "in", ["pending", "scheduled"]),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking active requests:", error);
    throw error;
  }
};

/**
 * Get the active (pending or scheduled) request for a resident
 */
export const getUserActiveRequest = async (residentId: string) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("residentId", "==", residentId),
      where("status", "in", ["pending", "scheduled"]),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as PickupRequest;
  } catch (error) {
    console.error("Error getting user active request:", error);
    throw error;
  }
};

/**
 * Submit a new pickup request
 */
export const submitPickupRequest = async (request: Omit<PickupRequest, 'id' | 'createdAt' | 'status'>) => {
  try {
    // Check for existing active request first
    const alreadyRequested = await hasActiveRequest(request.residentId);
    if (alreadyRequested) {
      throw new Error("You already have an active pickup request.");
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...request,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...request };
  } catch (error) {
    console.error("Error submitting pickup request:", error);
    throw error;
  }
};

/**
 * Get resident's previous requests
 */
export const getMyRequests = async (residentId: string) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("residentId", "==", residentId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PickupRequest[];
  } catch (error) {
    console.error("Error getting personal requests:", error);
    throw error;
  }
};

/**
 * Get all active requests (not collected or cancelled) for operators
 */
export const getAllActiveRequests = async () => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("status", "in", ["pending", "scheduled"]),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PickupRequest[];
  } catch (error) {
    console.error("Error getting all active requests:", error);
    throw error;
  }
};

/**
 * Get requests by specific status (e.g. for showing 'collected' history)
 */
export const getRequestsByStatus = async (statuses: PickupRequest['status'][]) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("status", "in", statuses),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PickupRequest[];
  } catch (error) {
    console.error("Error getting requests by status:", error);
    throw error;
  }
};

/**
 * Update the status of a pickup request
 */
export const updatePickupStatus = async (
  requestId: string, 
  status: PickupRequest['status'],
  additionalData: any = {}
) => {
  try {
    // Standardize additionalData to an object if a Timestamp was passed directly
    let finalData: any = {};
    if (additionalData && (additionalData.seconds || additionalData.nanoseconds)) {
      // Legacy support: if the 3rd arg is a Timestamp, treat it as { scheduledDate: timestamp }
      finalData = { scheduledDate: additionalData };
    } else {
      finalData = additionalData || {};
    }

    // If we're in the browser, we use the API to avoid permission issues
    // especially for the Eco Points increment which requires admin rights
    if (typeof window !== 'undefined') {
      const { auth } = await import("@/lib/firebase/client");
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      
      const token = await user.getIdToken();
      
      // Prepare data for JSON serialization, converting Timestamps to strings
      const serializedData = { ...finalData };
      if (serializedData.scheduledDate && typeof serializedData.scheduledDate.toDate === 'function') {
        serializedData.scheduledDate = serializedData.scheduledDate.toDate().toISOString();
      }

      const bodyData = {
        status,
        additionalData: serializedData
      };

      const response = await fetch(`/api/requests/${requestId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update status");
      }

      return true;
    }

    // Server-side fallback (or if we ever call this from a server component/route)
    const docRef = doc(db, COLLECTION_NAME, requestId);
    const updateData: any = { status };
    if (finalData.scheduledDate) updateData.scheduledDate = finalData.scheduledDate;
    if (finalData.rating) updateData.rating = finalData.rating;
    if (finalData.updatedAt) updateData.updatedAt = finalData.updatedAt;
    
    await updateDoc(docRef, updateData);
    return true;
  } catch (error) {
    console.error("Error updating pickup status:", error);
    throw error;
  }
};

/**
 * Bulk update the status of multiple pickup requests
 */
export const bulkUpdatePickupStatus = async (
  requestIds: string[], 
  status: PickupRequest['status'],
  scheduledDate?: Timestamp
) => {
  try {
    const { writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);
    
    requestIds.forEach((id) => {
      const docRef = doc(db, COLLECTION_NAME, id);
      const updateData: any = { status };
      if (scheduledDate) updateData.scheduledDate = scheduledDate;
      batch.update(docRef, updateData);
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error bulk updating pickup status:", error);
    throw error;
  }
};

/**
 * Upload an image for a pickup request
 */
export const uploadPickupImage = async (userId: string, file: File): Promise<string> => {
  try {
    const timestamp = Date.now();
    const storageRef = ref(storage, `pickup_images/${userId}/${timestamp}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading pickup image:", error);
    throw error;
  }
};

/**
 * Delete a request
 */
export const deletePickupRequest = async (requestId: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, requestId));
  } catch (error) {
    console.error("Error deleting request:", error);
    throw error;
  }
};
