// pages/Setup2FA.jsx
import React, { useState } from 'react'
import { getAuth, multiFactor, PhoneAuthProvider, RecaptchaVerifier } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'

const Setup2FA = () => {
  const auth = getAuth()
  const user = auth.currentUser
  const [phoneNumber, setPhoneNumber] = useState('')
  const [code, setCode] = useState('')
  const [verificationId, setVerificationId] = useState(null)
  const navigate = useNavigate()

  const startVerification = async () => {
    const session = await multiFactor(user).getSession()

    window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
      size: 'invisible'
    }, auth)

    const phoneProvider = new PhoneAuthProvider(auth)
    const id = await phoneProvider.verifyPhoneNumber({ phoneNumber, session }, window.recaptchaVerifier)
    setVerificationId(id)
  }

  const verifyCode = async () => {
    const cred = PhoneAuthProvider.credential(verificationId, code)
    const assertion = PhoneAuthProvider.credential(verificationId, code)
    await multiFactor(auth.currentUser).enroll(assertion, 'Numéro principal')
    alert('2FA activé.')
    navigate('/chat')
  }

  return (
    <div style={{ padding: 32 }}>
      <h2>Authentification à deux facteurs</h2>
      <p>Entrez votre numéro de téléphone :</p>
      <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+221..." />
      <button onClick={startVerification}>Recevoir le code</button>

      {verificationId && (
        <>
          <input placeholder="Code reçu" value={code} onChange={e => setCode(e.target.value)} />
          <button onClick={verifyCode}>Valider</button>
        </>
      )}

      <div id="recaptcha-container" />
    </div>
  )
}

export default Setup2FA
