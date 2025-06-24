import CryptoJS from 'crypto-js';

const AES_SECRET = import.meta.env.VITE_AES_SECRET_KEY || 'safe-temp-key';

export function encryptMessage(text) {
  return CryptoJS.AES.encrypt(text, AES_SECRET).toString();
}

export function decryptMessage(cipherText) {
  const bytes = CryptoJS.AES.decrypt(cipherText, AES_SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
}
