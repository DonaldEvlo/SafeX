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
