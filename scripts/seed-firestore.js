/* Seed Firestore for Triviverso (SEP MX 5º-6º) - v4
   Usage:
     node scripts/seed-firestore.js --sa "C:\\secrets\\triviverso.json" --project triviverso
*/

const fs = require('fs');
const args = (() => {
  const a = {};
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--sa') a.sa = process.argv[++i];
    else if (process.argv[i] === '--project') a.project = process.argv[++i];
    else if (process.argv[i] === '--dry') a.dry = true;
    else if (process.argv[i] === '--from') a.from = parseInt(process.argv[++i], 10);
    else if (process.argv[i] === '--to') a.to = parseInt(process.argv[++i], 10);
  }
  return a;
})();

function normalize(s) {
  return String(s || '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-');
}

if (!args.sa) { console.error('Missing --sa'); process.exit(2); }
if (!fs.existsSync(args.sa)) { console.error('SA not found:', args.sa); process.exit(2); }

const admin = require('firebase-admin');
const serviceAccount = require(args.sa);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: args.project || serviceAccount.project_id });
const db = admin.firestore();

const SUBJECTS = [
  { key:'mat', title:'Matemáticas' },
  { key:'esp', title:'Español' },
  { key:'cien', title:'Ciencias Naturales' },
  { key:'hist', title:'Historia' },
  { key:'geo', title:'Geografía' },
  { key:'civ', title:'Formación Cívica y Ética' },
  { key:'gen', title:'Mundo Sorpresa' },
];
const FREE_USERS = [
  { nickname:'Amelia', pin:'1703' },
  { nickname:'Isabela', pin:'1234' },
  { nickname:'Milan', pin:'1234' },
  { nickname:'Lili', pin:'1234' },
];
const START = args.from || 1;
const END = args.to || 100;

// ─────────────────────────────────────────────────────────────────
// QUESTION BUILDERS
// ─────────────────────────────────────────────────────────────────
let _currentLessonId = '';

