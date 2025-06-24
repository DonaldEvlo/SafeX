import React from 'react';
import { getAuth, signOut } from 'firebase/auth';
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
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/firebase'; // Ton fichier firebase.js où tu exportes 'db'
import { decryptMessage, encryptMessage } from '../utils/encryption';

function generateConversationId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

const Chat = () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');

  // Charger tous les utilisateurs sauf celui connecté
  useEffect(() => {
    if (!currentUser) {
      console.log('[Chat] Aucun utilisateur connecté');
      return;
    }
    console.log('[Chat] Utilisateur connecté:', currentUser.uid);

    const fetchUsers = async () => {
      try {
        const usersCol = collection(db, 'users');
        const q = query(usersCol, where('uid', '!=', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const usersList = [];
        querySnapshot.forEach(doc => {
          usersList.push(doc.data());
        });
        console.log('[Chat] Utilisateurs récupérés:', usersList);
        setContacts(usersList);
      } catch (error) {
        console.error('[Chat] Erreur lors de la récupération des utilisateurs:', error);
      }
    };

    fetchUsers();
  }, [currentUser]);

  // Gestion de la conversation sélectionnée
  useEffect(() => {
    if (!selectedContact || !currentUser) {
      console.log('[Chat] Pas de contact sélectionné ou utilisateur non connecté');
      setMessages([]);
      return;
    }

    const conversationId = generateConversationId(currentUser.uid, selectedContact.uid);
    console.log('[Chat] Écoute messages pour conversation:', conversationId);

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach(doc => {
        msgs.push(doc.data());
      });
      console.log(`[Chat] Messages reçus pour ${conversationId} :`, msgs);
      setMessages(msgs);
    }, (error) => {
      console.error('[Chat] Erreur écoute messages:', error);
    });

    return () => {
      console.log('[Chat] Désabonnement écoute messages pour conversation:', conversationId);
      unsubscribe();
    };
  }, [selectedContact, currentUser]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedContact) {
      console.log('[Chat] Message vide ou aucun contact sélectionné');
      return;
    }

    const conversationId = generateConversationId(currentUser.uid, selectedContact.uid);
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');

    try {
      console.log(`[Chat] Envoi message à ${conversationId}:`, message);
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'You',
        text: encryptMessage(message.trim()),
        timestamp: serverTimestamp()
      });
      setMessage('');

      // Audit: Message envoyé
      const token = await currentUser.getIdToken();

await fetch('http://localhost:3000/api/messages/log', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    senderId: currentUser.uid,
    recipientId: selectedContact.uid,
    text: "Message"
  })
});

    } catch (error) {
      console.error('[Chat] Erreur lors de l\'envoi du message:', error);
    }
  };

  const handleLogout = async () => {
  try {
    console.log('[Chat] Déconnexion...');
    const token = await currentUser.getIdToken();

    // Backend logout
    await fetch('http://localhost:3000/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ token }),
    });

    // Audit: Déconnexion
    await fetch('http://localhost:3000/api/audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
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
    console.log('[Chat] Déconnexion réussie');
    navigate('/login');
  } catch (error) {
    console.error('[Chat] Erreur lors de la déconnexion:', error);
  }
};

  const styles = {
    chatContainer: { display: 'flex', height: '100vh', backgroundColor: '#1a1a1a', color: '#fff', fontFamily: 'sans-serif' },
    sidebar: { width: '250px', backgroundColor: '#2a2a2a', borderRight: '1px solid #3a3a3a', display: 'flex', flexDirection: 'column' },
    contactList: { flex: 1, overflowY: 'auto' },
    contactItem: { padding: '12px', cursor: 'pointer', borderBottom: '1px solid #353535', display: 'flex', alignItems: 'center' },
    activeContact: { backgroundColor: '#404040' },
    contactAvatar: { width: 40, height: 40, borderRadius: '50%', marginRight: 12, objectFit: 'cover' },
    contactName: { fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    chatArea: { flex: 1, display: 'flex', flexDirection: 'column' },
    chatHeader: { padding: 16, borderBottom: '1px solid #3a3a3a', backgroundColor: '#2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    messagesContainer: { flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
    messageWrapper: { display: 'flex', alignItems: 'flex-end' },
    ownMessage: { justifyContent: 'flex-end' },
    otherMessage: { justifyContent: 'flex-start' },
    messageBubble: { padding: '8px 12px', borderRadius: 16, maxWidth: '60%', wordWrap: 'break-word' },
    ownBubble: { backgroundColor: '#007AFF', color: '#fff' },
    otherBubble: { backgroundColor: '#3a3a3a', color: '#fff' },
    messageInputContainer: { padding: 16, borderTop: '1px solid #3a3a3a', backgroundColor: '#2a2a2a', display: 'flex' },
    messageInput: { flex: 1, padding: '8px 12px', borderRadius: 20, border: 'none', outline: 'none', fontSize: 16, backgroundColor: '#3a3a3a', color: '#fff' },
    sendButton: { marginLeft: 12, padding: '8px 16px', borderRadius: 20, backgroundColor: '#007AFF', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }
  };

  return (
    <div style={styles.chatContainer}>
      <div style={styles.sidebar}>
        <div style={{ padding: 16, borderBottom: '1px solid #3a3a3a' }}>
          <input
            type="text"
            placeholder="Search contacts..."
            style={{ width: '100%', padding: 8, borderRadius: 8, border: 'none', outline: 'none', backgroundColor: '#3a3a3a', color: '#fff' }}
          />
        </div>
        <div style={styles.contactList}>
          {contacts.map((contact) => (
            <div
              key={contact.uid}
              style={{
                ...styles.contactItem,
                ...(selectedContact?.uid === contact.uid ? styles.activeContact : {})
              }}
              onClick={() => {
                console.log('[Chat] Contact sélectionné:', contact.name, contact.uid);
                setSelectedContact(contact);
              }}
            >
              <img src={contact.profileUrl || contact.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'} alt={contact.name} style={styles.contactAvatar} />
              <div>
                <div style={styles.contactName}>{contact.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.chatArea}>
        <div style={styles.chatHeader}>
          <div>{selectedContact ? selectedContact.name : 'Sélectionne un contact'}</div>
          <button style={styles.sendButton} onClick={handleLogout}>Déconnexion</button>
        </div>

        <div style={styles.messagesContainer}>
          {!selectedContact && <p style={{ textAlign: 'center', color: '#888' }}>Sélectionne un contact pour commencer à discuter</p>}

          {messages.map((msg, i) => {
            const isOwn = msg.senderId === currentUser.uid;
            let decryptedText = '';

            try {
              decryptedText = decryptMessage(msg.text);
            } catch (err) {
              console.error('[Chat] Erreur de déchiffrement pour message:', msg, err);
              decryptedText = '[Message illisible]';
            }

            return (
              <div
                key={i}
                style={{ ...styles.messageWrapper, justifyContent: isOwn ? 'flex-end' : 'flex-start' }}
              >
                <div style={{ 
                  ...styles.messageBubble, 
                  ...(isOwn ? styles.ownBubble : styles.otherBubble) 
                }}>
                  {decryptedText}
                </div>
              </div>
            );
          })}
        </div>

        {selectedContact && (
          <div style={styles.messageInputContainer}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Tape ton message"
              style={styles.messageInput}
            />
            <button onClick={handleSendMessage} style={styles.sendButton}>Envoyer</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
