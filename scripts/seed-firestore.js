/* Seed Firestore for Triviverso (SEP MX 5º-6º)
   Usage (PowerShell):
     node scripts/seed-firestore.js --sa "C:\\secrets\\triviverso.json" --project triviverso

   Notes:
   - Creates lessons + questions under lessons/{lessonId}/questions.
   - Also optionally creates initial free-team users in users/{nicknameNorm}.
*/

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--sa') out.sa = argv[++i];
    else if (a === '--project') out.project = argv[++i];
    else if (a === '--dry') out.dry = true;
  }
  return out;
}

function normalize(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-');
}

function nowIso() {
  return new Date().toISOString();
}

const args = parseArgs(process.argv);
if (!args.sa) {
  console.error('Missing --sa <service-account.json path>');
  process.exit(2);
}

const saPath = args.sa;
if (!fs.existsSync(saPath)) {
  console.error('Service account not found:', saPath);
  process.exit(2);
}

const admin = require('firebase-admin');
const serviceAccount = require(saPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: args.project || serviceAccount.project_id,
});

const db = admin.firestore();

// ---- Config ----
const FREE_USERS = [
  { nickname: 'Amelia', pin: '1703' },
  { nickname: 'Isabela', pin: '1234' },
  { nickname: 'Milan', pin: '1234' },
  { nickname: 'Lili', pin: '1234' },
];

const SUBJECTS = [
  { key: 'mat', title: 'Matemáticas' },
  { key: 'esp', title: 'Español' },
  { key: 'cien', title: 'Ciencias Naturales' },
  { key: 'hist', title: 'Historia' },
  { key: 'geo', title: 'Geografía' },
  { key: 'civ', title: 'Formación Cívica y Ética' },
];

// Basic question generators (starter pack). We will extend to full 200 later.
function qWrite(prompt, answersAccepted, explanation) {
  return { type: 'write', prompt, answersAccepted, explanation };
}
function qMC(prompt, options, correctIndex, explanation) {
  return { type: 'multiple_choice', prompt, options, correctIndex, explanation };
}
function qTF(prompt, answer, explanation) {
  return { type: 'true_false', prompt, answer, explanation };
}
function qFill(prompt, answer, explanation) {
  return { type: 'fill_blank', prompt, answer, explanation };
}
function qOrder(prompt, tokens, explanation) {
  return { type: 'order_words', prompt, tokens, explanation };
}
function qMatch(prompt, pairs, explanation) {
  // Firestore does not allow nested arrays. Use array of objects instead.
  const pairsObj = (pairs || []).map(([left, right]) => ({ left, right }));
  return { type: 'match_pairs', prompt, pairs: pairsObj, explanation };
}

