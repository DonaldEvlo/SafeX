import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase'

export const fetchAllUsersExceptCurrent = async (currentUid) => {
  const querySnapshot = await getDocs(collection(db, 'users'))
  const users = []
  querySnapshot.forEach((doc) => {
    const data = doc.data()
    if (data.uid !== currentUid) {
      users.push(data)
    }
  })
  return users
}
