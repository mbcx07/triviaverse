// Local diagnostic: simulate question generation and find nested arrays
const WORD_TYPES = [
  'mesa','silla','casa','libro','perro','gato','pájaro','árbol','flor','sol','luna','mar','cielo','fuego','aire','agua',
  'correr','saltar','caminar','comer','beber','dormir','hablar','leer','escribir','cantar','bailar','trabajar','estudiar','vivir','sentir','pensar',
  'rápido','lento','grande','pequeño','alto','bajo','feliz','triste','bonito','feo','amable','triste','feliz','fuerte','débil','nuevo','viejo',
];
const ORGANS = [
  ['Pulmones','Respirar'],['Corazón','Bombear sangre'],['Estómago','Digestión'],['Cerebro','Pensar'],
  ['Riñones','Filtrar sangre'],['Hígado','Desintoxicar'],['Piel','Proteger'],['Intestinos','Absorber nutrientes'],
];
const VALUES = [
  ['Respeto','No interrumpir'],['Responsabilidad','Hacer la tarea'],['Honestidad','Decir la verdad'],
  ['Solidaridad','Ayudar a otros'],['Justicia','Ser imparcial'],['Libertad','Elegir con libertad'],
  ['Paz','Vivir en armonía'],['Tolerancia','Aceptar diferencias'],['Cooperación','Trabajar en equipo'],
  ['Empatía','Entender a otros'],['Perseverancia','No rendirse'],['Amor','Amistad'],
  ['Lealtad','Gratitud'],['Generosidad','Humildad'],['Bondad','Paciencia'],
  ['Comprensión','Sinceridad'],['Valentía','Fe'],['Caridad'],['Coraje','Disciplina'],
  ['Creatividad','Curiosidad'],['Iniciativa','Laboriosidad'],['Constancia','Optimismo'],['Esperanza'],
];
const CAPITALS = [
  ['Jalisco','Guadalajara'],['Nuevo León','Monterrey'],['Sonora','Hermosillo'],['Sinaloa','Culiacán'],
  ['Chihuahua','Chihuahua'],['Baja California Sur','La Paz','Nayarit','Aguascalientes'],
  ['Zacatecas','San Luis Potosí','Tlaxcala','Puebla','Oaxaca','Villahermosa'],
  ['Chiapas','Tuxtla Gutiérrez','Tabasco','Villahermosa','Campeche','San Francisco de Campeche'],
  ['Yucatán','Mérida','Quintana Roo','Chetumal'],
  ['Coahuila','Saltillo','Durango','Victoria de Durango','Zacatecas','Fresnillo','Gómez Palacio'],
  ['Ciudad de México','Coyoacán','Benito Juárez'],
];
const HISTORICAL = ['Independencia','Revolución','Guerra de Independencia','Cristóbal Colón','Benito Juárez','Porfirio Díaz','Frida Kahlo','Don Juan'];
const SUBJECTS = [
  { key:'mat', title:'Matemáticas' },{ key:'esp', title:'Español' },{ key:'cien', title:'Ciencias Naturales' },
  { key:'hist', title:'Historia' },{ key:'geo', title:'Geografía' },{ key:'civ', title:'Formación Cívica y Ética' },{ key:'gen', title:'Mundo Sorpresa' },
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickWordType() { return pick(WORD_TYPES); }

function qMC(prompt, options, correctIndex, explanation) {
  const validOptions = options.filter(o => o !== undefined && o !== null && String(o).trim() !== '');
  const correctOption = options[correctIndex];
  const correctIndexSafe = validOptions.findIndex((o) => String(o) === String(correctOption));
  return { type: 'multiple_choice', prompt, options: validOptions, correctIndex: correctIndexSafe, explanation: explanation || '' };
}
function qTF(prompt, answer, explanation) { return { type: 'true_false', prompt, answer, explanation: explanation || '' }; }
function qOrder(prompt, tokens, explanation) {
  const validTokens = tokens.filter(t => t !== undefined && t !== null && String(t).trim() !== '');
  return { type: 'order_words', prompt, tokens: validTokens, explanation: explanation || '' };
}
function qMatch(prompt, pairs, explanation) {
  let pairsFlat;
  if (Array.isArray(pairs) && pairs.length > 0 && typeof pairs[0] === 'object' && !Array.isArray(pairs[0])) {
    pairsFlat = pairs;
  } else if (Array.isArray(pairs) && pairs.length > 0 && Array.isArray(pairs[0])) {
    pairsFlat = pairs.map(([left, right]) => ({ left, right })).filter(p => p.left !== undefined && p.right !== undefined);
  } else {
    pairsFlat = Array.isArray(pairs) ? pairs : [{ left: pairs[0] || '', right: pairs[1] || '' }];
  }
  pairsFlat = pairsFlat.filter(p => p.left !== undefined && p.right !== undefined && String(p.left).trim() !== '' && String(p.right).trim() !== '');
  return { type: 'match_pairs', prompt, pairs: pairsFlat, explanation: explanation || '' };
}

function hasNested(v) { return Array.isArray(v) && v.some(item => Array.isArray(item)); }

function makeQuestions(subjectKey, lessonIdx) {
  const espWord = pickWordType();
  const espWord2 = pickWordType();
  const espWord3 = pickWordType();
  const espQ = qMC(`Completa: La ${espWord} está sobre la mesa.`, [espWord, 'el', 'una', 'de'], 0, `La ${espWord}...`);
  const espQ2 = qTF(`"${espWord}" es un verbo.`, false, `"${espWord}" es un sustantivo.`);
  const espQ3 = qOrder('Ordena las sílabas:', [espWord.substring(0,2), espWord.substring(2), ''], 'Sílabas.');
  const espQ4 = qMC(`¿Qué tipo de palabra es "${espWord2}"?`, ['Sustantivo','Verbo','Adjetivo','Adverbio'], 2, `"${espWord2}" es adjetivo.`);
  const espQ5 = qTF(`"${espWord3}" tiene más de 5 letras.`, true, `"${espWord3}" tiene más de 5 letras.`);
  const espQ6 = qMC(`Sinónimo de "${espWord}"`, [espWord, pickWordType(), pickWordType(), pickWordType()], 0, `Sinónimo de "${espWord}".`);

  const org = pick(ORGANS);
  const matNum = lessonIdx * 10;
  const matQ = qMC(`Cuánto es ${matNum} + ${matNum}?`, [String(matNum*2), String(matNum+1), String(matNum-1), String(matNum*3)], 0, `${matNum*2}`);
  const matQ2 = qTF(`${matNum} × 2 = ${matNum*2}.`, true, `${matNum} × 2 = ${matNum*2}`);
  const matQ3 = qOrder('Ordena de menor a mayor:', [String(matNum), String(matNum*2), String(matNum*3)], `${matNum} < ${matNum*2} < ${matNum*3}`);
  const matQ4 = qMC(`¿Cuál es el doble de ${matNum}?`, [String(matNum*2), String(matNum/2), String(matNum+2), String(matNum-2)], 0, `El doble de ${matNum} es ${matNum*2}.`);
  const matQ5 = qTF(`${matNum} es mayor que ${matNum-1}.`, true, `${matNum} > ${matNum-1}.`);
  const matQ6 = qMC(`Raíz cuadrada aproximada de ${matNum*4}:`, [String(matNum*2), String(matNum), String(matNum*4), String(matNum/2)], 0, `√${matNum*4} ≈ ${matNum*2}.`);

  const cienPick = Math.floor(Math.random() * 8);
  const cienQ = qMC(`¿Qué hace el ${ORGANS[cienPick][0]}?`, [ORGANS[cienPick][1], 'Nada','Comer','Dormir'], 0, ORGANS[cienPick][1]);
  const cienQ2 = qTF('El corazón nunca descansa.', true, 'El corazón trabaja siempre.');
  const cienQ3 = qOrder('Ordena: ingestión → ??? → excreción:', ['Digestión','Circulación','Respiración'], 'Proceso digestivo.');
  const cienQ4 = qMatch('Relaciona el órgano con su función:', [{ left: ORGANS[cienPick][0], right: 'función: '+ORGANS[cienPick][1] }], 'Funciones del cuerpo.');

  const histPick = Math.floor(Math.random() * 8);
  const histQ = qMC('¿Cuál fue la independencia de México?', ['1810','1910','1921','1810'], 0, 'México se independizó en 1810.');
  const histQ2 = qTF('La revolución mexicana fue en 1910.', true, 'La Revolución Mexicana fue en 1910.');
  const histQ3 = qOrder('Ordena cronológicamente:', ['Independencia','Guerra de Independencia','Revolución'], 'Independencia → Guerra → Revolución.');

  const geoPick = Math.floor(Math.random() * 32);
  const cap = CAPITALS[geoPick];
  const geoQ = qMC('¿Cuál es la capital de México?', [cap[0], cap[1]||cap[0], cap[2]||cap[0], cap[3]||cap[0]], 0, cap[0]);
  const geoQ2 = qTF('México está en América del Norte.', true, 'México está en América del Norte.');
  const geoQ3 = qOrder('Ordena de norte a sur:', [cap[0]||'', cap[1]||'', cap[2]||''].filter(Boolean), (cap[0]||'') + ' → ' + (cap[1]||'') + ' → ' + (cap[2]||''));

  const civPick = Math.floor(Math.random() * 20);
  const vals = VALUES[civPick];
  const val0 = vals[0] || '';
  const val1 = vals[1] || vals[0] || '';
  const civQ = qMC(`¿Qué es ${val0}?`, ['Tratar bien','Ignorar','Gritar'], 0, `${val0} es tratar bien.`);
  const civQ2 = qTF(`${val1} ayuda a la confianza.`, true, `${val1} fortalece confianza.`);
  const civQ3 = qOrder('Ordena para resolver un conflicto:', ['Calmarme','Escuchar','Hablar con respeto'], 'Calmarme → Escuchar → Hablar con respeto.');
  const civQ4 = qMatch('Relaciona valor con acción:', [{ left: val0, right: `acción: ${val1.toLowerCase()}` }], 'Valores en acciones.');
  const civQ5 = qMC(`¿Qué es cooperar?`, ['Ayudar en equipo','Burlar','Ignorar','Romper'], 0, 'Cooperar es ayudar en equipo.');
  const civQ6 = qTF('Compartir puede mejorar la convivencia.', true, 'Compartir ayuda a convivir.');

  return [matQ,espQ,espQ2,espQ3,espQ4,espQ5,espQ6,cienQ,cienQ2,cienQ3,cienQ4,histQ,histQ2,histQ3,geoQ,geoQ2,geoQ3,civQ,civQ2,civQ3,civQ4,civQ5,civQ6];
}

let found = false;
for (const { key } of SUBJECTS) {
  for (let i = 1; i <= 50; i++) {
    const questions = makeQuestions(key, i);
    for (const q of questions) {
      if (hasNested(q.options) || hasNested(q.tokens) || hasNested(q.pairs) || (q.pairs && hasNested(Object.values(q.pairs)))) {
        console.log('NESTED in', key + '-' + i, JSON.stringify(q).substring(0, 300));
        found = true;
      }
    }
  }
}
if (!found) console.log('NO NESTED ARRAYS FOUND in 50x50 questions locally');
