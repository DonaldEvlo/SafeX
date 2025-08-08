import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useRef, useState } from 'react';
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

      await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      });

      await fetch('http://localhost:5000/api/audit', {
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
      await fetch('http://localhost:5000/api/audit', {
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
    return <div style={{ color: '#ffffff', textAlign: 'center', marginTop: 50 }}>Chargement du profil...</div>;
  }

  if (!user) {
    return <div style={{ color: '#ffffff', textAlign: 'center', marginTop: 50 }}>Utilisateur introuvable.</div>;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #181d23, #0f1419)',
      color: '#ffffff',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #232b35, #1a1f26)',
        borderRadius: 20,
        padding: 40,
        minWidth: 400,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        animation: 'glow 2s infinite alternate'
      }}>
        <style>
          {`
            @keyframes glow {
              0% { box-shadow: 0 4px 20px rgba(0, 122, 255, 0.3); }
              100% { box-shadow: 0 4px 20px rgba(0, 122, 255, 0.6); }
            }
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.02); }
              100% { transform: scale(1); }
            }
          `}
        </style>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 30 }}>
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <img
              src={editProfileUrl || 'https://randomuser.me/api/portraits/lego/1.jpg'}
              alt="avatar"
              style={{
                width: 120, height: 120, borderRadius: '50%', border: '4px solid #007AFF4d',
                objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            />
            <button
              onClick={() => fileInputRef.current.click()}
              style={{
                position: 'absolute', bottom: -10, right: -10,
                background: 'linear-gradient(135deg, #007AFF, #0056CC)',
                border: 'none', borderRadius: '50%', width: 40, height: 40,
                color: '#fff', fontSize: 20, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
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
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: '600', color: '#e5e7eb' }}>{user.name}</h2>
          <div style={{ marginTop: 16, width: '100%', maxWidth: 300 }}>
            <label style={{ color: '#9caaba', fontSize: 14 }}>Nom d'utilisateur</label>
            <input
              value={editUsername}
              onChange={e => setEditUsername(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 12,
                border: '1px solid #2a313c', background: '#2d333c', color: '#ffffff',
                marginTop: 6, fontSize: 16, outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#007AFF'}
              onBlur={e => e.target.style.borderColor = '#2a313c'}
              disabled={saving}
            />
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong style={{ fontWeight: '500' }}>Email :</strong>
            <span style={{ color: '#9caaba', fontSize: 15 }}>{user.email}</span>
          </div>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong style={{ fontWeight: '500' }}>Rôle :</strong>
            <span style={{
              color: user.role === 'admin' ? '#FF9800' : '#4CAF50',
              fontSize: 15, padding: '2px 8px', borderRadius: 4
            }}>{user.role}</span>
          </div>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong style={{ fontWeight: '500' }}>UID :</strong>
            <span style={{ color: '#888', fontSize: 13 }}>{user.uid}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong style={{ fontWeight: '500' }}>Inscrit le :</strong>
            <span style={{ color: '#9caaba', fontSize: 15 }}>
              {user.createdAt?.toDate
                ? user.createdAt.toDate().toLocaleString()
                : user.createdAt
                  ? new Date(user.createdAt).toLocaleString()
                  : 'N/A'}
            </span>
          </div>
        </div>
        {error && <div style={{ color: '#ff4757', marginBottom: 16, textAlign: 'center' }}>{error}</div>}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 12,
            background: saving ? '#2a313c' : 'linear-gradient(135deg, #007AFF, #0056CC)',
            color: '#ffffff', border: 'none', fontWeight: '600', fontSize: 16,
            cursor: saving ? 'not-allowed' : 'pointer', marginBottom: 12,
            boxShadow: saving ? 'none' : '0 4px 12px rgba(0,122,255,0.4)',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={e => !saving && (e.target.style.transform = 'scale(1.05)')}
          onMouseLeave={e => !saving && (e.target.style.transform = 'scale(1)')}
        >
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 12,
            background: 'linear-gradient(135deg, #ff4757, #ff3742)',
            color: '#ffffff', border: 'none', fontWeight: '600', fontSize: 16,
            cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,71,87,0.4)',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
};

export default Profile;