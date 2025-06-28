import React from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';
import {getStorage, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../services/firebase';
import { decryptMessage, encryptMessage } from '../utils/encryption';

function generateConversationId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

const Chat = () => {
  const auth = getAuth();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');

  const [recording, setRecording] = useState(false);
const [mediaRecorder, setMediaRecorder] = useState(null);
const [audioBlob, setAudioBlob] = useState(null);
const [imageFile, setImageFile] = useState(null);
const fileInputRef = useRef(null);



const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  setMediaRecorder(recorder);
  const chunks = [];

  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'audio/webm' });
    setAudioBlob(blob);
  };

  recorder.start();
  setRecording(true);
};

const stopRecording = () => {
  if (mediaRecorder) {
    mediaRecorder.stop();
    setRecording(false);
  }
};

  // Écoute de l’état d’authentification (corrige le bug de session perdue au refresh)
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

  // Charger tous les utilisateurs sauf celui connecté
  useEffect(() => {
    if (!currentUser) return;

    const fetchUsers = async () => {
      try {
        const usersCol = collection(db, 'users');
        const q = query(usersCol, where('uid', '!=', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const usersList = querySnapshot.docs.map(doc => doc.data());
        setContacts(usersList);
      } catch (error) {
        console.error('[Chat] Erreur chargement contacts:', error);
      }
    };

    fetchUsers();
  }, [currentUser]);

  // Gestion de la conversation sélectionnée
  useEffect(() => {
    if (!selectedContact || !currentUser) return;

    const conversationId = generateConversationId(currentUser.uid, selectedContact.uid);
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data());
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedContact, currentUser]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedContact || !currentUser) return;

    const conversationId = generateConversationId(currentUser.uid, selectedContact.uid);
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');

    try {
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'You',
        text: encryptMessage(message.trim()),
        timestamp: serverTimestamp()
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

  const handleLogout = async () => {
    try {
      const token = await currentUser.getIdToken();

      await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ token })
      });

      await fetch('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          action: 'Déconnexion',
          details: {
            browser: navigator.userAgent,
            localTime: new Date().toLocaleString()
          }
        })
      });

      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('[Chat] Erreur déconnexion:', error);
    }
  };

