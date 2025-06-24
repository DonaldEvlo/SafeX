const express = require('express');
const router = express.Router();
const { logUserAction } = require('../controllers/auditController');

router.post('/', logUserAction);

module.exports = router;
