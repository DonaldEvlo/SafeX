import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../services/firebase'
import '../../styles/RegisterForm.css'

const RegisterForm = () => {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')

  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState('')

  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')

  const [fullName, setFullName] = useState('')
  const [fullNameError, setFullNameError] = useState('')

  const [username, setUsername] = useState('')
  const [usernameError, setUsernameError] = useState('')

  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
  const mediumPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/

  // Validation et mise à jour des erreurs en temps réel
  useEffect(() => {
    if (email === '') {
      setEmailError('')
    } else if (!emailRegex.test(email)) {
      setEmailError('Adresse email invalide.')
    } else {
      setEmailError('')
    }
  }, [email])

  useEffect(() => {
    if (password === '') {
      setPasswordError('')
      setPasswordStrength('')
    } else if (strongPasswordRegex.test(password)) {
      setPasswordError('')
      setPasswordStrength('fort')
    } else if (mediumPasswordRegex.test(password)) {
      setPasswordError(
        'Le mot de passe est moyen, ajoutez un caractère spécial pour plus de sécurité.'
      )
      setPasswordStrength('moyen')
    } else {
      setPasswordError(
        'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'
      )
      setPasswordStrength('faible')
    }
  }, [password])

  useEffect(() => {
    if (confirmPassword === '') {
      setConfirmPasswordError('')
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Les mots de passe ne correspondent pas.')
    } else {
      setConfirmPasswordError('')
    }
  }, [confirmPassword, password])

  useEffect(() => {
    if (fullName === '') {
      setFullNameError('')
    } else if (!fullName.trim()) {
      setFullNameError('Le nom complet est requis.')
    } else {
      setFullNameError('')
    }
  }, [fullName])

  useEffect(() => {
    if (username === '') {
      setUsernameError('')
    } else if (!username.trim()) {
      setUsernameError("Le nom d'utilisateur est requis.")
    } else {
      setUsernameError('')
    }
  }, [username])

  const isFormValid =
    email &&
    !emailError &&
    password &&
    !passwordError &&
    confirmPassword &&
    !confirmPasswordError &&
    fullName &&
    !fullNameError &&
    username &&
    !usernameError

  const handleRegister = async () => {
    if (!isFormValid) {
      setFormError('Veuillez corriger les erreurs dans le formulaire.')
      return
    }
    setFormError('')
    setIsSubmitting(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const token = await userCredential.user.getIdToken()

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

      navigate('/chat')
    } catch (err) {
      console.error(err)
      setFormError('Échec de la création du compte : ' + err.message)
    } finally {
      setIsSubmitting(false)
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
          {emailError && <p className="text-red-500">{emailError}</p>}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {passwordError && <p className="text-red-500">{passwordError}</p>}
          {passwordStrength && !passwordError && (
            <p
              style={{
                color:
                  passwordStrength === 'fort'
                    ? 'green'
                    : passwordStrength === 'moyen'
                    ? 'orange'
                    : 'red',
              }}
            >
              Force du mot de passe : {passwordStrength}
            </p>
          )}

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
          {confirmPasswordError && <p className="text-red-500">{confirmPasswordError}</p>}

          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
          />
          {fullNameError && <p className="text-red-500">{fullNameError}</p>}

          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          {usernameError && <p className="text-red-500">{usernameError}</p>}

          <button
            className="submit-btn"
            onClick={handleRegister}
            disabled={!isFormValid || isSubmitting}
            style={{ opacity: !isFormValid || isSubmitting ? 0.5 : 1 }}
          >
            {isSubmitting ? 'Création...' : 'Create account'}
          </button>

          {formError && <p className="text-red-500 mt-2">{formError}</p>}

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
