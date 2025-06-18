import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../services/firebase' // <-- Assure-toi que ça pointe bien ici
import '../../styles/LoginForm.css'

const LoginForm = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    try {
      // 🔐 Firebase Auth login
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const token = await userCredential.user.getIdToken()

      // 🌐 Appel à ton backend SafeX pour valider le token
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      console.log('✅ Connected as:', data.email)
      navigate('/chat') // ou la route protégée que tu veux

    } catch (err) {
      console.error('Erreur login:', err)
      setError('Invalid email or password')
    }
  }

  return (
    <div className="login-container">
      <header className="login-header">
        <div className="logo-area">
          <div className="logo-icon">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="..." />
            </svg>
          </div>
          <h1 className="logo-text">SafeX</h1>
        </div>
        <nav className="nav-links">
          <a href="#">Download</a>
          <a href="#">Safety</a>
          <a href="#">Support</a>
        </nav>
        <button className="header-login-btn">Log In</button>
      </header>

      <main className="form-wrapper">
        <div className="login-box">
          <h2>Log in to SafeX</h2>
          <input
            type="text"
            placeholder="Email or phone number"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <a href="#" className="forgot-link">Forgot password?</a>
          <button className="submit-btn" onClick={handleLogin}>Next</button>

          {error && <p className="text-red-500 mt-2">{error}</p>}

          <p className="signup-link">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-[#0c77f2] hover:underline font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
      </main>
    </div>
  )
}

export default LoginForm
