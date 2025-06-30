// utils/getUserRole.js
import { getFirestore, doc, getDoc } from 'firebase/firestore'

export const getUserRoleFromFirestore = async (uid) => {
  const db = getFirestore()
  const userDoc = await getDoc(doc(db, 'users', uid))
  if (userDoc.exists()) {
    return userDoc.data().role || 'user' // 'admin' ou 'user'
  }
  return 'user'
}