function qMC(prompt, options, correctIndex, explanation) {
  const valid = (options || []).filter(o => o !== undefined && String(o).trim() !== '');
  const correct = String(options[correctIndex]);
  // Deterministic seeded shuffle based on lessonId + prompt
  let seed = 0;
  const seedStr = _currentLessonId + prompt;
  for (let i = 0; i < seedStr.length; i++) seed = ((seed << 5) - seed) + seedStr.charCodeAt(i) | 0;
  const shuffled = [...valid];
  for (let i = shuffled.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const newCorrectIndex = shuffled.findIndex(o => String(o) === correct);
  return { type: 'multiple_choice', prompt, options: shuffled, correctIndex: Math.max(0, newCorrectIndex), explanation: explanation || '' };
}
function qTF(prompt, answer, explanation) {
  return { type: 'true_false', prompt, answer: Boolean(answer), explanation: explanation || '' };
}
function qOrder(prompt, tokens, explanation) {
  const valid = (tokens || []).filter(t => t !== undefined && String(t).trim() !== '');
  return { type: 'order_words', prompt, tokens: valid, explanation: explanation || '' };
}
function qMatch(prompt, pairs, explanation) {
  const flat = (pairs || []).filter(p => p && p.left !== undefined && p.right !== undefined && String(p.left).trim() !== '');
  return { type: 'match_pairs', prompt, pairs: flat, explanation: explanation || '' };
}

// ─────────────────────────────────────────────────────────────────
// MATH — SEP 5º-6º
// ─────────────────────────────────────────────────────────────────
function matQuestions(n) {
  const qs = [];
  const ni = Number(n);

  // Q1: Aritmética — nivel crece con ni (rangos progresivos)
  const mathRange = ni <= 10 ? {min:1,max:20} : ni <= 20 ? {min:10,max:50} : ni <= 33 ? {min:20,max:100} : ni <= 50 ? {min:50,max:200} : ni <= 66 ? {min:100,max:500} : {min:200,max:1000};
  const mathA = mathRange.min + (ni * 7 + 3) % (mathRange.max - mathRange.min + 1);
  const mathB = mathRange.min + (ni * 13 + 11) % (mathRange.max - mathRange.min + 1);
  if (ni <= 33) {
    const a = mathA, b = ((ni*13+11)%20)+1;
    qs.push(qMC(`¿Cuánto es ${a} + ${b}?`, [String(a+b), String(a+b+2), String(a+b-2), String(a+b+5)], 0, `${a}+${b}=${a+b}`));
    const mult = [2,3,4,5][(ni*3)%4];
    qs.push(qMC(`¿Cuánto es ${a} × ${mult}?`, [String(a*mult), String(a*mult+mult), String(a*mult-mult), String(a*mult+1)], 0, `${a}×${mult}=${a*mult}`));
  } else if (ni <= 66) {
    const a = mathA, b = mathB;
    const subA = Math.max(a, b), subB = Math.min(a, b);
    qs.push(qMC(`¿Cuánto es ${subA} − ${subB}?`, [String(subA-subB), String(subA-subB+3), String(subA-subB-3), String(subA+subB)], 0, `${subA}−${subB}=${subA-subB}`));
    const mult = [2,3,4,5,6,7,8,9,10][(ni*3)%9];
    qs.push(qMC(`¿Cuánto es ${a} × ${mult}?`, [String(a*mult), String(a*mult+mult), String(a*mult-mult), String(a*mult+1)], 0, `${a}×${mult}=${a*mult}`));
  } else {
    const a = mathA, b = mathB;
    qs.push(qMC(`¿Cuánto es ${a} + ${b}?`, [String(a+b), String(a+b+1), String(a+b-1), String(a+b+2)], 0, `${a}+${b}=${a+b}`));
    const mult = [6,7,8,9,10,11,12][(ni*5)%7];
    qs.push(qMC(`¿Cuánto es ${a} ÷ ${mult}? (cociente entero)`, [String(Math.floor(a/mult)), String(Math.floor(a/mult)+1), String(Math.floor(a/mult)-1), String(Math.ceil(a/mult))], 0, `${a}÷${mult}=cociente ${Math.floor(a/mult)}, residuo ${a%mult}`));
  }

  // Q2: Fracciones
  if (ni <= 33) {
    const denoms = [2,3,4,5,6,7,8];
    const d1 = denoms[(ni*3)%denoms.length];
    let d2 = denoms[(ni*7)%denoms.length];
    if (d1 === d2) d2 = denoms[((ni*7)+1)%denoms.length];
    const v1 = 1/d1, v2 = 1/d2;
    const vals = [`1/${d1}`,`1/${d2}`,`${((ni*5)%3)+2}/${d1}`,`${((ni*11)%4)+2}/${d2}`];
    qs.push(qMC(`¿Cuál es la fracción MAYOR: ${vals[0]} o ${vals[1]}?`, vals[0]===vals[1]?vals:[vals[v1>=v2?0:1],vals[v1>=v2?1:0],vals[2],vals[3]], 0, `Como el numerador es igual (1), el denominador más pequeño da la fracción mayor: 1/${Math.min(d1,d2)} > 1/${Math.max(d1,d2)}`));
  } else if (ni <= 66) {
    const d = [3,4,5,6,7,8,9,10][(ni*5)%8];
    let n1 = ((ni*3)%(d-1))+1, n2 = ((ni*7)%(d-1))+1;
    if (n1 === n2) n2 = n2 < d-1 ? n2+1 : n2-1;
    if (n1 === n2) { n1 = 1; n2 = 2; }
    const ans = n1>n2 ? 'Mayor' : 'Menor';
    qs.push(qMC(`¿${n1}/${d} es mayor, menor o igual a ${n2}/${d}?`, ['Mayor','Menor','Igual'], n1>n2?0:1, n1>n2?`${n1}/${d}=${(n1/d).toFixed(2)} > ${(n2/d).toFixed(2)}`:`${n1}/${d}=${(n1/d).toFixed(2)} < ${(n2/d).toFixed(2)}`));
  } else {
    const d = [3,4,5,6,7,8,9,10,11,12][(ni*3)%10];
    const whole = ((ni*7)%5)+2;
    const remainder = ((ni*5)%(d-1))+1;
    const num = whole*d + remainder;
    const mixed = `${whole} ${remainder}/${d}`;
    const wrong1 = `${whole+1} ${remainder}/${d}`, wrong2 = `${whole} ${remainder+1 < d ? remainder+1 : remainder-1}/${d}`, wrong3 = `${whole+1} ${remainder+1 < d ? remainder+1 : remainder-1}/${d}`;
    qs.push(qMC(`¿A qué número mixto equivale ${num}/${d}?`, [mixed, wrong1, wrong2, wrong3], 0, `${num}/${d}=${whole} ${remainder}/${d} porque ${num}=${whole}×${d}+${remainder}`));
  }

  // Q3: Decimales
  if (ni <= 33) {
    const d1 = ((ni*5)%9)+1;
    let d2 = ((ni*7)%9)+1;
    if (d1 === d2) d2 = d2 < 9 ? d2+1 : d2-1;
    const dec1 = d1/10, dec2 = d2/10;
    qs.push(qMC(`¿Cuál es mayor: ${dec1.toFixed(1)} o ${dec2.toFixed(1)}?`, [dec1>dec2?dec1.toFixed(1):dec2.toFixed(1), dec1>dec2?dec2.toFixed(1):dec1.toFixed(1), (Math.max(dec1,dec2)+0.2).toFixed(1), (Math.min(dec1,dec2)-0.1).toFixed(1)], 0, dec1>dec2?`${dec1.toFixed(1)} > ${dec2.toFixed(1)}`:`${dec2.toFixed(1)} > ${dec1.toFixed(1)}`));
  } else if (ni <= 66) {
    const d1 = ((ni*5)%9)+1, d2 = ((ni*7)%9)+1;
    const dec1 = d1/10, dec2 = d2/10;
    qs.push(qMC(`${dec1.toFixed(2)} + ${dec2.toFixed(2)} = ?`, [(dec1+dec2).toFixed(2), (dec1+dec2+0.01).toFixed(2), (dec1+dec2-0.01).toFixed(2), (dec1+dec2+0.1).toFixed(2)], 0, `${dec1.toFixed(2)}+${dec2.toFixed(2)}=${(dec1+dec2).toFixed(2)}`));
  } else {
    const dec = ((ni*5)%9+1)/10;
    qs.push(qMC(`${dec.toFixed(2)} × 100 = ?`, [(dec*100).toFixed(1), (dec*10).toFixed(1), (dec*1000).toFixed(1), (dec*100-1).toFixed(1)], 0, `Multiplicar por 100 recorre el punto decimal dos lugares a la derecha: ${dec.toFixed(2)}×100=${(dec*100).toFixed(1)}`));
  }

  // Q4: Geometría
  if (ni <= 33) {
    const base = (ni%8+3)*2, height = (ni%5+2)*2;
    qs.push(qMC(`Un rectángulo mide ${base} cm × ${height} cm. ¿Cuál es su perímetro?`, [`${2*(base+height)} cm`, `${base*height} cm²`, `${base+height} cm`, `${2*base+height} cm`], 0, `Perímetro = 2×(largo+ancho) = 2×(${base}+${height}) = ${2*(base+height)} cm`));
    const side = (ni%6+3)*3;
    qs.push(qMC(`Un cuadrado tiene ${side} cm de lado. ¿Cuál es su perímetro?`, [`${side*4} cm`, `${side*side} cm²`, `${4+side} cm`, `${side*2} cm`], 0, `Perímetro = 4×lado = 4×${side} = ${side*4} cm`));
  } else if (ni <= 66) {
    const base = (ni%7+4)*2, height = (ni%4+3)*2;
    qs.push(qMC(`Un triángulo tiene base ${base} cm y altura ${height} cm. ¿Cuál es su área?`, [`${base*height/2} cm²`, `${base*height} cm²`, `${2*(base+height)} cm`, `${base+height} cm`], 0, `Área triángulo = (base×altura)/2 = (${base}×${height})/2 = ${base*height/2} cm²`));
    const r = (ni%5+2);
    qs.push(qMC(`¿Cuál es el perímetro de un círculo con radio ${r} cm? (usa π≈3.14)`, [`${(2*r*3.14).toFixed(2)} cm`, `${(r*r*3.14).toFixed(2)} cm²`, `${(r*3.14).toFixed(2)} cm`, `${(2*r*r*3.14).toFixed(2)} cm`], 0, `Perímetro = 2πr = 2×3.14×${r} = ${(2*r*3.14).toFixed(2)} cm`));
  } else {
    const r = (ni%4+3);
    qs.push(qMC(`¿Cuál es el área de un círculo con radio ${r} cm? (usa π≈3.14)`, [`${(r*r*3.14).toFixed(2)} cm²`, `${(2*r*3.14).toFixed(2)} cm`, `${(r*r*3.14*2).toFixed(2)} cm²`, `${(r*3.14).toFixed(2)} cm²`], 0, `Área = πr² = 3.14×${r}² = ${(r*r*3.14).toFixed(2)} cm²`));
    const lado = (ni%6+4)*2;
    qs.push(qMC(`Un hexágono regular tiene ${lado} cm por lado. ¿Cuál es su perímetro?`, [`${lado*6} cm`, `${lado*6-2} cm`, `${lado*4} cm`, `${lado*3} cm`], 0, `Hexágono = 6×lado = 6×${lado} = ${lado*6} cm`));
  }

  // Q5: Estadística
  if (ni <= 33) {
    // Generate data with ONE clear mode: one value repeated 3 times, all others exactly 1 time
    const modeVal = (ni % 5) + 1;
    let vals = [1,2,3,4,5,6].filter(v => v !== modeVal);
    const others = vals.slice(0, 4);
    const data = [modeVal, modeVal, modeVal, ...others];
    const freq = {}; data.forEach(v => freq[v] = (freq[v]||0)+1);
    const mode = String(modeVal);
    const modeLabel = `${mode} (se repite ${freq[mode]} veces)`;
    const uniqueVals = [...new Set(data)];
    const opts = uniqueVals.slice(0,4).map(v => `${v} (se repite ${freq[v]} veces)`);
    if (opts.length < 4) opts.push('No hay moda');
    qs.push(qMC(`Datos: ${data.sort((a,b)=>a-b).join(', ')}. ¿Cuál es la moda?`, opts, 0, `La moda es el valor con mayor frecuencia: ${modeLabel}.`));
  } else if (ni <= 66) {
    const data = [(ni*3)%15+3,(ni*7)%15+5,(ni*5)%15+2,(ni*2)%15+8,(ni*11)%15+4,(ni*13)%15+6];
    const mean = data.reduce((s,x)=>s+x,0)/data.length;
    qs.push(qMC(`Datos: ${data.sort((a,b)=>a-b).join(', ')}. ¿Cuál es el promedio?`, [mean.toFixed(1),(mean+1.5).toFixed(1),(mean-1.5).toFixed(1),(mean+3).toFixed(1)], 0, `Promedio = (${data.join('+')})/${data.length} = ${mean.toFixed(1)}`));
  } else {
    const data = [(ni*3)%20+5,(ni*7)%20+2,(ni*5)%20+10,(ni*2)%20+3,(ni*11)%20+8,(ni*13)%20+1,(ni*17)%20+6];
    const sorted = [...data].sort((a,b)=>a-b);
    const mid = data.length/2;
    const median = data.length%2===0 ? ((sorted[mid-1]+sorted[mid])/2).toFixed(1) : sorted[Math.floor(mid)].toFixed(1);
    qs.push(qMC(`Datos: ${data.join(', ')}. ¿Cuál es la mediana?`, [median,(parseFloat(median)+2).toFixed(1),(parseFloat(median)-2).toFixed(1),String(sorted[0])], 0, `Ordenados: ${sorted.join(', ')}. Mediana = ${median}`));
  }

  // Q6: Proporcionalidad y porcentajes
  if (ni <= 33) {
    const pct = [10,20,25,50][(ni*3)%4];
    const total = ((ni*7)%90)+20;
    const part = Math.round(pct/100*total);
    qs.push(qMC(`¿Cuánto es el ${pct}% de ${total}?`, [String(part),String(part+1),String(total-part),String(part-1)], 0, `${pct}% de ${total} = ${part}`));
  } else if (ni <= 66) {
    const a = ((ni*5)%8)+3, b = ((ni*7)%6)+2, c = a*b;
    qs.push(qMC(`Si ${a} × ${b} = ${c}, ¿cuánto es ${a*2} × ${b*3}?`, [String(c*6),String(c*5),String(c*3),String(c*6/a)], 0, `Si un factor se duplica y el otro se triplica, el producto se sextuplica: ${a*2}×${b*3}=${c*6}`));
    const pct = [10,15,20,30][(ni*5)%4];
    const total = ((ni*11)%200)+100;
    const part = Math.round(pct/100*total);
    qs.push(qMC(`De ${total} alumnos, el ${pct}% usa transporte público. ¿Cuántos NO usan transporte?`, [String(total-part),String(part),String(total+part),String(total-part-1)], 0, `${pct}% de ${total} = ${part}; entonces ${total}-${part}=${total-part} no usan.`));
  } else {
    const a = ((ni*5)%12)+5, b = ((ni*7)%8)+3, c = a*b;
    qs.push(qMC(`Si ${a} workers tardan ${c} horas, ¿cuánto tardan ${a*2} workers (suponiendo misma eficiencia)?`, [String(c/2),String(c),String(c*2),String(c+2)], 0, `Si se duplican los trabajadores y la tarea es divisible, el tiempo se reduce a la mitad: ${c}/2=${c/2} horas.`));
    const total = ((ni*17)%500)+200;
    const pct = ((ni*3)%30)+10;
    const part = Math.round(pct/100*total);
    qs.push(qMC(`Un artículo cuesta $${total}. Si tiene ${pct}% de descuento, ¿cuánto se paga?`, [String(total-part),String(total+part),String(part),String(total-part-1)], 0, `Descuento = ${pct}% de ${total} = ${part}; a pagar = ${total}-${part}=${total-part}`));
  }

  return qs;
}

// ─────────────────────────────────────────────────────────────────
// SPANISH — SEP 5º-6º
// ─────────────────────────────────────────────────────────────────
const ESP_NOUNS   = ['gato','perro','libro','casa','agua','árbol','sol','luna','pan','luz','mesa','silla','flor','pez','ave','fuego','aire','tierra','ojos','manos','ciudad','escuela','niño','niña','padre','madre','amigo'];
const ESP_SYNONYMS = {
  gato:'felino',perro:'canino',libro:'texto',casa:'hogar',agua:'líquido',árbol:'planta',
  sol:'estrella',luna:'satélite',pan:'alimento',luz:'iluminación',mesa:'tabla',silla:'asiento',
  flor:'botón',pez:'animal acuático',ave:'pájaro',fuego:'llama',aire:'brisa',tierra:'suelo',
  ojos:'vista',manos:'extremidades',ciudad:'urbe',escuela:'colegio',niño:'chico',
  niña:'chica',padre:'progenitor',madre:'progenitora',amigo:'compañero'
};
const ESP_VERBS   = ['corre','salta','come','duerme','habla','lee','escribe','canta','baila','trabaja','estudia','vive','siente','piensa','camina','mira','escucha','juega','ama','crece','viaja','cocina','limpia','dibuja','construye','explica'];
const ESP_ADJS    = ['grande','pequeño','alto','bajo','feliz','triste','bonito','amable','fuerte','nuevo','blanco','negro','rojo','azul','verde','amargo','dulce','ligero','pesado','blando','veloz','valiente','inteligente','generoso','honesto'];
const ESP_ARTS    = ['el','la','un','una','los','las'];
const ESP_PREPS   = ['en','de','con','por','para','sin','sobre','bajo','entre','hacia','desde','hasta','según'];

function espQuestions(n) {
  const ni = Number(n);
  const qs = [];
  const ni_idx = ni % ESP_NOUNS.length;
  const vi_idx = (ni*3) % ESP_VERBS.length;
  const ai_idx = (ni*7) % ESP_ADJS.length;
  const noun = ESP_NOUNS[ni_idx], verb = ESP_VERBS[vi_idx], adj = ESP_ADJS[ai_idx];

  // Q1: Tipo de palabra
  if (ni <= 33) {
    qs.push(qMC(`¿"${noun}" es...`, ['Un sustantivo','Un verbo','Un adjetivo','Un adverbio'], 0, `"${noun}" es un sustantivo: nombra seres, lugares o cosas.`));
    qs.push(qMC(`¿"${verb}" es...`, ['Un verbo','Un sustantivo','Un adjetivo','Un artículo'], 0, `"${verb}" es un verbo: expresa una acción o estado.`));
  } else if (ni <= 66) {
    qs.push(qMC(`¿"${adj}" es...`, ['Un adjetivo','Un verbo','Un sustantivo','Una preposición'], 0, `"${adj}" es un adjetivo: describe o califica a un sustantivo.`));
    qs.push(qMC(`"Rápidamente" es un...`, ['Adverbio de modo','Adjetivo','Sustantivo','Verbo'], 0, `Los adverbios terminados en -mente modifican al verbo: responden ¿cómo?`));
  } else {
    qs.push(qMC(`¿"${ESP_PREPS[ni%ESP_PREPS.length]}" es...`, ['Una preposición','Un verbo','Un adjetivo','Una conjunción'], 0, `Las preposiciones establecen relaciones entre palabras: lugar, tiempo, dirección.`));
    qs.push(qMC(`¿Cuál es un pronombre posesivo?`, ['mío','muy','aunque','sobre'], 0, `"Mío" indica posesión: "El libro es mío."`));
  }

  // Q2: Puntuación y ortografía
  if (ni <= 33) {
    qs.push(qMC(`¿Qué tipo de oración es "El perro ladró"?`, ['Enunciativa (afirma un hecho)','Interrogativa (pregunta)','Imperativa (ordena)','Exclamativa (expresa emoción)'], 0, `"El perro ladró" afirma un hecho: es enunciativa y termina con punto.`));
    qs.push(qMC(`"¿Cuándo llegas?" es una oración...`, ['Interrogativa directa','Enunciativa','Imperativa','Desiderativa'], 0, `Las preguntas con ¿? son interrogativas directas.`));
  } else if (ni <= 66) {
    qs.push(qMC(`"Llegó tarde; por eso no entró." La punto y coma indica...`, ['Causa o consecuencia','Tiempo','Lugar','Contraste'], 0, `Punto y coma + "por eso/pero" indica consecuencia o contraste entre oraciones.`));
    qs.push(qMC(`¿En qué tipo de palabra se coloca tilde diacrítica?`, ['Pronombres (él, tú, mí)','Sustantivos','Adjetivos','Verbos'], 0, `Tilde diacrítica: él/elle, tú/tu, mí/mi, qué/que, cómo/como, etc. Distinguen significado o función.`));
  } else {
    qs.push(qMC(`"Fue al mercado y compró frutas." ¿Dónde lleva coma?`, ['No lleva coma','Después de "mercado"','Antes de "y"','Antes de "frutas"'], 0, `Cuando el verbo tiene el mismo sujeto, no se separa con coma antes de 'y'.`));
    qs.push(qMC(`¿"Periódico" y "periódico" (verbo) son palabras...`, ['Homónimas (igual sonido, distinto significado)','Sinónimas','Antónimas','Agudas'], 0, `"Periódico" (sustantivo: diario) vs "periódico" (verbo pasar): homónimas.`));
  }

  // Q3: Comprensión lectora — tipos de texto
  if (ni <= 33) {
    qs.push(qMC(`Una receta de cocina es un texto...`, ['Instructivo','Narrativo','Poético','Informativo'], 0, `La receta enseña pasos para hacer algo: es un texto instructivo.`));
    qs.push(qMC(`¿Qué es una fábula?`, ['Cuento breve con animales que enseña una lección moral','Poema sobre la naturaleza','Noticia de un periódico','Historia de la ciencia'], 0, `Las fábulas son cuentos con animales que dan una enseñanza moral (Ej.: Esopo, La Fontaine).`));
  } else if (ni <= 66) {
    qs.push(qMC(`¿Cuál es el propósito de un texto informativo?`, ['Presentar hechos, datos y explicaciones','Inventar una historia','Persuadir al lector','Escribir un poema'], 0, `El texto informativo comunica conocimientos: enciclopedias, artículos, reportes.`));
    qs.push(qMC(`En un instructivo, ¿dónde se menciona el material necesario?`, ['Al inicio, antes de los pasos','En las ilustraciones','Como pie de página','Al final'], 0, `Estructura típica de instructivo: Material → Pasos → Resultado.`));
  } else {
    qs.push(qMC(`En un artículo de enciclopedia, ¿dónde suele estar la idea principal?`, ['En el primer párrafo','En las notas al pie','En las ilustraciones','En el índice'], 0, `La idea principal de un apartado suele estar en el primer párrafo; los siguientes desarrollan.`));
    qs.push(qMC(`Un editorial de periódico es un texto...`, ['Argumentativo (opina y persuade)','Narrativo','Instructivo','Lírico'], 0, `El editorial presenta la opinión del medio sobre un tema: busca persuadir al lector.`));
  }

  // Q4: Sujeto y predicado
  if (ni <= 33) {
    qs.push(qMC(`En "La maestra explica la lección", el sujeto es:`, ['La maestra','explica','la lección','La'], 0, `El sujeto es "La maestra": el ser que realiza la acción de explicar.`));
    qs.push(qMC(`En "Los niños juegan en el parque", ¿dónde termina el sujeto?`, ['Antes de "juegan"','Después de "juegan"','En "en el parque"','No hay sujeto'], 0, `El sujeto "Los niños" termina justo antes del verbo "juegan".`));
  } else if (ni <= 66) {
    qs.push(qMC(`"Nosotros estudiamos en la biblioteca." El sujeto es...`, ['Simple (plural)','Compuesto (dos núcleos)','Impersonal','Tácito'], 0, `"Nosotros" es un solo núcleo del sujeto: sujeto simple (en plural).`));
    qs.push(qMC(`¿Qué tipo de predicado tiene "El viento mueve las hojas"?`, ['Verbal','Nominal','Impersonal','Inverso'], 0, `El núcleo es el verbo "mueve": predicado verbal.`));
  } else {
    qs.push(qMC(`"Es necesario leer todos los días." El sujeto es...`, ['Tácito (no expresado)','"Es necesario"','"Leer todos los días"','"Todos los días"'], 0, `Las oraciones impersonales con "es + adjetivo" no tienen sujeto: se sobrentiende "algo".`));
    qs.push(qMC(`¿Qué tipo de oración es "¡Cierra la puerta!"?`, ['Imperativa (ordena)','Interrogativa','Exclamativa simple','Enunciativa'], 0, `El imperativo ordena o pide algo: ¡Cierra! = orden directa.`));
  }

  // Q5: Gramática — artículos, pronombres, conjunciones
  if (ni <= 33) {
    qs.push(qMC(`Completa: "__ libros están en __ mesa."`, ['Los / la','El / el','Un / una','Los / el'], 0, `"Los libros" (artículo + sustantivo masc. pl.) + "la mesa" (artículo + sust. fem. sg.).`));
    qs.push(qMC(`¿"${ESP_PREPS[ni%ESP_PREPS.length]}" es...?`, ['Preposición','Verbo','Adjetivo','Conjunción'], 0, `"${ESP_PREPS[ni%ESP_PREPS.length]}" indica relación entre palabras: lugar, tiempo, dirección.`));
  } else if (ni <= 66) {
    qs.push(qMC(`¿Cuál es un determinante posesivo?`, ['mi','muy','con','para'], 0, `"Mi" indica posesión: "mi libro". Los posesivos acompañan al sustantivo.`));
    qs.push(qMC(`En "Juan y María estudian", "y" es una...`, ['Conjunción coordinante','Preposición','Artículo','Interjección'], 0, `"Y" une palabras o oraciones del mismo nivel: conjunción coordinante.`));
  } else {
    qs.push(qMC(`"Aunque llueva, saldré." "Aunque" aquí es...`, ['Conjunción subordinada concessiva','Conjunción coordinante','Preposición','Adverbio'], 0, `"Aunque llueva" indica concesión: a pesar de que llueva, haré algo.`));
    qs.push(qMC(`¿"Desconcertantemente" es...?`, ['Adverbio','Adjetivo','Sustantivo','Verbo'], 0, `Palabras en -mente son adverbios: forma femenina del adjetivo + sufijo -mente.`));
  }

  // Q6: Vocabulario — sinónimos, antónimos, homónimos
  if (ni <= 33) {
    const syn = ESP_NOUNS[(ni*5)%ESP_NOUNS.length];
    const synCorrect = ESP_SYNONYMS[syn] || syn;
    const synWrong1 = ESP_ADJS[(ni*5+2)%ESP_ADJS.length];
    const synWrong2 = ESP_VERBS[(ni*5+1)%ESP_VERBS.length];
    const synWrong3 = ESP_NOUNS[(ni*5+7)%ESP_NOUNS.length];
    qs.push(qMC(`Sinónimo de "${syn}"`, [synCorrect,synWrong1,synWrong2,synWrong3], 0, `"${synCorrect}" es sinónimo de "${syn}": tienen significado parecido.`));
    qs.push(qMC(`Antónimo de "subir"`, ['Bajar','Correr','Volar','Saltar'], 0, `Subir ↔ Bajar: antónimos de dirección vertical.`));
  } else if (ni <= 66) {
    qs.push(qMC(`Antónimo de "honesto"`, ['Deshonesto','Amable','Valiente','Feliz'], 0, `Honesto ↔ Deshonesto: antónimos de veracidad.`));
    qs.push(qMC(`"Valla" (cerca) y "Vaya" (de ir) son...`, ['Homónimas','Sinónimas','Antónimas','Parónimas'], 0, `Se escriben diferente pero suenan igual: homónimas (parónimas si se consideran ambos aspectos).`));
  } else {
    qs.push(qMC(`"Cazar" y "casar" son...`, ['Parónimas (suenan parecido, diferentes)','Homónimas (suenan igual)','Sinónimas','Antónimas'], 0, `Parónimas: suenan parecido pero tienen escritura y significado diferentes.`));
    qs.push(qMC(`Diferencia entre "ser" y "estar":`, ['"Ser" = cualidades permanentes; "estar" = estados temporales','Son exactamente lo mismo','"Estar" es más formal','"Ser" es solo para personas'], 0, `"Soy alto" (cualidad) vs "Estoy cansado" (estado temporal).`));
  }

  return qs;
}

// ─────────────────────────────────────────────────────────────────
// SCIENCES — SEP 5º-6º
// ─────────────────────────────────────────────────────────────────
const CIEN_SYS5 = [
  { sys:'Respiratorio', organ:'Pulmones', func:'Captar oxígeno y expulsar dióxido de carbono' },
  { sys:'Circulatorio', organ:'Corazón', func:'Bombear sangre y distribuir oxígeno y nutrientes' },
  { sys:'Digestivo', organ:'Estómago e intestinos', func:'Descomponer alimentos y absorber nutrientes' },
  { sys:'Nervioso', organ:'Cerebro y nervios', func:'Enviar señales eléctricas y coordinar el cuerpo' },
  { sys:'Excretor', organ:'Riñones', func:'Filtrar desechos de la sangre y producir orina' },
  { sys:'Óseo', organ:'Huesos', func:'Sostener el cuerpo, proteger órganos y producir sangre' },
  { sys:'Muscular', organ:'Músculos', func:'Permitir el movimiento y mantener la postura' },
  { sys:'Inmunológico', organ:'Glóbulos blancos', func:'Defender al cuerpo contra infecciones y enfermedades' },
  { sys:'Tegumentario', organ:'Piel, cabello y uñas', func:'Proteger al cuerpo del exterior y regular la temperatura' },
  { sys:'Locomotor', organ:'Huesos y músculos', func:'Permitir el movimiento y desplazamiento del cuerpo' },
];
const CIEN_SYS6 = [
  { sys:'Endocrino', organ:'Glándulas (tiroides, páncreas)', func:'Producir y secretar hormonas que regulan el cuerpo' },
  { sys:'Linfático', organ:'Ganglios y vasos linfáticos', func:'Filtrar linfa y defender contra infecciones' },
  { sys:'Reproductor', organ:'Ovarios / Testículos', func:'Producir hormonas sexuales y permitir la reproducción' },
  { sys:'Respiratorio', organ:'Pulmones y vías respiratorias', func:'Intercambio gaseoso: O₂ entra, CO₂ sale' },
  { sys:'Tegumentario', organ:'Piel, cabello y uñas', func:'Proteger al cuerpo del exterior y regular la temperatura' },
  { sys:'Locomotor', organ:'Huesos y músculos', func:'Permitir el movimiento y desplazamiento del cuerpo' },
];
const CIEN_WATER = ['Evaporación','Condensación','Precipitación','Escorrentía / Recolección'];
const CIEN_STATES = ['Sólido','Líquido','Gaseoso','Plasma'];
const CIEN_RENEWA = ['Energía solar','Energía eólica (viento)','Energía geotérmica','Biomasa'];
const CIEN_NONRE = ['Petróleo','Gas natural','Carbón mineral','Uranio'];

function cienQuestions(n) {
  const ni = Number(n);
  const qs = [];

  // Pool grande de preguntas variadas - sin repeticiones de texto exacto
  const pool5 = [
    () => { const t = CIEN_SYS5[ni % CIEN_SYS5.length]; return qMC(`El sistema ${t.sys} tiene como función principal:`, [t.func,'Producir sonido','Generar luz','Almacenar agua'], 0, `El sistema ${t.sys} sirve para: ${t.func}.`); },
    () => { const t = CIEN_SYS5[(ni+2) % CIEN_SYS5.length]; const d = ['Corazón','Riñones','Cerebro y nervios','Glóbulos blancos'].filter(o => o !== t.organ); return qMC(`¿Qué órgano pertenece al sistema ${t.sys}?`, [t.organ, d[0], d[1], d[2]], 0, `${t.organ} es parte del sistema ${t.sys}.`); },
    () => qMC('¿En qué estado de la materia las partículas están más separadas y se mueven libremente?', ['Gas','Sólido','Líquido','Plasma'], 0, 'En los gases, las partículas tienen mucha energía y se expanden para llenar el recipiente.'),
    () => qMC('¿Cuál de estos NO es un estado de la materia?', ['Energía','Sólido','Líquido','Gas'], 0, 'Los estados clásicos son sólido, líquido, gas y plasma. La energía no es un estado de la materia.'),
    () => qMC('El ciclo del agua comienza con la evaporación. ¿Qué sucede después?', ['Condensación (se forman nubes)','Precipitación (lluvia)','Filtración','Solidificación'], 0, 'Evaporación → Condensación (nubes) → Precipitación → Escorrentía.'),
    () => qMC('Las plantas realizan la fotosíntesis usando: luz solar + CO₂ + agua para producir:', ['Glucosa y oxígeno','Proteínas','Solo dióxido de carbono','Nitrógeno'], 0, 'Fotosíntesis: 6CO₂ + 6H₂O + luz → C₆H₁₂O₆ (glucosa) + 6O₂.'),
    () => qMC('¿Qué gas liberan las plantas durante la fotosíntesis?', ['Oxígeno (O₂)','Dióxido de carbono','Nitrógeno','Hidrógeno'], 0, 'Las plantas absorben CO₂ y liberan O₂, el gas que los animales necesitan para respirar.'),
    () => qMC('Un ecosistema con poca lluvia, temperaturas extremas y plantas como cactus es:', ['Desierto','Selva tropical','Bosque templado','Tundra'], 0, 'El desierto tiene adaptaciones para conservar agua: hojas espina, tallos carnosos (cactus).'),
    () => qMC('¿Qué capa de la Tierra es líquida y genera el campo magnético?', ['Núcleo externo','Corteza','Manto','Núcleo interno'], 0, 'El núcleo externo es de hierro y níquel líquidos; su movimiento genera el campo magnético terrestre.'),
    () => qMC('La cadena alimenticia: pasto → conejo → zorro. ¿Quién es el productor?', ['El pasto','El conejo','El zorro','Todos son productores'], 0, 'El pasto es productor: fabrica su propio alimento con fotosíntesis. El conejo y el zorro son consumidores.'),
    () => qMC('¿Cuál de estos animales es vertebrado?', ['Rana','Caracol','Medusa','Estrella de mar'], 0, 'La rana tiene columna vertebral (anfibio). Caracol, medusa y estrella de mar son invertebrados.'),
    () => qMC('¿Cuál es la principal fuente de energía para la Tierra?', ['El Sol','La Luna','Los volcanes','El viento'], 0, 'El Sol proporciona luz y calor; impulsa el clima, la fotosíntesis y el ciclo del agua.'),
    () => qMC('Los animales que se alimentan solo de plantas se llaman:', ['Herbívoros','Carnívoros','Omnívoros','Insectívoros'], 0, 'Herbívoros: comen plantas. Carnívoros: carne. Omnívoros: ambos.'),
    () => { const t = CIEN_RENEWA[ni % CIEN_RENEWA.length]; return qMC(`¿Qué tipo de energía es la ${t.toLowerCase()}?`, ['Renovable','No renovable','Fósil','Nuclear'], 0, `${t} es renovable: se regenera naturalmente y no se agota.`); },
    () => { const t = CIEN_NONRE[ni % CIEN_NONRE.length]; const a = CIEN_RENEWA[(ni+1) % CIEN_RENEWA.length]; return qMC(`El ${t} es un recurso:`, ['No renovable (se agota)','Renovable (no se agota)','Inagotable','Artificial'], 0, `${t} tarda millones de años en formarse y se consume más rápido de lo que se regenera.`); },
    () => qMC('El esqueleto humano adulto tiene aproximadamente:', ['206 huesos','50 huesos','500 huesos','1000 huesos'], 0, 'Un adulto tiene ~206 huesos. Los bebés nacen con ~300 que se fusionan al crecer.'),
    () => qMC('¿Qué órgano bombea la sangre por todo el cuerpo?', ['El corazón','Los pulmones','El cerebro','El hígado'], 0, 'El corazón es un músculo que bombea ~5 litros de sangre por minuto.'),
    () => qMC('¿Qué vitamina produce nuestro cuerpo al exponerse al sol?', ['Vitamina D','Vitamina C','Vitamina A','Vitamina B12'], 0, 'La piel produce vitamina D con la luz solar; ayuda a absorber calcio para los huesos.'),
    () => qMC('¿Cuál es el planeta más grande del Sistema Solar?', ['Júpiter','Saturno','Tierra','Marte'], 0, 'Júpiter es el más grande: 11 veces el diámetro de la Tierra, con su Gran Mancha Roja.'),
    () => qMC('¿Cuántos planetas hay en el Sistema Solar?', ['8 planetas','9 planetas','7 planetas','10 planetas'], 0, 'Son 8: Mercurio, Venus, Tierra, Marte, Júpiter, Saturno, Urano y Neptuno.'),
    () => qMC('¿Qué fuerza nos mantiene pegados al suelo?', ['La gravedad','El magnetismo','La fricción','La inercia'], 0, 'La gravedad terrestre atrae todo hacia el centro del planeta (~9.8 m/s²).'),
    () => qMC('Al mezclar agua con aceite, ¿qué ocurre?', ['No se mezclan (son inmiscibles)','Se mezclan perfectamente','El aceite se evapora','El agua se vuelve aceite'], 0, 'Agua y aceite no se mezclan porque el agua es polar y el aceite no polar.'),
    () => qTF('El agua hierve a 100°C al nivel del mar.', true, 'A presión atmosférica normal (nivel del mar), el agua hierve a 100°C.'),
    () => qTF('Todos los metales son atraídos por un imán.', false, 'Solo los metales ferromagnéticos (hierro, níquel, cobalto) son atraídos. El aluminio o el cobre no.'),
    () => qTF('Los murciélagos son mamíferos.', true, 'Los murciélagos son los únicos mamíferos que vuelan; tienen pelo y amamantan a sus crías.'),
    () => qMatch('Relaciona cada animal con su grupo:', [
      { left: 'Serpiente', right: 'Reptil' },
      { left: 'Sapo', right: 'Anfibio' },
    ], 'Serpiente=Reptil (escamas, sangre fría). Sapo=Anfibio (piel húmeda, metamorfosis).'),
    () => qMatch('Relaciona cada órgano con su sistema:', [
      { left: 'Pulmones', right: 'Respiratorio' },
      { left: 'Estómago', right: 'Digestivo' },
    ], 'Pulmones = Sistema respiratorio. Estómago = Sistema digestivo.'),
    () => qOrder('Ordena los planetas del más cercano al más lejano del Sol:', ['Mercurio','Venus','Tierra','Marte'], 'Mercurio → Venus → Tierra → Marte (planetas interiores/rocosos).'),
    () => qOrder('Ordena los niveles de organización de menor a mayor:', ['Célula','Tejido','Órgano','Sistema'], 'Célula → Tejido → Órgano → Sistema (organismo).'),
  ];

  const pool6 = [
    () => { const t = CIEN_SYS6[ni % CIEN_SYS6.length]; return qMC(`El sistema ${t.sys.trim()} se encarga principalmente de:`, [t.func,'Bombear sangre','Digerir alimentos','Mover los huesos'], 0, `El sistema ${t.sys.trim()}: ${t.func}.`); },
    () => qMC('La velocidad de la luz en el vacío es aproximadamente:', ['300,000 kilómetros por segundo','300 kilómetros por segundo','3,000 kilómetros por segundo','30 kilómetros por segundo'], 0, 'La luz recorre ~300,000 km en un segundo; puede dar 7 vueltas a la Tierra en 1 segundo.'),
    () => qMC('¿Qué fuerza se opone al movimiento entre dos superficies en contacto?', ['Fricción','Gravedad','Inercia','Elasticidad'], 0, 'La fricción o roce actúa en dirección contraria al movimiento.'),
    () => qMF('¿Qué instrumento mide la temperatura?', ['Termómetro','Barómetro','Cronómetro','Dinamómetro'], 0, 'Termómetro: temperatura. Barómetro: presión. Cronómetro: tiempo.'),
    () => qOrder('Ordena los estados de la materia de MENOR a MAYOR energía cinética:', ['Sólido','Líquido','Gas','Plasma'], 'Sólido (partículas fijas) → Líquido (fluyen) → Gas (se expanden) → Plasma (ionizado, muy energético).'),
    () => qTF('El volumen se mide en metros cúbicos (m³), no en metros cuadrados.', true, 'm³ mide espacio tridimensional (volumen). m² mide superficie plana (área).'),
    () => qMC('¿Cuál de estos recursos energéticos es NO renovable?', ['Petróleo','Energía solar','Viento','Energía geotérmica'], 0, 'El petróleo tarda millones de años en formarse y se consume mucho más rápido de lo que se regenera.'),
    () => qMC('¿Cuál es la capa más extensa del interior de la Tierra?', ['Manto (~2,900 km)','Núcleo externo (~2,200 km)','Corteza (~30-50 km)','Núcleo interno (~1,200 km)'], 0, 'El manto ocupa ~84% del volumen terrestre; es roca semifundida en convección.'),
    () => qMC('¿Qué tipo de roca se forma por el enfriamiento del magma?', ['Ígnea','Sedimentaria','Metamórfica','Caliza'], 0, 'Rocas ígneas (granito, basalto) se forman al enfriarse el magma. Sedimentarias: por acumulación.'),
    () => qMC('¿Qué gas de la atmósfera es el más abundante?', ['Nitrógeno (78%)','Oxígeno (21%)','Dióxido de carbono','Hidrógeno'], 0, 'El nitrógeno (N₂) compone ~78% del aire; el oxígeno ~21%.'),
  ];

  // Elegir preguntas variadas sin repetir template exacto
  const selected = new Set<number>()
  const pool = ni <= 50 ? pool5 : pool6
  const count = Math.min(pool.length, 5 + Math.floor(Math.random() * 3)) // 5-7 preguntas variadas
  
  while (qs.length < count) {
    const idx = (ni * 7 + qs.length * 13) % pool.length
    if (!selected.has(idx)) {
      selected.add(idx)
      qs.push(pool[idx]())
    } else {
      // Buscar el siguiente no usado
      for (let i = 0; i < pool.length && qs.length < count; i++) {
        if (!selected.has(i)) { selected.add(i); qs.push(pool[i]()) }
      }
      break
    }
  }

  return qs;
}

// ─────────────────────────────────────────────────────────────────
// HISTORY — SEP 5º-6º
// ─────────────────────────────────────────────────────────────────
const HIST_PRE = [
  { name:'Olmecas', yrs:'~1500-400 a.C.', loc:'Sur de Veracruz y Tabasco', feat:'Primeras cabezas colosales talladas en piedra basáltica; usaron jade y obsidiana' },
  { name:'Mayas', yrs:'~250-900 d.C.', loc:'Península de Yucatán y Guatemala', feat:'Escritura jeroglífica, calendario de 365 días, pirámides como observatorios astronómicos' },
  { name:'Mexicas (Aztecas)', yrs:'1325-1521 d.C.', loc:'Valle de México (Tenochtitlán)', feat:'Tenochtitlán construida sobre lago, chinampas (cultivo flotante), expansión militar por tributo' },
  { name:'Zapotecos', yrs:'~500 a.C.-1521 d.C.', loc:'Oaxaca (Monte Albán)', feat:'Sistema de escritura con glifos, tumba real con joyas, sistema de numeración con cero' },
  { name:'Mixtecos', yrs:'~400-1521 d.C.', loc:'Oaxaca y Guerrero', feat:'Códices pictóricos (libros de piel teñida), orfebrería avanzada en oro y plata' },
  { name:'Tarascanos (Purhépechas)', yrs:'~1300-1521 d.C.', loc:'Michoacán', feat:'Metalurgia del cobre y bronce; no tuvieron tlatoani: gobernaba un consejo, a diferencia de los aztecas' },
  { name:'Teotihuacanos', yrs:'~100 a.C.-650 d.C.', loc:'Valle de México (Teotihuacán)', feat:'Pirámide del Sol y la Luna, ciudad con 100,000+ habitantes, comercio con Mesoamérica' },
  { name:'Toltecas', yrs:'~900-1150 d.C.', loc:'Tula, Hidalgo', feat:'Guerreros y artesanos; Atlantes de Tula, influencia en arquitectura maya' },
  { name:'Tlaxcaltecas', yrs:'~1200-1521 d.C.', loc:'Tlaxcala', feat:'Nunca fueron conquistados por los aztecas; aliados de Cortés en 1519' },
];
const HIST_MX = [
  { name:'Guerra de Independencia', yr:1810, hero:'Miguel Hidalgo y Costilla', result:'Inicio del movimiento independentista; Hidalgo proclamó el fin del dominio español' },
  { name:'Consumación de la Independencia', yr:1821, hero:'Agustín de Iturbide', result:'Tratado de Córdoba: México independiente formalmente de España' },
  { name:'Revolución Mexicana', yr:1910, hero:'Francisco I. Madero', result:'Caída de Porfirio Díaz; surge la Constitución de 1917 con derechos sociales' },
  { name:'Constitución de 1917', yr:1917, hero:'Venustiano Carranza', result:'Carta magna vigente; reconoce derechos sociales: tierra, trabajo, educación y salud' },
  { name:'Tratado de Guadalupe Hidalgo', yr:1848, hero:'José Joaquín de Herrera', result:'México perdió ~50% de su territorio ante Estados Unidos (California, Texas, Nuevo México, Arizona)' },
  { name:'Leyes de Reforma', yr:1859, hero:'Benito Juárez', result:'Reforma: separó iglesia y Estado; bienes eclesiásticos transferidos a la nación' },
  { name:'Porfiriato', yr:1876, hero:'Porfirio Díaz', result:'Período de 35 años: estabilidad económica, pero sin libertades políticas ni representación popular' },
  { name:'Caída de Tenochtitlán', yr:1521, hero:'Hernán Cortés', result:'Fin del Imperio Azteca; inicio de la colonización española en el centro de México' },
];
const HIST_WORLD = [
  { name:'Prehistoria', yrs:'Desde ~2.5 millones a.C.', loc:'África (origen de la humanidad)', feat:'Herramientas de piedra, dominio del fuego, arte rupestre en cavernas' },
  { name:'Antiguo Egipto', yrs:'~3100-30 a.C.', loc:'Valle del río Nilo', feat:'Pirámides de Giza como tumbas faraónicas, escritura en papiros, momificación' },
  { name:'Antigua Grecia', yrs:'~776-146 a.C.', loc:'Península griega e islas del Egeo', feat:'Origen de la democracia (Atenas), filosofía (Sócrates, Platón, Aristóteles), Juegos Olímpicos' },
  { name:'Antigua Roma', yrs:'~753 a.C.-476 d.C.', loc:'Península itálica y Mediterráneo', feat:'Derecho romano, idioma latín (origen del español), legions militares, república e imperio' },
  { name:'Imperio Bizantino', yrs:'330-1453 d.C.', loc:'Constantinopla (hoy Estambul, Turquía)', feat:'Cristianismo ortodoxo, preservación de la cultura griega y romana, derecho bizantino' },
  { name:'Imperio Mongol', yrs:'1206-1368 d.C.', loc:'Asia central', feat:'Mayor extensión territorial de la historia (~24 millones km²); Gengis Kan unificó las tribus' },
  { name:'Edad Media', yrs:'Siglos V-XV', loc:'Europa', feat:'Feudalismo (señores y siervos), cruzadas, peste negra, universidades (Bolonia, París)' },
  { name:'Renacimiento', yrs:'Siglos XIV-XVII', loc:'Europa', feat:'Arte y ciencia: Da Vinci, Miguel Ángel, Gutenberg ( imprenta),Copérnico (helicocentrismo)' },
];

function histQuestions(n) {
  const ni = Number(n);
  const qs = [];

  if (ni <= 50) {
    const pre = HIST_PRE[ni % HIST_PRE.length];
    const pre2 = HIST_PRE[(ni+2) % HIST_PRE.length];
    const mx = HIST_MX[ni % HIST_MX.length];
    const mx2 = HIST_MX[(ni+4) % HIST_MX.length];

    qs.push(qMC(`${pre.name} (${pre.yrs}): ¿En qué región se desarrollaron?`, [pre.loc,'Europa','América del Sur','Asia Central'], 0, `${pre.name} se desarrollaron en ${pre.loc}.`));
    qs.push(qMC(`¿Qué característica cultural destaca de la civilización ${pre.name}?`, [pre.feat.split(',')[0],'Escritura alfabética','Aviones','Sistema democrático'], 0, `Los ${pre.name} se distinguieron por: ${pre.feat}.`));
    qs.push(qMatch('Relaciona civilización prehispánica con su legado cultural:', [
      { left: pre.name, right: pre.feat.split(',')[0] },
      { left: pre2.name, right: pre2.feat.split(',')[0] },
    ], `${pre.feat}. ${pre2.feat}.`));

    qs.push(qMC(`La ${mx.name} (${mx.yr}) tuvo como consecuencia:`, [mx.result,'Mayor territorio','Paz total','Independencia total'], 0, `${mx.name}: ${mx.result}.`));
    // Evitar duplicados: opciones incorrectas que no coincidan con el héroe correcto
    const wrongHeroes = ['Hernán Cortés', 'Benito Juárez', 'Porfirio Díaz', 'Miguel Hidalgo', 'Venustiano Carranza'].filter(h => h !== mx2.hero);
    qs.push(qMC(`¿Quién fue el principal protagonista de la ${mx2.name}?`, [mx2.hero, wrongHeroes[0], wrongHeroes[1], wrongHeroes[2]], 0, `${mx2.hero} fue el protagonista de ${mx2.name}.`));
    qs.push(qOrder('Ordena cronológicamente (del más antiguo al más reciente):', [
      'Olmecas (~1500 a.C.)','Mayas (~250 d.C.)','Guerra de Independencia (1810)','Revolución Mexicana (1910)'
    ], 'Olmecas → Mayas → Independencia → Revolución'));
    qs.push(qMC('¿Cuántos años duró la Guerra de Independencia de México (1810-1821)?', ['11 años','5 años','100 años','3 años'], 0, '1810 (Grito de Dolores) a 1821 (Tratado de Córdoba) = 11 años de guerra.'));
    qs.push(qTF(`La ${mx.name} ocurrió en el año ${mx.yr}.`, true, `${mx.name}: ${mx.yr}.`));
  } else {
    const w = HIST_WORLD[ni % HIST_WORLD.length];
    const w2 = HIST_WORLD[(ni+3) % HIST_WORLD.length];

    qs.push(qMC(`${w.name} (${w.yrs}): ¿En qué consistió su mayor logro cultural?`, [w.feat.split(',')[0],'Construcción de satélites','Escritura digital','Energía nuclear'], 0, `${w.feat}.`));
    qs.push(qMC(`¿En qué continente se desarrolló ${w.name}?`, [w.loc.split(' ')[0]==='Europa'?'Europa':w.loc.split(' ')[0]==='África'?'África':w.loc.split(' ')[0]==='Asia'?'Asia':w.loc.split(' ')[0]==='América'?'América':'Europa','América','África','Asia'], 0, `${w.name} tuvo lugar en ${w.loc}.`));
    qs.push(qMatch('Relaciona época histórica con un aporte cultural:', [
      { left: w.name, right: w.feat.split(',')[0] },
      { left: w2.name, right: w2.feat.split(',')[0] },
    ], `${w.feat}. ${w2.feat}.`));

    qs.push(qMC('¿Qué civilización construyó las pirámides de Giza?', ['Egipcios','Mayas','Romanos','Griegos'], 0, 'Los egipcios (~siglo XXVI a.C.) construyeron las pirámides de Giza como tumbas para sus faraones.'));
    qs.push(qTF('La Revolución Industrial (~1760) ocurrió antes que la Revolución Francesa (1789).', true, 'La Revolución Industrial comenzó ~1760 en Gran Bretaña; la Revolución Francesa fue en 1789. 1760 < 1789, por lo tanto la Industrial sí ocurrió antes.'));
    qs.push(qOrder('Ordena: Antigüedad → Edad Media → Época moderna:', ['Grecia y Roma antiguas','Edad Media (siglos V-XV)','Renacimiento y Edad Moderna (siglos XIV-XVII)'], 'Grecia/Roma → Edad Media → Renacimiento'));
    qs.push(qMC('¿Qué documento proclamó los derechos de libertad, propiedad y resistencia a la opresión?', ['Declaración de los Derechos del Hombre y del Ciudadano (1789)','Carta Magna (1215)','Constitución de EE.UU. (1787)','Tratado de Versalles (1919)'], 0, 'La Declaración de 1789, tras la Revolución Francesa, estableció derechos universales.'));
  }

  return qs;
}

// ─────────────────────────────────────────────────────────────────
// GEOGRAPHY — SEP 5º-6º
// ─────────────────────────────────────────────────────────────────
const GEO_ST = [
  { st:'Aguascalientes', cap:'Aguascalientes', zona:'Centro' },
  { st:'Baja California', cap:'Mexicali', zona:'Norte' },
  { st:'Baja California Sur', cap:'La Paz', zona:'Norte' },
  { st:'Campeche', cap:'San Francisco de Campeche', zona:'Sureste' },
  { st:'Coahuila', cap:'Saltillo', zona:'Norte' },
  { st:'Colima', cap:'Colima', zona:'Centro' },
  { st:'Chiapas', cap:'Tuxtla Gutiérrez', zona:'Sureste' },
  { st:'Chihuahua', cap:'Chihuahua', zona:'Norte' },
  { st:'Ciudad de México', cap:'Ciudad de México', zona:'Centro' },
  { st:'Durango', cap:'Victoria de Durango', zona:'Norte' },
  { st:'Guanajuato', cap:'Guanajuato', zona:'Centro' },
  { st:'Guerrero', cap:'Chilpancingo', zona:'Sur' },
  { st:'Hidalgo', cap:'Pachuca', zona:'Centro' },
  { st:'Jalisco', cap:'Guadalajara', zona:'Centro' },
  { st:'México', cap:'Toluca', zona:'Centro' },
  { st:'Michoacán', cap:'Morelia', zona:'Centro' },
  { st:'Morelos', cap:'Cuernavaca', zona:'Centro' },
  { st:'Nayarit', cap:'Tepic', zona:'Oeste' },
  { st:'Nuevo León', cap:'Monterrey', zona:'Norte' },
  { st:'Oaxaca', cap:'Oaxaca', zona:'Sur' },
  { st:'Puebla', cap:'Puebla', zona:'Centro' },
  { st:'Querétaro', cap:'Querétaro', zona:'Centro' },
  { st:'Quintana Roo', cap:'Chetumal', zona:'Sureste' },
  { st:'San Luis Potosí', cap:'San Luis Potosí', zona:'Centro' },
  { st:'Sinaloa', cap:'Culiacán', zona:'Oeste' },
  { st:'Sonora', cap:'Hermosillo', zona:'Noroeste' },
  { st:'Tabasco', cap:'Villahermosa', zona:'Sureste' },
  { st:'Tamaulipas', cap:'Ciudad Victoria', zona:'Noreste' },
  { st:'Tlaxcala', cap:'Tlaxcala', zona:'Centro' },
  { st:'Veracruz', cap:'Xalapa', zona:'Golfo' },
  { st:'Yucatán', cap:'Mérida', zona:'Sureste' },
  { st:'Zacatecas', cap:'Zacatecas', zona:'Norte' },
];
const GEO_RIVERS = [
  { r:'Nilo', km:'6,650 km', cont:'África', note:'El más largo del mundo' },
  { r:'Amazonas', km:'6,400 km', cont:'América del Sur', note:'El de mayor volumen de agua' },
  { r:'Yangtsé', km:'6,300 km', cont:'Asia', note:'El más largo de Asia' },
  { r:'Misisipi', km:'3,734 km', cont:'América del Norte', note:'Principal río de Estados Unidos' },
  { r:'Río Bravo', km:'3,054 km', cont:'América del Norte', note:'Frontera natural entre México y EE.UU.' },
  { r:'Río Lerma', km:'708 km', cont:'México', note:'Uno de los ríos más largos de México, nace en el Estado de México' },
  { r:'Río Usumacinta', km:'1,000 km', cont:'México/Guatemala', note:'El río más caudaloso de México' },
  { r:'Río Grijalva', km:'640 km', cont:'México', note:'Importante río del sureste mexicano' },
];
const GEO_MOUNTS = [
  { m:'Monte Everest', alt:'8,849 m', cont:'Asia', cord:'Himalaya' },
  { m:'Aconcagua', alt:'6,960 m', cont:'América del Sur', cord:'Andes' },
  { m:'Denali', alt:'6,190 m', cont:'América del Norte', cord:'Alaska' },
  { m:'Monte Elbrús', alt:'5,642 m', cont:'Europa', cord:'Cáucaso' },
  { m:'Monte Kilimanjaro', alt:'5,895 m', cont:'África', cord:'No es cordillera' },
];
const GEO_CONTINENTS = [
  { c:'África', area:'30.37 millones km²', hab:'1.4 mil millones' },
  { c:'Antártida', area:'14.2 millones km²', hab:'~1,000 (investigadores)' },
  { c:'Asia', area:'44.58 millones km²', hab:'4.7 mil millones' },
  { c:'Europa', area:'10.18 millones km²', hab:'748 millones' },
  { c:'América del Norte', area:'24.71 millones km²', hab:'600 millones' },
  { c:'América del Sur', area:'17.84 millones km²', hab:'430 millones' },
  { c:'Oceanía', area:'8.53 millones km²', hab:'43 millones' },
];

function geoQuestions(n) {
  const ni = Number(n);
  const qs = [];

  if (ni <= 50) {
    const st = GEO_ST[ni % GEO_ST.length];
    const st2 = GEO_ST[(ni+8) % GEO_ST.length];
    const st3 = GEO_ST[(ni+16) % GEO_ST.length];

    qs.push(qMC(`¿Cuál es la capital del estado de ${st.st}?`, [st.cap,'Ciudad de México','Guadalajara','Monterrey'], 0, `La capital de ${st.st} es ${st.cap}.`));
    const geoZones = ['Norte','Centro','Sur','Este','Oeste','Sureste','Noroeste','Noreste','Golfo'];
    const geoZoneCorrect = st.zona;
    const geoZoneOptions = geoZones.filter(z => z !== geoZoneCorrect);
    // Pick 3 distractors deterministically
    const sel = []; for (let i = 0; i < 3; i++) sel.push(geoZoneOptions[(ni*3+i*5) % geoZoneOptions.length]);
    sel.splice((ni*3)%3, 0, geoZoneCorrect);
    qs.push(qMC(`¿${st.st} se encuentra en qué zona de México?`, sel, sel.indexOf(geoZoneCorrect), `${st.st} está en la zona ${geoZoneCorrect} de México.`));
    qs.push(qMatch('Relaciona estado con su capital:', [
      { left: st.st, right: st.cap },
      { left: st2.st, right: st2.cap },
    ], `${st.cap} capital de ${st.st}. ${st2.cap} capital de ${st2.st}.`));

    qs.push(qMC(`¿Qué océano baña la costa occidental de México?`, ['Océano Pacífico','Océano Atlántico','Mar Caribe','Océano Índico'], 0, 'El Océano Pacífico está al oeste de México, desde Baja California hasta Chiapas.'));
    // Hemisferio — pregunta significativa con países reales
    const hemiQs = [
      {q:'¿En qué hemisferio está la mayor parte de Brasil?',a:'Hemisferio Sur',w:['Hemisferio Norte','Hemisferio Oriental','Hemisferio Occidental']},
      {q:'¿En qué hemisferio está la mayor parte de Rusia?',a:'Hemisferio Norte',w:['Hemisferio Sur','Hemisferio Oriental','Hemisferio Occidental']},
      {q:'¿En qué hemisferio está Australia?',a:'Hemisferio Sur',w:['Hemisferio Norte','Hemisferio Oriental','Hemisferio Occidental']},
      {q:'¿En qué hemisferio está Canadá?',a:'Hemisferio Norte',w:['Hemisferio Sur','Hemisferio Oriental','Hemisferio Occidental']},
      {q:'¿En qué hemisferio está Egipto?',a:'Hemisferio Norte',w:['Hemisferio Sur','Hemisferio Oriental','Hemisferio Occidental']},
      {q:'¿En qué hemisferio está Argentina?',a:'Hemisferio Sur',w:['Hemisferio Norte','Hemisferio Oriental','Hemisferio Occidental']},
      {q:'¿En qué hemisferio está Japón?',a:'Hemisferio Norte',w:['Hemisferio Sur','Hemisferio Oriental','Hemisferio Occidental']},
      {q:'¿En qué hemisferio está Sudáfrica?',a:'Hemisferio Sur',w:['Hemisferio Norte','Hemisferio Oriental','Hemisferio Occidental']},
    ];
    const hemi = hemiQs[ni % hemiQs.length];
    qs.push(qMC(hemi.q, [hemi.a, ...hemi.w], 0, `${hemi.q.replace('¿','').replace('?','')} = ${hemi.a}.`));
    qs.push(qMC('México tiene un total de entidades federativas igual a:', ['32','31','50','26'], 0, '31 estados + 1 Ciudad de México = 32 entidades federativas.'));
    qs.push(qOrder('Ordena estos estados de norte a sur:', ['Baja California','Zacatecas','Guerrero'], 'Baja California (noroeste) → Zacatecas (centro-norte) → Guerrero (sur)' ));
    qs.push(qTF('La Península de Yucatán tiene costas en el Golfo de México y en el Mar Caribe.', true, 'Yucatán y Quintana Roo en el Caribe; Tabasco y Veracruz en el Golfo.'));
  } else {
    const river = GEO_RIVERS[ni % GEO_RIVERS.length];
    const river2 = GEO_RIVERS[(ni+2) % GEO_RIVERS.length];
    const mount = GEO_MOUNTS[ni % GEO_MOUNTS.length];
    const cont = GEO_CONTINENTS[ni % GEO_CONTINENTS.length];

    qs.push(qMC(`¿Cuál es el río más largo del mundo?`, ['Río Nilo','Río Amazonas','Río Yangtsé','Río Misisipi'], 0, `El Nilo tiene ${GEO_RIVERS[0].km}, el Amazonas ${GEO_RIVERS[1].km}: el Nilo es el más largo.`));
    qs.push(qMC(`${river.r} (${river.km}) se encuentra en ${river.cont}. Es conocido por:`, [river.note,'Ser el más profundo','Tener iguanas','Ser navegable'], 0, `${river.r}: ${river.note}.`));
    qs.push(qMatch('Relaciona río con su dato clave:', [
      { left: river.r, right: river.note },
      { left: river2.r, right: river2.note },
    ], `${river.note}. ${river2.note}.`));

    qs.push(qMC(`¿Cuántos continentes hay en el planeta?`, ['7','5','6','8'], 0, 'Los 7 continentes: África, Antártida, Asia, Europa, América del Norte, América del Sur y Oceanía.'));
    qs.push(qMC(`${mount.m} (${mount.alt}) se encuentra en ${mount.cont}, en la cordillera:`, [mount.cord,'Alpes','Rocosas Canadienses','Himalaya'], 0, `${mount.m} está en ${mount.cont}, cordillera ${mount.cord}.`));
    qs.push(qMC('¿Qué tipo de mapa muestra las diferencias de altitud de un terreno?', ['Mapa hipsográfico','Mapa político','Mapa demográfico','Mapa de carreteras'], 0, 'El mapa hipsográfico usa curvas de nivel o colores para representar la altitud.'));
    qs.push(qTF('El continente más grande en superficie es Asia.', true, `Asia: ${GEO_CONTINENTS[2].area}. África: ${GEO_CONTINENTS[0].area}.`));
    qs.push(qMC('¿Cuál es la PRINCIPAL causa del cambio climático actual?', ['Emisiones de CO₂ por quema de combustibles fósiles','Variaciones naturales de la órbita terrestre','Actividad volcánica','Rayos solares'], 0, 'La quema de petróleo, gas y carbón libera CO₂ que atrapa calor: causa principal del calentamiento actual.'));
  }

  return qs;
}

// ─────────────────────────────────────────────────────────────────
// CIVIC EDUCATION — SEP 5º-6º
// ─────────────────────────────────────────────────────────────────
const CIV_ARTS = [
  { a:'Artículo 1º', t:'Protección de derechos humanos: todas las personas gozan de los derechos fundamentales' },
  { a:'Artículo 3º', t:'Derecho a la educación laica, gratuita y obligatoria' },
  { a:'Artículo 6º', t:'Derecho a la libertad de expresión y acceso a la información pública' },
  { a:'Artículo 9º', t:'Derecho de reunión y asociación con fines políticos y sociales' },
  { a:'Artículo 14', t:'Derecho a la justicia: nadie puede ser privado de su libertad sin el debido proceso' },
  { a:'Artículo 27', t:'Derecho a la propiedad: la tierra y los recursos naturales pertenecen a la nación' },
  { a:'Artículo 4', t:'Igualdad de género: el hombre y la mujer son iguales ante la ley' },
  { a:'Artículo 24', t:'Libertad religiosa: toda persona tiene derecho a profesar la creencia que elija' },
  { a:'Artículo 123', t:'Derechos laborales: jornada de 8 horas, salario mínimo, seguridad social y sindicatos' },
];
const CIV_VALS = [
  { v:'Respeto', ex:'Escuchar las opiniones de otros aunque no se esté de acuerdo', no:'Interrumpir o burlarse de alguien' },
  { v:'Responsabilidad', ex:'Cumplir con las tareas y compromisos a tiempo', no:'Dejar todo para después sin asumir consecuencias' },
  { v:'Honestidad', ex:'Decir la verdad aunque sea difícil o incómoda', no:'Copiar en un examen o inventar excusas' },
  { v:'Solidaridad', ex:'Ayudar a un compañero que necesita apoyo', no:'Ignorar a quien necesita ayuda' },
  { v:'Tolerancia', ex:'Aceptar que hay personas con creencias y formas de vida diferentes', no:'Discriminar por apariencia o origen' },
  { v:'Cooperación', ex:'Trabajar en equipo para lograr un objetivo común', no:'Hacer todo solo sin escuchar a los demás' },
];
const CIV_CONFLICT = ['Identificar el problema','Escuchar a todas las personas','Proponer soluciones','Elegir la mejor opción','Aplicarla y evaluar'];
const CIV_DEM = [
  { d:'Voto', r:'Decisión individual para elegir representantes o aprobar decisiones' },
  { d:'Elecciones', r:'Proceso periódico para elegir autoridades mediante voto popular' },
  { d:'Participación ciudadana', r:'Involucrarse en decisiones de la comunidad: asambleas, consultas' },
  { d:'División de poderes', r:'Poderes legislativo, ejecutivo y judicial que se controlan mutuamente' },
];

function civQuestions(n) {
  const ni = Number(n);
  const qs = [];

  if (ni <= 50) {
    const art = CIV_ARTS[ni % CIV_ARTS.length];
    const art2 = CIV_ARTS[(ni+3) % CIV_ARTS.length];
    const val = CIV_VALS[ni % CIV_VALS.length];
    const val2 = CIV_VALS[(ni+2) % CIV_VALS.length];

    qs.push(qMC(`${art.a} de la Constitución establece que:`, [art.t,'El presidente puede eliminar leyes','Las elecciones son cada 100 años','Solo los adultos tienen derechos humanos'], 0, `${art.a}: ${art.t}.`));
    qs.push(qMC(`El valor "${val.v}" se demuestra cuando alguien:`, [val.ex,val.no,'No cumple sus tareas','Ignora a los demás'], 0, `"${val.v}": ${val.ex}.`));
    qs.push(qMatch('Relaciona valor con un ejemplo concreto:', [
      { left: val.v, right: val.ex },
      { left: val2.v, right: val2.ex },
    ], `"${val.v}": ${val.ex}. "${val2.v}": ${val2.ex}.`));

    qs.push(qMC('¿Para qué sirven las reglas de convivencia en la escuela?', ['Mantener orden, respeto y seguridad para todas y todos','Castigar a quienes se portan mal','Separar a los grupos de amigos','Impedir que la gente hable'], 0, 'Las reglas crean un ambiente seguro y de respeto donde todas y todos pueden aprender.'));
    qs.push(qMC('¿Qué institución protege tus derechos humanos en México?', ['Comisión Nacional de los Derechos Humanos (CNDH)','El Ejército','La Secretaría de Hacienda','El banco nacional'], 0, 'La CNDH recibe quejas de quienes consideran vulnerados sus derechos humanos.'));
    qs.push(qOrder('Ordena los pasos para resolver un conflicto de manera pacífica:', CIV_CONFLICT, `${CIV_CONFLICT.join(' → ')}`));
    qs.push(qTF('Todos los niños y adolescentes del mundo tienen los mismos derechos, sin importar su origen, género, religión o discapacidad.', true, 'La Convención sobre los Derechos del Niño (ONU, 1989) establece derechos universales para menores de 18 años.'));
    qs.push(qMC('¿Qué significa "equidad" en la escuela?', ['Dar a cada quien lo que necesita para participar en igualdad de condiciones','Tratar exactamente igual a todas las personas','No dejar que nadie participe si es diferente','Dar más a quien más pide'], 0, 'La equidad reconoce que cada persona parte de condiciones distintas y puede necesitar apoyos diferentes.'));
  } else {
    const dem = CIV_DEM[ni % CIV_DEM.length];
    const dem2 = CIV_DEM[(ni+2) % CIV_DEM.length];

    qs.push(qMC(`¿Qué significa "presunción de inocencia"?`, ['Toda persona es inocente hasta que se demuestre lo contrario','Los ricos son inocentes','El gobierno decide quién es inocente','La policía siempre tiene razón'], 0, 'Principio jurídico fundamental: nadie puede ser tratado como culpable sin sentencia.'));
    qs.push(qMC(`La "${dem.d}" en una democracia significa:`, [dem.r,'Una obligación del gobierno','Un castigo','Una ley obligatoria'], 0, `En una democracia: ${dem.d} = ${dem.r}.`));
    qs.push(qMatch('Relaciona concepto democrático con su significado:', [
      { left: dem.d, right: dem.r },
      { left: dem2.d, right: dem2.r },
    ], `${dem.d}: ${dem.r}. ${dem2.d}: ${dem2.r}.`));

    qs.push(qMC('¿Qué permite a la ciudadanía votar directamente sobre una ley específica?', ['Referéndum','Elección de delegados','Manifestación pacifica','Iniciativa de ley'], 0, 'El referéndum somete una ley ya aprobada por el Congreso a votación ciudadana directa.'));
    qs.push(qMC('¿Por qué es importante la división de poderes?', ['Evita que un solo grupo concentre demasiado poder y lo abuse','Sirve para hacer trámites más rápido','Permite que el presidente tenga más poder','Ayuda a cobrar más impuestos'], 0, 'Separación de poderes: legislativo, ejecutivo y judicial se controlan mutuamente (checks and balances).'));
    qs.push(qTF('Todos los países del mundo han ratificado todos los tratados de derechos humanos.', false, 'No todos los países han firmado o ratificado todos los tratados internacionales de derechos humanos.'));
    qs.push(qOrder('Ordena el proceso de creación de una ley en México:', ['Iniciativa (diputado, presidente o ciudadano)','Discusión y aprobación en el Congreso','Votación','Promulgación y publicación en el DOF'], 'Iniciativa → Discusión → Votación → Promulgación'));
    qs.push(qMC('¿Qué significa "estado de derecho"?', ['Todas las personas e instituciones están sujetas y protegidas por las leyes','El gobierno puede hacer lo que quiera','Las leyes no se aplican a nadie','Solo los jueces deciden todo'], 0, 'Nadie, ni ciudadanos ni gobernantes, está por encima de la ley.'));
  }

  return qs;
}

// ─────────────────────────────────────────────────────────────────
// GEN — Mundo Sorpresa (2 preguntas mezcla de materias)
// ─────────────────────────────────────────────────────────────────
function genQuestions(n) {
  const ni = Number(n);
  const allFns = [matQuestions, espQuestions, cienQuestions, histQuestions, geoQuestions, civQuestions];
  // Pick 2-3 random subjects, take 2 questions from each
  const count = 2 + (ni % 2); // 2 or 3 subjects
  const idxs = [];
  for (let i = 0; i < count; i++) idxs.push((ni + i * 3) % allFns.length);
  const qs = [];
  for (const idx of idxs) {
    const subjectQs = allFns[idx](ni + idx * 7);
    if (subjectQs[0]) qs.push(subjectQs[0]);
    if (subjectQs[1]) qs.push(subjectQs[1]);
  }
  return qs.filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────
// DISPATCHER
// ─────────────────────────────────────────────────────────────────
function lessonPack(key, m) {
  _currentLessonId = `${key}-${m}`;
  let qs;
  switch (key) {
    case 'mat': qs = matQuestions(m); break;
    case 'esp': qs = espQuestions(m); break;
    case 'cien': qs = cienQuestions(m); break;
    case 'hist': qs = histQuestions(m); break;
    case 'geo': qs = geoQuestions(m); break;
    case 'civ': qs = civQuestions(m); break;
    case 'gen': qs = genQuestions(m); break;
    default: qs = [qTF('Pregunta de prueba', true, 'OK')];
  }
  return qs.map((q, i) => ({ id: `q${i+1}`, order: i+1, ...q, answersAccepted: [] }));
}

// ─────────────────────────────────────────────────────────────────
// FIRESTORE HELPERS
// ─────────────────────────────────────────────────────────────────
async function upsertUser(u) {
  const id = normalize(u.nickname);
  const ref = db.collection('users').doc(id);
  const snap = await ref.get();
  const data = { nickname: u.nickname, nicknameNorm: id, pin: String(u.pin), plan: 'free', updatedAt: new Date().toISOString() };
  if (!snap.exists) data.createdAt = admin.firestore.FieldValue.serverTimestamp();
  data.lastLoginAt = admin.firestore.FieldValue.serverTimestamp();
  if (!args.dry) await ref.set(data, { merge: true });
  console.log(snap.exists ? 'updated' : 'created', 'user', id);
}

async function upsertLesson(lesson) {
  if (!args.dry) await db.collection('lessons').doc(lesson.id).set(lesson, { merge: true });
}

async function clearQuestions(lessonId) {
  const col = db.collection('lessons').doc(lessonId).collection('questions');
  const snap = await col.get();
  if (snap.empty) return;
  let batch = db.batch(), n = 0;
  for (const d of snap.docs) { batch.delete(d.ref); n++; if (n >= 400) { if (!args.dry) await batch.commit(); batch = db.batch(); n = 0; } }
  if (n && !args.dry) await batch.commit();
}

async function upsertQuestions(lessonId, questions) {
  await clearQuestions(lessonId);
  let batch = db.batch(), n = 0, written = 0;
  for (const q of questions) {
    batch.set(db.collection('lessons').doc(lessonId).collection('questions').doc(q.id), q, { merge: true });
    n++; written++;
    if (n >= 400) { if (!args.dry) await batch.commit(); batch = db.batch(); n = 0; }
  }
  if (n && !args.dry) await batch.commit();
  return written;
}

// ─────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Triviverso SEP v4 [${START}-${END}] dry=${!!args.dry}`);

  for (const u of FREE_USERS) await upsertUser(u);

  let totalQ = 0;
  for (const s of SUBJECTS) {
    for (let m = START; m <= END; m++) {
      const lessonId = `${s.key}-${m}`;
      await upsertLesson({ id: lessonId, title: `${s.title} · Misión ${m}`, subject: s.key, grade: s.key==='gen'?'5-6':(m<=50?'5º':'6º'), order: s.key.charCodeAt(0)*10000+m, updatedAt: new Date().toISOString() });
      const qs = lessonPack(s.key, m);
      const wrote = await upsertQuestions(lessonId, qs);
      totalQ += wrote;
      if (m % 25 === 0 || m === END) console.log(`✓ ${s.key}-${m} (${wrote} preg)`);
    }
  }

  console.log(`\n✅ ${totalQ} preg / ${SUBJECTS.length} materias × ${END-START+1} misiones.`);
  if (!args.dry) console.log('→ https://mbcx07.github.io/triviaverse/');
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
