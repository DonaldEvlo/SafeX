const express = require('express');
const router = express.Router();
const { logUserAction, getAllLogs, getWeeklyLogins } = require('../controllers/auditController');

router.post('/', logUserAction);
router.get('/', getAllLogs);
router.get('/logins-week', getWeeklyLogins);
module.exports = router;
