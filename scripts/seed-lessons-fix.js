/* ================================================================
   TRIVIVERSO - Fix: Reemplaza lecciones existentes con nuevo seed
   Formato correcto: lessons/{lessonId}/questions/{qId}
   ================================================================ */
const fs = require('fs');
const admin = require('firebase-admin');

const args = (() => {
  const a = {};
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--sa') a.sa = process.argv[++i];
    else if (process.argv[i] === '--project') a.project = process.argv[++i];
    else if (process.argv[i] === '--dry') a.dry = true;
  }
  return a;
})();

const sa = require(args.sa);
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: args.project || sa.project_id });
const db = admin.firestore();

// Subject mapping
const SUBJECTS = {
  ciencias: 'cien',
  matematicas: 'mat',
  espanol: 'esp',
  historia: 'hist',
  geografia: 'geo',
  civica: 'civ'
};

async function clearAndReplaceLesson(lessonId, questions, subject, missionNum) {
  // Update lesson document
  await db.collection('lessons').doc(lessonId).set({
    id: lessonId,
    title: `Misión ${missionNum}`,
    subject: subject,
    order: missionNum,
    grade: '5-6',
    updatedAt: new Date().toISOString()
  }, { merge: true });

  // Clear existing questions
  const col = db.collection('lessons').doc(lessonId).collection('questions');
  const existing = await col.get();
  let batch = db.batch(), count = 0;
  for (const doc of existing.docs) {
    batch.delete(doc.ref);
    count++;
    if (count >= 400) { await batch.commit(); batch = db.batch(); count = 0; }
  }
  if (count > 0) await batch.commit();

  // Write new questions (one doc per question)
  batch = db.batch(); 
  let written = 0;
  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi];
    const qId = `q${qi + 1}`;
    const docData = {
      id: qId,
      order: qi + 1,
      type: q.type,
      prompt: q.prompt,
      explanation: q.explanation || '',
      answersAccepted: q.answersAccepted || []
    };
    if (q.options) docData.options = q.options;
    if (q.correctIndex !== undefined) docData.correctIndex = q.correctIndex;
    if (q.answer !== undefined) docData.answer = q.answer;
    if (q.pairs) docData.pairs = q.pairs;
    if (q.tokens) docData.tokens = q.tokens;
    
    batch.set(col.doc(qId), docData, { merge: true });
    written++;
    if (written % 400 === 0) { await batch.commit(); batch = db.batch(); }
  }
  if (written % 400 !== 0) await batch.commit();
  return written;
}

async function processSeedFile(seedFile, subjectKey, firestoreSubject) {
  console.log(`\n📦 Procesando ${subjectKey} desde ${seedFile}...`);
  
  const content = fs.readFileSync(seedFile, 'utf8');
  
  // Execute the seed file in a VM to get the mission array
  const vm = require('vm');
  const arrName = seedFile.includes('matematicas') ? 'MATE_MISIONES' :
                  seedFile.includes('espanol') ? 'ESPANOL_MISIONES' :
                  seedFile.includes('historia') ? 'HISTORIA_MISIONES' :
                  seedFile.includes('geografia') ? 'GEOGRAFIA_MISIONES' :
                  seedFile.includes('civica') ? 'CIVICA_MISIONES' :
                  'CIENCIAS_MISIONES';
  
  // Find where functions start and upload code starts
  const funcStart = content.indexOf('function normalize');
  const uploadStart = content.indexOf('async function seedMundo');
  if (uploadStart === -1) {
    console.error('  No se encontró upload code en el archivo');
    return 0;
  }
  
  const code = content.substring(funcStart, uploadStart);
  
  const mocks = {
    console: console,
    require: () => ({ initializeApp: ()=>{}, firestore: ()=>({}), FieldValue: { serverTimestamp: ()=>"NOW" }, credential: { cert: ()=>({}) } }),
    process: { argv: [], exit: () => {} },
    fs: { existsSync: () => true },
    admin: { firestore: { FieldValue: { serverTimestamp: ()=>"NOW" } }, credential: { cert: () => ({}) }, initializeApp: () => {}, apps: [] }
  };
  
  let misiones;
  try {
    const script = new vm.Script(code + `\n ${arrName};`);
    const ctx = vm.createContext(mocks);
    misiones = script.runInContext(ctx);
  } catch(e) {
    console.error(`  Error al parsear ${seedFile}: ${e.message}`);
    return 0;
  }
  
  console.log(`  Misiones encontradas: ${misiones.length}`);
  
  let totalQuestions = 0;
  for (let i = 0; i < misiones.length; i++) {
    const lessonId = `${firestoreSubject}-${i + 1}`;
    const qs = misiones[i];
    const written = await clearAndReplaceLesson(lessonId, qs, firestoreSubject, i + 1);
    totalQuestions += written;
    if ((i + 1) % 20 === 0) console.log(`  ${i + 1}/${misiones.length} lecciones (${totalQuestions} preguntas)...`);
  }
  
  console.log(`  ✅ ${subjectKey}: ${misiones.length} lecciones, ${totalQuestions} preguntas.`);
  return totalQuestions;
}

(async () => {
  console.log('🔄 REEMPLAZANDO LECCIONES DE TRIVIVERSO...\n');
  
  const seeds = [
    { file: '/tmp/triviaverse/scripts/seed-completo.js', key: 'ciencias', subj: 'cien' },
    { file: '/tmp/triviaverse/scripts/seed-matematicas.js', key: 'matematicas', subj: 'mat' },
    { file: '/tmp/triviaverse/scripts/seed-espanol.js', key: 'espanol', subj: 'esp' },
    { file: '/tmp/triviaverse/scripts/seed-historia.js', key: 'historia', subj: 'hist' },
    { file: '/tmp/triviaverse/scripts/seed-geografia.js', key: 'geografia', subj: 'geo' },
    { file: '/tmp/triviaverse/scripts/seed-civica.js', key: 'civica', subj: 'civ' },
  ];
  
  let grandTotal = 0;
  for (const s of seeds) {
    if (fs.existsSync(s.file)) {
      grandTotal += await processSeedFile(s.file, s.key, s.subj);
    } else {
      console.log(`❌ No existe: ${s.file}`);
    }
  }
  
  console.log(`\n🎉 TOTAL: ${grandTotal} preguntas en Firestore.`);
  process.exit(0);
})().catch(e => { console.error('ERROR:', e); process.exit(1); });
