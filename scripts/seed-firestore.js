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

// Question generators (closed types only)
function qMC(prompt, options, correctIndex, explanation) {
  return { type: 'multiple_choice', prompt, options, correctIndex, explanation };
}
function qTF(prompt, answer, explanation) {
  return { type: 'true_false', prompt, answer, explanation };
}
function qOrder(prompt, tokens, explanation) {
  return { type: 'order_words', prompt, tokens, explanation };
}
function qMatch(prompt, pairs, explanation) {
  // Firestore does not allow nested arrays. Use array of objects instead.
  const pairsObj = (pairs || []).map(([left, right]) => ({ left, right }));
  return { type: 'match_pairs', prompt, pairs: pairsObj, explanation };
}

const CAPITALS = [
  ['Jalisco', 'Guadalajara'],
  ['Yucatán', 'Mérida'],
  ['Nuevo León', 'Monterrey'],
  ['Sonora', 'Hermosillo'],
  ['Sinaloa', 'Culiacán'],
  ['Chiapas', 'Tuxtla Gutiérrez'],
  ['Quintana Roo', 'Chetumal'],
  ['Baja California Sur', 'La Paz'],
];

const ORGANS = [
  ['Pulmones', 'Respirar'],
  ['Corazón', 'Bombear sangre'],
  ['Estómago', 'Digestionar'],
  ['Cerebro', 'Pensar'],
];

const VALUES = [
  ['Respeto', 'No interrumpir'],
  ['Responsabilidad', 'Hacer la tarea'],
  ['Honestidad', 'Decir la verdad'],
  ['Solidaridad', 'Ayudar a otros'],
];

const WORD_TYPES = [
  ['mesa', 'Sustantivo'],
  ['correr', 'Verbo'],
  ['rápido', 'Adjetivo'],
  ['escuela', 'Sustantivo'],
  ['bonito', 'Adjetivo'],
];

function pick(list, idx, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(list[(idx + i) % list.length]);
  }
  return out;
}

