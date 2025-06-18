const admin = require('../services/firebaseAdmin')
const User = require('../models/User')

exports.registerUser = async (req, res) => {
  const { token, name, username } = req.body

  try {
    const decoded = await admin.auth().verifyIdToken(token)

    const uid = decoded.uid
    const email = decoded.email

    // Première lettre du prénom
    const firstInitial = name?.trim()?.charAt(0)?.toUpperCase() || 'U'
    const profileUrl = `https://ui-avatars.com/api/?name=${firstInitial}&background=random`

    const userRef = admin.firestore().collection('users').doc(uid)
    const doc = await userRef.get()

    if (doc.exists) {
      return res.status(200).json({ message: 'Utilisateur déjà existant' })
    }

    const newUser = new User({
      uid,
      email,
      name,
      username,
      role: 'user',
      profileUrl,
      createdAt: new Date().toISOString(),
    })

    await userRef.set(newUser.toJson())

    return res.status(201).json({ message: 'Utilisateur enregistré avec succès', user: newUser.toJson() })
  } catch (error) {
    console.error('Erreur registerUser:', error)
    return res.status(401).json({ error: 'Token invalide' })
  }
}
