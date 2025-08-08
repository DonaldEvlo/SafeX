import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../services/firebase';
import { decryptMessage, encryptMessage } from '../utils/encryption';

function generateConversationId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

function formatMessageTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffInDays === 0) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } else if (diffInDays === 1) {
    return `Hier ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffInDays < 7) {
    return date.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
}

function formatLastSeen(lastSeen) {
  if (!lastSeen) return 'Jamais vu';
  const date = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
  const now = new Date();
  const diff = now - date;
  const oneDay = 24 * 60 * 60 * 1000;
  const oneMinute = 60 * 1000;
  const oneHour = 60 * oneMinute;
  if (diff < oneMinute) return "vu à l'instant";
  else if (diff < oneHour) return `vu il y a ${Math.floor(diff / oneMinute)} min`;
  else if (diff < oneDay && now.getDate() === date.getDate()) return `vu aujourd'hui à ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  else if (diff < 2 * oneDay && now.getDate() - date.getDate() === 1) return `vu hier à ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  else return `vu le ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')} à ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function getLastMessagePreview(msg) {
  if (!msg) return 'Aucun message';
  if (msg.type === 'audio') return 'Note vocale';
  if (msg.type === 'image') return 'Image';
  if (msg.type === 'file') return `${msg.fileName || 'Fichier'}`;
  try {
    return decryptMessage(msg.text);
  } catch {
    return '[Message]';
  }
}

function formatLastMessageTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  if (diffInMinutes < 1) return 'maintenant';
  else if (diffInMinutes < 60) return `${diffInMinutes}m`;
  else if (diffInHours < 24 && now.getDate() === date.getDate()) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  else if (diffInDays === 1) return 'hier';
  else if (diffInDays < 7) return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  else return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

