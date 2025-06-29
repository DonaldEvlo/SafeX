const admin = require('../services/firebaseAdmin')

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


exports.getAllLogs = async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('audit_logs')
      .orderBy('timestamp', 'desc')
      .limit(100) // facultatif : limite à 100 logs
      .get()

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    res.status(200).json(logs)
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des logs :', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des logs' })
  }
}