function lessonPack(subjectKey, missionN) {
  const m = Number(missionN || 1);
  if (subjectKey === 'mat') {
    const a = (m % 10) + 5;
    const b = ((m * 3) % 10) + 2;
    const sum = a + b;
    const opts = [sum, sum + 1, sum - 1, sum + 2].map(String);
    return [
      qMC(`¿Cuánto es ${a} + ${b}?`, opts, 0, `${a} + ${b} = ${sum}.`),
      qTF('0.5 es igual a 1/2.', true, '0.5 = 1/2.'),
      qMC('¿Cuál número es mayor?', ['0.25', '0.5', '0.75', '0.1'], 2, '0.75 es el mayor.'),
      qOrder('Ordena de menor a mayor:', ['0.25', '0.5', '0.75'], '0.25 < 0.5 < 0.75'),
      qMatch('Relaciona fracción con decimal:', [
        ['1/4', '0.25'],
        ['1/2', '0.5'],
        ['3/4', '0.75'],
      ], 'Equivalencias básicas.'),
      qTF(`${sum} es un número par.`, sum % 2 === 0, 'Los pares terminan en 0,2,4,6,8.'),
    ];
  }

  if (subjectKey === 'esp') {
    const wt = pick(WORD_TYPES, m, 3);
    const pairs = wt.map(([w, t]) => [w, t]);
    const noun = wt.find((x) => x[1] === 'Sustantivo')?.[0] || 'mesa';
    return [
      qMC('¿Cuál de estas palabras es un sustantivo?', ['correr', noun, 'rápido', 'azul'], 1, 'Sustantivo nombra cosas/personas/lugares.'),
      qTF('Los verbos expresan acciones.', true, 'Ej.: correr, jugar, comer.'),
      qMC('¿Cuál es un verbo?', ['mesa', 'correr', 'azul', 'rápido'], 1, 'Correr es un verbo.'),
      qOrder('Ordena para formar una oración:', ['El', 'niño', 'juega'], 'El niño juega.'),
      qMatch('Relaciona la palabra con su tipo:', pairs, 'Sustantivo nombra, verbo acción, adjetivo describe.'),
      qTF('Los adjetivos describen a los sustantivos.', true, 'Ej.: casa bonita.'),
    ];
  }

  if (subjectKey === 'geo') {
    const cap = pick(CAPITALS, m, 3);
    return [
      qMC('¿En qué continente está México?', ['Europa', 'América', 'Asia', 'África'], 1, 'México está en América.'),
      qTF('México tiene costas en el Océano Pacífico y en el Atlántico.', true, 'Pacífico y Golfo/Caribe (Atlántico).'),
      qOrder('Ordena de norte a sur (aprox.):', ['Sonora', 'Jalisco', 'Chiapas'], 'Sonora → Jalisco → Chiapas.'),
      qMatch('Relaciona el estado con su capital:', cap, 'Capitales comunes en primaria.'),
      qMC('¿Cuál es la capital de México?', ['Guadalajara', 'CDMX', 'Monterrey', 'Mérida'], 1, 'CDMX.'),
      qTF('Un mapa sirve para ubicar lugares.', true, 'Un mapa muestra ubicación.'),
    ];
  }

  if (subjectKey === 'cien') {
    const org = pick(ORGANS, m, 3);
    return [
      qMC('¿Cuál es un estado de la materia?', ['Sólido', 'Rápido', 'Fuerte', 'Alto'], 0, 'Sólido es un estado de la materia.'),
      qTF('El agua hierve aproximadamente a 100°C al nivel del mar.', true, 'En condiciones normales.'),
      qOrder('Ordena el ciclo del agua:', ['Evaporación', 'Condensación', 'Precipitación'], 'Evaporación → Condensación → Precipitación.'),
      qMatch('Relaciona el órgano con su función:', org, 'Funciones básicas del cuerpo humano.'),
      qMC('¿Qué necesitamos para respirar?', ['Aire', 'Arena', 'Hielo', 'Papel'], 0, 'Necesitamos aire.'),
      qTF('Las plantas producen oxígeno.', true, 'En fotosíntesis producen oxígeno.'),
    ];
  }

  if (subjectKey === 'hist') {
    return [
      qMC('¿Qué es una línea del tiempo?', ['Un mapa', 'Un orden de eventos', 'Un cuento', 'Una canción'], 1, 'Ordena eventos.'),
      qTF('La historia estudia hechos del pasado.', true, 'Se enfoca en el pasado.'),
      qMC('¿Cuántos años tiene un siglo?', ['10', '50', '100', '1000'], 2, 'Un siglo = 100 años.'),
      qOrder('Ordena de más antiguo a más reciente:', ['Abuelos', 'Papás', 'Hijos'], 'Abuelos → Papás → Hijos.'),
      qMatch('Relaciona concepto con ejemplo:', [
        ['Fuente histórica', 'Fotografía'],
        ['Lugar', 'Ciudad'],
        ['Fecha', '15 de septiembre'],
      ], 'Ejemplos sencillos.'),
      qTF('Una fotografía puede ser una fuente histórica.', true, 'Sí, puede serlo.'),
    ];
  }

  if (subjectKey === 'civ') {
    const vals = pick(VALUES, m, 3);
    return [
      qMC('¿Qué es respetar?', ['Empujar', 'Escuchar y cuidar', 'Gritar', 'Ignorar'], 1, 'Respetar es tratar bien.'),
      qTF('Decir la verdad ayuda a la confianza.', true, 'Honestidad fortalece confianza.'),
      qOrder('Ordena para resolver un conflicto:', ['Calmarme', 'Escuchar', 'Hablar con respeto'], 'Calmarme → Escuchar → Hablar con respeto.'),
      qMatch('Relaciona valor con acción:', vals, 'Valores en acciones.'),
      qMC('¿Qué es cooperar?', ['Ayudar en equipo', 'Burlar', 'Ignorar', 'Romper'], 0, 'Cooperar es ayudar en equipo.'),
      qTF('Compartir puede mejorar la convivencia.', true, 'Compartir ayuda a convivir.'),
    ];
  }

  // fallback
  return [
    qTF('Pregunta de prueba', true, 'OK'),
    qTF('Pregunta de prueba', true, 'OK'),
    qTF('Pregunta de prueba', true, 'OK'),
    qTF('Pregunta de prueba', true, 'OK'),
    qTF('Pregunta de prueba', true, 'OK'),
    qTF('Pregunta de prueba', true, 'OK'),
  ];
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

async function clearQuestions(lessonId) {
  const col = db.collection('lessons').doc(lessonId).collection('questions');
  const snap = await col.get();
  if (snap.empty) return;
  let batch = db.batch();
  let n = 0;
  for (const d of snap.docs) {
    batch.delete(d.ref);
    n++;
    if (n >= 400) {
      if (!args.dry) await batch.commit();
      batch = db.batch();
      n = 0;
    }
  }
  if (n) {
    if (!args.dry) await batch.commit();
  }
}

async function upsertQuestions(lessonId, questions) {
  const col = db.collection('lessons').doc(lessonId).collection('questions');

  await clearQuestions(lessonId);

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

  // Seed lessons + questions (50 missions per subject)
  const MISSIONS_PER_SUBJECT = 50;

  let totalQ = 0;
  for (let si = 0; si < SUBJECTS.length; si++) {
    const s = SUBJECTS[si];
    for (let m = 1; m <= MISSIONS_PER_SUBJECT; m++) {
      const lessonId = `${s.key}-${m}`;
      const lesson = {
        id: lessonId,
        title: `${s.title} · Misión ${m}`,
        subject: s.key,
        grade: '5-6',
        order: si * 1000 + m,
        updatedAt: nowIso(),
      };
      await upsertLesson(lesson);

      const pack = lessonPack(s.key, m).map((q, idx) => ({
        id: `q${idx + 1}`,
        order: idx + 1,
        ...q,
        // legacy fields used by current UI (kept empty; we removed open answers)
        answersAccepted: [],
      }));

      const wrote = await upsertQuestions(lessonId, pack);
      totalQ += wrote;
      if (m === 1 || m === MISSIONS_PER_SUBJECT || m % 10 === 0) {
        console.log('seeded lesson', lessonId, 'questions', wrote);
      }
    }
  }

  console.log('DONE. Total questions:', totalQ);
  console.log('Now open: https://mbcx07.github.io/triviaverse/ and login.');
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
