// auth.js - Système 2FA local complet (sans Firebase MFA payant)

const express = require('express')
const router = express.Router()
const admin = require('../services/firebaseAdmin')
const verifyToken = require('../middleware/authMiddleware');
const { sendWhatsAppOTP } = require('../utils/otp');
require('dotenv').config();
// 🔐 Session storage en mémoire (remplacer par Redis en production)
const userSessions = new Map();

// 📱 Configuration 2FA locale
const LOCAL_2FA_CONFIG = {
  enabled: true, // 🎯 Activer/désactiver globalement la 2FA
  codeLength: 6,
  expirationMinutes: 3,
  maxAttempts: 3
};

// Enregistrement utilisateur
router.post('/signup', async (req, res) => {
  const { token, name, username } = req.body

  try {
    const decoded = await admin.auth().verifyIdToken(token)
    const uid = decoded.uid
    const email = decoded.email

    const firstInitial = name?.trim()?.charAt(0)?.toUpperCase() || 'U'
    const profileUrl = `https://ui-avatars.com/api/?name=${firstInitial}&background=random`

    const userRef = admin.firestore().collection('users').doc(uid)
    const doc = await userRef.get()

    if (!doc.exists) {
      console.log('📝 Création utilisateur avec 2FA locale activée...')
      await userRef.set({
        uid,
        email,
        name,
        username,
        role: 'user',
        profileUrl,
        // 🔐 2FA locale (pas Firebase MFA payant)
        local2faEnabled: LOCAL_2FA_CONFIG.enabled,
        phoneNumber: null, // À configurer plus tard
        createdAt: new Date().toISOString()
      })
      console.log('✅ Utilisateur créé avec 2FA locale')
    }

    res.status(201).json({ message: 'Utilisateur enregistré', uid })
  } catch (error) {
    console.error('Erreur signup:', error)
    res.status(401).json({ error: 'Token invalide' })
  }
})

// Connexion
router.post('/login', async (req, res) => {
  const { token } = req.body

  try {
    const decoded = await admin.auth().verifyIdToken(token)
    
    // 🧹 Nettoyer les anciennes sessions
    cleanExpiredSessions();
    
    res.status(200).json({ 
      message: 'Connexion réussie', 
      uid: decoded.uid, 
      email: decoded.email 
    })
  } catch (error) {
    console.error('Erreur login:', error)
    res.status(401).json({ error: 'Token invalide' })
  }
})

