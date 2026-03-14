const crypto = require('crypto');

const generateSecret = () => {
  // Generate 64 bytes = 512 bits of randomness
  const bytes = crypto.randomBytes(64);
  
  // Convert to base64 (shorter than hex)
  const base64 = bytes.toString('base64');
  
  // Remove non-alphanumeric for cleaner URLs if needed
  const clean = base64.replace(/[^a-zA-Z0-9]/g, '');
  
  console.log('\n=== JWT SECRET GENERATOR ===\n');
  console.log('Base64 (recommended):');
  console.log(base64);
  console.log('\nAlphanumeric only:');
  console.log(clean.substring(0, 64));
  console.log('\nHex (alternative):');
  console.log(bytes.toString('hex'));
  console.log('\n=== COPY ONE OF ABOVE TO YOUR .env FILE ===\n');
};

generateSecret();