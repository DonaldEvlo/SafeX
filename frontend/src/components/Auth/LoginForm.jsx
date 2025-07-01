import { signInWithEmailAndPassword } from 'firebase/auth'
import React,{ useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../services/firebase'
import '../../styles/LoginForm.css'

const LoginForm = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const token = await userCredential.user.getIdToken()

      // 🌐 Vérification côté backend
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Échec connexion')

      // 🔐 Sauvegarde du token localement pour les appels futurs
      localStorage.setItem('token', token)

      // Redirection vers vérification 2FA
      navigate('/verify-2fa')
    } catch (err) {
      console.error('Erreur login:', err)
      setError('❌ Email ou mot de passe incorrect')
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
            placeholder="Email"
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