function lessonPack(subjectKey) {
  switch (subjectKey) {
    case 'geo':
      return [
        qWrite('¿Cuál es la capital de México?', ['Ciudad de México', 'CDMX'], 'La capital de México es la Ciudad de México (CDMX).'),
        qMC('¿En qué continente está México?', ['Europa', 'América', 'Asia', 'África'], 1, 'México está en el continente americano.'),
        qTF('México tiene costas en el Océano Pacífico y en el Atlántico.', true, 'Tiene costas en el Pacífico y en el Golfo de México/Caribe (Atlántico).'),
        qFill('El estado donde se encuentra Cancún es ________.', 'Quintana Roo', 'Cancún está en Quintana Roo.'),
        qOrder('Ordena de norte a sur (aprox.):', ['Sonora', 'Jalisco', 'Chiapas'], 'Sonora (norte) → Jalisco (centro-occidente) → Chiapas (sur).'),
        qMatch('Relaciona el estado con su capital:', [
          ['Jalisco', 'Guadalajara'],
          ['Yucatán', 'Mérida'],
          ['Nuevo León', 'Monterrey'],
        ], 'Son capitales comunes en primaria.'),
      ];
    case 'mat':
      return [
        qMC('¿Cuánto es 3/4 de 20?', ['5', '10', '15', '20'], 2, '20 × 3/4 = 15.'),
        qWrite('Escribe el resultado: 125 + 75 =', ['200'], '125 + 75 = 200.'),
        qTF('0.5 es igual a 1/2.', true, '0.5 = 1/2.'),
        qFill('El perímetro de un cuadrado de lado 6 cm es ________ cm.', '24', 'Perímetro = 4×6 = 24.'),
        qOrder('Ordena de menor a mayor:', ['0.25', '0.5', '0.75'], '0.25 < 0.5 < 0.75'),
        qMatch('Relaciona fracción con decimal:', [
          ['1/4', '0.25'],
          ['1/2', '0.5'],
          ['3/4', '0.75'],
        ], 'Equivalencias básicas.'),
      ];
    case 'cien':
      return [
        qMC('¿Cuál es un estado de la materia?', ['Sólido', 'Rápido', 'Fuerte', 'Alto'], 0, 'Sólido es un estado de la materia.'),
        qTF('El agua hierve aproximadamente a 100°C al nivel del mar.', true, 'En condiciones normales, hierve cerca de 100°C.'),
        qFill('La energía del Sol que llega a la Tierra se llama energía ________.', 'solar', 'Es energía solar.'),
        qOrder('Ordena el ciclo del agua:', ['Evaporación', 'Condensación', 'Precipitación'], 'Evaporación → Condensación → Precipitación.'),
        qMatch('Relaciona el órgano con su función:', [
          ['Pulmones', 'Respirar'],
          ['Corazón', 'Bombear sangre'],
          ['Estómago', 'Digestionar'],
        ], 'Funciones básicas del cuerpo humano.'),
        qWrite('Escribe un ejemplo de animal ovíparo:', ['gallina', 'tortuga', 'pez', 'rana'], 'Los ovíparos nacen de huevos.'),
      ];
    case 'hist':
      return [
        qMC('¿Qué es una línea del tiempo?', ['Un mapa', 'Un orden de eventos', 'Un cuento', 'Una canción'], 1, 'Sirve para ordenar eventos en el tiempo.'),
        qTF('La historia estudia hechos del pasado.', true, 'Sí, se enfoca en el pasado.'),
        qFill('Un siglo tiene ________ años.', '100', 'Un siglo = 100 años.'),
        qOrder('Ordena de más antiguo a más reciente:', ['Abuelos', 'Papás', 'Hijos'], 'Abuelos → Papás → Hijos.'),
        qMatch('Relaciona concepto con ejemplo:', [
          ['Fuente histórica', 'Fotografía'],
          ['Lugar', 'Ciudad'],
          ['Fecha', '15 de septiembre'],
        ], 'Ejemplos sencillos.'),
        qWrite('Escribe una fuente histórica que puedas encontrar en casa:', ['foto', 'fotografia', 'carta', 'acta'], 'Ejemplos: fotos, cartas, documentos.'),
      ];
    case 'civ':
      return [
        qMC('¿Qué es respetar?', ['Empujar', 'Escuchar y cuidar', 'Gritar', 'Ignorar'], 1, 'Respetar es tratar bien y considerar a otros.'),
        qTF('Decir la verdad ayuda a la confianza.', true, 'La honestidad fortalece la confianza.'),
        qFill('Cuando compartimos, practicamos la ________.', 'solidaridad', 'Compartir y ayudar es solidaridad.'),
        qOrder('Ordena para resolver un conflicto:', ['Calmarme', 'Escuchar', 'Hablar con respeto'], 'Primero calmarse, luego escuchar y hablar con respeto.'),
        qMatch('Relaciona valor con acción:', [
          ['Responsabilidad', 'Hacer la tarea'],
          ['Respeto', 'No interrumpir'],
          ['Honestidad', 'Decir la verdad'],
        ], 'Valores en acciones.'),
        qWrite('Escribe una norma que ayude en tu salón:', ['no gritar', 'levantar la mano', 'respetar turnos', 'no empujar'], 'Normas mejoran la convivencia.'),
      ];
    default:
      return [
        qWrite(`Pregunta demo de ${subjectKey}: escribe "ok"`, ['ok'], 'Demo.'),
      ];
  }
}

async function upsertUser(u) {
  const id = normalize(u.nickname);
  const ref = db.collection('users').doc(id);
  const snap = await ref.get();
  const data = {
    nickname: u.nickname,
    nicknameNorm: id,
    pin: String(u.pin),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    seededAt: nowIso(),
    plan: 'free',
  };
  if (!snap.exists) {
    if (!args.dry) await ref.set(data);
    console.log('created user', id);
  } else {
    if (!args.dry) await ref.set({ ...data, createdAt: snap.data().createdAt || data.createdAt }, { merge: true });
    console.log('updated user', id);
  }
}

async function upsertLesson(lesson) {
  const ref = db.collection('lessons').doc(lesson.id);
  if (!args.dry) await ref.set(lesson, { merge: true });
}

async function upsertQuestions(lessonId, questions) {
  const col = db.collection('lessons').doc(lessonId).collection('questions');
  // write in batches of 400 (Firestore limit 500)
  let batch = db.batch();
  let n = 0;
  let written = 0;

  for (const q of questions) {
    const docId = q.id;
    const ref = col.doc(docId);
    batch.set(ref, q, { merge: true });
    n++;
    written++;
    if (n >= 400) {
      if (!args.dry) await batch.commit();
      batch = db.batch();
      n = 0;
    }
  }
  if (n) {
    if (!args.dry) await batch.commit();
  }
  return written;
}

async function main() {
  console.log('Seeding Triviverso Firestore', { project: args.project || serviceAccount.project_id, dry: !!args.dry });

  // Seed free users
  for (const u of FREE_USERS) {
    await upsertUser(u);
  }

  // Seed lessons + questions (starter pack)
  let order = 1;
  let totalQ = 0;
  for (const s of SUBJECTS) {
    const lessonId = `${s.key}-1`;
    const lesson = {
      id: lessonId,
      title: `${s.title} · Unidad 1`,
      subject: s.key,
      grade: '5-6',
      order,
      updatedAt: nowIso(),
    };
    await upsertLesson(lesson);

    const pack = lessonPack(s.key).map((q, idx) => ({
      id: `q${idx + 1}`,
      order: idx + 1,
      ...q,
      // legacy fields used by current UI (until we migrate renderer)
      answersAccepted: q.answersAccepted || (q.answer ? [String(q.answer)] : []),
    }));

    const wrote = await upsertQuestions(lessonId, pack);
    totalQ += wrote;
    console.log('seeded lesson', lessonId, 'questions', wrote);
    order++;
  }

  console.log('DONE. Total questions:', totalQ);
  console.log('Now open: https://mbcx07.github.io/triviaverse/ and login.');
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
