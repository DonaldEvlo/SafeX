import React, { useEffect, useRef, useState } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../services/firebase';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editUsername, setEditUsername] = useState('');
  const [editProfileUrl, setEditProfileUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUser(data);
        setEditUsername(data.username || '');
        setEditProfileUrl(data.profileUrl || '');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    try {
      const token = await currentUser.getIdToken();

      await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      });

      await fetch('http://localhost:3000/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          action: 'Déconnexion',
          details: {
            browser: navigator.userAgent,
            localTime: new Date().toLocaleString(),
          },
        }),
      });

      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('[Logout] Erreur déconnexion:', error);
    }
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(true);
    setError('');

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const uid = currentUser.uid;

      const storageRef = ref(storage, `profilePics/${uid}`);
      await uploadBytes(storageRef, file);

      const downloadUrl = await getDownloadURL(storageRef);

      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        profileUrl: downloadUrl,
        updatedAt: new Date(),
      });

      setEditProfileUrl(downloadUrl);
      setUser((prev) => ({ ...prev, profileUrl: downloadUrl }));
    } catch (err) {
      console.error('Erreur lors de l\'upload de la photo :', err);
      setError("Erreur lors de l'upload de la photo.");
    }

    setSaving(false);
  };

 const handleSave = async () => {
  if (!editUsername.trim()) {
    setError('Le username ne peut pas être vide.');
    return;
  }
  setSaving(true);
  setError('');

  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const uid = currentUser.uid;
    const token = await currentUser.getIdToken();

    // Mise à jour dans Firestore
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      username: editUsername.trim(),
      profileUrl: editProfileUrl || null,
      updatedAt: new Date(),
    });

    setUser((prev) => ({
      ...prev,
      username: editUsername.trim(),
      profileUrl: editProfileUrl || null,
    }));

    // Appel à ton API audit pour logger la mise à jour du profil
    await fetch('http://localhost:3000/api/audit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        userId: uid,
        action: 'Mise à jour profil',
        details: {
          browser: navigator.userAgent,
          localTime: new Date().toLocaleString(),
        }
      })
    });

    console.log('✅ Profil mis à jour et log audit envoyé.');

  } catch (err) {
    console.error("Erreur sauvegarde : ", err);
    setError("Erreur lors de la sauvegarde.");
  }

  setSaving(false);
};


  if (loading) {
    return <div style={{ color: '#fff', textAlign: 'center', marginTop: 50 }}>Chargement du profil...</div>;
  }

  if (!user) {
    return <div style={{ color: '#fff', textAlign: 'center', marginTop: 50 }}>Utilisateur introuvable.</div>;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1a1a',
      color: '#fff',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        background: '#232323',
        borderRadius: 16,
        padding: 32,
        minWidth: 350,
        boxShadow: '0 2px 16px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <img
              src={editProfileUrl || 'https://randomuser.me/api/portraits/lego/1.jpg'}
              alt="avatar"
              style={{ width: 90, height: 90, borderRadius: '50%', border: '3px solid #007AFF', objectFit: 'cover' }}
            />
            <button
              onClick={() => fileInputRef.current.click()}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: '#007AFF',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                color: '#fff',
                fontSize: 18,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }}
              title="Changer la photo"
              type="button"
            >
              ✏️
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleProfilePicChange}
            />
          </div>
          <h2 style={{ margin: 0 }}>{user.name}</h2>
          <div style={{ marginTop: 8, width: '100%' }}>
            <label style={{ color: '#aaa', fontSize: 14 }}>@username</label>
            <input
              value={editUsername}
              onChange={e => setEditUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid #444',
                background: '#181818',
                color: '#fff',
                marginTop: 4,
                fontSize: 15
              }}
              disabled={saving}
            />
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Email :</strong>
            <div style={{ color: '#ccc', fontSize: 15 }}>{user.email}</div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Rôle :</strong>
            <span style={{
              color: user.role === 'admin' ? '#FF9800' : '#4CAF50',
              marginLeft: 8
            }}>{user.role}</span>
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>UID :</strong>
            <div style={{ color: '#888', fontSize: 13 }}>{user.uid}</div>
          </div>
          <div>
            <strong>Inscrit le :</strong>
            <span style={{ color: '#ccc', marginLeft: 8 }}>
              {user.createdAt?.toDate
                ? user.createdAt.toDate().toLocaleString()
                : user.createdAt
                  ? new Date(user.createdAt).toLocaleString()
                  : 'N/A'}
            </span>
          </div>
        </div>
        {error && <div style={{ color: '#FF3B30', marginBottom: 10 }}>{error}</div>}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            padding: '10px 0',
            borderRadius: 8,
            background: '#007AFF',
            color: '#fff',
            border: 'none',
            fontWeight: 'bold',
            fontSize: 16,
            cursor: saving ? 'not-allowed' : 'pointer',
            marginTop: 8,
            marginBottom: 8,
            opacity: saving ? 0.7 : 1
          }}
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '10px 0',
            borderRadius: 8,
            background: '#FF3B30',
            color: '#fff',
            border: 'none',
            fontWeight: 'bold',
            fontSize: 16,
            cursor: 'pointer',
            marginTop: 0
          }}
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
};

export default Profile;
