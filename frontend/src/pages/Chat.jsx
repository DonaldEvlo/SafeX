import { getAuth, onAuthStateChanged, } from 'firebase/auth';
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
import { db, storage } from '../services/firebase';
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
    // Aujourd'hui - afficher seulement l'heure
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffInDays === 1) {
    // Hier
    return `Hier ${date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  } else if (diffInDays < 7) {
    // Cette semaine
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } else {
    // Plus ancien
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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

function formatLastMessageTime(timestamp) {
  if (!timestamp) return '';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return 'maintenant';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (diffInHours < 24 && now.getDate() === date.getDate()) {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffInDays === 1) {
    return 'hier';
  } else if (diffInDays < 7) {
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit',
      month: '2-digit'
    });
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
  const [lastMessageTimestamps, setLastMessageTimestamps] = useState({});


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
  const timestampsTemp = {}; // AJOUTER CETTE LIGNE

  contacts.forEach(contact => {
    const conversationId = generateConversationId(currentUser.uid, contact.uid);
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    
    // Récupérer le dernier message de chaque conversation
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const lastMessage = snapshot.docs[0].data();
        lastMsgsTemp[contact.uid] = lastMessage;
        timestampsTemp[contact.uid] = lastMessage.timestamp; // AJOUTER CETTE LIGNE
        console.log(`[LastMessage] Dernier message pour ${contact.name}:`, lastMessage);
      } else {
        // Aucun message dans cette conversation
        lastMsgsTemp[contact.uid] = null;
        timestampsTemp[contact.uid] = null; // AJOUTER CETTE LIGNE
      }
      
      // Mettre à jour l'état avec tous les derniers messages
      setLastMessages({...lastMsgsTemp});
      setLastMessageTimestamps({...timestampsTemp}); // AJOUTER CETTE LIGNE
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
    <>
      <style>
        {`
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.7); }
            70% { box-shadow: 0 0 0 8px rgba(255, 71, 87, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0); }
          }
          @keyframes bounce {
            0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
            40%, 43% { transform: translateY(-8px); }
            70% { transform: translateY(-4px); }
            90% { transform: translateY(-2px); }
          }
        `}
      </style>
    <div style={{ display: 'flex', height: '100vh', minHeight: '100vh', backgroundColor: '#1a1a1a', color: '#fff' }}>
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
  {filteredContacts
    .sort((a, b) => {
      // Trier par timestamp du dernier message (plus récent en premier)
      const timestampA = lastMessageTimestamps[a.uid];
      const timestampB = lastMessageTimestamps[b.uid];
      
      if (!timestampA && !timestampB) return 0;
      if (!timestampA) return 1;
      if (!timestampB) return -1;
      
      const dateA = timestampA.toDate ? timestampA.toDate() : new Date(timestampA);
      const dateB = timestampB.toDate ? timestampB.toDate() : new Date(timestampB);
      
      return dateB - dateA; // Plus récent en premier
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
        padding: 12,
        borderBottom: '1px solid #353535',
        backgroundColor: selectedContact?.uid === contact.uid ? '#404040' : 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
        <img
          src={contact.profileUrl || contact.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'}
          alt={contact.name}
          style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 8, flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontWeight: unreadCounts[contact.uid] > 0 ? 'bold' : 'normal', fontSize: 14 }}>
              {contact.name}
            </span>
            <span style={{ 
              fontSize: 11, 
              color: '#888', 
              flexShrink: 0,
              marginLeft: 8
            }}>
              {formatLastMessageTime(lastMessageTimestamps[contact.uid])}
            </span>
          </div>
          <div style={{ 
            fontSize: 12, 
            color: unreadCounts[contact.uid] > 0 ? '#fff' : '#aaa', 
            marginTop: 2, 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            fontWeight: unreadCounts[contact.uid] > 0 ? '500' : 'normal'
          }}>
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
          fontWeight: 'bold',
          marginLeft: 8,
          flexShrink: 0
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

        <div style={{ 
  flex: 1, 
  overflowY: 'auto', 
  padding: '16px 20px', 
  width: '100%',
  minHeight: 0,
  backgroundColor: '#1a1a1a'
}}>
  {!selectedContact && (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100%',
      color: '#888' 
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
      <p>Sélectionne un contact pour commencer une conversation</p>
    </div>
  )}
  
  {messages.map((msg, index) => {
    const isOwn = msg.senderId === currentUser.uid;
    const showTime = index === 0 || 
      (messages[index - 1] && 
       Math.abs(new Date(msg.timestamp?.toDate ? msg.timestamp.toDate() : msg.timestamp) - 
                new Date(messages[index - 1].timestamp?.toDate ? messages[index - 1].timestamp.toDate() : messages[index - 1].timestamp)) > 300000); // 5 minutes

    return (
      <div key={index}>
        {/* Séparateur de temps si nécessaire */}
        {showTime && (
          <div style={{
            textAlign: 'center',
            margin: '20px 0 10px',
            color: '#666',
            fontSize: '12px'
          }}>
            {formatMessageTime(msg.timestamp)}
          </div>
        )}
        
        <div
          style={{
            display: 'flex',
            justifyContent: isOwn ? 'flex-end' : 'flex-start',
            marginBottom: '8px',
            alignItems: 'flex-end'
          }}
        >
          {/* Avatar pour les messages reçus */}
          {!isOwn && (
            <img
              src={selectedContact?.profileUrl || selectedContact?.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'}
              alt={selectedContact?.name}
              style={{ 
                width: '28px', 
                height: '28px', 
                borderRadius: '50%', 
                marginRight: '8px',
                marginBottom: '2px'
              }}
            />
          )}

          <div
            style={{
              backgroundColor: isOwn ? '#007AFF' : '#2d2d2d',
              color: '#fff',
              padding: '10px 14px',
              borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              position: 'relative',
              maxWidth: '70%',
              minWidth: 'min-content',
              wordWrap: 'break-word',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            {/* Message audio */}
            {msg.type === 'audio' && msg.audio && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '20px' }}>🎵</div>
                <audio controls style={{ 
                  maxWidth: '200px',
                  height: '32px'
                }}>
                  <source src={msg.audio} type="audio/webm" />
                  Ton navigateur ne supporte pas l'audio.
                </audio>
              </div>
            )}

            {/* Message image */}
            {msg.type === 'image' && msg.imageUrl && (
              <div>
                <img
                  src={msg.imageUrl}
                  alt="image"
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '300px',
                    borderRadius: '12px', 
                    display: 'block'
                  }}
                />
              </div>
            )}

            {/* Fichier */}
            {msg.type === 'file' && msg.file && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '24px' }}>📄</div>
                <div>
                  <a 
                    href={msg.file} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ 
                      color: 'white', 
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}
                  >
                    {msg.fileName || 'Fichier'}
                  </a>
                  <div style={{ fontSize: '11px', opacity: 0.7 }}>
                    Cliquer pour ouvrir
                  </div>
                </div>
              </div>
            )}

            {/* Message texte */}
            {(!msg.type || msg.type === 'text') && (
              <div>
                {(() => {
                  try {
                    return decryptMessage(msg.text);
                  } catch {
                    return '[Message illisible]';
                  }
                })()}
              </div>
            )}

            {/* Heure et statut de lecture */}
            <div style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.6)',
              marginTop: '4px',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>
                {msg.timestamp ? 
                  new Date(msg.timestamp.toDate ? msg.timestamp.toDate() : msg.timestamp)
                    .toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                  : ''}
              </span>
              {isOwn && (
                <span style={{
                  color: (msg.readBy || []).includes(selectedContact?.uid) ? '#4FC3F7' : 'rgba(255,255,255,0.4)'
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
</div>

       {selectedContact && (
  <div style={{ 
    padding: '16px 20px', 
    borderTop: '1px solid #3a3a3a', 
    backgroundColor: '#2a2a2a', 
    display: 'flex', 
    alignItems: 'flex-end', 
    gap: '12px',
    width: '100%',
    minWidth: 0
  }}>
    {/* Menu d'attachement amélioré */}
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowAttachMenu(v => !v)}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          color: '#fff',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
        }}
        title="Joindre un fichier"
        type="button"
      >
        +
      </button>
      
      {showAttachMenu && (
        <div style={{
          position: 'absolute',
          bottom: '50px',
          left: '0',
          background: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
          borderRadius: '12px',
          border: '1px solid #404040',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          zIndex: 10,
          padding: '8px',
          minWidth: '160px'
        }}>
          {/* Option Image */}
          <label style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '12px',
            borderRadius: '8px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}>
              🖼️
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
            <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>Photo</span>
          </label>
          
          {/* Option Fichier */}
          <label style={{ 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '12px',
            borderRadius: '8px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4ecdc4, #44a08d)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}>
              📎
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
            <span style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>Document</span>
          </label>
        </div>
      )}
    </div>

    {/* Input de message */}
    <div style={{ 
      flex: 1, 
      position: 'relative',
      backgroundColor: '#3a3a3a',
      borderRadius: '20px',
      border: '2px solid transparent',
      transition: 'border-color 0.2s ease'
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
          backgroundColor: 'transparent',
          border: 'none',
          color: '#fff',
          fontSize: '14px',
          outline: 'none',
          resize: 'none'
        }}
        onFocus={(e) => {
          e.target.parentElement.style.borderColor = '#007AFF';
        }}
        onBlur={(e) => {
          e.target.parentElement.style.borderColor = 'transparent';
        }}
      />
    </div>

    {/* Boutons d'action */}
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {/* Bouton micro */}
      <button
        onMouseDown={() => {
          pressStart.current = Date.now();
          pressTimer.current = setTimeout(() => {
            startAudioRecording();
          }, 400);
        }}
        onMouseUp={() => {
          clearTimeout(pressTimer.current);
          const duration = Date.now() - pressStart.current;
          if (duration < 400) {
            startAudioRecording();
          } else if (recording) {
            stopAudioRecording(true);
          }
        }}
        onMouseLeave={(e) => {
          clearTimeout(pressTimer.current);
          if (recording) {
            stopAudioRecording(true);
          }
        }}
        onMouseEnter={(e) => {
          if (!recording) e.target.style.transform = 'scale(1.05)';
        }}
        style={{
          background: recording 
            ? 'linear-gradient(135deg, #ff4757, #ff3742)' 
            : 'linear-gradient(135deg, #5cb85c, #449d44)',
          border: 'none',
          color: '#fff',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          animation: recording ? 'pulse 1s infinite' : 'none'
        }}
        title={recording ? "Relâche pour arrêter" : "Maintenir pour enregistrer"}
        type="button"
      >
        🎤
      </button>

      {/* Bouton envoyer */}
      <button
        onClick={handleSendMessage}
        disabled={!message.trim()}
        style={{
          background: message.trim() 
            ? 'linear-gradient(135deg, #007AFF, #0056CC)' 
            : '#666',
          border: 'none',
          color: '#fff',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          cursor: message.trim() ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          transition: 'all 0.2s ease',
          boxShadow: message.trim() ? '0 2px 8px rgba(0,122,255,0.3)' : 'none'
        }}
        onMouseEnter={(e) => {
          if (message.trim()) e.target.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          if (message.trim()) e.target.style.transform = 'scale(1)';
        }}
        title="Envoyer"
        type="button"
      >
        ➤
      </button>
    </div>

    {/* Boutons conditionnels pour audio et image */}
    {audioBlob && (
      <button
        onClick={handleSendAudio}
        style={{
          background: 'linear-gradient(135deg, #FFA500, #FF8C00)',
          border: 'none',
          color: '#fff',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          position: 'absolute',
          right: '70px',
          bottom: '16px',
          boxShadow: '0 4px 16px rgba(255,165,0,0.4)',
          animation: 'bounce 0.5s ease-in-out'
        }}
        title="Envoyer l'audio"
        type="button"
      >
        🔊
      </button>
    )}

    {imageFile && (
      <button
        onClick={handleSendImage}
        style={{
          background: 'linear-gradient(135deg, #28a745, #20a036)',
          border: 'none',
          color: '#fff',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          position: 'absolute',
          right: '70px',
          bottom: '16px',
          boxShadow: '0 4px 16px rgba(40,167,69,0.4)',
          animation: 'bounce 0.5s ease-in-out'
        }}
        title="Envoyer l'image"
        type="button"
      >
        📸
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