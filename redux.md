# GABAY Redux Toolkit Reference Guide

This reference outlines exactly how the Redux State Manager is implemented in the GABAY project and proves an easy, copy-pasteable guide to adding new features into the global state.

## 1. Project Redux Architecture

Redux is isolated in the `lib/store/` directory:
- `lib/store/index.ts`: The absolute brain. Registers all your independent slices.
- `lib/store/hooks.ts`: Configures strict formatting so Typescript always knows what your variables are.
- `lib/store/slices/`: The folder where all data modules (slices) live.

---

## 2. Setting up a new Feature (e.g., "Missions" or "Trucks")

When you want to track a new layer of data across your application (like a list of active manifest data), you must create a new **Slice**.

1. Create a definition file inside `lib/store/slices/manifestSlice.ts`:

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 1. Define what the data should look like
interface ManifestState {
  activeTruck: string | null;
  logs: string[];
}

// 2. Setup the initial blank values
const initialState: ManifestState = {
  activeTruck: null,
  logs: [],
};

// 3. Create the Slice that houses your actions
const manifestSlice = createSlice({
  name: 'manifest', // The internal name
  initialState,
  reducers: {
    // Action 1: Set a specific string
    setActiveTruck: (state, action: PayloadAction<string>) => {
      state.activeTruck = action.payload; // Automatically overwrites
    },
    // Action 2: Manipulate an array
    addManifestLog: (state, action: PayloadAction<string>) => {
      state.logs.push(action.payload); // push() is safe here because of Redux Toolkit
    },
  },
});

// 4. Export the actions so components can fire them globally
export const { setActiveTruck, addManifestLog } = manifestSlice.actions;

// 5. Export the reducer so the store can read it
export default manifestSlice.reducer;
```

---

## 3. Registering your new Slice to the Redux Brain

Now that your feature exists, you must plug it into the `store` so the rest of the application is aware it's there.

Go to `lib/store/index.ts` and add it to the `reducer:` object:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';
import manifestReducer from './slices/manifestSlice'; // <-- 1. Import it

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    manifest: manifestReducer, // <-- 2. Register it here
  },
  middleware: (getDefaultMiddleware) => ...
});
```

---

## 4. Reading Data inside a React Component

When you need to visually display the data or conditionally render UI elements based on the global state, you will use `useAppSelector`. 

```tsx
"use client";

import { useAppSelector } from "@/lib/store/hooks";

export default function DashboardHeader() {
  // Querying the global store. 
  // If `activeTruck` ever changes, ONLY this component instantly re-renders.
  const activeTruck = useAppSelector((state) => state.manifest.activeTruck);

  return (
    <div>
      <h1>Operator Dashboard</h1>
      {activeTruck ? <p>Tracking: {activeTruck}</p> : <p>No trucks deployed.</p>}
    </div>
  );
}
```

---

## 5. Modifying Data (Dispatching Actions)

When a user clicks a button, fills a form, or an API call finishes, and you want to **change** the actual state data globally, use `useAppDispatch`.

```tsx
"use client";

import { useAppDispatch } from "@/lib/store/hooks";
import { setActiveTruck } from "@/lib/store/slices/manifestSlice"; // Import the strict action

export default function ManifestControls() {
  const dispatch = useAppDispatch();

  const handleDeploy = () => {
    // Fires this command off to Redux, instantly updating your DashboardHeader visually!
    dispatch(setActiveTruck("TRUCK-A449"));
  };

  return (
    <button onClick={handleDeploy}>
      Deploy Fleet
    </button>
  );
}
```
