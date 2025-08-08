import { getAuth, onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CheckContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addMessage, setAddMessage] = useState(null);

  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const token = await user.getIdToken();
        const res = await fetch('http://localhost:5000/api/contacts', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Erreur lors du chargement des contacts');

        const data = await res.json();
        setContacts(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSearch = async () => {
    setSearchError(null);
    setSearchResult(null);
    setAddMessage(null);

    if (!searchEmail) {
      setSearchError('Veuillez entrer un email');
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }
      const token = await user.getIdToken();

      const res = await fetch(`http://localhost:5000/api/users/find?email=${encodeURIComponent(searchEmail)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 404) {
        setSearchError('Aucun utilisateur trouvé avec cet email');
        return;
      }

      if (!res.ok) throw new Error('Erreur lors de la recherche');

      const data = await res.json();
      setSearchResult(data);
    } catch (err) {
      console.error(err);
      setSearchError(err.message);
    }
  };

  const handleAddContact = async () => {
    if (!searchResult) return;
    setAdding(true);
    setAddMessage(null);
    setSearchError(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }
      const token = await user.getIdToken();

      const res = await fetch('http://localhost:5000/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ contactUid: searchResult.uid })
      });

      const result = await res.json();

      if (!res.ok) {
        setAddMessage(result.error || 'Erreur lors de l\'ajout');
        return;
      }

      setAddMessage('Contact ajouté avec succès !');

      setContacts(prev => [...prev, {
        id: searchResult.uid,
        name: searchResult.name,
        email: searchResult.email,
        profileUrl: searchResult.profileUrl
      }]);

      setSearchResult(null);
      setSearchEmail('');
    } catch (err) {
      console.error(err);
      setAddMessage('Erreur serveur');
    } finally {
      setAdding(false);
    }
  };

  const startChat = async (contactUid) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      const token = await user.getIdToken();

      const res = await fetch(`http://localhost:5000/api/chats/existing-or-create?contactUid=${contactUid}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        console.error('Erreur lors de la vérification ou création du chat');
        return;
      }

      const data = await res.json();
      navigate(`/chat/${data.conversationId}`);
    } catch (err) {
      console.error('Erreur lors de la vérification ou création du chat', err);
    }
  };

  if (loading) return <p style={{ color: '#ffffff', textAlign: 'center', marginTop: 50 }}>Chargement des contacts...</p>;
  if (error) return <p style={{ color: '#ff4757', textAlign: 'center', marginTop: 50 }}>{error}</p>;

  return (
    <div style={{
      padding: 20,
      background: 'linear-gradient(180deg, #181d23, #0f1419)',
      minHeight: '100vh',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>📇 Mes contacts</h2>

      <div style={{ marginBottom: 30, textAlign: 'center' }}>
        <input
          type="email"
          placeholder="Entrez l'email du contact"
          value={searchEmail}
          onChange={e => setSearchEmail(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: 12,
            border: '1px solid #2a313c',
            width: 300,
            marginRight: 12,
            backgroundColor: '#2d333c',
            color: '#ffffff',
            fontSize: 16,
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s'
          }}
          onFocus={e => e.target.style.borderColor = '#007AFF'}
          onBlur={e => e.target.style.borderColor = '#2a313c'}
          disabled={adding}
        />
        <button
          onClick={handleSearch}
          disabled={adding}
          style={{
            padding: '10px 20px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #4CAF50, #2e7d32)',
            color: '#ffffff',
            fontWeight: '500',
            cursor: adding ? 'not-allowed' : 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 2px 8px rgba(76,175,80,0.4)'
          }}
          onMouseEnter={e => !adding && (e.target.style.transform = 'scale(1.05)')}
          onMouseLeave={e => !adding && (e.target.style.transform = 'scale(1)')}
        >
          Rechercher
        </button>
        {searchError && <p style={{ color: '#ff9800', marginTop: 8, textAlign: 'center' }}>{searchError}</p>}
      </div>

      {searchResult && (
        <div
          style={{
            background: 'linear-gradient(135deg, #232b35, #1a1f26)',
            padding: 16,
            borderRadius: 12,
            maxWidth: 450,
            margin: 'auto',
            marginBottom: 30,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}
        >
          <img
            src={searchResult.profileUrl || 'https://randomuser.me/api/portraits/lego/1.jpg'}
            alt={searchResult.name}
            style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid #007AFF4d' }}
          />
          <div style={{ flexGrow: 1 }}>
            <div style={{ fontWeight: '600', fontSize: 18 }}>{searchResult.name || 'Inconnu'}</div>
            <div style={{ color: '#9caaba', fontSize: 14 }}>{searchResult.email}</div>
            <div style={{ color: '#9caaba', fontSize: 14 }}>{searchResult.username}</div>
          </div>
          <button
            onClick={handleAddContact}
            disabled={adding}
            style={{
              background: adding ? '#2a313c' : 'linear-gradient(135deg, #2196F3, #1976D2)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              padding: '10px 20px',
              cursor: adding ? 'not-allowed' : 'pointer',
              fontWeight: '500',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: !adding ? '0 2px 8px rgba(33,150,243,0.4)' : 'none'
            }}
            onMouseEnter={e => !adding && (e.target.style.transform = 'scale(1.05)')}
            onMouseLeave={e => !adding && (e.target.style.transform = 'scale(1)')}
          >
            {adding ? 'Ajout en cours...' : 'Ajouter'}
          </button>
        </div>
      )}

      {addMessage && <p style={{ color: addMessage.includes('succès') ? '#4CAF50' : '#ff9800', textAlign: 'center', marginBottom: 20 }}>{addMessage}</p>}

      {contacts.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#9caaba' }}>Aucun contact trouvé.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {contacts.map(contact => (
            <div
              key={contact.id}
              style={{
                background: 'linear-gradient(135deg, #232b35, #1a1f26)',
                padding: 16,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.02)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <img
                  src={contact.profileUrl || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                  alt={contact.name}
                  style={{ width: 50, height: 50, borderRadius: '50%', border: '2px solid #007AFF4d' }}
                />
                <div>
                  <div style={{ fontWeight: '600' }}>{contact.name || 'Inconnu'}</div>
                  <div style={{ fontSize: 14, color: '#9caaba' }}>{contact.email || ''}</div>
                </div>
              </div>
              <button
                onClick={() => startChat(contact.id)}
                style={{
                  background: 'linear-gradient(135deg, #4CAF50, #2e7d32)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 2px 8px rgba(76,175,80,0.4)'
                }}
                onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.target.style.transform = 'scale(1)'}
              >
                Chatter
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CheckContacts;