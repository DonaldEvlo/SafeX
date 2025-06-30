import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../services/firebase'
import '../../styles/RegisterForm.css'

const RegisterForm = () => {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')

  // Validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/ // min 8 caractères, au moins 1 maj, 1 min, 1 chiffre, 1 spécial

  const validateInputs = () => {
    if (!emailRegex.test(email)) {
      setError('Adresse email invalide.')
      return false
    }
    if (!passwordRegex.test(password)) {
      setError(
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'
      )
      return false
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.')
      return false
    }
    if (!fullName.trim()) {
      setError('Le nom complet est requis.')
      return false
    }
    if (!username.trim()) {
      setError("Le nom d'utilisateur est requis.")
      return false
    }
    setError('')
    return true
  }

  const handleRegister = async () => {
    if (!validateInputs()) return

    try {
      // Étape 1: Créer un compte avec Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Étape 2: Récupérer un token Firebase
      const token = await userCredential.user.getIdToken()

      // Étape 3: Appeler le backend pour enregistrer l'utilisateur dans Firestore
      const res = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: fullName,
          username,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Étape 4: Envoyer audit "Création de compte"
      const userId = userCredential.user.uid
      try {
        await fetch('http://localhost:3000/api/audit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId,
            action: 'Création de compte',
            details: {
              localTime: new Date().toLocaleString(),
              browser: navigator.userAgent,
            },
          }),
        })
      } catch (auditError) {
        console.warn('Erreur audit création compte:', auditError)
      }

      // Étape 5: Rediriger ou afficher un message de succès
      navigate('/chat') // ou /login ou /dashboard
    } catch (err) {
      console.error(err)
      setError('Échec de la création du compte : ' + err.message)
    }
  }

  return (
    <div className="login-container">
      <header className="login-header">
        <div className="logo-area">
          <div className="logo-icon">{/* Ton SVG ici */}</div>
          <div className="logo-text">ChatApp</div>
        </div>
        <button onClick={() => navigate('/login')} className="header-login-btn">
          Log In
        </button>
      </header>

      <main className="form-wrapper">
        <div className="login-box">
          <h2>Create your account</h2>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <button className="submit-btn" onClick={handleRegister}>
            Create account
          </button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
          <p className="signup-link">
            By signing up, you agree to our <a href="#">Terms</a>, <a href="#">Privacy Policy</a> and{' '}
            <a href="#">Cookie Use</a>.
          </p>
        </div>
      </main>
    </div>
  )
}

export default RegisterForm
