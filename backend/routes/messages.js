const express = require('express');
const router = express.Router();
const { logMessageSend, getMessageCount } = require('../controllers/messageController');

router.post('/log', logMessageSend);

router.get('/count', getMessageCount);

module.exports = router;