const handleSendAudio = async () => {
  if (!audioBlob || !selectedContact || !currentUser) return;

  try {
    const conversationId = generateConversationId(currentUser.uid, selectedContact.uid);
    const filename = `audio_${Date.now()}.webm`;
    const audioRef = ref(storage, `audioMessages/${conversationId}/${filename}`);

    // Upload vers Firebase Storage
    await uploadBytes(audioRef, audioBlob);

    // Récupère l'URL publique
    const audioURL = await getDownloadURL(audioRef);

    // Ajoute le message audio dans Firestore
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    await addDoc(messagesRef, {
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'You',
      audio: audioURL,
      type: 'audio',
      timestamp: serverTimestamp()
    });

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
    // Upload
    await uploadBytes(storageRef, imageFile);
    const imageUrl = await getDownloadURL(storageRef);

    // Enregistrement dans Firestore
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    await addDoc(messagesRef, {
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'You',
      imageUrl: imageUrl,
      type: 'image',
      timestamp: serverTimestamp()
    });

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
      timestamp: serverTimestamp()
    });

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
        type: 'file',
        text: `[Fichier] ${file.name}`
      })
    });
  } catch (error) {
    console.error('[Chat] Erreur envoi fichier:', error);
  }
};

  const styles = {
  chatContainer: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    fontFamily: 'sans-serif',
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#2a2a2a',
    borderRight: '1px solid #3a3a3a',
    display: 'flex',
    flexDirection: 'column',
  },
  contactList: {
    flex: 1,
    overflowY: 'auto',
  },
  contactItem: {
    padding: '12px',
    cursor: 'pointer',
    borderBottom: '1px solid #353535',
    display: 'flex',
    alignItems: 'center',
  },
  activeContact: {
    backgroundColor: '#404040',
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    marginRight: 12,
    objectFit: 'cover',
  },
  contactName: {
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  chatHeader: {
    padding: 16,
    borderBottom: '1px solid #3a3a3a',
    backgroundColor: '#2a2a2a',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  messageWrapper: {
    display: 'flex',
    alignItems: 'flex-end',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    padding: '8px 12px',
    borderRadius: 16,
    maxWidth: '60%',
    wordWrap: 'break-word',
  },
  ownBubble: {
    backgroundColor: '#007AFF',
    color: '#fff',
  },
  otherBubble: {
    backgroundColor: '#3a3a3a',
    color: '#fff',
  },
  messageInputContainer: {
    padding: 16,
    borderTop: '1px solid #3a3a3a',
    backgroundColor: '#2a2a2a',
    display: 'flex',
  },
  messageInput: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: 20,
    border: 'none',
    outline: 'none',
    fontSize: 16,
    backgroundColor: '#3a3a3a',
    color: '#fff',
  },
  sendButton: {
    marginLeft: 12,
    padding: '8px 16px',
    borderRadius: 20,
    backgroundColor: '#007AFF',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};


  // Affichage de chargement pendant que Firebase recharge la session
  if (currentUser === null) {
    return <p style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Chargement...</p>;
  }

  // Rendu UI
  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#1a1a1a', color: '#fff' }}>
      <div style={{ width: 250, backgroundColor: '#2a2a2a', borderRight: '1px solid #3a3a3a' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #3a3a3a' }}>
          <input
            type="text"
            placeholder="Rechercher..."
            style={{
              width: '100%',
              padding: 8,
              borderRadius: 8,
              backgroundColor: '#3a3a3a',
              border: 'none',
              color: '#fff'
            }}
          />
        </div>
        <div style={{ overflowY: 'auto' }}>
          {contacts.map(contact => (
            <div
              key={contact.uid}
              onClick={() => setSelectedContact(contact)}
              style={{
                padding: 12,
                borderBottom: '1px solid #353535',
                backgroundColor: selectedContact?.uid === contact.uid ? '#404040' : 'transparent',
                cursor: 'pointer'
              }}
            >
              <img
                src={contact.profileUrl || contact.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                alt={contact.name}
                style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 8 }}
              />
              <span>{contact.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #3a3a3a', backgroundColor: '#2a2a2a' }}>
          <span>{selectedContact ? selectedContact.name : 'Sélectionne un contact'}</span>
          <button onClick={handleLogout} style={{ float: 'right' }}>Déconnexion</button>
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
          maxWidth: '60%'
        }}
      >
        {/* Message audio */}
        {msg.type === 'audio' && msg.audio && (
          <audio controls style={{ maxWidth: '100%' }}>
            <source src={msg.audio} type="audio/webm" />
            Ton navigateur ne supporte pas l’audio.
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

      {/*Fichier */}
      {msg.type === 'file' && msg.file && (
  <div>
    <a href={msg.file} target="_blank" rel="noopener noreferrer" style={{ color: 'white' }}>
      📎 {msg.fileName || 'Fichier'}
    </a>
  </div>
)}

        {/* Message texte (avec déchiffrement sécurisé) */}
        {!msg.type || msg.type === 'text' ? (
          (() => {
            try {
              return decryptMessage(msg.text);
            } catch {
              return '[Message illisible]';
            }
          })()
        ) : null}

        

      </div>
    </div>
  );
})}

        </div>

        {selectedContact && (
          <div style={{ padding: 16, borderTop: '1px solid #3a3a3a', backgroundColor: '#2a2a2a', display: 'flex' }}>
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
            <button onClick={handleSendMessage} style={{
              marginLeft: 12,
              padding: '8px 16px',
              borderRadius: 20,
              backgroundColor: '#007AFF',
              color: '#fff',
              border: 'none'
            }}>
              Envoyer
            </button>

                {/* Enregistrement Audio */}
    <button
  onClick={recording ? stopRecording : startRecording}
  style={{
    marginLeft: 12,
    padding: '8px 16px',
    borderRadius: 20,
    backgroundColor: recording ? '#FF3B30' : '#34C759',
    color: '#fff',
    border: 'none',
    cursor: 'pointer'
  }}
>
  {recording ? 'Arrêter 🎙️' : 'Enregistrer 🎙️'}
</button>

{audioBlob && (
  <button
    onClick={handleSendAudio}
    style={{
      marginLeft: 12,
      padding: '8px 16px',
      borderRadius: 20,
      backgroundColor: '#FFA500',
      color: '#fff',
      border: 'none',
      cursor: 'pointer'
    }}
  >
    Envoyer l'audio 🔊
  </button>
)}

{/* Sélecteur de fichier image */}
  <input
    type="file"
    accept="image/*"
    onChange={(e) => setImageFile(e.target.files[0])}
    style={{ color: '#fff' }}
  />

  {/* Bouton envoyer image */}
  <button
    onClick={handleSendImage}
    style={{
      padding: '8px 16px',
      borderRadius: 20,
      backgroundColor: '#28a745',
      color: '#fff',
      border: 'none',
    }}
  >
    Envoyer image
  </button>

  <input
  type="file"
  onChange={handleSendFile}
  style={{ display: 'none' }}
  ref={fileInputRef}
/>
<button onClick={() => fileInputRef.current.click()}>
  📎 Fichier
</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
