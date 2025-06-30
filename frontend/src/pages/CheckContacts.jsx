import { getAuth, onAuthStateChanged } from 'firebase/auth'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CheckContacts = () => {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchEmail, setSearchEmail] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searchError, setSearchError] = useState(null)
  const [adding, setAdding] = useState(false)
  const [addMessage, setAddMessage] = useState(null)

  const navigate = useNavigate()
  const auth = getAuth()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login')
        return
      }

      try {
        const token = await user.getIdToken()
        const res = await fetch('http://localhost:3000/api/contacts', {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (!res.ok) throw new Error('Erreur lors du chargement des contacts')

        const data = await res.json()
        setContacts(data)
      } catch (err) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleSearch = async () => {
    setSearchError(null)
    setSearchResult(null)
    setAddMessage(null)

    if (!searchEmail) {
      setSearchError('Veuillez entrer un email')
      return
    }

    try {
      const user = auth.currentUser
      if (!user) {
        navigate('/login')
        return
      }
      const token = await user.getIdToken()

      const res = await fetch(`http://localhost:3000/api/users/find?email=${encodeURIComponent(searchEmail)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.status === 404) {
        setSearchError('Aucun utilisateur trouvé avec cet email')
        return
      }

      if (!res.ok) throw new Error('Erreur lors de la recherche')

      const data = await res.json()
      setSearchResult(data)
    } catch (err) {
      console.error(err)
      setSearchError(err.message)
    }
  }

  const handleAddContact = async () => {
    if (!searchResult) return
    setAdding(true)
    setAddMessage(null)
    setSearchError(null)

    try {
      const user = auth.currentUser
      if (!user) {
        navigate('/login')
        return
      }
      const token = await user.getIdToken()

      const res = await fetch('http://localhost:3000/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ contactUid: searchResult.uid })
      })

      const result = await res.json()

      if (!res.ok) {
        setAddMessage(result.error || 'Erreur lors de l\'ajout')
        return
      }

      setAddMessage('Contact ajouté avec succès !')

      setContacts(prev => [...prev, {
        id: searchResult.uid,
        name: searchResult.name,
        email: searchResult.email,
        profileUrl: searchResult.profileUrl
      }])

      setSearchResult(null)
      setSearchEmail('')
    } catch (err) {
      console.error(err)
      setAddMessage('Erreur serveur')
    } finally {
      setAdding(false)
    }
  }

const startChat = async (contactUid) => {
  try {
    const user = auth.currentUser
    if (!user) {
      navigate('/login')
      return
    }

    const token = await user.getIdToken()

    const res = await fetch(`http://localhost:3000/api/chats/existing-or-create?contactUid=${contactUid}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (!res.ok) {
      console.error('Erreur lors de la vérification ou création du chat')
      return
    }

    const data = await res.json()
    // Attention ici, la clé est conversationId, pas chatId !
    navigate(`/chat/${data.conversationId}`)
  } catch (err) {
    console.error('Erreur lors de la vérification ou création du chat', err)
  }
}

  if (loading) return <p style={{ color: 'white', textAlign: 'center', marginTop: 50 }}>Chargement des contacts...</p>
  if (error) return <p style={{ color: 'red', textAlign: 'center', marginTop: 50 }}>{error}</p>

  return (
    <div style={{ padding: 20, backgroundColor: '#1a1a1a', minHeight: '100vh', color: '#fff' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>📇 Mes contacts</h2>

      <div style={{ marginBottom: 30, textAlign: 'center' }}>
        <input
          type="email"
          placeholder="Entrez l'email du contact"
          value={searchEmail}
          onChange={e => setSearchEmail(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 6,
            border: 'none',
            width: 250,
            marginRight: 8,
            fontSize: 16,
          }}
          disabled={adding}
        />
        <button
          onClick={handleSearch}
          disabled={adding}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: '#4CAF50',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Rechercher
        </button>
        {searchError && <p style={{ color: 'orange', marginTop: 8 }}>{searchError}</p>}
      </div>

      {searchResult && (
        <div
          style={{
            backgroundColor: '#2a2a2a',
            padding: 16,
            borderRadius: 8,
            maxWidth: 400,
            margin: 'auto',
            marginBottom: 30,
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}
        >
          <img
            src={searchResult.profileUrl || 'https://randomuser.me/api/portraits/lego/1.jpg'}
            alt={searchResult.name}
            style={{ width: 60, height: 60, borderRadius: '50%' }}
          />
          <div style={{ flexGrow: 1 }}>
            <div style={{ fontWeight: 'bold', fontSize: 18 }}>{searchResult.name || 'Inconnu'}</div>
            <div style={{ color: '#bbb', fontSize: 14 }}>{searchResult.email}</div>
            <div style={{ color: '#bbb', fontSize: 14 }}>{searchResult.username}</div>
          </div>
          <button
            onClick={handleAddContact}
            disabled={adding}
            style={{
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {adding ? 'Ajout en cours...' : 'Ajouter'}
          </button>
        </div>
      )}

      {addMessage && <p style={{ color: addMessage.includes('succès') ? 'lightgreen' : 'orange', textAlign: 'center' }}>{addMessage}</p>}

      {contacts.length === 0 ? (
        <p style={{ textAlign: 'center' }}>Aucun contact trouvé.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {contacts.map(contact => (
            <div
              key={contact.id}
              style={{
                backgroundColor: '#2a2a2a',
                padding: 12,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <img
                  src={contact.profileUrl || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                  alt={contact.name}
                  style={{ width: 50, height: 50, borderRadius: '50%' }}
                />
                <div>
                  <div style={{ fontWeight: 'bold' }}>{contact.name || 'Inconnu'}</div>
                  <div style={{ fontSize: 14, color: '#bbb' }}>{contact.email || ''}</div>
                </div>
              </div>

              <button
                onClick={() => startChat(contact.id)}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Chatter
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CheckContacts
