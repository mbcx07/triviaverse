// Diagnostic: find nested arrays in geo questions
const serviceAccount = require('C:\\secrets\\triviverso.json');
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: 'triviverso' });
const db = admin.firestore();

function hasNested(v) {
  return Array.isArray(v) && v.some(item => Array.isArray(item));
}

async function main() {
  // Check all geo lessons since they're the ones failing
  for (let s = 1; s <= 50; s += 9) {
    const lessonId = 'geo-' + s;
    const col = db.collection('lessons').doc(lessonId).collection('questions');
    const snap = await col.get();
    for (const doc of snap.docs) {
      const data = doc.data();
      if (hasNested(data.options)) {
        console.log('NESTED options in', lessonId, doc.id, ':', JSON.stringify(data.options).substring(0, 300));
      }
      if (hasNested(data.tokens)) {
        console.log('NESTED tokens in', lessonId, doc.id, ':', JSON.stringify(data.tokens).substring(0, 300));
      }
      if (data.pairs && hasNested(data.pairs)) {
        console.log('NESTED pairs in', lessonId, doc.id, ':', JSON.stringify(data.pairs).substring(0, 300));
      }
    }
    console.log('Checked geo-' + s);
  }
  console.log('Done');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
