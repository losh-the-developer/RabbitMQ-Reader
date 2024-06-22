const { defineConfig } = require('@vue/cli-service')

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the parent directory
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
const envConfig = dotenv.parse(fs.readFileSync(envPath));
for (const k in envConfig) {
 process.env[k] = envConfig[k];
}
} else {
console.error(`.env file not found at ${envPath}`);
process.exit(1);
}


module.exports = defineConfig({
  transpileDependencies: true
})
