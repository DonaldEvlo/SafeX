const express = require('express');
const router = express.Router();
const { logMessageSend, getMessageCount } = require('../controllers/messageController');
const checkAdminRole = require('../middleware/checkAdminRole')

router.post('/log', logMessageSend);

router.get('/count',checkAdminRole ,getMessageCount);

module.exports = router;
