/* Seed Examen Final - Triviverso
   6 materias × 10 misiones × 6 preguntas = 360 preguntas
   Progresión de dificultad: misión 1 = básico, misión 10 = avanzado
   Usage:
     node scripts/seed-examen-final.js --sa "C:\\secrets\\triviverso.json" --project triviverso
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

const EXAM_SUBJECTS = [
  { key:'exam1', title:'Signos de Puntuación' },
  { key:'exam2', title:'Géneros Narrativos' },
  { key:'exam3', title:'Ecosistemas y Naturaleza' },
  { key:'exam4', title:'Fenómenos Naturales' },
  { key:'exam5', title:'Historia y Cultura de México' },
  { key:'exam6', title:'Valores y Habilidades Socioemocionales' },
];
const FREE_USERS = [
  { nickname:'Amelia', pin:'1703' },
  { nickname:'Isabela', pin:'1234' },
  { nickname:'Milan', pin:'1234' },
  { nickname:'Lili', pin:'1234' },
];
const START = args.from || 1;
const END = args.to || 10;

// ─────────────────────────────────────────────────────────────────
// QUESTION BUILDERS
// ─────────────────────────────────────────────────────────────────
function qMC(prompt, options, correctIndex, explanation) {
  const correct = String(options[correctIndex]);
  const safeIdx = Math.max(0, options.findIndex(o => String(o) === correct));
  return { type: 'multiple_choice', prompt, options, correctIndex: safeIdx, explanation: explanation || '' };
}

// ═════════════════════════════════════════════════════════════════
// EXAM 1: SIGNOS DE PUNTUACIÓN (10 misiones)
// ═════════════════════════════════════════════════════════════════
function exam1Questions(n) {
  const qs = [];
  if (n === 1) {
    qs.push(qMC('¿Qué signo se usa para terminar una oración?', ['Punto (.)','Coma (,)','Dos puntos (:)','Guion (-)'], 0, 'El punto indica el final de una oración.'));
    qs.push(qMC('"Me gusta jugar futbol" — ¿qué falta al final?', ['Un punto','Una coma','Signo de interrogación','Nada, está bien'], 0, 'Toda oración enunciativa termina con punto.'));
    qs.push(qMC('¿Cuál de estas oraciones está bien escrita?', ['El sol brilla.','El sol brilla','El sol brilla,','El sol. brilla'], 0, 'La oración termina correctamente con punto.'));
    qs.push(qMC('Después de un punto, la siguiente palabra empieza con...', ['Mayúscula','Minúscula','Da igual','Nunca hay palabra después'], 0, 'Después de punto se escribe mayúscula.'));
    qs.push(qMC('"Hola me llamo Ana" — ¿dónde debería ir punto?', ['Después de "Ana"','Después de "Hola"','Antes de "Ana"','No necesita punto'], 0, '"Hola, me llamo Ana." — punto al final.'));
    qs.push(qMC('El punto al final de un texto se llama...', ['Punto final','Punto y seguido','Punto y aparte','Punto inicial'], 0, 'El punto final cierra todo el texto.'));
  } else if (n === 2) {
    qs.push(qMC('¿Para qué sirve la coma en una lista?', ['Para separar elementos','Para terminar la oración','Para hacer preguntas','Para poner mayúsculas'], 0, 'La coma separa elementos en enumeraciones.'));
    qs.push(qMC('"Compré pan leche huevos" — ¿dónde faltan comas?', ['Después de pan y leche','Solo después de pan','Al final','No faltan comas'], 0, '"Compré pan, leche, huevos."'));
    qs.push(qMC('¿Cuál frase usa bien las comas?', ['Traje lápiz, goma, regla y cuaderno.','Traje lápiz goma, regla y, cuaderno.','Traje, lápiz, goma, regla, y cuaderno.','Traje lápiz goma regla y cuaderno.'], 0, 'Las comas separan elementos; antes de "y" no lleva coma.'));
    qs.push(qMC('"Mis colores favoritos son rojo azul y verde" — faltan comas, ¿cuántas?', ['2 comas','1 coma','3 comas','0, está bien'], 0, '"rojo, azul y verde" — 2 comas.'));
    qs.push(qMC('En una enumeración, ¿antes de la "y" final se pone coma?', ['No, generalmente no','Sí, siempre','Solo si hay más de 3 cosas','Depende del color'], 0, 'En español no se pone coma antes de "y" en enumeraciones simples.'));
    qs.push(qMC('¿Cuál es el signo que indica una pausa breve?', ['La coma (,)','El punto (.)','El signo de interrogación','La mayúscula'], 0, 'La coma indica una pausa breve al leer.'));
  } else if (n === 3) {
    qs.push(qMC('¿Qué diferencia hay entre punto y seguido y punto y aparte?', ['El punto y aparte cambia de párrafo','Son lo mismo','El punto y seguido termina el texto','El punto y aparte no existe'], 0, 'Punto y aparte: nuevo párrafo. Punto y seguido: misma idea continúa.'));
    qs.push(qMC('Después de un punto y aparte se...', ['Cambia de párrafo y se deja sangría','Sigue en la misma línea','Termina el texto para siempre','Pone una coma'], 0, 'Punto y aparte indica cambio de párrafo.'));
    qs.push(qMC('Si escribo dos oraciones sobre el mismo tema, uso...', ['Punto y seguido','Punto y aparte','Punto final','Coma'], 0, 'Mismo tema = punto y seguido en el mismo párrafo.'));
    qs.push(qMC('Un párrafo es...', ['Un grupo de oraciones sobre una misma idea','Una sola oración','Sinónimo de punto','Una letra mayúscula'], 0, 'El párrafo agrupa oraciones que tratan un mismo tema.'));
    qs.push(qMC('¿Cuántas ideas principales debe tener un párrafo?', ['Una idea principal','Dos o tres','Muchas ideas','Ninguna'], 0, 'Cada párrafo desarrolla una idea principal.'));
    qs.push(qMC('"El perro corre. El gato duerme." ¿Qué tipo de punto separa estas oraciones?', ['Punto y seguido','Punto y aparte','Punto final','No hay punto'], 0, 'Son oraciones seguidas del mismo párrafo: punto y seguido.'));
  } else if (n === 4) {
    qs.push(qMC('¿Cuál oración usa correctamente punto y seguido?', ['Hace calor. Voy a la playa.','Hace calor, voy a la playa.','Hace calor voy a la playa.','Hace calor. voy a la playa.'], 0, 'Dos oraciones completas separadas por punto y seguido.'));
    qs.push(qMC('En un texto, ¿dónde se usa punto y aparte?', ['Para separar párrafos con ideas diferentes','Dentro de una misma oración','Al final de cada palabra','Nunca se usa'], 0, 'Punto y aparte separa párrafos con ideas distintas.'));
    qs.push(qMC('La sangría es...', ['El espacio en blanco al inicio de un párrafo','El punto final de un texto','Un tipo de signo de puntuación','El título del texto'], 0, 'La sangría es el espacio al inicio del párrafo, indica que empieza uno nuevo.'));
    qs.push(qMC('"Terminé la tarea. Ahora voy a jugar." ¿Son del mismo párrafo?', ['Sí, tratan de lo que haré','No, deben ser párrafos separados','No hay suficientes oraciones','Una debe ir en mayúscula'], 0, 'Ambas oraciones son acciones consecutivas: mismo párrafo, punto y seguido.'));
    qs.push(qMC('¿Cómo se ve un texto bien organizado?', ['Con párrafos separados, cada uno con una idea','Con todo junto sin separar','Con una sola oración larga','Con puras comas'], 0, 'Párrafos organizados hacen el texto más fácil de leer.'));
    qs.push(qMC('¿Qué pasa si nunca uso punto y aparte?', ['El texto se vuelve difícil de leer','Se lee mejor','Es obligatorio en poemas','Los signos no importan'], 0, 'Sin separar párrafos, el lector se pierde.'));
  } else if (n === 5) {
    qs.push(qMC('"María, ven aquí." La coma indica...', ['Que se llama a alguien (vocativo)','Una enumeración','El fin de la oración','Un signo de pregunta'], 0, 'La coma del vocativo separa el nombre de la persona a quien se habla.'));
    qs.push(qMC('"Juan, ¿quieres jugar?" ¿Por qué hay coma después de Juan?', ['Porque es un vocativo (se llama a Juan)','Es una enumeración','Para separar párrafos','No debería tener coma'], 0, 'Al nombrar directamente a alguien se usa coma: vocativo.'));
    qs.push(qMC('¿Cuál frase usa coma de vocativo correctamente?', ['Oye, Luis, espera.','Oye Luis, espera.','Oye Luis espera.','Oye, Luis espera.'], 0, 'El nombre Luis va entre comas porque se le está llamando.'));
    qs.push(qMC('"Mi amigo que vive lejos me visitó." ¿Necesita comas?', ['No, "que vive lejos" es información esencial','Sí, antes y después de "que"','Solo antes de "me"','Sí, después de "amigo"'], 0, 'Si la información es esencial para identificar, no lleva comas.'));
    qs.push(qMC('Para insertar una aclaración dentro de una oración usamos...', ['Comas antes y después de la aclaración','Punto y seguido','Solo una coma al inicio','Mayúsculas'], 0, 'Los incisos o aclaraciones van entre comas.'));
    qs.push(qMC('"Mamá, ¿puedo salir?" La coma está para...', ['Llamar la atención de mamá (vocativo)','Separar una lista','Dividir el párrafo','Indicar una pausa cualquiera'], 0, '"Mamá" es vocativo; al llamar a alguien se usa coma.'));
  } else if (n === 6) {
    qs.push(qMC('"Mi hermano, que es doctor, vive lejos." Las comas encierran...', ['Una aclaración o inciso','Una enumeración','Un vocativo','Un error'], 0, 'La información adicional entre comas es un inciso explicativo.'));
    qs.push(qMC('¿Qué son los incisos en un texto?', ['Aclaraciones que van entre comas, paréntesis o rayas','Los signos de interrogación','El título de cada párrafo','Las letras mayúsculas'], 0, 'Un inciso agrega información extra; se encierra entre signos.'));
    qs.push(qMC('"El partido —que duró dos horas— fue emocionante." Las rayas funcionan como...', ['Paréntesis o comas de inciso','Signos de interrogación','Punto y aparte','Mayúsculas'], 0, 'Las rayas (—) también pueden encerrar incisos.'));
    qs.push(qMC('"Los niños (todos menores de 10) jugaron." Los paréntesis contienen...', ['Información adicional no esencial','El sujeto de la oración','El verbo principal','Un error ortográfico'], 0, 'Los paréntesis encierran datos extras o aclaraciones.'));
    qs.push(qMC('Si quito el inciso de una oración, la oración debe...', ['Seguir teniendo sentido completo','Volverse incorrecta','Cambiar de tema','Perder el sujeto'], 0, 'Un buen inciso se puede quitar sin romper la oración.'));
    qs.push(qMC('¿Cuál usa bien las comas de inciso?', ['El libro, que es azul, está en la mesa.','El libro que es azul, está en la mesa.','El libro, que es azul está en la mesa.','El libro que es azul está, en la mesa.'], 0, '"que es azul" es información extra: va entre comas.'));
  } else if (n === 7) {
    qs.push(qMC('El punto y coma (;) se usa para...', ['Separar oraciones relacionadas pero independientes','Terminar un texto','Iniciar una pregunta','Hacer listas de 2 cosas'], 0, 'Punto y coma une oraciones estrechamente relacionadas.'));
    qs.push(qMC('"Estudié mucho; sin embargo, reprobé." El punto y coma va antes de...', ['Una palabra como "sin embargo" o "no obstante"','Cualquier verbo','Una mayúscula','El final del texto'], 0, 'Antes de conectores como "sin embargo", "por lo tanto" se usa ;'));
    qs.push(qMC('¿Cuál frase usa bien el punto y coma?', ['Llovió toda la noche; el patio amaneció mojado.','Llovió toda la noche, el patio amaneció mojado.','Llovió toda la noche. el patio amaneció mojado.','Llovió toda la noche el patio amaneció mojado.'], 0, '; une dos ideas completas muy relacionadas.'));
    qs.push(qMC('Los dos puntos (:) se usan para...', ['Anunciar una lista, cita o explicación','Terminar una pregunta','Separar sílabas','Unir dos palabras'], 0, 'Los dos puntos introducen enumeraciones, ejemplos o citas textuales.'));
    qs.push(qMC('"Necesito: pan, leche y huevos." Los dos puntos anuncian...', ['Una enumeración','Una pregunta','Una respuesta','Un título'], 0, 'Después de dos puntos viene una lista o explicación.'));
    qs.push(qMC('En una carta, después de "Querido amigo:" los dos puntos indican...', ['Que empieza el mensaje','Que termina la carta','Un error','Una pregunta'], 0, 'En cartas, los dos puntos introducen el contenido del mensaje.'));
  } else if (n === 8) {
    qs.push(qMC('"Pienso, luego existo." — ¿Es correcto usar coma aquí?', ['Sí, separa dos ideas breves relacionadas','No, debe llevar punto','No, debe llevar punto y coma','Sí, pero debe llevar mayúscula'], 0, 'La coma une ideas cortas y relacionadas dentro de una misma oración.'));
    qs.push(qMC('"Llegamos tarde: el tráfico estaba pesado." Los dos puntos indican...', ['Una explicación o causa','Una pregunta','Una orden','Un título'], 0, 'Los dos puntos pueden explicar la causa de lo dicho antes.'));
    qs.push(qMC('¿Qué oración usa correctamente los dos puntos?', ['Recuerda: apagar las luces al salir.','Recuerda apagar: las luces al salir.','Recuerda, apagar las luces: al salir.','Recuerda apagar las luces al: salir.'], 0, 'Los dos puntos van antes de la instrucción o explicación.'));
    qs.push(qMC('"Había tres opciones: correr, esconderse o pelear." ¿Es correcto?', ['Sí, los dos puntos anuncian la lista de opciones','No, debe llevar punto','No, las comas están mal','Sí, pero llevaría punto y coma'], 0, 'Dos puntos + enumeración es una estructura correcta.'));
    qs.push(qMC('El punto y coma es más fuerte que... y menos fuerte que...', ['La coma; el punto','El punto; la coma','La coma; la mayúscula','El punto; la raya'], 0, '; es pausa intermedia: más larga que la coma, más corta que el punto.'));
    qs.push(qMC('"Dijo: \'No puedo ir\'." ¿Qué signo se usa para citar palabras textuales?', ['Dos puntos y comillas','Solo comas','Punto y coma','Signos de admiración'], 0, 'Los dos puntos + comillas indican cita textual.'));
  } else if (n === 9) {
    qs.push(qMC('¿Cuál es la función de los signos de interrogación (¿?)?', ['Indicar una pregunta','Terminar una orden','Separar párrafos','Indicar una pausa'], 0, 'En español, las preguntas llevan ¿ al inicio y ? al final.'));
    qs.push(qMC('"¡Qué bonito!" Los signos de exclamación expresan...', ['Emoción, sorpresa o énfasis','Una pregunta','Una orden','Indiferencia'], 0, '¡! expresan emociones fuertes: alegría, enojo, sorpresa.'));
    qs.push(qMC('En español, ¿los signos de interrogación se ponen...?', ['Al inicio (¿) y al final (?)','Solo al final (?)','Solo al inicio (¿)','No se usan'], 0, 'El español es único: usa signo de apertura (¿) y de cierre (?).'));
    qs.push(qMC('"¿Cómo estás?" — ¿Es correcta la puntuación?', ['Sí, abre con ¿ y cierra con ?','No, falta el punto','No, debe llevar comas','Sí, pero debe seguir otra pregunta'], 0, 'La interrogación abre con ¿ y cierra con ?; no necesita punto adicional.'));
    qs.push(qMC('En un diálogo, la raya (—) indica...', ['Que habla un personaje','El final del cuento','Una pregunta','Un grito'], 0, 'En narraciones, — indica cambio de hablante en diálogos.'));
    qs.push(qMC('"—Hola —dijo Ana." Las rayas sirven para...', ['Insertar al narrador dentro del diálogo','Hacer una lista','Cerrar el libro','Poner mayúsculas'], 0, 'Las rayas enmarcan la intervención del narrador dentro de un diálogo.'));
  } else if (n === 10) {
    qs.push(qMC('Lee: "Ana preguntó: ¿vienes? —Sí, voy —respondió Luis." ¿Cuántos signos de puntuación distintos ves?', ['4 (dos puntos, interrogación, raya, punto)','2 (coma y punto)','1 (solo punto)','3 (signos de pregunta)'], 0, 'Hay 4 tipos: : ¿? — . combinados correctamente.'));
    qs.push(qMC('¿Por qué los signos de puntuación son importantes?', ['Ayudan a entender el significado y ritmo del texto','Solo son decoración','Solo sirven en exámenes','No son necesarios para leer'], 0, 'Los signos guían al lector: sin ellos el texto sería confuso.'));
    qs.push(qMC('"No quiero ir. ¿Y tú? ¡Claro que sí!" ¿Qué signos expresan emociones?', ['Interrogación y exclamación','Punto y coma','Dos puntos','Solo las mayúsculas'], 0, '¿? indica pregunta y ¡! indica entusiasmo o emoción.'));
    qs.push(qMC('"Vamos al parque, compramos helado y jugamos." ¿Es correcto?', ['Sí, las comas separan las acciones','No, debe llevar punto en cada acción','No, debe llevar punto y coma','Sí, pero falta punto final'], 0, 'Coma para enumerar acciones consecutivas es correcto.'));
    qs.push(qMC('Al escribir un texto, ¿cuándo revisas los signos de puntuación?', ['Al revisar y corregir el borrador final','Nunca','Solo al pensar el título','Antes de empezar a escribir'], 0, 'La revisión de puntuación es parte de la corrección final.'));
    qs.push(qMC('Un texto sin signos de puntuación es como...', ['Una canción sin ritmo','Una buena película','Un dibujo colorido','Una carta de amor'], 0, 'Sin puntuación el texto no tiene pausas, es difícil de entender.'));
  }
  return qs;
}

// ═════════════════════════════════════════════════════════════════
// EXAM 2: GÉNEROS NARRATIVOS (10 misiones)
// ═════════════════════════════════════════════════════════════════
function exam2Questions(n) {
  const qs = [];
  if (n === 1) {
    qs.push(qMC('¿Qué es un cuento?', ['Una narración breve con pocos personajes','Un texto informativo largo','Una lista de instrucciones','Un poema con rimas'], 0, 'El cuento es una narración corta con inicio, nudo y desenlace.'));
    qs.push(qMC('Las partes principales de un cuento son...', ['Inicio, nudo y desenlace','Título, índice y portada','Introducción, lista y final','Capítulo 1, 2 y 3'], 0, 'Todo cuento tiene: inicio (presentación), nudo (problema), desenlace (solución).'));
    qs.push(qMC('En el INICIO de un cuento se...', ['Presentan los personajes y el lugar','Se resuelve el problema','Se cuenta el final','Se hace una lista'], 0, 'El inicio presenta quiénes son los personajes y dónde ocurre la historia.'));
    qs.push(qMC('¿Qué pasa en el NUDO de un cuento?', ['Surge un problema o conflicto','Se presentan los personajes','Todo termina feliz','Se saluda al lector'], 0, 'El nudo es la parte donde ocurre el problema principal.'));
    qs.push(qMC('El DESENLACE de un cuento es cuando...', ['Se resuelve el problema y termina la historia','Empieza la historia','Los personajes se presentan','El libro se cierra solo'], 0, 'El desenlace es el final: el conflicto se soluciona.'));
    qs.push(qMC('"Había una vez un conejo..." — esta frase indica el...', ['Inicio del cuento','Nudo del cuento','Desenlace','Título del cuento'], 0, '"Había una vez" o "Érase una vez" son frases típicas del inicio.'));
  } else if (n === 2) {
    qs.push(qMC('Los personajes principales de un cuento son...', ['Los que realizan las acciones más importantes','Los que aparecen una sola vez','El narrador solamente','Los animales del bosque'], 0, 'Los personajes principales llevan la acción de la historia.'));
    qs.push(qMC('¿Quién cuenta la historia en un cuento?', ['El narrador','El personaje principal siempre','El lector','El autor en persona'], 0, 'El narrador es la voz que cuenta los hechos (no siempre es el autor).'));
    qs.push(qMC('"Caperucita Roja" es el personaje...', ['Principal','Secundario','Narrador','Antagonista solamente'], 0, 'Caperucita es quien vive la aventura principal: personaje principal.'));
    qs.push(qMC('El lobo en "Caperucita Roja" es...', ['El antagonista (se opone a la protagonista)','El narrador','Un personaje secundario bueno','El protagonista'], 0, 'El antagonista es quien causa el problema al protagonista.'));
    qs.push(qMC('¿Qué hace diferente a cada personaje?', ['Sus características: personalidad, apariencia, acciones','El título del cuento','El color del libro','La letra del texto'], 0, 'Los personajes se distinguen por cómo son, qué hacen y cómo hablan.'));
    qs.push(qMC('Un personaje secundario es aquel que...', ['Ayuda o aparece poco en la historia','Es el más importante','Cuenta la historia','No tiene nombre'], 0, 'Los secundarios ayudan a la historia pero no son el centro.'));
  } else if (n === 3) {
    qs.push(qMC('¿Qué es una fábula?', ['Un cuento breve con animales que enseña una lección','Una historia real de la naturaleza','Un poema sobre la luna','Una lista de reglas'], 0, 'La fábula usa animales como personajes para dar una enseñanza moral.'));
    qs.push(qMC('Al final de una fábula encontramos...', ['Una moraleja o enseñanza','Un chiste','Una lista de compras','Una canción'], 0, 'La moraleja resume la lección que aprendemos de la historia.'));
    qs.push(qMC('¿Quién escribió fábulas famosas como "La liebre y la tortuga"?', ['Esopo','Shakespeare','Cervantes','Harry Potter'], 0, 'Esopo fue un escritor griego famoso por sus fábulas con animales.'));
    qs.push(qMC('En "La cigarra y la hormiga", la moraleja es...', ['Hay que trabajar y prepararse para el futuro','Las hormigas son malas','Cantar es inútil','Siempre hay que divertirse'], 0, 'La cigarra no se preparó para el invierno; la hormiga sí.'));
    qs.push(qMC('Las fábulas usan animales para...', ['Representar virtudes y defectos humanos','Mostrar datos científicos','Hacer enciclopedias','Decorar el libro'], 0, 'Animales con características humanas: el león (poder), la hormiga (trabajo).'));
    qs.push(qMC('¿En qué se diferencia una fábula de un cuento común?', ['La fábula siempre tiene moraleja explícita','Son exactamente iguales','La fábula no tiene personajes','El cuento es más corto'], 0, 'La diferencia clave: la fábula tiene moraleja o enseñanza al final.'));
  } else if (n === 4) {
    qs.push(qMC('¿Qué es una leyenda?', ['Una narración tradicional que mezcla hechos reales y fantásticos','Un texto científico comprobado','Un instructivo para cocinar','Un poema de amor'], 0, 'La leyenda surge de tradiciones orales y mezcla realidad con fantasía.'));
    qs.push(qMC('"La Llorona" es un ejemplo de...', ['Leyenda mexicana','Fábula con animales','Cuento de hadas','Texto informativo'], 0, '"La Llorona" es una leyenda tradicional de México.'));
    qs.push(qMC('Las leyendas se transmitían originalmente...', ['De forma oral, de generación en generación','Por mensajes de texto','En libros de ciencia','Solo en escuelas'], 0, 'Antes de escribirse, las leyendas se contaban de boca en boca.'));
    qs.push(qMC('¿Qué elemento fantástico suele aparecer en leyendas?', ['Fantasmas, dioses o criaturas mágicas','Fórmulas matemáticas','Recetas de cocina','Estadísticas'], 0, 'Las leyendas incluyen seres sobrenaturales en escenarios reales.'));
    qs.push(qMC('Una diferencia entre cuento y leyenda es...', ['La leyenda se basa en tradiciones de un lugar específico','Son exactamente iguales','El cuento es más realista','La leyenda no tiene personajes'], 0, 'Cada leyenda está ligada a un pueblo, ciudad o cultura.'));
    qs.push(qMC('¿Qué intenta explicar una leyenda?', ['El origen de un lugar, fenómeno o tradición','Cómo construir una casa','El clima del día siguiente','Las reglas de un juego'], 0, 'Muchas leyendas explican cómo se formó un volcán, un río o una costumbre.'));
  } else if (n === 5) {
    qs.push(qMC('¿Qué es una novela?', ['Una narración larga con muchos personajes y capítulos','Un cuento de una página','Una lista de palabras','Un solo párrafo'], 0, 'La novela es más extensa que el cuento, con tramas complejas.'));
    qs.push(qMC('Una diferencia entre cuento y novela es...', ['La novela es mucho más larga y compleja','Son exactamente iguales','El cuento tiene más capítulos','La novela no tiene personajes'], 0, 'Extensión: el cuento es breve, la novela puede tener cientos de páginas.'));
    qs.push(qMC('¿Cómo está organizada una novela?', ['En capítulos','En estrofas','En listas numeradas','Solo en párrafos'], 0, 'Los capítulos dividen la novela en partes manejables.'));
    qs.push(qMC('En una novela puede haber...', ['Varios personajes y más de una historia entrelazada','Solo un personaje','Solo un lugar','Menos texto que un cuento'], 0, 'La novela permite tramas paralelas y muchos personajes.'));
    qs.push(qMC('"El Principito" es un ejemplo de...', ['Novela corta','Leyenda','Receta de cocina','Periódico'], 0, '"El Principito" es una novela corta con capítulos y enseñanza.'));
    qs.push(qMC('¿Qué tipo de texto es más largo?', ['Novela','Cuento','Fábula','Adivinanza'], 0, 'La novela es el género narrativo más extenso.'));
  } else if (n === 6) {
    qs.push(qMC('¿En qué orden ocurren las partes de una narración?', ['Inicio → Nudo → Desenlace','Desenlace → Nudo → Inicio','Nudo → Inicio → Desenlace','Inicio → Desenlace → Nudo'], 0, 'La estructura clásica es: Inicio (presentación), Nudo (conflicto), Desenlace (resolución).'));
    qs.push(qMC('En el nudo, el conflicto puede ser...', ['Un problema que el protagonista debe resolver','Solo una conversación tranquila','Un paisaje bonito','El índice del libro'], 0, 'El conflicto es el motor de la historia: algo que rompe la calma inicial.'));
    qs.push(qMC('¿Qué pasaría si un cuento no tuviera nudo?', ['Sería aburrido, no pasaría nada interesante','Sería más divertido','Tendría más personajes','Sería una novela'], 0, 'Sin conflicto no hay historia: solo sería una descripción.'));
    qs.push(qMC('El desenlace puede ser...', ['Feliz, triste o abierto (sin resolver del todo)','Siempre feliz','Siempre triste','Siempre con una boda'], 0, 'Hay desenlaces felices, tristes o incluso finales abiertos.'));
    qs.push(qMC('¿Qué es un final abierto?', ['Un final que deja al lector imaginar qué pasó','Un final muy feliz','Un final que se borró','El principio del cuento'], 0, 'Final abierto: no se dice exactamente qué ocurrió, el lector decide.'));
    qs.push(qMC('Para crear suspenso en el nudo, el autor puede...', ['Agregar obstáculos o peligros inesperados','Contar el final desde el principio','Borrar a los personajes','Poner solo imágenes'], 0, 'El suspenso se crea con dificultades crecientes para el protagonista.'));
  } else if (n === 7) {
    qs.push(qMC('¿Qué es la moraleja de una historia?', ['La enseñanza o lección que deja la narración','El título del libro','El nombre del autor','La primera página'], 0, 'La moraleja es el mensaje que aprendemos después de leer.'));
    qs.push(qMC('"No todo lo que brilla es oro" es una moraleja sobre...', ['No juzgar por las apariencias','Cómo limpiar metales','La minería','La historia del oro'], 0, 'Significa que algo puede parecer bueno y no serlo.'));
    qs.push(qMC('Las fábulas enseñan valores como...', ['Honestidad, esfuerzo, prudencia','Recetas de cocina','Nombres de planetas','Instrucciones técnicas'], 0, 'Cada fábula transmite un valor a través de su moraleja.'));
    qs.push(qMC('¿Las leyendas también tienen enseñanza?', ['Sí, a veces explican consecuencias de acciones','No, nunca','Solo las fábulas','Solo los cuentos infantiles'], 0, 'Algunas leyendas advierten sobre peligros o enseñan respeto.'));
    qs.push(qMC('Después de leer un cuento, ¿qué puedes preguntarte?', ['¿Qué aprendí de esta historia?','¿Cuántas páginas tiene?','¿De qué color es la portada?','¿Quién imprimió el libro?'], 0, 'Reflexionar sobre la enseñanza ayuda a comprender mejor el texto.'));
    qs.push(qMC('"La honestidad siempre triunfa" podría ser moraleja de un cuento sobre...', ['Un niño que dice la verdad aunque tenga problemas','Un concurso de cocina','Un manual de matemáticas','Un libro de chistes'], 0, 'La moraleja resume el valor principal que demuestra la historia.'));
  } else if (n === 8) {
    qs.push(qMC('¿Cuál es una característica común de los cuentos de hadas?', ['Elementos mágicos, príncipes y finales felices','Datos científicos reales','Recetas de cocina','Fórmulas algebraicas'], 0, 'Los cuentos de hadas incluyen magia, reinos y criaturas fantásticas.'));
    qs.push(qMC('Compara: ¿qué tienen en común cuento y fábula?', ['Ambos son narraciones breves con personajes y trama','Nada, son completamente distintos','Ambos son textos científicos','Ambos son recetarios'], 0, 'Cuento y fábula comparten estructura narrativa básica.'));
    qs.push(qMC('Compara: ¿en qué se diferencian leyenda y novela?', ['La leyenda es tradicional/anónima; la novela tiene autor conocido generalmente','Son idénticas','La novela es más corta','La leyenda siempre es escrita'], 0, 'La leyenda es anónima y tradicional; la novela es obra de un autor.'));
    qs.push(qMC('¿Qué género narrativo se basa más en la imaginación que en hechos reales?', ['El cuento fantástico','La leyenda','La noticia periodística','La biografía'], 0, 'El cuento fantástico no necesita basarse en hechos reales.'));
    qs.push(qMC('"Harry Potter" es un ejemplo de...', ['Novela fantástica','Fábula con animales','Leyenda mexicana','Texto informativo'], 0, 'Es una novela larga con elementos mágicos y fantásticos.'));
    qs.push(qMC('¿Puede una leyenda convertirse en novela?', ['Sí, un autor puede expandirla en una historia larga','No, es imposible','Solo si es mexicana','Solo los cuentos pueden'], 0, 'Muchos autores toman leyendas y las convierten en novelas.'));
  } else if (n === 9) {
    qs.push(qMC('Al escribir un cuento propio, ¿qué debes definir primero?', ['Personajes, lugar y conflicto principal','El precio del libro','La editorial','El tipo de papel'], 0, 'Primero planeas quiénes, dónde y cuál será el problema.'));
    qs.push(qMC('Para hacer interesante un personaje, le das...', ['Cualidades, defectos y un objetivo','Solo un nombre','Muchas páginas','Una sola característica'], 0, 'Los personajes buenos tienen virtudes, debilidades y metas.'));
    qs.push(qMC('¿Qué es el ambiente o escenario de una narración?', ['El lugar y el tiempo donde ocurre la historia','El nombre del personaje','La moraleja','El índice'], 0, 'El ambiente describe dónde y cuándo sucede la acción.'));
    qs.push(qMC('Si escribes una fábula, necesitas incluir...', ['Animales con rasgos humanos y una moraleja','Solo personas reales','Datos comprobados','Fórmulas matemáticas'], 0, 'Animales + enseñanza = fábula.'));
    qs.push(qMC('Al crear una leyenda inspirada en tu comunidad, debes...', ['Mezclar un lugar real con un elemento fantástico','Copiar una de internet','Usar solo datos científicos','Evitar mencionar lugares'], 0, 'La leyenda combina sitio real + historia maravillosa.'));
    qs.push(qMC('Revisar tu cuento antes de publicarlo ayuda a...', ['Corregir errores y mejorar la historia','Cambiarle el título nada más','Hacerlo más corto siempre','Borrar a todos los personajes'], 0, 'Revisar es parte esencial del proceso de escritura.'));
  } else if (n === 10) {
    qs.push(qMC('Lee: "Un joven huérfano descubre que es mago y va a una escuela de hechicería." Esto describe...', ['El inicio de una novela fantástica','Una fábula con moraleja','Un texto informativo','Una leyenda anónima'], 0, 'Plantea personaje, descubrimiento y mundo mágico: inicio típico de novela fantástica.'));
    qs.push(qMC('¿Qué necesitas para escribir una novela?', ['Planear capítulos, desarrollar personajes y crear una trama larga','Solo una buena pluma','Un diccionario nada más','Copiar otra novela'], 0, 'La novela requiere planeación extensa: personajes, trama y estructura.'));
    qs.push(qMC('Un lector identifica la moraleja cuando...', ['Reflexiona sobre lo que el protagonista aprendió','Cuenta las páginas','Mira la portada','Lee solo el título'], 0, 'La moraleja se descubre analizando el cambio del personaje principal.'));
    qs.push(qMC('¿Por qué las leyendas siguen vivas hoy?', ['Porque la gente las sigue contando y adaptando','Porque son obligatorias en la escuela','Porque son científicamente exactas','Porque no han cambiado nunca'], 0, 'Las leyendas se mantienen vivas al contarse de generación en generación.'));
    qs.push(qMC('Al comparar dos cuentos del mismo tema, puedes analizar...', ['Personajes, conflicto y desenlace de cada uno','Solo el número de páginas','Únicamente los dibujos','El color de la portada'], 0, 'Comparar estructura y elementos narrativos muestra diferencias y similitudes.'));
    qs.push(qMC('¿Cuál es la mejor forma de entender un género narrativo?', ['Leer varios ejemplos de ese género','Memorizar el diccionario','Ver solo películas','No leer nada'], 0, 'Leer muchos cuentos, fábulas o novelas ayuda a entender cada género.'));
  }
  return qs;
}

// ═════════════════════════════════════════════════════════════════
// EXAM 3: ECOSISTEMAS Y NATURALEZA (10 misiones)
// ═════════════════════════════════════════════════════════════════
function exam3Questions(n) {
  const qs = [];
  if (n === 1) {
    qs.push(qMC('¿Qué es un ecosistema?', ['El conjunto de seres vivos y el lugar donde habitan','Solo los animales de un lugar','Solo las plantas','Un tipo de edificio'], 0, 'Ecosistema = seres vivos + ambiente físico donde interactúan.'));
    qs.push(qMC('Los elementos de un ecosistema son...', ['Seres vivos (bióticos) y elementos sin vida (abióticos)','Solo árboles','Solo animales grandes','Solo el clima'], 0, 'Bióticos: plantas, animales. Abióticos: agua, suelo, luz, temperatura.'));
    qs.push(qMC('El sol en un ecosistema es un factor...', ['Abiótico (sin vida)','Biótico (con vida)','No importa en el ecosistema','Es un ser vivo'], 0, 'El sol no está vivo pero es esencial: factor abiótico.'));
    qs.push(qMC('¿Cuál es un ejemplo de ecosistema?', ['Un bosque con sus árboles, animales, agua y suelo','Solo un charco','Una ciudad sin plantas','Una roca sola'], 0, 'El bosque completo con todo lo que contiene es un ecosistema.'));
    qs.push(qMC('Las plantas en un ecosistema son seres...', ['Bióticos (tienen vida)','Abióticos (sin vida)','Artificiales','De otro planeta'], 0, 'Las plantas nacen, crecen, se reproducen: son bióticos.'));
    qs.push(qMC('El agua en un ecosistema es...', ['Un elemento abiótico esencial para la vida','Un ser vivo','No es importante','Solo existe en océanos'], 0, 'El agua no está viva pero todos los seres vivos la necesitan.'));
  } else if (n === 2) {
    qs.push(qMC('¿Qué es el desierto?', ['Un ecosistema con muy poca lluvia y temperaturas extremas','Un lugar con mucha agua','Un bosque tropical','Un océano'], 0, 'El desierto recibe menos de 250 mm de lluvia al año.'));
    qs.push(qMC('¿Cómo son las temperaturas en el desierto?', ['Muy calientes de día y frías de noche','Siempre templadas','Siempre heladas','Igual que en la playa'], 0, 'En el desierto hay cambios bruscos: calor de día, frío de noche.'));
    qs.push(qMC('Los cactus sobreviven en el desierto porque...', ['Almacenan agua en su interior','No necesitan agua','Tienen aire acondicionado','Beben agua del aire'], 0, 'Los cactus guardan agua en sus tallos gruesos para épocas secas.'));
    qs.push(qMC('¿Qué animal es típico del desierto?', ['El camello','El pingüino','El oso polar','La ballena'], 0, 'El camello está adaptado: aguanta sin agua y soporta el calor.'));
    qs.push(qMC('En el desierto llueve...', ['Muy poco, a veces menos de 250 mm al año','Todos los días','Más que en la selva','Solo nieve'], 0, 'La característica principal del desierto es la escasez de lluvia.'));
    qs.push(qMC('¿Por qué hay poca vegetación en el desierto?', ['Por la falta de agua','Por el exceso de agua','Porque hay muchos animales','Por el frío'], 0, 'Sin suficiente agua, pocas plantas pueden crecer.'));
  } else if (n === 3) {
    qs.push(qMC('¿Qué es la biodiversidad?', ['La variedad de seres vivos en un lugar','El número de montañas','La cantidad de agua','El tipo de suelo'], 0, 'Biodiversidad = diversidad de plantas, animales, hongos y microorganismos.'));
    qs.push(qMC('Un lugar con mucha biodiversidad tiene...', ['Muchas especies diferentes de plantas y animales','Solo una especie','Pura agua','Solo insectos'], 0, 'Selvas tropicales y arrecifes tienen gran biodiversidad.'));
    qs.push(qMC('¿Dónde hay más biodiversidad, en el desierto o en la selva?', ['En la selva, porque hay más agua y recursos','En el desierto','Son iguales','Depende del día'], 0, 'La selva tropical tiene una de las mayores biodiversidades del planeta.'));
    qs.push(qMC('México es un país...', ['Megadiverso (con mucha biodiversidad)','Con poca biodiversidad','Sin plantas ni animales','Con un solo ecosistema'], 0, 'México está entre los 12 países megadiversos del mundo.'));
    qs.push(qMC('La biodiversidad es importante porque...', ['Todos los seres vivos dependen unos de otros','Solo sirve para verse bonito','No tiene utilidad real','Solo sirve para zoológicos'], 0, 'Cada especie cumple un papel en el equilibrio del ecosistema.'));
    qs.push(qMC('Perder biodiversidad significa...', ['Que desaparecen especies de plantas o animales','Que hay más árboles','Que llueve más','Que hace más calor'], 0, 'La pérdida de biodiversidad es cuando especies se extinguen.'));
  } else if (n === 4) {
    qs.push(qMC('¿Qué es una cadena alimenticia?', ['La secuencia de quién come a quién en un ecosistema','Una receta de cocina','Una lista de compras','El horario de comidas'], 0, 'Muestra cómo circula la energía: planta → herbívoro → carnívoro.'));
    qs.push(qMC('En una cadena alimenticia, las plantas son...', ['Productores (fabrican su alimento)','Consumidores primarios','Depredadores','Carroñeros'], 0, 'Las plantas producen su alimento con luz solar (fotosíntesis).'));
    qs.push(qMC('El conejo que come pasto es un...', ['Consumidor primario (herbívoro)','Productor','Consumidor secundario','Descomponedor'], 0, 'Herbívoro = come plantas = consumidor primario.'));
    qs.push(qMC('¿Quién se come al conejo en una cadena?', ['Un consumidor secundario como el zorro','Una planta','El pasto','Un descomponedor'], 0, 'El carnívoro que come herbívoros es consumidor secundario.'));
    qs.push(qMC('Los hongos y bacterias en el ecosistema son...', ['Descomponedores (reciclan materia muerta)','Productores','Consumidores primarios','Depredadores'], 0, 'Descomponedores transforman restos en nutrientes para el suelo.'));
    qs.push(qMC('Orden correcto de una cadena: pasto → saltamontes → rana → serpiente. El saltamontes es...', ['Consumidor primario','Productor','Descomponedor','Consumidor terciario'], 0, 'El saltamontes come planta: consumidor primario.'));
  } else if (n === 5) {
    qs.push(qMC('¿Cómo se relacionan las abejas con las flores?', ['Mutualismo: las abejas obtienen néctar y las flores se polinizan','Competencia: se pelean','Parasitismo: una daña a la otra','No se relacionan'], 0, 'Ambas se benefician: la abeja come y la flor se reproduce.'));
    qs.push(qMC('Cuando dos especies compiten por el mismo alimento, se llama...', ['Competencia','Mutualismo','Comensalismo','Amistad'], 0, 'Competencia: dos especies necesitan el mismo recurso limitado.'));
    qs.push(qMC('El pájaro que come garrapatas del búfalo es ejemplo de...', ['Mutualismo (ambos se benefician)','Competencia','Parasitismo','Indiferencia'], 0, 'El pájaro se alimenta y el búfalo se libra de parásitos.'));
    qs.push(qMC('Una pulga en un perro es ejemplo de...', ['Parasitismo (la pulga daña al perro)','Mutualismo','Comensalismo','Amistad'], 0, 'El parásito se beneficia y el huésped resulta perjudicado.'));
    qs.push(qMC('¿Qué pasaría si desaparecieran todas las abejas?', ['Muchas plantas no se polinizarían y habría menos alimentos','Nada, no sirven','Habría más flores','Los perros volarían'], 0, 'Las abejas son polinizadoras clave para la agricultura.'));
    qs.push(qMC('El comensalismo es cuando...', ['Una especie se beneficia y la otra no es afectada','Ambas se benefician','Ambas se perjudican','Una se come a la otra'], 0, 'Ejemplo: el pez rémora viaja pegado al tiburón sin dañarlo.'));
  } else if (n === 6) {
    qs.push(qMC('¿Qué adaptaciones tienen los animales del desierto?', ['Orejas grandes para disipar calor, pelaje claro, hábitos nocturnos','Piel gruesa para el frío','Mucha grasa como los osos polares','Branquias para respirar'], 0, 'Los animales desérticos evitan el calor y conservan agua.'));
    qs.push(qMC('El zorro del desierto (fénec) tiene orejas grandes para...', ['Disipar el calor corporal','Escuchar a larga distancia','Volar','Guardar agua'], 0, 'Orejas grandes = más superficie para liberar calor.'));
    qs.push(qMC('Muchos animales del desierto son nocturnos porque...', ['De noche hace menos calor y ahorran agua','Les gusta la oscuridad','No hay luna','Es cuando hay más plantas'], 0, 'Salir de noche evita el calor extremo del día.'));
    qs.push(qMC('Las plantas del desierto tienen raíces...', ['Muy largas para buscar agua profunda','Muy cortas','Que no necesitan agua','De colores brillantes'], 0, 'Raíces extensas alcanzan agua subterránea.'));
    qs.push(qMC('¿Cómo se adapta un cactus para no perder agua?', ['Hojas transformadas en espinas y tallo grueso','Hojas muy grandes','Flores todo el año','Raíces fuera de la tierra'], 0, 'Espinas = menos evaporación; tallo grueso = almacén de agua.'));
    qs.push(qMC('Si un animal no está adaptado al desierto...', ['Moriría de calor o deshidratación','Viviría feliz','No pasaría nada','Se convertiría en cactus'], 0, 'Sin adaptaciones no se puede sobrevivir en ambientes extremos.'));
  } else if (n === 7) {
    qs.push(qMC('¿Qué pasa si se rompe una cadena alimenticia?', ['Se desequilibra todo el ecosistema','No pasa nada','Solo afecta a los humanos','Se crean nuevas especies al instante'], 0, 'Cada eslabón depende del anterior; si uno falta, todo se afecta.'));
    qs.push(qMC('Si desaparecen los lobos de un bosque, los ciervos...', ['Aumentan mucho y se comen todas las plantas','Desaparecen también','Se vuelven lobos','No cambian en nada'], 0, 'Sin depredador, los herbívoros crecen sin control y dañan la vegetación.'));
    qs.push(qMC('El equilibrio ecológico significa que...', ['Las poblaciones se mantienen estables en el ecosistema','Un animal domina a todos','No hay plantas','Todo es desierto'], 0, 'Depredadores y presas se regulan mutuamente.'));
    qs.push(qMC('Los humanos afectan los ecosistemas cuando...', ['Talan bosques, contaminan o cazan en exceso','Solo respiran','Plantan más árboles','Reciclan basura'], 0, 'Acciones humanas pueden romper el equilibrio natural.'));
    qs.push(qMC('¿Qué es un área natural protegida?', ['Un lugar donde se cuida la biodiversidad y no se puede destruir','Un centro comercial','Una fábrica','Una carretera'], 0, 'Son reservas donde se conservan ecosistemas y especies.'));
    qs.push(qMC('Reciclar y no tirar basura ayuda a...', ['Proteger los ecosistemas y su biodiversidad','Ensuciar más','Que crezcan edificios','Que no llueva'], 0, 'Pequeñas acciones diarias ayudan a conservar el medio ambiente.'));
  } else if (n === 8) {
    qs.push(qMC('Compara: ¿en qué se parecen desierto y selva?', ['Ambos son ecosistemas con seres vivos adaptados a su clima','Son iguales en todo','Ambos tienen mucha agua','Ambos son fríos'], 0, 'Cada ecosistema tiene condiciones únicas y especies adaptadas.'));
    qs.push(qMC('Compara: diferencia clave entre cadena y red alimenticia', ['La red muestra todas las cadenas interconectadas','Son exactamente lo mismo','La cadena es más compleja','La red solo tiene 2 eslabones'], 0, 'Red alimenticia = varias cadenas juntas mostrando todas las relaciones.'));
    qs.push(qMC('¿Por qué la selva tiene más biodiversidad que el desierto?', ['Tiene más agua, temperatura estable y más recursos','Porque es más bonita','Porque tiene menos animales','Por el color verde'], 0, 'Agua abundante + clima cálido estable = mucha vida.'));
    qs.push(qMC('Si comparas un oso polar y un camello, ambos...', ['Están adaptados a su ambiente específico','Son idénticos','Viven en el mismo lugar','Comen lo mismo'], 0, 'Cada especie evolucionó para sobrevivir en su ecosistema.'));
    qs.push(qMC('¿Qué relación existe entre biodiversidad y estabilidad?', ['Más biodiversidad = ecosistema más resistente a cambios','No hay relación','Menos biodiversidad = más estable','Son conceptos opuestos'], 0, 'Ecosistemas diversos se recuperan mejor de perturbaciones.'));
    qs.push(qMC('En México encontramos desiertos, selvas, bosques y arrecifes porque...', ['Tiene muchos tipos de clima y territorios','Es un país pequeño','Solo tiene un ecosistema','Todos los países son iguales'], 0, 'La geografía mexicana permite gran variedad de ecosistemas.'));
  } else if (n === 9) {
    qs.push(qMC('¿Qué puedes hacer para cuidar la biodiversidad de tu comunidad?', ['Plantar árboles nativos y no tirar basura','Cazar animales','Talar todos los árboles','Contaminar los ríos'], 0, 'Acciones locales ayudan a conservar el ecosistema cercano.'));
    qs.push(qMC('Si ves un animal silvestre lastimado, lo mejor es...', ['Llamar a las autoridades de protección animal','Llevártelo a casa','Ignorarlo','Alimentarlo con dulces'], 0, 'Expertos saben cómo manejar fauna silvestre correctamente.'));
    qs.push(qMC('Para ahorrar agua ayudas al ecosistema porque...', ['El agua es un recurso limitado que todos necesitan','El agua nunca se acaba','A los animales no les importa','Solo los humanos usan agua'], 0, 'Cuidar el agua beneficia a todo el ecosistema.'));
    qs.push(qMC('Al visitar un área natural debes...', ['No dejar basura y respetar a los animales','Llevarte plantas de recuerdo','Gritar fuerte para espantar animales','Hacer fogatas grandes'], 0, 'Turismo responsable protege los ecosistemas.'));
    qs.push(qMC('¿Por qué es importante conocer los ecosistemas de México?', ['Para valorarlos y ayudar a conservarlos','No es importante','Solo para sacar buena nota','Porque están lejos'], 0, 'Conocer genera conciencia y deseos de proteger.'));
    qs.push(qMC('La deforestación afecta la biodiversidad porque...', ['Destruye el hogar de muchas especies','Hace que llueva más','No afecta en nada','Solo cambia el paisaje'], 0, 'Al talar bosques, muchas especies pierden su hábitat.'));
  } else if (n === 10) {
    qs.push(qMC('¿Cuál es el mayor desafío de los ecosistemas actualmente?', ['El cambio climático y la destrucción de hábitats','Demasiados árboles','Exceso de animales','Falta de desiertos'], 0, 'Actividades humanas amenazan el equilibrio de los ecosistemas.'));
    qs.push(qMC('Una especie "en peligro de extinción" es aquella que...', ['Podría desaparecer para siempre si no se protege','Hay muchas en todos lados','Es nueva en el planeta','Es peligrosa para los humanos'], 0, 'Especies como el ajolote o la vaquita marina están en peligro.'));
    qs.push(qMC('Proteger un ecosistema completo es mejor que proteger una sola especie porque...', ['Todas las especies dependen del ecosistema sano','No, es mejor proteger una sola','Los ecosistemas no importan','Las especies se cuidan solas'], 0, 'Salvando el hábitat se salvan todas las especies que viven allí.'));
    qs.push(qMC('¿Cómo puedes explicar a otros la importancia de la biodiversidad?', ['Con ejemplos de cómo todos dependemos de la naturaleza','Con fórmulas matemáticas avanzadas','Diciendo que no importa','Con canciones en otro idioma'], 0, 'Explicar con ejemplos sencillos crea conciencia.'));
    qs.push(qMC('El futuro de los ecosistemas depende de...', ['Las decisiones que tomemos hoy como sociedad','Solo los científicos','Solo los gobiernos','El azar'], 0, 'Cada persona puede contribuir a conservar la naturaleza.'));
    qs.push(qMC('¿Qué aprendiste sobre tu relación con la naturaleza?', ['Soy parte del ecosistema y mis acciones lo afectan','No tengo ninguna relación','Los humanos estamos aparte','La naturaleza no necesita cuidado'], 0, 'Somos una especie más dentro del equilibrio natural.'));
  }
  return qs;
}

// ═════════════════════════════════════════════════════════════════
// EXAM 4: FENÓMENOS NATURALES (10 misiones)
// ═════════════════════════════════════════════════════════════════
function exam4Questions(n) {
  const qs = [];
  if (n === 1) {
    qs.push(qMC('¿Qué es un fenómeno natural?', ['Un cambio que ocurre en la naturaleza sin intervención humana','Algo que solo hacen las personas','Un invento tecnológico','Un tipo de máquina'], 0, 'Lluvia, viento, sismos: fenómenos naturales.'));
    qs.push(qMC('¿Cuál es un ejemplo de fenómeno natural?', ['Un terremoto','Un coche','Un teléfono','Un lápiz'], 0, 'Los terremotos, huracanes y erupciones son fenómenos naturales.'));
    qs.push(qMC('Los fenómenos naturales pueden ser...', ['Peligrosos o benéficos según su intensidad','Siempre malos','Siempre buenos','Siempre pequeños'], 0, 'La lluvia es benéfica, pero en exceso causa inundaciones.'));
    qs.push(qMC('¿Quién provoca los fenómenos naturales?', ['La naturaleza misma, por procesos del planeta','Los extraterrestres','Los animales','Solo los humanos'], 0, 'Son resultado de procesos geológicos y atmosféricos naturales.'));
    qs.push(qMC('Un arcoíris es un fenómeno natural de tipo...', ['Óptico y meteorológico','Geológico','Biológico','Tecnológico'], 0, 'El arcoíris se forma cuando la luz solar atraviesa gotas de lluvia.'));
    qs.push(qMC('¿Por qué es importante conocer los fenómenos naturales?', ['Para prevenir riesgos y protegernos','No es importante','Para provocarlos','Solo para la tarea'], 0, 'Conocer = prevenir. Saber qué hacer salva vidas.'));
  } else if (n === 2) {
    qs.push(qMC('¿Qué es un sismo o terremoto?', ['Un movimiento brusco de la Tierra causado por el choque de placas tectónicas','Una tormenta muy fuerte','Una ola gigante en el mar','Un viento cálido'], 0, 'Los sismos son vibraciones del suelo por liberación de energía.'));
    qs.push(qMC('La capa de la Tierra donde ocurren los sismos se llama...', ['Corteza terrestre','Atmósfera','Océano','Núcleo interno'], 0, 'La corteza está partida en placas que se mueven.'));
    qs.push(qMC('Cuando dos placas tectónicas chocan, puede ocurrir...', ['Un sismo','Un eclipse','Un arcoíris','Una nevada'], 0, 'El choque de placas libera energía en forma de ondas sísmicas.'));
    qs.push(qMC('El lugar donde se origina el sismo bajo tierra se llama...', ['Hipocentro o foco','Epicentro','Volcán','Ojo del huracán'], 0, 'El hipocentro es el punto bajo tierra donde inicia el movimiento.'));
    qs.push(qMC('El punto en la superficie justo arriba del hipocentro se llama...', ['Epicentro','Hipocentro','Volcán','Cráter'], 0, 'El epicentro es donde el sismo se siente con más fuerza en la superficie.'));
    qs.push(qMC('México tiene muchos sismos porque...', ['Está sobre 5 placas tectónicas que interactúan','No tiene sismos','Está muy lejos del mar','Tiene muchos volcanes activos'], 0, 'México está en una zona sísmica muy activa.'));
  } else if (n === 3) {
    qs.push(qMC('¿Cómo se mide la fuerza de un sismo?', ['Con la escala de Richter o de momento','Con un termómetro','Con una regla','Con un reloj'], 0, 'La escala de Richter mide la magnitud (energía liberada).'));
    qs.push(qMC('Un sismo de magnitud 4 se considera...', ['Leve, apenas se siente','Muy destructivo','El más fuerte posible','Inofensivo, no se registra'], 0, 'Magnitud 4: ligero, objetos se mueven, pocos daños.'));
    qs.push(qMC('¿Qué son las réplicas después de un sismo?', ['Sismos más pequeños que ocurren después del principal','El mismo sismo repetido','Sismos inventados','Sismos en otro país'], 0, 'Réplicas: movimientos menores tras el evento principal.'));
    qs.push(qMC('¿Qué daños puede causar un sismo fuerte?', ['Derrumbe de edificios, grietas en el suelo, tsunamis','Solo ruido','Ningún daño','Flores en el suelo'], 0, 'Sismos fuertes (7+) pueden destruir infraestructura.'));
    qs.push(qMC('La intensidad de un sismo se mide con la escala de...', ['Mercalli (daños observados)','Richter (energía)','Celsius (temperatura)','Kilogramos'], 0, 'Mercalli evalúa efectos visibles; Richter mide energía.'));
    qs.push(qMC('Un sismo puede durar...', ['Desde segundos hasta más de un minuto','Varios días','Una semana','Todo el año'], 0, 'La mayoría dura segundos, pero los muy fuertes pueden durar más.'));
  } else if (n === 4) {
    qs.push(qMC('¿Qué debes hacer DURANTE un sismo si estás en un edificio?', ['Agacharte, cubrirte y sujetarte bajo un mueble resistente','Correr a las escaleras','Usar el elevador','Quedarte junto a la ventana'], 0, '"Agáchate, cúbrete, sujétate" es el protocolo de protección.'));
    qs.push(qMC('Durante un sismo NUNCA debes usar...', ['Los elevadores','Las escaleras','Las paredes','La mochila'], 0, 'El elevador puede fallar o atascarse durante un sismo.'));
    qs.push(qMC('Las zonas de seguridad en una escuela son...', ['Lejos de ventanas, bajo mesas fuertes o columnas','Cerca del ventanal','En los pasillos largos','Junto a los libreros'], 0, 'Buscar lugares estructuralmente seguros y sin objetos que caigan.'));
    qs.push(qMC('¿Qué debe tener una mochila de emergencia?', ['Agua, linterna, radio, botiquín y documentos','Solo juguetes','Solo comida chatarra','Un celular cargado'], 0, 'La mochila de emergencia debe tener lo esencial por 72 horas.'));
    qs.push(qMC('Después de un sismo, debes...', ['Revisar si hay heridos, fugas de gas y no tocar cables caídos','Salir corriendo sin rumbo','Encender velas inmediatamente','Ignorar las réplicas'], 0, 'La calma y las acciones seguras evitan más accidentes.'));
    qs.push(qMC('Un simulacro de sismo sirve para...', ['Practicar cómo actuar en un sismo real','Perder el tiempo','Jugar con los amigos','Decorar la escuela'], 0, 'Practicar hace que en una emergencia real actuemos mejor.'));
  } else if (n === 5) {
    qs.push(qMC('¿Qué es un tsunami?', ['Una serie de olas gigantes causadas por un sismo bajo el mar','Un viento muy fuerte','Un tipo de lluvia','Un volcán activo'], 0, 'Sismo submarino = desplazamiento de agua = tsunami.'));
    qs.push(qMC('Los tsunamis son más peligrosos en...', ['Zonas costeras bajas','Montañas muy altas','Desiertos','Ciudades lejos del mar'], 0, 'Las costas son las más afectadas por la llegada de las olas.'));
    qs.push(qMC('¿Qué señal natural anuncia un posible tsunami?', ['El mar se retira dejando el fondo al descubierto','El cielo se pone verde','Los pájaros cantan más fuerte','No hay señales'], 0, 'El retroceso repentino del mar es una señal de alerta natural.'));
    qs.push(qMC('Si hay alerta de tsunami y estás en la costa, debes...', ['Alejarte a zonas altas inmediatamente','Quedarte a ver las olas','Meterte al mar','Tomar fotos'], 0, 'Evacuar a terrenos elevados puede salvar tu vida.'));
    qs.push(qMC('México tiene un sistema de alerta de tsunamis porque...', ['Tiene costas en el Pacífico, zona de alta actividad sísmica','No tiene costas','No hay riesgo','Está en Europa'], 0, 'El Pacífico mexicano está en el "Cinturón de Fuego".'));
    qs.push(qMC('Después de un sismo fuerte cerca del mar, debes...', ['Alejarte de la playa por posible tsunami','Acercarte a ver el mar','Nadar en el mar','Quedarte en la arena'], 0, 'Sismo + costa = riesgo de tsunami: aléjate a zonas altas.'));
  } else if (n === 6) {
    qs.push(qMC('¿Qué causa una erupción volcánica?', ['El magma del interior de la Tierra sale a la superficie','El viento fuerte','La lluvia intensa','Los animales'], 0, 'Cuando la presión interna es mucha, el volcán hace erupción.'));
    qs.push(qMC('El material que arroja un volcán se llama...', ['Lava (cuando sale), magma (cuando está bajo tierra)','Agua','Hielo','Arena'], 0, 'Magma = roca fundida bajo tierra. Lava = magma en la superficie.'));
    qs.push(qMC('México tiene volcanes activos como el...', ['Popocatépetl','Everest','Amazonas','Niágara'], 0, 'El Popocatépetl ("Don Goyo") es uno de los volcanes más activos de México.'));
    qs.push(qMC('Además de lava, un volcán puede arrojar...', ['Ceniza, gases y rocas incandescentes','Solo agua','Solo nieve','Solo flores'], 0, 'La ceniza volcánica puede viajar cientos de kilómetros.'));
    qs.push(qMC('¿Qué debes hacer si cae ceniza volcánica?', ['Cubrir nariz y boca, no tallarse los ojos y limpiar techos','Salir a jugar con la ceniza','Respirar profundo','Ignorarla'], 0, 'La ceniza es dañina para los pulmones y ojos.'));
    qs.push(qMC('Los suelos cerca de volcanes suelen ser fértiles porque...', ['La ceniza volcánica aporta minerales al suelo','No son fértiles','Los volcanes secan la tierra','La lava los quema para siempre'], 0, 'Con el tiempo, la ceniza enriquece el suelo para agricultura.'));
  } else if (n === 7) {
    qs.push(qMC('¿Qué es un huracán?', ['Una tormenta gigante con vientos de más de 118 km/h','Un sismo bajo el mar','Un tipo de volcán','Una lluvia ligera'], 0, 'Los huracanes se forman sobre océanos cálidos.'));
    qs.push(qMC('El centro del huracán se llama...', ['Ojo del huracán','Corazón del huracán','Nariz del huracán','Pie del huracán'], 0, 'En el ojo del huracán hay calma, pero alrededor está la peor parte.'));
    qs.push(qMC('Los huracanes afectan principalmente...', ['Costas e islas del Caribe y el Pacífico','Desiertos','Montañas altas','El Polo Norte'], 0, 'México recibe huracanes tanto del Atlántico como del Pacífico.'));
    qs.push(qMC('Durante un huracán es más seguro...', ['Permanecer en casa, lejos de ventanas y no cruzar ríos','Salir a volar papalotes','Nadar en el mar','Manejar en carretera'], 0, 'Refugiarse en lugares seguros y evitar zonas inundables.'));
    qs.push(qMC('¿Qué hacer si hay inundación?', ['Subir a lugares altos y no caminar en agua corriendo','Meterse a nadar','Beber el agua de la inundación','Manejar rápido'], 0, 'El agua en movimiento es más peligrosa de lo que parece.'));
    qs.push(qMC('El Servicio Meteorológico Nacional ayuda a...', ['Predecir huracanes y emitir alertas','Hacer más fuertes los huracanes','Apagar volcanes','Crear sismos'], 0, 'La información oportuna salva vidas ante fenómenos naturales.'));
  } else if (n === 8) {
    qs.push(qMC('La prevención ante fenómenos naturales incluye...', ['Plan familiar de emergencia, mochila y conocer rutas de evacuación','No hacer nada','Esperar a que pase solo','Salir corriendo sin plan'], 0, 'Estar preparados reduce el riesgo de accidentes.'));
    qs.push(qMC('¿Cada cuánto debes revisar tu mochila de emergencia?', ['Cada 6 meses (caducan alimentos/pilas)','Nunca','Cada 10 años','Solo cuando tiembla'], 0, 'Revisar periódicamente asegura que todo sirva cuando se necesite.'));
    qs.push(qMC('En tu casa, los objetos pesados deben estar...', ['En estantes bajos para que no caigan con un sismo','En estantes altos','Colgando del techo','Junto a la cama'], 0, 'Objetos pesados abajo = menos riesgo de accidentes.'));
    qs.push(qMC('¿Qué número de emergencia se marca en México?', ['911','123','000','999'], 0, 'El 911 es el número único de emergencias en México.'));
    qs.push(qMC('Si escuchas la alerta sísmica, debes...', ['Evacuar con calma siguiendo las rutas establecidas','Quedarte paralizado','Gritar y correr sin dirección','Ignorarla'], 0, 'La alerta sísmica da segundos valiosos para reaccionar.'));
    qs.push(qMC('Compartir información falsa durante una emergencia...', ['Genera pánico y pone en riesgo a las personas','Ayuda a todos','No afecta','Es divertido'], 0, 'Siempre verifica fuentes oficiales antes de compartir.'));
  } else if (n === 9) {
    qs.push(qMC('¿Por qué en México hay tantos fenómenos naturales diferentes?', ['Por su ubicación geográfica: entre placas tectónicas, dos océanos y varios climas','No hay muchos','Solo hay sismos','Es un mito'], 0, 'Ubicación privilegiada pero también vulnerable.'));
    qs.push(qMC('La ciencia que estudia los sismos se llama...', ['Sismología','Meteorología','Biología','Astronomía'], 0, 'Sismología = estudio de terremotos y ondas sísmicas.'));
    qs.push(qMC('Los científicos pueden predecir sismos con exactitud...', ['No, todavía no se puede predecir cuándo ocurrirá uno','Sí, con días de anticipación','Sí, con años de anticipación','Solo en Japón'], 0, 'Aún no existe tecnología para predecir sismos exactamente.'));
    qs.push(qMC('¿Qué es el "Cinturón de Fuego del Pacífico"?', ['Zona de intensa actividad sísmica y volcánica alrededor del Pacífico','Un cinturón de moda','Una película','Un tipo de baile'], 0, 'México forma parte de esta zona de alto riesgo sísmico.'));
    qs.push(qMC('La prevención más efectiva es...', ['Educación y preparación de toda la comunidad','Comprar muchas cosas','Esconderse','No pensar en ello'], 0, 'Comunidades educadas responden mejor ante emergencias.'));
    qs.push(qMC('Si viajas a la playa, ¿qué debes saber sobre tsunamis?', ['Identificar las rutas de evacuación y señales de alerta','Nada, no hay tsunamis en la playa','Meterse más al mar','Ignorar las sirenas'], 0, 'Siempre ubica señalización de evacuación en zonas costeras.'));
  } else if (n === 10) {
    qs.push(qMC('¿Cuál es la mejor actitud ante fenómenos naturales?', ['Informarse, prepararse y mantener la calma','Entrar en pánico y gritar','Ignorar todo','No hacer nada'], 0, 'La preparación reduce el miedo y aumenta la seguridad.'));
    qs.push(qMC('Un plan familiar de emergencia debe incluir...', ['Punto de reunión, contactos de emergencia y roles de cada quien','Solo el nombre de la familia','Una lista de juguetes','Nada'], 0, 'Tener un plan claro ayuda a todos a saber qué hacer.'));
    qs.push(qMC('¿Cómo puedes ayudar a otros después de un desastre natural?', ['Donar víveres, no estorbar a rescatistas y compartir info verificada','Grabar videos para redes sociales','Pedir dinero prestado','Ignorar a los demás'], 0, 'La solidaridad organizada es la mejor ayuda.'));
    qs.push(qMC('La resiliencia comunitaria significa...', ['La capacidad de una comunidad para recuperarse tras un desastre','Rendirse ante el desastre','Culpar a otros','No hacer nada'], 0, 'Comunidades unidas se sobreponen mejor a las emergencias.'));
    qs.push(qMC('Aprendemos sobre fenómenos naturales para...', ['Cuidarnos mejor y ayudar a otros en caso de emergencia','Asustarnos más','Memorizar datos inútiles','Solo para aprobar el año'], 0, 'El conocimiento nos hace más fuertes ante la naturaleza.'));
    qs.push(qMC('¿Qué mensaje compartirías con tu familia sobre este tema?', ['Prepararnos juntos nos mantiene más seguros','Los desastres nunca pasan','No hay nada que hacer','Mejor no hablar de eso'], 0, 'Hablar en familia sobre prevención es un acto de amor.'));
  }
  return qs;
}

// ═════════════════════════════════════════════════════════════════
// EXAM 5: HISTORIA Y CULTURA DE MÉXICO (10 misiones)
// ═════════════════════════════════════════════════════════════════
function exam5Questions(n) {
  const qs = [];
  if (n === 1) {
    qs.push(qMC('¿Qué es una constitución?', ['La ley más importante de un país','Un cuento infantil','Un tipo de edificio','Una receta de cocina'], 0, 'La Constitución es el documento que establece las reglas fundamentales y derechos.'));
    qs.push(qMC('¿En qué año se promulgó la Constitución Mexicana que nos rige actualmente?', ['1917','1810','2000','1521'], 0, 'La Constitución de 1917 se promulgó el 5 de febrero.'));
    qs.push(qMC('La Constitución Mexicana garantiza derechos como...', ['Educación, salud, libertad de expresión','Videojuegos gratis','Comida en todas las escuelas','Vacaciones para todos'], 0, 'Los derechos fundamentales protegen a todos los mexicanos.'));
    qs.push(qMC('¿Cómo se llama el documento que contiene nuestras leyes fundamentales?', ['Constitución Política de los Estados Unidos Mexicanos','Código Civil','Biblia Mexicana','Reglamento Escolar'], 0, 'Es el nombre oficial desde 1917.'));
    qs.push(qMC('La Constitución establece que México es una república...', ['Democrática, representativa y federal','Monárquica','Dictatorial','Colonial'], 0, 'México es una república donde el pueblo elige a sus representantes.'));
    qs.push(qMC('Antes de la Constitución de 1917 hubo otras, como la de...', ['1857','2005','1492','1929'], 0, 'La Constitución de 1857 fue la primera en garantizar libertades individuales.'));
  } else if (n === 2) {
    qs.push(qMC('El Artículo 3° de la Constitución garantiza...', ['Educación laica, gratuita y obligatoria','Comida gratis en escuelas','Vacaciones pagadas para todos','Autos para maestros'], 0, 'Toda persona tiene derecho a recibir educación.'));
    qs.push(qMC('"Laica" significa que la educación...', ['Es independiente de cualquier religión','Es solo para niños ricos','Solo se da en iglesias','Es en latín'], 0, 'La educación laica respeta todas las creencias sin imponer ninguna.'));
    qs.push(qMC('¿Qué libertad protege el Artículo 6°?', ['Libre expresión de ideas','Derecho a portar armas','Derecho a no trabajar','Libertad de construir'], 0, 'Todos podemos expresarnos libremente mientras no dañemos a otros.'));
    qs.push(qMC('El derecho a la salud está en el Artículo...', ['4°','3°','123°','27°'], 0, 'El Artículo 4° garantiza el derecho a la salud y a un medio ambiente sano.'));
    qs.push(qMC('Los derechos humanos aplican a...', ['Todas las personas por igual','Solo a los adultos','Solo a los mexicanos','Solo a los estudiantes'], 0, 'Son universales: aplican a todos sin distinción.'));
    qs.push(qMC('Si alguien viola tus derechos, puedes acudir a...', ['La Comisión Nacional de Derechos Humanos (CNDH)','La tienda','La escuela','El cine'], 0, 'La CNDH protege y defiende los derechos humanos en México.'));
  } else if (n === 3) {
    qs.push(qMC('¿En qué año las mujeres mexicanas obtuvieron el derecho al voto?', ['1953','1910','2000','1810'], 0, 'En 1953 se reconoció el derecho de las mujeres a votar en elecciones federales.'));
    qs.push(qMC('Antes de 1953, las mujeres en México...', ['No podían votar en elecciones federales','Siempre pudieron votar','No querían votar','Votaban más que los hombres'], 0, 'Fue una lucha de décadas de muchas mujeres valientes.'));
    qs.push(qMC('El derecho al voto es parte de los derechos...', ['Políticos','Económicos','Deportivos','Culinarios'], 0, 'Los derechos políticos permiten votar y ser votado.'));
    qs.push(qMC('Votar es importante porque...', ['Permite elegir a nuestros representantes y decidir el rumbo del país','Es un juego','No sirve para nada','Solo votan los presidentes'], 0, 'El voto es la base de la democracia.'));
    qs.push(qMC('Además de votar, las mujeres lucharon por derechos como...', ['Estudiar, trabajar y participar en política','Quedarse en casa sin derechos','No tener educación','Vivir aisladas'], 0, 'La igualdad de derechos ha sido una lucha histórica.'));
    qs.push(qMC('Hoy, las mujeres pueden...', ['Votar, ser presidentas, gobernadoras y ocupar cualquier cargo','Solo votar','Solo ser maestras','Solo trabajar en casa'], 0, 'La Constitución garantiza igualdad de derechos para todos.'));
  } else if (n === 4) {
    qs.push(qMC('¿Quiénes fueron los olmecas?', ['La primera gran civilización de Mesoamérica, "cultura madre"','Los inventores del teléfono','Una tribu europea','Piratas del Caribe'], 0, 'Los olmecas florecieron entre 1500-400 a.C. en Veracruz y Tabasco.'));
    qs.push(qMC('Las enormes cabezas de piedra son obra de los...', ['Olmecas','Mayas','Mexicas','Españoles'], 0, 'Las cabezas colosales olmecas miden hasta 3 metros.'));
    qs.push(qMC('¿Qué construyeron los mayas?', ['Grandes pirámides, como Chichén Itzá y Palenque','Rascacielos de vidrio','Puentes colgantes','Carreteras'], 0, 'Ciudades mayas con templos, observatorios y canchas de juego de pelota.'));
    qs.push(qMC('Los mayas desarrollaron...', ['Un calendario muy preciso y la escritura jeroglífica','La rueda para transporte','La pólvora','La imprenta'], 0, 'El calendario maya era más preciso que el europeo de su época.'));
    qs.push(qMC('¿Dónde se establecieron los mexicas o aztecas?', ['En un islote del lago de Texcoco (hoy CDMX)','En la península de Yucatán','En las montañas de Chihuahua','En la costa de Acapulco'], 0, 'Fundaron México-Tenochtitlan en 1325 según la leyenda del águila.'));
    qs.push(qMC('La ciudad de Tenochtitlan impresionó a los españoles porque...', ['Era más grande y organizada que muchas ciudades europeas','Era muy pequeña','No existía','Era invisible'], 0, 'Tenochtitlan tenía canales, acueductos y más de 200,000 habitantes.'));
  } else if (n === 5) {
    qs.push(qMC('¿Qué cultivaban las civilizaciones mesoamericanas?', ['Maíz, frijol, chile, calabaza y cacao','Papas fritas','Hamburguesas','Pizza'], 0, 'El maíz fue la base de la alimentación y cultura mesoamericana.'));
    qs.push(qMC('La chinampa era...', ['Una técnica agrícola mexica: islas artificiales para cultivar','Un tipo de barco español','Un instrumento musical','Una danza'], 0, 'Las chinampas de Xochimilco siguen siendo ejemplo de agricultura eficiente.'));
    qs.push(qMC('El cacao era tan valioso para los mexicas que...', ['Lo usaban como moneda','Lo tiraban al lago','No les gustaba','Se lo regalaban a cualquiera'], 0, 'Con granos de cacao se pagaban impuestos y se compraban cosas.'));
    qs.push(qMC('Los mayas aportaron al mundo el concepto del número...', ['Cero','Mil','Un millón','Infinito'], 0, 'Los mayas fueron de las primeras culturas en usar el cero.'));
    qs.push(qMC('¿Qué sistema de escritura usaban mayas y mexicas?', ['Jeroglífica (dibujos que representan palabras e ideas)','Alfabeto latino','Braille','Clave Morse'], 0, 'Códices con imágenes y glifos narraban su historia.'));
    qs.push(qMC('El juego de pelota mesoamericano era...', ['Un ritual religioso y deportivo, a veces con significado político','Como el futbol moderno exactamente','Un simple pasatiempo infantil','Inventado en España'], 0, 'Era combinación de deporte, ceremonia religiosa y política.'));
  } else if (n === 6) {
    qs.push(qMC('¿Cómo se organizaba la sociedad mexica?', ['En jerarquías: tlatoani (gobernante), nobles, comerciantes, agricultores','Todos eran iguales sin jerarquía','Solo había reyes','Todos eran soldados'], 0, 'El tlatoani era la máxima autoridad política y religiosa.'));
    qs.push(qMC('El Calmécac era...', ['La escuela donde nobles estudiaban religión, astronomía y estrategia','Un mercado enorme','Un templo abandonado','Un tipo de comida'], 0, 'Educación para la élite. Los demás iban al Telpochcalli.'));
    qs.push(qMC('Los mexicas construyeron templos como...', ['El Templo Mayor en Tenochtitlan','La Torre Eiffel','El Coliseo romano','El Taj Mahal'], 0, 'El Templo Mayor se dedicó a Huitzilopochtli y Tláloc.'));
    qs.push(qMC('¿Qué usaban los mayas para observar el cielo?', ['Observatorios astronómicos como El Caracol en Chichén Itzá','Telescopios modernos','Satélites','Celulares'], 0, 'El Caracol permitía seguir el movimiento de Venus.'));
    qs.push(qMC('La Triple Alianza era la unión entre...', ['Tenochtitlan, Texcoco y Tlacopan','México, EUA y Canadá','España, Portugal e Inglaterra','Olmecas, mayas e incas'], 0, 'Esta alianza militar dominó gran parte de Mesoamérica.'));
    qs.push(qMC('Las culturas mesoamericanas comerciaban productos como...', ['Jade, obsidiana, plumas de quetzal, cacao y textiles','Celulares y tablets','Automóviles','Ropa de marca'], 0, 'El comercio era extenso a través de rutas por todo Mesoamérica.'));
  } else if (n === 7) {
    qs.push(qMC('Los mexicas creían en varios dioses, eran...', ['Politeístas','Monoteístas','Ateos','No tenían creencias'], 0, 'Tenían muchos dioses: Tláloc (lluvia), Huitzilopochtli (guerra), Quetzalcóatl (sabiduría).'));
    qs.push(qMC('¿Por qué hacían sacrificios los mexicas?', ['Creían que alimentaban al Sol para que siguiera saliendo','Por diversión','No los hacían','Para asustar a los niños'], 0, 'Era parte de su cosmovisión: mantener el equilibrio cósmico.'));
    qs.push(qMC('Quetzalcóatl era el dios de...', ['Sabiduría, viento y conocimiento','Terremotos','Dinero','Fútbol'], 0, 'La "serpiente emplumada" era una deidad muy importante.'));
    qs.push(qMC('¿Cómo se llamaba el calendario ritual mexica de 260 días?', ['Tonalpohualli','Gregoriano','Juliano','Lunar'], 0, 'Era usado para ceremonias religiosas y adivinación.'));
    qs.push(qMC('La leyenda del águila sobre el nopal indicaba...', ['Dónde fundar Tenochtitlan','Cómo hacer tamales','Quién sería rey de España','El fin del mundo'], 0, 'Un águila devorando una serpiente sobre un nopal: señal divina.'));
    qs.push(qMC('La cosmovisión mesoamericana veía el universo como...', ['Varios niveles: inframundo, tierra y cielos superpuestos','Un solo nivel plano','Una pelota redonda','Algo insignificante'], 0, 'Creían en 13 cielos y 9 niveles del inframundo.'));
  } else if (n === 8) {
    qs.push(qMC('¿Qué pasó con Tenochtitlan cuando llegaron los españoles?', ['Fue sitiada y cayó en 1521 tras una larga resistencia','Los mexicas se fueron de vacaciones','Se mudaron a otra ciudad','No pasó nada'], 0, 'La caída de Tenochtitlan marcó el fin del Imperio Mexica.'));
    qs.push(qMC('Hoy, México conserva su herencia indígena en...', ['Lenguas, tradiciones, comida y festividades','No conserva nada','Solo en museos','En el extranjero'], 0, '68 lenguas indígenas vivas y tradiciones milenarias.'));
    qs.push(qMC('El Día de Muertos mezcla tradiciones...', ['Mesoamericanas y católicas','Chinas y rusas','Africanas y australianas','No mezcla nada'], 0, 'Ofrendas prehispánicas + celebración cristiana = tradición única.'));
    qs.push(qMC('Palabras como chocolate, tomate y aguacate vienen del...', ['Náhuatl, la lengua de los mexicas','Inglés','Francés','Japonés'], 0, 'El náhuatl nos dejó muchas palabras que usamos a diario.'));
    qs.push(qMC('¿Por qué es importante conocer nuestras culturas ancestrales?', ['Son parte de nuestra identidad y nos enseñan de dónde venimos','No es importante','Solo para arqueólogos','Porque están de moda'], 0, 'Nuestro pasado indígena es orgullo y raíz de México.'));
    qs.push(qMC('Sitios arqueológicos como Teotihuacán y Monte Albán nos muestran...', ['La grandeza de civilizaciones antiguas en México','Cómo vivían los españoles','Edificios modernos','Parques de diversiones'], 0, 'Son Patrimonio de la Humanidad y atraen visitantes de todo el mundo.'));
  } else if (n === 9) {
    qs.push(qMC('¿Qué significa que México sea un país "pluricultural"?', ['Que conviven muchas culturas y tradiciones diferentes','Que solo hay una cultura','Que no tiene cultura propia','Que copia otras culturas'], 0, 'La pluriculturalidad es riqueza: diversidad de pueblos y lenguas.'));
    qs.push(qMC('La Independencia de México (1810) fue...', ['El movimiento para liberarse de España','La fundación de Tenochtitlan','La Revolución Mexicana','La caída del Muro de Berlín'], 0, 'Miguel Hidalgo inició la lucha por la independencia.'));
    qs.push(qMC('La Revolución Mexicana (1910) buscaba...', ['Justicia social, reparto de tierra y derechos laborales','Coronar a un rey','Independizarse de Francia','Comprar más armas'], 0, '"Tierra y Libertad": campesinos lucharon por derechos.'));
    qs.push(qMC('Figuras históricas mexicanas importantes incluyen a...', ['Benito Juárez, Miguel Hidalgo y Josefa Ortiz de Domínguez','Napoleón','Cleopatra','Einstein'], 0, 'Cada uno contribuyó a formar el México que conocemos.'));
    qs.push(qMC('¿Qué aprendemos al estudiar la historia de México?', ['De dónde venimos, qué errores evitar y qué celebrar','Solo fechas aburridas','Nada útil','Mentiras y mitos'], 0, 'La historia nos da identidad y nos guía hacia el futuro.'));
    qs.push(qMC('Los símbolos patrios de México son...', ['La bandera, el himno y el escudo nacional','Solo la bandera','La comida típica','Los volcanes'], 0, 'Los tres símbolos representan nuestra identidad como nación.'));
  } else if (n === 10) {
    qs.push(qMC('¿Por qué la Constitución sigue vigente después de más de 100 años?', ['Se ha reformado para adaptarse, pero su esencia de derechos permanece','No ha cambiado nunca','Ya no sirve','Nadie la respeta'], 0, 'Más de 700 reformas la han actualizado sin perder sus principios.'));
    qs.push(qMC('¿Cómo puedes ejercer tus derechos como ciudadano mexicano?', ['Votando, expresando tus ideas y respetando las leyes','No haciendo nada','Quejándote sin actuar','Dejando que otros decidan'], 0, 'La ciudadanía activa construye un mejor país.'));
    qs.push(qMC('La herencia de las culturas mesoamericanas está presente en...', ['Nuestra comida, idioma, arte y forma de ver el mundo','Solo en los museos','No está presente','En otros países nada más'], 0, 'México vivo: tradiciones que se practican cada día.'));
    qs.push(qMC('¿Qué significa "soberanía nacional"?', ['Que México decide su propio destino sin intervención extranjera','Que otros países mandan','No tener gobierno','Ser colonia'], 0, 'Un pueblo soberano elige su propio camino.'));
    qs.push(qMC('Un buen ciudadano conoce sus derechos pero también...', ['Cumple con sus obligaciones y respeta a los demás','Ignora las leyes','Solo exige sin dar nada','Se aísla de todos'], 0, 'Derechos y obligaciones van juntos en una sociedad.'));
    qs.push(qMC('¿Qué te gustaría que los demás aprendieran sobre la historia de México?', ['Nuestra riqueza cultural y la importancia de la igualdad de derechos','Nada','Solo las guerras','Que es aburrida'], 0, 'Compartir nuestro orgullo histórico es compartir identidad.'));
  }
  return qs;
}

// ═════════════════════════════════════════════════════════════════
// EXAM 6: VALORES Y HABILIDADES SOCIOEMOCIONALES (10 misiones)
// ═════════════════════════════════════════════════════════════════
function exam6Questions(n) {
  const qs = [];
  if (n === 1) {
    qs.push(qMC('¿Qué es la empatía?', ['Ponerse en el lugar de otra persona y entender cómo se siente','No sentir nada por los demás','Ignorar a todos','Hacer lo que uno quiera sin pensar'], 0, 'Empatía = sentir con el otro, comprender sus emociones.'));
    qs.push(qMC('Si un amigo está triste, una actitud empática es...', ['Preguntarle qué le pasa y escucharlo','Burlarse de él','Ignorarlo y seguir jugando','Decirle que exagera'], 0, 'Escuchar sin juzgar es la base de la empatía.'));
    qs.push(qMC('La empatía ayuda a...', ['Crear amistades más fuertes y resolver conflictos','Tener más juguetes','Ser el mejor en deportes','Ganar todas las discusiones'], 0, 'Entender al otro facilita la convivencia y la paz.'));
    qs.push(qMC('¿Cuál es una señal de que alguien tiene empatía?', ['Escucha atentamente y no interrumpe','Solo habla de sí mismo','Se ríe cuando otros lloran','No presta atención'], 0, 'Escuchar activamente demuestra que te importa el otro.'));
    qs.push(qMC('"Trata a los demás como te gustaría ser tratado" es una regla de...', ['Empatía y respeto','Competencia','Egoísmo','Desinterés'], 0, 'La Regla de Oro: empatía básica que existe en muchas culturas.'));
    qs.push(qMC('No tener empatía puede causar...', ['Conflictos, soledad y malentendidos','Muchos amigos','Éxito seguro','Felicidad plena'], 0, 'Sin empatía lastimamos a otros y nos aislamos.'));
  } else if (n === 2) {
    qs.push(qMC('¿Qué es el respeto?', ['Reconocer y aceptar el valor de cada persona','Obedecer sin pensar','Hacer lo que todos quieren','No tener opinión propia'], 0, 'Respetar = valorar a los demás aunque piensen diferente.'));
    qs.push(qMC('Respetar significa aceptar que otros pueden...', ['Tener gustos, ideas y creencias diferentes','Ser idénticos a mí en todo','No existir','Vivir lejos'], 0, 'La diversidad nos enriquece; todas las personas merecen respeto.'));
    qs.push(qMC('Si alguien opina diferente a ti, lo correcto es...', ['Escuchar con respeto aunque no estés de acuerdo','Gritarle que está mal','Dejar de hablarle para siempre','Burlarte de su opinión'], 0, 'Se puede discrepar sin ofender; eso es madurez.'));
    qs.push(qMC('Faltar al respeto incluye...', ['Insultar, burlarse o ignorar los sentimientos de otros','Decir "por favor" y "gracias"','Saludar amablemente','Escuchar con atención'], 0, 'Las palabras y acciones hirientes faltan al respeto.'));
    qs.push(qMC('En el salón de clases, el respeto se demuestra...', ['Levantando la mano para hablar y escuchando a los demás','Gritando para que te oigan','Ignorando al maestro','Hablando todo al mismo tiempo'], 0, 'Respetar turnos y escuchar crea un ambiente de aprendizaje.'));
    qs.push(qMC('¿Por qué es importante respetar a quienes son diferentes?', ['Porque todos merecemos dignidad y un trato justo','No es importante','Solo para adultos','Por obligación sin razón'], 0, 'La diversidad es natural; respetar nos hace mejores personas.'));
  } else if (n === 3) {
    qs.push(qMC('¿Qué es la convivencia?', ['Vivir e interactuar con otras personas de manera pacífica','Estar solo todo el tiempo','Competir siempre','No hablar con nadie'], 0, 'Convivir = compartir espacios, respetar reglas y relacionarnos sanamente.'));
    qs.push(qMC('Para una buena convivencia necesitamos...', ['Respeto, comunicación y colaboración','Discutir todo el tiempo','Imponer nuestras ideas','Aislarnos de los demás'], 0, 'Comunicación clara + respeto mutuo = buena convivencia.'));
    qs.push(qMC('Un conflicto de convivencia se resuelve mejor con...', ['Diálogo y buscando una solución juntos','Gritos y empujones','Ignorando el problema','Acusando al otro'], 0, 'Hablar directamente y buscar acuerdos resuelve mejor los conflictos.'));
    qs.push(qMC('Las reglas de convivencia en la escuela sirven para...', ['Que todos estemos seguros y aprendamos mejor','Molestar a los estudiantes','Hacer todo aburrido','Solo castigar'], 0, 'Reglas claras = ambiente justo y seguro para todos.'));
    qs.push(qMC('¿Qué haces si ves que molestan a un compañero?', ['Decirle a un adulto y apoyar al compañero','Unirte a las burlas','Grabar con el celular','Ignorarlo'], 0, 'Ser testigo y no hacer nada también lastima. Defiende con respeto.'));
    qs.push(qMC('La convivencia pacífica se construye con...', ['Pequeñas acciones diarias de respeto y amabilidad','Grandes discursos nada más','Solo con dinero','Con amenazas'], 0, 'Saludar, compartir, ayudar: pequeñas acciones, gran impacto.'));
  } else if (n === 4) {
    qs.push(qMC('Las emociones básicas incluyen...', ['Alegría, tristeza, enojo, miedo y sorpresa','Solo felicidad','Solo enojo','Aburrimiento nada más'], 0, 'Todas las emociones son válidas; lo importante es expresarlas sanamente.'));
    qs.push(qMC('Cuando sientes enojo, una forma sana de manejarlo es...', ['Respirar profundo, calmarte y luego hablar','Golpear cosas o personas','Gritar lo más fuerte posible','Guardarlo para siempre'], 0, 'Sentir enojo es normal; manejarlo sin dañar es madurez.'));
    qs.push(qMC('Llorar cuando estás triste es...', ['Una forma natural y sana de expresar emociones','Algo malo que debes evitar','Una señal de debilidad','Solo para bebés'], 0, 'Expresar tristeza no es debilidad: es humano.'));
    qs.push(qMC('Identificar lo que sientes te ayuda a...', ['Manejar mejor tus emociones y relacionarte sanamente','Sentirte peor','No hacer nada','Ignorar a los demás'], 0, 'Conocerte a ti mismo es el primer paso para el bienestar.'));
    qs.push(qMC('El "semáforo de las emociones" ayuda a...', ['Rojo: parar. Amarillo: pensar. Verde: actuar','Manejar un auto rápido','Ver películas','Cocinar mejor'], 0, 'Técnica: detente, piensa en lo que sientes, actúa con calma.'));
    qs.push(qMC('Compartir cómo te sientes con alguien de confianza...', ['Ayuda a sentirte comprendido y aliviado','Es malo y peligroso','No sirve de nada','Solo lo hacen los débiles'], 0, 'Hablar de emociones fortalece vínculos y alivia el estrés.'));
  } else if (n === 5) {
    qs.push(qMC('¿Qué es la identidad?', ['El conjunto de características que nos hacen únicos','El nombre de la escuela','La dirección de tu casa','El número de lista'], 0, 'Identidad = quién eres: gustos, valores, historia personal y cultura.'));
    qs.push(qMC('Tu identidad incluye...', ['Tus gustos, valores, familia, cultura y experiencias','Solo tu nombre','Solo tu edad','Tu número de teléfono'], 0, 'Somos una mezcla única de todo lo que hemos vivido y aprendido.'));
    qs.push(qMC('¿Qué significa "identidad de género"?', ['Cómo se identifica una persona: hombre, mujer u otra identidad','El país donde naciste','Tu equipo favorito','Tu huella digital'], 0, 'Es parte de quién eres y cómo te percibes a ti mismo.'));
    qs.push(qMC('Todas las personas merecen respeto sin importar...', ['Su identidad de género, origen o apariencia','Su gusto musical','Su comida favorita','Su equipo de fútbol'], 0, 'La dignidad humana no depende de ninguna característica.'));
    qs.push(qMC('Descubrir tu identidad es un proceso que...', ['Toma tiempo y cambia a lo largo de la vida','Ocurre en un solo día','Nunca cambia','No existe'], 0, 'Crecemos, aprendemos y nuestra identidad se enriquece.'));
    qs.push(qMC('Apoyar a alguien que está descubriendo su identidad significa...', ['Escuchar sin juzgar y respetar su proceso','Decirle que está mal','Obligarlo a cambiar','Burlarse'], 0, 'El apoyo y respeto ayudan a crecer con seguridad.'));
  } else if (n === 6) {
    qs.push(qMC('¿Qué es la asertividad?', ['Expresar tus necesidades y opiniones con respeto','Decir siempre que sí a todo','Imponer tus ideas a la fuerza','Callar siempre lo que piensas'], 0, 'Asertividad = comunicar lo que quieres sin agredir ni someterte.'));
    qs.push(qMC('Decir "no" de forma asertiva es...', ['Explicar tu razón con calma y sin ofender','Gritar "NO" y salir corriendo','Decir que sí aunque no quieras','No responder nada'], 0, 'Puedes negarte sin lastimar; es tu derecho.'));
    qs.push(qMC('Si alguien te trata mal, una respuesta asertiva sería...', ['"No me gusta que me hables así, por favor respétame"','Devolverle el insulto más fuerte','Quedarte callado para siempre','Empujarlo'], 0, 'Defenderte con firmeza y sin violencia es asertividad.'));
    qs.push(qMC('La comunicación asertiva mejora...', ['Las relaciones con amigos, familia y maestros','Los gritos en casa','Los conflictos sin solución','El silencio total'], 0, 'Expresarte claramente evita malentendidos.'));
    qs.push(qMC('¿Cuál es un ejemplo de NO ser asertivo?', ['Callar cuando algo te molesta y luego explotar de enojo','Decir con calma lo que te incomoda','Pedir ayuda cuando la necesitas','Agradecer un cumplido'], 0, 'Guardar emociones sin expresar termina estallando de forma dañina.'));
    qs.push(qMC('Ser asertivo no significa...', ['Imponer siempre tu opinión sin escuchar a otros','Comunicar con respeto','Defender tus derechos','Hablar sin agredir'], 0, 'Asertividad no es imposición; incluye escuchar al otro.'));
  } else if (n === 7) {
    qs.push(qMC('¿Qué es la inclusión?', ['Aceptar y valorar a todas las personas sin excluir a nadie','Poner a todos contra todos','Formar grupos solo de amigos','Rechazar al diferente'], 0, 'Incluir = nadie se queda fuera, todos participan.'));
    qs.push(qMC('Un salón inclusivo es aquel donde...', ['Todos pueden participar sin importar sus diferencias','Solo participan los más populares','Se burlan de quien es diferente','Hay que ser igual a todos'], 0, 'Cada persona aporta algo único: la inclusión lo celebra.'));
    qs.push(qMC('Excluir a alguien por ser diferente se llama...', ['Discriminación','Inclusión','Respeto','Amistad'], 0, 'Discriminar es negar derechos o trato justo por diferencias.'));
    qs.push(qMC('Incluir a un compañero nuevo en el juego es un acto de...', ['Inclusión y empatía','Discriminación','Competencia','Enojo'], 0, 'Pequeños gestos de inclusión hacen gran diferencia.'));
    qs.push(qMC('Las personas con discapacidad tienen derecho a...', ['Participar plenamente en la escuela y sociedad','Ser excluidas','No estudiar','Vivir aisladas'], 0, 'La inclusión garantiza accesibilidad y oportunidades para todos.'));
    qs.push(qMC('¿Cómo puedes promover la inclusión?', ['Invitando a jugar a quien está solo y respetando diferencias','Formando grupos cerrados','Ignorando a los nuevos','Burlándote de otros'], 0, 'La inclusión empieza con acciones simples de cada persona.'));
  } else if (n === 8) {
    qs.push(qMC('Resolver un conflicto pacíficamente implica...', ['Dialogar, escuchar y buscar una solución justa para todos','Ganar a toda costa','Ignorar el problema hasta que desaparezca','Culpar al otro de todo'], 0, 'El diálogo busca acuerdos, no culpables.'));
    qs.push(qMC('¿Qué es un mediador en un conflicto?', ['Alguien neutral que ayuda a las partes a dialogar','El que decide quién gana','El más fuerte','Un castigo'], 0, 'Mediador = facilita comunicación, no impone soluciones.'));
    qs.push(qMC('Para resolver un conflicto, primero hay que...', ['Calmarse y luego hablar','Gritar más fuerte que el otro','Irse y no volver','Acusar con las autoridades'], 0, 'Con emociones alteradas no se piensa bien: primero calma.'));
    qs.push(qMC('Una solución "ganar-ganar" significa que...', ['Ambas partes obtienen algo positivo','Uno gana y el otro pierde','Todos pierden','No hay solución'], 0, 'Negociar para beneficio mutuo fortalece la relación.'));
    qs.push(qMC('Pedir disculpas sinceras implica...', ['Reconocer el error, reparar el daño y no repetirlo','Decir "perdón" sin sentirlo','Echarle la culpa al otro','Olvidar lo que pasó sin más'], 0, 'Disculpa real = reconocer, reparar, cambiar.'));
    qs.push(qMC('Después de resolver un conflicto, la amistad puede...', ['Fortalecerse si se manejó con respeto','Solo empeorar','Desaparecer siempre','No importar'], 0, 'Conflictos bien resueltos enseñan y unen más.'));
  } else if (n === 9) {
    qs.push(qMC('¿Qué significa "autoestima"?', ['El valor y aprecio que sientes por ti mismo','Cuánto dinero tienes','Qué tan popular eres','Las notas de la escuela'], 0, 'Autoestima = quererte y valorarte como persona única.'));
    qs.push(qMC('Una autoestima sana se construye con...', ['Reconocer tus cualidades y aceptar tus áreas de mejora','Compararte siempre con otros','Creer que eres perfecto en todo','Ignorar tus sentimientos'], 0, 'Amarte incluye aceptar fortalezas y debilidades.'));
    qs.push(qMC('Si te equivocas, una reacción con buena autoestima es...', ['Aprender del error e intentarlo de nuevo','Sentir que no vales nada','Culpar a los demás','Rendirte para siempre'], 0, 'Los errores enseñan; no definen tu valor.'));
    qs.push(qMC('Los cumplidos sinceros ayudan a...', ['Fortalecer la autoestima de quien los recibe','Hacer sentir mal a otros','Competir por atención','Nada, no sirven'], 0, 'Decir cosas bonitas con sinceridad construye a otros.'));
    qs.push(qMC('Compararte constantemente con otros...', ['Daña tu autoestima porque cada persona es única','Es la mejor forma de crecer','Siempre ayuda','No afecta en nada'], 0, 'Cada quien tiene su propio camino; compárate contigo mismo.'));
    qs.push(qMC('Cuidar tu cuerpo, mente y emociones es parte de...', ['Tener una autoestima y bienestar integral','Ser egoísta','Perder el tiempo','Solo los adultos lo hacen'], 0, 'Bienestar = cuerpo sano + mente tranquila + emociones equilibradas.'));
  } else if (n === 10) {
    qs.push(qMC('¿Por qué son importantes las habilidades socioemocionales?', ['Nos ayudan a relacionarnos sanamente y ser felices con otros','No sirven para nada','Solo para psicólogos','No se necesitan'], 0, 'Manejar emociones y relacionarse bien = vida plena.'));
    qs.push(qMC('Un líder con inteligencia emocional...', ['Escucha a su equipo y maneja sus emociones','Grita para que le obedezcan','No se preocupa por los demás','Solo busca poder'], 0, 'Liderazgo real = empatía + comunicación + autocontrol.'));
    qs.push(qMC('La resiliencia es la capacidad de...', ['Superar situaciones difíciles y salir fortalecido','Nunca tener problemas','Evitar todos los retos','Rendirse rápido'], 0, 'Caerse y levantarse: la resiliencia se aprende.'));
    qs.push(qMC('Para cuidar tu salud mental puedes...', ['Hablar con alguien de confianza, descansar y hacer ejercicio','Guardar todo para ti mismo','Nunca pedir ayuda','Estar siempre en redes sociales'], 0, 'Salud mental = equilibrio entre descanso, actividad y conexión.'));
    qs.push(qMC('Una comunidad con valores es aquella donde...', ['Hay respeto, empatía y todos se apoyan mutuamente','Cada quien ve por sí mismo sin importar el otro','Todos compiten ferozmente','No hay reglas ni convivencia'], 0, 'Valores compartidos construyen comunidades fuertes.'));
    qs.push(qMC('¿Qué te llevas de este bloque sobre valores?', ['Que mis acciones diarias pueden hacer del mundo un lugar mejor','Nada, no aprendí nada','Que solo importa ganar','Que los valores son aburridos'], 0, 'Cada acto de empatía, respeto e inclusión cambia el mundo poco a poco.'));
  }
  return qs;
}

// ═════════════════════════════════════════════════════════════════
// DISPATCHER
// ═════════════════════════════════════════════════════════════════
function lessonPack(key, m) {
  let qs;
  switch (key) {
    case 'exam1': qs = exam1Questions(m); break;
    case 'exam2': qs = exam2Questions(m); break;
    case 'exam3': qs = exam3Questions(m); break;
    case 'exam4': qs = exam4Questions(m); break;
    case 'exam5': qs = exam5Questions(m); break;
    case 'exam6': qs = exam6Questions(m); break;
    default: qs = [qMC('Pregunta de prueba', ['A','B','C','D'], 0, 'OK')];
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
  console.log(`Examen Final Triviverso [${START}-${END}] dry=${!!args.dry}`);

  for (const u of FREE_USERS) await upsertUser(u);

  let totalQ = 0;
  for (const s of EXAM_SUBJECTS) {
    for (let m = START; m <= END; m++) {
      const lessonId = `${s.key}-${m}`;
      await upsertLesson({ id: lessonId, title: `${s.title} · Misión ${m}`, subject: s.key, grade: '5-6', order: s.key.charCodeAt(s.key.length-1)*1000+m, updatedAt: new Date().toISOString() });
      const qs = lessonPack(s.key, m);
      const wrote = await upsertQuestions(lessonId, qs);
      totalQ += wrote;
      if (m % 5 === 0 || m === END) console.log(`✓ ${s.key}-${m} (${wrote} preg)`);
    }
  }

  console.log(`\n✅ ${totalQ} preguntas / ${EXAM_SUBJECTS.length} temas × ${END-START+1} misiones.`);
  if (!args.dry) console.log('→ https://mbcx07.github.io/triviaverse/');
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
