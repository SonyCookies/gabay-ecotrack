import { auth, db } from "./firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { User } from "firebase/auth";

export interface ExtendedUserData {
  uid: string;
  fullName: string;
  email: string;
  mobileNumber?: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  mustChangePassword?: boolean;
}

/**
 * Fetches the extended user metadata (including role) from Firestore
 */
export async function fetchUserRoleData(uid: string): Promise<ExtendedUserData | null> {
  try {
    const userDocRef = doc(db, "users", uid);
    const userSnapshot = await getDoc(userDocRef);

    if (userSnapshot.exists()) {
      return userSnapshot.data() as ExtendedUserData;
    }
  } catch (error) {
    console.error("Error fetching user role data:", error);
  }
  return null;
}
