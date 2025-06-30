const express = require('express');
const router = express.Router();
const admin = require('../services/firebaseAdmin');
const auth = require('../middleware/authMiddleware');

const db = admin.firestore();

// GET /api/conversations/existing-or-create?contactUid=...
router.get('/existing-or-create', auth, async (req, res) => {
  const userUid = req.user.uid;
  const contactUid = req.query.contactUid;

  if (!contactUid) {
    return res.status(400).json({ error: 'contactUid requis' });
  }

  const chatId1 = `${userUid}_${contactUid}`;
  const chatId2 = `${contactUid}_${userUid}`;

  try {
    const convoRef1 = db.collection('conversations').doc(chatId1);
    const convoRef2 = db.collection('conversations').doc(chatId2);

    const [doc1, doc2] = await Promise.all([convoRef1.get(), convoRef2.get()]);

    if (doc1.exists) {
      return res.json({ conversationId: chatId1, alreadyExists: true });
    }

    if (doc2.exists) {
      return res.json({ conversationId: chatId2, alreadyExists: true });
    }

    // Aucun chat trouvé, on crée celui avec l'ID chatId1
    await convoRef1.set({
      participants: [userUid, contactUid],
      lastMessage: '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({ conversationId: chatId1, alreadyExists: false });
  } catch (err) {
    console.error('Erreur conversation creation:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
