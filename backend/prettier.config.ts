import fs from 'fs';
export default JSON.parse(fs.readFileSync('../.config/prettier/.prettierrc', 'utf-8'));
