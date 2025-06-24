const express = require('express');
const router = express.Router();
const { logMessageSend } = require('../controllers/messageController');

router.post('/log', logMessageSend);

module.exports = router;
