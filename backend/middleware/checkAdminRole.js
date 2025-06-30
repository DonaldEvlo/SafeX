const admin = require('../services/firebaseAdmin')

module.exports = async function checkAdminRole(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant ou invalide' })
    }

    const idToken = authHeader.split(' ')[1]
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    const uid = decodedToken.uid

    const userDoc = await admin.firestore().collection('users').doc(uid).get()

    if (!userDoc.exists) {
      return res.status(403).json({ error: 'Utilisateur non trouvé' })
    }

    const userData = userDoc.data()
    if (userData.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé : rôle admin requis' })
    }

    // Injecter info utilisateur si besoin
    req.user = { uid, ...userData }
    next()

  } catch (err) {
    console.error('Erreur vérification rôle admin :', err)
    res.status(401).json({ error: 'Erreur d’authentification' })
  }
}
