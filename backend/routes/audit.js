const express = require('express');
const router = express.Router();
const { logUserAction, getAllLogs, getWeeklyLogins } = require('../controllers/auditController');
const checkAdminRole = require('../middleware/checkAdminRole')

router.post('/', logUserAction);
router.get('/',checkAdminRole, getAllLogs);
router.get('/logins-week',checkAdminRole ,getWeeklyLogins);
module.exports = router;