const Chat = () => {
  const auth = getAuth();
  const navigate = useNavigate();
  const { id: conversationIdFromUrl } = useParams();
  const [currentUser, setCurrentUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [selectedContactStatus, setSelectedContactStatus] = useState(null);
  const [lastMessages, setLastMessages] = useState({});
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const pressTimer = useRef(null);
  const pressStart = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastMessageTimestamps, setLastMessageTimestamps] = useState({});
  const messagesEndRef = useRef(null);

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new window.MediaRecorder(stream);
      setMediaRecorder(recorder);
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };
      recorder.start();
      setRecording(true);
    } catch (err) {
      setRecording(false);
      alert("Impossible d'accéder au micro.");
    }
  };

  const stopAudioRecording = (autoSend = false) => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setRecording(false);
      if (autoSend) {
        setTimeout(() => {
          if (audioBlob) handleSendAudio();
        }, 300);
      }
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('[Auth] Utilisateur détecté:', user.uid);
        setCurrentUser(user);
      } else {
        console.log('[Auth] Utilisateur non connecté');
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!currentUser) return;
    const updateUserStatus = async (online) => {
      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          online: online,
          lastSeen: serverTimestamp()
        });
        console.log('[Status] Statut mis à jour:', online ? 'en ligne' : 'hors ligne');
      } catch (error) {
        console.error('[Status] Erreur mise à jour statut:', error);
      }
    };
    updateUserStatus(true);
    const handleBeforeUnload = () => updateUserStatus(false);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateUserStatus(false);
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchConversationsAndContacts = async () => {
      try {
        const conversationsCol = collection(db, 'conversations');
        const q = query(conversationsCol, where('participants', 'array-contains', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const conversationsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        const contactsUids = conversationsData.map(conv => conv.participants.find(uid => uid !== currentUser.uid));
        const contactsPromises = contactsUids.map(async (uid) => {
          const userDoc = await getDoc(doc(db, 'users', uid));
          return userDoc.exists() ? userDoc.data() : null;
        });
        const contactsList = (await Promise.all(contactsPromises)).filter(Boolean);
        setContacts(contactsList);
        const lastMsgsTemp = {};
        conversationsData.forEach(conv => {
          const messagesRef = collection(db, 'conversations', conv.id, 'messages');
          const lastMsgQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
          onSnapshot(lastMsgQuery, (snapshot) => {
            if (!snapshot.empty) {
              lastMsgsTemp[conv.id] = snapshot.docs[0].data();
              setLastMessages(prev => ({ ...prev, [conv.id]: lastMsgsTemp[conv.id] }));
            } else {
              setLastMessages(prev => ({ ...prev, [conv.id]: null }));
            }
          });
        });
      } catch (error) {
        console.error('[Conversations] Error loading:', error);
      }
    };
    fetchConversationsAndContacts();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !contacts.length) return;
    const unsubscribes = [];
    const lastMsgsTemp = {};
    const timestampsTemp = {};
    contacts.forEach(contact => {
      const conversationId = generateConversationId(currentUser.uid, contact.uid);
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const lastMessage = snapshot.docs[0].data();
          lastMsgsTemp[contact.uid] = lastMessage;
          timestampsTemp[contact.uid] = lastMessage.timestamp;
        } else {
          lastMsgsTemp[contact.uid] = null;
          timestampsTemp[contact.uid] = null;
        }
        setLastMessages({ ...lastMsgsTemp });
        setLastMessageTimestamps({ ...timestampsTemp });
      }, (error) => {
        console.error('[LastMessage] Erreur récupération dernier message:', error);
      });
      unsubscribes.push(unsubscribe);
    });
    return () => unsubscribes.forEach(unsub => unsub());
  }, [currentUser, contacts]);

  useEffect(() => {
    if (!currentUser || !contacts.length) return;
    const unsubscribes = [];
    const countsTemp = {};
    contacts.forEach(contact => {
      const conversationId = generateConversationId(currentUser.uid, contact.uid);
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const q = query(messagesRef, where('senderId', '==', contact.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const unreadMessages = snapshot.docs.filter(doc => {
          const data = doc.data();
          const readBy = data.readBy || [];
          return !readBy.includes(currentUser.uid);
        });
        countsTemp[contact.uid] = unreadMessages.length;
        setUnreadCounts({ ...countsTemp });
      });
      unsubscribes.push(unsubscribe);
    });
    return () => unsubscribes.forEach(unsub => unsub());
  }, [currentUser, contacts]);

  const markMessagesAsRead = async (contactUid) => {
    if (!currentUser) return;
    const conversationId = generateConversationId(currentUser.uid, contactUid);
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, where('senderId', '==', contactUid));
    try {
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach(docSnapshot => {
        const messageData = docSnapshot.data();
        const currentReadBy = messageData.readBy || [];
        if (!currentReadBy.includes(currentUser.uid)) {
          const messageRef = doc(db, 'conversations', conversationId, 'messages', docSnapshot.id);
          batch.update(messageRef, {
            readBy: [...currentReadBy, currentUser.uid],
            readAt: serverTimestamp()
          });
        }
      });
      if (!snapshot.empty) await batch.commit();
    } catch (error) {
      console.error('[Chat] Erreur marquage messages lus:', error);
    }
  };

  useEffect(() => {
    if (!currentUser || !contacts.length || !conversationIdFromUrl) return;
    const parts = conversationIdFromUrl.split('_');
    if (parts.length !== 2) return;
    const [uid1, uid2] = parts;
    if (![uid1, uid2].includes(currentUser.uid)) return;
    const otherUid = uid1 === currentUser.uid ? uid2 : uid1;
    const foundContact = contacts.find(c => c.uid === otherUid);
    if (foundContact) setSelectedContact(foundContact);
  }, [conversationIdFromUrl, currentUser, contacts]);

  useEffect(() => {
    if (!selectedContact || !currentUser) return;
    markMessagesAsRead(selectedContact.uid);
    const conversationId = generateConversationId(currentUser.uid, selectedContact.uid);
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      markMessagesAsRead(selectedContact.uid);
    });
    return () => unsubscribe();
  }, [selectedContact, currentUser]);

  useEffect(() => {
    if (!selectedContact) return;
    const userRef = doc(db, 'users', selectedContact.uid);
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        console.log('[ContactStatus] Statut contact:', userData);
        setSelectedContactStatus(userData);
      } else {
        console.log('[ContactStatus] Document utilisateur introuvable:', selectedContact.uid);
      }
    }, (error) => {
      console.error('[ContactStatus] Erreur écoute statut:', error);
    });
    return () => unsub();
  }, [selectedContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && selectedContact) {
        setSelectedContact(null);
        setMessages([]);
        navigate('/chat', { replace: true });
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [selectedContact, navigate]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedContact || !currentUser) return;
    const conversationId = generateConversationId(currentUser.uid, selectedContact.uid);
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    try {
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'You',
        text: encryptMessage(message.trim()),
        timestamp: serverTimestamp(),
        readBy: [currentUser.uid],
        deliveredTo: []
      });
      setMessage('');
      const token = await currentUser.getIdToken();
      await fetch('http://localhost:5000/api/messages/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          senderId: currentUser.uid,
          recipientId: selectedContact.uid,
          text: "Message"
        })
      });
    } catch (error) {
      console.error('[Chat] Erreur envoi message:', error);
    }
  };

  const handleSendAudio = async () => {
    if (!audioBlob || !selectedContact || !currentUser) return;
    try {
      const conversationId = generateConversationId(currentUser.uid, selectedContact.uid);
      const filename = `audio_${Date.now()}.webm`;
      const audioRef = ref(getStorage(), `audioMessages/${conversationId}/${filename}`);
      await uploadBytes(audioRef, audioBlob);
      const audioURL = await getDownloadURL(audioRef);
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'You',
        audio: audioURL,
        type: 'audio',
        timestamp: serverTimestamp(),
        readBy: [currentUser.uid],
        deliveredTo: []
      });
      const token = await currentUser.getIdToken();
      await fetch('http://localhost:5000/api/messages/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          senderId: currentUser.uid,
          recipientId: selectedContact.uid,
          type: 'audio',
          text: '[Audio]'
        })
      });
      setAudioBlob(null);
    } catch (error) {
      console.error('[Chat] Erreur envoi audio via Storage:', error);
    }
  };

  const handleSendImage = async () => {
    if (!imageFile || !selectedContact || !currentUser) return;
    const storage = getStorage();
    const conversationId = generateConversationId(currentUser.uid, selectedContact.uid);
    const fileName = `image_${Date.now()}_${imageFile.name}`;
    const storageRef = ref(storage, `images/${conversationId}/${fileName}`);
    try {
      await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(storageRef);
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'You',
        imageUrl: imageUrl,
        type: 'image',
        timestamp: serverTimestamp(),
        readBy: [currentUser.uid],
        deliveredTo: []
      });
      const token = await currentUser.getIdToken();
      await fetch('http://localhost:5000/api/messages/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          senderId: currentUser.uid,
          recipientId: selectedContact.uid,
          type: 'image',
          text: '[Image]'
        })
      });
      setImageFile(null);
    } catch (err) {
      console.error('[Chat] Erreur envoi image:', err);
    }
  };

  const handleSendFile = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedContact || !currentUser) return;
    const conversationId = generateConversationId(currentUser.uid, selectedContact.uid);
    const storageRef = ref(getStorage(), `files/${conversationId}/file_${Date.now()}_${file.name}`);
    try {
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'You',
        file: fileUrl,
        fileName: file.name,
        fileType: file.type,
        type: 'file',
        timestamp: serverTimestamp(),
        readBy: [currentUser.uid],
        deliveredTo: []
      });
      const token = await currentUser.getIdToken();
      await fetch('http://localhost:5000/api/messages/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          senderId: currentUser.uid,
          recipientId: selectedContact.uid,
          type: 'file',
          text: `[Fichier] ${file.name}`
        })
      });
    } catch (error) {
      console.error('[Chat] Erreur envoi fichier:', error);
    }
  };

  const getReadStatus = (msg) => {
    if (msg.senderId !== currentUser.uid) return null;
    const readBy = msg.readBy || [];
    const deliveredTo = msg.deliveredTo || [];
    if (readBy.includes(selectedContact?.uid)) return '✓✓';
    else if (deliveredTo.includes(selectedContact?.uid)) return '✓✓';
    else return '✓';
  };

  if (currentUser === null) {
    return (
      <p style={{ color: '#ffffff', textAlign: 'center', marginTop: '50px', fontFamily: 'Arial, sans-serif' }}>
        Chargement...
      </p>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0.7); }
            70% { box-shadow: 0 0 0 8px rgba(0, 122, 255, 0); }
            100% { box-shadow: 0 0 0 0 rgba(0, 122, 255, 0); }
          }
          @keyframes bounce {
            0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
            40%, 43% { transform: translateY(-8px); }
            70% { transform: translateY(-4px); }
            90% { transform: translateY(-2px); }
          }
          @keyframes glow {
            0% { filter: brightness(1); }
            50% { filter: brightness(1.2); }
            100% { filter: brightness(1); }
          }
        `}
      </style>
      <div style={{
        display: 'flex',
        height: '100vh',
        minHeight: '100vh',
        backgroundColor: '#181d23',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif'
      }}>
        {/* Sidebar */}
        <div style={{
          width: '280px',
          background: 'linear-gradient(180deg, #1f2937, #181d23)',
          borderRight: '1px solid #2a313c',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #2a313c',
            background: 'linear-gradient(135deg, #232b35, #181d23)'
          }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <button
                onClick={() => navigate('/contacts')}
                style={{
                  flex: '1',
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                Contacts
              </button>
              <button
                onClick={() => navigate('/profile')}
                style={{
                  flex: '1',
                  padding: '10px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #4ecdc4, #44a08d)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                Profil
              </button>
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '12px',
                backgroundColor: '#2d333c',
                border: '1px solid #2a313c',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007AFF'}
              onBlur={(e) => e.target.style.borderColor = '#2a313c'}
            />
          </div>
          <div style={{ flex: '1', overflowY: 'auto' }}>
            {filteredContacts
              .sort((a, b) => {
                const timestampA = lastMessageTimestamps[a.uid];
                const timestampB = lastMessageTimestamps[b.uid];
                if (!timestampA && !timestampB) return 0;
                if (!timestampA) return 1;
                if (!timestampB) return -1;
                const dateA = timestampA.toDate ? timestampA.toDate() : new Date(timestampA);
                const dateB = timestampB.toDate ? timestampB.toDate() : new Date(timestampB);
                return dateB - dateA;
              })
              .map(contact => (
                <div
                  key={contact.uid}
                  onClick={() => {
                    setSelectedContact(contact);
                    const conversationId = generateConversationId(currentUser.uid, contact.uid);
                    navigate(`/chat/${conversationId}`);
                  }}
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid #2a313c',
                    backgroundColor: selectedContact?.uid === contact.uid ? '#232b35' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.2s, transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#232b35'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = selectedContact?.uid === contact.uid ? '#232b35' : 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', flex: '1', minWidth: '0' }}>
                    <img
                      src={contact.profileUrl || contact.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                      alt={contact.name}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        marginRight: '12px',
                        flexShrink: '0',
                        objectFit: 'cover',
                        border: '2px solid #007AFF4d'
                      }}
                    />
                    <div style={{ flex: '1', minWidth: '0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{
                          fontWeight: unreadCounts[contact.uid] > 0 ? '600' : '500',
                          fontSize: '15px',
                          color: unreadCounts[contact.uid] > 0 ? '#ffffff' : '#e5e7eb'
                        }}>
                          {contact.name}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          color: '#9caaba',
                          flexShrink: '0',
                          marginLeft: '12px'
                        }}>
                          {formatLastMessageTime(lastMessageTimestamps[contact.uid])}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: unreadCounts[contact.uid] > 0 ? '#ffffff' : '#9caaba',
                        marginTop: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: unreadCounts[contact.uid] > 0 ? '500' : '400'
                      }}>
                        {getLastMessagePreview(lastMessages[contact.uid])}
                      </div>
                    </div>
                  </div>
                  {unreadCounts[contact.uid] > 0 && (
                    <div style={{
                      backgroundColor: '#007AFF',
                      color: '#ffffff',
                      borderRadius: '50%',
                      minWidth: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginLeft: '12px',
                      flexShrink: '0',
                      boxShadow: '0 0 8px rgba(0,122,255,0.5)',
                      animation: 'pulse 1.5s infinite'
                    }}>
                      {unreadCounts[contact.uid]}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #2a313c',
            background: 'linear-gradient(135deg, #232b35, #181d23)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {selectedContact && (
              <button
                onClick={() => {
                  setSelectedContact(null);
                  setMessages([]);
                  navigate('/chat', { replace: true });
                }}
                style={{
                  background: 'linear-gradient(135deg, #ff4757, #ff3742)',
                  border: 'none',
                  color: '#ffffff',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                title="Retour"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <span style={{ fontSize: '18px', fontWeight: '600' }}>
                {selectedContact ? selectedContact.name : 'Sélectionne un contact'}
              </span>
              {selectedContact && selectedContactStatus && (
                <div style={{ fontSize: '13px', color: '#9caaba', marginTop: '6px' }}>
                  {selectedContactStatus.online ? (
                    <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <circle cx="5" cy="5" r="5" fill="#16a34a" />
                      </svg>
                      En ligne
                    </span>
                  ) : (
                    formatLastSeen(selectedContactStatus.lastSeen)
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{
            flex: '1',
            overflowY: 'auto',
            padding: '20px',
            background: 'linear-gradient(180deg, #181d23, #0f1419)',
            minHeight: '0',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {!selectedContact && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#9caaba',
                gap: '16px'
              }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9caaba" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p style={{ fontSize: '16px', fontWeight: '500' }}>
                  Sélectionne un contact pour commencer une conversation
                </p>
              </div>
            )}
            {messages.map((msg, index) => {
              const isOwn = msg.senderId === currentUser.uid;
              const showTime = index === 0 ||
                (messages[index - 1] &&
                  Math.abs(new Date(msg.timestamp?.toDate ? msg.timestamp.toDate() : msg.timestamp) -
                    new Date(messages[index - 1].timestamp?.toDate ? messages[index - 1].timestamp.toDate() : messages[index - 1].timestamp)) > 300000);
              return (
                <div key={index}>
                  {showTime && (
                    <div style={{
                      textAlign: 'center',
                      margin: '20px 0 10px',
                      color: '#9caaba',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: '#232b35',
                      padding: '6px 12px',
                      borderRadius: '12px',
                      display: 'inline-block'
                    }}>
                      {formatMessageTime(msg.timestamp)}
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    marginBottom: '12px',
                    alignItems: 'flex-end',
                    gap: '8px'
                  }}>
                    {!isOwn && (
                      <img
                        src={selectedContact?.profileUrl || selectedContact?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                        alt={selectedContact?.name}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          marginRight: '8px',
                          marginBottom: '2px',
                          objectFit: 'cover',
                          border: '2px solid #007AFF4d'
                        }}
                      />
                    )}
                    <div style={{
                      background: isOwn ? 'linear-gradient(135deg, #007AFF, #0056CC)' : 'linear-gradient(135deg, #2d333c, #232b35)',
                      color: '#ffffff',
                      padding: '12px 16px',
                      borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      maxWidth: '70%',
                      minWidth: 'min-content',
                      wordBreak: 'break-word',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                      {msg.type === 'audio' && msg.audio && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                            <path d="M12 1v22M5 7l7 5-7 5V7zM19 7l-7 5 7 5V7z" />
                          </svg>
                          <audio controls style={{
                            maxWidth: '250px',
                            height: '40px',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.1)',
                            filter: 'none'
                          }}>
                            <source src={msg.audio} type="audio/webm" />
                            Ton navigateur ne supporte pas l'audio.
                          </audio>
                        </div>
                      )}
                      {msg.type === 'image' && msg.imageUrl && (
                        <div style={{
                          position: 'relative',
                          maxWidth: '300px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        >
                          <img
                            src={msg.imageUrl}
                            alt="image"
                            style={{
                              maxWidth: '100%',
                              maxHeight: '400px',
                              borderRadius: '12px',
                              display: 'block',
                              objectFit: 'cover'
                            }}
                          />
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'rgba(0,0,0,0.5)',
                            borderRadius: '8px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            color: '#ffffff'
                          }}>
                            Image
                          </div>
                        </div>
                      )}
                      {msg.type === 'file' && msg.file && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px',
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          border: '1px solid #2a313c'
                        }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <div>
                            <a
                              href={msg.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: '#ffffff',
                                textDecoration: 'none',
                                fontWeight: '500',
                                fontSize: '14px'
                              }}
                              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                            >
                              {msg.fileName || 'Fichier'}
                            </a>
                            <div style={{ fontSize: '12px', color: '#9caaba', marginTop: '4px' }}>
                              Cliquer pour ouvrir
                            </div>
                          </div>
                        </div>
                      )}
                      {(!msg.type || msg.type === 'text') && (
                        <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                          {(() => {
                            try {
                              return decryptMessage(msg.text);
                            } catch {
                              return '[Message illisible]';
                            }
                          })()}
                        </div>
                      )}
                      <div style={{
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.6)',
                        marginTop: '6px',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>
                          {msg.timestamp ?
                            new Date(msg.timestamp.toDate ? msg.timestamp.toDate() : msg.timestamp)
                              .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                        {isOwn && (
                          <span style={{
                            color: (msg.readBy || []).includes(selectedContact?.uid) ? '#4FC3F7' : 'rgba(255,255,255,0.4)',
                            fontSize: '12px'
                          }}>
                            {getReadStatus(msg)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {selectedContact && (
            <div style={{
              padding: '20px',
              borderTop: '1px solid #2a313c',
              background: 'linear-gradient(135deg, #232b35, #181d23)',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '12px',
              width: '100%',
              minWidth: '0',
              boxShadow: '0 -2px 4px rgba(0,0,0,0.2)'
            }}>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowAttachMenu(v => !v)}
                  style={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    border: 'none',
                    color: '#ffffff',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    animation: showAttachMenu ? 'pulse 1.5s infinite' : 'none'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  title="Joindre un fichier"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
                {showAttachMenu && (
                  <div style={{
                    position: 'absolute',
                    bottom: '60px',
                    left: '0',
                    background: 'linear-gradient(135deg, #2d333c, #232b35)',
                    borderRadius: '12px',
                    border: '1px solid #2a313c',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    zIndex: '10',
                    padding: '12px',
                    minWidth: '180px'
                  }}>
                    <label style={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '8px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          setImageFile(e.target.files[0]);
                          setShowAttachMenu(false);
                        }}
                        style={{ display: 'none' }}
                      />
                      <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>Photo</span>
                    </label>
                    <label style={{
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '8px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4ecdc4, #44a08d)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <input
                        type="file"
                        onChange={(e) => {
                          handleSendFile(e);
                          setShowAttachMenu(false);
                        }}
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                      />
                      <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500' }}>Document</span>
                    </label>
                  </div>
                )}
              </div>
              <div style={{
                flex: '1',
                position: 'relative',
                background: '#2d333c',
                borderRadius: '20px',
                border: '2px solid transparent',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}>
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Écris ton message..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '20px',
                    background: 'transparent',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'none'
                  }}
                  onFocus={(e) => e.target.parentElement.style.borderColor = '#007AFF'}
                  onBlur={(e) => e.target.parentElement.style.borderColor = 'transparent'}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  onMouseDown={() => {
                    pressStart.current = Date.now();
                    pressTimer.current = setTimeout(() => startAudioRecording(), 400);
                  }}
                  onMouseUp={() => {
                    clearTimeout(pressTimer.current);
                    const duration = Date.now() - pressStart.current;
                    if (duration < 400) startAudioRecording();
                    else if (recording) stopAudioRecording(true);
                  }}
                  onMouseLeave={() => {
                    clearTimeout(pressTimer.current);
                    if (recording) stopAudioRecording(true);
                  }}
                  style={{
                    background: recording
                      ? 'linear-gradient(135deg, #ff4757, #ff3742)'
                      : 'linear-gradient(135deg, #16a34a, #15803d)',
                    border: 'none',
                    color: '#ffffff',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    animation: recording ? 'pulse 1s infinite' : 'none'
                  }}
                  onMouseEnter={(e) => !recording && (e.target.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => !recording && (e.target.style.transform = 'scale(1)')}
                  title={recording ? "Relâche pour arrêter" : "Maintenir pour enregistrer"}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                    <path d="M12 1v6M12 17v6M9 4h6M9 20h6M6 7v10a6 6 0 0 0 12 0V7" />
                  </svg>
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  style={{
                    background: message.trim()
                      ? 'linear-gradient(135deg, #007AFF, #0056CC)'
                      : '#2a313c',
                    border: 'none',
                    color: '#ffffff',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    cursor: message.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: message.trim() ? '0 4px 12px rgba(0,122,255,0.4)' : 'none'
                  }}
                  onMouseEnter={(e) => message.trim() && (e.target.style.transform = 'scale(1.05)')}
                  onMouseLeave={(e) => message.trim() && (e.target.style.transform = 'scale(1)')}
                  title="Envoyer"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </button>
              </div>
              {audioBlob && (
                <button
                  onClick={handleSendAudio}
                  style={{
                    background: 'linear-gradient(135deg, #FFA500, #FF8C00)',
                    border: 'none',
                    color: '#ffffff',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                    right: '80px',
                    bottom: '20px',
                    boxShadow: '0 4px 16px rgba(255,165,0,0.4)',
                    animation: 'bounce 0.5s ease-in-out'
                  }}
                  title="Envoyer l'audio"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                    <path d="M12 1v6M12 17v6M9 4h6M9 20h6M6 7v10a6 6 0 0 0 12 0V7" />
                  </svg>
                </button>
              )}
              {imageFile && (
                <button
                  onClick={handleSendImage}
                  style={{
                    background: 'linear-gradient(135deg, #28a745, #20a036)',
                    border: 'none',
                    color: '#ffffff',
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                    right: '80px',
                    bottom: '20px',
                    boxShadow: '0 4px 16px rgba(40,167,69,0.4)',
                    animation: 'bounce 0.5s ease-in-out'
                  }}
                  title="Envoyer l'image"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Chat;