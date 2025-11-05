const fs = require('fs');
const path = require('path');

// Load the shared Prettier JSON config used by the repo
const configPath = path.join(__dirname, '../.config/prettier/.prettierrc');
module.exports = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
