import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  uid: string | null;
  email: string | null;
  displayName: string | null;
  phone: string | null;
  department: string | null;
  address?: {
    region: string;
    province?: string;
    city: string;
    barangay: string;
    street: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  notifications?: {
    push: boolean;
    sms: boolean;
    email: boolean;
    nightBefore: boolean;
  };
  role: string | null;
  points: number;
  isAuthenticated: boolean;
  isInitializing: boolean;
}

const initialState: AuthState = {
  uid: null,
  email: null,
  displayName: null,
  phone: null,
  department: null,
  role: null,
  points: 0,
  isAuthenticated: false,
  isInitializing: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUserLoggedOut: (state) => {
      state.uid = null;
      state.email = null;
      state.displayName = null;
      state.phone = null;
      state.department = null;
      state.role = null;
      state.isAuthenticated = false;
      state.isInitializing = false;
    },
    setUserLoggedIn: (state, action: PayloadAction<{ 
      uid: string; 
      email: string | null; 
      role: string | null;
      displayName?: string | null;
      phone?: string | null;
      department?: string | null;
      points?: number;
      address?: AuthState['address'];
      notifications?: AuthState['notifications'];
    }>) => {
      state.uid = action.payload.uid;
      state.email = action.payload.email;
      state.role = action.payload.role;
      state.displayName = action.payload.displayName || null;
      state.phone = action.payload.phone || null;
      state.department = action.payload.department || null;
      state.points = action.payload.points || 0;
      state.address = action.payload.address;
      state.notifications = action.payload.notifications;
      state.isAuthenticated = true;
      state.isInitializing = false;
    },
    updateProfile: (state, action: PayloadAction<{ 
      displayName?: string; 
      phone?: string; 
      department?: string;
      address?: AuthState['address'];
      notifications?: AuthState['notifications'];
    }>) => {
      if (action.payload.displayName !== undefined) state.displayName = action.payload.displayName;
      if (action.payload.phone !== undefined) state.phone = action.payload.phone;
      if (action.payload.department !== undefined) state.department = action.payload.department;
      if (action.payload.address !== undefined) state.address = action.payload.address;
      if (action.payload.notifications !== undefined) state.notifications = action.payload.notifications;
    },
    setAuthInitializing: (state, action: PayloadAction<boolean>) => {
      state.isInitializing = action.payload;
    }
  },
});

export const { setUserLoggedOut, setUserLoggedIn, setAuthInitializing, updateProfile } = authSlice.actions;
export default authSlice.reducer;
