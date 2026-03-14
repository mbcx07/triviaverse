const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) throw new Error('usage: node replace-name.js <file>');

let c = fs.readFileSync(file, 'utf8');
c = c.replace(/Triviaverse/g, 'Triviverso');
fs.writeFileSync(file, c, 'utf8');
console.log('updated', file);