// 🔍 Vérification statut 2FA locale
router.post('/mfa-status', verifyToken, async (req, res) => {
  try {
    const userRef = admin.firestore().collection('users').doc(req.user.uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const userData = userDoc.data();
    
    // 🔐 Vérifier si 2FA locale activée (pas Firebase MFA)
    const local2faEnabled = userData.local2faEnabled ?? LOCAL_2FA_CONFIG.enabled;
    
    console.log(`🔍 Vérification 2FA locale pour ${req.user.email}:`);
    console.log(`   - 2FA locale activée: ${local2faEnabled}`);
    
    // Vérifier session active
    const session = userSessions.get(req.user.uid);
    const sessionValid = session && session.verified && session.expires > Date.now();
    
    console.log(`   - Session validée: ${sessionValid}`);
    
    if (local2faEnabled && !sessionValid) {
      console.log(`   → 2FA locale requise pour ${req.user.email}`);
      return res.json({ 
        mfaRequired: true,
        mfaEnabled: true,
        type: 'local' // Pas Firebase MFA
      });
    }

    console.log(`   → Accès autorisé pour ${req.user.email}`);
    res.json({ 
      mfaRequired: false, 
      mfaEnabled: local2faEnabled,
      type: 'local'
    });
    
  } catch (error) {
    console.error('Erreur vérification 2FA locale:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 📤 Envoi OTP local
router.post('/send-otp', verifyToken, async (req, res) => {
  try {
    const userRef = admin.firestore().collection('users').doc(req.user.uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const userData = userDoc.data();
    
    // Vérifier tentatives précédentes
    const existingSession = userSessions.get(req.user.uid);
    if (existingSession && existingSession.attempts >= LOCAL_2FA_CONFIG.maxAttempts) {
      const timeLeft = Math.ceil((existingSession.blockUntil - Date.now()) / 1000 / 60);
      return res.status(429).json({ 
        error: `Trop de tentatives. Réessayez dans ${timeLeft} minutes.` 
      });
    }
    
    // 📱 Utiliser numéro admin pour les tests
    const adminPhone = process.env.ADMIN_PHONE;
    if (!adminPhone) {
      return res.status(500).json({ 
        error: 'Configuration ADMIN_PHONE manquante' 
      });
    }

    console.log(`📤 Génération OTP local pour: ${userData.email}`);
    console.log(`📱 Envoi vers admin WhatsApp: ${adminPhone}`);
    
    // 🎲 Générer code local
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + (LOCAL_2FA_CONFIG.expirationMinutes * 60 * 1000);
    
    try {
      // Envoyer via WhatsApp
      await sendWhatsAppOTP(adminPhone, code, userData.email);
      
      // Stocker session
      userSessions.set(req.user.uid, {
        code,
        expires,
        attempts: (existingSession?.attempts || 0),
        userEmail: userData.email,
        userName: userData.name,
        verified: false,
        sentAt: new Date().toISOString()
      });

      console.log(`✅ Code ${code} généré et envoyé`);

      res.json({ 
        message: '✅ Code envoyé via WhatsApp',
        note: '⚠️ Mode test: Code envoyé au numéro administrateur',
        expiresIn: LOCAL_2FA_CONFIG.expirationMinutes
      });
      
    } catch (smsError) {
      console.error('❌ Erreur envoi WhatsApp:', smsError);
      
      // 🧪 Mode développement: retourner le code dans la réponse
      if (process.env.NODE_ENV === 'development') {
        userSessions.set(req.user.uid, {
          code,
          expires,
          attempts: 0,
          userEmail: userData.email,
          verified: false,
          sentAt: new Date().toISOString()
        });
        
        res.json({ 
          message: '🧪 Mode DEV: Code généré',
          note: `Code de test: ${code}`,
          devCode: code // ⚠️ Uniquement en DEV !
        });
      } else {
        throw smsError;
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur send-otp local:', error);
    res.status(500).json({ 
      error: `Erreur génération OTP: ${error.message}`
    });
  }
});

// ✅ Vérification OTP local
router.post('/verify-otp', verifyToken, async (req, res) => {
  const { otp } = req.body;
  
  try {
    const session = userSessions.get(req.user.uid);

    console.log(`🔍 Vérification OTP local pour ${req.user.uid}:`);
    console.log(`   - Code saisi: ${otp}`);

    if (!session) {
      return res.status(400).json({ 
        error: 'Aucun code généré. Demandez un nouveau code.' 
      });
    }

    if (Date.now() > session.expires) {
      userSessions.delete(req.user.uid);
      return res.status(400).json({ 
        error: 'Code expiré. Demandez un nouveau code.' 
      });
    }

    if (otp !== session.code) {
      // Incrémenter tentatives
      session.attempts = (session.attempts || 0) + 1;
      
      if (session.attempts >= LOCAL_2FA_CONFIG.maxAttempts) {
        session.blockUntil = Date.now() + (15 * 60 * 1000); // Bloquer 15min
        console.log(`🚫 Utilisateur ${req.user.uid} bloqué après ${session.attempts} tentatives`);
        return res.status(429).json({ 
          error: 'Trop de tentatives incorrectes. Compte temporairement bloqué.' 
        });
      }
      
      userSessions.set(req.user.uid, session);
      return res.status(400).json({ 
        error: `Code invalide. ${LOCAL_2FA_CONFIG.maxAttempts - session.attempts} tentatives restantes.` 
      });
    }

    // ✅ Code valide → créer session longue durée
    userSessions.set(req.user.uid, {
      verified: true,
      expires: Date.now() + (2 * 60 * 1000), // 2 minutes, ou même Date.now() + 1 pour 1ms
      userEmail: session.userEmail,
      verifiedAt: new Date().toISOString()
    });
    
    console.log(`✅ 2FA locale validée pour ${req.user.uid}`);
    
    userSessions.delete(req.user.uid); // Supprime la session après vérification
    
    res.json({ 
      message: 'Vérification réussie',
      sessionDuration: '24 heures'
    });
    
  } catch (error) {
    console.error('❌ Erreur verify-otp local:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 🧹 Nettoyage automatique des sessions expirées
function cleanExpiredSessions() {
  const now = Date.now();
  for (const [uid, session] of userSessions.entries()) {
    if (session.expires && session.expires < now) {
      userSessions.delete(uid);
      console.log(`🧹 Session expirée nettoyée pour ${uid}`);
    }
  }
}

// Nettoyage périodique (toutes les heures)
setInterval(cleanExpiredSessions, 60 * 60 * 1000);

module.exports = router