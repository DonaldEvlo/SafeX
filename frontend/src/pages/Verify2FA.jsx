import { getAuth } from 'firebase/auth'
import { doc, getDoc, getFirestore } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
    const auth = getAuth()
    const currentUser = auth.currentUser

    if (!currentUser || !token) {
      navigate('/login')
      return
    }

    const check2FAStatus = async () => {
      try {
        setLoading(true)
        const res = await fetch('http://localhost:5000/api/auth/mfa-status', {
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
          const role = await getUserRoleFromFirestore(currentUser.uid)
          navigate(role === 'admin' ? '/admin-log' : '/chat')
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

  const getUserRoleFromFirestore = async (uid) => {
    const db = getFirestore()
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (userDoc.exists()) {
      return userDoc.data().role || 'user'
    }
    return 'user'
  }

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
      const res = await fetch('http://localhost:5000/api/auth/send-otp', {
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
      const res = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Code incorrect')

      const auth = getAuth()
      const currentUser = auth.currentUser
      if (currentUser) {
        const userId = currentUser.uid

        await fetch('http://localhost:5000/api/audit', {
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

        const role = await getUserRoleFromFirestore(userId)
        setMessage('✅ Vérification réussie ! Redirection...')
        setTimeout(() => {
          navigate(role === 'admin' ? '/admin-log' : '/chat')
        }, 1500)
      } else {
        throw new Error("Utilisateur non connecté.")
      }
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
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '400px',
          width: '100%',
          padding: '40px',
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          border: '1px solid #334155',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          textAlign: 'center',
          color: '#e2e8f0'
        }}>
          <div style={{
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '3px solid #3b82f6',
              borderTop: '3px solid transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            Vérification du statut 2FA...
          </div>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        padding: '40px',
        backgroundColor: '#1e293b',
        borderRadius: '16px',
        border: '1px solid #334155',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            🔐
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#f1f5f9',
            margin: '0 0 16px 0'
          }}>
            Vérification 2FA
          </h2>
          <p style={{
            color: '#94a3b8',
            fontSize: '16px',
            margin: '0'
          }}>
            Entrez le code de vérification reçu
          </p>
        </div>

        {/* Test Mode Alert */}
        <div style={{
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            color: '#fbbf24',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <span style={{ fontSize: '16px', marginRight: '8px' }}>⚠️</span>
            <strong>Mode test CallMeBot</strong>
          </div>
          <div style={{
            color: '#d97706',
            fontSize: '13px',
            marginTop: '4px'
          }}>
            Le code sera envoyé au numéro administrateur
          </div>
        </div>

        {/* OTP Input */}
        <div style={{ marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="• • • • • •"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            style={{
              width: '100%',
              padding: '20px',
              fontSize: '24px',
              fontWeight: '600',
              textAlign: 'center',
              backgroundColor: '#334155',
              border: `2px solid ${otp.length === 6 ? '#10b981' : '#475569'}`,
              borderRadius: '12px',
              letterSpacing: '8px',
              color: '#f1f5f9',
              outline: 'none',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box'
            }}
            maxLength={6}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6'
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = otp.length === 6 ? '#10b981' : '#475569'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={otp.length !== 6}
          style={{
            width: '100%',
            padding: '16px',
            marginBottom: '16px',
            backgroundColor: otp.length === 6 ? '#10b981' : '#374151',
            color: otp.length === 6 ? '#ffffff' : '#9ca3af',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: otp.length === 6 ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            if (otp.length === 6) {
              e.target.style.backgroundColor = '#059669'
              e.target.style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={(e) => {
            if (otp.length === 6) {
              e.target.style.backgroundColor = '#10b981'
              e.target.style.transform = 'translateY(0)'
            }
          }}
        >
          <span>✅</span>
          Vérifier le code
        </button>

        {/* Send OTP Button */}
        <button
          onClick={sendOTP}
          disabled={sending || countdown > 0}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: sending || countdown > 0 ? '#374151' : '#3b82f6',
            color: sending || countdown > 0 ? '#9ca3af' : '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '500',
            cursor: sending || countdown > 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            if (!sending && countdown === 0) {
              e.target.style.backgroundColor = '#2563eb'
              e.target.style.transform = 'translateY(-1px)'
            }
          }}
          onMouseLeave={(e) => {
            if (!sending && countdown === 0) {
              e.target.style.backgroundColor = '#3b82f6'
              e.target.style.transform = 'translateY(0)'
            }
          }}
        >
          {sending ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #9ca3af',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Envoi en cours...
            </>
          ) : countdown > 0 ? (
            <>
              <span>🕐</span>
              Renvoyer dans {formatCountdown(countdown)}
            </>
          ) : (
            <>
              <span>📱</span>
              Envoyer le code WhatsApp
            </>
          )}
        </button>

        {/* Success Message */}
        {message && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            fontSize: '14px',
            color: '#10b981',
            whiteSpace: 'pre-line',
            lineHeight: '1.5'
          }}>
            {message}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            fontSize: '14px',
            color: '#ef4444',
            lineHeight: '1.5'
          }}>
            {error}
          </div>
        )}

        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  )
}

export default Verify2FA