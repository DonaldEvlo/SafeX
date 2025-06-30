import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAuth } from 'firebase/auth'

const Verify2FA = () => {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    const check2FAStatus = async () => {
      try {
        setLoading(true)
        const res = await fetch('http://localhost:3000/api/auth/mfa-status', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!res.ok) {
          const errorData = await res.json()
          throw new Error(errorData.error || 'Erreur de vérification')
        }

        const data = await res.json()
        if (!data.mfaRequired) {
          navigate('/chat')
        } else {
          setLoading(false)
        }
      } catch (err) {
        setError(`Erreur: ${err.message}`)
        setLoading(false)
      }
    }

    check2FAStatus()
  }, [navigate, token])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const sendOTP = async () => {
    try {
      setSending(true)
      setError('')
      setMessage('')
      const res = await fetch('http://localhost:3000/api/auth/send-otp', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur envoi OTP')

      setMessage(data.message + (data.note ? `\n${data.note}` : ''))
      setCountdown(180)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      setError('❌ Veuillez entrer un code à 6 chiffres')
      return
    }

    try {
      setError('')
      setMessage('')
      const res = await fetch('http://localhost:3000/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Code incorrect')

      // Récupération userId Firebase
      const auth = getAuth()
      const currentUser = auth.currentUser
      if (currentUser) {
        const userId = currentUser.uid

        // Envoi audit de connexion
        const auditRes = await fetch('http://localhost:3000/api/audit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId,
            action: 'Connexion',
            details: {
              localTime: new Date().toLocaleString(),
              browser: navigator.userAgent,
            },
          }),
        })

        if (!auditRes.ok) {
          const auditError = await auditRes.json()
          console.error('Erreur audit:', auditError.error || 'Erreur inconnue')
        }
      } else {
        console.warn('Utilisateur non connecté, audit non envoyé')
      }

      setMessage('✅ Vérification réussie ! Redirection...')
      setTimeout(() => navigate('/chat'), 1500)
    } catch (err) {
      setError(`❌ ${err.message}`)
      setOtp('')
    }
  }

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div
        style={{
          maxWidth: '400px',
          margin: '50px auto',
          padding: '30px',
          textAlign: 'center',
        }}
      >
        <div>🔄 Vérification du statut 2FA...</div>
      </div>
    )
  }

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '50px auto',
        padding: '30px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2>🔐 Vérification 2FA</h2>
        <div
          style={{
            backgroundColor: '#fff3cd',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '14px',
            color: '#856404',
            marginTop: '10px',
          }}
        >
          ⚠️ <strong>Mode test CallMeBot</strong>
          <br />
          Le code sera envoyé au numéro administrateur
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Code à 6 chiffres"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '18px',
            textAlign: 'center',
            border: '2px solid #ddd',
            borderRadius: '5px',
            letterSpacing: '3px',
          }}
          maxLength={6}
        />
      </div>

      <button
        onClick={handleVerify}
        disabled={otp.length !== 6}
        style={{
          width: '100%',
          padding: '15px',
          marginBottom: '10px',
          backgroundColor: otp.length === 6 ? '#007bff' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          fontSize: '16px',
          cursor: otp.length === 6 ? 'pointer' : 'not-allowed',
        }}
      >
        ✅ Vérifier le code
      </button>

      <button
        onClick={sendOTP}
        disabled={sending || countdown > 0}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: sending || countdown > 0 ? '#6c757d' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: sending || countdown > 0 ? 'not-allowed' : 'pointer',
        }}
      >
        {sending
          ? '📤 Envoi en cours...'
          : countdown > 0
          ? `🕐 Renvoyer dans ${formatCountdown(countdown)}`
          : '📱 Envoyer le code WhatsApp'}
      </button>

      {message && (
        <div
          style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '5px',
            fontSize: '14px',
            whiteSpace: 'pre-line',
          }}
        >
          {message}
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '5px',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}

export default Verify2FA
