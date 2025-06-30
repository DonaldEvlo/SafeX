const express = require('express')
const router = express.Router()
const admin = require('../services/firebaseAdmin')
const db = admin.firestore()
const auth = require('../middleware/authMiddleware')
const Contact = require('../models/Contact')

// GET /api/contacts
router.get('/', auth, async (req, res) => {
  try {
    const userUid = req.user.uid
    const contactsRef = db.collection('users').doc(userUid).collection('contacts')
    const snapshot = await contactsRef.get()

    const contacts = snapshot.docs.map(doc => Contact.fromJson({ id: doc.id, ...doc.data() }))
    res.json(contacts.map(c => c.toJson()))
  } catch (error) {
    console.error('Erreur lors de la récupération des contacts :', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

// POST /api/contacts — ajouter un contact
router.post('/', auth, async (req, res) => {
  const userUid = req.user.uid
  const { contactUid } = req.body

  if (!contactUid) return res.status(400).json({ error: 'contactUid requis' })
  if (contactUid === userUid) return res.status(400).json({ error: 'Impossible de s’ajouter soi-même' })

  try {
    // Vérifier que le contact existe
    const contactDocRef = db.collection('users').doc(contactUid)
    const contactDoc = await contactDocRef.get()
    if (!contactDoc.exists) {
      return res.status(404).json({ error: 'Contact non trouvé' })
    }

    // Vérifier si le contact est déjà dans la liste
    const userContactRef = db.collection('users').doc(userUid).collection('contacts').doc(contactUid)
    const userContactDoc = await userContactRef.get()
    if (userContactDoc.exists) {
      return res.status(400).json({ error: 'Contact déjà ajouté' })
    }

    // Ajouter le contact
    const contactData = contactDoc.data()
    await userContactRef.set({
      uid: contactUid,
      name: contactData.name || '',
      email: contactData.email || '',
      profileUrl: contactData.profileUrl || '',
      addedAt: new Date().toISOString()
    })

    res.json({ message: 'Contact ajouté avec succès' })
  } catch (error) {
    console.error('Erreur ajout contact:', error)
    res.status(500).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
