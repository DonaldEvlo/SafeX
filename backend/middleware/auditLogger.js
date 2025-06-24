const admin = require('../services/firebaseAdmin');

const db = admin.firestore();

async function logAudit(action, userId, details = {}) {
  const log = {
    userId,
    action,
    details,
    timestamp: new Date()
  };

  await db.collection('audit_logs').add(log);
}

module.exports = logAudit;


