/* ================================================================
   TRIVIVERSO - Seed Español | Temario SEP 5° y 6° México
   100 misiones × 12 preguntas ÚNICAS cada una
   Progresión pedagógica real: cada misión enseña algo NUEVO
   ================================================================ */

const fs = require('fs');
const admin = require('firebase-admin');

const args = (() => {
  const a = {};
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--sa') a.sa = process.argv[++i];
    else if (process.argv[i] === '--project') a.project = process.argv[++i];
    else if (process.argv[i] === '--dry') a.dry = true;
    else if (process.argv[i] === '--mundo') a.mundo = process.argv[++i];
  }
  return a;
})();

if (!args.sa) { console.error('Falta --sa (ruta a service account JSON)'); process.exit(1); }

process.env.GOOGLE_APPLICATION_CREDENTIALS = args.sa;
admin.initializeApp({ projectId: args.project || 'triviaverso' });
const db = admin.firestore();

/* ================================================================
   HELPERS
   ================================================================ */
function normalize(s) {
  return String(s || '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

function qMC(prompt, options, correctIndex, explanation) {
  return { type: 'multiple_choice', prompt, options, correctIndex, explanation, answersAccepted: [] };
}
function qTF(prompt, answer, explanation) {
  return { type: 'true_false', prompt, answer, explanation, answersAccepted: [] };
}
function qOrder(prompt, tokens, explanation) {
  return { type: 'order_words', prompt, tokens, explanation, answersAccepted: [] };
}
function qMatch(prompt, pairs, explanation) {
  return { type: 'match_pairs', prompt, pairs, explanation, answersAccepted: [] };
}
function qWrite(prompt, answersAccepted, explanation) {
  return { type: 'write', prompt, answersAccepted, explanation };
}

/* ================================================================
   ESPAÑOL — 100 Misiones progresivas SEP 5°-6°
   ================================================================
   Estructura pedagógica:
   M1-M10:  Comprensión lectora y tipos de texto
   M11-M20: Ortografía (acentuación, puntuación, B/V, C/S/Z, G/J/H)
   M21-M30: Gramática (sustantivos, adjetivos, artículos, adverbios)
   M31-M40: Verbos (conjugaciones, tiempos, modos, irregularidades)
   M41-M50: Pronombres, preposiciones, conjunciones
   M51-M60: Sujeto y predicado, tipos de oraciones
   M61-M70: Sinónimos, antónimos, homónimos, parónimos
   M71-M80: Textos narrativos, descriptivos, argumentativos, expositivos
   M81-M90: Literatura mexicana e hispanoamericana
   M91-M100: Repaso integral y redacción
   ================================================================ */

const ESPANOL_MISIONES = [
