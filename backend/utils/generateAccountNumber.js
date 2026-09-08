const crypto = require('crypto');

const generateAccountNumber = () => {
  // Generate a random 8-digit suffix
  const randomNum = Math.floor(10000000 + Math.random() * 90000000);
  return `4082${randomNum}`;
};

module.exports = generateAccountNumber;
