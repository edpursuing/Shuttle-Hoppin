import { create } from 'zustand'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'

import { auth, db } from '../utils/firebase'
import type { UserProfile } from '../utils/types'

interface AuthState {
  user: UserProfile | null
  uid: string | null
  loading: boolean
  initialized: boolean
  signOut: () => Promise<void>
}

// Holds the active Firestore profile listener so we can clean it up on sign-out
let profileUnsubscribe: (() => void) | null = null

export const useAuthStore = create<AuthState>()((set) => {
  // Start listening to Firebase Auth state immediately
  onAuthStateChanged(auth, (firebaseUser) => {
    // Clean up any previous profile listener
    if (profileUnsubscribe) {
      profileUnsubscribe()
      profileUnsubscribe = null
    }

    if (!firebaseUser) {
      set({ user: null, uid: null, loading: false, initialized: true })
      return
    }

    set({ uid: firebaseUser.uid, loading: true })

    // Listen to the user's Firestore profile in real-time
    profileUnsubscribe = onSnapshot(
      doc(db, 'users', firebaseUser.uid),
      (snap) => {
        if (snap.exists()) {
          set({ user: snap.data() as UserProfile, loading: false, initialized: true })
        } else {
          // User authenticated but no Firestore doc yet (mid-creation race)
          set({ user: null, loading: false, initialized: true })
        }
      },
      () => {
        set({ user: null, loading: false, initialized: true })
      }
    )
  })

  return {
    user: null,
    uid: null,
    loading: true,
    initialized: false,
    signOut: async () => {
      if (profileUnsubscribe) {
        profileUnsubscribe()
        profileUnsubscribe = null
      }
      await firebaseSignOut(auth)
      set({ user: null, uid: null, loading: false })
    },
  }
})
