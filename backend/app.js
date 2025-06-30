// backend/app.js
const express = require('express');
const cors = require('cors');
const app = express();

const contactsRoute = require('./routes/contacts');
const authRoutes = require('./routes/auth');
const auditRoutes = require('./routes/audit');
const chatsRoutes = require('./routes/chats');

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('👋 Bienvenue sur l’API SafeX 🚀');
});

app.use('/api/auth', authRoutes);
app.use('/api/messages', require('./routes/messages'));
app.use('/api/audit', auditRoutes);
app.use('/api/users', require('./routes/users'));
app.use('/api/contacts', contactsRoute);
app.use('/api/chats', chatsRoutes);

module.exports = app;
