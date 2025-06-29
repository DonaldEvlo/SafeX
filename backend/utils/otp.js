// utils/otp.js - Gestion OTP locale sans Firebase MFA payant

const axios = require('axios');

/**
 * Envoie un code OTP via WhatsApp en utilisant CallMeBot
 * @param {string} phoneNumber - Numéro de téléphone (format international)
 * @param {string} code - Code OTP à envoyer (optionnel, généré automatiquement)
 * @param {string} userEmail - Email de l'utilisateur pour contexte
 * @returns {Promise<string>} Le code OTP envoyé
 */
async function sendWhatsAppOTP(phoneNumber, code = null, userEmail = '') {
  try {
    // Générer code si non fourni
    if (!code) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    console.log(`📱 Envoi OTP WhatsApp vers ${phoneNumber}`);
    console.log(`🔐 Code généré: ${code}`);
    
    // Préparer le message
    const message = `🔐 Code de vérification SafeX
    
Code: ${code}
Utilisateur: ${userEmail}
    
⏰ Valide 3 minutes
⚠️ Ne partagez jamais ce code`;

    // URL CallMeBot (remplacez par vos paramètres)
    const apiKey = process.env.CALLMEBOT_API_KEY;
    if (!apiKey) {
      throw new Error('CALLMEBOT_API_KEY manquant dans .env');
    }
    
    const url = `https://api.callmebot.com/whatsapp.php`;
    const params = {
      phone: phoneNumber.replace('+', ''),
      text: encodeURIComponent(message),
      apikey: apiKey
    };
    
    // Construire URL complète
    const fullUrl = `${url}?${Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join('&')}`;
    
    console.log(`🌐 Appel CallMeBot: ${url}?phone=${params.phone}&text=...&apikey=***`);
    
    // Envoyer requête
    const response = await axios.get(fullUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'SafeX-2FA-Bot/1.0'
      }
    });
    
    console.log(`✅ Réponse CallMeBot:`, response.data);
    
    if (response.status !== 200) {
      throw new Error(`CallMeBot erreur: ${response.status} - ${response.data}`);
    }
    
    return code;
    
  } catch (error) {
    console.error('❌ Erreur sendWhatsAppOTP:', error.message);
    
    // Diagnostic selon le type d'erreur
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error('Impossible de contacter CallMeBot. Vérifiez votre connexion internet.');
    } else if (error.response) {
      throw new Error(`CallMeBot erreur ${error.response.status}: ${error.response.data}`);
    } else if (error.message.includes('API_KEY')) {
      throw new Error('Configuration CallMeBot incorrecte. Vérifiez CALLMEBOT_API_KEY.');
    } else {
      throw error;
    }
  }
}

/**
 * Alternative SMS locale pour tests (simulate)
 */
async function sendSMSOTPLocal(phoneNumber, code = null, userEmail = '') {
  const finalCode = code || Math.floor(100000 + Math.random() * 900000).toString();
  
  console.log(`📧 [SIMULATION SMS] Code ${finalCode} pour ${phoneNumber}`);
  console.log(`   Utilisateur: ${userEmail}`);
  console.log(`   Message: "Votre code SafeX: ${finalCode} (valide 3min)"`);
  
  return finalCode;
}

/**
 * Valider un code OTP (utilitaire)
 */
function validateOTPFormat(otp) {
  if (!otp || typeof otp !== 'string') {
    return { valid: false, error: 'Code requis' };
  }
  
  if (otp.length !== 6) {
    return { valid: false, error: 'Le code doit contenir 6 chiffres' };
  }
  
  if (!/^\d{6}$/.test(otp)) {
    return { valid: false, error: 'Le code ne peut contenir que des chiffres' };
  }
  
  return { valid: true };
}

/**
 * Générer un code OTP sécurisé
 */
function generateSecureOTP(length = 6) {
  const digits = '0123456789';
  let code = '';
  
  // Éviter les codes commençant par 0
  code += digits.charAt(Math.floor(Math.random() * 9) + 1);
  
  for (let i = 1; i < length; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  
  return code;
}

module.exports = {
  sendWhatsAppOTP,
  sendSMSOTPLocal,
  validateOTPFormat,
  generateSecureOTP
};