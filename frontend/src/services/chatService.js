import { db } from './firebase'; // Assure-toi d’avoir un fichier firebase.js qui initialise Firestore
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import Chat from '../models/Chat';
import Message from '../models/Message';

/**
 * Crée ou récupère un chat existant entre deux utilisateurs
 */
export const createOrGetChat = async (uid1, uid2) => {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', uid1)
  );

  const snapshot = await getDocs(q);

  // Vérifie si un chat existe déjà
  for (const docSnap of snapshot.docs) {
    const chatData = docSnap.data();
    if (chatData.participants.includes(uid2)) {
      return docSnap.id;
    }
  }

  // Sinon, créer un nouveau chat
  const chat = new Chat({
    id: null,
    participants: [uid1, uid2],
    lastMessage: '',
    updatedAt: serverTimestamp()
  });

  const newDocRef = await addDoc(chatsRef, chat.toJson());
  return newDocRef.id;
};

/**
 * Envoie un message dans un chat donné
 */
export const sendMessage = async (chatId, senderId, text) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');

  const message = new Message({
    id: null,
    senderId,
    text,
    timestamp: serverTimestamp()
  });

  await addDoc(messagesRef, message.toJson());

  // Met à jour le chat avec le dernier message
  const chatRef = doc(db, 'chats', chatId);
  await setDoc(chatRef, {
    lastMessage: text,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

/**
 * Récupère tous les messages d’un chat avec écoute en temps réel
 */
export const listenToMessages = (chatId, callback) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return new Message({
        id: doc.id,
        senderId: data.senderId,
        text: data.text,
        timestamp: data.timestamp
      });
    });
    callback(messages);
  });
};

/**
 * Récupère tous les chats auxquels un utilisateur participe
 */
export const getUserChats = async (uid) => {
  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, where('participants', 'array-contains', uid));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return new Chat({
      id: doc.id,
      participants: data.participants,
      lastMessage: data.lastMessage,
      updatedAt: data.updatedAt
    });
  });
};
