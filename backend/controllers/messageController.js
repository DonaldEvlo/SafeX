const admin = require('../services/firebaseAdmin');
const logAudit = require('../middleware/auditLogger');

exports.logMessageSend = async (req, res) => {
   console.log('[DEBUG] Body reçu dans logMessageSend:', req.body);
  const { senderId, recipientId, text } = req.body;
  

  if (!senderId || !recipientId || !text) {
    return res.status(400).json({ error: 'senderId, recipientId et text sont requis' });
  }

  try {
    await logAudit('Message envoyé', senderId, {
      to: recipientId,
      message: text
    });

    res.status(200).json({ message: 'Message audité' });
  } catch (err) {
    console.error('[Audit] Erreur audit message:', err);
    res.status(500).json({ error: 'Erreur lors de l’audit du message' });
  }
};

exports.getMessageCount = async (req, res) => {
  try {
    console.log('🔍 Démarrage du comptage des messages...');

    // Requête sur toutes les sous-collections nommées "messages"
    const messagesSnapshot = await admin.firestore()
      .collectionGroup('messages')
      .get();

    console.log(`📊 Nombre total de messages récupérés : ${messagesSnapshot.size}`);

    // Optionnel : afficher les IDs des messages pour debug
    messagesSnapshot.docs.forEach(doc => {
      console.log(`Message ID: ${doc.id}`);
    });

    res.status(200).json({ count: messagesSnapshot.size });
  } catch (err) {
    console.error('❌ Erreur récupération messages:', err);
    res.status(500).json({ error: 'Erreur serveur (getMessageCount)' });
  }
};
