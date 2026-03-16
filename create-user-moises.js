const admin = require('firebase-admin');

const serviceAccount = require('C:/secrets/triviverso.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function createUser(nickname, pin) {
  const normalize = (s) => s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ');

  const nicknameNorm = normalize(nickname);

  await db.collection('users').doc(nicknameNorm).set({
    nickname,
    nicknameNorm,
    pin,
    teamId: 'belas',
    teamCode: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
    xpTotal: 0,
    streakCount: 0,
    lastPlayDate: null,
  });

  console.log(`Usuario creado: ${nickname} (${nicknameNorm}), PIN: ${pin}`);
}

createUser('Moisés', '1703')
  .then(() => {
    console.log('Listo');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
