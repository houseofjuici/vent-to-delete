const CryptoJS = require('crypto-js');

// Generate a random encryption key
const generateKey = () => {
  return CryptoJS.lib.WordArray.random(256/8).toString();
};

// Encrypt message with key
const encrypt = (message, key) => {
  return CryptoJS.AES.encrypt(message, key).toString();
};

// Decrypt message with key
const decrypt = (encryptedMessage, key) => {
  const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Extract key from URL fragment
const getKeyFromUrl = () => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    return params.get('key');
  }
  return null;
};

module.exports = {
  generateKey,
  encrypt,
  decrypt,
  getKeyFromUrl
};
