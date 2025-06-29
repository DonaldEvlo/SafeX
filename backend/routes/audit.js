const express = require('express');
const router = express.Router();
const { logUserAction, getAllLogs } = require('../controllers/auditController');

router.post('/', logUserAction);
router.get('/', getAllLogs)
module.exports = router;
