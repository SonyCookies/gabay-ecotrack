"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { setUserLoggedIn, setUserLoggedOut, setAuthInitializing } from "@/lib/store/slices/authSlice";

export default function SessionManager({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  const { isAuthenticated, role } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Persistent auth observer
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const idToken = await user.getIdToken();
          const res = await fetch("/api/users/me", {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          
          if (res.ok) {
            const userData = await res.json();
            dispatch(setUserLoggedIn({
              uid: user.uid,
              email: user.email,
              role: userData.role,
              displayName: userData.displayName || userData.fullName,
              phone: userData.phone,
              department: userData.department,
              points: userData.points || 0,
              address: userData.address,
              notifications: userData.notifications
            }));

            // Set up real-time listener for user data updates (e.g. points)
            const { doc, onSnapshot } = await import("firebase/firestore");
            const { db } = await import("@/lib/firebase/client");
            unsubscribeSnapshot = onSnapshot(doc(db, "users", user.uid), (doc) => {
              if (doc.exists()) {
                const data = doc.data();
                dispatch(setUserLoggedIn({
                  uid: user.uid,
                  email: user.email,
                  role: data.role,
                  displayName: data.fullName || data.displayName,
                  phone: data.phone,
                  department: data.department,
                  points: data.points || 0,
                  address: data.address,
                  notifications: data.notifications
                }));
              }
            });
          } else {
            console.error("Session verification failed.");
            await auth.signOut();
          }
        } else {
          dispatch(setUserLoggedOut());
          if (unsubscribeSnapshot) unsubscribeSnapshot();
        }
      } catch (err) {
        console.error("Auth sync error:", err);
      } finally {
        setIsReady(true);
        dispatch(setAuthInitializing(false));
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [dispatch]);

  // Separate redirect logic to handle fresh pathname/role states
  useEffect(() => {
    if (isReady) {
      const isPublicRoute = pathname === "/login" || pathname === "/register" || pathname === "/";
      
      if (isAuthenticated && role && isPublicRoute) {
        // Logged in user on public route -> redirect to role-specific home
        let rolePath = "/login";
        if (role === "admin") rolePath = "/admin/accounts";
        else if (role === "operator") rolePath = "/operator/pickups";
        else if (role === "collector") rolePath = "/collector/pickups";
        else if (role === "resident") rolePath = "/resident/dashboard";
        else rolePath = `/${role}/dashboard`;
        
        router.push(rolePath);
      } else if (!isAuthenticated && !isPublicRoute) {
        // Unauthenticated user on protected route -> redirect to login
        router.replace("/login");
      }
    }
  }, [isReady, isAuthenticated, role, pathname, router]);

  // Loading screen for initial hydration to prevent flicker
  if (!isReady) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-medium tracking-tight animate-pulse text-sm">Initializing GABAY Platform...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
