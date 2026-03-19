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
function qMC(prompt, options, correctIndex, explanation) {
  const valid = (options || []).filter(o => o !== undefined && String(o).trim() !== '');
  const correct = String(options[correctIndex]);
  const safeIdx = Math.max(0, valid.findIndex(o => String(o) === correct));
  return { type: 'multiple_choice', prompt, options: valid, correctIndex: safeIdx, explanation: explanation || '' };
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

  // Q1: Aritmética — nivel crece con ni
  if (ni <= 33) {
    const a = ((ni*7+3)%50)+2, b = ((ni*13+11)%20)+1;
    qs.push(qMC(`¿Cuánto es ${a} + ${b}?`, [String(a+b), String(a+b+2), String(a+b-2), String(a+b+5)], 0, `${a}+${b}=${a+b}`));
    const mult = [2,3,4,5][(ni*3)%4];
    qs.push(qMC(`¿Cuánto es ${a} × ${mult}?`, [String(a*mult), String(a*mult+mult), String(a*mult-mult), String(a*mult+1)], 0, `${a}×${mult}=${a*mult}`));
  } else if (ni <= 66) {
    const a = ((ni*7)%100)+10, b = ((ni*11)%50)+5;
    qs.push(qMC(`¿Cuánto es ${a} − ${b}?`, [String(a-b), String(a-b+3), String(a-b-3), String(a+b)], 0, `${a}−${b}=${a-b}`));
    const mult = [2,3,4,5,6,7,8,9,10][(ni*3)%9];
    qs.push(qMC(`¿Cuánto es ${a} × ${mult}?`, [String(a*mult), String(a*mult+mult), String(a*mult-mult), String(a*mult+1)], 0, `${a}×${mult}=${a*mult}`));
  } else {
    const a = ((ni*7)%500)+100, b = ((ni*11)%200)+50;
    qs.push(qMC(`¿Cuánto es ${a} + ${b}?`, [String(a+b), String(a+b+1), String(a+b-1), String(a+b+2)], 0, `${a}+${b}=${a+b}`));
    const mult = [6,7,8,9,10,11,12][(ni*5)%7];
    qs.push(qMC(`¿Cuánto es ${a} ÷ ${mult}? (cociente entero)`, [String(Math.floor(a/mult)), String(Math.floor(a/mult)+1), String(Math.floor(a/mult)-1), String(Math.ceil(a/mult))], 0, `${a}÷${mult}=cociente ${Math.floor(a/mult)}, residuo ${a%mult}`));
  }

  // Q2: Fracciones
  if (ni <= 33) {
    const denoms = [2,3,4,5,6,7,8];
    const d1 = denoms[(ni*3)%denoms.length], d2 = denoms[(ni*7)%denoms.length];
    const v1 = 1/d1, v2 = 1/d2;
    const vals = [`1/${d1}`,`1/${d2}`,`${((ni*5)%3)+2}/${d1}`,`${((ni*11)%4)+2}/${d2}`];
    qs.push(qMC(`¿Cuál es la fracción MAYOR: ${vals[0]} o ${vals[1]}?`, vals[0]===vals[1]?vals:[vals[v1>=v2?0:1],vals[v1>=v2?1:0],vals[2],vals[3]], 0, `Como el numerador es igual (1), el denominador más pequeño da la fracción mayor: 1/${Math.min(d1,d2)} > 1/${Math.max(d1,d2)}`));
  } else if (ni <= 66) {
    const d = [3,4,5,6,7,8,9,10][(ni*5)%8];
    const n1 = ((ni*3)%(d-1))+1, n2 = ((ni*7)%(d-1))+1;
    const ans = n1>n2 ? 'Mayor' : n1<n2 ? 'Menor' : 'Igual';
    qs.push(qMC(`¿${n1}/${d} es mayor, menor o igual a ${n2}/${d}?`, ['Mayor','Menor','Igual'], n1>n2?0:n1<n2?1:2, n1>n2?`${n1}/${d}=${(n1/d).toFixed(2)} > ${(n2/d).toFixed(2)}`:n1<n2?`${n1}/${d}=${(n1/d).toFixed(2)} < ${(n2/d).toFixed(2)}`:`${n1}/${d}=${n2}/${d}=${(n1/d).toFixed(2)}`));
  } else {
    const d = [3,4,5,6,7,8,9,10,11,12][(ni*3)%10];
    const whole = ((ni*7)%5)+2;
    const num = whole*d + ((ni*5)%d);
    const mixed = `${whole} ${num% d}/${d}`;
    const wrong1 = `${whole+1} ${num%d}/${d}`, wrong2 = `${whole} ${(num%d)+1}/${d}`, wrong3 = `${whole+1} ${(num%d)+1}/${d}`;
    qs.push(qMC(`¿A qué número mixto equivale ${num}/${d}?`, [mixed, wrong1, wrong2, wrong3], 0, `${num}/${d}=${whole} ${num%d}/${d} porque ${num}=${whole}×${d}+${num%d}`));
  }

  // Q3: Decimales
  if (ni <= 33) {
    const d1 = ((ni*5)%9)+1, d2 = ((ni*7)%9)+1;
    const dec1 = d1/10, dec2 = d2/10;
    qs.push(qMC(`¿Cuál es mayor: ${dec1.toFixed(1)} o ${dec2.toFixed(1)}?`, [dec1>=dec2?dec1.toFixed(1):dec2.toFixed(1), dec1>=dec2?dec2.toFixed(1):dec1.toFixed(1), (dec1+0.2).toFixed(1), (dec2-0.1).toFixed(1)], 0, dec1>=dec2?`${dec1.toFixed(1)} > ${dec2.toFixed(1)}`:`${dec2.toFixed(1)} > ${dec1.toFixed(1)}`));
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
    const data = [(ni*3)%5+1,(ni*7)%5+2,(ni*5)%5+3,(ni*2)%5+1,(ni*11)%5+2,(ni*13)%5+3,(ni*17)%5+1];
    const freq = {}; data.forEach(v => freq[v] = (freq[v]||0)+1);
    const mode = Object.entries(freq).sort((a,b)=>b[1]-a[1])[0][0];
    const modeLabel = `${mode} (se repite ${freq[mode]} veces)`;
    const opts = [...new Set(data)].slice(0,4).map(v => `${v} (se repite ${freq[v]} veces)`);
    qs.push(qMC(`Datos: ${data.sort((a,b)=>a-b).join(', ')}. ¿Cuál es la moda?`, opts.length>=4?opts:[...opts, 'No hay moda'], 0, `La moda es el valor con mayor frecuencia: ${modeLabel}.`));
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
    qs.push(qMC(`¿Qué signo lleva la oración "El perro maulló"?`, ['Punto','Coma','Signo de interrogación','Dos puntos'], 0, `Las oraciones enunciativas (afirman un hecho) terminan con punto (.).`));
    qs.push(qMC(`"¿Cuándo llegas?" inicia con...`, ['Signo de interrogación (¿)','Exclamación (¡)','Coma (,)','Punto y coma (;)'], 0, `En español, las preguntas usan ¿ al inicio y ? al final.`));
  } else if (ni <= 66) {
    qs.push(qMC(`"Llegó tarde; por eso no entró." La punto y coma indica...`, ['Causa o consecuencia','Tiempo','Lugar','Contraste'], 0, `Punto y coma + "por eso/pero" indica consecuencia o contraste entre oraciones.`));
    qs.push(qMC(`¿En qué tipo de palabra se coloca tilde diacrítica?`, ['Pronombres (él, tú, mí)','Sustantivos','Adjetivos','Verbos'], 0, `Tilde diacrítica: él/elle, tú/tu, mí/mi, qué/que, cómo/como, etc. Distinguen significado o función.`));
  } else {
    qs.push(qMC(`"Fue al mercado y compró frutas." ¿Dónde lleva coma?`, ['Después de "mercado"','Antes de "y"','No lleva coma','Antes de "frutas"'], 0, `Se usa coma antes de "y" cuando une oraciones completas: "Fue al mercado, y compró frutas."`));
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
    qs.push(qMC(`"Nosotros estudiamos en la biblioteca." El sujeto es...`, ['Compuesto (plural)','Simple (singular)','Impersonal','Tácito'], 0, `"Nosotros" es pronombre personal de 1ª persona plural: sujeto compuesto.`));
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
    qs.push(qMC(`Sinónimo de "${syn}"`, [ESP_NOUNS[(ni*5+3)%ESP_NOUNS.length],ESP_VERBS[(ni*5+1)%ESP_VERBS.length],ESP_ADJS[(ni*5+2)%ESP_ADJS.length],ESP_PREPS[(ni*5+4)%ESP_PREPS.length]], 0, `Sinónimo: palabra con significado parecido o igual al original.`));
    qs.push(qMC(`Antónimo de "subir"`, ['Bajar','Correr','Volar','Saltar'], 0, `Subir ↔ Bajar: antonimos de dirección vertical.`));
  } else if (ni <= 66) {
    qs.push(qMC(`Antónimo de " honesto"`, ['Deshonesto','Amable','Valiente','Feliz'], 0, `Honesto ↔ Deshonesto: antonimos de veracidad.`));
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
];
const CIEN_SYS6 = [
  { sys:'Endocrino', organ:'Glándulas (tiroides, páncreas)', func:'Producir y secretar hormonas que regulan el cuerpo' },
  { sys:'Linfático', organ:'Ganglios y vasos linfáticos', func:'Filtrar linfa y defender contra infecciones' },
  { sys:' Reproductor', organ:'Ovarios / Testículos', func:'Producir hormonas sexuales y permitir la reproducción' },
  { sys:'Respiratorio', organ:'Pulmones y vías respiratorias', func:'Intercambio gaseoso: O₂ entra, CO₂ sale' },
];
const CIEN_WATER = ['Evaporación','Condensación','Precipitación','Escorrentía / Recolección'];
const CIEN_STATES = ['Sólido','Líquido','Gaseoso','Plasma'];
const CIEN_RENEWA = ['Energía solar','Energía eólica (viento)','Energía geotérmica','Biomasa'];
const CIEN_NONRE = ['Petróleo','Gas natural','Carbón mineral','Uranio'];

function cienQuestions(n) {
  const ni = Number(n);
  const qs = [];

  if (ni <= 50) {
    const t1 = CIEN_SYS5[ni % CIEN_SYS5.length];
    const t2 = CIEN_SYS5[(ni+3) % CIEN_SYS5.length];

    qs.push(qMC(`El sistema ${t1.sys} tiene como función:`, [t1.func,'Producir sonido','Generar luz','Almacenar agua'], 0, `El sistema ${t1.sys} sirve para: ${t1.func}.`));
    qs.push(qMC(`¿Qué órgano pertenece al sistema ${t2.sys}?`, [t2.organ,'Pulmones','Estómago','Huesos'], 0, `${t2.organ} es parte del sistema ${t2.sys}.`));
    qs.push(qMatch('Relaciona sistema con su función:', [
      { left: t1.sys, right: t1.func },
      { left: t2.sys, right: t2.func },
    ], `${t1.func}. ${t2.func}.`));

    qs.push(qMC(`Los estados de la materia son: ${CIEN_STATES.slice(0,3).join(', ')}. Cuando el agua se calienta y se evapora, las partículas...`, ['Se separan y se vuelven gas','Se acercan y se solidifican','Se mantienen igual','Se multiplican'], 0, `Al calentarse, las partículas ganan energía cinética y se separan: sólido → líquido → gas.`));
    qs.push(qOrder('Ordena correctamente el ciclo del agua:', CIEN_WATER, 'Evaporación (el agua sube) → Condensación (forman nubes) → Precipitación (lluvia) → Escorrentía (regreso al mar/río)'));
    qs.push(qTF('Las plantas realizan fotosíntesis: absorben dióxido de carbono y liberan oxígeno.', true, 'Fotosíntesis: CO₂ + luz + agua → glucosa + O₂. Las plantas producen el oxígeno que respiramos.'));
    qs.push(qMC(`Un ecosistema con alta biodiversidad, lluvias todo el año y árboles de más de 20 m es una:`, ['Selva húmeda tropical','Pradera','Desierto','Tundra'], 0, 'La selva tropical tiene la mayor biodiversidad del planeta: clima cálido y húmedo todo el año.'));
  } else {
    const t6 = CIEN_SYS6[ni % CIEN_SYS6.length];
    qs.push(qMC(`El sistema ${t6.sys.trim()} se encarga de:`, [t6.func.split(' ').slice(0,5).join(' '),'Bombear sangre','Digerir alimentos','Mover los huesos'], 0, `El sistema ${t6.sys.trim()}: ${t6.func}.`));
    qs.push(qMC('¿Cuál es la velocidad aproximada de la luz?', ['300,000 km/s','300 km/s','30,000 km/s','3,000,000 km/s'], 0, 'La luz viaja a ~300,000 km por segundo en el vacío.'));
    qs.push(qMC('¿Qué fuerza hace que un auto en movimiento se detenga si no se frena?', ['Fricción (roce)','Gravedad','Inercia','Magnetismo'], 0, 'La fricción es la fuerza de roce entre superficies que se opone al movimiento y lo frena.'));
    qs.push(qOrder('Ordena estados de la materia de MENOS a MÁS energía cinética:', ['Sólido','Líquido','Gas','Plasma'], 'Sólido (partículas fijas) → Líquido (fluyen) → Gas (se expanden) → Plasma (ionizado)'));
    qs.push(qTF('El volumen se mide en metros cuadrados (m²).', false, 'El volumen = metros cúbicos (m³), porque es espacio 3D. El m² mide área (2D).'));
    qs.push(qMC(`¿Cuál de estos recursos es NO-renovable?`, ['Petróleo','Energía solar','Viento','Calor geotérmico'], 0, 'El petróleo se forma en millones de años; se agota en décadas: es no-renovable.'));
    qs.push(qMC('La capa de la Tierra más gruesa es:', ['Manto (~2,900 km)','Núcleo externo (~2,200 km)',' Corteza (~30-50 km)','Atmósfera'], 0, 'El manto es la capa más grande del interior terrestre, entre la corteza y el núcleo.'));
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
];
const HIST_MX = [
  { name:'Guerra de Independencia', yr:1810, hero:'Miguel Hidalgo y Costilla', result:'Inicio del movimiento independentista; Hidalgo proclamó el fin del dominio español' },
  { name:'Consumación de la Independencia', yr:1821, hero:'Agustín de Iturbide', result:'Tratado de Córdoba: México independiente formalmente de España' },
  { name:'Revolución Mexicana', yr:1910, hero:'Francisco I. Madero', result:'Caída de Porfirio Díaz; surge la Constitución de 1917 con derechos sociales' },
  { name:'Constitución de 1917', yr:1917, hero:'Venustiano Carranza', result:'Carta magna vigente; reconoce derechos sociales: tierra, trabajo, educación y salud' },
  { name:'Tratado de Guadalupe Hidalgo', yr:1848, hero:'José Joaquín de Herrera', result:'México perdió ~50% de su territorio ante Estados Unidos (California, Texas, Nuevo México, Arizona)' },
  { name:'Leyes de Reforma', yr:1859, hero:'Benito Juárez', result:'Reforma:分离 iglesia y Estado; bienes eclesiásticos transferidos a la nación' },
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
    qs.push(qMC(`¿Quién fue el principal protagonista de la ${mx2.name}?`, [mx2.hero,'Hernán Cortés','Benito Juárez','Porfirio Díaz'], 0, `${mx2.hero} fue el protagonista de ${mx2.name}.`));
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
    qs.push(qTF('La Revolución Industrial (~1760) ocurrió antes que la Revolución Francesa (1789).', false, 'La Revolución Industrial comenzó ~1760 en Gran Bretaña; la Francesa fue en 1789.'));
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
    const geoZones = ['Norte','Centro','Sur','Este','Oeste'];
    const geoZoneCorrect = st.zona;
    const geoZoneOptions = geoZones.filter(z => z !== geoZoneCorrect).slice(0,3);
    geoZoneOptions.splice((ni*3)%3, 0, geoZoneCorrect);
    qs.push(qMC(`¿${st.st} se encuentra en qué zona de México?`, geoZoneOptions, geoZoneOptions.indexOf(geoZoneCorrect), `${st.st} está en la zona ${geoZoneCorrect} de México.`));
    qs.push(qMatch('Relaciona estado con su capital:', [
      { left: st.st, right: st.cap },
      { left: st2.st, right: st2.cap },
    ], `${st.cap} capital de ${st.st}. ${st2.cap} capital de ${st2.st}.`));

    qs.push(qMC(`¿Qué océano baña la costa occidental de México?`, ['Océano Pacífico','Océano Atlántico','Mar Caribe','Océano Índico'], 0, 'El Océano Pacífico está al oeste de México, desde Baja California hasta Chiapas.'));
    qs.push(qMC(`¿${st3.st} se encuentra en el hemisferio...`, [st3.zona==='Norte'?'Hemisferio Norte':'Hemisferio Sur','Hemisferio Occidental','Hemisferio Oriental','Hemisferio Sur'], 0, `${st3.st} está en el ${st3.zona==='Norte'?'Hemisferio Norte':'Hemisferio Sur'} (latitud ${st3.zona==='Norte'?'14°-32° N':'14°-20° N'}).`));
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
  const idx1 = ni % allFns.length;
  const idx2 = (ni + 3) % allFns.length;
  const qs1 = allFns[idx1](ni);
  const qs2 = allFns[idx2](ni + 7);
  return [qs1[0], qs2[0]].filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────
// DISPATCHER
// ─────────────────────────────────────────────────────────────────
function lessonPack(key, m) {
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
