import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where,
  serverTimestamp,
  Timestamp,
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface CollectionPoint {
  id?: string;
  name: string;
  type: 'residential' | 'commercial' | 'industrial' | 'other';
  lat: number;
  lng: number;
  active: boolean;
  operatorId: string;
  createdAt?: Timestamp;
}

const COLLECTION_NAME = "collection_points";

/**
 * Add a new collection point to Firestore
 */
export const addCollectionPoint = async (point: Omit<CollectionPoint, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...point,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...point };
  } catch (error) {
    console.error("Error adding collection point:", error);
    throw error;
  }
};

/**
 * Fetch all collection points
 */
export const getCollectionPoints = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CollectionPoint[];
  } catch (error) {
    console.error("Error getting collection points:", error);
    throw error;
  }
};

/**
 * Delete a collection point
 */
export const deleteCollectionPoint = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error("Error deleting collection point:", error);
    throw error;
  }
};
