const logAudit = require('../middleware/auditLogger');

exports.logUserAction = async (req, res) => {
  const { userId, action } = req.body;

  if (!userId || !action) {
    return res.status(400).json({ error: 'userId et action requis' });
  }

  try {
    console.log('[Audit] Audit de l’action utilisateur:', action, 'par', userId);
    await logAudit(action, userId);
    res.status(200).json({ message: 'Audit enregistré' });
  } catch (err) {
    console.error('[Audit] Erreur audit utilisateur:', err);
    res.status(500).json({ error: 'Erreur lors de l’audit' });
  }
};
