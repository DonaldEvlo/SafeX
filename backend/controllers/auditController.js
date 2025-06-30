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

exports.getWeeklyLogins = async (req, res) => {
  try {
    const today = new Date();
    // Remise à 0 de l'heure pour comparer uniquement la date
    today.setHours(0, 0, 0, 0);

    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 6); // 7 jours

    const auditLogsRef = admin.firestore().collection('audit_logs');

    const snapshot = await auditLogsRef
      .where('action', '==', 'Connexion')
      .where('timestamp', '>=', lastWeek)
      .get();

    console.log(`Nombre de logs trouvés : ${snapshot.size}`);

    // Préparer le comptage par jour (0=dimanche,...6=samedi)
    const counts = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data.timestamp) {
        console.warn(`Log sans timestamp: ${doc.id}`);
        return;
      }
      // Convertir en Date JS
      const tsDate = data.timestamp.toDate();
      const day = tsDate.getDay();
      counts[day]++;
    });

    // Créer un tableau ordonné Dim - Sam avec les abbréviations françaises
    const days = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];

    const result = days.map((day, index) => ({
      date: day,
      value: counts[index] || 0
    }));

    res.json(result);

  } catch (error) {
    console.error('Erreur récupération connexions semaine:', error);
    res.status(500).json({ error: error.message });
  }
};