import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../services/firebase'

export const login = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  const token = await userCredential.user.getIdToken()
  return token
}

export const logout = async () => {
  await signOut(auth)
}
