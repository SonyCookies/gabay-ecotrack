import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc,
  deleteDoc, 
  doc, 
  query, 
  serverTimestamp,
  Timestamp,
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface RewardItem {
  id?: string;
  name: string;
  description: string;
  cost: number;
  category: string;
  stock: number;
  iconName: string;
  imageUrl?: string;
  createdAt?: Timestamp;
}

const COLLECTION_NAME = "reward_items";

/**
 * Add a new reward item to Firestore
 */
export const addReward = async (item: Omit<RewardItem, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...item,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...item };
  } catch (error) {
    console.error("Error adding reward item:", error);
    throw error;
  }
};

/**
 * Update an existing reward item
 */
export const updateReward = async (id: string, updates: Partial<Omit<RewardItem, 'id' | 'createdAt'>>) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error("Error updating reward item:", error);
    throw error;
  }
};

/**
 * Delete a reward item
 */
export const deleteReward = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error("Error deleting reward item:", error);
    throw error;
  }
};
/**
 * Redeem a reward item
 */
export const redeemReward = async (itemId: string) => {
  try {
    const { auth } = await import("@/lib/firebase/client");
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const token = await user.getIdToken();
    
    const response = await fetch(`/api/rewards/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ itemId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to redeem reward");
    }

    return true;
  } catch (error: any) {
    console.error("Error in redeemReward:", error);
    throw error;
  }
};
