import React from 'react';
import { getAuth, onAuthStateChanged,  } from 'firebase/auth';
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
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, storage } from '../services/firebase';
import { decryptMessage, encryptMessage } from '../utils/encryption';

function generateConversationId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

function formatLastSeen(lastSeen) {
  if (!lastSeen) return 'Jamais vu';
  
  const date = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
  const now = new Date();
  const diff = now - date;
  const oneDay = 24 * 60 * 60 * 1000;
  const oneMinute = 60 * 1000;
  const oneHour = 60 * oneMinute;

  if (diff < oneMinute) {
    return 'vu à l\'instant';
  } else if (diff < oneHour) {
    const minutes = Math.floor(diff / oneMinute);
    return `vu il y a ${minutes} min`;
  } else if (diff < oneDay && now.getDate() === date.getDate()) {
    return `vu aujourd'hui à ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } else if (diff < 2 * oneDay && now.getDate() - date.getDate() === 1) {
    return `vu hier à ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } else {
    return `vu le ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth()+1).toString().padStart(2, '0')} à ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
}

function getLastMessagePreview(msg) {
  if (!msg) return 'Aucun message';
  if (msg.type === 'audio') return '🎤 Note vocale';
  if (msg.type === 'image') return '🖼️ Image';
  if (msg.type === 'file') return `📎 ${msg.fileName || 'Fichier'}`;
  try {
    return decryptMessage(msg.text);
  } catch {
    return '[Message]';
  }
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
        // On attend que le blob soit prêt avant d'envoyer
        setTimeout(() => {
          if (audioBlob) handleSendAudio();
        }, 300);
      }
    }
  };

  const filteredContacts = contacts.filter(contact =>
  contact.name.toLowerCase().includes(searchTerm.toLowerCase())
);

  // Écoute de l'état d'authentification
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
  }, []);

  // Gestion du statut en ligne de l'utilisateur actuel
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

    // Marquer comme en ligne au chargement
    updateUserStatus(true);

    // Marquer comme hors ligne avant fermeture
    const handleBeforeUnload = () => {
      updateUserStatus(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateUserStatus(false);
    };
  }, [currentUser]);

  // Charger tous les utilisateurs sauf celui connecté
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

        // Get other participants UIDs (contacts)
        const contactsUids = conversationsData.map(conv => conv.participants.find(uid => uid !== currentUser.uid));

        // Load contacts data
        const contactsPromises = contactsUids.map(async (uid) => {
          const userDoc = await getDoc(doc(db, 'users', uid));
          return userDoc.exists() ? userDoc.data() : null;
        });

        const contactsList = (await Promise.all(contactsPromises)).filter(Boolean);

        setContacts(contactsList);

        // Optionally, fetch last messages for each conversation
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
  // Récupérer les derniers messages pour chaque contact
  useEffect(() => {
    if (!currentUser || !contacts.length) return;

    const unsubscribes = [];
    const lastMsgsTemp = {};

    contacts.forEach(contact => {
      const conversationId = generateConversationId(currentUser.uid, contact.uid);
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      
      // Récupérer le dernier message de chaque conversation
      const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const lastMessage = snapshot.docs[0].data();
          lastMsgsTemp[contact.uid] = lastMessage;
          console.log(`[LastMessage] Dernier message pour ${contact.name}:`, lastMessage);
        } else {
          // Aucun message dans cette conversation
          lastMsgsTemp[contact.uid] = null;
        }
        
        // Mettre à jour l'état avec tous les derniers messages
        setLastMessages({...lastMsgsTemp});
      }, (error) => {
        console.error('[LastMessage] Erreur récupération dernier message:', error);
      });

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [currentUser, contacts]);

  // Écouter les messages non lus pour tous les contacts
  useEffect(() => {
    if (!currentUser || !contacts.length) return;

    const unsubscribes = [];
    const countsTemp = {};

    contacts.forEach(contact => {
      const conversationId = generateConversationId(currentUser.uid, contact.uid);
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      
      // Compter les messages non lus (envoyés par le contact et pas encore lus)
      const q = query(
        messagesRef,
        where('senderId', '==', contact.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        // Filtrer côté client les messages non lus
        const unreadMessages = snapshot.docs.filter(doc => {
          const data = doc.data();
          const readBy = data.readBy || [];
          return !readBy.includes(currentUser.uid);
        });
        
        countsTemp[contact.uid] = unreadMessages.length;
        setUnreadCounts({...countsTemp});
      });

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [currentUser, contacts]);

  // Marquer les messages comme lus quand on sélectionne une conversation
  const markMessagesAsRead = async (contactUid) => {
    if (!currentUser) return;

    const conversationId = generateConversationId(currentUser.uid, contactUid);
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    
    // Récupérer tous les messages de ce contact
    const q = query(
      messagesRef,
      where('senderId', '==', contactUid)
    );

    try {
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach(docSnapshot => {
        const messageData = docSnapshot.data();
        const currentReadBy = messageData.readBy || [];
        
        // Ajouter l'utilisateur actuel à la liste des lecteurs s'il n'y est pas déjà
        if (!currentReadBy.includes(currentUser.uid)) {
          const messageRef = doc(db, 'conversations', conversationId, 'messages', docSnapshot.id);
          batch.update(messageRef, {
            readBy: [...currentReadBy, currentUser.uid],
            readAt: serverTimestamp()
          });
        }
      });

      if (!snapshot.empty) {
        await batch.commit();
      }
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
    if (foundContact) {
      setSelectedContact(foundContact);
    }
  }, [conversationIdFromUrl, currentUser, contacts]);

  // Gestion de la conversation sélectionnée avec marquage de lecture
  useEffect(() => {
    if (!selectedContact || !currentUser) return;

    // Marquer les messages comme lus
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

      // Marquer automatiquement les nouveaux messages comme lus
      markMessagesAsRead(selectedContact.uid);
    });

    return () => unsubscribe();
  }, [selectedContact, currentUser]);

  // Écoute le statut du contact sélectionné
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

      // Audit
      const token = await currentUser.getIdToken();
      await fetch('http://localhost:3000/api/messages/log', {
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
      const audioRef = ref(storage, `audioMessages/${conversationId}/${filename}`);

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
      await fetch('http://localhost:3000/api/messages/log', {
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
    const storageRef = ref(storage,`images/${conversationId}/image_${Date.now()}_${imageFile.name}`);

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
      await fetch('http://localhost:3000/api/messages/log', {
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
    const storageRef = ref(
      storage,
      `files/${conversationId}/file_${Date.now()}_${file.name}`
    );

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
      await fetch('http://localhost:3000/api/messages/log', {
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

  // Fonction pour obtenir le statut de lecture d'un message
  const getReadStatus = (msg) => {
    if (msg.senderId !== currentUser.uid) return null; // Pas nos messages
    
    const readBy = msg.readBy || [];
    const deliveredTo = msg.deliveredTo || [];
    
    if (readBy.includes(selectedContact?.uid)) {
      return '✓✓'; // Lu (double check bleu)
    } else if (deliveredTo.includes(selectedContact?.uid)) {
      return '✓✓'; // Livré (double check gris)
    } else {
      return '✓'; // Envoyé (simple check)
    }
  };

  // Affichage de chargement
  if (currentUser === null) {
    return <p style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Chargement...</p>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#1a1a1a', color: '#fff' }}>
      <div style={{ width: 250, backgroundColor: '#2a2a2a', borderRight: '1px solid #3a3a3a' }}>

        <div style={{ padding: 16, borderBottom: '1px solid #3a3a3a' }}>
  {/* Boutons de navigation */}
  <div style={{ display: 'flex', marginBottom: 12, gap: 8 }}>
    <button onClick={() => navigate('/contacts')}>Contacts</button>
    <button onClick={() => navigate('/profile')}>Profile</button>
  </div>
  
</div>
        <div style={{ padding: 16, borderBottom: '1px solid #3a3a3a' }}>

          
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: 8,
              borderRadius: 8,
              backgroundColor: '#3a3a3a',
              border: 'none',
              color: '#fff',
              outline: 'none'
            }}
          />
        </div>
        <div style={{ overflowY: 'auto' }}>
          {filteredContacts.map(contact => (
            <div
              key={contact.uid}
              onClick={() => {
  setSelectedContact(contact);
  const conversationId = generateConversationId(currentUser.uid, contact.uid);
  navigate(`/chat/${conversationId}`);
}}
              style={{
                padding: 12,
                borderBottom: '1px solid #353535',
                backgroundColor: selectedContact?.uid === contact.uid ? '#404040' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img
                  src={contact.profileUrl || contact.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                  alt={contact.name}
                  style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 8 }}
                />
                <div>
                  <span>{contact.name}</span>
                  <div style={{ fontSize: 12, color: '#aaa', marginTop: 2, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getLastMessagePreview(lastMessages[contact.uid])}
                  </div>
                </div>
              </div>
              
              {/* Badge de messages non lus */}
              {unreadCounts[contact.uid] > 0 && (
                <div style={{
                  backgroundColor: '#007AFF',
                  color: 'white',
                  borderRadius: '50%',
                  minWidth: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 'bold'
                }}>
                  {unreadCounts[contact.uid]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #3a3a3a', backgroundColor: '#2a2a2a' }}>
          <span>{selectedContact ? selectedContact.name : 'Sélectionne un contact'}</span>
          {selectedContact && selectedContactStatus && (
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
              {selectedContactStatus.online
                ? <span style={{ color: '#4CAF50' }}>En ligne</span>
                : formatLastSeen(selectedContactStatus.lastSeen)}
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {!selectedContact && (
            <p style={{ textAlign: 'center', color: '#888' }}>Sélectionne un contact pour discuter</p>
          )}
          {messages.map((msg, index) => {
            const isOwn = msg.senderId === currentUser.uid;

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  marginBottom: 8
                }}
              >
                <div
                  style={{
                    backgroundColor: isOwn ? '#007AFF' : '#3a3a3a',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: 16,
                    maxWidth: '60%',
                    position: 'relative'
                  }}
                >
                  {/* Message audio */}
                  {msg.type === 'audio' && msg.audio && (
                    <audio controls style={{ maxWidth: '100%' }}>
                      <source src={msg.audio} type="audio/webm" />
                      Ton navigateur ne supporte pas l'audio.
                    </audio>
                  )}

                  {/* Message image */}
                  {msg.type === 'image' && msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="image"
                      style={{ maxWidth: '100%', borderRadius: 12, marginTop: 6 }}
                    />
                  )}

                  {/* Fichier */}
                  {msg.type === 'file' && msg.file && (
                    <div>
                      <a href={msg.file} target="_blank" rel="noopener noreferrer" style={{ color: 'white' }}>
                        📎 {msg.fileName || 'Fichier'}
                      </a>
                    </div>
                  )}

                  {/* Message texte */}
                  {!msg.type || msg.type === 'text' ? (
                    <div>
                      {(() => {
                        try {
                          return decryptMessage(msg.text);
                        } catch {
                          return '[Message illisible]';
                        }
                      })()}
                      
                      {/* Statut de lecture pour nos messages */}
                      {isOwn && (
                        <div style={{
                          fontSize: 10,
                          color: (msg.readBy || []).includes(selectedContact?.uid) ? '#4FC3F7' : '#888',
                          textAlign: 'right',
                          marginTop: 4
                        }}>
                          {getReadStatus(msg)}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Statut pour les autres types de messages */
                    isOwn && (
                      <div style={{
                        fontSize: 10,
                        color: (msg.readBy || []).includes(selectedContact?.uid) ? '#4FC3F7' : '#888',
                        textAlign: 'right',
                        marginTop: 4
                      }}>
                        {getReadStatus(msg)}
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {selectedContact && (
          <div style={{ padding: 16, borderTop: '1px solid #3a3a3a', backgroundColor: '#2a2a2a', display: 'flex', alignItems: 'center', position: 'relative' }}>
            {/* Bouton + pour ouvrir le menu d'options */}
            <div style={{ position: 'relative', marginRight: 8 }}>
              <button
                onClick={() => setShowAttachMenu(v => !v)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: 24,
                  cursor: 'pointer',
                  padding: 4
                }}
                title="Joindre"
                type="button"
              >
                +
              </button>
              {showAttachMenu && (
                <div style={{
                  position: 'absolute',
                  bottom: 40,
                  left: 0,
                  background: '#222',
                  borderRadius: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  zIndex: 10,
                  padding: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  {/* Image */}
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span role="img" aria-label="image" style={{ fontSize: 20 }}>🖼️</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        setImageFile(e.target.files[0]);
                        setShowAttachMenu(false);
                      }}
                      style={{ display: 'none' }}
                    />
                    <span style={{ color: '#fff', fontSize: 14 }}>Image</span>
                  </label>
                  {/* Fichier */}
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span role="img" aria-label="fichier" style={{ fontSize: 20 }}>📎</span>
                    <input
                      type="file"
                      onChange={(e) => {
                        handleSendFile(e);
                        setShowAttachMenu(false);
                      }}
                      style={{ display: 'none' }}
                      ref={fileInputRef}
                    />
                    <span style={{ color: '#fff', fontSize: 14 }}>Fichier</span>
                  </label>
                </div>
              )}
            </div>

            {/* Champ de texte */}
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Tape ton message..."
              style={{
                flex: 1,
                padding: 8,
                borderRadius: 20,
                backgroundColor: '#3a3a3a',
                border: 'none',
                color: '#fff'
              }}
            />

            {/* Bouton envoyer */}
            <button
              onClick={handleSendMessage}
              style={{
                marginLeft: 8,
                padding: '8px 12px',
                borderRadius: '50%',
                backgroundColor: '#007AFF',
                color: '#fff',
                border: 'none',
                fontSize: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Envoyer"
              type="button"
            >
              📤
            </button>

            {/* Bouton micro pour audio */}
            <button
              onMouseDown={() => {
                pressStart.current = Date.now();
                pressTimer.current = setTimeout(() => {
                  // Si on maintient >400ms, on démarre l'enregistrement
                  startAudioRecording();
                }, 400);
              }}
              onMouseUp={() => {
                clearTimeout(pressTimer.current);
                const duration = Date.now() - pressStart.current;
                if (duration < 400) {
                  // Clic rapide : démarrer l'enregistrement (mode WhatsApp)
                  startAudioRecording();
                } else if (recording) {
                  // Maintien : arrêter et envoyer direct
                  stopAudioRecording(true);
                }
              }}
              onMouseLeave={() => {
                clearTimeout(pressTimer.current);
                if (recording) {
                  stopAudioRecording(true);
                }
              }}
              style={{
                marginLeft: 8,
                padding: '8px 12px',
                borderRadius: '50%',
                backgroundColor: recording ? '#FF3B30' : '#34C759',
                color: '#fff',
                border: 'none',
                fontSize: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title={recording ? "Relâche pour arrêter" : "Maintenir pour enregistrer"}
              type="button"
            >
              🎤
            </button>

            {/* Si un audio est prêt à être envoyé */}
            {audioBlob && (
              <button
                onClick={handleSendAudio}
                style={{
                  marginLeft: 8,
                  padding: '8px 12px',
                  borderRadius: '50%',
                  backgroundColor: '#FFA500',
                  color: '#fff',
                  border: 'none',
                  fontSize: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Envoyer l'audio"
                type="button"
              >
                🔊
              </button>
            )}

            {/* Bouton envoyer image si une image est sélectionnée */}
            {imageFile && (
              <button
                onClick={handleSendImage}
                style={{
                  marginLeft: 8,
                  padding: '8px 12px',
                  borderRadius: '50%',
                  backgroundColor: '#28a745',
                  color: '#fff',
                  border: 'none',
                  fontSize: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title="Envoyer l'image"
                type="button"
              >
                🖼️
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;