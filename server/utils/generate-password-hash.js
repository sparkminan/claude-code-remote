const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Password Hash Generator');
console.log('======================\n');

rl.question('Enter password to hash: ', async (password) => {
  rl.question('Enter salt rounds (default: 10): ', async (rounds) => {
    const saltRounds = parseInt(rounds) || 10;
    
    try {
      const hash = await bcrypt.hash(password, saltRounds);
      
      console.log('\n✅ Password hash generated successfully!');
      console.log('\nHash:');
      console.log(hash);
      console.log('\nAdd this to your .env file:');
      console.log(`DEFAULT_PASSWORD_HASH=${hash}`);
      
      // Verify the hash
      const isValid = await bcrypt.compare(password, hash);
      console.log(`\n✓ Hash verification: ${isValid ? 'PASSED' : 'FAILED'}`);
      
    } catch (error) {
      console.error('\n❌ Error generating hash:', error.message);
    }
    
    rl.close();
  });
});