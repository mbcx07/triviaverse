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
  // ===== M1: Leo y comprendo =====
  [
    qMC('Lee: "El sol brillaba intensamente sobre el mar azul. Las gaviotas volaban en círculos buscando peces." ¿De qué trata principalmente el texto?', ['De un día de playa con gaviotas','De una tormenta en el océano','De un barco pesquero','De una puesta de sol'], 0, 'El texto describe el mar, el sol y las gaviotas, elementos típicos de una escena costera o de playa.'),
    qMC('Lee: "María tomó su mochila, revisó que llevara los libros y salió corriendo porque ya era tarde." ¿Qué hizo María primero?', ['Salió corriendo','Tomó su mochila','Llegó tarde a la escuela','Abrió los libros'], 1, 'La primera acción mencionada es "tomó su mochila", luego revisó los libros y finalmente salió corriendo.'),
    qMC('Lee: "El pequeño gato maullaba junto a la puerta. Tenía hambre y frío." ¿Cómo se sentía el gato?', ['Contento y juguetón','Hambriento y con frío','Enojado y agresivo','Soñoliento y tranquilo'], 1, 'El texto menciona explícitamente que "tenía hambre y frío".'),
    qTF('Lee: "Pedro plantó una semilla de frijol en un vaso con algodón húmedo. Todos los días la regaba con cuidado." ¿Pedro cuidaba la planta?', true, 'El texto dice que "todos los días la regaba con cuidado", lo que demuestra que sí la cuidaba.'),
    qMC('Lee: "Los murciélagos son los únicos mamíferos que pueden volar. Usan la ecolocalización para orientarse en la oscuridad." ¿Qué habilidad especial tienen los murciélagos según el texto?', ['Nadar largas distancias','Volar siendo mamíferos','Ver en total oscuridad','Cazar durante el día'], 1, 'El texto afirma que "son los únicos mamíferos que pueden volar". La ecolocalización les ayuda a orientarse, no a ver.'),
    qTF('Lee: "El agua hierve a 100 grados Celsius a nivel del mar." ¿Esto significa que el agua siempre hierve a 100°C en cualquier lugar?', false, 'El texto especifica "a nivel del mar". En altitudes mayores, el agua hierve a menor temperatura.'),
    qMC('Lee: "Ana compró manzanas, peras y uvas en el mercado. Las frutas estaban frescas y coloridas." ¿Dónde compró Ana las frutas?', ['En el supermercado','En el mercado','En una tienda','En su huerto'], 1, 'El texto dice explícitamente que "las compró en el mercado".'),
    qTF('Lee: "Los delfines duermen con la mitad de su cerebro despierto para no ahogarse." ¿Los delfines duermen completamente como los humanos?', false, 'El texto indica que duermen con "la mitad de su cerebro despierto", no completamente como los humanos.'),
    qMC('Lee: "El partido de futbol terminó 3-2 a favor del equipo visitante. El gol de la victoria fue en el último minuto." ¿Quién ganó el partido?', ['El equipo local','El equipo visitante','Empataron','No se sabe'], 1, 'El texto dice "a favor del equipo visitante", indicando que ellos ganaron.'),
    qTF('Lee: "La biblioteca permanece abierta de lunes a viernes de 8:00 a 18:00 horas." ¿Se puede visitar la biblioteca un sábado a las 10 de la mañana?', false, 'El horario es "de lunes a viernes", por lo que los sábados permanece cerrada.'),
    qMC('Lee: "Luis preparó un pastel. Primero mezcló harina y huevos, luego añadió azúcar y por último lo metió al horno." ¿Qué hizo Luis al final?', ['Mezcló harina y huevos','Añadió azúcar','Metió el pastel al horno','Decoró el pastel'], 2, 'El texto dice que "por último lo metió al horno".'),
    qTF('Lee: "El colibrí puede batir sus alas hasta 80 veces por segundo." ¿El colibrí mueve sus alas lentamente?', false, 'Mover las alas 80 veces por segundo es extremadamente rápido, no lento.'),
  ],

  // ===== M2: Historias y cuentos =====
  [
    qMC('¿Cuál es la estructura típica de un texto narrativo?', ['Introducción, desarrollo y conclusión','Inicio, nudo y desenlace','Tesis, argumentos y cierre','Definición, ejemplos y resumen'], 1, 'Los textos narrativos se organizan en inicio (presentación), nudo (conflicto) y desenlace (resolución).'),
    qTF('En un cuento, el narrador es quien cuenta la historia.', true, 'El narrador es la voz que relata los hechos en un texto narrativo.'),
    qMC('¿Qué elemento de la narración responde a la pregunta "¿dónde sucede la historia?"', ['Los personajes','El tiempo','El espacio o ambiente','El narrador'], 2, 'El espacio o ambiente indica el lugar donde se desarrollan los hechos.'),
    qTF('En todos los cuentos el narrador es el protagonista.', false, 'El narrador puede ser protagonista (primera persona), testigo o externo (tercera persona).'),
    qMC('Lee: "Había una vez un dragón que vivía en una montaña." ¿Qué tipo de narrador se usa?', ['Primera persona (yo)','Segunda persona (tú)','Tercera persona (él/ella)','Narrador protagonista'], 2, 'Usa "había" y se refiere al dragón como "él", lo que indica narrador en tercera persona.'),
    qMC('¿Cuál de los siguientes es un ejemplo de texto narrativo?', ['Una receta de cocina','Un cuento de aventuras','Un instructivo para armar un mueble','Un diccionario'], 1, 'Un cuento narra una historia con personajes, acciones y una secuencia de eventos.'),
    qTF('Las leyendas son textos narrativos que combinan hechos reales con elementos fantásticos.', true, 'Las leyendas narran historias tradicionales que mezclan realidad y elementos sobrenaturales.'),
    qMC('En una narración, ¿cómo se le llama a quienes realizan las acciones?', ['Autores','Personajes','Lectores','Editores'], 1, 'Los personajes son los seres (reales o ficticios) que realizan las acciones dentro de la narración.'),
    qTF('El desenlace es la parte del cuento donde se presenta el conflicto.', false, 'El desenlace es la resolución final. El conflicto se presenta en el nudo.'),
    qMC('¿Qué tipo de texto narrativo explica el origen del universo según una cultura?', ['Una fábula','Un mito','Una anécdota','Una biografía'], 1, 'Los mitos son narraciones tradicionales que explican el origen del mundo, dioses o fenómenos naturales.'),
    qTF('En una fábula, los personajes principales suelen ser animales que actúan como humanos.', true, 'Las fábulas usan animales personificados para transmitir una enseñanza o moraleja.'),
    qMC('¿Cuál es la diferencia principal entre un cuento y una novela?', ['El número de personajes siempre es mayor en la novela','La extensión: la novela es mucho más larga','Los cuentos nunca tienen diálogos','Las novelas siempre son realistas'], 1, 'La principal diferencia es la extensión: los cuentos son breves y las novelas son obras extensas.'),
  ],

  // ===== M3: Para saber más =====
  [
    qMC('¿Cuál es el propósito principal de un texto informativo?', ['Entretener al lector','Expresar sentimientos','Transmitir conocimientos o datos','Convencer de una opinión'], 2, 'Los textos informativos buscan transmitir información objetiva y conocimientos al lector.'),
    qTF('Un artículo de enciclopedia es un ejemplo de texto informativo.', true, 'Los artículos enciclopédicos presentan información verificada y objetiva sobre un tema.'),
    qMC('¿Qué recurso gráfico ayuda a comprender mejor un texto expositivo?', ['Diálogos entre personajes','Rimas y versos','Tablas, diagramas e ilustraciones','Signos de admiración'], 2, 'Los recursos gráficos como tablas, diagramas e imágenes facilitan la comprensión de la información.'),
    qTF('En un texto informativo, el autor puede incluir sus opiniones personales libremente.', false, 'Los textos informativos deben ser objetivos, basados en hechos comprobables, no en opiniones.'),
    qMC('¿Qué tipo de texto utilizarías para conocer la biografía de un personaje histórico?', ['Un poema','Un texto expositivo-biográfico','Una obra de teatro','Un cuento fantástico'], 1, 'La biografía es un texto expositivo que narra objetivamente la vida de una persona.'),
    qMC('¿Cuál es la función de los subtítulos en un texto informativo?', ['Decorar la página','Organizar la información en secciones','Reemplazar las imágenes','Contar una historia paralela'], 1, 'Los subtítulos dividen el texto en secciones temáticas para facilitar la lectura y localización de información.'),
    qTF('Una noticia periodística es un texto informativo.', true, 'La noticia informa sobre hechos de actualidad de manera objetiva y verificable.'),
    qMC('¿Qué es una monografía?', ['Un dibujo de un solo color','Un texto que estudia a fondo un tema específico','Un tipo de poema','Una carta personal'], 1, 'La monografía es un texto expositivo que investiga y desarrolla en profundidad un tema concreto.'),
    qTF('Los textos informativos deben incluir fuentes confiables que respalden los datos.', true, 'Para ser confiables, los textos informativos deben citar fuentes verificables que sustenten la información.'),
    qMC('¿En qué sección de un libro informativo encuentras el significado de palabras difíciles?', ['En el prólogo','En el índice','En el glosario','En la portada'], 2, 'El glosario es una lista alfabética de términos especializados con sus definiciones.'),
    qTF('Un texto expositivo siempre cuenta una historia con inicio, nudo y desenlace.', false, 'Esa es la estructura narrativa. El texto expositivo explica o informa, generalmente con introducción, desarrollo y conclusión.'),
    qMC('¿Qué característica distingue a un texto de divulgación científica?', ['Usa lenguaje poético y rimas','Explica temas científicos con lenguaje accesible para el público general','Solo lo entienden los científicos','Siempre incluye chistes'], 1, 'La divulgación científica acerca la ciencia al público usando un lenguaje claro y comprensible.'),
  ],

  // ===== M4: Paso a paso =====
  [
    qMC('¿Cuál es la finalidad de un texto instructivo?', ['Contar una historia divertida','Guiar paso a paso para realizar una tarea','Expresar emociones','Describir un paisaje'], 1, 'El texto instructivo da indicaciones ordenadas para lograr un objetivo, como armar algo o preparar una receta.'),
    qTF('Una receta de cocina es un tipo de texto instructivo.', true, 'La receta indica ingredientes y pasos a seguir para preparar un platillo.'),
    qMC('¿En qué modo verbal suelen estar escritos los instructivos?', ['Modo indicativo','Modo subjuntivo','Modo imperativo','Modo potencial'], 2, 'Se usa el imperativo porque da órdenes o instrucciones directas ("mezcla", "corta", "agrega").'),
    qTF('Los textos instructivos deben seguirse en cualquier orden.', false, 'Los instructivos tienen una secuencia lógica que debe respetarse para obtener el resultado esperado.'),
    qMC('¿Qué elemento NO suele aparecer en un instructivo?', ['Materiales o ingredientes','Pasos enumerados','Imágenes o diagramas','Diálogos entre personajes'], 3, 'Los diálogos son propios de textos narrativos. Los instructivos no cuentan historias.'),
    qMC('¿Qué tipo de lenguaje se recomienda en un instructivo?', ['Lenguaje poético y metafórico','Lenguaje claro, preciso y directo','Lenguaje complicado y técnico','Lenguaje con rimas'], 1, 'La claridad es esencial para que el usuario pueda seguir las instrucciones sin confusiones.'),
    qTF('Los manuales de usuario de aparatos electrónicos son instructivos.', true, 'Los manuales contienen instrucciones paso a paso para usar correctamente un dispositivo.'),
    qMC('¿Qué palabra se usa frecuentemente al inicio de cada paso en un instructivo?', ['Había una vez','Después sucedió que','Un verbo en imperativo como "corta" o "mezcla"','Colorín colorado'], 2, 'Los instructivos inician cada paso con verbos en imperativo que indican la acción a realizar.'),
    qTF('Un instructivo puede incluir advertencias o precauciones de seguridad.', true, 'Es común que incluyan notas de seguridad, especialmente en manuales de herramientas o productos químicos.'),
    qMC('¿Qué recurso es más útil en un instructivo para armar muebles?', ['Una lista de sinónimos','Un poema','Diagramas con las piezas numeradas','Una biografía del fabricante'], 2, 'Los diagramas visuales con piezas numeradas facilitan el ensamblaje paso a paso.'),
    qTF('Las reglas de un juego de mesa son un tipo de texto instructivo.', true, 'Las reglas explican cómo jugar: pasos, turnos, condiciones para ganar, exactamente como un instructivo.'),
    qMC('¿Por qué es importante enumerar los pasos en un instructivo?', ['Para que se vea más bonito','Para establecer un orden lógico y evitar confusiones','Para ahorrar tinta','Porque es obligatorio por ley'], 1, 'La numeración establece una secuencia clara que el usuario debe seguir para completar la tarea correctamente.'),
  ],

  // ===== M5: Opino y argumento =====
  [
    qMC('¿Cuál es el objetivo de un texto argumentativo?', ['Describir un objeto detalladamente','Convencer al lector con razones sobre un punto de vista','Instruir cómo usar un producto','Narrar una aventura emocionante'], 1, 'El texto argumentativo busca persuadir presentando argumentos que respalden una opinión o tesis.'),
    qTF('En un texto argumentativo, la tesis es la opinión o idea principal que se defiende.', true, 'La tesis es la postura central que el autor sostiene y argumenta a lo largo del texto.'),
    qMC('¿Qué son los argumentos en un texto argumentativo?', ['Historias divertidas','Las razones que apoyan la tesis','Los personajes de la historia','Las ilustraciones del texto'], 1, 'Los argumentos son las razones, datos o ejemplos que sustentan y defienden la tesis.'),
    qTF('Un debate es un intercambio de argumentos entre dos o más personas.', true, 'En un debate, los participantes exponen argumentos a favor o en contra de un tema.'),
    qMC('¿Cuál de estos es un ejemplo de texto argumentativo?', ['Una carta de opinión en el periódico','Un recetario','Un mapa','Un horario de clases'], 0, 'La carta de opinión expresa un punto de vista y lo defiende con argumentos.'),
    qMC('¿Qué estructura suele tener un texto argumentativo?', ['Verso, estrofa y rima','Inicio, nudo y desenlace','Introducción, tesis, argumentos y conclusión','Ingredientes y pasos'], 2, 'Presenta el tema, expone la tesis, desarrolla argumentos y ofrece una conclusión.'),
    qTF('Un argumento basado en datos estadísticos es más sólido que uno basado solo en emociones.', true, 'Los argumentos respaldados por hechos y datos verificables tienen mayor peso lógico que los meramente emocionales.'),
    qMC('¿Qué significa "contraargumentar"?', ['Repetir lo que dijo el otro','Presentar razones que refutan los argumentos del oponente','Ignorar las opiniones ajenas','Cambiar de tema'], 1, 'Contraargumentar es responder a los argumentos del otro con razones que los debilitan o desmienten.'),
    qTF('Un anuncio publicitario puede ser considerado un texto argumentativo.', true, 'La publicidad busca convencer al consumidor de comprar un producto usando argumentos persuasivos.'),
    qMC('¿Cuál es la diferencia entre opinión y argumento?', ['Son sinónimos','La opinión es una creencia; el argumento es la razón que la sustenta','La opinión es más larga que el argumento','No hay diferencia'], 1, 'La opinión es lo que se piensa; el argumento es el por qué se sostiene esa opinión.'),
    qTF('En un ensayo escolar, es válido inventar datos para defender tu tesis.', false, 'Los argumentos deben basarse en fuentes confiables y verificables, no en información inventada.'),
    qMC('¿Qué recurso es común en textos argumentativos?', ['Personajes fantásticos','Citas de expertos o estudios','Rima consonante','Viñetas de cómic'], 1, 'Citar expertos o estudios respalda la credibilidad de los argumentos presentados.'),
  ],

  // ===== M6: Literario o no literario =====
  [
    qMC('¿Qué caracteriza a un texto literario?', ['Busca informar objetivamente sobre un tema','Usa el lenguaje con fines estéticos y creativos','Da instrucciones paso a paso','Describe datos científicos únicamente'], 1, 'Los textos literarios emplean el lenguaje de forma artística para crear belleza, emocionar o entretener.'),
    qTF('Un poema es un texto literario.', true, 'El poema es una expresión artística del lenguaje que juega con la forma, el ritmo y el significado.'),
    qMC('¿Cuál de estos es un texto NO literario?', ['Una novela','Un reporte de investigación','Un cuento','Una obra de teatro'], 1, 'El reporte de investigación es un texto expositivo con fines informativos, no artísticos.'),
    qTF('Los textos literarios solo se escriben en prosa.', false, 'Pueden escribirse en prosa (cuento, novela) o en verso (poesía).'),
    qMC('¿Qué recurso literario consiste en atribuir cualidades humanas a objetos o animales?', ['La rima','La metáfora','La personificación','El instructivo'], 2, 'La personificación o prosopopeya atribuye características humanas a seres inanimados o animales.'),
    qMC('¿Qué género literario está escrito para ser representado en un escenario?', ['Lírico','Narrativo','Dramático','Didáctico'], 2, 'El género dramático incluye obras de teatro creadas para representarse ante un público.'),
    qTF('Un artículo de divulgación científica es un texto literario.', false, 'Es un texto informativo-expositivo. Su objetivo es informar, no crear belleza artística.'),
    qMC('¿Qué es una metáfora?', ['Una comparación que usa "como"','Identificar un término real con uno imaginario sin usar nexos','Una exageración desmesurada','Una pregunta que no espera respuesta'], 1, 'La metáfora identifica dos elementos distintos sin usar palabras comparativas: "Tus ojos son estrellas".'),
    qTF('El lenguaje figurado es más común en textos literarios que en textos informativos.', true, 'El lenguaje figurado busca crear imágenes y sensaciones estéticas, propio de la literatura.'),
    qMC('¿Cuál es el objetivo principal del género lírico?', ['Contar una historia','Expresar sentimientos y emociones','Dar instrucciones','Argumentar una opinión'], 1, 'La lírica es el género literario centrado en la expresión subjetiva de emociones y sentimientos.'),
    qTF('Una carta personal puede contener elementos literarios si usa lenguaje figurado.', true, 'Aunque es un texto personal, una carta puede emplear recursos literarios como metáforas o descripciones poéticas.'),
    qMC('¿Qué diferencia hay entre lenguaje literal y lenguaje figurado?', ['Son iguales','El literal dice exactamente lo que significa; el figurado usa imágenes y simbolismos','El literal solo se usa en poesía','El figurado no tiene significado real'], 1, 'El lenguaje literal comunica directamente; el figurado expresa ideas mediante imágenes y símbolos.'),
  ],

  // ===== M7: Busco información =====
  [
    qMC('¿Para qué sirve el índice de un libro?', ['Para conocer el autor','Para localizar capítulos y temas por número de página','Para leer el resumen del libro','Para ver las imágenes'], 1, 'El índice lista los contenidos con su página correspondiente, facilitando la búsqueda de temas.'),
    qTF('Una enciclopedia es una fuente de información confiable.', true, 'Las enciclopedias contienen información revisada y verificada por expertos.'),
    qMC('¿Qué es una ficha bibliográfica?', ['Una tarjeta de crédito de la biblioteca','Un registro con los datos de un libro: autor, título, editorial, año','Una lista de compras','Un tipo de receta'], 1, 'La ficha bibliográfica recoge los datos esenciales para identificar y localizar una fuente.'),
    qTF('Se puede confiar en cualquier información encontrada en internet sin verificarla.', false, 'En internet hay información falsa o no verificada. Siempre hay que contrastar fuentes.'),
    qMC('¿Qué es un buscador de internet?', ['Una persona que busca libros','Una herramienta para encontrar información en la web','Un libro electrónico','Un tipo de virus informático'], 1, 'Los buscadores como Google indexan páginas web para localizar información según palabras clave.'),
    qMC('¿Qué significa "citar una fuente"?', ['Comprar el libro original','Dar crédito al autor de la información utilizada','Esconder de dónde se obtuvo la información','Copiar y pegar sin mencionar al autor'], 1, 'Citar es reconocer al autor original y la fuente de la que se extrajo la información.'),
    qTF('La bibliografía es la lista de fuentes consultadas para un trabajo.', true, 'La bibliografía enumera todos los libros, artículos y documentos consultados en una investigación.'),
    qMC('¿Qué dato NO aparece en una ficha bibliográfica?', ['Nombre del autor','Título del libro','Color de la portada','Año de publicación'], 2, 'El color de la portada es irrelevante. Los datos esenciales son autor, título, editorial, año y lugar.'),
    qTF('Un diccionario es una fuente útil para conocer el significado de las palabras.', true, 'El diccionario define palabras, indica su categoría gramatical y ofrece ejemplos de uso.'),
    qMC('¿Qué son las palabras clave en una búsqueda?', ['Contraseñas secretas','Los términos principales que describen el tema buscado','Palabras en otro idioma','Sinónimos de palabras difíciles'], 1, 'Las palabras clave son los conceptos fundamentales que facilitan encontrar información relevante.'),
    qTF('Las fuentes primarias son testimonios directos o documentos originales de un hecho.', true, 'Las fuentes primarias son materiales de primera mano: cartas, diarios, fotografías originales, entrevistas.'),
    qMC('¿Qué debes hacer si dos fuentes dan información contradictoria?', ['Creer la primera que leíste','No usar ninguna','Comparar con una tercera fuente confiable para verificar','Inventar una respuesta intermedia'], 2, 'Ante contradicciones, se debe contrastar con fuentes adicionales para determinar cuál es más fiable.'),
  ],

  // ===== M8: Con mis propias palabras =====
  [
    qMC('¿Qué es una paráfrasis?', ['Copiar textualmente un fragmento','Expresar con tus propias palabras lo que dice un texto','Hacer un dibujo del texto','Leer en voz alta'], 1, 'La paráfrasis consiste en reformular un texto manteniendo su significado pero usando palabras diferentes.'),
    qTF('Un resumen debe ser más extenso que el texto original.', false, 'Un resumen condensa lo esencial. Debe ser más breve que el original.'),
    qMC('¿Qué debes conservar al hacer una paráfrasis?', ['Las mismas palabras exactas','El significado original del texto','La extensión del texto','La estructura de párrafos idéntica'], 1, 'Lo importante es preservar la idea central y el significado, pero con palabras propias.'),
    qTF('Para hacer un buen resumen, primero debes comprender el texto.', true, 'Solo tras comprender el contenido se puede seleccionar y condensar la información relevante.'),
    qMC('¿Cuál es el primer paso para elaborar un resumen?', ['Escribir sin leer','Leer atentamente y subrayar las ideas principales','Copiar el primer párrafo','Contar las palabras del texto original'], 1, 'La lectura comprensiva y el subrayado de ideas clave son el paso inicial para un buen resumen.'),
    qTF('En un resumen se deben incluir opiniones personales sobre el tema.', false, 'El resumen debe ser objetivo, reflejando solo las ideas del texto original sin juicios personales.'),
    qMC('¿Qué técnica te ayuda a condensar información?', ['Agregar adjetivos','Identificar la idea principal de cada párrafo','Escribir todo en mayúsculas','Repetir la misma idea varias veces'], 1, 'Extraer la idea central de cada párrafo permite condensar la esencia del texto.'),
    qTF('La cita textual y la paráfrasis son lo mismo.', false, 'La cita textual copia exactamente las palabras del autor (con comillas). La paráfrasis las expresa con otras palabras.'),
    qMC('¿Cuál es una característica de una buena paráfrasis?', ['Ser más larga que el original','Usar sinónimos y cambiar la estructura manteniendo el sentido','Incluir insultos','Modificar los datos para que sean más interesantes'], 1, 'Una buena paráfrasis usa sinónimos, reestructura oraciones y mantiene la fidelidad al significado original.'),
    qTF('Un mapa conceptual puede ayudarte a visualizar las ideas antes de escribir un resumen.', true, 'Los organizadores gráficos como mapas conceptuales ayudan a jerarquizar y relacionar las ideas principales.'),
    qMC('¿Qué información NO debe faltar en un resumen?', ['La idea principal del texto','Los detalles irrelevantes','La opinión personal del lector','Las bromas del autor'], 0, 'El resumen debe capturar la esencia: la idea principal y los puntos más relevantes del texto.'),
    qTF('Parafrasear es una habilidad útil tanto en la escuela como en la vida cotidiana.', true, 'Reformular ideas con palabras propias ayuda en el estudio, el trabajo y la comunicación diaria.'),
  ],

  // ===== M9: La idea central =====
  [
    qMC('¿Qué es la idea principal de un párrafo?', ['La oración más larga','El concepto más importante que resume el contenido','La última oración siempre','Cualquier oración'], 1, 'La idea principal expresa lo esencial del párrafo; las demás ideas la complementan o ejemplifican.'),
    qTF('Todos los párrafos de un texto tienen una idea principal.', true, 'Cada párrafo bien estructurado gira en torno a una idea central.'),
    qMC('¿Qué función tienen las ideas secundarias?', ['Contradecir la idea principal','Desarrollar, explicar o ejemplificar la idea principal','Reemplazar la idea principal','Decorar el texto sin significado'], 1, 'Las ideas secundarias amplían, aclaran o ejemplifican la idea principal del párrafo.'),
    qTF('La idea principal siempre está al inicio del párrafo.', false, 'Aunque es común que esté al inicio, la idea principal puede aparecer en cualquier posición del párrafo.'),
    qMC('Lee el párrafo: "El agua es esencial para la vida. Sin ella, las plantas no pueden crecer y los animales mueren de sed. Además, el cuerpo humano está compuesto en un 70% de agua." ¿Cuál es la idea principal?', ['El cuerpo humano tiene 70% de agua','Las plantas necesitan agua','El agua es esencial para la vida','Los animales mueren de sed'], 2, 'Todas las oraciones secundarias apoyan la idea central: el agua es esencial para la vida.'),
    qMC('¿Qué recurso gráfico ayuda a organizar ideas principales y secundarias?', ['Una fotografía','Un esquema o mapa conceptual','Un dibujo libre','Una lista de compras'], 1, 'Los esquemas y mapas conceptuales jerarquizan visualmente las ideas principales y sus detalles.'),
    qTF('Un párrafo puede tener más de una idea principal si está mal estructurado.', true, 'Un párrafo bien escrito tiene una idea principal; si mezcla varias, resulta confuso.'),
    qMC('¿Cómo puedes identificar la idea principal de un párrafo?', ['Contando las palabras','Preguntándote: ¿de qué trata este párrafo?','Buscando la palabra más larga','Leyendo solo la primera palabra'], 1, 'La pregunta "¿de qué trata?" ayuda a extraer la esencia de lo que el párrafo comunica.'),
    qTF('Las ideas secundarias se pueden eliminar sin que el texto pierda su sentido básico.', true, 'Aunque el texto se empobrece, la idea principal puede sostenerse sin los detalles secundarios.'),
    qMC('¿Qué tipo de ideas secundarias ofrecen ejemplos concretos de la idea principal?', ['Ideas de contraste','Ideas de ejemplificación','Ideas de oposición','Ideas de negación'], 1, 'Las ideas de ejemplificación ilustran la idea principal con casos concretos o situaciones específicas.'),
    qTF('El título de un texto suele estar relacionado con la idea principal general.', true, 'Un buen título resume o anticipa la idea central que el texto desarrolla.'),
    qMC('¿Cuál es la diferencia entre tema e idea principal?', ['Son sinónimos exactos','El tema es general; la idea principal es lo que se afirma sobre ese tema','El tema es más largo','No hay textos con tema'], 1, 'El tema es el asunto general. La idea principal es la afirmación específica que el texto hace sobre ese tema.'),
  ],

  // ===== M10: ¿Hecho u opinión? =====
  [
    qMC('¿Qué es un hecho?', ['Lo que alguien cree','Algo que se puede comprobar o verificar','Una mentira','Una suposición sin fundamento'], 1, 'Un hecho es una afirmación que puede ser demostrada con evidencia objetiva.'),
    qTF('"El cielo es azul" es una opinión.', false, 'Es un hecho observable y verificable. El color del cielo puede comprobarse científicamente.'),
    qMC('¿Cuál de estas frases es una opinión?', ['La Tierra gira alrededor del Sol','México tiene 32 estados','El futbol es el mejor deporte del mundo','El agua hierve a 100°C a nivel del mar'], 2, 'Que el futbol sea "el mejor" es un juicio subjetivo, no un hecho comprobable.'),
    qTF('Una opinión puede estar respaldada por argumentos, pero sigue siendo subjetiva.', true, 'Aunque se argumente, la opinión es una valoración personal, no un hecho demostrable.'),
    qMC('¿Qué palabra indica normalmente que es una opinión?', ['Porque','Mejor','En mi opinión','Kilómetro'], 2, 'Expresiones como "en mi opinión", "creo que", "pienso que" introducen juicios personales.'),
    qMC('¿Cuál de estas es una característica de los hechos?', ['Son subjetivos','Dependen de quien los dice','Se pueden verificar con pruebas','Cambian según los sentimientos'], 2, 'Los hechos son verificables: pueden comprobarse mediante observación, experimentación o fuentes confiables.'),
    qTF('"Hoy hace calor" es siempre un hecho, no una opinión.', false, 'La percepción del calor es subjetiva. Para unos 25°C es calor, para otros es templado. Es una opinión.'),
    qMC('¿Por qué es importante distinguir entre hechos y opiniones?', ['Para ganar discusiones','Para evaluar la credibilidad de lo que leemos o escuchamos','Para escribir más rápido','Solo es importante en matemáticas'], 1, 'Distinguirlos nos ayuda a pensar críticamente y a no tomar opiniones como verdades absolutas.'),
    qTF('Un texto informativo debe basarse en hechos, no en opiniones.', true, 'Los textos informativos buscan objetividad y se sustentan en datos verificables.'),
    qMC('"Benito Juárez nació en 1806" ¿Es esto un hecho o una opinión?', ['Una opinión histórica','Un hecho histórico verificable','Una creencia popular','Una leyenda'], 1, 'Es un hecho porque puede verificarse en registros históricos y documentos oficiales.'),
    qTF('Los anuncios publicitarios suelen mezclar hechos con opiniones para persuadir.', true, 'Un anuncio puede usar datos reales (hechos) y valoraciones positivas (opiniones) para convencer al consumidor.'),
    qMC('¿Qué debes hacer si lees algo y no sabes si es hecho u opinión?', ['Creerlo automáticamente','Buscar fuentes adicionales para verificarlo','Ignorarlo siempre','Compartirlo de inmediato'], 1, 'La verificación con fuentes adicionales es la mejor estrategia ante información dudosa.'),
  ],

  // ===== M11: Palabras agudas =====
  [
    qMC('¿Cuándo llevan tilde las palabras agudas?', ['Siempre','Cuando terminan en n, s o vocal','Nunca','Solo cuando son verbos'], 1, 'Las palabras agudas llevan tilde si terminan en n, s o vocal. Ejemplos: canción, compás, café.'),
    qTF('"Reloj" es una palabra aguda con tilde.', false, 'Aunque es aguda, no lleva tilde porque termina en "j", que no es n, s ni vocal.'),
    qMC('¿Cuál de estas palabras agudas está bien acentuada?', ['Ratón','Ratónn','Raton','Rátón'], 0, '"Ratón" es aguda terminada en n, por lo que debe llevar tilde en la última sílaba.'),
    qTF('Las palabras agudas tienen la sílaba tónica en la última sílaba.', true, 'Por definición, la sílaba tónica (la que se pronuncia con más fuerza) está al final en las palabras agudas.'),
    qMC('¿Cuál de estas NO es una palabra aguda?', ['Canción','Papel','Música','Café'], 2, '"Música" es esdrújula (sílaba tónica en la antepenúltima). Las demás son agudas.'),
    qMC('Selecciona la palabra aguda correctamente escrita:', ['Jamon','Jamón','Jámon','Jámón'], 1, '"Jamón" es aguda terminada en n, necesita tilde.'),
    qTF('"Sofá" es una palabra aguda.', true, 'La sílaba tónica es "fá", la última. Termina en vocal, por eso lleva tilde.'),
    qMC('¿Qué tienen en común "comer", "vivir" y "cantar"?', ['Son agudas sin tilde porque terminan en r','Son esdrújulas','Son llanas','Llevan tilde siempre'], 0, 'Los infinitivos son palabras agudas terminadas en r. Al no terminar en n, s o vocal, no llevan tilde.'),
    qTF('"Interés" lleva tilde por ser palabra aguda terminada en s.', true, 'La sílaba tónica es "rés" (última). Termina en s, por lo que se acentúa.'),
    qMC('¿Qué palabra aguda NO debe llevar tilde?', ['Bebé','Pared','Anís','Rubí'], 1, '"Pared" es aguda pero termina en "d", que no es n, s ni vocal. No lleva tilde.'),
    qTF('Todas las palabras que terminan en "ción" son agudas y llevan tilde.', true, 'Las palabras terminadas en -ción tienen la fuerza en la última sílaba y terminan en n.'),
    qMC('¿Dónde está la sílaba tónica en "corazón"?', ['co','ra','zón','En ninguna'], 2, 'La sílaba "zón" es la última y tónica (aguda). Lleva tilde por terminar en n.'),
  ],

  // ===== M12: Palabras graves =====
  [
    qMC('¿Cuándo llevan tilde las palabras graves?', ['Siempre','Cuando NO terminan en n, s o vocal','Nunca','Solo si son adjetivos'], 1, 'Las graves se acentúan cuando no terminan en n, s o vocal. Ejemplo: lápiz, árbol, mártir.'),
    qTF('"Mesa" es una palabra grave con tilde.', false, 'Es grave (tónica en "me"), pero termina en vocal, por lo que no lleva tilde.'),
    qMC('¿Cuál de estas palabras graves está bien acentuada?', ['Arból','Árbol','Arbol','Arból'], 1, '"Árbol" es grave terminada en "l", que no es n, s ni vocal. Debe llevar tilde.'),
    qTF('Las palabras graves tienen la sílaba tónica en la penúltima sílaba.', true, 'Por definición, en las graves la fuerza de voz recae en la penúltima sílaba.'),
    qMC('¿Cuál NO es una palabra grave?', ['Lápiz','Casa','Cántaro','Ratón'], 3, '"Ratón" es aguda (tónica en última). Las demás son graves.'),
    qMC('Selecciona la palabra grave correctamente escrita:', ['Util','Útil','Utíl','Útíl'], 1, '"Útil" es grave terminada en "l", necesita tilde.'),
    qTF('"Examen" es una palabra grave.', true, 'La tónica es "xa" (penúltima). Termina en n y no lleva tilde porque termina en n.'),
    qMC('¿Qué palabra grave necesita tilde?', ['Casa','Pelota','Cárcel','Camino'], 2, '"Cárcel" es grave terminada en "l". Al no terminar en n, s o vocal, lleva tilde.'),
    qTF('"Dólar" lleva tilde por ser palabra grave que NO termina en n, s o vocal.', true, 'La tónica es "dó" (penúltima) y termina en "r". Requiere tilde.'),
    qMC('¿Por qué "ventana" no lleva tilde?', ['Es aguda','Es grave terminada en vocal','Es esdrújula','Siempre la lleva'], 1, '"Ventana" es grave con tónica en "ta" (penúltima) y termina en vocal. No necesita tilde.'),
    qTF('"Lápiz" y "mártir" son ambas graves con tilde.', true, 'Ambas tienen la tónica en la penúltima y terminan en consonante distinta de n o s.'),
    qMC('¿Dónde está la sílaba tónica en "difícil"?', ['di','fí','cil','En la primera y última'], 1, 'La sílaba "fí" es la penúltima y tónica (grave). Lleva tilde porque termina en "l".'),
  ],

  // ===== M13: Palabras esdrújulas =====
  [
    qMC('¿Cuándo llevan tilde las palabras esdrújulas?', ['Nunca','Siempre, sin excepción','Solo si son largas','Depende de la letra final'], 1, 'Todas las palabras esdrújulas llevan tilde siempre, sin importar su terminación.'),
    qTF('"Página" es una palabra esdrújula.', true, 'La sílaba tónica es "pá", la antepenúltima. Por ser esdrújula, siempre lleva tilde.'),
    qMC('¿Dónde está la sílaba tónica en una palabra esdrújula?', ['En la última sílaba','En la penúltima sílaba','En la antepenúltima sílaba','En la primera siempre'], 2, 'Las esdrújulas tienen la fuerza de voz en la antepenúltima sílaba.'),
    qTF('Las sobresdrújulas son palabras con la tónica antes de la antepenúltima y también llevan tilde.', true, 'Las sobresdrújulas (ej. "cómpramelo") siempre llevan tilde, igual que las esdrújulas.'),
    qMC('¿Cuál es una palabra esdrújula?', ['Cántaro','Cantar','Cantó','Cantaré'], 0, '"Cántaro" tiene la tónica en "cán" (antepenúltima). Es esdrújula y lleva tilde.'),
    qMC('¿Cuál de estas NO es esdrújula?', ['Médico','Águila','Teléfono','Canción'], 3, '"Canción" es aguda. Las otras tienen la tónica en la antepenúltima sílaba.'),
    qTF('"Música" y "matemáticas" son ambas palabras esdrújulas.', true, 'Ambas tienen la tónica en la antepenúltima: MÚ-si-ca, ma-te-MÁ-ti-cas.'),
    qMC('Corrige: "MURCIELAGO" lleva tilde en:', ['mur','cié','la','go'], 1, '"Murciélago" es esdrújula. La tilde va en "cié", la antepenúltima sílaba.'),
    qTF('"Rápidamente" es una palabra sobresdrújula.', true, 'Proviene de "rápido" + "mente". La tónica está en "rá", la primera sílaba.'),
    qMC('¿Qué regla se aplica a "cómetelo"?', ['Es aguda terminada en vocal','Es grave terminada en l','Es sobresdrújula y siempre lleva tilde','No lleva tilde'], 2, '"Cómetelo" es sobresdrújula (tónica en "có"). Siempre se acentúa.'),
    qTF('Todas las palabras con terminación -mente que provienen de un adjetivo con tilde la conservan.', true, 'Si el adjetivo lleva tilde, el adverbio en -mente la conserva: rápido → rápidamente, útil → útilmente.'),
    qMC('¿Cuál es la sílaba tónica de "esdrújula"?', ['es','drú','ju','la'], 1, 'La palabra "esdrújula" es ella misma esdrújula: es-DRÚ-ju-la. La tónica es "drú".'),
  ],

  // ===== M14: Tilde diacrítica =====
  [
    qMC('¿Para qué sirve el acento diacrítico?', ['Para decorar las palabras','Para diferenciar palabras que se escriben igual pero tienen distinta función','Para alargar las palabras','Es opcional'], 1, 'La tilde diacrítica distingue monosílabos con igual forma pero diferente categoría gramatical o significado.'),
    qTF('"Tú" (pronombre) lleva tilde para diferenciarse de "tu" (posesivo).', true, '"Tú eres" (pronombre personal) vs "Tu libro" (adjetivo posesivo).'),
    qMC('¿En cuál oración "el" debe llevar tilde?', ['El niño juega','El perro ladra','Él quiere jugar','El carro es rojo'], 2, '"Él" con tilde es pronombre personal. En las otras es artículo y no se acentúa.'),
    qTF('"Sé" (del verbo saber) y "se" (pronombre) se escriben igual.', false, '"Sé" con tilde es del verbo saber o ser. "Se" sin tilde es pronombre. Se diferencian por la tilde.'),
    qMC('Completa: "___ casa es bonita y ___ vive aquí."', ['Tu / tú','Tú / tu','Tu / tu','Tú / tú'], 0, '"Tu" sin tilde es posesivo; "tú" con tilde es pronombre personal.'),
    qMC('¿Cuál usa correctamente "mí"/"mi"?', ['A mi me gusta','Mi casa es azul','Dámelo a mí','Ambas "Mi casa es azul" y "Dámelo a mí" son correctas'], 3, '"Mi" sin tilde es posesivo; "mí" con tilde es pronombre personal. Ambas son correctas.'),
    qTF('"Dé" (verbo dar) y "de" (preposición) se diferencian por la tilde.', true, '"Espero que me dé" (verbo) vs "Casa de madera" (preposición).'),
    qMC('¿Qué palabra con tilde diacrítica completa correctamente? "No ___ si vendrá."', ['se','sé','sé','se'], 1, '"Sé" con tilde, del verbo saber. Significa "No tengo conocimiento de si vendrá".'),
    qTF('"Más" (cantidad) y "mas" (pero) se diferencian por el acento diacrítico.', true, '"Quiero más comida" vs "Quiso correr, mas no pudo" (mas = pero).'),
    qMC('¿Qué significa "aún" con tilde?', ['Incluso','Todavía','Aunque','Entonces'], 1, '"Aún" con tilde equivale a "todavía". "Aun" sin tilde significa "incluso" o "siquiera".'),
    qTF('"Sí" con tilde puede ser afirmación o pronombre; "si" sin tilde es conjunción condicional.', true, '"Sí, quiero" (afirmación). "Volvió en sí" (pronombre). "Si llueve, no voy" (condicional).'),
    qMC('¿En cuál frase "te" debería llevar tilde?', ['Te quiero mucho','¿Te gusta el té?','Te llamo luego','Te veo mañana'], 1, '"Té" con tilde es la bebida. "Te" sin tilde es pronombre personal.'),
  ],

  // ===== M15: ¡Con mayúscula! =====
  [
    qMC('¿Cuándo se usa mayúscula inicial?', ['En todas las palabras','Al inicio de un escrito y después de punto','Solo en títulos','Nunca'], 1, 'Se usa mayúscula al comenzar un escrito y después de punto y seguido o punto y aparte.'),
    qTF('Los nombres propios de personas y lugares se escriben con mayúscula inicial.', true, 'María, México, Pacífico, Himalaya llevan mayúscula por ser nombres propios.'),
    qMC('¿Cuál está correctamente escrito?', ['méxico','México','méXico','MEXICO'], 1, 'Los nombres de países se escriben con mayúscula inicial: México.'),
    qTF('Después de dos puntos, siempre se escribe con mayúscula.', false, 'Después de dos puntos se escribe minúscula generalmente, salvo que sea una cita textual o encabezado.'),
    qMC('¿Qué palabra debe ir con mayúscula en: "el río amazonas es el más caudaloso"?', ['río','amazonas','caudaloso','Ninguna'], 1, '"Amazonas" es nombre propio del río y debe escribirse con mayúscula.'),
    qMC('Los días de la semana en español se escriben:', ['Siempre con mayúscula','Con minúscula','Con mayúscula solo al inicio de oración','Como quieras'], 1, 'En español, los días de la semana van con minúscula: lunes, martes, miércoles.'),
    qTF('Las siglas se escriben con todas las letras mayúsculas y generalmente sin puntos.', true, 'ONU, SEP, OMS son siglas que se escriben en mayúsculas sin puntos entre letras.'),
    qMC('¿Cuál es correcto?', ['Don quijote','Don Quijote','don Quijote','don quijote'], 1, 'Los títulos de obras literarias llevan mayúscula inicial. El trato "Don" se escribe con mayúscula por cortesía.'),
    qTF('Después de signos de interrogación o exclamación, se puede escribir con minúscula si no cierra oración.', true, 'Ejemplo: "¿Vendrás?, me preguntó." La coma indica que la oración continúa, por eso minúscula.'),
    qMC('¿Qué nombre propio está mal escrito?', ['Océano Pacífico','Sierra Madre','Mar mediterráneo','Golfo de México'], 2, 'Los nombres de mares también son nombres propios: "Mar Mediterráneo" con mayúscula.'),
    qTF('Los sustantivos comunes se escriben con mayúscula inicial.', false, 'Solo los nombres propios llevan mayúscula. Los comunes van con minúscula: mesa, perro, ciudad.'),
    qMC('¿Cuál es la regla para nombres de instituciones?', ['No llevan mayúscula','Llevan mayúscula todas las palabras importantes','Solo la primera palabra','Todas las palabras sin excepción'], 1, 'En "Secretaría de Educación Pública", todas las palabras significativas llevan mayúscula.'),
  ],

  // ===== M16: Punto y coma =====
  [
    qMC('¿Cuál es la función principal del punto y seguido?', ['Terminar un texto completamente','Separar oraciones dentro del mismo párrafo','Iniciar una pregunta','Separar elementos de una lista'], 1, 'El punto y seguido separa oraciones distintas dentro de un mismo párrafo.'),
    qTF('El punto y aparte se usa para separar párrafos.', true, 'El punto y aparte marca el final de un párrafo. El texto continúa en la siguiente línea.'),
    qMC('¿Para qué se usa la coma en una enumeración?', ['Para terminar la oración','Para separar los elementos de la lista','Para hacer preguntas','No se usa coma en enumeraciones'], 1, 'En una enumeración, la coma separa cada elemento: "Compré pan, leche, huevos y queso".'),
    qTF('Antes de "y" en una enumeración, siempre se pone coma.', false, 'Generalmente no se pone coma antes de "y" en una enumeración, aunque hay excepciones estilísticas.'),
    qMC('¿Cuál de estas oraciones usa correctamente la coma?', ['Juan, el vecino, se mudó ayer','Juan el vecino se, mudó ayer','Juan el, vecino se mudó, ayer','Juan, el vecino se mudó, ayer'], 0, 'La aclaración "el vecino" va entre comas porque es una aposición explicativa.'),
    qMC('¿Qué signo se usa para hacer una pausa más larga que la coma pero sin terminar la oración?', ['El punto','El punto y coma','Los dos puntos','Las comillas'], 1, 'El punto y coma indica una pausa intermedia, mayor que la coma pero menor que el punto.'),
    qTF('El punto final se coloca al terminar absolutamente todo el texto.', true, 'El punto final cierra el escrito por completo. No hay más texto después de él.'),
    qMC('¿Cuál de estas frases necesita una coma?', ['María vino a casa','Luis compró pan y leche','Pedro tráeme el libro','El sol brilla'], 2, '"Pedro, tráeme el libro" necesita coma después del vocativo "Pedro".'),
    qTF('Los dos puntos se pueden usar antes de una enumeración.', true, 'Ejemplo: "Necesito varios materiales: tijeras, papel, pegamento y colores."'),
    qMC('¿Qué signo se usa para introducir una cita textual?', ['La coma','Los dos puntos','El punto y coma','Los paréntesis'], 1, 'Los dos puntos preceden a las citas textuales: Dijo Martí: "Ser culto es el único modo de ser libre".'),
    qTF('La coma siempre separa el sujeto del predicado.', false, 'No se debe poner coma entre el sujeto y el predicado: "El niño juega" (sin coma).'),
    qMC('¿Cuál usa correctamente los dos puntos?', ['Queridos: amigos','Compré: frutas verduras','Estimado profesor: Le escribo para...','Había: tres opciones'], 2, 'Después del saludo en cartas formales se usan dos puntos: "Estimado profesor:".'),
  ],

  // ===== M17: ¿Preguntas? ¡Emociones! =====
  [
    qMC('¿Dónde se colocan los signos de interrogación en español?', ['Solo al final','Al inicio y al final de la pregunta','Solo en preguntas largas','No se usan en español'], 1, 'En español es obligatorio usar signos de apertura (¿) y de cierre (?) en las preguntas.'),
    qTF('En español, los signos de exclamación solo se colocan al final.', false, 'Al igual que los de interrogación, se colocan al inicio (¡) y al final (!).'),
    qMC('¿Cuál es correcto?', ['Hola!','¡Hola!','Hola¡','!HOla!'], 1, 'La exclamación lleva signo de apertura ¡ y de cierre !: "¡Hola!".'),
    qTF('Se puede usar solo el signo de cierre en títulos o carteles informales.', false, 'La norma académica recomienda usar ambos signos siempre, incluso en contextos informales.'),
    qMC('¿Qué signo usarías en: "___Qué bonito día___"?', ['¿...?','¡...!','¿...!','¡...?'], 1, 'Es una exclamación que expresa emoción ante un día bonito.'),
    qMC('¿Cuál de estas preguntas está bien escrita?', ['¿Cómo estás','¿Cómo estás?','Cómo estás?','¡Cómo estás?'], 1, 'Debe llevar signo de apertura ¿ y cierre ?.'),
    qTF('Después de un signo de interrogación o exclamación que cierra oración, se escribe mayúscula.', true, 'Si el signo cierra el enunciado (equivale a punto), la siguiente palabra inicia con mayúscula.'),
    qMC('¿Para qué se usan los signos de exclamación?', ['Para preguntar algo','Para expresar emociones intensas: sorpresa, alegría, enojo','Para citar a alguien','Para enumerar cosas'], 1, 'Los signos de exclamación expresan intensidad emocional o énfasis.'),
    qTF('En una misma oración pueden combinarse signos de interrogación y exclamación.', true, 'Ejemplo: "¡¿Qué dices?!" aunque el uso más recomendado es "¡Qué dices!" o "¿Qué dices?".'),
    qMC('¿Qué oración está correctamente puntuada?', ['¡Hola! ¿Cómo estás?','Hola! ¿Como estas?','¡Hola? ¿Cómo estás!','¡Hola ¿Cómo estás?'], 0, 'Cada signo de apertura tiene su correspondiente cierre: ¡Hola! y ¿Cómo estás? son correctos.'),
    qTF('Se puede usar coma o punto y coma dentro de una pregunta o exclamación.', true, 'Ejemplo: "¿Quieres café, té o chocolate?" La coma dentro es válida.'),
    qMC('¿Cuál usa correctamente los signos de exclamación?', ['¡Cuidado','Cuidado!','¡Cuidado!','!Cuidado¡'], 2, 'Debe tener signo de apertura ¡ y de cierre !.'),
  ],

  // ===== M18: ¿B o V? =====
  [
    qMC('¿Qué regla se aplica a las palabras que empiezan por "bibl-"?', ['Se escriben con V','Se escriben con B','Depende de la palabra','Ninguna regla'], 1, 'Las palabras con el prefijo "bibl-" (libro) se escriben con B: biblioteca, biblia, bibliografía.'),
    qTF('Todas las palabras terminadas en "bilidad" se escriben con B excepto "movilidad".', true, 'Se escriben con B: amabilidad, responsabilidad. "Movilidad" viene de móvil (con V).'),
    qMC('¿Cuál está bien escrita?', ['Haver','Haber','Aver','Háber'], 1, '"Haber" (verbo auxiliar y sustantivo) se escribe con B y H inicial.'),
    qTF('Después de M siempre se escribe B, nunca V.', true, 'Ejemplos: cambio, también, hombre, ambiente. La combinación "mv" no existe en español.'),
    qMC('¿Qué palabra se escribe con V?', ['Absoluto','Advertir','Obtener','Ambulancia'], 1, '"Advertir" se escribe con V. Viene del latín "advertere".'),
    qMC('Completa con B o V: "El ___razo de mi amigo fue fuerte."', ['b','v','Puede ser cualquiera','Ninguna'], 0, '"El brazo" se escribe con B. "Vaso" con V es recipiente.'),
    qTF('"Iba" (del verbo ir) se escribe con B.', true, 'Las terminaciones del pretérito imperfecto de la primera conjugación (-ar) llevan B: cantaba, iba.'),
    qMC('¿Cuál de estas palabras está mal escrita?', ['Bueno','Vello (pelo)','Bello (hermoso)','Vienvenido'], 3, '"Bienvenido" se escribe con B. La palabra correcta tiene "bien-" + "venido".'),
    qTF('"Revelar" (descubrir un secreto) y "rebelar" (sublevarse) se escriben con V y B respectivamente.', true, '"Revelar" con V. "Rebelar" con B. Tienen significados distintos.'),
    qMC('¿Cuál se escribe con V?', ['Tuvo (del verbo tener)','Tubo (cilindro hueco)','Ambas son correctas','Ninguna'], 0, '"Tuvo" del verbo tener va con V. "Tubo" (cilindro hueco) va con B.'),
    qTF('Los verbos terminados en -bir se escriben con B, excepto hervir, servir y vivir.', true, 'Recibir, subir, escribir = con B. Hervir, servir, vivir = con V (excepciones).'),
    qMC('¿Cuál está correctamente escrita?', ['Vurro','Burro','Vuro','Burró'], 1, '"Burro" se escribe con B. No hay regla que lo justifique; se aprende por uso.'),
  ],

  // ===== M19: C, S o Z =====
  [
    qMC('¿Qué terminación de sustantivos abstractos se escribe con C?', ['-eza','-ancia y -encia','-oso','-ísimo'], 1, 'Los sustantivos terminados en -ancia y -encia se escriben con C: constancia, paciencia.'),
    qTF('Los adjetivos terminados en -oso se escriben con S.', true, 'Ejemplos: hermoso, cariñoso, grandioso. Todos llevan S.'),
    qMC('¿Cuál está bien escrita?', ['Naturaleza','Naturaleça','Naturalesa','Naturalessa'], 0, '"Naturaleza" se escribe con Z. Los sustantivos abstractos con sufijo -eza llevan Z.'),
    qTF('"Cazar" (animales) y "casar" (matrimonio) se pronuncian igual pero se escriben diferente.', true, 'Son homófonos en la mayor parte del español. Se distinguen por Z y S.'),
    qMC('¿Qué palabra se escribe con C?', ['Conocer','Cabeza','Camisa','Todas'], 3, 'Todas: "conocer", "cabeza", "camisa" están correctamente escritas.'),
    qMC('¿Cuál de estas lleva Z?', ['Capaz','Feliz','Lombriz','Todas llevan Z'], 3, 'Todas llevan Z: capaz, feliz, lombriz. Son agudas terminadas en -z.'),
    qTF('Las terminaciones -azo y -aza que indican golpe o aumentativo se escriben con Z.', true, 'Ejemplos: martillazo, portazo, manaza. Siempre con Z.'),
    qMC('Completa: "La ___ del museo fue un éxito."', ['inauguración','inaugurazión','inaugurasión','inauguracció'], 0, '"Inauguración" se escribe con C. Las terminaciones -ción se escriben con C.'),
    qTF('"Hacer" y sus derivados (deshacer, rehacer) siempre se escriben con C.', true, 'El verbo hacer y todos sus compuestos llevan C, nunca Z ni S.'),
    qMC('¿Qué palabra está mal escrita?', ['Paz','Capás','Vez','Luz'], 1, 'La palabra correcta es "capaz" (singular), no "capás". "Capaces" es el plural con C.'),
    qTF('Las palabras terminadas en -ésimo se escriben con S.', true, 'Ejemplos: vigésimo, trigésimo. Llevan S porque son superlativos numéricos.'),
    qMC('¿Cuál de estas usa correctamente la S?', ['Abrasar (quemar)','Abrasar (abrazar con los brazos) - incorrecto','Expresar','Interesar'], 2, '"Expresar" se escribe con S. "Abrasar" con S es quemar; "abrazar" con Z es rodear con los brazos.'),
  ],

  // ===== M20: G, J y H =====
  [
    qMC('¿Qué letra sigue en las combinaciones "gue" y "gui" cuando la U debe sonar?', ['La diéresis (ü)','Una tilde','Nada, se pronuncia igual','La letra H'], 0, 'La diéresis sobre la ü indica que debe pronunciarse: pingüino, vergüenza, cigüeña.'),
    qTF('Las palabras que empiezan por "geo-" (tierra) se escriben con G.', true, 'Geografía, geología, geometría llevan G porque el prefijo griego "geo" se escribe con G.'),
    qMC('¿Cuál está bien escrita?', ['Muger','Mujer','Mugér','Mujér'], 1, '"Mujer" se escribe con J. No lleva tilde porque es aguda terminada en R.'),
    qTF('Todas las palabras que empiezan por "hum-" se escriben con H.', true, 'Humano, humedad, humor, húmero. La raíz latina "hum-" siempre lleva H.'),
    qMC('¿Qué palabra se escribe con J?', ['Tejer','Proteger','Elegir','Todas llevan G o J según reglas'], 2, '"Elegir" se escribe con G (verbos en -gir van con G, excepto tejer y crujir).'),
    qMC('¿Cuál lleva H?', ['Ahora','Ojo','Hueso','Todas'], 2, '"Hueso" lleva H. "Ahora" también lleva H.'),
    qTF('Los verbos terminados en -ger y -gir se escriben con G, excepto tejer y crujir.', true, 'Coger, dirigir, proteger = con G. Tejer y crujir = con J, son excepciones.'),
    qMC('¿Cuál es correcta?', ['Jigante','Gigante','Gijante','Jijante'], 1, '"Gigante" se escribe con G. No es palabra con J.'),
    qTF('"Hecho" (de hacer) y "echo" (de echar) se escriben con H y sin H respectivamente.', true, 'Son homófonos: "hecho" (realizado) con H, "echo" (arrojar) sin H.'),
    qMC('¿En cuál combinación la G suena suave como en "gato"?', ['ge, gi','gue, gui','ja, jo','Todas suenan suave'], 1, 'Con "gue, gui" la G suena suave (guerra, guitarra). Con "ge, gi" suena como J (general, giro).'),
    qTF('"Hola" (saludo) y "ola" (onda del mar) son palabras que suenan igual.', true, 'Son homófonas: se pronuncian igual pero se escriben diferente por la H.'),
    qMC('¿Qué palabra está mal escrita?', ['Hoja','Reloj','Viaje','Agüero'], 3, 'Lo correcto es "agüero" (con diéresis).'),
  ],

  // ===== M21: ¿Femenino o masculino? =====
  [
    qMC('¿Qué es el género de un sustantivo?', ['Su tamaño','Si es masculino o femenino','Su número','Su posición en la oración'], 1, 'El género gramatical clasifica los sustantivos en masculinos (el) y femeninos (la).'),
    qTF('"Agua" es un sustantivo femenino aunque use el artículo "el".', true, '"Agua" es femenino. Usa "el" por razones fonéticas (evitar la cacofonía "la agua"), pero es femenino: "el agua clara".'),
    qMC('¿Cuál es el femenino de "actor"?', ['Actora','Actriz','Actora','Actora'], 1, 'El femenino de actor es "actriz", no "actora".'),
    qTF('Todos los sustantivos que terminan en -o son masculinos.', false, 'Excepciones: "la mano", "la radio" (aparato), "la foto" (abreviatura de fotografía).'),
    qMC('¿Cuál de estos sustantivos es femenino?', ['El lápiz','La flor','El árbol','El papel'], 1, '"Flor" es femenino (la flor). Los otros son masculinos.'),
    qMC('¿Cuál es el masculino de "yegua"?', ['Yego','Caballo','Yeguo','Yegual'], 1, 'El masculino de "yegua" es "caballo". Son heterónimos (palabras diferentes).'),
    qTF('"Poeta" puede ser masculino o femenino: el poeta / la poeta.', true, '"Poeta" es un sustantivo de género común: usa el mismo término para ambos géneros.'),
    qMC('¿Qué sustantivo NO cambia de forma para el femenino?', ['Niño/niña','Estudiante (igual)','Profesor/profesora','Gato/gata'], 1, '"Estudiante" es invariable: "el estudiante" y "la estudiante". No existe "estudianta".'),
    qTF('"El hacha" es masculino porque termina en -a.', false, '"Hacha" es femenino pero usa "el" ante vocal tónica inicial, como "agua", "águila", "hambre".'),
    qMC('¿Cuál de estos es un sustantivo epiceno?', ['La serpiente','Gato/gata','Niño/niña','Padre/madre'], 0, 'Los epicenos tienen un solo género gramatical para ambos sexos: la serpiente, la persona, el personaje.'),
    qTF('"Jirafa" se usa igual para el macho y la hembra con el mismo artículo.', true, 'Es epiceno: "la jirafa" para ambos sexos. Para especificar: "jirafa macho" o "jirafa hembra".'),
    qMC('¿Cuál es el femenino de "emperador"?', ['Emperadora','Emperatriz','Emperanta','Emperante'], 1, 'El femenino es "emperatriz" con el sufijo -triz, como de "actor" → "actriz".'),
  ],

  // ===== M22: Singular y plural =====
  [
    qMC('¿Cómo se forma el plural de las palabras que terminan en vocal?', ['Agregando -es','Agregando -s','Agregando -n','No cambian'], 1, 'Las palabras terminadas en vocal átona forman plural con -s: casa → casas, libro → libros.'),
    qTF('El plural de "lápiz" es "lápices".', true, 'Las palabras terminadas en -z cambian la Z por C y añaden -es: lápiz → lápices, pez → peces.'),
    qMC('¿Cuál es el plural de "reloj"?', ['Relojs','Relojes','Relojies','Relojs'], 1, 'Los sustantivos terminados en consonante (excepto s) forman plural con -es: reloj → relojes.'),
    qTF('El plural de "crisis" es "crisis" (invariable).', true, 'Las palabras agudas o llanas terminadas en -s no cambian en plural: la crisis / las crisis, el lunes / los lunes.'),
    qMC('¿Cuál es el plural correcto de "jabalí"?', ['Jabalís','Jabalíes','Jabalís','Jabalíes'], 1, 'Los sustantivos agudos terminados en -í o -ú admiten -es o -s: jabalíes/jabalís, aunque se prefiere -es.'),
    qMC('¿Qué palabra está en plural?', ['Cantamos','Árboles','Cantaba','Feliz'], 1, '"Árboles" es el plural de "árbol". Las otras están en singular.'),
    qTF('El plural de "régimen" es "regímenes".', true, 'Cambia la tilde y añade -es: régimen → regímenes. Pasa lo mismo con "espécimen → especímenes".'),
    qMC('¿Cuál es el plural de "sí" (afirmación)?', ['Sís','Síes','Síes','No tiene plural'], 1, 'Las palabras monosílabas admiten -s o -es: síes/sís. En la práctica, se usa más "los síes".'),
    qTF('"El agua cristalina" se convierte en plural como "las aguas cristalinas".', true, 'En plural usa el artículo femenino "las": las aguas, las hadas, las áreas.'),
    qMC('¿Cuál de estos plurales es incorrecto?', ['Paredes','Ratones','Cafés','Cañas'], 0, 'El plural de "pared" es "paredes" (termina en consonante). Todos son correctos.'),
    qTF('Los sustantivos que solo existen en plural se llaman "pluralia tantum".', true, 'Ejemplos: víveres, nupcias, facciones. Carecen de forma singular.'),
    qMC('¿Cuál es el plural de "carácter"?', ['Carácteres','Caracteres','Carácters','Caráteres'], 1, '"Carácter" hace el plural "caracteres" (cambia la tilde y la acentuación).'),
  ],

  // ===== M23: Tipos de sustantivos =====
  [
    qMC('¿Qué tipo de sustantivo es "México"?', ['Común','Propio','Abstracto','Colectivo'], 1, '"México" es un nombre propio porque designa un país específico.'),
    qTF('"Felicidad" es un sustantivo abstracto.', true, 'Los sustantivos abstractos nombran ideas, sentimientos o conceptos que no se pueden tocar.'),
    qMC('¿Cuál es un sustantivo colectivo?', ['Perro','Jauría','Blanco','Correr'], 1, '"Jauría" es colectivo porque nombra un grupo de perros. Está en singular pero designa pluralidad.'),
    qTF('Los sustantivos concretos nombran realidades que se pueden percibir con los sentidos.', true, 'Mesa, flor, libro: se pueden ver, tocar, oler. Son concretos.'),
    qMC('¿Qué tipo de sustantivo es "enjambre"?', ['Propio','Colectivo','Abstracto','Individual'], 1, '"Enjambre" es un sustantivo colectivo que designa un conjunto de abejas.'),
    qMC('¿Cuál NO es un sustantivo abstracto?', ['Amor','Libertad','Teléfono','Justicia'], 2, '"Teléfono" es concreto (se puede tocar). Los otros son ideas o sentimientos.'),
    qTF('"Pedro" es un sustantivo propio.', true, 'Los nombres de personas son sustantivos propios, se escriben con mayúscula inicial.'),
    qMC('¿Qué es un sustantivo individual?', ['El que nombra una sola entidad: "árbol"','El que nombra un grupo: "arboleda"','El que es abstracto','El que es propio'], 0, 'Individual nombra un solo ser u objeto. Colectivo nombra un conjunto: árbol (individual), arboleda (colectivo).'),
    qTF('"Manada" es un sustantivo colectivo que designa un conjunto de animales.', true, 'Manada es colectivo. El individual sería "lobo" o "elefante", según la especie.'),
    qMC('¿Cuál es el colectivo de "cantante"?', ['Cantante','Coro o coral','Orquesta','Banda'], 1, '"Coro" o "coral" es el sustantivo colectivo para un conjunto de cantantes.'),
    qTF('Los sustantivos contables se pueden cuantificar numéricamente.', true, 'Ejemplos: tres libros, cinco manzanas. Los no contables no: *tres aguas (salvo que se envase).'),
    qMC('¿Cuál de estos es un sustantivo propio?', ['Libro','Pacífico (océano)','Escuela','Ciudad'], 1, '"Pacífico" es nombre propio del océano. Debe escribirse con mayúscula.'),
  ],

  // ===== M24: Palabras que describen =====
  [
    qMC('¿Cuál es la función del adjetivo calificativo?', ['Indicar acción','Modificar o describir al sustantivo','Sustituir al sustantivo','Unir oraciones'], 1, 'El adjetivo calificativo expresa cualidades o características del sustantivo.'),
    qTF('En "la casa azul", "azul" es un adjetivo calificativo.', true, '"Azul" describe una cualidad de la casa, por eso es adjetivo calificativo.'),
    qMC('¿Concuerdan el adjetivo y el sustantivo?', ['Solo en género','Solo en número','En género y número','No concuerdan'], 2, 'El adjetivo debe concordar en género (masculino/femenino) y número (singular/plural) con el sustantivo.'),
    qTF('"Inteligente" puede usarse tanto para masculino como para femenino sin cambiar.', true, 'Es un adjetivo de una terminación (no varía por género): niño inteligente, niña inteligente.'),
    qMC('¿Cuál es el grado superlativo de "bueno"?', ['Más bueno','Buenísimo u óptimo','Muy bueno','Buenote'], 1, 'El superlativo absoluto de bueno es "buenísimo" u "óptimo". Expresa la cualidad en grado máximo.'),
    qMC('¿Qué tipo de adjetivo es "aquel" en "aquel libro"?', ['Calificativo','Demostrativo','Posesivo','Indefinido'], 1, '"Aquel" es un adjetivo demostrativo (o determinante) que indica lejanía.'),
    qTF('En "Pedro es más alto que Juan", el adjetivo está en grado comparativo.', true, '"Más alto que" es comparativo de superioridad. Compara dos elementos.'),
    qMC('¿Cuál es el femenino plural de "trabajador"?', ['Trabajadora','Trabajadoras','Trabajadores','Trabajador'], 1, '"Trabajadoras" concuerda en femenino y plural.'),
    qTF('"Grandísimo" es el superlativo del adjetivo "grande".', true, 'El superlativo absoluto se forma con el sufijo -ísimo: grande → grandísimo, fácil → facilísimo.'),
    qMC('¿Qué adjetivo calificativo describe correctamente a "niñas"?', ['Pequeño','Pequeñas','Pequeña','Pequeños'], 1, '"Pequeñas" concuerda en femenino plural con "niñas".'),
    qTF('Los epítetos son adjetivos que expresan una cualidad propia del sustantivo.', true, '"Blanca nieve" (la nieve siempre es blanca), "dulce miel". Es una figura literaria con función estética.'),
    qMC('¿Qué grado expresa "tan alto como"?', ['Comparativo de superioridad','Comparativo de igualdad','Comparativo de inferioridad','Superlativo'], 1, '"Tan alto como" expresa igualdad entre dos elementos comparados.'),
  ],

  // ===== M25: Más y más =====
  [
    qMC('¿Cuáles son los tres grados del adjetivo?', ['Presente, pasado y futuro','Positivo, comparativo y superlativo','Simple, compuesto y derivado','Singular, plural y neutro'], 1, 'Los grados del adjetivo son positivo (base), comparativo (compara) y superlativo (grado máximo).'),
    qTF('"Óptimo" es un superlativo irregular de "bueno".', true, 'Algunos adjetivos tienen formas cultas irregulares: bueno → óptimo, malo → pésimo, grande → máximo.'),
    qMC('¿Qué expresa el comparativo de inferioridad?', ['Algo es igual que otra cosa','Algo es mejor que otra cosa','Algo es menos que otra cosa','Algo es lo máximo'], 2, '"Menos alto que" expresa comparativo de inferioridad.'),
    qTF('"Pésimo" es el superlativo de "malo".', true, 'El superlativo culto de malo es "pésimo" (irregular). También es válido "malísimo".'),
    qMC('¿Cuál es el superlativo absoluto de "fuerte"?', ['Muy fuerte','Fortísimo','El más fuerte','Fuertote'], 1, 'El superlativo absoluto sintético de "fuerte" es "fortísimo". También es válido "fuertísimo".'),
    qMC('Transforma "Elena es inteligente" a superlativo relativo:', ['Elena es más inteligente','Elena es la más inteligente de la clase','Elena es inteligentísima','Elena es muy inteligente'], 1, 'El superlativo relativo dice que algo destaca dentro de un grupo: "la más inteligente de...".'),
    qTF('"Inferior a" es un comparativo sintético (sin "más" ni "menos").', true, 'Inferior, superior, mejor, peor son comparativos sintéticos: no necesitan "más".'),
    qMC('¿Cuál NO es un superlativo?', ['Altísimo','Máximo','Más alto','Muy alto'], 2, '"Más alto" es comparativo, no superlativo. Compara con otro elemento.'),
    qTF('Los adjetivos en grado positivo expresan la cualidad sin compararla ni intensificarla.', true, 'El grado positivo es la forma base: "El cielo es azul". Sin modificar.'),
    qMC('¿Cuál es el superlativo irregular de "pequeño"?', ['Pequeñísimo','Mínimo','Menor','Inferior'], 1, '"Mínimo" es superlativo culto. "Pequeñísimo" también es válido como forma regular.'),
    qTF('"Fidelísimo" es un superlativo correcto, con cambio en la raíz.', true, 'Fiel → fidelísimo es correcto (recupera la raíz latina). También válido "fielísimo".'),
    qMC('¿Qué significa el grado superlativo absoluto?', ['Compara dos elementos','Expresa la cualidad en su grado máximo, sin comparar','Dice que algo es inferior','Expresa igualdad'], 1, 'El superlativo absoluto no compara; afirma la cualidad en grado extremo: "altísimo", "muy alto".'),
  ],

  // ===== M26: Determinando sustantivos =====
  [
    qMC('¿Qué indican los adjetivos demostrativos?', ['Posesión','Distancia o ubicación respecto al hablante','Cantidad imprecisa','Número exacto'], 1, 'Los demostrativos señalan proximidad (este), distancia media (ese) o lejanía (aquel).'),
    qTF('"Mi", "tu", "su" son adjetivos posesivos.', true, 'Los posesivos indican a quién pertenece el sustantivo: mi libro, tu casa, su perro.'),
    qMC('¿Cuál es un adjetivo indefinido?', ['Tres','Este','Mío','Algún'], 3, '"Algún" es indefinido porque indica cantidad imprecisa. "Tres" es numeral, "este" demostrativo, "mío" posesivo.'),
    qTF('Los adjetivos numerales cardinales expresan cantidad exacta.', true, 'Uno, dos, tres, cien son numerales cardinales: expresan número concreto.'),
    qMC('¿Qué tipo de adjetivo es "primer" en "primer lugar"?', ['Posesivo','Numeral ordinal','Indefinido','Demostrativo'], 1, '"Primer" es la forma apocopada de "primero", un numeral ordinal.'),
    qMC('¿Cuál es un adjetivo posesivo en la frase "nuestra escuela es grande"?', ['Escuela','Nuestra','Grande','Es'], 1, '"Nuestra" indica posesión: la escuela pertenece a "nosotros".'),
    qTF('"Ese" y "aquel" son ambos demostrativos, pero indican distinta distancia.', true, '"Ese" (distancia media); "aquel" (lejanía). "Este" es cercanía.'),
    qMC('¿Qué palabra es un adjetivo numeral ordinal?', ['Muchos','Tuyo','Quinto','Alguna'], 2, '"Quinto" es numeral ordinal (indica orden). "Muchos" es indefinido; los otros son posesivo e indefinido.'),
    qTF('"Mucho", "poco", "bastante" son adjetivos indefinidos.', true, 'Expresan cantidad de forma imprecisa, sin número exacto.'),
    qMC('¿Cuál es la función de los adjetivos determinativos?', ['Calificar al sustantivo','Limitar o precisar el significado del sustantivo','Indicar acción','Sustituir al verbo'], 1, 'Los determinativos concretan el sustantivo: indican posesión, distancia, cantidad, etc.'),
    qTF('"Ambos" es un adjetivo numeral distributivo.', false, '"Ambos" en gramática tradicional se considera indefinido o cuantificador. Los distributivos son "sendos", "cada".'),
    qMC('Señala el demostrativo de lejanía:', ['Este','Ese','Aquel','Eso'], 2, '"Aquel" señala objetos lejanos al hablante y al oyente.'),
  ],

  // ===== M27: El, la, los, las =====
  [
    qMC('¿Cuáles son los artículos definidos o determinados?', ['Un, una, unos, unas','El, la, los, las','Este, ese, aquel','Mi, tu, su'], 1, 'Los artículos definidos son: el, la, los, las.'),
    qTF('"Unos" es un artículo indefinido.', true, '"Un, una, unos, unas" son artículos indefinidos o indeterminados.'),
    qMC('¿Cuándo se debe usar "el" con palabras femeninas como "agua"?', ['Es incorrecto siempre','Cuando la palabra femenina empieza con a tónica','Cuando la palabra es corta','Nunca'], 1, 'Ante sustantivos femeninos con a tónica (água, águila, hámbre) se usa "el" para evitar cacofonía.'),
    qTF('El artículo concuerda en género y número con el sustantivo.', true, 'El artículo debe coincidir: el libro (masc. sing.), las flores (fem. plural).'),
    qMC('Completa: "___ hada madrina"', ['La','El','Las','Los'], 1, '"Hada" es femenino con a tónica inicial. Se recomienda "el hada" (como "el agua").'),
    qMC('¿Qué artículo usarías para "problema"?', ['La','El','Las','Los'], 1, '"Problema" es masculino a pesar de terminar en -a. Es de origen griego: "el problema".'),
    qTF('Los artículos indefinidos se usan para hablar de algo no conocido o no específico.', true, '"Un perro" (cualquier perro) vs "el perro" (ese perro en concreto).'),
    qMC('¿Cuál está mal?', ['El hacha','La mano','El foto','La moto'], 2, 'Lo correcto es "la foto" (femenino por fotografía). "La mano" es correcto.'),
    qTF('"Lo" es un artículo neutro que acompaña a adjetivos o adverbios.', true, 'Ejemplo: "lo bueno", "lo mejor", "lo malo". No acompaña a sustantivos.'),
    qMC('¿Cuál es el artículo definido femenino plural?', ['El','La','Los','Las'], 3, '"Las" es el artículo definido femenino plural: las casas, las flores.'),
    qTF('En español no existe el artículo indeterminado neutro.', true, 'Solo hay artículo determinado neutro ("lo"). El indeterminado no tiene forma neutra.'),
    qMC('Completa: "Tengo ___ idea genial."', ['el','la','una','los'], 2, '"Una" es artículo indefinido femenino singular. La idea no es específica aún.'),
  ],

  // ===== M28: Todo concuerda =====
  [
    qMC('¿Qué es la concordancia gramatical?', ['Que las palabras suenen bien','La coincidencia obligatoria de género y número entre palabras relacionadas','Una regla opcional','Una figura literaria'], 1, 'La concordancia es la correspondencia forzosa de género y número entre sustantivo, artículo y adjetivo.'),
    qTF('En "los niños pequeños", hay concordancia correcta en masculino plural.', true, 'Artículo "los", sustantivo "niños" y adjetivo "pequeños" concuerdan en masculino plural.'),
    qMC('¿Cuál NO concuerda correctamente?', ['La casa blanca','El problema difícil','La problema serio','Los árboles verdes'], 2, '"Problema" es masculino. Debe ser "el problema serio", no "la problema".'),
    qTF('Cuando un adjetivo califica a varios sustantivos de distinto género, se usa el masculino plural.', true, '"Juan y María son altos." El masculino plural engloba ambos géneros.'),
    qMC('Corrige: "Las aguas cristalino"', ['Está bien','Las aguas cristalinas','El aguas cristalino','Los aguas cristalinos'], 1, '"Aguas" es femenino plural, requiere adjetivo en femenino plural: "cristalinas".'),
    qMC('¿Qué artículo completa para que concuerde? "___ sofá viejo"', ['El','La','Los','Las'], 0, '"El" concuerda con "sofá" (masculino singular). "Sofá" es masculino.'),
    qTF('Se debe decir "el área pequeña" porque "área" es femenino.', true, 'Aunque usa "el" por la a tónica, "área" sigue siendo femenino. El adjetivo va en femenino.'),
    qMC('¿Cuál es correcto?', ['Un aula pequeña','Un aula pequeño','Una aula pequeña','Una aúla pequeña'], 0, '"Aula" es femenino con a tónica. Usa "un" pero adjetivo femenino: "pequeña".'),
    qTF('Los errores de concordancia son una falta gramatical grave en cualquier texto.', true, 'La concordancia incorrecta afecta la claridad y corrección del mensaje.'),
    qMC('Transforma a plural manteniendo concordancia: "El perro fiel"', ['Los perro fieles','Los perros fieles','El perros fiel','Los perros fiel'], 1, 'En plural: artículo "los", sustantivo "perros", adjetivo "fieles". Todo en masculino plural.'),
    qTF('En la frase "la mayoría de los estudiantes está contenta", el verbo concuerda con "mayoría".', true, 'El verbo principal concuerda con el núcleo del sujeto ("mayoría"), no con "estudiantes".'),
    qMC('Completa: "Compré frutas frescas y pan ____."', ['fresco','frescos','fresca','frescas'], 0, 'El adjetivo concuerda con "pan" (masculino singular) por cercanía.'),
  ],

  // ===== M29: Modificando la acción =====
  [
    qMC('¿Qué modifica el adverbio?', ['Al sustantivo','Al verbo, adjetivo u otro adverbio','Solo al artículo','Al pronombre'], 1, 'El adverbio modifica al verbo, al adjetivo o a otro adverbio. Es invariable (no cambia de género ni número).'),
    qTF('"Rápidamente" es un adverbio de modo.', true, 'Los adverbios terminados en -mente suelen ser de modo: "lentamente", "cuidadosamente".'),
    qMC('¿Cuál es un adverbio de tiempo?', ['Aquí','Mucho','Ayer','Bien'], 2, '"Ayer" indica tiempo. "Aquí" es de lugar, "mucho" de cantidad, "bien" de modo.'),
    qTF('Los adverbios cambian de género y número según la palabra que modifican.', false, 'El adverbio es invariable: no tiene ni género ni número. "Corrió rápido" / "Corrieron rápido".'),
    qMC('¿Qué tipo de adverbio es "quizás"?', ['De modo','De duda','De lugar','De tiempo'], 1, '"Quizás", "tal vez", "acaso" son adverbios de duda.'),
    qMC('¿Cuál es un adverbio de lugar?', ['Hoy','Encima','Tarde','Así'], 1, '"Encima" indica lugar. Los otros son de tiempo y modo respectivamente.'),
    qTF('"No" y "jamás" son adverbios de negación.', true, 'Niegan la acción: "No quiero", "Jamás lo haré".'),
    qMC('¿Qué tipo de adverbio es "muy"?', ['De modo','De cantidad o grado','De afirmación','De lugar'], 1, '"Muy" intensifica y expresa grado: "muy alto", "muy lejos". Es adverbio de cantidad.'),
    qTF('"Sí" y "también" son adverbios de afirmación.', true, 'Confirman o afirman: "Sí, iré", "También lo creo".'),
    qMC('¿Cuál es un adverbio de modo?', ['Despacio','Allí','Nunca','Demasiado'], 0, '"Despacio" indica la manera de hacer algo. Es adverbio de modo.'),
    qTF('Los adverbios terminados en -mente conservan la tilde del adjetivo original.', true, '"Rápido" (con tilde) → "rápidamente" (con tilde). "Fácil" → "fácilmente".'),
    qMC('En "Llegó muy tarde", ¿qué función tiene "muy"?', ['Modifica al verbo "llegó"','Modifica al adverbio "tarde"','Modifica al sustantivo','Es un artículo'], 1, '"Muy" es un adverbio de cantidad que modifica a otro adverbio ("tarde").'),
  ],

  // ===== M30: Repaso gramatical =====
  [
    qMC('En la oración "El perro marrón ladra fuerte", ¿qué es "marrón"?', ['Sustantivo','Adjetivo calificativo','Adverbio','Artículo'], 1, '"Marrón" describe al sustantivo "perro". Es un adjetivo calificativo.'),
    qTF('Todos los artículos son determinados: el, la, los, las.', false, 'Existen determinados (el, la, los, las) e indeterminados (un, una, unos, unas).'),
    qMC('¿Cuál de estas palabras es invariable?', ['Libro','Alegre','Bien','Grande'], 2, 'Los adverbios como "bien" son invariables. "Libro" cambia en plural, "alegre" y "grande" admiten variación.'),
    qMC('¿Qué tipo de sustantivo es "archipiélago"?', ['Propio','Colectivo','Abstracto','Individual'], 1, '"Archipiélago" es un sustantivo colectivo: designa un conjunto de islas.'),
    qTF('En "Tres gatos negros", "tres" es un adjetivo numeral cardinal.', true, 'Los numerales cardinales expresan cantidad exacta. "Tres" modifica a "gatos".'),
    qMC('¿Cuál de estos sustantivos es ambiguo en cuanto al género?', ['El mar / la mar','La mesa','El libro','La silla'], 0, '"Mar" puede ser masculino (el mar) o femenino en contextos poéticos (la mar).'),
    qTF('En "Esa camisa es mía", "mía" es un adjetivo posesivo.', false, '"Mía" funciona como pronombre posesivo, no como adjetivo. El adjetivo sería "mi" (mi camisa).'),
    qMC('¿Qué función tienen "la", "las", "los" en una oración?', ['Verbos auxiliares','Conjunciones','Artículos','Pronombres personales'], 2, 'Son artículos definidos, femenino y masculino plural, respectivamente.'),
    qTF('Los adverbios de cantidad como "más", "menos" y "muy" nunca se anteponen a verbos.', false, 'Ejemplo: "Te quiero mucho." "Mucho" es adverbio de cantidad y va junto al verbo.'),
    qMC('Identifica el adjetivo en grado superlativo:', ['Más rápido','Rapidísimo','Menos rápido','Tan rápido'], 1, '"Rapidísimo" es superlativo absoluto. "Más rápido" es comparativo.'),
    qTF('La palabra "cada" es un adjetivo determinativo distributivo.', true, 'Indica distribución: "cada uno", "cada día". Se considera un cuantificador distributivo.'),
    qMC('Señala el sustantivo y su adjetivo en: "Las estrellas brillantes iluminan la noche."', ['Brillantes/noche','Estrellas/brillantes','Iluminan/noche','Las/noche'], 1, '"Estrellas" es el sustantivo y "brillantes" es el adjetivo calificativo que lo describe.'),
  ],

  // ===== M31: ¡Acción! =====
  [
    qMC('¿Qué expresa el verbo?', ['Una cualidad','Una acción, estado o proceso','Un nombre','Una ubicación'], 1, 'El verbo indica lo que hace, siente o padece el sujeto. Es el núcleo del predicado.'),
    qTF('Los verbos en infinitivo terminan en -ar, -er o -ir.', true, 'Las tres conjugaciones: primera (-ar: cantar), segunda (-er: comer), tercera (-ir: vivir).'),
    qMC('¿A qué conjugación pertenece "beber"?', ['Primera (-ar)','Segunda (-er)','Tercera (-ir)','Ninguna'], 1, '"Beber" termina en -er, por lo tanto es de la segunda conjugación.'),
    qTF('Las formas no personales del verbo son el infinitivo, el gerundio y el participio.', true, 'Infinitivo (cantar), gerundio (cantando), participio (cantado). No se conjugan por persona.'),
    qMC('¿Cuál es la raíz de "cantamos"?', ['Cant-','Canta-','Can-','Cantam-'], 0, 'La raíz de "cantar" es "cant-". Se obtiene quitando la terminación -ar, -er o -ir.'),
    qMC('¿Cómo se llama la parte del verbo que indica persona, número, tiempo y modo?', ['Raíz','Desinencia o terminación','Lexema','Prefijo'], 1, 'La desinencia aporta la información gramatical: -amos indica primera persona del plural, presente, indicativo.'),
    qTF('Dormir, sentir y pedir son verbos de la tercera conjugación (-ir).', true, 'Todos terminan en -ir, pertenecen a la tercera conjugación.'),
    qMC('¿Cuál es el infinitivo de "comieron"?', ['Comerán','Comer','Comiendo','Comido'], 1, 'El infinitivo es "comer". "Comieron" es pretérito de indicativo, tercera persona del plural.'),
    qTF('El gerundio termina en -ando (primera) o -iendo (segunda y tercera).', true, 'Cantar → cantando. Comer → comiendo. Vivir → viviendo.'),
    qMC('¿Qué forma verbal es "hablado"?', ['Infinitivo','Gerundio','Participio','Imperativo'], 2, 'El participio termina en -ado (primera) o -ido (segunda y tercera): hablado, comido, vivido.'),
    qTF('Los verbos defectivos no se conjugan en todas las personas.', true, 'Ejemplo: "llover" es defectivo (solo se conjuga en tercera persona del singular: llueve).'),
    qMC('¿A qué conjugación pertenece "partir"?', ['Primera','Segunda','Tercera','Cuarta'], 2, '"Partir" termina en -ir. Es de la tercera conjugación.'),
  ],

  // ===== M32: Hechos reales =====
  [
    qMC('¿Qué expresa el modo indicativo?', ['Deseos o dudas','Acciones reales, objetivas y concretas','Órdenes o mandatos','Acciones hipotéticas'], 1, 'El indicativo presenta acciones como hechos reales o ciertos.'),
    qTF('"Yo como" está en presente de indicativo.', true, 'Expresa una acción que sucede ahora, de manera objetiva.'),
    qMC('¿Cuál está en pretérito de indicativo?', ['Cantaré','Canté','Cantaría','Cante'], 1, '"Canté" es pretérito perfecto simple de indicativo. Expresa acción pasada y terminada.'),
    qTF('El futuro simple de indicativo se forma añadiendo terminaciones al infinitivo completo.', true, 'Cantaré, comerás, vivirá. Las desinencias se añaden al infinitivo entero, no solo a la raíz.'),
    qMC('Conjuga "comer" en primera persona del singular, pretérito:', ['Comeré','Comía','Comí','Comiera'], 2, '"Comí" es yo, pretérito perfecto simple de indicativo del verbo comer.'),
    qMC('¿Qué tiempo es "caminaban"?', ['Presente','Pretérito imperfecto','Futuro','Pretérito perfecto simple'], 1, 'La terminación -aban indica pretérito imperfecto de indicativo (acción pasada no terminada).'),
    qTF('"Viviré" es la primera persona del singular del futuro de indicativo.', true, 'Yo viviré: primera persona, singular, futuro simple de indicativo.'),
    qMC('¿Cuál está en pretérito imperfecto?', ['Cantó','Cantaba','Cantará','Ha cantado'], 1, '"Cantaba" expresa acción pasada habitual o en desarrollo.'),
    qTF('El presente de indicativo siempre expresa acciones que ocurren en el momento de hablar.', false, 'También puede expresar acciones habituales, atemporales o futuras: "mañana voy al cine".'),
    qMC('"Nosotros bailábamos" está en:', ['Presente','Pretérito imperfecto','Futuro','Pretérito perfecto'], 1, 'La terminación -ábamos indica pretérito imperfecto, primera persona del plural.'),
    qTF('El copretérito y el pretérito imperfecto son el mismo tiempo verbal.', true, 'Copretérito es el nombre tradicional en México para el pretérito imperfecto de indicativo.'),
    qMC('¿En qué tiempo está "escribirás"?', ['Presente','Pretérito','Futuro','Copretérito'], 2, '"Escribirás" es segunda persona del singular del futuro simple de indicativo.'),
  ],

  // ===== M33: Antes y después =====
  [
    qMC('¿Con qué verbo auxiliar se forman los tiempos compuestos?', ['Ser','Estar','Haber','Tener'], 2, 'Todos los tiempos compuestos usan el verbo "haber" como auxiliar: he cantado, había comido.'),
    qTF('"He comido" es pretérito perfecto compuesto de indicativo.', true, 'Se forma con el presente de "haber" + participio. Expresa acción pasada reciente.'),
    qMC('¿Cuál es el pretérito pluscuamperfecto de "salir" (yo)?', ['Había salido','He salido','Habré salido','Hube salido'], 0, '"Había salido" expresa una acción pasada anterior a otra también pasada.'),
    qTF('El participio en los tiempos compuestos es invariable (siempre en masculino singular).', true, 'Se dice "he comido", "hemos comido", nunca "hemos comidos" o "hemos comida".'),
    qMC('¿Qué tiempo es "habré terminado"?', ['Pretérito pluscuamperfecto','Futuro perfecto','Pretérito anterior','Condicional compuesto'], 1, '"Habré terminado" es el futuro compuesto de indicativo.'),
    qMC('¿Qué expresa "habíamos llegado" antes que "empezó la fiesta"?', ['Acción futura','Acción pasada anterior a otra pasada','Acción simultánea','Acción presente'], 1, 'Es pretérito pluscuamperfecto: indica anterioridad respecto a otra acción pasada.'),
    qTF('"Hube cantado" (pretérito anterior) es de uso frecuente en el habla cotidiana.', false, 'El pretérito anterior ha caído en desuso. Se usa en textos literarios o muy formales.'),
    qMC('Conjuga "escribir" en antepresente, primera persona:', ['Escribí','He escrito','Había escrito','Escribía'], 1, 'El antepresente (pretérito perfecto compuesto) de escribir es "he escrito" (participio irregular).'),
    qTF('Todos los tiempos compuestos llevan el verbo auxiliar "haber" conjugado más el participio.', true, 'Estructura fija: haber (conjugado) + verbo principal en participio.'),
    qMC('¿Cuál es un tiempo compuesto?', ['Canto','Canté','Había cantado','Cantaría'], 2, '"Había cantado" tiene dos palabras: auxiliar haber + participio. Los otros son tiempos simples.'),
    qTF('"Habremos salido" es antefuturo (futuro compuesto de indicativo).', true, 'Habré/habrás/habrá/habremos/habréis/habrán + participio. Expresa acción futura concluida.'),
    qMC('Transforma "Como fruta" a antepresente (yo):', ['Comeré fruta','He comido fruta','Comía fruta','Había comido fruta'], 1, 'El antepresente se forma con presente de haber + participio: "he comido".'),
  ],

  // ===== M34: Deseos y dudas =====
  [
    qMC('¿Qué expresa el modo subjuntivo?', ['Hechos objetivos','Deseos, dudas, posibilidades','Órdenes directas','Acciones pasadas únicamente'], 1, 'El subjuntivo expresa subjetividad: lo irreal, posible, dudoso o deseado.'),
    qTF('"Quiero que vengas" usa subjuntivo en "vengas".', true, 'La oración subordinada con "que" tras un verbo de deseo exige subjuntivo.'),
    qMC('¿Cuál está en presente de subjuntivo?', ['Canto','Cante','Cantaba','Cantaría'], 1, '"Cante" es presente de subjuntivo. "Canto" es indicativo.'),
    qTF('"Ojalá llueva" está correctamente escrito en subjuntivo.', true, '"Ojalá" rige subjuntivo. "Llueva" es presente de subjuntivo del verbo llover.'),
    qMC('¿Cuál de estas oraciones requiere subjuntivo?', ['Creo que es verdad','Es verdad que llueve','No creo que sea verdad','Sé que vienes'], 2, 'Con "no creer" se usa subjuntivo. Con verbos de certeza en afirmativo se usa indicativo.'),
    qMC('¿Qué tiempo de subjuntivo es "cantara" o "cantase"?', ['Presente','Pretérito imperfecto','Futuro','Pretérito perfecto'], 1, '"Cantara" y "cantase" son las dos formas del pretérito imperfecto de subjuntivo (ambas válidas).'),
    qTF('El subjuntivo se usa únicamente en oraciones subordinadas.', false, 'También aparece en independientes: "Quizás venga", "Tal vez esté".'),
    qMC('Conjuga "tener" en presente de subjuntivo (yo):', ['Tengo','Tuve','Tenga','Tenía'], 2, '"Tenga" es el presente de subjuntivo de tener.'),
    qTF('Tras "cuando" con sentido de futuro, se usa subjuntivo.', true, '"Cuando llegues, te llamo." Se refiere a futuro, por eso subjuntivo.'),
    qMC('¿Cuál NO está en subjuntivo?', ['Espero que duermas','Dudo que pueda','Sé que puedes','Quizás salga'], 2, '"Sé que puedes" usa indicativo porque "saber" expresa certeza.'),
    qTF('El pretérito perfecto de subjuntivo se forma con "haya" + participio.', true, 'Ejemplo: "Espero que hayas comido."'),
    qMC('¿Qué expresa el verbo en: "Si tuviera dinero, viajaría"?', ['Un hecho real','Una condición hipotética o irreal','Una orden','Un hecho pasado'], 1, '"Tuviera" está en imperfecto de subjuntivo porque expresa condición irreal.'),
  ],

  // ===== M35: ¡Órdenes! =====
  [
    qMC('¿Qué expresa el modo imperativo?', ['Deseos','Órdenes, mandatos, ruegos','Dudas','Hechos pasados'], 1, 'El imperativo expresa mandato directo. Solo se conjuga en segunda persona.'),
    qTF('"Come" es el imperativo afirmativo de "comer" para "tú".', true, 'Para tú, el imperativo afirmativo coincide con la tercera persona del singular del presente de indicativo.'),
    qMC('¿Cuál es el imperativo de "hablar" para "ustedes"?', ['Hablen','Hablan','Hable','Hablas'], 0, '"Hablen" es imperativo para ustedes. "Habla" sería para tú.'),
    qTF('El imperativo negativo se forma con el presente de subjuntivo.', true, 'No cantes, no comas, no escribas. Para el negativo se usa el subjuntivo.'),
    qMC('¿Cuál es correcto? (España)', ['¡Cantad!','¡Cantad!','¡Cantad!','¡Cantad!'], 0, '"Cantad" es imperativo para vosotros (usado en España).'),
    qMC('Transforma "comer" a imperativo negativo (tú):', ['No come','No comas','No comés','No comer'], 1, 'El imperativo negativo de tú usa la forma de subjuntivo: "no comas".'),
    qTF('Los pronombres se colocan después del verbo en imperativo afirmativo.', true, 'Dímelo, cómetelo, siéntate. Van pegados al verbo.'),
    qMC('¿Cuál es el imperativo de "ir" para "tú"?', ['Ve','Vas','Ibas','Vaya'], 0, '"Ve" es el imperativo de ir para tú (irregular). "Vaya" es para usted.'),
    qTF('En el imperativo negativo, los pronombres van antes del verbo.', true, 'No me lo digas. En afirmativo irían después: dímelo.'),
    qMC('¿Cuál es el imperativo de "hacer" para "tú"?', ['Haga','Haz','Hace','Hacés'], 1, '"Haz" es imperativo irregular de hacer para tú. "Haga" es para usted.'),
    qTF('El imperativo solo existe en presente.', true, 'No se puede dar una orden en pasado. El imperativo es exclusivo del presente.'),
    qMC('Completa: "Por favor, ___ (sentarse) aquí, señor."', ['siéntate','siéntese','sientate','sientese'], 1, 'Para "usted" (señor), el imperativo es "siéntese", con pronombre pegado.'),
  ],

  // ===== M36: Irregulares pero comunes =====
  [
    qMC('¿Por qué "ser" es un verbo irregular?', ['Porque lo dice la RAE','Porque su raíz y desinencias no siguen los modelos regulares','Porque es corto','No es irregular'], 1, 'Ser cambia su raíz: soy, fui, era. No sigue el patrón regular.'),
    qTF('La primera persona del presente de indicativo de "tener" es "tengo".', true, '"Tener" es irregular: yo tengo (no "teno"). También: tú tienes, él tiene.'),
    qMC('¿Cuál es el pretérito de "andar" (yo)?', ['Andé','Anduve','Andaba','Andaría'], 1, '"Andar" tiene pretérito fuerte irregular: anduve, anduviste, anduvo.'),
    qTF('"Hacer" en pretérito (yo) es "hice".', true, 'Pretérito: yo hice, tú hiciste, él hizo. La C cambia a Z en tercera persona.'),
    qMC('¿Cuál es el presente de subjuntivo de "ser" (yo)?', ['Soy','Sea','Fuera','Sere'], 1, 'El presente de subjuntivo de ser es irregular: sea, seas, sea.'),
    qMC('¿Qué forma es "estuve"?', ['Futuro de estar','Pretérito de estar (yo)','Presente de estar','Subjuntivo de estar'], 1, '"Estuve" es primera persona del pretérito de indicativo del verbo estar (irregular).'),
    qTF('"Caber" en presente (yo) es "cabo".', false, 'Es "quepo". Caber es muy irregular: quepo, cabes, cabe.'),
    qMC('¿Cuál es el futuro de "salir" (yo)?', ['Saliré','Saldré','Saliría','Salgo'], 1, '"Salir" pierde la i en el futuro: saldré, saldrás, saldrá. Igual que tener → tendré.'),
    qTF('El verbo "haber" en presente es: he, has, ha, hemos, habéis, han.', true, 'Es irregular como auxiliar. "Ha" es la tercera persona del singular.'),
    qMC('¿Cómo se dice "yo quepo" en pretérito?', ['Cupo','Cupe','Cabí','Cabía'], 1, 'Pretérito fuerte irregular: cupe, cupiste, cupo, cupimos.'),
    qTF('"Decir" en presente (yo) es "digo" y en pretérito es "dije".', true, 'Irregularidades: yo digo (presente), yo dije (pretérito).'),
    qMC('¿Cuál es el gerundio irregular de "dormir"?', ['Dormiendo','Durmiendo','Dormendo','Dormindo'], 1, 'Dormir → durmiendo (cambio vocálico o→u en gerundio). También: morir → muriendo.'),
  ],

  // ===== M37: A mí mismo =====
  [
    qMC('¿Qué caracteriza a un verbo reflexivo?', ['No tiene sujeto','La acción recae sobre el mismo sujeto que la realiza','Siempre está en pasado','No necesita pronombre'], 1, 'En los reflexivos, el sujeto realiza y recibe la acción: "Yo me lavo".'),
    qTF('"Me peino" es un verbo reflexivo.', true, '"Me" indica que yo realizo la acción de peinar sobre mí mismo.'),
    qMC('¿Cuál NO es un verbo reflexivo?', ['Ducharse','Arrepentirse','Correr','Peinarse'], 2, 'Correr no es reflexivo: la acción no recae sobre el sujeto.'),
    qTF('Los pronombres reflexivos son: me, te, se, nos, os, se.', true, 'Coinciden con los pronombres de objeto, pero indican acción sobre el mismo sujeto.'),
    qMC('Conjuga "lavarse" en presente (yo):', ['Lavo','Me lavo','Lavome','Lavándose'], 1, 'El pronombre reflexivo va delante del verbo conjugado: yo me lavo.'),
    qMC('¿Cuál es la forma correcta del imperativo de "sentarse" (tú)?', ['Siéntate','Siéntese','Sentarte','Sentate'], 0, 'En imperativo afirmativo, el pronombre va después y pegado: siéntate.'),
    qTF('Hay verbos que son siempre pronominales, como "arrepentirse" o "quejarse".', true, 'No se puede decir "arrepiento" sin el "me". Son inherentemente pronominales.'),
    qMC('¿Qué significa "se" en "Ellos se abrazan"?', ['Es impersonal','Reflexivo o recíproco según contexto','Es un artículo','No significa nada'], 1, 'Según el contexto, "se" puede indicar acción reflexiva o recíproca.'),
    qTF('En "María se lava las manos", el verbo es reflexivo.', true, 'El pronombre "se" indica que la acción recae en María.'),
    qMC('¿Cuál es la diferencia entre "llamar" y "llamarse"?', ['Ninguna','"Llamar" es llamar a alguien; "llamarse" es nombre propio','Uno es formal','Uno es pasado'], 1, '"Llamarse" es pronominal: "Me llamo Pedro". "Llamar" es transitivo.'),
    qTF('En el imperativo negativo reflexivo, el pronombre va antes del verbo.', true, 'No te sientes. "No siéntete" sería incorrecto.'),
    qMC('¿Cuál es correcto?', ['Voy a dormirme','Me voy a dormir','Ambas son correctas','Ninguna'], 2, 'En perífrasis, el pronombre puede ir antes del auxiliar o pegado al infinitivo.'),
  ],

  // ===== M38: Voy a explicarte =====
  [
    qMC('¿Qué es una perífrasis verbal?', ['Un verbo en infinitivo','La combinación de dos o más verbos como uno solo','Un verbo irregular','Un tiempo compuesto'], 1, 'Perífrasis = verbo auxiliar + verbo principal en forma no personal.'),
    qTF('"Voy a estudiar" es una perífrasis verbal de futuro.', true, 'Ir a + infinitivo expresa futuro próximo o intención.'),
    qMC('¿Qué tipo de perífrasis es "estoy comiendo"?', ['De futuro','Durativa (estar + gerundio)','De obligación','Terminativa'], 1, 'Estar + gerundio expresa acción en desarrollo.'),
    qTF('"Tengo que salir" expresa obligación.', true, 'Tener que + infinitivo es perífrasis de obligación. También "deber + infinitivo".'),
    qMC('¿Qué expresa "llevo estudiando tres horas"?', ['Futuro','Duración acumulada hasta el presente','Obligación','Probabilidad'], 1, 'Llevar + gerundio indica tiempo transcurrido realizando la acción.'),
    qMC('¿Cuál es una perífrasis de inicio?', ['Dejar de fumar','Echarse a llorar','Andar buscando','Tener que hacer'], 1, '"Echarse a" + infinitivo indica comienzo repentino.'),
    qTF('"Debe de ser tarde" expresa probabilidad, no obligación.', true, '"Deber" + infinitivo = obligación. "Deber de" = probabilidad.'),
    qMC('¿Qué perífrasis indica el final de una acción?', ['Dejar de + infinitivo','Ir a + infinitivo','Estar + gerundio','Poder + infinitivo'], 0, '"Dejar de fumar" = cesar la acción. "Acabar de" también es terminativa.'),
    qTF('"Acabo de llegar" significa acción muy reciente.', true, 'Acabar de + infinitivo indica acción inmediatamente anterior.'),
    qMC('¿Cuál NO es una perífrasis?', ['Estoy leyendo','Voy a cocinar','Quiero un libro','Tengo que ir'], 2, '"Quiero un libro" es verbo simple + objeto directo. No combina dos verbos.'),
    qTF('Las perífrasis modales expresan actitud del hablante.', true, 'Poder, deber, tener que + infinitivo expresan posibilidad u obligación.'),
    qMC('¿Qué tipo de perífrasis es "Sigue lloviendo"?', ['Terminativa','Continuativa (seguir + gerundio)','De futuro','De probabilidad'], 1, 'Seguir/continuar + gerundio indica que la acción continúa.'),
  ],

  // ===== M39: Activo o pasivo =====
  [
    qMC('¿Qué expresa la voz activa?', ['El sujeto recibe la acción','El sujeto realiza la acción','No hay sujeto','La acción es dudosa'], 1, 'En voz activa, el sujeto es agente: "El perro mordió al cartero".'),
    qTF('En "La carta fue escrita por María", la oración está en voz pasiva.', true, 'El sujeto recibe la acción. El agente aparece con "por".'),
    qMC('¿Cómo se forma la voz pasiva en español?', ['Verbo en infinitivo','Verbo ser + participio','Gerundio + haber','Solo con se'], 1, 'Ser conjugado + participio variable: "Los libros fueron leídos".'),
    qTF('La pasiva refleja usa "se" + verbo en tercera persona.', true, '"Se venden casas" es pasiva refleja. Significa "Las casas son vendidas".'),
    qMC('Transforma a voz pasiva: "El chef preparó la cena."', ['La cena fue preparada por el chef','El chef fue preparado por la cena','Se preparó el chef','La cena preparó al chef'], 0, 'OD pasa a sujeto paciente + ser + participio + agente con "por".'),
    qMC('¿Cuál está en voz pasiva refleja?', ['Se alquilan departamentos','Juan se lava','Ellos se fueron','Me gusta el café'], 0, '"Se alquilan departamentos" es pasiva refleja.'),
    qTF('La voz pasiva es más común en español coloquial que la activa.', false, 'La pasiva es más frecuente en textos formales. En coloquial se prefiere activa o pasiva refleja.'),
    qMC('¿Qué elemento de la pasiva puede omitirse?', ['El verbo ser','El participio','El complemento agente','El sujeto paciente'], 2, 'El agente solo se menciona si es relevante.'),
    qTF('En voz pasiva, el participio debe concordar con el sujeto paciente.', true, 'La casa fue construida (fem.), Los libros fueron leídos (masc. plural).'),
    qMC('Pasa a voz activa: "Los exámenes serán corregidos por el profesor."', ['El profesor corregirá los exámenes','El profesor corregía los exámenes','Los exámenes corrigen al profesor','El profesor será corregido'], 0, 'El agente pasa a sujeto, verbo en activa.'),
    qTF('Las oraciones impersonales con "se" son lo mismo que la pasiva refleja.', false, 'Impersonales: "Se vive bien" (sin sujeto). Pasiva refleja: "Se venden coches" (con sujeto).'),
    qMC('En "El gol fue anotado por el delantero", ¿quién realiza la acción?', ['El gol','El delantero','El balón','No se sabe'], 1, 'El complemento agente "por el delantero" indica quién ejecutó la acción.'),
  ],

  // ===== M40: Verbos totales =====
  [
    qMC('¿Cuál es la forma correcta en "Ojalá que ellos ___ (venir)"?', ['Vienen','Vengan','Vinieron','Vendrán'], 1, '"Ojalá que" exige presente de subjuntivo: "vengan".'),
    qTF('"Si yo fuera rico, viajaría por el mundo" contiene subjuntivo y condicional.', true, '"Fuera" = imperfecto subjuntivo; "viajaría" = condicional simple.'),
    qMC('¿Qué tipo de verbo es "nevar" respecto a su conjugación?', ['Regular','Irregular','Defectivo','Pronominal'], 2, '"Nevar" es defectivo: solo se conjuga en tercera persona del singular.'),
    qMC('¿Cuál es el imperativo negativo de "decir" (tú)?', ['No dice','No digas','No decías','No dijiste'], 1, 'El imperativo negativo usa subjuntivo: "no digas".'),
    qTF('En "Se alquila habitación", el verbo es impersonal.', false, 'Es pasiva refleja si "habitación" es el sujeto.'),
    qMC('Conjuga "saber" en pretérito, primera persona:', ['Sabí','Supe','Sabía','Sé'], 1, '"Supe" es el pretérito irregular de saber.'),
    qTF('"Cantara" y "cantase" son intercambiables en la mayoría de contextos.', true, 'Ambas son correctas para imperfecto de subjuntivo. La forma -ra es más común en América.'),
    qMC('¿Qué tiempo verbal es "hubieras comido"?', ['Presente de subjuntivo','Pretérito pluscuamperfecto de subjuntivo','Condicional compuesto','Futuro perfecto'], 1, 'Hubiera/hubiese + participio = pluscuamperfecto de subjuntivo.'),
    qTF('En "Me arrepiento de haberlo dicho", hay una perífrasis de infinitivo compuesto.', true, '"Haber + participio" en infinitivo compuesto.'),
    qMC('¿Cuál está en antepresente de indicativo?', ['Comía','He comido','Había comido','Comeré'], 1, '"He comido" es pretérito perfecto compuesto (antepresente).'),
    qTF('"Sentarse" es un verbo reflexivo que también puede ser recíproco.', false, '"Sentarse" es reflexivo. Para ser recíproco se necesitaría acción mutua.'),
    qMC('¿Qué modo verbal expresa "Es necesario que..."?', ['Indicativo','Subjuntivo','Imperativo','Condicional'], 1, 'Expresiones impersonales de necesidad rigen subjuntivo.'),
  ],

  // ===== M41: Yo, tú, él... =====
  [
    qMC('¿Qué función tienen los pronombres personales?', ['Calificar al sustantivo','Sustituir a las personas gramaticales','Unir oraciones','Describir objetos'], 1, 'Los pronombres personales sustituyen al sujeto o participantes del discurso.'),
    qTF('Los pronombres de primera persona son "yo" y "nosotros/as".', true, 'Primera persona: quien habla. Segunda: a quien se habla. Tercera: de quien se habla.'),
    qMC('¿Cuál es el pronombre de tercera persona del singular?', ['Yo','Tú','Él / Ella','Nosotros'], 2, 'Tercera persona singular: él, ella. Plural: ellos, ellas.'),
    qTF('"Usted" es formal y "tú" es informal en la mayoría de países.', true, '"Usted" denota respeto. "Tú" es cercano. En algunos países se usa "vos".'),
    qMC('¿Cuál es el plural de "yo"?', ['Tú','Vosotros','Nosotros/nosotras','Ellos'], 2, 'El plural de "yo" es "nosotros" (masc.) o "nosotras" (fem.).'),
    qMC('¿Qué pronombre personal es femenino plural?', ['Nosotros','Vosotros','Ellas','Ustedes'], 2, '"Ellas" es tercera persona femenino plural. "Nosotras" también.'),
    qTF('En México casi no se usa "vosotros"; en su lugar se dice "ustedes".', true, 'En el español de México, "ustedes" reemplaza a "vosotros".'),
    qMC('¿Qué pronombre usarías para dirigirte a tu maestro con respeto?', ['Tú','Usted','Vos','Él'], 1, '"Usted" se usa para mostrar respeto hacia figuras de autoridad.'),
    qTF('"Ello" es un pronombre personal neutro para cosas abstractas.', true, 'Ejemplo: "Ello no me preocupa." Se refiere a una situación o idea.'),
    qMC('¿Cuál NO es un pronombre personal?', ['Yo','Tú','Mío','Él'], 2, '"Mío" es pronombre posesivo, no personal.'),
    qTF('Los pronombres átonos son: me, te, se, lo, la, le, nos, os, los, las, les.', true, 'Son átonos porque no llevan acento y se apoyan en el verbo.'),
    qMC('Completa: "___ (forma respetuosa) es muy amable."', ['Tú','Usted','Vos','Él'], 1, '"Usted" es la forma de cortesía para segunda persona del singular.'),
  ],

  // ===== M42: ¡Es mío! =====
  [
    qMC('¿Cuál es la diferencia entre "mi" y "mío"?', ['Son iguales','"Mi" es adjetivo; "mío" es pronombre','"Mío" es más formal','No hay diferencia'], 1, '"Mi casa" (adjetivo). "Esa casa es mía" (pronombre).'),
    qTF('"Suyo" puede referirse a él, ella, ellos, ellas, usted o ustedes.', true, 'Es ambiguo: "su libro" puede significar de varias personas.'),
    qMC('¿Cuál es el posesivo correcto en "Esa mochila es ___" (de mí)?', ['mí','mía','mío','mi'], 1, '"Mía" concuerda en femenino singular con "mochila".'),
    qTF('Los posesivos concuerdan en género y número con la cosa poseída.', true, 'En "mi libro" concuerda con "libro"; en "mis libros" con "libros".'),
    qMC('¿Cuál es el posesivo para "de nosotros" en "Es ___ casa"?', ['su','nuestra','vuestra','suya'], 1, '"Nuestra" concuerda con "casa" (femenino singular).'),
    qMC('Transforma a pronombre posesivo: "mi perro" →', ['el mío','lo mío','mí perro','perro mío'], 0, '"El mío" reemplaza a "mi perro".'),
    qTF('"Vuestro" se usa principalmente en España.', true, 'Es el posesivo de segunda persona del plural (vosotros).'),
    qMC('¿Cuál es el pronombre posesivo femenino singular de "tú"?', ['Tuyo','Tuya','Tuyas','Tuyos'], 1, '"Tuya" concuerda en femenino singular con el objeto poseído.'),
    qTF('En "Los libros son nuestros", "nuestros" es un adjetivo posesivo.', false, 'Es pronombre porque sustituye al sustantivo. Como adjetivo sería "nuestros libros".'),
    qMC('¿Qué oración usa correctamente el posesivo?', ['El carro es mío','El carro es mía','El carro es mí','El carro es mi'], 0, '"Mío" concuerda en masculino singular con "carro".'),
    qTF('La forma apocopada de los posesivos se usa solo antes del sustantivo.', true, 'Apócope: "mi", "tu", "su". Se usan antepuestos: mi casa, tu perro.'),
    qMC('Completa: "Esa responsabilidad es ___ (de ustedes)".', ['suya','tuya','nuestra','vuestra'], 0, '"Suya" concuerda con "responsabilidad" (femenino singular).'),
  ],

  // ===== M43: Lo, la, le... =====
  [
    qMC('¿Cuál es el pronombre de OD para "el libro"?', ['Le','Lo','Se','Les'], 1, '"Lo" sustituye a OD masculino singular: "Leo el libro → Lo leo".'),
    qTF('"La" es pronombre de objeto directo femenino singular.', true, '"Veo la película → La veo".'),
    qMC('¿Cuál es el pronombre de OI para tercera persona?', ['Lo','La','Le / Les','Se'], 2, '"Le" es OI singular: "Le di el regalo". "Les" es plural.'),
    qTF('Cuando se combinan "le" y "lo", "le" se convierte en "se".', true, '"Se lo di" porque "le" + "lo" = "se lo".'),
    qMC('Sustituye el CD: "Compré las manzanas."', ['Las compré','Les compré','Los compré','Se compré'], 0, '"Las" sustituye a "las manzanas" (femenino plural).'),
    qMC('¿Cómo se sustituye "Les di el mensaje a los alumnos"?', ['Les lo di','Se lo di','Les los di','Lo les di'], 1, '"Les" pasa a "se" ante "lo": "Se lo di".'),
    qTF('El laísmo (usar "la" como OI) es correcto en español estándar.', false, 'La RAE considera el laísmo incorrecto. El OI correcto es "le".'),
    qMC('¿Qué pronombre reemplaza a "a María" en "Llamé a María"?', ['Le','La','Lo','Se'], 1, '"La llamé" (OD). Si fuera "Le hablé" sería OI.'),
    qTF('"Me", "te", "nos", "os" pueden ser OD u OI.', true, 'Son iguales: "Me vio" (OD), "Me dio" (OI). El contexto aclara.'),
    qMC('Corrige: "Díselo a ellos."', ['Está bien','Dileslo','Díselos','Dilelo'], 0, 'Correcto: "di" (imperativo) + "se" (OI) + "lo" (OD).'),
    qTF('Con infinitivo, el pronombre puede ir pegado al final.', true, '"Voy a comprarlo" o "Lo voy a comprar". Ambas son correctas.'),
    qMC('Identifica el OI en: "Te escribí una carta."', ['Te','Escribí','Una','Carta'], 0, '"Te" es OI (a ti). "Una carta" es el OD.'),
  ],

  // ===== M44: Este, ese, aquel =====
  [
    qMC('¿Cuándo los demostrativos llevan tilde?', ['Siempre','Cuando hay ambigüedad','Nunca desde 2010','Solo en plural'], 2, 'La RAE eliminó la obligatoriedad de la tilde en 2010. Solo se recomienda si hay ambigüedad.'),
    qTF('"Eso" es un pronombre demostrativo neutro.', true, '"Eso", "esto" y "aquello" son formas neutras.'),
    qMC('¿Qué demostrativo indica cercanía al hablante?', ['Ese','Aquel','Este','Eso'], 2, '"Este" indica proximidad. "Ese" distancia media. "Aquel" lejanía.'),
    qTF('"Aquel" señala algo lejano para hablante y oyente.', true, 'Distancia máxima: aquel libro (allá lejos).'),
    qMC('¿Cuál es el demostrativo neutro para distancia media?', ['Esto','Eso','Aquello','Ello'], 1, '"Esto" (cerca), "eso" (media), "aquello" (lejos).'),
    qMC('Sustituye: "El coche de allí es caro."', ['Este es caro','Ese es caro','Aquel es caro','Eso es caro'], 2, '"De allí" indica lejanía, por eso "aquel".'),
    qTF('"Esto", "eso", "aquello" no tienen plural.', true, 'Solo las formas con género tienen plural. Las neutras son invariables.'),
    qMC('¿Cuál es un adjetivo demostrativo?', ['Aquello','Eso','Aquella (en "aquella casa")','Esto'], 2, '"Aquella casa" usa "aquella" como adjetivo. Los otros son pronombres.'),
    qTF('"Ese" y "esa" pueden usarse despectivamente.', true, '"Ese tipo" puede tener connotación peyorativa según tono.'),
    qMC('Completa: "___ lápiz que tienes en la mano es azul."', ['Este','Ese','Aquel','Esto'], 1, '"Ese" porque el lápiz está cerca del oyente.'),
    qTF('La tilde diacrítica en demostrativos se considera superflua en la mayoría de casos.', true, 'Según Ortografía 2010, la tilde es opcional salvo ambigüedad.'),
    qMC('¿Cuál es el demostrativo femenino plural de lejanía?', ['Esas','Aquellas','Estas','Esos'], 1, '"Aquellas" es femenino plural de lejanía.'),
  ],

  // ===== M45: A, ante, bajo, con... =====
  [
    qMC('¿Cuál es la función de las preposiciones?', ['Conjugar verbos','Relacionar palabras indicando dependencia','Calificar sustantivos','Sustituir nombres'], 1, 'Las preposiciones son nexos que relacionan palabras: "libro de papel".'),
    qTF('Las preposiciones actuales del español son 23.', true, 'A, ante, bajo, cabe, con, contra, de, desde, durante, en, entre, hacia, hasta, mediante, para, por, según, sin, so, sobre, tras, versus y vía.'),
    qMC('¿Qué preposición indica destino o dirección?', ['Con','De','Hacia','Sin'], 2, '"Hacia" indica dirección. "A" también indica destino.'),
    qTF('"Cabe" es una preposición de uso muy frecuente en español actual.', false, '"Cabe" (junto a) está en desuso.'),
    qMC('¿Cuál preposición indica compañía?', ['Sin','Con','Por','Según'], 1, '"Con" indica compañía: "Fui con mi hermano".'),
    qMC('Completa: "El libro está ___ la mesa."', ['sobre','sin','durante','mediante'], 0, '"Sobre" indica posición encima: "sobre la mesa".'),
    qTF('"Durante" indica tiempo y "mediante" indica medio.', true, '"Durante la clase" (tiempo). "Mediante este método" (medio).'),
    qMC('¿Qué preposición indica carencia?', ['Con','Sin','Por','Tras'], 1, '"Sin" expresa falta: "Café sin azúcar".'),
    qTF('"Según" significa "de acuerdo con".', true, '"Según el profesor" = "De acuerdo con el profesor".'),
    qMC('¿Cuál NO es una preposición?', ['Contra','Pero','Bajo','Desde'], 1, '"Pero" es conjunción, no preposición.'),
    qTF('Las locuciones preposicionales funcionan como preposición.', true, 'Ej: "a pesar de", "junto a", "alrededor de".'),
    qMC('¿Qué preposición en "El regalo es ___ ti"?', ['por','para','a','con'], 1, '"Para" indica destinatario: "El regalo es para ti".'),
  ],

  // ===== M46: Y, o, pero, porque... =====
  [
    qMC('¿Qué son las conjunciones?', ['Palabras que describen acciones','Palabras que unen oraciones o elementos similares','Sinónimos de los adverbios','Sustantivos especiales'], 1, 'Las conjunciones son nexos que unen palabras u oraciones: "y", "o", "pero".'),
    qTF('"Y" es una conjunción copulativa que une elementos.', true, 'La conjunción "y" suma elementos: "Juan y María". Ante "i" cambia a "e".'),
    qMC('¿Qué tipo de conjunción es "pero"?', ['Copulativa','Disyuntiva','Adversativa','Causal'], 2, '"Pero" es adversativa porque opone o contrasta ideas: "Quiero ir, pero no puedo".'),
    qTF('"O" es una conjunción disyuntiva que indica opción.', true, '"Café o té" indica alternativa. Ante "o" cambia a "u".'),
    qMC('¿Qué conjunción usarías para unir ideas opuestas?', ['Y','O','Pero o sino','Porque'], 2, '"Pero" y "sino" son adversativas. "Sino" se usa tras negación: "No es azul, sino verde".'),
    qMC('¿Cuál es una conjunción copulativa?', ['Pero','Ni','O','Aunque'], 1, '"Ni" es copulativa negativa: "No come ni bebe". Equivale a "y no".'),
    qTF('"Porque" es una conjunción causal.', true, '"Porque" explica la causa: "Estudio porque quiero aprender".'),
    qMC('¿Para qué sirve la conjunción "sino"?', ['Para sumar elementos','Para corregir o contrastar una negación','Para dar opciones','Para indicar tiempo'], 1, '"Sino" corrige tras negación: "No es gato, sino perro". Distinto de "si no" (condicional).'),
    qTF('"Aunque" es una conjunción concesiva.', true, 'Introduce una objeción: "Aunque llueva, iré". Expresa concesión.'),
    qMC('¿Qué conjunción indica finalidad?', ['Porque','Para que','Aunque','O'], 1, '"Para que" expresa finalidad: "Estudio para que me vaya bien". Rige subjuntivo.'),
    qTF('"Sin embargo" es una conjunción adversativa.', false, '"Sin embargo" es una locución adverbial o conector, no una conjunción pura.'),
    qMC('Completa: "No solo estudia, ___ también trabaja."', ['pero','sino que','aunque','porque'], 1, '"No solo... sino que también..." es una estructura correlativa de contraste.'),
  ],

  // ===== M47: Pronombres relativos =====
  [
    qMC('¿Cuál es la función de los pronombres relativos?', ['Preguntar algo','Referirse a un antecedente mencionado antes','Negar acciones','Indicar posesión'], 1, 'Los relativos retoman un antecedente: "El libro QUE leí".'),
    qTF('"Que" es el pronombre relativo más común en español.', true, '"El coche que compré". Puede referirse a personas o cosas.'),
    qMC('¿Cuándo se usa "quien" en lugar de "que"?', ['Siempre es intercambiable','Solo para personas y tras preposición','Solo para objetos','Nunca se usa'], 1, '"Quien" se refiere a personas: "La persona a quien llamé". "Que" es más general.'),
    qTF('"Cual" se usa principalmente con artículo y en contextos formales.', true, '"El motivo por el cual renunció" = contexto formal.'),
    qMC('¿Cuál es el pronombre relativo posesivo?', ['Que','Cual','Cuyo/a/os/as','Quien'], 2, '"Cuyo" indica posesión y concuerda con lo poseído: "El niño cuyo libro perdí".'),
    qMC('¿Qué pronombre relativo usarías en: "La casa en ___ vivo es azul"?', ['que','la que o la cual','quien','cuyo'], 1, 'Tras preposición y con antecedente femenino, se usa "la que" o "la cual".'),
    qTF('"Donde" puede funcionar como relativo de lugar.', true, '"La ciudad donde nací". Sustituye a "en la que".'),
    qMC('¿Cuál usa correctamente "cuyo"?', ['La casa cuyas ventanas son grandes','La casa quien ventanas son grandes','La casa que ventanas son grandes','La casa cual ventanas son grandes'], 0, '"Cuyas" concuerda con "ventanas" (femenino plural) y expresa posesión.'),
    qTF('Los pronombres relativos nunca llevan tilde.', false, 'Los interrogativos y exclamativos sí llevan tilde: ¿Qué quieres? vs El libro que leí.'),
    qMC('¿Qué tipo de oración introduce "que" en "Espero que vengas"?', ['Relativa','Sustantiva (conjunción, no relativo)','Adjetiva','Adverbial'], 1, 'En este caso "que" funciona como conjunción subordinante, no como relativo.'),
    qTF('"El cual" y "la cual" concuerdan en género y número con el antecedente.', true, '"Los libros, los cuales leí". Varían según el antecedente.'),
    qMC('Señala el relativo en: "El chico que conociste es mi primo."', ['El','que','conociste','primo'], 1, '"Que" es el pronombre relativo que se refiere a "el chico".'),
  ],

  // ===== M48: Pronombres interrogativos =====
  [
    qMC('¿Qué función tienen los pronombres interrogativos?', ['Unir oraciones','Formular preguntas directas o indirectas','Describir sustantivos','Negar acciones'], 1, 'Los interrogativos preguntan por información: ¿Qué?, ¿Quién?, ¿Cuándo?'),
    qTF('Los pronombres interrogativos siempre llevan tilde.', true, '¿Qué?, ¿Quién?, ¿Cuál?, ¿Cuánto? llevan tilde diacrítica para diferenciarse de los relativos.'),
    qMC('¿Cuál es el interrogativo para preguntar por personas?', ['Qué','Cuál','Quién','Cuánto'], 2, '"Quién" pregunta por personas: "¿Quién llamó?".'),
    qTF('"Cuánto" varía en género y número: cuánto/cuánta/cuántos/cuántas.', true, 'Concuerda con el sustantivo: "¿Cuántos libros tienes?"'),
    qMC('¿Qué interrogativo usarías para preguntar por el modo?', ['Dónde','Cuándo','Cómo','Por qué'], 2, '"Cómo" pregunta por la manera: "¿Cómo llegaste?".'),
    qMC('¿Cuál es la diferencia entre "por qué" y "porque"?', ['Son iguales','"Por qué" pregunta; "porque" responde','Uno lleva tilde','No hay diferencia'], 1, '"¿Por qué?" (interrogativo). "Porque..." (causal, respuesta).'),
    qTF('Las preguntas indirectas también llevan tilde en el interrogativo.', true, '"No sé qué quieres". La tilde se mantiene aunque no haya signos ¿?.'),
    qMC('¿Cuál NO es un pronombre interrogativo?', ['Qué','Quién','Que (sin tilde)','Cuál'], 2, '"Que" sin tilde es relativo o conjunción. Los interrogativos llevan tilde.'),
    qTF('"Dónde" con tilde se usa en preguntas: "¿Dónde vives?"', true, '"Dónde" con tilde es interrogativo. "Donde" sin tilde es relativo de lugar.'),
    qMC('Completa: "No entiendo ___ no vino."', ['porque','por qué','porqué','por que'], 1, '"Por qué" es interrogativo indirecto: "No entiendo por qué razón no vino".'),
    qTF('"Cuál" se usa para elegir entre opciones limitadas.', true, '"¿Cuál prefieres?" implica elegir entre opciones conocidas.'),
    qMC('¿Qué pregunta está bien escrita?', ['¿Que quieres?','¿Qué quieres?','Que quieres?','¿Qué quieres'], 1, 'El interrogativo "qué" lleva tilde.'),
  ],

  // ===== M49: Pronombres indefinidos =====
  [
    qMC('¿Qué expresan los pronombres indefinidos?', ['Cantidad exacta','Cantidad o identidad imprecisa','Posesión concreta','Ubicación exacta'], 1, 'Los indefinidos señalan algo sin precisar: alguien, algo, nadie, ninguno.'),
    qTF('"Alguien" es un pronombre indefinido que se refiere a personas.', true, '"Alguien llamó" no especifica quién. Es invariable.'),
    qMC('¿Cuál es el indefinido negativo para "algo"?', ['Nada','Nadie','Ninguno','Nunca'], 0, '"Nada" es el negativo de "algo": "No tengo nada". "Nadie" es el de "alguien".'),
    qTF('"Todos", "muchos" y "pocos" son pronombres indefinidos variables.', true, 'Varían en género y número: todos/todas, muchos/muchas, pocos/pocas.'),
    qMC('¿Cuál usa correctamente un indefinido?', ['Alguno vendrá','Alguna vendrá','Alguno vendrá','Ambas pueden ser correctas'], 3, '"Alguno vendrá" o "Alguna vendrá" según el género del referente.'),
    qMC('¿Qué significa "ninguno"?', ['Todos','Ni uno solo','Muchos','Algunos'], 1, '"Ninguno" es la negación total: "No vino ninguno" (cero personas).'),
    qTF('"Cualquiera" es un pronombre indefinido.', true, '"Cualquiera puede participar". Se apocopa ante sustantivo: "cualquier persona".'),
    qMC('¿Cuál es la diferencia entre "algo" y "nada"?', ['Son sinónimos','"Algo" es afirmativo; "nada" es negativo','"Nada" es más formal','No hay diferencia'], 1, '"Tengo algo" (afirmativo). "No tengo nada" (negativo).'),
    qTF('"Bastante" puede ser pronombre indefinido, adjetivo o adverbio.', true, 'Como pronombre: "Bastantes vinieron". Como adverbio: "Es bastante grande".'),
    qMC('Completa: "___ sabe la respuesta." (impersonal)', ['Alguien','Nadie','Algo','Ninguno'], 0, '"Alguien" indica una persona no especificada que conoce la respuesta.'),
    qTF('"Demasiado" como pronombre indefinido significa "más de lo necesario".', true, '"Comí demasiado" indica exceso. Varía: demasiada, demasiados, demasiadas.'),
    qMC('¿Cuál es un indefinido invariable?', ['Muchos','Alguien','Pocos','Varios'], 1, '"Alguien" no cambia. "Muchos", "pocos" y "varios" varían en género y número.'),
  ],

  // ===== M50: Repaso de pronombres y nexos =====
  [
    qMC('En "Me lo dijo", ¿qué tipo de pronombres hay?', ['Posesivos','OI (me) + OD (lo)','Demostrativos','Indefinidos'], 1, '"Me" es OI (a mí), "lo" es OD (la cosa dicha).'),
    qTF('Los pronombres sustituyen al sustantivo para evitar repeticiones.', true, 'En lugar de "María compró el libro de María" → "María compró SU libro".'),
    qMC('¿Qué tipo de palabra es "que" en "El libro que leí"?', ['Conjunción','Pronombre relativo','Preposición','Adverbio'], 1, 'Es pronombre relativo porque retoma a "el libro".'),
    qTF('"Con" y "sin" son conjunciones.', false, 'Son preposiciones. Las conjunciones unen oraciones o elementos: y, o, pero.'),
    qMC('¿Cuál de estas palabras es una preposición?', ['Pero','Y','Hacia','Que'], 2, '"Hacia" es preposición (indica dirección). Las otras son conjunciones o relativo.'),
    qMC('Identifica el pronombre posesivo: "El mío es mejor."', ['El','mío','es','mejor'], 1, '"Mío" es pronombre posesivo. Sustituye a "mi [cosa]".'),
    qTF('"Se" puede ser pronombre reflexivo, recíproco o parte de pasiva refleja.', true, 'Reflexivo: "Él se lava". Recíproco: "Se abrazan". Pasiva: "Se venden casas".'),
    qMC('¿Qué función tiene "porque" en "No fui porque estaba enfermo"?', ['Preposición','Conjunción causal','Adverbio','Pronombre'], 1, '"Porque" introduce la causa: explica por qué no fue.'),
    qTF('Los pronombres interrogativos siempre van entre signos de interrogación.', false, 'También aparecen en interrogativas indirectas: "No sé qué pasó" (sin signos).'),
    qMC('¿Cuál es correcto?', ['No tengo nada que hacer','No tengo algo que hacer','No tengo nadie que hacer','Todas son correctas'], 0, '"Nada" es el indefinido negativo apropiado tras "no".'),
    qTF('Las preposiciones unen el sustantivo con otros elementos de la oración.', true, 'Relacionan palabras: "casa DE madera", "voy A casa", "está SOBRE la mesa".'),
    qMC('En "El estudiante cuyas notas son excelentes", ¿qué función tiene "cuyas"?', ['Artículo','Pronombre relativo posesivo','Conjunción','Adverbio'], 1, '"Cuyas" es relativo posesivo, concuerda con "notas".'),
  ],

  // ===== M51: ¿Quién hace qué? =====
  [
    qMC('¿Qué es el sujeto de una oración?', ['La acción realizada','La persona, animal o cosa que realiza la acción','El complemento del verbo','El adverbio'], 1, 'El sujeto es quien realiza o padece la acción del verbo.'),
    qTF('En "Los niños juegan en el parque", el sujeto es "Los niños".', true, 'Responde a ¿quiénes juegan? → Los niños.'),
    qMC('¿Cómo se identifica el sujeto en una oración?', ['Buscando la primera palabra','Preguntando ¿quién? o ¿quiénes? al verbo','Buscando la palabra más larga','Siempre es la última palabra'], 1, 'La pregunta ¿quién + verbo? identifica al sujeto: "Los pájaros cantan" → ¿Quiénes cantan?'),
    qTF('El sujeto siempre está al inicio de la oración.', false, 'El sujeto puede estar al inicio, en medio o al final: "Ayer llegó mi hermano".'),
    qMC('¿Cuál es el sujeto en "Llegó tarde el autobús"?', ['Llegó','Tarde','El autobús','No tiene sujeto'], 2, '"El autobús" es el sujeto (pospuesto al verbo). ¿Quién llegó? El autobús.'),
    qMC('¿Qué tipo de sujeto es el que no aparece explícito?', ['Sujeto compuesto','Sujeto tácito o elíptico','Sujeto expreso','Sujeto pasivo'], 1, 'En "Comí pizza", el sujeto es tácito: "yo". Se deduce por la desinencia verbal.'),
    qTF('El núcleo del sujeto siempre es un verbo.', false, 'El núcleo del sujeto es un sustantivo o pronombre: "La CASA azul".'),
    qMC('¿Cuál de estas oraciones tiene sujeto tácito?', ['María estudia','Estudiamos todos los días','Los perros ladran','El sol brilla'], 1, '"Estudiamos" tiene sujeto tácito "nosotros". Las otras tienen sujeto expreso.'),
    qTF('Un sujeto compuesto tiene más de un núcleo.', true, '"Juan y María" (dos núcleos). También: "El perro y el gato".'),
    qMC('Señala el sujeto en: "A mi hermana le gusta el chocolate."', ['A mi hermana','le','gusta','el chocolate'], 3, '"El chocolate" es el sujeto (¿qué gusta?). "A mi hermana" es OI.'),
    qTF('En las oraciones impersonales no hay sujeto.', true, '"Llueve", "Hay comida", "Hace frío". Son impersonales, carecen de sujeto.'),
    qMC('¿Cuál es el núcleo del sujeto en "La casa grande de madera"?', ['La','casa','grande','madera'], 1, '"Casa" es el núcleo (sustantivo principal). Las otras palabras lo modifican.'),
  ],

  // ===== M52: El núcleo del sujeto =====
  [
    qMC('¿Qué es el núcleo del sujeto?', ['El verbo principal','La palabra más importante del sujeto','El artículo','El adjetivo'], 1, 'El núcleo del sujeto es el sustantivo o pronombre central del que habla la oración.'),
    qTF('En "El perro marrón", el núcleo es "perro".', true, '"Perro" es el sustantivo. "El" y "marrón" son modificadores.'),
    qMC('¿Qué función tiene el modificador directo?', ['Sustituir al núcleo','Acompañar al núcleo sin preposición','Ser el verbo','Ser el predicado'], 1, 'Los modificadores directos (artículos, adjetivos) van pegados al núcleo: "EL perro MARRÓN".'),
    qTF('El modificador indirecto se une al núcleo con preposición.', true, '"La casa DE madera". "De madera" es modificador indirecto mediante preposición.'),
    qMC('¿Cuál es el modificador indirecto en "El libro de historia es grueso"?', ['El libro','de historia','es grueso','El'], 1, '"De historia" se une al núcleo "libro" con la preposición "de".'),
    qMC('¿Qué es la aposición?', ['Un verbo auxiliar','Un sustantivo o frase que explica al núcleo','El predicado','El artículo'], 1, 'En "Madrid, capital de España", "capital de España" es aposición explicativa.'),
    qTF('Los adjetivos que acompañan al núcleo se llaman modificadores directos.', true, 'Artículos y adjetivos: "Las HERMOSAS flores". Modifican directamente.'),
    qMC('¿Cuál NO es un modificador del sujeto?', ['Artículo','Adjetivo','Complemento preposicional','Verbo principal'], 3, 'El verbo principal es núcleo del predicado, no modificador del sujeto.'),
    qTF('El núcleo del sujeto puede ser un pronombre.', true, '"ELLA canta". "Ella" es pronombre y núcleo del sujeto.'),
    qMC('En "Los alumnos de quinto grado", ¿cuál es el núcleo?', ['Los','alumnos','de','quinto grado'], 1, '"Alumnos" es el núcleo. "Los" es MD, "de quinto grado" es MI.'),
    qTF('Una aposición puede ir entre comas.', true, '"Mi hermano, el médico, llegó". "El médico" es aposición explicativa entre comas.'),
    qMC('Identifica el MD y MI en "La ventana del salón":', ['MD: La, MI: del salón','MD: ventana, MI: La','MD: del salón, MI: La','No hay modificadores'], 0, '"La" es MD (artículo), "del salón" es MI (complemento con preposición).'),
  ],

  // ===== M53: El predicado y sus tipos =====
  [
    qMC('¿Qué es el predicado de una oración?', ['El sujeto','Lo que se dice del sujeto, incluyendo el verbo','Solo el verbo','El artículo'], 1, 'El predicado es todo lo que se afirma del sujeto. Contiene al verbo como núcleo.'),
    qTF('En "María come manzanas", el predicado es "come manzanas".', true, 'Todo lo que no es sujeto: "come manzanas" es el predicado.'),
    qMC('¿Cuál es el núcleo del predicado?', ['El artículo','El verbo conjugado','El sustantivo','El adjetivo'], 1, 'El verbo conjugado es el núcleo del predicado. Es la palabra más importante.'),
    qTF('El predicado verbal tiene como núcleo un verbo que no es copulativo.', true, 'Predicado verbal (acción): "El niño CORRE". Predicado nominal (cualidad): "El niño ES alto".'),
    qMC('¿Qué tipo de predicado es "La casa es grande"?', ['Predicado verbal','Predicado nominal','Predicado adverbial','No tiene predicado'], 1, 'Predicado nominal: verbo copulativo (ser/estar) + atributo (grande).'),
    qMC('¿Cuál es el predicado nominal?', ['Los pájaros vuelan alto','Mi hermana es médica','Compré fruta','Llovió toda la noche'], 1, '"Es médica" = verbo copulativo + atributo. Los otros son predicados verbales.'),
    qTF('Los verbos copulativos son principalmente ser, estar y parecer.', true, 'Unen el sujeto con una cualidad: "Él es alto", "Ella parece feliz".'),
    qMC('¿Qué función tiene el objeto directo en el predicado?', ['Indicar la causa','Recibir directamente la acción del verbo','Modificar al sujeto','Unir oraciones'], 1, 'El OD recibe la acción: "Comí UNA MANZANA" (¿qué comí?).'),
    qTF('Los complementos circunstanciales indican lugar, tiempo, modo, causa...', true, 'Añaden información al verbo: "Estudio EN MI CASA" (lugar), "Voy MAÑANA" (tiempo).'),
    qMC('Señala el OD en: "María leyó el libro."', ['María','leyó','el libro','no hay OD'], 2, '¿Qué leyó? → el libro (objeto directo).'),
    qTF('En un predicado nominal, el atributo concuerda con el sujeto.', true, '"Las flores son HERMOSAS". "Hermosas" concuerda en femenino plural con "flores".'),
    qMC('¿Cuál tiene predicado verbal?', ['El cielo es azul','Los niños jugaron toda la tarde','Estoy feliz','La respuesta parece correcta'], 1, '"Jugaron" es verbo de acción (no copulativo). Los demás tienen predicado nominal.'),
  ],

  // ===== M54: Oraciones simples =====
  [
    qMC('¿Qué caracteriza a una oración simple?', ['Tiene varios verbos','Tiene un solo verbo conjugado','No tiene sujeto','Siempre es corta'], 1, 'Oración simple = un solo verbo conjugado: "El niño corre".'),
    qTF('"María lee un libro" es una oración simple.', true, 'Un solo verbo conjugado (lee). Puede ser más larga pero con un solo verbo.'),
    qMC('¿Cómo se clasifica "Llueve mucho"?', ['Oración simple con sujeto tácito','Oración impersonal','Oración compuesta','Oración pasiva'], 1, '"Llueve" es impersonal: no tiene sujeto. Es una oración simple sin sujeto.'),
    qTF('Las oraciones simples pueden ser muy largas.', true, '"La niña de vestido azul compró un helado de chocolate en la tienda" sigue siendo simple (un verbo).'),
    qMC('¿Cuál es una oración simple?', ['Fui y volví','Canté toda la noche','Quiero que vengas','Si llueve, no salgo'], 1, '"Canté" = un solo verbo conjugado. Las otras tienen más de un verbo.'),
    qMC('¿Qué tipo de oración simple es "La puerta fue cerrada"?', ['Activa','Pasiva','Impersonal','Reflexiva'], 1, '"Fue cerrada" es voz pasiva. El sujeto recibe la acción.'),
    qTF('Una oración simple bimembre tiene sujeto y predicado.', true, 'Sujeto + Predicado = bimembre: "El perro ladra". Unimembre: "Hay fuego".'),
    qMC('¿Cuál es unimembre?', ['Los niños duermen','Tengo hambre','¡Fuego! o Llueve','María cocina'], 2, 'Las unimembres no se dividen en sujeto/predicado: "Llueve", "Auxilio".'),
    qTF('Las oraciones simples reflexivas llevan pronombre: me, te, se, nos.', true, '"Yo me baño". La acción del verbo recae sobre el propio sujeto.'),
    qMC('¿Qué tipo es "Se buscan empleados"?', ['Activa transitiva','Pasiva refleja','Impersonal','Reflexiva'], 1, '"Se buscan" es pasiva refleja. Equivale a "empleados son buscados".'),
    qTF('Una oración simple puede tener sujeto compuesto.', true, '"Juan y María bailan" es simple con sujeto compuesto (un solo verbo).'),
    qMC('Señala la oración simple pasiva:', ['Comí pizza','La canción fue compuesta por Luis','Estudio música','Cantan los pájaros'], 1, '"Fue compuesta" = voz pasiva. Las otras son activas.'),
  ],

  // ===== M55: Oraciones compuestas =====
  [
    qMC('¿Qué caracteriza a una oración compuesta?', ['Es muy corta','Tiene dos o más verbos conjugados','No tiene predicado','Siempre tiene coma'], 1, 'Oración compuesta = más de un verbo conjugado: "Quiero QUE VENGAS".'),
    qTF('"Llegué y me fui" es una oración compuesta.', true, 'Dos verbos conjugados: llegué, fui. Unidas por "y".'),
    qMC('¿Cuáles son los tres tipos de oraciones compuestas?', ['Simples, complejas y mixtas','Yuxtapuestas, coordinadas y subordinadas','Activas, pasivas y reflexivas','Bimembres, unimembres e impersonales'], 1, 'Yuxtapuestas: sin nexo. Coordinadas: unidas por conjunción. Subordinadas: una depende de otra.'),
    qTF('Las oraciones yuxtapuestas se unen sin conjunción, solo con signos de puntuación.', true, '"Llegué, vi, vencí." Sin nexos, solo comas.'),
    qMC('¿Qué tipo de compuesta es "Estudio porque quiero aprender"?', ['Yuxtapuesta','Coordinada','Subordinada causal','Coordinada adversativa'], 2, '"Porque" introduce subordinada causal. La oración "quiero aprender" depende de la principal.'),
    qMC('¿Cuál es una oración coordinada?', ['Espero que llegues','Si puedo, iré','Compro pan y bebo leche','El auto que compré'], 2, '"Y" une dos oraciones independientes: compro pan + bebo leche.'),
    qTF('En "No fui al cine, sino que me quedé en casa", hay coordinación adversativa.', true, '"Sino que" contrasta dos proposiciones independientes.'),
    qMC('¿Qué nexo introduce una subordinada sustantiva?', ['Y, o','Que, si','Pero, sino','Cuando, donde'], 1, '"Espero QUE vengas". "No sé SI vendrá". Funcionan como sustantivo.'),
    qTF('Las subordinadas adverbiales indican circunstancias: tiempo, lugar, modo.', true, '"Te llamo CUANDO llegue". "Voy DONDE tú digas". "Hazlo COMO quieras".'),
    qMC('Señala la compuesta por subordinación:', ['Comí y dormí','Fui al parque pero llovió','Creo que tienes razón','Corrí, salté, nadé'], 2, '"Que tienes razón" está subordinada a "creo". Depende de la principal.'),
    qTF('Una oración compuesta puede tener más de 2 proposiciones.', true, '"Llegué a casa, preparé la cena, comí y me acosté" tiene 4 proposiciones.'),
    qMC('¿Cuál es yuxtapuesta?', ['Si estudias, apruebas','Estudia mucho: el examen es difícil','Aunque llueva, saldré','Porque quiero'], 1, '"Estudia mucho: el examen es difícil". Los dos puntos unen sin conjunción.'),
  ],

  // ===== M56: Yuxtaposición y coordinación =====
  [
    qMC('¿Qué caracteriza a las oraciones yuxtapuestas?', ['Usan conjunciones','Se unen sin nexos, solo con puntuación','Dependen de otra oración','Son impersonales'], 1, 'Yuxtaposición: "Llegó tarde; se quedó dormido." Sin conjunción, pausa con signo.'),
    qTF('"Llegué a casa, me duché y cené" tiene yuxtaposición y coordinación.', true, 'Las comas yuxtaponen; "y" coordina. Es mixta.'),
    qMC('¿Cuál de estas es una coordinada copulativa?', ['Vino pero se fue','Estudio y trabajo','O vienes o te quedas','Llueve; no saldré'], 1, '"Y" une sumando. También "e", "ni". La primera es adversativa, la tercera disyuntiva.'),
    qTF('Las coordinadas disyuntivas presentan opciones con "o" u "u".', true, '"¿Vienes o te quedas?" También "o bien", "ora...ora" (uso literario).'),
    qMC('¿Qué conjunción usarías para una coordinada adversativa?', ['Y','Ni','Pero, sino, mas','O'], 2, 'Adversativas contrastan: "Pero", "sino", "mas", "sin embargo" (aunque es conector).'),
    qMC('¿Cuál es una coordinada distributiva?', ['Unos cantan, otros bailan','Canto y bailo','Canto o bailo','Canto pero no bailo'], 0, 'Distributivas: "unos...otros", "bien...bien", "ya...ya". Alternan acciones.'),
    qTF('Las oraciones yuxtapuestas se separan por coma, punto y coma o dos puntos.', true, '"Hace frío; mejor me quedo." Cada una es independiente pero relacionadas.'),
    qMC('¿Qué signo indica yuxtaposición con causa-efecto?', ['La coma','Los dos puntos','El punto','Las comillas'], 1, '"No pude dormir: hacía mucho ruido." Los dos punto indican explicación.'),
    qTF('En "Llegaron, saludaron, se sentaron", las oraciones son yuxtapuestas.', true, 'Sin nexos, solo comas. Cada proposición es independiente.'),
    qMC('Identifica el tipo de compuesta: "Ni come ni deja comer."', ['Yuxtapuesta','Coordinada copulativa negativa','Subordinada','Disyuntiva'], 1, '"Ni...ni" coordina negativamente. Equivale a "y no".'),
    qTF('La conjunción "sino" se usa tras una negación en la primera proposición.', true, '"No es gato, sino perro." "Sino que" cuando la segunda tiene verbo conjugado.'),
    qMC('¿Qué tipo es "Hace calor, así que iré a la playa"?', ['Yuxtapuesta','Coordinada consecutiva','Subordinada','Copulativa'], 1, '"Así que" introduce consecuencia. También "luego", "por tanto", "por consiguiente".'),
  ],

  // ===== M57: Subordinación básica =====
  [
    qMC('¿Qué es una oración subordinada?', ['Una oración que manda sobre otra','Una oración que depende sintácticamente de otra principal','Una oración sin verbo','Una oración muy corta'], 1, 'La subordinada depende de la principal: "Quiero [que vengas]".'),
    qTF('En "Espero que llegues temprano", la subordinada es "que llegues temprano".', true, '"Espero" es la principal; "que llegues" es la subordinada sustantiva.'),
    qMC('¿Qué tipo de subordinada es "La casa que compré es azul"?', ['Sustantiva','Adjetiva o de relativo','Adverbial','Yuxtapuesta'], 1, '"Que compré" modifica al sustantivo "casa". Es subordinada adjetiva.'),
    qTF('Las subordinadas adjetivas van introducidas por pronombres relativos.', true, 'Que, quien, cual, cuyo: "El libro QUE leí". "La persona A QUIEN vi".'),
    qMC('¿Qué función tiene la subordinada en "Me alegra que estés bien"?', ['Objeto directo','Sujeto','Complemento circunstancial','Atributo'], 1, '"Que estés bien" funciona como sujeto de "alegra". Equivale a "Eso me alegra".'),
    qMC('¿Cuál NO es una subordinada?', ['Dijo que vendría','El coche que elegí','Fui al cine y cené pizza','Cuando llegues, avísame'], 2, '"Fui... y cené..." es coordinada copulativa, no subordinada.'),
    qTF('Las subordinadas sustantivas pueden funcionar como sujeto u objeto.', true, 'Sujeto: "Me gusta QUE CANTES". OD: "Quiero QUE VENGAS".'),
    qMC('¿Qué nexo introduce una subordinada sustantiva interrogativa?', ['Que','Si','Cuando','Quién, qué, cómo con tilde'], 3, '"No sé QUIÉN vino". "Pregúntale QUÉ quiere". Son interrogativas indirectas.'),
    qTF('"Cuyo" introduce subordinadas adjetivas con valor posesivo.', true, '"El alumno cuyas notas son excelentes". "Cuyas" = "de quien".'),
    qMC('Identifica la subordinada adverbial: "Te espero donde siempre."', ['Te espero','donde siempre','Te espero donde','No hay subordinada'], 1, '"Donde siempre" indica lugar. Es subordinada adverbial de lugar.'),
    qTF('Las subordinadas adverbiales pueden ser de tiempo, lugar, modo, causa...', true, 'Tiempo: "cuando llegue". Lugar: "donde quieras". Modo: "como puedas".'),
    qMC('¿Qué tipo es "Aunque llueva, saldré"?', ['Adjetiva','Sustantiva','Adverbial concesiva','Coordinada'], 2, '"Aunque llueva" expresa concesión (objeción). Es adverbial concesiva.'),
  ],

  // ===== M58: Tipos de oraciones =====
  [
    qMC('¿Cómo se clasifican las oraciones según la actitud del hablante?', ['Por su longitud','En enunciativas, interrogativas, exclamativas, imperativas, desiderativas y dubitativas','Solo en simples y compuestas','Por su número de verbos'], 1, 'La actitud determina: afirmar, preguntar, exclamar, ordenar, desear o dudar.'),
    qTF('"Hoy es lunes" es una oración enunciativa afirmativa.', true, 'Las enunciativas informan objetivamente, afirmando o negando.'),
    qMC('¿Qué tipo de oración es "Ojalá no llueva"?', ['Enunciativa','Desiderativa','Interrogativa','Exclamativa'], 1, '"Ojalá" expresa deseo. Las desiderativas manifiestan anhelo.'),
    qTF('Las oraciones dubitativas expresan duda o posibilidad.', true, '"Quizás venga", "Tal vez sea verdad". Usan adverbios de duda.'),
    qMC('¿Cuál es una oración exhortativa o imperativa?', ['Hace calor','¿Vienes?','Ven aquí ahora mismo','Quizás sí'], 2, '"Ven aquí" expresa orden, mandato o ruego. Es imperativa.'),
    qMC('¿Qué tipo de oración es "¿A qué hora sale el tren?"?', ['Enunciativa','Interrogativa directa','Desiderativa','Exclamativa'], 1, 'Pregunta directamente. Lleva signos de interrogación.'),
    qTF('"¡Qué bonito día!" es una oración exclamativa.', true, 'Expresa emoción intensa: sorpresa, alegría, enojo. Lleva signos ¡!.'),
    qMC('¿Cuál es una interrogativa indirecta?', ['¿Cómo te llamas?','No sé cómo te llamas','¡Cómo te llamas!','Llámame luego'], 1, 'No tiene signos ¿? pero contiene un interrogativo con tilde. Depende de otra oración.'),
    qTF('Las enunciativas negativas incluyen el adverbio "no".', true, '"No quiero ir". "Jamás lo haré". También pueden usar otros negativos.'),
    qMC('¿Qué expresa una oración desiderativa?', ['Un hecho comprobado','Un deseo o anhelo','Una orden','Una pregunta'], 1, 'Deseo: "Que te vaya bien", "Ojalá apruebes". Llevan subjuntivo frecuentemente.'),
    qTF('"Probablemente viaje mañana" es una oración dubitativa.', true, '"Probablemente" expresa duda. Rige subjuntivo en futuro potencial.'),
    qMC('Señala la oración enunciativa negativa:', ['Quizás no venga','No tengo dinero','¡No puede ser!','¿No vienes?'], 1, '"No tengo dinero" es enunciativa negativa. Las otras son dubitativa, exclamativa e interrogativa.'),
  ],

  // ===== M59: Oraciones enunciativas =====
  [
    qMC('¿Cuál es la característica principal de las oraciones enunciativas?', ['Expresan duda','Informan un hecho de manera objetiva','Dan órdenes','Expresan deseo'], 1, 'Las enunciativas transmiten información afirmativa o negativamente sin expresar emoción.'),
    qTF('"La capital de México es CDMX" es una oración enunciativa.', true, 'Informa un hecho de manera objetiva. Es enunciativa afirmativa.'),
    qMC('¿Qué modo verbal predomina en las enunciativas?', ['Subjuntivo','Imperativo','Indicativo','Condicional solamente'], 2, 'El indicativo es el modo de la realidad, propio de las afirmaciones objetivas.'),
    qTF('Las enunciativas negativas se construyen con "no" ante el verbo.', true, '"No asistió a clases". Si el verbo es compuesto: entre auxiliar y participio.'),
    qMC('¿Cuál es enunciativa?', ['Ojalá que vengas','Ven acá','Tal vez llueva','El río Nilo está en África'], 3, 'Informa un hecho geográfico. Las otras son desiderativa, imperativa y dubitativa.'),
    qMC('¿Dónde va "no" en "Le he dicho la verdad"?', ['No le dicho he','No le he dicho','Le no he dicho','Le he dicho no'], 1, '"No le he dicho la verdad". El adverbio va antes del verbo conjugado (auxiliar).'),
    qTF('Las enunciativas pueden ser bimembres o unimembres.', true, 'Bimembre: "El sol brilla." Unimembre: "Amaneció." Ambas son enunciativas.'),
    qMC('¿Qué recurso NO usan las enunciativas?', ['Verbos en indicativo','Datos objetivos','Signos de exclamación','Sujeto y predicado'], 2, 'Las enunciativas no usan signos de exclamación (son propias de las exclamativas).'),
    qTF('Las noticias periodísticas se componen principalmente de enunciativas.', true, 'El periodismo informativo usa enunciativas para comunicar hechos con objetividad.'),
    qMC('Transforma a negativa: "Siempre llego temprano."', ['Nunca llego temprano','No llego siempre temprano','No llego nunca temprano','No siempre llego temprano'], 0, '"Nunca" niega la frecuencia. "No siempre" implicaría que a veces sí llegas temprano.'),
    qTF('Una oración enunciativa puede ser pasiva.', true, '"La ley fue aprobada." Pasiva pero sigue siendo enunciativa (informa un hecho).'),
    qMC('Identifica la enunciativa negativa:', ['¿No te gusta?','No es posible','¡No lo creo!','Quizás no sea así'], 1, '"No es posible" niega sin emoción. Las otras son interrogativa, exclamativa y dubitativa.'),
  ],

  // ===== M60: Interrogativas y exclamativas =====
  [
    qMC('¿Qué caracteriza a las oraciones interrogativas directas?', ['No llevan signos','Llevan signos ¿? y formulan pregunta','Siempre son negativas','Llevan signos ¡!'], 1, 'Las interrogativas directas preguntan y llevan signos de interrogación.'),
    qTF('"¿Qué quieres?" es una interrogativa directa parcial.', true, 'Parcial: usa pronombre interrogativo. Total: "¿Vienes?" (respuesta sí/no).'),
    qMC('¿Cuál es una interrogativa total?', ['¿Quién llamó?','¿Te gusta el helado?','¿Dónde vives?','¿Cómo estás?'], 1, 'Total = respuesta sí/no. Las otras son parciales (piden información concreta).'),
    qTF('Las exclamativas siempre expresan emoción intensa.', true, 'Sorpresa, alegría, enojo, admiración: "¡Qué susto!", "¡Maravilloso!".'),
    qMC('¿Qué signos usa una oración exclamativa?', ['Solo ¿?','¡! (apertura y cierre)','Solo comas','Puntos suspensivos'], 1, 'Las exclamativas requieren signos de apertura ¡ y cierre !.'),
    qMC('¿Cuál es una interrogativa indirecta?', ['Quiero saber qué pasó','¿Qué pasó?','¡Qué pasó!','Ninguna'], 0, 'Interrogativa indirecta: sin signos ¿?, con pronombre interrogativo con tilde.'),
    qTF('"¡Qué caro!" y "¡Qué bonito!" son exclamativas.', true, 'Ambas usan "qué" exclamativo y llevan signos ¡!.'),
    qMC('¿Qué diferencia hay entre "¿Cómo estás?" y "Me preguntó cómo estás"?', ['Son iguales','La primera es directa; la segunda es indirecta','La segunda es incorrecta','Ninguna'], 1, 'Directa: signos ¿?. Indirecta: sin signos, subordinada a "me preguntó".'),
    qTF('Las exclamativas pueden expresar sorpresa negativa.', true, '"¡Qué horror!", "¡No puede ser!". Expresan emoción aunque sea desagradable.'),
    qMC('¿Cuál está correctamente puntuada?', ['¿Cómo estás?','¡Cómo estás!','Ambas son correctas con distintos sentidos','Ninguna'], 2, 'Ambas correctas: interrogación (pregunta) o exclamación (énfasis).'),
    qTF('En "¿Cómo te atreves?", la pregunta tiene valor de reproche.', true, 'Las interrogativas retóricas no esperan respuesta; expresan queja o afirmación encubierta.'),
    qMC('Señala la exclamativa: "___ hermosa canción interpretaron."', ['¿Qué','¡Qué','Cuál','Cómo'], 1, '"¡Qué hermosa canción!" es exclamativa, usa "qué" con emoción.'),
  ],

  // ===== M61: Palabras parecidas =====
  [
    qMC('¿Qué son los sinónimos?', ['Palabras con significados opuestos','Palabras con significado igual o muy parecido','Palabras que se escriben igual','Palabras sin significado'], 1, 'Sinónimos comparten significado: feliz/alegre, rápido/veloz.'),
    qTF('"Hermoso" y "bello" son sinónimos.', true, 'Ambos significan "que tiene belleza". Son sinónimos totales.'),
    qMC('¿Cuál es un sinónimo de "contento"?', ['Triste','Feliz o alegre','Enojado','Cansado'], 1, '"Contento" = feliz, alegre. Son sinónimos intercambiables en la mayoría de contextos.'),
    qTF('Los sinónimos parciales solo coinciden en algunos contextos.', true, '"Pesado" puede ser sinónimo de "aburrido" o de "de mucho peso" según contexto.'),
    qMC('¿Cuál NO es sinónimo de "grande"?', ['Enorme','Amplio','Pequeño','Voluminoso'], 2, '"Pequeño" es antónimo (opuesto). Los otros son sinónimos de grande.'),
    qMC('¿Qué par de palabras son sinónimos?', ['Subir/bajar','Empezar/comenzar','Blanco/negro','Día/noche'], 1, '"Empezar" y "comenzar" significan lo mismo. Los otros son antónimos.'),
    qTF('Usar sinónimos enriquece la expresión y evita repeticiones.', true, 'En lugar de "bonito, bonito, bonito" usar "hermoso, bello, precioso".'),
    qMC('¿Cuál es sinónimo de "veloz"?', ['Lento','Rápido','Pesado','Suave'], 1, '"Veloz" = rápido. Ambos indican gran velocidad.'),
    qTF('"Inteligente" y "listo" son siempre sinónimos intercambiables.', false, 'En algunas regiones "listo" significa "preparado", no necesariamente "inteligente". Son sinónimos parciales.'),
    qMC('Sinónimo de "camino":', ['Carretera','Sendero o vía','Edificio','Ventana'], 1, '"Sendero" y "vía" son rutas, caminos. Son sinónimos.'),
    qTF('Los diccionarios de sinónimos ayudan a encontrar palabras alternativas.', true, 'Son herramientas útiles para escribir con variedad léxica.'),
    qMC('¿Qué beneficio aporta el uso de sinónimos?', ['Hace el texto más repetitivo','Enriquece el vocabulario y la expresión','Confunde al lector','No tiene beneficio'], 1, 'Amplía el léxico, evita monotonía y hace la comunicación más precisa y elegante.'),
  ],

  // ===== M62: Significados opuestos =====
  [
    qMC('¿Qué son los antónimos?', ['Palabras con significado similar','Palabras con significado opuesto o contrario','Palabras que suenan igual','Palabras inventadas'], 1, 'Antónimos = significados contrarios: alto/bajo, día/noche, frío/calor.'),
    qTF('"Blanco" y "negro" son antónimos.', true, 'Representan los extremos opuestos del espectro de color.'),
    qMC('¿Cuál es el antónimo de "alegre"?', ['Contento','Feliz','Triste','Jovial'], 2, '"Triste" es lo opuesto a alegre. Los otros son sinónimos.'),
    qTF('Existen antónimos graduales, complementarios y recíprocos.', true, 'Gradual: frío/tibio/caliente. Complementario: vivo/muerto. Recíproco: comprar/vender.'),
    qMC('¿Qué tipo de antónimo es "comprar/vender"?', ['Gradual','Complementario','Recíproco','Absoluto'], 2, 'Son recíprocos: uno implica al otro. No puede haber comprador sin vendedor.'),
    qMC('¿Cuál NO es antónimo de "subir"?', ['Bajar','Descender','Ascender','Caer'], 2, '"Ascender" es SINÓNIMO de subir. Los otros son antónimos.'),
    qTF('"Vivo" y "muerto" son antónimos complementarios.', true, 'No hay término medio: o estás vivo o muerto. No admite grados.'),
    qMC('¿Cuál es antónimo de "valiente"?', ['Audaz','Cobarde','Fuerte','Osado'], 1, '"Cobarde" es lo opuesto a valiente. "Audaz" y "osado" son sinónimos.'),
    qTF('Los antónimos graduales admiten términos intermedios.', true, 'Grande/pequeño admiten "mediano". Caliente/frío admiten "tibio".'),
    qMC('Antónimo de "luz":', ['Claridad','Oscuridad','Brillo','Sol'], 1, '"Oscuridad" es la ausencia de luz. Las otras son sinónimos o relacionados.'),
    qTF('Conocer antónimos ayuda a comprender mejor el significado de las palabras.', true, 'Definir por oposición: "generoso = no egoísta". Facilita la comprensión.'),
    qMC('¿Cuál par contiene un antónimo?', ['Hermoso/bello','Rico/adinerado','Rápido/lento','Inteligente/listo'], 2, '"Rápido" y "lento" son opuestos. Los otros son sinónimos.'),
  ],

  // ===== M63: Suenan igual =====
  [
    qMC('¿Qué son los homónimos?', ['Palabras opuestas','Palabras que se escriben o pronuncian igual pero tienen distinto significado','Palabras parecidas','Sinónimos perfectos'], 1, 'Homónimos comparten forma: "banco" (asiento) / "banco" (entidad financiera).'),
    qTF('"Vino" (bebida) y "vino" (verbo venir) son homónimos.', true, 'Se escriben y pronuncian igual pero significan cosas distintas.'),
    qMC('¿Cuál par son homófonos?', ['Casa/caza','Grande/pequeño','Feliz/alegre','Mesa/silla'], 0, '"Casa" y "caza" suenan igual pero se escriben distinto. Son homófonos.'),
    qTF('Los homógrafos se escriben igual; los homófonos solo suenan igual.', true, 'Homógrafo: "banco/banco". Homófono: "hola/ola", "casa/caza".'),
    qMC('¿Qué significa "homófono"', ['Mismo sonido','Misma escritura','Significado opuesto','Misma raíz'], 0, 'Homófono = mismo sonido. Se pronuncian igual pero pueden escribirse diferente.'),
    qMC('¿Cuál par son homógrafos?', ['Boté/voté','Copa (trofeo) / copa (de árbol)','Cabo/cavo','Hola/ola'], 1, '"Copa" se escribe y pronuncia igual. Los otros son homófonos (distinta escritura).'),
    qTF('"Hola" y "ola" son homófonos.', true, 'Suenan idéntico. "Hola" = saludo, "ola" = onda del mar.'),
    qMC('¿Qué par de palabras son homónimas?', ['Llama (animal) / llama (fuego)','Alto/bajo','Bonito/feo','Cantar/bailar'], 0, '"Llama" tiene dos significados distintos con idéntica forma.'),
    qTF('El contexto determina el significado de los homónimos.', true, '"La llama ilumina" vs "La llama pace en el altiplano". Contexto aclara.'),
    qMC('¿Cuál NO es un homófono?', ['Tuvo/tubo','Vello/bello','Feliz/alegre','Botar/votar'], 2, '"Feliz/alegre" son sinónimos. Los otros son homófonos (mismo sonido).'),
    qTF('Los homónimos pueden causar ambigüedad si no hay suficiente contexto.', true, '"Vi un gato con un gato" requiere contexto para saber si es animal o herramienta.'),
    qMC('Identifica el par homógrafo:', ['Vaca/baca','Río (verbo) / río (agua)','Savia/sabia','Cien/sien'], 1, '"Río" se escribe igual con dos significados. Los otros son homófonos.'),
  ],

  // ===== M64: Casi iguales =====
  [
    qMC('¿Qué son los parónimos?', ['Palabras idénticas','Palabras parecidas en forma o sonido pero con distinto significado','Sinónimos','Antónimos'], 1, 'Parónimos: "actitud/aptitud", "absorber/absolver". Casi iguales pero diferentes.'),
    qTF('"Actitud" y "aptitud" son parónimos con distinto significado.', true, 'Actitud = postura/comportamiento. Aptitud = capacidad/habilidad.'),
    qMC('¿Cuál es la diferencia entre "espirar" y "expirar"?', ['Son lo mismo','Espirar = respirar; expirar = morir o terminar','Espirar es formal','No hay diferencia'], 1, 'Parónimos peligrosos: se parecen pero uno es respirar y otro es fallecer.'),
    qTF('"Absorber" (empapar) y "absolver" (perdonar) son parónimos.', true, 'Una letra cambia todo el significado. Cuidado al escribir.'),
    qMC('¿Cuál par son parónimos?', ['Casa/caza','Afecto/efecto','Mesa/silla','Alto/bajo'], 1, '"Afecto" (cariño) y "efecto" (resultado) son parónimos. Las otras son homófonos o sin relación.'),
    qMC('¿Qué significa "infligir" vs "infringir"?', ['Son iguales','Infligir = causar daño; infringir = violar una ley','Son antónimos','Uno es culto'], 1, 'Parónimos: infligir (daño), infringir (ley). Distinción importante.'),
    qTF('"Prever" (anticipar) y "proveer" (suministrar) son parónimos.', true, 'Verbos con forma parecida pero significado totalmente distinto.'),
    qMC('¿Cuál está bien usado? "El medicamento ___ la sangre."', ['absorbió','absolvió','absorvío','ninguno'], 0, '"Absorbió" = empapó, capturó. El medicamento se absorbe en la sangre.'),
    qTF('Los parónimos son una fuente común de errores ortográficos.', true, 'Se confunden fácilmente. Es importante conocer la diferencia.'),
    qMC('¿Qué par es correcto?', ['Especia (condimento) / especie (tipo)','Especia/especia (mismo significado)','Especia/especio','Ninguno'], 0, 'Parónimos: especia (de cocina) / especie (clasificación biológica).'),
    qTF('"Abertura" (agujero) y "apertura" (inauguración) son parónimos.', true, 'Abertura = orificio/hendidura. Apertura = acto de abrir/inaugurar.'),
    qMC('¿Qué palabra significa "capacidad para hacer algo"?', ['Actitud','Aptitud','Altitud','Amplitud'], 1, '"Aptitud" es capacidad. "Actitud" es disposición/comportamiento.'),
  ],

  // ===== M65: Sinónimos en contexto =====
  [
    qMC('¿Por qué es importante elegir el sinónimo según el contexto?', ['No importa','Un sinónimo puede funcionar en un contexto pero no en otro','Siempre funciona','No hay contexto'], 1, '"Económico": significa "barato" o "relativo a la economía". Contexto decide.'),
    qTF('"Banco" puede ser asiento, entidad financiera o conjunto de peces.', true, 'El contexto determina cuál de los tres significados aplica.'),
    qMC('¿Cuál reemplaza mejor "viejo" en "un auto viejo"?', ['Anciano','Antiguo o desgastado','Nuevo','Reciente'], 1, '"Anciano" es para personas. Para objetos: "antiguo" o "desgastado". El contexto importa.'),
    qTF('Usar sinónimos incorrectos puede cambiar el sentido de la frase.', true, '"El niño es grave" vs "El niño es serio". "Grave" = enfermo; "serio" = solemne.'),
    qMC('¿Cuál es el sinónimo adecuado de "mirar" en "mira la pintura"?', ['Observar o contemplar','Vigilar (implica control)','Ojear (superficial)','Todas funcionan'], 0, '"Mira la pintura" implica observar/contemplar. "Vigilar" sería para seguridad.'),
    qMC('¿Qué sinónimo NO encaja con "comida"?', ['Alimento','Manjar','Vianda','Lectura'], 3, '"Lectura" no es sinónimo de comida. Los otros sí lo son.'),
    qTF('Los sinónimos parciales requieren más atención al contexto.', true, '"Pesado": puede significar "de mucho peso", "aburrido" o "molesto".'),
    qMC('Sinónimo contextual de "cabeza" en "cabeza de la empresa"', ['Cráneo','Director o líder','Inicio','Parte superior'], 1, '"Cabeza" aquí significa líder/director, no parte del cuerpo.'),
    qTF('En textos formales se prefieren sinónimos más cultos o precisos.', true, '"Comenzar" es más formal que "empezar" en algunos contextos académicos.'),
    qMC('¿Cuál es sinónimo de "decir" en un texto formal?', ['Hablar','Manifestar o expresar','Platicar','Charlar'], 1, '"Manifestar" y "expresar" son más formales que "decir" en escritos académicos.'),
    qTF('La sinonimia contextual depende del registro (formal/informal).', true, '"Chido" = "excelente" en México. En otros países no se entendería igual.'),
    qMC('Selecciona el sinónimo adecuado: "El ___ (resultado) del experimento."', ['Desenlace','Efecto','Fruto','Todas pueden funcionar según contexto'], 3, 'En ciencia: "resultado" o "efecto". "Fruto" es metafórico y "desenlace" es narrativo.'),
  ],

  // ===== M66: Antónimos en acción =====
  [
    qMC('¿Cómo se usan los antónimos para enriquecer un texto?', ['Repitiendo lo mismo','Creando contraste y énfasis mediante oposición','Nunca se usan','Solo en poesía'], 1, 'Los antónimos crean contraste: "Era el MEJOR de los tiempos, era el PEOR" (Dickens).'),
    qTF('Usar antónimos ayuda a definir conceptos por oposición.', true, '"La JUSTICIA es lo contrario de la INJUSTICIA." Facilita definiciones.'),
    qMC('¿Qué recurso literario se basa en antónimos?', ['La metáfora','La antítesis','La personificación','La rima'], 1, 'Antítesis = contraposición de ideas: "Amor y odio", "Vida y muerte".'),
    qTF('"Más vale tarde que nunca" contiene antónimos implícitos.', true, '"Tarde" vs "nunca" contrastan tiempos: preferible tarde que jamás.'),
    qMC('¿Cuál par son antónimos correctos?', ['Generoso/avaro','Grande/enorme','Feliz/alegre','Veloz/rápido'], 0, 'Generoso (da mucho) vs avaro (no comparte). Los otros son sinónimos.'),
    qMC('Transforma usando antónimo: "Era un día alegre" a su opuesto.', ['Era un día divertido','Era un día triste','Era un día cualquiera','Era un día largo'], 1, '"Triste" es el antónimo directo de "alegre".'),
    qTF('Los antónimos pueden ser de negación con prefijos: in-, des-, a-.', true, 'Feliz/infeliz, orden/desorden, típico/atípico. El prefijo niega el significado.'),
    qMC('¿Cuál es el antónimo de "posible"?', ['Probable','Imposible','Factible','Realizable'], 1, '"Imposible" niega con el prefijo im-. Los otros son sinónimos.'),
    qTF('No todas las palabras tienen antónimo exacto.', true, '"Mesa", "lápiz", "azul" no tienen antónimo claro. No todo admite oposición.'),
    qMC('Antónimo de "construir":', ['Edificar','Destruir','Crear','Levantar'], 1, '"Destruir" con prefijo des-. Los otros son sinónimos de construir.'),
    qTF('En poesía, el contraste con antónimos crea impacto emocional.', true, '"Fuego y hielo", "luz y sombra". Los opuestos evocan tensión dramática.'),
    qMC('¿Qué antónimo se forma con prefijo? "___natural."', ['Anti','Sobre','Extra','Súper'], 0, '"Antinatural" = contrario a lo natural. El prefijo anti- indica oposición.'),
  ],

  // ===== M67: Homónimos y homófonos =====
  [
    qMC('¿Por qué es importante distinguir homófonos al escribir?', ['No importa','Para evitar errores ortográficos graves','Solo en poesía','Nunca se usan'], 1, 'Confundir "tuvo" y "tubo" o "hola" y "ola" son errores ortográficos comunes.'),
    qTF('"Vello" (pelo corporal) y "bello" (hermoso) son homófonos.', true, 'Suenan igual, se escriben diferente. Significados totalmente distintos.'),
    qMC('Completa: "El ___ causó un derrame." (cilindro)', ['tuvo','tubo','tuvo','tubó'], 1, '"Tubo" = cilindro. "Tuvo" = verbo tener. Son homófonos.'),
    qTF('"Hay" (verbo haber), "ahí" (lugar) y "ay" (exclamación) son homófonos.', true, 'Tres palabras distintas que suenan igual. Contexto las diferencia.'),
    qMC('¿Cuál es correcto? "___ un gato en el jardín."', ['Ahí','Hay','Ay','Ai'], 1, '"Hay" del verbo haber = existencia. "Ahí" es lugar; "ay" es queja.'),
    qMC('¿Qué par usa correctamente los homófonos?', ['La baca del coche / La vaca del coche','La vaca del campo / La baca del coche','Ambas','Ninguna'], 1, '"Vaca" = animal. "Baca" = portaequipajes del coche.'),
    qTF('"Sabia" (persona con sabiduría) y "savia" (líquido de plantas) son homófonos.', true, 'Distinta escritura, mismo sonido. Significados diferentes.'),
    qMC('¿Qué significa "cabo" en "al cabo del tiempo"?', ['Grado militar','Extremo o fin','Cueva','Cuerda'], 1, '"Al cabo de" = al final de. "Cabo suelto" = detalle pendiente.'),
    qTF('"Botar" (arrojar) y "votar" (elegir) son homófonos.', true, 'Se pronuncian igual en la mayoría de regiones. Distinción importante en democracia.'),
    qMC('Selecciona el uso correcto: "Se ___ en las elecciones."', ['botó','votó','botó o votó','ninguno'], 1, '"Votó" = ejerció el voto. "Botó" = tiró algo.'),
    qTF('En contextos escolares, los homófonos son causa frecuente de faltas.', true, 'Especialmente B/V, H/sin H, Y/LL. Requiere práctica y lectura para dominarlos.'),
    qMC('¿Cuál es correcto? "La ___ de la planta es nutritiva."', ['sabia','savia','sabía','savía'], 1, '"Savia" (sin tilde) = líquido vegetal. "Sabia" = mujer con sabiduría.'),
  ],

  // ===== M68: Parónimos engañosos =====
  [
    qMC('¿Cuál es la diferencia entre "accesible" y "asequible"?', ['Son iguales','Accesible = fácil de acceder; asequible = que se puede comprar','Son antónimos','Ninguna'], 1, 'Accesible (llegar/entender) vs asequible (precio alcanzable). Parónimos frecuentes.'),
    qTF('"Adoptar" y "adaptar" son parónimos con significados distintos.', true, 'Adoptar = acoger (un hijo, una idea). Adaptar = ajustar/modificar.'),
    qMC('Completa: "Hay que ___ la casa a las necesidades."', ['adoptar','adaptar','adeptar','ninguno'], 1, '"Adaptar" = modificar/ajustar. "Adoptar" sería acoger/hacer propio.'),
    qTF('"Inerme" (sin armas) e "inerte" (sin vida o movimiento) son parónimos.', true, 'Una letra cambia: inerme (indefenso) / inerte (sin actividad).'),
    qMC('¿Qué significa "perjuicio"?', ['Prejuicio','Daño o detrimento','Ventaja','Opinión previa'], 1, '"Perjuicio" = daño (con j). "Prejuicio" = opinión anticipada (sin conocimiento).'),
    qMC('¿Cuál es correcto? "Los ___ sobre otras culturas son dañinos."', ['perjuicios','prejuicios','perjuicios o prejuicios','ninguno'], 1, '"Prejuicios" = juicios previos sin conocimiento. "Perjuicios" = daños.'),
    qTF('"Abertura" y "apertura" son intercambiables en todos los contextos.', false, 'Abertura = agujero/fisura. Apertura = inauguración/acto de abrir. Distintos.'),
    qMC('Selecciona: "La ___ del nuevo museo fue ayer."', ['abertura','apertura','abertura o apertura','ninguna'], 1, '"Apertura" = inauguración. "Abertura" sería un orificio o grieta.'),
    qTF('"Infligir" y "infringir" se diferencian por una letra.', true, 'Infligir = causar daño/castigo. Infringir = violar ley/norma. Parónimos críticos.'),
    qMC('¿Qué par usa correctamente los parónimos?', ['Infringir la ley','Infligir la ley','Infligir la leí','Ninguno'], 0, '"Infringir la ley" = violarla. "Infligir" se usa con daño/castigo.'),
    qTF('La lectura frecuente ayuda a distinguir parónimos naturalmente.', true, 'Ver las palabras en contexto fortalece la memoria visual y semántica.'),
    qMC('¿Cuál significa "falta de interés"?', ['Apatía (parónimo de empatía)','Empatía','Simpatía','Antipatía'], 0, '"Apatía" = indiferencia. "Empatía" = ponerse en el lugar del otro. Parónimos.'),
  ],

  // ===== M69: Campo semántico =====
  [
    qMC('¿Qué es un campo semántico?', ['Un lugar físico','Un conjunto de palabras relacionadas por su significado','Un tipo de texto','Una figura literaria'], 1, 'Campo semántico: palabras que comparten un tema. "Deportes": fútbol, tenis, natación.'),
    qTF('"Médico", "enfermera", "hospital" pertenecen al campo semántico de la salud.', true, 'Comparten el tema salud/medicina. Son palabras del mismo ámbito.'),
    qMC('¿Cuál pertenece al campo semántico de "escuela"?', ['Estetoscopio','Cuaderno','Bate','Río'], 1, '"Cuaderno" es parte del ámbito escolar. Los otros son de medicina, deportes y naturaleza.'),
    qTF('Un campo semántico puede ser cerrado (días de la semana) o abierto (colores).', true, 'Cerrado = número fijo (7 días). Abierto = ilimitado (infinitos colores o matices).'),
    qMC('¿Qué palabra NO pertenece al campo semántico "familia"?', ['Padre','Primo','Balón','Abuela'], 2, '"Balón" es de deportes. Los otros son miembros de la familia.'),
    qMC('Agrupa por campo semántico: "rojo, azul, verde, ___".', ['Mesa','Amarillo','Libro','Cantar'], 1, 'Son colores. "Amarillo" completa el campo semántico cromático.'),
    qTF('Conocer campos semánticos amplía el vocabulario temático.', true, 'Aprender palabras por grupos temáticos facilita la retención y el uso.'),
    qMC('¿Cuál es el campo semántico de "lluvia, nieve, granizo"?', ['Deportes','Fenómenos meteorológicos','Animales','Comida'], 1, 'Son fenómenos del clima/atmosféricos. Campo semántico meteorológico.'),
    qTF('Los campos semánticos ayudan a organizar diccionarios y enciclopedias.', true, 'Las enciclopedias temáticas agrupan contenidos por campos semánticos.'),
    qMC('Señala la palabra intrusa en el campo "instrumentos musicales":', ['Guitarra','Violín','Martillo','Piano'], 2, '"Martillo" es herramienta. Los otros son instrumentos musicales.'),
    qTF('Una palabra puede pertenecer a varios campos semánticos.', true, '"Batería": puede ser instrumento musical, pila eléctrica o conjunto de artillería.'),
    qMC('¿Cuál es el campo semántico de "juez", "abogado", "fiscal"?', ['Medicina','Derecho/justicia','Deporte','Educación'], 1, 'Son profesiones y roles del ámbito jurídico. Campo semántico legal.'),
  ],

  // ===== M70: Familias léxicas =====
  [
    qMC('¿Qué es una familia léxica?', ['Familia de sangre','Conjunto de palabras que comparten la misma raíz o lexema','Sinónimos','Antónimos'], 1, 'Familia léxica = palabras con misma raíz: pan, panadero, panadería, panecillo.'),
    qTF('"Flor", "florero", "florecer", "floristería" son de la misma familia léxica.', true, 'Comparten la raíz "flor-". Todas derivan de ese lexema.'),
    qMC('¿Cuál NO pertenece a la familia de "mar"?', ['Marino','Marea','Martillo','Marítimo'], 2, '"Martillo" tiene raíz distinta. Los otros derivan de "mar".'),
    qTF('Las familias léxicas se forman por derivación (prefijos y sufijos).', true, 'Flor → florero (-ero), florecer (-ecer), florido (-ido). Misma raíz, distintos afijos.'),
    qMC('¿Qué palabra deriva de "libro"?', ['Libre','Librería','Libertad','Libélula'], 1, '"Librería" deriva de libro (+ -ería). Las otras tienen raíces distintas.'),
    qMC('¿Cuál es la raíz de "zapatería"?', ['Zapa-','Zapat-','Zapate-','Zápa-'], 1, 'Raíz "zapat-" + sufijo -ería. Familia: zapato, zapatero, zapatear.'),
    qTF('Las palabras compuestas también pertenecen a una familia léxica.', true, '"Sacapuntas" pertenece a la familia de "punta" (punta, puntilla, puntiagudo).'),
    qMC('Completa la familia de "sol": solar, soleado, ___.', ['Soledad','Solsticio','Solitario','Sólo'], 1, '"Solsticio" deriva de sol. Los otros tienen raíz distinta (solo/soledad).'),
    qTF('Conocer la raíz ayuda a deducir el significado de palabras nuevas.', true, 'Si sabes que "hidro-" = agua, "hidratar", "hidrografía" cobran sentido.'),
    qMC('¿Cuál es la familia de "pan"?', ['Panadero, panadería, empanada','Pánico, pantalla','Paño, pañuelo','Ninguna'], 0, 'Todas comparten la raíz "pan-". Las otras tienen raíces distintas.'),
    qTF('Las familias léxicas nos muestran la evolución de las palabras.', true, 'Del latín "aqua" vienen: agua, acuático, acuario, aguacero. Misma raíz histórica.'),
    qMC('Palabra que completa la familia "niño": niñez, niñera, ___.', ['Aniñado','Ninguno','Niño (no deriva)','Todas'], 0, '"Aniñado" comparte raíz "niñ-". También: niñear (comportarse como niño).'),
  ],

  // ===== M71: Cuéntame una historia =====
  [
    qMC('¿Cuáles son los elementos fundamentales de un texto narrativo?', ['Tesis y argumentos','Narrador, personajes, tiempo, espacio y trama','Ingredientes y pasos','Datos y estadísticas'], 1, 'Toda narración tiene quién cuenta, quiénes actúan, cuándo, dónde y qué sucede.'),
    qTF('El narrador omnisciente lo sabe todo sobre los personajes.', true, 'Sabe pensamientos, sentimientos, pasado y futuro. Es como un dios de la historia.'),
    qMC('¿Qué tipo de narrador dice "yo fui al mercado"?', ['Omnisciente','Testigo','Protagonista (primera persona)','Externo'], 2, 'Usa "yo" = narrador protagonista. Cuenta su propia historia en primera persona.'),
    qTF('La trama es la secuencia de acontecimientos de una narración.', true, 'Lo que sucede, en orden. Incluye conflicto, clímax y desenlace.'),
    qMC('¿Qué es el clímax en una narración?', ['El inicio','El momento de mayor tensión o giro','El final feliz','El personaje principal'], 1, 'Clímax = punto álgido. Es donde el conflicto alcanza su momento crítico.'),
    qMC('¿Cuál es un subgénero narrativo?', ['El soneto','La novela','La oda','El haikú'], 1, 'La novela es narrativa. Soneto, oda y haikú son géneros líricos (poesía).'),
    qTF('El espacio narrativo puede ser real o fantástico.', true, 'Puede ser un lugar real (París) o inventado (Narnia, Hogwarts, Macondo).'),
    qMC('¿Qué es el antihéroe en una narración?', ['El villano','Un protagonista sin cualidades heroicas tradicionales','El narrador','El personaje secundario'], 1, 'Antihéroe: protagonista común, con defectos, a veces mediocre. Ej: Don Quijote.'),
    qTF('Una narración puede tener varios narradores.', true, 'Novelas epistolares o con múltiples voces narrativas alternando capítulos.'),
    qMC('¿Qué técnica es "in medias res"?', ['Empezar con un diálogo','Comenzar la historia en medio de la acción','Terminar abruptamente','Usar rimas'], 1, 'In medias res = empezar en mitad de los hechos, sin introducción previa.'),
    qTF('El cuento suele tener menos personajes que la novela.', true, 'Por su extensión limitada, el cuento concentra la acción en pocos personajes.'),
    qMC('Lee y clasifica: "Cien años de soledad" de García Márquez es:', ['Un poema épico','Una novela del realismo mágico','Un ensayo','Una obra de teatro'], 1, 'Novela narrativa que mezcla realidad y elementos mágicos. Realismo mágico.'),
  ],

  // ===== M72: Pinta con palabras =====
  [
    qMC('¿Cuál es el propósito de un texto descriptivo?', ['Contar historias','Pintar con palabras: detallar cómo es algo o alguien','Argumentar','Dar instrucciones'], 1, 'La descripción muestra características: color, forma, tamaño, textura, sensaciones.'),
    qTF('En "El cielo estaba nublado y gris", hay descripción subjetiva.', false, 'Es descripción objetiva de un hecho observable. Subjetiva añadiría emoción: "El cielo lloraba".'),
    qMC('¿Qué tipo de descripción incluye emociones y valoraciones?', ['Técnica','Objetiva','Subjetiva o literaria','Científica'], 2, 'Subjetiva: "Su mirada era un océano de tristeza". Incluye sentimientos y metáforas.'),
    qTF('La descripción topográfica detalla lugares o paisajes.', true, 'Describe relieves, vegetación, clima. Propia de guías turísticas y geografía.'),
    qMC('¿Qué es la prosopografía?', ['Descripción de lugares','Descripción física de una persona','Descripción de sentimientos','Descripción de acciones'], 1, 'Prosopografía = rasgos físicos: altura, color de pelo, complexión.'),
    qMC('¿Qué es la etopeya?', ['Descripción física','Descripción del carácter y personalidad','Descripción de un objeto','Descripción científica'], 1, 'Etopeya = rasgos morales/psicológicos: bondadoso, orgulloso, tímido.'),
    qTF('La descripción puede ser estática (sin movimiento) o dinámica (con acción).', true, 'Estática: "El jarrón está sobre la mesa." Dinámica: "Las olas rompían contra las rocas."'),
    qMC('¿Cuál es una descripción subjetiva?', ['La mesa mide 1 metro','El atardecer pintaba el cielo de fuego','El libro tiene 200 páginas','Hace 25 grados'], 1, 'Usa metáfora y carga emocional. Las otras son objetivas.'),
    qTF('Los adjetivos son la herramienta principal de la descripción.', true, 'Calificativos: grande, azul, rugoso, suave. Transmiten las cualidades.'),
    qMC('¿Qué describe el "retrato" literario?', ['Solo el físico','Físico + carácter (prosopografía + etopeya)','Solo la ropa','Solo el entorno'], 1, 'Retrato = descripción completa: aspecto físico y personalidad interior.'),
    qTF('Una buena descripción apela a los cinco sentidos.', true, 'Vista, oído, olfato, gusto y tacto: "El aroma a café recién hecho inundaba la cocina."'),
    qMC('Identifica el tipo de descripción: "Era alto, de ojos verdes y sonrisa cálida."', ['Etopeya','Prosopografía','Retrato','Topografía'], 1, 'Describe rasgos físicos (altura, ojos, sonrisa). Es prosopografía.'),
  ],

  // ===== M73: Convencer con razones =====
  [
    qMC('¿Cuál es la estructura completa de un ensayo argumentativo?', ['Inicio, nudo, desenlace','Introducción, desarrollo de argumentos, contraargumentos y conclusión','Materiales, pasos','Verso y rima'], 1, 'Ensayo: presenta tesis, argumenta, aborda objeciones y concluye.'),
    qTF('En un debate, se debe atacar a la persona, no a sus argumentos.', false, 'Eso es una falacia ad hominem. Se deben refutar los argumentos, no insultar.'),
    qMC('¿Qué es una falacia argumentativa?', ['Un argumento sólido','Un razonamiento que parece válido pero es engañoso','Un dato científico','Una estadística'], 1, 'Falacia = error lógico disfrazado de argumento. Ej: "Todos lo hacen, así que está bien".'),
    qTF('Un buen argumento se apoya en datos, hechos y fuentes verificables.', true, 'La evidencia sólida da peso a los argumentos. Sin datos, es solo una opinión.'),
    qMC('¿Cuál es una falacia de "falso dilema"?', ['Presentar solo dos opciones cuando hay más','Usar datos falsos','Repetir lo mismo','No dar argumentos'], 0, '"O estás conmigo o contra mí" ignora posiciones intermedias o alternativas.'),
    qMC('¿Qué recurso es más persuasivo en un texto argumentativo?', ['Amenazas','Datos estadísticos y evidencias','Insultos','Repetición vacía'], 1, 'Datos y hechos verificables persuaden por lógica. Los insultos restan credibilidad.'),
    qTF('La conclusión debe resumir los argumentos y reafirmar la tesis.', true, 'Cierra el texto recordando lo esencial y dejando claro el punto de vista.'),
    qMC('¿Qué es la refutación en un texto argumentativo?', ['Aceptar todo','Responder y desmentir los contraargumentos','Repetir la tesis','No incluir objeciones'], 1, 'Refutar = demostrar por qué los argumentos contrarios son débiles o incorrectos.'),
    qTF('Un artículo de opinión combina información con argumentación personal.', true, 'El columnista informa sobre un tema y expone su punto de vista argumentado.'),
    qMC('Identifica la estructura argumentativa correcta:', ['Problema y solución','Tesis → argumento 1 → argumento 2 → contraargumento → refutación → conclusión','Personajes y trama','Introducción y nudo'], 1, 'Estructura completa de ensayo argumentativo clásico.'),
    qTF('Las emociones no tienen cabida en un texto argumentativo serio.', false, 'La persuasión combina logos (razón), ethos (credibilidad) y pathos (emoción). Las tres son válidas.'),
    qMC('Señala el argumento más sólido: "Debemos reciclar porque..."', ['Es bonito','Lo dice mi amigo','Reduce la contaminación y ahorra recursos naturales','Todos lo hacen'], 2, 'Basado en consecuencias medibles y beneficios ambientales. Es un argumento de causa-efecto.'),
  ],

  // ===== M74: Explicar el mundo =====
  [
    qMC('¿Cuál es la estructura típica de un texto expositivo?', ['Inicio, nudo, desenlace','Introducción, desarrollo (explicación) y conclusión','Tesis y antítesis','Verso y estrofa'], 1, 'Expositivo: presenta tema, lo desarrolla explicando, y sintetiza al final.'),
    qTF('Los textos expositivos incluyen opiniones del autor.', false, 'Deben ser objetivos: explicar, no opinar. La opinión es propia del texto argumentativo.'),
    qMC('¿Qué recurso es típico de un texto expositivo?', ['Diálogos dramáticos','Definiciones, clasificaciones y ejemplos','Rimas y metáforas','Exclamaciones'], 1, 'Define conceptos, clasifica información y ejemplifica para explicar.'),
    qTF('Un libro de texto escolar es un texto expositivo.', true, 'Explica materias de forma estructurada, objetiva y progresiva.'),
    qMC('¿En qué se diferencia un texto expositivo de uno narrativo?', ['Son iguales','El expositivo explica/informa; el narrativo cuenta historias','El expositivo es más corto','No hay diferencia'], 1, 'Expositivo = transmitir conocimiento. Narrativo = relatar hechos con personajes.'),
    qMC('¿Qué técnica expositiva usa comparaciones?', ['Narración','Analogía o comparación','Diálogo','Descripción física'], 1, 'Analogía: "El corazón funciona como una bomba". Compara para explicar.'),
    qTF('Un texto expositivo puede incluir gráficas, diagramas y tablas.', true, 'Los recursos visuales complementan y aclaran la información textual.'),
    qMC('¿Cuál es un texto expositivo?', ['Un cuento de hadas','Una entrada de enciclopedia','Un poema','Una obra de teatro'], 1, 'La enciclopedia expone información. Los otros son textos literarios.'),
    qTF('Las monografías escolares son textos expositivos.', true, 'Investigan y exponen un tema con profundidad, citando fuentes.'),
    qMC('¿Qué conectores son propios del texto expositivo?', ['Había una vez, luego, después','En primer lugar, por otro lado, en conclusión','¡Oh!, ¡Ay!','Colorín colorado'], 1, 'Conectores de orden y explicación organizan la información expositiva.'),
    qTF('La claridad y precisión son esenciales en los textos expositivos.', true, 'Un texto expositivo confuso falla en su propósito de informar y aclarar.'),
    qMC('Señala el propósito de un texto expositivo científico:', ['Entretener','Explicar fenómenos naturales con lenguaje preciso','Crear belleza','Persuadir'], 1, 'La ciencia se comunica mediante textos expositivos: claros, verificables y objetivos.'),
  ],

  // ===== M75: El diálogo =====
  [
    qMC('¿Qué es un diálogo en un texto?', ['Una descripción larga','Intercambio de palabras entre dos o más personajes','Un monólogo interno','Una exposición de datos'], 1, 'Diálogo = conversación entre personajes. Se representa con guiones o comillas.'),
    qTF('En textos narrativos, los diálogos muestran las voces de los personajes.', true, 'Revelan personalidad, hacen avanzar la trama y crean dinamismo.'),
    qMC('¿Qué signo se usa en español para introducir diálogos?', ['Comillas inglesas','Raya o guion largo (—)','Dos puntos','Paréntesis'], 1, 'En español, la raya (—) introduce cada intervención en un diálogo.'),
    qTF('El diálogo en teatro se llama parlamento.', true, 'Los parlamentos son las líneas que cada personaje dice en una obra dramática.'),
    qMC('En un guion teatral, ¿cómo se indica quién habla?', ['No se indica','Con el nombre del personaje antes del parlamento','Con asteriscos','Con comillas'], 1, 'Nombre del personaje seguido de su texto: "JUAN: ¿Vienes a la fiesta?"'),
    qMC('¿Qué es una acotación en un diálogo teatral?', ['Un insulto','Indicación escénica entre paréntesis: (se ríe), (entra)','El título de la obra','El actor principal'], 1, 'Las acotaciones indican acciones, gestos o tono. Van en cursiva o entre paréntesis.'),
    qTF('En narrativa, los diálogos se entrecomillan en algunos estilos editoriales.', true, 'En español es más tradicional usar rayas, pero algunos libros usan comillas.'),
    qMC('¿Cuál usa correctamente la raya de diálogo?', ['—Hola —dijo María','Hola —dijo María—','—Hola— dijo María','Todas'], 0, 'Raya de apertura antes del texto y raya de cierre antes del verbo dicendi.'),
    qTF('Los diálogos hacen la narración más dinámica y visual.', true, '"Show, don\'t tell" (muestra, no cuentes). Diálogos muestran en lugar de describir.'),
    qMC('¿Qué es un monólogo?', ['Diálogo entre varios','Discurso de un solo personaje, a solas o ante otros','Una descripción','Un poema'], 1, 'Monólogo = un personaje habla consigo mismo o con el público. Propio del teatro.'),
    qTF('En una entrevista, las preguntas y respuestas forman un diálogo.', true, 'La entrevista es un género dialógico: intercambio estructurado entre dos.'),
    qMC('Señala el uso correcto: "___¿Vienes?___ preguntó Luis."', ['- -','— —','¿? ¿?','Ninguno'], 1, 'En español: —¿Vienes? —preguntó Luis. La raya enmarca el diálogo.'),
  ],

  // ===== M76: La descripción literaria =====
  [
    qMC('¿Qué diferencia la descripción literaria de la técnica?', ['Son iguales','La literaria busca belleza estética; la técnica busca precisión','La técnica es más larga','No hay diferencia'], 1, 'Literaria = subjetiva con figuras retóricas. Técnica = objetiva con datos exactos.'),
    qTF('En "Sus ojos eran dos luceros", hay una metáfora descriptiva.', true, 'Compara ojos con luceros sin usar "como". Es lenguaje figurado.'),
    qMC('¿Qué figura retórica es "Las perlas de tu boca" para describir dientes?', ['Hipérbole','Metáfora','Personificación','Onomatopeya'], 1, 'Metáfora pura: identifica dientes con perlas sin nexo comparativo.'),
    qTF('La adjetivación múltiple enriquece la descripción literaria.', true, 'Acumular adjetivos precisos: "rostro pálido, anguloso y enigmático".'),
    qMC('¿Qué recurso sensorial usa "El rugido del mar"?', ['Vista','Oído (auditivo)','Gusto','Tacto'], 1, '"Rugido" apela al oído. Las descripciones pueden apelar a los 5 sentidos.'),
    qMC('¿Cuál es una imagen visual en una descripción?', ['El olor a rosas','El suave tacto de la seda','El resplandor dorado del atardecer','El sabor amargo'], 2, '"Resplandor dorado" evoca una imagen visual. Las otras son olfativa, táctil y gustativa.'),
    qTF('La sinestesia mezcla sensaciones de distintos sentidos.', true, '"Color chillón" mezcla vista y oído. "Dulce melodía" mezcla gusto y oído.'),
    qMC('¿Qué es la hipérbole descriptiva?', ['Descripción exacta','Exageración para enfatizar una cualidad','Descripción breve','Descripción técnica'], 1, '"Lloró ríos de lágrimas" es hipérbole. Exagera para crear impacto.'),
    qTF('La descripción literaria puede crear atmósferas emocionales.', true, 'Un escenario oscuro y tormentoso crea tensión. Un jardín florido crea paz.'),
    qMC('¿Qué describe este fragmento? "El viento susurraba entre los pinos."', ['Sonido y movimiento','Solo color','Solo temperatura','Ninguna'], 0, 'Usa personificación ("susurraba") y apela al oído. Crea atmósfera.'),
    qTF('En poesía, la descripción suele ser más condensada y sugerente.', true, 'Un poema puede describir un paisaje en pocas líneas usando imágenes potentes.'),
    qMC('Identifica la figura: "El sol se asomaba tímidamente tras la montaña."', ['Metáfora','Personificación','Hipérbole','Símil'], 1, 'Atribuye timidez (cualidad humana) al sol. Es personificación.'),
  ],

  // ===== M77: Textos periodísticos =====
  [
    qMC('¿Qué caracteriza a una noticia periodística?', ['Expresa opiniones','Responde a qué, quién, cuándo, dónde, por qué y cómo','Usa lenguaje poético','Es ficción'], 1, 'La noticia sigue las 6W: What, Who, When, Where, Why, How. Debe ser objetiva.'),
    qTF('El titular de una noticia resume lo más importante.', true, 'Debe ser claro, atractivo y contener la información esencial.'),
    qMC('¿Qué es la entradilla de una noticia?', ['El último párrafo','El primer párrafo: resume lo esencial de la noticia','El pie de foto','El titular'], 1, 'Lead o entradilla = primer párrafo. Contiene lo más importante de forma condensada.'),
    qTF('La pirámide invertida organiza la información de más a menos importante.', true, 'Propio del periodismo: lo crucial al inicio, detalles después. Si se corta, lo vital queda.'),
    qMC('¿Cuál es un género periodístico de opinión?', ['Noticia','Reportaje','Columna o artículo de opinión','Crónica informativa'], 2, 'La columna expresa el punto de vista del autor. Noticia y reportaje son informativos.'),
    qMC('¿Qué es una crónica periodística?', ['Un poema','Una narración cronológica de un hecho con estilo personal','Un ensayo','Un cuento'], 1, 'Crónica = relato detallado en orden temporal. Combina información con estilo narrativo.'),
    qTF('El reportaje profundiza más que la noticia en un tema.', true, 'Incluye investigación, entrevistas, contexto y análisis. Más extenso que la noticia.'),
    qMC('¿Qué sección del periódico contiene editoriales?', ['Deportes','Opinión','Espectáculos','Clasificados'], 1, 'La sección de opinión incluye editoriales, columnas y cartas al director.'),
    qTF('Las fake news son noticias falsas que se difunden como verdaderas.', true, 'Es importante verificar fuentes y contrastar información antes de compartir.'),
    qMC('¿Qué debe tener una noticia para ser confiable?', ['Opiniones personales','Fuentes verificables y datos contrastados','Chistes','Rumores'], 1, 'Fuentes citadas, datos verificables, imparcialidad. Sin fuentes = rumor, no noticia.'),
    qTF('Las fuentes anónimas siempre son confiables en periodismo.', false, 'Las fuentes anónimas requieren corroboración con otras fuentes. Pueden ser legítimas pero no son prueba.'),
    qMC('Elemento fundamental de toda noticia:', ['Un chiste','El titular','Una moraleja','Un poema'], 1, 'El titular es lo primero que se lee. Debe captar la atención y resumir el tema.'),
  ],

  // ===== M78: Textos publicitarios =====
  [
    qMC('¿Cuál es el objetivo de un texto publicitario?', ['Informar objetivamente','Persuadir para comprar, usar o apoyar algo','Entretener','Enseñar'], 1, 'Publicidad = convencer al receptor. Usa argumentos, imágenes y eslóganes persuasivos.'),
    qTF('Un eslogan es una frase breve y pegadiza que resume un mensaje publicitario.', true, '"Just do it" (Nike), "Porque yo lo valgo" (L\'Oréal). Identifica la marca.'),
    qMC('¿Qué recurso es común en la publicidad?', ['Definiciones técnicas','Lenguaje emocional y persuasivo','Datos científicos puros','Silencio total'], 1, 'Apela a deseos y emociones: felicidad, éxito, pertenencia, seguridad.'),
    qTF('La publicidad engañosa promete beneficios que el producto no ofrece.', true, 'Es ilegal en muchos países. El consumidor tiene derecho a información veraz.'),
    qMC('¿Qué es un anuncio de servicio público?', ['Anuncio de refresco','Campaña que promueve causas sociales sin fines comerciales','Anuncio de autos','Promoción de descuento'], 1, 'Promueve salud, seguridad, educación o conciencia social. Sin ánimo de lucro.'),
    qMC('¿Qué diferencia hay entre publicidad y propaganda?', ['Son lo mismo','Publicidad = fines comerciales; propaganda = difundir ideas políticas/religiosas','La propaganda es más corta','No hay diferencia'], 1, 'Publicidad comercial vs propaganda ideológica. Ambas persuaden pero con fines distintos.'),
    qTF('Las imágenes en publicidad son tan importantes como el texto.', true, 'Una imagen impactante puede transmitir el mensaje sin necesidad de palabras.'),
    qMC('¿Qué es el "target" o público objetivo en publicidad?', ['El precio','El grupo específico al que va dirigido el anuncio','El producto','El competidor'], 1, 'Target = receptor ideal: edad, género, intereses, nivel económico. Define el mensaje.'),
    qTF('Los logotipos y colores corporativos ayudan a identificar marcas.', true, 'El branding visual crea reconocimiento instantáneo. Ej: arcos dorados = McDonald\'s.'),
    qMC('¿Qué busca un "call to action" en publicidad?', ['Que el receptor ignore','Provocar una acción inmediata: comprar, llamar, registrarse','Divertir','No hacer nada'], 1, 'CTA: "Compra ya", "Llama ahora", "Regístrate gratis". Impulsa a actuar.'),
    qTF('La publicidad digital usa algoritmos para personalizar anuncios.', true, 'Basados en historial de navegación, intereses y ubicación. Marketing segmentado.'),
    qMC('Señala el eslogan publicitario:', ['El agua está compuesta de H₂O','"A que no puedes comer solo una"','El presidente dio un discurso','La temperatura es de 30 grados'], 1, 'Eslogan publicitario de papas fritas. Apela al desafío y al consumo.'),
  ],

  // ===== M79: Cartas formales e informales =====
  [
    qMC('¿Qué diferencia una carta formal de una informal?', ['Ninguna','La formal sigue una estructura rígida con respeto; la informal es más libre','La informal es más larga','La formal no saluda'], 1, 'Formal: lenguaje respetuoso y estructura. Informal: coloquial, cercana.'),
    qTF('Una carta formal inicia con "Estimado/a" o "A quien corresponda".', true, 'Saludo protocolario seguido de dos puntos: "Estimado Sr. García:".'),
    qMC('¿Qué parte de una carta contiene dirección y fecha?', ['El cuerpo','El encabezado','La despedida','La firma'], 1, 'Encabezado: lugar, fecha, destinatario. Arriba a la derecha en cartas tradicionales.'),
    qTF('En una carta informal se puede usar "Querido/a" o "Hola".', true, 'El lenguaje cercano y los saludos coloquiales son propios de la carta personal.'),
    qMC('¿Qué fórmula de despedida usarías en una carta formal?', ['Chao','Atentamente o cordialmente','Nos vemos','Besos'], 1, '"Atentamente", "Cordialmente", "Reciba un cordial saludo". Despedidas formales.'),
    qMC('¿Cuál es la estructura básica de una carta?', ['Solo cuerpo','Encabezado, saludo, cuerpo, despedida y firma','Solo firma','Solo saludo'], 1, 'Elementos de toda carta: lugar/fecha, saludo, mensaje, despedida, firma.'),
    qTF('El correo electrónico formal sigue reglas similares a la carta formal.', true, 'Asunto claro, saludo respetuoso, cuerpo conciso, despedida y firma con datos.'),
    qMC('¿Qué tipo de carta es una solicitud de empleo?', ['Carta informal','Carta formal','Nota personal','Tarjeta postal'], 1, 'La solicitud de empleo exige lenguaje formal, estructura y presentación cuidada.'),
    qTF('En cartas formales se debe usar un lenguaje claro y directo.', true, 'Evitar rodeos. Ir al grano con respeto. Cada párrafo = una idea.'),
    qMC('¿Qué falta en esta carta? "Hola Juan, te escribo para invitarte a mi fiesta."', ['El cuerpo','La despedida y firma','El saludo','La fecha'], 1, 'Falta despedida ("Un abrazo") y firma. Es una carta informal incompleta.'),
    qTF('El sobre de una carta formal debe incluir remitente y destinatario.', true, 'Remitente (quién envía) arriba izquierda. Destinatario (quién recibe) al centro.'),
    qMC('Identifica el tipo de carta: "Por medio de la presente solicito..."', ['Informal','Formal (solicitud)','Postal','Nota'], 1, '"Por medio de la presente" es una fórmula de cortesía de las cartas formales.'),
  ],

  // ===== M80: Textos digitales =====
  [
    qMC('¿Qué caracteriza a los textos digitales?', ['Están solo en papel','Se leen en dispositivos electrónicos: pueden incluir enlaces y multimedia','No existen','Son igual que los impresos'], 1, 'Textos digitales = en pantalla. Hipervínculos, imágenes, videos, interactividad.'),
    qTF('Un blog es un tipo de texto digital donde se publican artículos periódicamente.', true, 'Bitácora digital. Puede ser personal, profesional o corporativo.'),
    qMC('¿Qué es un hipervínculo?', ['Un texto largo','Un enlace que al hacer clic lleva a otra página o sección','Un tipo de letra','Un color especial'], 1, 'Hipervínculo = link. Conecta contenidos. Es la base de la navegación web.'),
    qTF('Las redes sociales usan microtextos: breves y de consumo rápido.', true, 'Tweets (280 caracteres antes), posts de Instagram, estados de WhatsApp.'),
    qMC('¿Qué es un correo electrónico?', ['Una carta en papel','Un mensaje digital enviado a través de internet','Una llamada telefónica','Un fax'], 1, 'Email = carta digital. Incluye remitente, destinatario, asunto y cuerpo.'),
    qMC('¿Qué ventaja tienen los textos digitales sobre los impresos?', ['Ninguna','Actualización instantánea, alcance global, interactividad y multimedia','Son más difíciles','No se pueden leer'], 1, 'Se actualizan al momento, llegan a todo el mundo y pueden incluir audio/video.'),
    qTF('Los foros de internet son espacios de discusión con textos digitales.', true, 'Participación asíncrona: cada usuario publica mensajes que otros responden.'),
    qMC('¿Qué es un wiki?', ['Un tipo de danza','Plataforma colaborativa donde varios usuarios editan contenidos','Un juego','Un correo'], 1, 'Wikipedia es el ejemplo más famoso. Contenido creado y editado colectivamente.'),
    qTF('Los e-books son libros en formato digital.', true, 'Se leen en dispositivos electrónicos: Kindle, tablet, celular.'),
    qMC('¿Qué es un "hashtag" en redes sociales?', ['Un símbolo de gato','Etiqueta con # para agrupar contenidos por tema','Un signo de exclamación','Una contraseña'], 1, '#Educación, #Literatura. Agrupan publicaciones del mismo tema.'),
    qTF('Los textos digitales requieren las mismas reglas ortográficas que los impresos.', true, 'Aunque el medio sea digital, la buena escritura sigue siendo fundamental.'),
    qMC('Ventaja de lo digital en educación:', ['Ninguna','Acceso a bibliotecas virtuales, cursos en línea y recursos interactivos','Peor que los libros','Solo sirve para jugar'], 1, 'Internet democratiza el acceso al conocimiento. Bibliotecas virtuales y MOOC.'),
  ],

  // ===== M81: Sor Juana Inés de la Cruz =====
  [
    qMC('¿Quién fue Sor Juana Inés de la Cruz?', ['Una pintora mexicana','La escritora más importante del Barroco hispanoamericano','Una política','Una cantante'], 1, 'Religiosa y escritora del siglo XVII. Considerada la Décima Musa. Genio literario.'),
    qTF('Sor Juana nació en el siglo XVII en lo que hoy es México.', true, 'Nació en 1648 en San Miguel Nepantla (hoy Estado de México).'),
    qMC('¿Cómo se apodaba a Sor Juana?', ['La Reina del Sur','La Décima Musa o Fénix de América','La Madre Patria','La Libertadora'], 1, '"Décima Musa" por su extraordinario talento. "Fénix de América" por su brillantez.'),
    qTF('"Primero sueño" es una de sus obras más importantes.', true, 'Poema filosófico extenso (975 versos). Considerado su obra maestra.'),
    qMC('Sor Juana se destacó principalmente en:', ['Pintura','Poesía, teatro y prosa','Escultura','Música'], 1, 'Escribió poesía lírica, obras de teatro y textos en prosa. Todo con genialidad.'),
    qMC('¿Qué defendió Sor Juana en su "Respuesta a Sor Filotea"?', ['La cocina','El derecho de las mujeres a la educación y al conocimiento','La guerra','La monarquía'], 1, 'Defendió que las mujeres podían y debían estudiar. Texto protofeminista visionario.'),
    qTF('Sor Juana aprendió a leer a los 3 años.', true, 'De niña prodigio: leyó a escondidas, aprendió latín sola y dominó varias disciplinas.'),
    qMC('¿En qué estilo literario se encuadra su obra?', ['Romanticismo','Barroco','Realismo','Vanguardismo'], 1, 'Barroco: lenguaje culto, conceptismo, complejidad formal. Siglo de Oro español.'),
    qTF('Sor Juana murió en 1695 cuidando enfermos durante una epidemia.', true, 'Falleció contagiada de tifus mientras atendía a sus hermanas del convento.'),
    qMC('¿Qué género cultivó Sor Juana además de la poesía?', ['Novela','Teatro (autos sacramentales y comedias)','Ensayo científico','Cuento infantil'], 1, 'Piezas teatrales como "Los empeños de una casa" y autos sacramentales.'),
    qTF('Sor Juana fue una defensora de la educación femenina en el siglo XVII.', true, 'En su época, que una mujer defendiera el estudio era revolucionario. Fue una adelantada.'),
    qMC('¿Dónde vivió Sor Juana la mayor parte de su vida?', ['España','Convento de San Jerónimo (Ciudad de México)','Perú','Estados Unidos'], 1, 'Vivió en el convento de San Jerónimo en la capital virreinal. Allí estudió y escribió.'),
  ],

  // ===== M82: Octavio Paz =====
  [
    qMC('¿Quién fue Octavio Paz?', ['Un músico','Poeta y ensayista mexicano, Premio Nobel de Literatura 1990','Un pintor','Un científico'], 1, 'El único mexicano con Nobel de Literatura. Gigante de las letras hispánicas del siglo XX.'),
    qTF('Octavio Paz ganó el Nobel de Literatura en 1980.', false, 'Lo ganó en 1990. Fue el primer y único mexicano en recibir este galardón.'),
    qMC('¿Cuál es una obra fundamental de Octavio Paz?', ['Cien años de soledad','El laberinto de la soledad','Rayuela','Don Quijote'], 1, '"El laberinto de la soledad" es un ensayo sobre la identidad mexicana. Obra fundamental.'),
    qTF('"Piedra de sol" es uno de sus poemas más famosos.', true, 'Poema extenso de 584 versos endecasílabos. Estructura circular, influencia surrealista.'),
    qMC('¿Qué tema exploró Paz en sus ensayos?', ['Solo cocina','Identidad mexicana, poesía, política y cultura','Solo deportes','Astronomía'], 1, 'Analizó la mexicanidad, la poesía como revelación y los fenómenos culturales y políticos.'),
    qMC('¿De qué trata "El laberinto de la soledad"?', ['De recetas de cocina','Del carácter y la identidad del mexicano, su historia y soledad','De fútbol','De matemáticas'], 1, 'Ensayo clásico: analiza la psicología colectiva del mexicano, el mestizaje y la cultura.'),
    qTF('Octavio Paz fue también diplomático.', true, 'Sirvió como embajador de México en la India. Renunció tras la masacre de Tlatelolco en 1968.'),
    qMC('¿En qué movimiento literario se formó Octavio Paz?', ['Romanticismo','Surrealismo y poesía moderna','Barroco','Renacimiento'], 1, 'Influido por el surrealismo francés. Su poesía combina tradición y vanguardia.'),
    qTF('Paz escribió poesía, ensayo y tradujo a otros poetas.', true, 'Tradujo a Pessoa, Mallarmé, Donne entre otros. Polímata de las letras.'),
    qMC('¿Qué revista literaria fundó Octavio Paz?', ['Time','Vuelta','National Geographic','Selecciones'], 1, 'Fundó "Vuelta" en 1976, revista literaria de gran influencia en Hispanoamérica.'),
    qTF('Octavio Paz murió en 1998.', true, 'Falleció en la Ciudad de México. Su legado poético y ensayístico es inmenso.'),
    qMC('Obra poética de Paz que explora el amor y el tiempo:', ['El Aleph','Piedra de sol','El túnel','La casa verde'], 1, '"Piedra de sol" explora amor, tiempo y el instante eterno. Poema circular y laberíntico.'),
  ],

  // ===== M83: Juan Rulfo =====
  [
    qMC('¿Quién fue Juan Rulfo?', ['Un pintor','Escritor mexicano, autor de obras maestras universales','Un músico','Un científico'], 1, 'Uno de los escritores más influyentes del siglo XX. Revolucionó la literatura latinoamericana.'),
    qTF('"Pedro Páramo" es la obra más famosa de Juan Rulfo.', true, 'Novela breve (1955) considerada obra maestra. Precursora del realismo mágico.'),
    qMC('¿De qué trata "El Llano en llamas"?', ['De incendios forestales','Colección de cuentos sobre la vida rural mexicana post-revolución','De cocina','De viajes espaciales'], 1, '17 cuentos ambientados en el campo mexicano. Pobreza, violencia, muerte y dignidad.'),
    qTF('Rulfo publicó solo dos libros principales en vida.', true, '"El Llano en llamas" (cuentos, 1953) y "Pedro Páramo" (novela, 1955). Calidad sobre cantidad.'),
    qMC('¿Cómo se estructura "Pedro Páramo"?', ['Cronológicamente','Con fragmentos, saltos temporales y voces de muertos','En capítulos numerados','Como poema'], 1, 'Estructura fragmentaria y no lineal. Voces de vivos y muertos entretejidas. Innovador.'),
    qMC('¿Qué representa Comala en "Pedro Páramo"?', ['Un paraíso','Un pueblo fantasma: metáfora del abandono y la muerte','Una ciudad moderna','Un centro comercial'], 1, 'Comala = pueblo de muertos, alegoría del fracaso revolucionario y la soledad.'),
    qTF('Rulfo fue también fotógrafo.', true, 'Gran fotógrafo de paisajes y gente del campo mexicano. Su obra visual complementa la literaria.'),
    qMC('¿Cuál es el tema principal en la obra de Rulfo?', ['La alta burguesía','El mundo rural, la muerte, la violencia y la esperanza frustrada','La ciencia ficción','El amor cortés'], 1, 'Su obra retrata el campo mexicano post-revolucionario: desolación y dignidad.'),
    qTF('Rulfo influyó en García Márquez y otros autores del Boom latinoamericano.', true, 'García Márquez dijo haber memorizado "Pedro Páramo". Influyó en todo el Boom.'),
    qMC('¿Qué técnica narrativa usa Rulfo en "Pedro Páramo"?', ['Narrador único','Monólogos interiores y polifonía de voces','Solo diálogo','Descripción científica'], 1, 'Múltiples voces narrativas. Monólogos, diálogos y narrador en tercera persona.'),
    qTF('Juan Rulfo murió en 1986.', true, 'Legó una obra breve pero de influencia monumental. Referente de la literatura universal.'),
    qMC('Característica del estilo de Rulfo:', ['Barroquismo','Sobriedad, precisión poética y oralidad campesina','Verborrea','Tecnicismos'], 1, 'Prosa precisa, con ritmo poético y el habla del campo mexicano. Economía del lenguaje.'),
  ],

  // ===== M84: Poesía mexicana =====
  [
    qMC('¿Quién escribió "Muerte sin fin"?', ['Octavio Paz','José Gorostiza','Jaime Sabines','Ramón López Velarde'], 1, 'José Gorostiza, poema metafísico barroco sobre la muerte y la eternidad.'),
    qTF('Jaime Sabines es conocido como "el poeta del amor".', true, 'Chiapaneco. Poesía coloquial, directa y emotiva. Su obra "Los amorosos" es emblemática.'),
    qMC('¿Quién es Ramón López Velarde?', ['Un novelista','Poeta de la provincia mexicana, autor de "La suave patria"','Un dramaturgo','Un ensayista'], 1, 'Poeta nacional modernista. "La suave patria" es uno de los poemas más emblemáticos de México.'),
    qTF('La poesía mexicana tiene raíces prehispánicas.', true, 'Nezahualcóyotl y otros poetas prehispánicos. Tradición poética milenaria.'),
    qMC('¿Qué es el modernismo mexicano?', ['Un estilo arquitectónico','Movimiento poético renovador encabezado por el nicaragüense Rubén Darío','Un partido político','Una comida'], 1, 'Darío influyó en los modernistas mexicanos como Gutiérrez Nájera y Nervo.'),
    qMC('Poetas mexicanos contemporáneos:', ['Nezahualcóyotl','Rosario Castellanos, José Emilio Pacheco','Homero','Cervantes'], 1, 'Rosario Castellanos: feminista y poeta. José Emilio Pacheco: Premio Cervantes 2009.'),
    qTF('Los Contemporáneos fueron un grupo poético mexicano de los años 20 y 30.', true, 'Grupo vanguardista: Villaurrutia, Pellicer, Novo. Renovaron la poesía mexicana.'),
    qMC('¿Cuál es un tema recurrente en la poesía mexicana?', ['Solo política','La muerte, la identidad, el amor y la naturaleza','Solo astronomía','Economía'], 1, 'La muerte (calaveras, Día de Muertos), el mestizaje, el paisaje, y el amor son temas centrales.'),
    qTF('Nezahualcóyotl fue un poeta y rey texcocano prehispánico.', true, 'Rey filósofo del siglo XV. Poeta, arquitecto y legislador. Su obra sobrevive.'),
    qMC('¿Qué poeta mexicano ganó el Cervantes en 2009?', ['Octavio Paz','José Emilio Pacheco','Carlos Fuentes','Elena Poniatowska'], 1, 'José Emilio Pacheco. Poeta, narrador y ensayista. Su obra abarca poesía y narrativa.'),
    qTF('Rosario Castellanos escribió sobre la mujer y los pueblos indígenas.', true, 'Poeta, novelista y diplomática. Obra precursora del feminismo y la crítica social en México.'),
    qMC('Obra poética emblemática mexicana:', ['Cien años de soledad','Muerte sin fin de Gorostiza','Rayuela','El Aleph'], 1, '"Muerte sin fin": obra maestra del siglo XX. Poema filosófico sobre ser y no ser.'),
  ],

  // ===== M85: Narrativa hispanoamericana =====
  [
    qMC('¿Qué es el Boom latinoamericano?', ['Una explosión','Fenómeno literario de los 60-70: autores hispanoamericanos ganan fama mundial','Un género musical','Un invento'], 1, 'Autores como García Márquez, Vargas Llosa, Cortázar y Fuentes conquistaron lectores globales.'),
    qTF('El realismo mágico es una corriente asociada a la narrativa hispanoamericana.', true, 'Mezcla realidad cotidiana con elementos mágicos o sobrenaturales narrados con naturalidad.'),
    qMC('¿Quién escribió "La ciudad y los perros"?', ['Gabriel García Márquez','Mario Vargas Llosa','Julio Cortázar','Carlos Fuentes'], 1, 'Vargas Llosa (peruano). Premio Nobel 2010. Novela ambientada en un colegio militar de Lima.'),
    qTF('Julio Cortázar escribió "Rayuela", novela que puede leerse de varias formas.', true, 'Novela experimental argentina. Puede leerse seguido o saltando según un "tablero de dirección".'),
    qMC('¿Cuál es una obra de Carlos Fuentes?', ['Pedro Páramo','La muerte de Artemio Cruz','El Aleph','Cien años de soledad'], 1, 'Carlos Fuentes, mexicano. Novela sobre un moribundo que recuerda su vida. Crítica social.'),
    qMC('¿Qué caracteriza a la narrativa hispanoamericana?', ['Solo realismo','Diversidad: realismo mágico, innovación formal, compromiso político','Solo ficción científica','Solo romances'], 1, 'Incluye múltiples estilos: desde lo experimental hasta el indigenismo y la denuncia social.'),
    qTF('El indigenismo narra la realidad y opresión de los pueblos indígenas.', true, 'José María Arguedas (Perú), Rosario Castellanos (México). Voz de los marginados.'),
    qMC('¿Quién escribió "El Aleph"?', ['Carlos Fuentes','Jorge Luis Borges','Gabriel García Márquez','Julio Cortázar'], 1, 'Borges (argentino). Cuento metafísico sobre un punto que contiene todo el universo.'),
    qTF('La Revolución Mexicana fue tema central en muchas novelas del siglo XX.', true, '"Los de abajo" de Mariano Azuela. "La muerte de Artemio Cruz" de Fuentes.'),
    qMC('Elemento común en la narrativa hispanoamericana:', ['Desconexión con lo local','Identidad, dictaduras, realidades sociales, experimentación con el lenguaje','Temas europeos','Ciencia ficción solamente'], 1, 'Explora identidad latinoamericana, violencia política, pobreza y riqueza cultural.'),
    qTF('El Boom dio visibilidad mundial a escritores que renovaron la novela.', true, 'Antes del Boom, la literatura hispanoamericana era poco conocida fuera de la región.'),
    qMC('Países clave en la narrativa hispanoamericana:', ['Solo México','Argentina, México, Perú, Colombia, Chile, Cuba y muchos más','Solo España','Estados Unidos'], 1, 'Toda Hispanoamérica ha producido literatura destacada. Diversidad geográfica y temática.'),
  ],

  // ===== M86: Gabriel García Márquez =====
  [
    qMC('¿Quién fue Gabriel García Márquez?', ['Un científico','Escritor colombiano, Nobel de Literatura 1982, maestro del realismo mágico','Un músico','Un político'], 1, '"Gabo", uno de los más grandes. Su obra "Cien años de soledad" es un hito universal.'),
    qTF('García Márquez nació en Colombia.', true, 'Nació en Aracataca, Colombia, en 1927. Creció con sus abuelos, influencia clave en su obra.'),
    qMC('¿Cuál es su obra más famosa?', ['El coronel no tiene quien le escriba','Cien años de soledad','Crónica de una muerte anunciada','El amor en los tiempos del cólera'], 1, '"Cien años de soledad" (1967) es considerada una de las mejores novelas de la historia.'),
    qTF('Macondo es el pueblo ficticio donde transcurren muchas de sus obras.', true, 'Inspirado en su Aracataca natal. Macondo simboliza Latinoamérica entera.'),
    qMC('¿Qué corriente literaria representa "Cien años de soledad"?', ['Naturalismo','Realismo mágico','Romanticismo','Clasicismo'], 1, 'Realismo mágico: lo extraordinario se narra como cotidiano. Ej: Remedios la Bella ascendiendo al cielo.'),
    qMC('¿Cuál es el inicio de "Cien años de soledad"?', ['Había una vez...','"Muchos años después, frente al pelotón de fusilamiento..."','Érase que se era...','En un lugar de la Mancha...'], 1, 'Una de las frases iniciales más famosas de la literatura universal.'),
    qTF('García Márquez fue también periodista.', true, 'Trabajó en varios periódicos. Fundó la agencia Prensa Latina y la revista Cambio.'),
    qMC('¿Qué premio recibió en 1982?', ['Óscar','Nobel de Literatura','Grammy','Pulitzer'], 1, 'Premio Nobel de Literatura "por sus novelas e historias cortas, en las que lo fantástico y lo real se combinan..."'),
    qTF('"El amor en los tiempos del cólera" es una novela de amor de García Márquez.', true, 'Historia de amor de Florentino Ariza y Fermina Daza que abarca más de 50 años.'),
    qMC('Tema central en la obra de Gabo:', ['Viajes espaciales','La soledad, el poder, el amor y la violencia latinoamericana','Cocina francesa','Deportes'], 1, 'Explora destino, ciclos vitales, amor, muerte y sociedad latinoamericana.'),
    qTF('Gabriel García Márquez murió en 2014.', true, 'Falleció en Ciudad de México. Luto mundial de las letras.'),
    qMC('Obra breve pero intensa de Gabo:', ['El Aleph','El coronel no tiene quien le escriba','Rayuela','Ficciones'], 1, 'Novela corta sobre un veterano que espera su pensión. Desolación y dignidad.'),
  ],

  // ===== M87: Pablo Neruda =====
  [
    qMC('¿Quién fue Pablo Neruda?', ['Un pintor mexicano','Poeta chileno, Premio Nobel de Literatura 1971','Un novelista argentino','Un científico'], 1, 'Uno de los poetas más leídos del siglo XX. Su poesía de amor es universal.'),
    qTF('Neruda ganó el Nobel de Literatura en 1971.', true, '"Por una poesía que con la acción de una fuerza elemental da vida al destino y los sueños de un continente."'),
    qMC('¿Cuál es una obra emblemática de Neruda?', ['Cien años de soledad','Veinte poemas de amor y una canción desesperada','El Aleph','Pedro Páramo'], 1, 'Su libro más célebre, publicado cuando tenía solo 19 años. Poesía amorosa intensa.'),
    qTF('"Canto general" es un poema épico sobre la historia y naturaleza de América.', true, 'Obra monumental: más de 15,000 versos. Canto a la tierra, los pueblos y la historia americana.'),
    qMC('¿De qué trata "Odas elementales"?', ['De ciencia','De objetos cotidianos: alcachofa, calcetín... con mirada poética','De guerra','De política solamente'], 1, 'Poemas a cosas simples y humildes, elevándolas a categoría poética. Celebra lo pequeño.'),
    qMC('¿Cómo se llamaba realmente Pablo Neruda?', ['Ese era su nombre','Ricardo Eliécer Neftalí Reyes Basoalto','Gabriel García','Jorge Luis'], 1, 'Adoptó el seudónimo Pablo Neruda por el poeta checo Jan Neruda.'),
    qTF('Neruda fue también diplomático chileno.', true, 'Cónsul en varios países. Vivió en España durante la Guerra Civil, que le impactó profundamente.'),
    qMC('Verso famoso de Neruda:', ['"En un lugar de la Mancha..."','"Puedo escribir los versos más tristes esta noche..."','"El que lee mucho..."','"En tierra de ciegos..."'], 1, 'De "Veinte poemas de amor..." Verso inmortal de la poesía amorosa.'),
    qTF('Neruda escribió poesía de amor y poesía política.', true, 'Amor: "Veinte poemas...", "Los versos del capitán". Política: "Canto general", "España en el corazón".'),
    qMC('¿Dónde nació Neruda?', ['México','Chile (Parral)','Argentina','Colombia'], 1, 'Nació en Parral, Chile, en 1904. Murió en 1973 en Santiago.'),
    qTF('Neruda fue amigo de Federico García Lorca y de otros poetas de la Generación del 27.', true, 'Vivió en España y trabó amistad con Lorca, Alberti, Miguel Hernández y otros.'),
    qMC('Estilo poético de Neruda:', ['Barroco y difícil','Verso libre, fuerza telúrica, sensorialidad y compromiso','Solo haikus','Solo sonetos'], 1, 'Lenguaje directo pero cargado de imágenes poderosas. Conexión con la tierra y los sentidos.'),
  ],

  // ===== M88: Jorge Luis Borges =====
  [
    qMC('¿Quién fue Jorge Luis Borges?', ['Un novelista mexicano','Escritor argentino, maestro del cuento metafísico y la literatura fantástica','Un poeta chileno','Un científico'], 1, 'Uno de los autores más influyentes del siglo XX. Revolucionó el cuento y el ensayo.'),
    qTF('Borges escribió principalmente novelas largas.', false, 'Nunca escribió una novela. Se dedicó al cuento, el ensayo y la poesía.'),
    qMC('¿Qué libro recopila sus cuentos más célebres?', ['Cien años de soledad','Ficciones y El Aleph','Rayuela','Pedro Páramo'], 1, '"Ficciones" (1944) y "El Aleph" (1949) contienen sus relatos más famosos e innovadores.'),
    qTF('En los cuentos de Borges son frecuentes los laberintos, espejos y bibliotecas.', true, 'Símbolos recurrentes: laberinto (confusión cósmica), espejo (identidad), biblioteca (conocimiento infinito).'),
    qMC('¿De qué trata "La biblioteca de Babel"?', ['De un bibliotecario','De un universo-biblioteca infinita que contiene todos los libros posibles','De cocina','De un viaje'], 1, 'Biblioteca infinita. Metáfora del universo, el lenguaje y los límites del conocimiento.'),
    qMC('¿Qué cuestión filosófica explora Borges?', ['Recetas','Realidad, tiempo, identidad e infinito','Deportes','Moda'], 1, 'Temas metafísicos: el tiempo circular, la identidad múltiple, los laberintos del lenguaje.'),
    qTF('Borges se quedó ciego en su madurez, lo que influyó en su obra tardía.', true, 'La ceguera llegó progresivamente. Dictaba sus textos. Reflexionó sobre la oscuridad y la memoria.'),
    qMC('¿Qué es "El Aleph"?', ['Un planeta','Un punto en el espacio que contiene todo el universo visible simultáneamente','Un animal','Una ciudad'], 1, 'Aleph = primera letra hebrea. En el cuento, un punto mágico donde todo coexiste.'),
    qTF('Borges influyó en autores de todo el mundo a pesar de no ganar el Nobel.', true, 'El Nobel le fue esquivo. Pero su influencia es universal: Foucault, Eco, Rushdie lo citan.'),
    qMC('¿Qué estilo caracteriza a Borges?', ['Coloquial y simple','Erudito, preciso, con referencias cultas y laberintos intelectuales','Infantil','Técnico'], 1, 'Prosa exacta, llena de alusiones literarias, filosóficas y metafísicas. Cada palabra, medida.'),
    qTF('Las obras de Borges mezclan realidad y ficción, realidad y sueño.', true, 'Borges difumina fronteras: lo fantástico irrumpe en lo real, el sueño en la vigilia.'),
    qMC('País de origen de Borges:', ['México','Argentina (Buenos Aires)','Chile','Perú'], 1, 'Nació en Buenos Aires en 1899. Murió en Ginebra, Suiza, en 1986.'),
  ],

  // ===== M89: Literatura prehispánica =====
  [
    qMC('¿Qué pueblos mesoamericanos tenían tradición literaria?', ['Solo los mayas','Nahuas, mayas, mixtecos y zapotecos, entre otros','Ninguno','Solo los aztecas'], 1, 'Varias culturas mesoamericanas desarrollaron poesía, narrativa y textos religiosos o históricos.'),
    qTF('Nezahualcóyotl fue un rey poeta del México prehispánico.', true, 'Rey de Texcoco (siglo XV). Sus poemas sobre la fugacidad de la vida se conservan.'),
    qMC('¿Cuál es una obra maya emblemática?', ['La Biblia','El Popol Vuh','La Eneida','El Quijote'], 1, 'Popol Vuh = libro sagrado maya-quiché. Relata la creación y las historias de los héroes gemelos.'),
    qTF('Los códices prehispánicos son libros pictográficos que preservan saberes.', true, 'Códices mixtecos (Nuttall, Vindobonensis), mayas (Dresde), y mexicas (Borbónico).'),
    qMC('¿Qué tema aparece en la poesía náhuatl?', ['Solo guerra','Flor y canto: la poesía, la belleza, la fugacidad de la vida','Solo política','Solo matemáticas'], 1, '"In xóchitl in cuícatl" (flor y canto): metáfora náhuatl de la poesía y la verdad.'),
    qMC('¿Qué es el Chilam Balam?', ['Un animal','Libros mayas coloniales que combinan tradición maya y española','Un conquistador','Un volcán'], 1, 'Varios libros proféticos yucatecos. Escritos en maya con caracteres latinos. Fusión cultural.'),
    qTF('Los españoles destruyeron muchos textos prehispánicos durante la Conquista.', true, 'Auto de fe en Maní (1562): Fray Diego de Landa quemó códices mayas. Pérdida cultural irreparable.'),
    qMC('¿Quién recopiló cantares mexicanos tras la Conquista?', ['Hernán Cortés','Bernardino de Sahagún y otros frailes','Moctezuma','Cristóbal Colón'], 1, 'Sahagún preservó textos en náhuatl en el Códice Florentino. También Cantares mexicanos.'),
    qTF('La literatura prehispánica era solo oral, no tenía escritura.', false, 'Mayas y mexicas tenían sistemas de escritura. Los códices mixtecos y mayas lo demuestran.'),
    qMC('Género literario náhuatl:', ['Novela','Cuícatl (canto) y tlahtolli (discurso)','Teatro moderno','Cuento infantil'], 1, 'Nahuas distinguían: cantos (poesía) y discursos (prosa retórica, consejos de padres a hijos).'),
    qTF('Gran parte de la literatura prehispánica se conservó gracias a tradición oral.', true, 'Aunque muchos códices se perdieron, la memoria oral y los frailes preservaron bastante.'),
    qMC('¿Qué es el Huehuetlatolli?', ['Un guerrero','Discursos de ancianos: consejos y enseñanzas morales nahuas','Un conquistador','Un arma'], 1, 'Huehuetlatolli = "palabra antigua". Sabiduría y normas éticas transmitidas oralmente.'),
  ],

  // ===== M90: Literatura contemporánea =====
  [
    qMC('¿Qué caracteriza a la literatura contemporánea en español?', ['Solo realismo','Diversidad: desde lo fantástico hasta lo testimonial, con múltiples voces y temas','Solo poesía','Solo teatro'], 1, 'Siglo XXI: voces femeninas, migrantes, indígenas. Nuevos formatos y preocupaciones.'),
    qTF('Elena Poniatowska es una escritora y periodista mexicana contemporánea.', true, 'Autora de "La noche de Tlatelolco". Premio Cervantes 2013. Voz testimonial de México.'),
    qMC('¿Quién es Juan Villoro?', ['Un futbolista','Escritor mexicano contemporáneo: crónica, cuento y novela','Un político','Un músico'], 1, 'Uno de los autores mexicanos vivos más destacados. Combina literatura y reflexión social.'),
    qTF('Isabel Allende es una escritora chilena contemporánea de fama mundial.', true, 'Autora de "La casa de los espíritus". Realismo mágico con perspectiva femenina.'),
    qMC('¿Qué preocupación refleja la literatura contemporánea?', ['Ninguna','Migración, identidad, género, globalización, ecología y violencia','Solo la cocina','Solo el deporte'], 1, 'La literatura actual dialoga con los problemas del presente: desigualdad, tecnología, género.'),
    qMC('Tendencia actual en literatura:', ['Solo papel','Literatura digital, microrrelatos, autoficción, narrativa transmedia','Solo teatro','Solo cuentos'], 1, 'Nuevos formatos: hilos de Twitter, Wattpad, podcast literarios, novelas interactivas.'),
    qTF('La literatura juvenil ha ganado gran popularidad en el siglo XXI.', true, 'Harry Potter, Los juegos del hambre. También autores hispanos como Laura Gallego.'),
    qMC('Autora mexicana contemporánea destacada:', ['Sor Juana','Valeria Luiselli','Rosario Castellanos (aunque del siglo XX)','Todas'], 1, 'Valeria Luiselli: novelista y ensayista joven. Temas de migración y archivo.'),
    qTF('Los premios literarios visibilizan a nuevos autores hispanoamericanos.', true, 'Premio Alfaguara, Herralde, Rulfo. Dan proyección internacional a nuevas voces.'),
    qMC('¿Qué es la autoficción?', ['Una biografía','Género que mezcla autobiografía y ficción literaria','Un artículo','Un poema'], 1, 'Autoficción = el autor se ficcionaliza a sí mismo: realidad personal transformada en literatura.'),
    qTF('Internet ha democratizado la publicación literaria.', true, 'Blogs, Wattpad, redes sociales. Nuevos canales para que autores emergentes se den a conocer.'),
    qMC('Desafío actual de la literatura:', ['Ninguno','Competir con pantallas, mantener la lectura y conectar con nuevas generaciones','No hay desafíos','Solo vender libros'], 1, 'En la era digital, la literatura busca formas de seguir siendo relevante y atrayente.'),
  ],

  // ===== M91: Repaso de ortografía =====
  [
    qMC('Las palabras agudas llevan tilde cuando terminan en:', ['Cualquier letra','n, s o vocal','Solo vocal','Solo consonante'], 1, 'CanCIÓN, comPÁS, caFÉ. Regla básica: agudas con n, s o vocal = tilde.'),
    qTF('"Árbol" es una palabra grave que lleva tilde.', true, 'Termina en l (no n, s ni vocal), por eso se acentúa. Las graves se acentúan cuando NO terminan en n, s o vocal.'),
    qMC('¿Es correcta la B después de M? "Cambio, también, hombre."', ['No, se escribe con V','Sí, siempre B después de M','Depende','A veces V'], 1, 'Regla: después de M siempre B, nunca V. Es la única combinación posible.'),
    qTF('"Hay" es del verbo haber; "ahí" es lugar; "ay" es exclamación.', true, 'Homófonos con distinta escritura. Hay = existencia; ahí = localización; ay = queja.'),
    qMC('¿"Tuvo" o "tubo" para el verbo tener?', ['Tubo','Tuvo con V','Tuvo con B','Es igual'], 1, '"Tuvo" (verbo tener) con V. "Tubo" (cilindro hueco) con B. Parónimos.'),
    qTF('La diéresis (ü) indica que la u debe pronunciarse: pingüino, vergüenza.', true, 'En combinaciones gue/gui, la diéresis hace sonar la u.'),
    qMC('Las esdrújulas llevan tilde:', ['Solo si lo dice el diccionario','Siempre, sin excepción','Nunca','A veces'], 1, 'Todas las esdrújulas llevan tilde siempre. Ej: MÉdico, Águila, Teléfono.'),
    qTF('"Hacer" y "echar" se escriben con h y sin h respectivamente.', true, 'Hacer (con h) = realizar. Echar (sin h) = arrojar. Homófonos distintos.'),
    qMC('¿Palabras terminadas en -ción?', ['Con C','Con S','Con Z','Con X'], 0, '-ción siempre con C: educación, canción, nación.'),
    qTF('Los signos de interrogación en español son solo uno al final.', false, 'En español se usan signos de apertura ¿ y cierre ?. Obligatorios ambos.'),
    qMC('"Bello" (hermoso) vs "vello" (pelo) son:', ['Sinónimos','Homófonos','Iguales','Ninguna'], 1, 'Suenan igual pero se escriben distinto. Bello = bonito; vello = pelo corporal.'),
    qTF('Conocer las reglas ortográficas basta para escribir bien, sin necesidad de leer.', false, 'La lectura habitual es la mejor forma de interiorizar la ortografía correcta.'),
  ],

  // ===== M92: Repaso de gramática =====
  [
    qMC('En "La casa azul", ¿qué función tiene "azul"?', ['Sustantivo','Adjetivo calificativo','Verbo','Artículo'], 1, 'Describe al sustantivo "casa". Es adjetivo calificativo.'),
    qTF('El núcleo del sujeto es siempre un verbo.', false, 'El núcleo del sujeto es un sustantivo o pronombre. El verbo es núcleo del predicado.'),
    qMC('¿Cuál es el artículo definido femenino plural?', ['El','La','Los','Las'], 3, '"Las" = artículo definido femenino plural.'),
    qTF('Los adverbios cambian de género y número.', false, 'Los adverbios son invariables: "llegó tarde" / "llegaron tarde".'),
    qMC('"Mi", "tu", "su" son:', ['Pronombres','Adjetivos posesivos','Verbos','Preposiciones'], 1, 'Indican posesión. Mi libro, tu casa, su perro. Anteceden al sustantivo.'),
    qMC('¿Qué es el predicado nominal?', ['Predicado con objeto directo','Predicado con verbo copulativo (ser/estar) + atributo','Predicado sin verbo','Ninguno'], 1, '"La casa ES azul." Ser + atributo = predicado nominal.'),
    qTF('En español, el adjetivo concuerda en género y número con el sustantivo.', true, 'Las flores hermosas (fem., plural). El gato blanco (masc., singular).'),
    qMC('Identifica el sujeto: "Me gustan los tacos."', ['Me','gustan','los tacos','No tiene sujeto'], 2, '"Los tacos" es el sujeto (¿qué gustan?). "Me" es objeto indirecto.'),
    qTF('Las palabras graves siempre llevan tilde.', false, 'Solo cuando NO terminan en n, s o vocal. Ej: "casa" no lleva tilde.'),
    qMC('¿Qué tipo de palabra modifica al verbo?', ['Artículo','Adverbio','Pronombre','Preposición'], 1, 'El adverbio modifica al verbo: "corre rápido", "llegó temprano".'),
    qTF('"Estudia" es un verbo de la primera conjugación.', true, 'Termina en -ar. Primera conjugación: estudiar, cantar, bailar.'),
    qMC('Ejemplo de concordancia correcta:', ['La problema serio','El problema serio','Los problema serio','La problema seria'], 1, '"Problema" es masculino: "el problema serio". Concordancia sustantivo-artículo-adjetivo.'),
  ],

  // ===== M93: Repaso de verbos =====
  [
    qMC('El verbo "haber" es:', ['Principal','Auxiliar para formar tiempos compuestos','Reflexivo','Solo impersonal'], 1, 'Haber + participio = tiempos compuestos: "He comido", "Había salido".'),
    qTF('"Comeré" es futuro simple de indicativo.', true, 'El futuro se forma añadiendo terminaciones al infinitivo completo.'),
    qMC('¿Cuál está en pretérito perfecto simple?', ['Comía','Comí','He comido','Comería'], 1, '"Comí" = pretérito (pasado puntual). "Comía" = imperfecto; "He comido" = compuesto.'),
    qTF('El subjuntivo expresa hechos objetivos y reales.', false, 'El subjuntivo expresa deseos, dudas, posibilidades. El indicativo los hechos concretos.'),
    qMC('Verbo irregular: yo ___ (caber)', ['cabo','quepo','cabo','cabeo'], 1, 'Caber es muy irregular: quepo, cabes, cabe.'),
    qMC('¿Cuál es el imperativo de "tener" para tú?', ['Tiene','Ten','Tenga','Tienes'], 1, 'Imperativo tener: ten (tú), tenga (usted). Forma irregular.'),
    qTF('"Se venden casas" es voz pasiva refleja.', true, 'Pasiva refleja: sujeto paciente + se + verbo. "Las casas son vendidas."'),
    qMC('"Estoy leyendo" es una perífrasis:', ['Terminativa','Durativa (estar + gerundio)','De obligación','De futuro'], 1, 'Estar + gerundio = acción en desarrollo, durativa.'),
    qTF('El participio en tiempos compuestos es invariable.', true, 'Siempre masculino singular: "Han llegado", nunca "han llegadas".'),
    qMC('¿Qué tiempo es "hubiera cantado"?', ['Presente de indicativo','Pretérito pluscuamperfecto de subjuntivo','Futuro','Imperativo'], 1, 'Pluscuamperfecto de subjuntivo. Expresa pasado hipotético.'),
    qTF('Los verbos defectivos se conjugan en todas las personas.', false, 'Solo en tercera persona singular: "llueve", "anochece".'),
    qMC('Modo que expresa órdenes:', ['Indicativo','Imperativo','Subjuntivo','Condicional'], 1, 'Imperativo = mandato. "Ven aquí", "come tu comida".'),
  ],

  // ===== M94: Repaso de comprensión lectora =====
  [
    qMC('Lee: "Ana guardó los libros y apagó la luz antes de salir." ¿Qué hizo Ana al final?', ['Guardó los libros','Salió','Apagó la luz','Leyó'], 1, 'La secuencia: guardó libros → apagó luz... La última acción antes de salir fue apagar la luz.'),
    qTF('La idea principal de un párrafo puede aparecer en cualquier posición.', true, 'Al inicio, en medio o al final. No hay una sola posición fija.'),
    qMC('Texto que busca convencer:', ['Narrativo','Argumentativo','Instructivo','Descriptivo'], 1, 'Argumentativo = persuadir con razones y datos.'),
    qTF('En textos narrativos, el narrador omnisciente conoce solo sus propios pensamientos.', false, 'El omnisciente lo sabe TODO: pensamientos de todos, pasado, futuro.'),
    qMC('¿Qué texto usarías para armar un mueble?', ['Un cuento','Un instructivo','Una novela','Un poema'], 1, 'Instructivo: pasos enumerados, diagramas, materiales.'),
    qMC('"El océano es inmenso" es un hecho o una opinión?', ['Opinión (inmenso es relativo)','Hecho (los océanos son grandes)','Opinión','Parcialmente hecho'], 0, '"Inmenso" implica juicio subjetivo de tamaño. Un hecho sería "El océano Pacífico mide 165 millones de km²".'),
    qTF('Una paráfrasis es copiar textualmente un párrafo.', false, 'Paráfrasis = expresar las mismas ideas con palabras propias, no copia literal.'),
    qMC('En "El león, rey de la selva, rugió", ¿qué es "rey de la selva"?', ['Sujeto','Aposición explicativa','Verbo','Objeto directo'], 1, 'Aposición = frase que explica algo del sustantivo. Va entre comas.'),
    qTF('"Érase una vez..." suele indicar un texto instructivo.', false, 'Es fórmula típica de inicio de cuentos (textos narrativos).'),
    qMC('Fuente más confiable para un trabajo escolar:', ['Wikipedia (sin verificar)','Enciclopedia verificada o libro académico','Redes sociales','Opinión de un amigo'], 1, 'Fuentes académicas revisadas por expertos. Wikipedia puede ser punto de partida pero no fuente final.'),
    qTF('El índice de un libro está al principio e indica las páginas de cada tema.', true, 'Índice = mapa del libro. Facilita localizar contenidos.'),
    qMC('Resumir un texto implica:', ['Escribirlo más largo','Extraer las ideas principales condensándolas','Copiarlo textualmente','Añadir opiniones'], 1, 'Resumen = condensación objetiva de las ideas esenciales del texto.'),
  ],

  // ===== M95: Redacción de párrafos =====
  [
    qMC('¿Qué es un párrafo?', ['Una página entera','Unidad de texto que desarrolla una idea principal','Una sola oración','Solo diálogos'], 1, 'Párrafo = bloque de líneas con idea central y oraciones secundarias que la apoyan.'),
    qTF('Todo párrafo bien redactado tiene una idea principal y oraciones de apoyo.', true, 'Estructura: idea principal + desarrollo. Cada párrafo = una unidad temática.'),
    qMC('¿Qué oración inicia mejor un párrafo?', ['Por lo tanto...','Hay varias razones para...','En conclusión...','Finalmente...'], 1, 'Una oración temática que anuncie el contenido del párrafo. Las otras son conectores de cierre.'),
    qTF('Los párrafos pueden ser de introducción, desarrollo o conclusión.', true, 'Cada tipo cumple una función distinta en el texto. Introducción presenta, desarrollo explica, conclusión cierra.'),
    qMC('¿Cuántas ideas principales debe tener un párrafo?', ['Varias','Una sola','Ninguna','Depende'], 1, 'Un párrafo bien escrito = una idea. Si cambia la idea, cambia el párrafo.'),
    qMC('¿Qué recurso une las oraciones de un párrafo?', ['Mayúsculas','Conectores y puntuación','Solo verbos','Solo adjetivos'], 1, 'Conectores (además, sin embargo) y signos de puntuación dan cohesión.'),
    qTF('La extensión de un párrafo debe ser exactamente de 5 líneas.', false, 'Depende del contenido. Puede ser corto (2-3 líneas) o largo (10+ líneas). Lo importante es la unidad temática.'),
    qMC('Párrafo de introducción idealmente:', ['Cuenta un chiste','Presenta el tema y capta el interés del lector','Termina el texto','Ignora al lector'], 1, 'Introducción = anzuelo: presenta tema, da contexto y motiva a seguir leyendo.'),
    qTF('Se puede empezar un párrafo con una cita o una pregunta.', true, 'Recursos de apertura válidos: cita, pregunta retórica, dato impactante o anécdota.'),
    qMC('¿Cómo se organiza un párrafo de desarrollo?', ['Aleatoriamente','De lo general a lo particular, con ejemplos y explicaciones','Solo con preguntas','Solo con exclamaciones'], 1, 'Estructura lógica: idea general → detalles, ejemplos, datos que la sustentan.'),
    qTF('La sangría al inicio diferencia visualmente los párrafos.', true, 'Sangría + punto y aparte = indicadores visuales de cambio de párrafo.'),
    qMC('¿Qué NO debe faltar en un párrafo bien escrito?', ['Coherencia','Errores','Oraciones sin relación','Incoherencias'], 0, 'Coherencia = relación lógica entre las ideas. Sin coherencia, el párrafo no se entiende.'),
  ],

  // ===== M96: Conectores textuales =====
  [
    qMC('¿Para qué sirven los conectores textuales?', ['Decorar','Enlazar ideas y dar fluidez a la lectura','Confundir','Acortar'], 1, 'Los conectores unen párrafos y oraciones, guiando al lector por la lógica del texto.'),
    qTF('"Además" y "también" son conectores de adición.', true, 'Añaden información: suma de ideas. Otros: "asimismo", "incluso", "por otro lado".'),
    qMC('¿Qué conector indica causa?', ['Por lo tanto','Porque, ya que, puesto que','Sin embargo','Además'], 1, 'Causales: porque, ya que, puesto que, debido a. Explican la razón.'),
    qTF('"Sin embargo" y "no obstante" son conectores de contraste u oposición.', true, 'Adversativos: pero, sin embargo, no obstante, por el contrario. Oponen ideas.'),
    qMC('¿Qué conector usarías para concluir?', ['En primer lugar','En conclusión o finalmente','Además','Porque'], 1, 'Conclusivos: en conclusión, para finalizar, en resumen, por consiguiente.'),
    qMC('Conector para ordenar ideas:', ['Pero','En primer lugar, en segundo lugar, por último','Ya que','Sin embargo'], 1, 'Ordenadores: primero, luego, después, finalmente. Estructuran la secuencia.'),
    qTF('"Es decir" y "o sea" son conectores de explicación o reformulación.', true, 'Explican o aclaran lo dicho: "en otras palabras", "esto es".'),
    qMC('¿Cuál ejemplifica?', ['Por último','Por ejemplo o como muestra','Puesto que','Sin duda'], 1, 'Ejemplificadores: por ejemplo, verbigracia, como muestra, tal es el caso de.'),
    qTF('Abusar de conectores hace el texto más profesional.', false, 'El exceso de conectores puede sonar artificial. Úsalos con moderación y precisión.'),
    qMC('Conector de consecuencia:', ['Porque','Por lo tanto, así que, de modo que','Además','En primer lugar'], 1, 'Consecutivos: por lo tanto, así que, por consiguiente. Indican resultado.'),
    qTF('Los conectores mejoran la cohesión y coherencia de un texto.', true, 'Sin conectores, el texto parece una lista inconexa. Con ellos, fluye y se entiende.'),
    qMC('Señala el conector de tiempo:', ['Pero','Luego, después, a continuación','Sin embargo','Es decir'], 1, 'Temporales: luego, después, antes, mientras, a continuación. Secuencian.'),
  ],

  // ===== M97: Coherencia y cohesión =====
  [
    qMC('¿Qué es la coherencia textual?', ['Que el texto sea bonito','Relación lógica entre las ideas: que tenga sentido global','Que sea corto','Que tenga errores'], 1, 'Coherencia = el texto trata sobre lo mismo, sin contradicciones ni saltos ilógicos.'),
    qTF('La cohesión se refiere a cómo se unen las partes del texto (gramática y léxico).', true, 'Cohesión = conectores, pronombres, concordancia. El "pegamento" gramatical.'),
    qMC('Un texto con coherencia pero sin cohesión:', ['Se entiende perfecto','Es como piezas sueltas: las ideas son lógicas pero mal conectadas','Es perfecto','No existe'], 1, 'Sin cohesión: ideas correctas pero expresadas sin nexos ni fluidez.'),
    qTF('Repetir la misma palabra muchas veces rompe la cohesión.', true, 'Usar pronombres o sinónimos mantiene la fluidez: "María llegó. Ella estaba cansada."'),
    qMC('Para lograr cohesión se usan:', ['Solo puntos','Pronombres, sinónimos, conectores, elipsis','Solo comas','Mayúsculas'], 1, 'Recursos cohesivos: pronombres (él, ella), sinónimos (evitar repetición), conectores, puntuación.'),
    qMC('¿Qué texto tiene mejor coherencia?', ['Ideas mezcladas sin orden','Ideas organizadas lógicamente sobre un mismo tema','Muchas palabras sueltas','Solo números'], 1, 'Coherencia = unidad temática + organización lógica. Todo gira en torno al tema central.'),
    qTF('Un texto coherente puede ser muy largo.', true, 'La extensión no afecta la coherencia. Una novela de 1,000 páginas puede ser perfectamente coherente.'),
    qMC('Problema de coherencia común:', ['Mucho vocabulario','Contradecirse: decir algo y luego lo opuesto sin justificación','Muchos ejemplos','Buen uso de conectores'], 1, 'Contradicción = incoherencia. Lo que se afirma debe mantenerse o explicar el cambio.'),
    qTF('La cohesión se logra solo con conectores; el resto no importa.', false, 'También con pronombres, sinónimos, repetición estratégica, elipsis y puntuación.'),
    qMC('Cohesión por elipsis: "María compró pan; Juan, leche." Significa:', ['Está mal','Se omite "compró" en la segunda parte para evitar repetición','Juan no compró nada','Es incoherente'], 1, 'Elipsis = omitir palabras sobreentendidas. Da fluidez y evita repetición.'),
    qTF('Un texto puede tener cohesión pero poca coherencia.', true, 'Ej: oraciones bien unidas por conectores pero que tratan temas sin relación o se contradicen.'),
    qMC('Clave para escribir con coherencia:', ['Escribir sin pensar','Planificar: saber qué quiero decir y en qué orden','Solo corregir al final','No revisar'], 1, 'Planificación = esquema previo. Saber qué decir, en qué orden y cómo relacionarlo.'),
  ],

  // ===== M98: Tipos de párrafos =====
  [
    qMC('Un párrafo que enumera características es:', ['Narrativo','Descriptivo o enumerativo','Argumentativo','Expositivo'], 1, 'Enumerativo: lista rasgos, partes o cualidades. Propio de descripciones y listados.'),
    qTF('El párrafo de causa-efecto explica por qué sucede algo y sus consecuencias.', true, 'Ej: "La contaminación (causa) provoca enfermedades respiratorias (efecto)."'),
    qMC('¿Qué tipo de párrafo presenta un problema y propone soluciones?', ['Descriptivo','Problema-solución','Narrativo','Enumerativo'], 1, 'Problema-solución: plantea dificultad y ofrece posibles remedios o alternativas.'),
    qTF('Un párrafo narrativo cuenta una secuencia de hechos en el tiempo.', true, 'Secuencia temporal: inicio → desarrollo → desenlace. Propio de crónicas y relatos.'),
    qMC('Párrafo que compara semejanzas y diferencias:', ['Enumerativo','Comparativo o de contraste','Causa-efecto','Narrativo'], 1, 'Comparativo: coteja dos o más elementos. Puede ser por similitudes, diferencias o ambas.'),
    qMC('¿Cómo se organiza un párrafo cronológico?', ['Aleatoriamente','Siguiendo el orden temporal de los acontecimientos','Por importancia','Por tamaño'], 1, 'Cronológico = orden temporal: primero, luego, después, finalmente.'),
    qTF('El párrafo argumentativo defiende una postura con razones.', true, 'Tesis + argumentos + refutación. Busca convencer al lector.'),
    qMC('En un párrafo expositivo, el objetivo principal es:', ['Persuadir','Informar o explicar objetivamente','Narrar una historia','Expresar sentimientos'], 1, 'Expositivo = transmitir información clara y verificable, sin opiniones.'),
    qTF('Todos los párrafos de un texto deben ser del mismo tipo.', false, 'Un ensayo puede combinar párrafos expositivos, argumentativos y conclusivos según la sección.'),
    qMC('Párrafo que define un concepto:', ['Narrativo','Definición o expositivo-definitorio','Argumentativo','Comparativo'], 1, 'Definición: explica qué es algo, sus características y, a veces, su clasificación.'),
    qTF('Conocer los tipos de párrafos ayuda a escribir textos variados.', true, 'Permite elegir la estructura más adecuada según lo que quieras comunicar.'),
    qMC('Para escribir un buen párrafo se necesita:', ['Suerte','Planificar la idea y desarrollarla con orden y coherencia','Inspiración divina','Copiar de internet'], 1, 'Planificación + desarrollo coherente. La buena escritura es técnica + práctica.'),
  ],

  // ===== M99: El proceso de escritura =====
  [
    qMC('¿Cuáles son las etapas del proceso de escritura?', ['Solo escribir','Planificar, redactar (borrador), revisar, corregir y publicar','Solo pensar','No hay etapas'], 1, 'Proceso completo: planear → escribir → revisar → corregir → publicar. No solo "escribir de una".'),
    qTF('La lluvia de ideas es una técnica de planificación.', true, 'Generar ideas sin filtro inicial. Luego se organizan y seleccionan las mejores.'),
    qMC('¿Qué se hace en la etapa de revisión?', ['Escribir más rápido','Leer lo escrito, detectar errores y mejorar la redacción','Publicar inmediatamente','Borrar todo'], 1, 'Revisar = lectura crítica. Detectar: coherencia, cohesión, ortografía, precisión y claridad.'),
    qTF('El borrador es la versión final, lista para publicar.', false, 'Borrador = versión preliminar, imperfecta. Sirve para plasmar ideas que luego se pulirán.'),
    qMC('¿Por qué es importante hacer un esquema antes de escribir?', ['Porque lo pide el maestro','Para organizar las ideas y dar estructura lógica al texto','No sirve','Por obligación'], 1, 'Esquema = mapa del texto. Ayuda a no perderse y a mantener coherencia y orden.'),
    qMC('Recomendación para la etapa de redacción:', ['Escribir sin parar sin importar errores','Escribir con calma, párrafo por párrafo, siguiendo el esquema','No escribir','Solo dictar'], 1, 'Redactar siguiendo el plan. No obsesionarse con perfección en primer borrador; ya se revisará.'),
    qTF('Corregir solo significa buscar faltas de ortografía.', false, 'También: mejorar vocabulario, ajustar tono, verificar datos, simplificar oraciones y asegurar claridad.'),
    qMC('¿Quién puede revisar tu texto?', ['Solo el profesor','Tú mismo, un compañero, un familiar o un tutor','Solo una IA','Nadie'], 1, 'Múltiples ojos: auto-revisión + revisión externa. Diferentes perspectivas mejoran el texto.'),
    qTF('Leer el texto en voz alta ayuda a detectar problemas.', true, 'Al oírlo, fluye (o no). Detectas repeticiones, frases torpes y problemas de ritmo.'),
    qMC('Último paso antes de "publicar" (entregar):', ['Guardar sin ver','Revisión final: ortografía, formato, datos y presentación','Agregar más errores','No hacer nada'], 1, 'Lista de verificación final: ¿está completo? ¿sin errores? ¿presentación adecuada?'),
    qTF('Un buen escritor nace, no se hace: la práctica no importa.', false, 'La escritura se ENTRENA. Leer mucho, escribir seguido y revisar conscientemente mejora con práctica.'),
    qMC('Consejo esencial para escribir bien:', ['No leer nunca','Leer mucho, escribir con frecuencia y revisar siempre','Solo usar corrector','Copiar ideas ajenas'], 1, 'Lectura = modelo. Escritura frecuente = práctica. Revisión = pulido. Tríada del escritor.'),
  ],

  // ===== M100: Gran Repaso Final de Español =====
  [
    qMC('Las palabras AGUDAS llevan tilde cuando terminan en:', ['r, l, d','n, s o vocal','Cualquier consonante','Solo vocal'], 1, 'CanCIÓN (n), comPÁS (s), caFÉ (vocal). Regla fundamental de acentuación.'),
    qTF('"Perro" es un sustantivo común, concreto e individual.', true, 'Común (no propio), concreto (se puede tocar), individual (un solo animal).'),
    qMC('El verbo en "Ojalá LLUEVA mañana" está en modo:', ['Indicativo','Subjuntivo','Imperativo','Condicional'], 1, 'Subjuntivo: expresa deseo. "Ojalá" siempre rige subjuntivo.'),
    qTF('Los textos argumentativos buscan informar objetivamente sin opinar.', false, 'Los argumentativos buscan PERSUADIR con opiniones respaldadas. Los informativos son los que transmiten datos sin opinar.'),
    qMC('¿Cuál es un sinónimo adecuado de "comenzar"?', ['Terminar','Empezar o iniciar','Correr','Dormir'], 1, '"Comenzar" = empezar, iniciar. Son sinónimos totales.'),
    qMC('"Compré pan, leche y huevos." La coma sirve para:', ['Terminar la oración','Separar los elementos de una enumeración','Hacer una pausa dramática','Separar sujeto y predicado'], 1, 'La coma enumerativa separa elementos de una lista.'),
    qTF('Gabriel García Márquez escribió "Cien años de soledad", obra del realismo mágico.', true, '1967. Obra cumbre que combina realidad y elementos fantásticos con naturalidad.'),
    qMC('¿Qué es un pronombre?', ['Verbo principal','Palabra que sustituye al sustantivo','Adjetivo calificativo','Conjunción'], 1, 'Pronombre = en lugar del nombre. "Ella canta" evita repetir "María canta".'),
    qTF('La lectura frecuente mejora la ortografía sin necesidad de estudiar reglas.', false, 'La lectura ayuda, pero CONOCER las reglas + LEER es la combinación perfecta.'),
    qMC('¿Qué es una oración compuesta?', ['Oración muy corta','Oración con dos o más verbos conjugados','Oración sin sujeto','Solo oraciones en pasado'], 1, '"Quiero QUE VENGAS" tiene dos verbos. Es compuesta por subordinación.'),
    qTF('Octavio Paz es el único mexicano con Premio Nobel de Literatura.', true, 'Lo ganó en 1990. Su obra poética y ensayística renovó la literatura en español.'),
    qMC('Para escribir bien es fundamental:', ['Escribir rápido sin pensar','Leer mucho, planificar y revisar','No leer nunca','Copiar todo'], 1, 'LECTURA te da modelos. PLANIFICAR organiza ideas. REVISAR pule el texto. Práctica hace al escritor.'),
  ],
];

/* ================================================================
   UPLOAD A FIRESTORE
   ================================================================ */
async function seedMundo(nombre, misiones) {
  console.log(`Subiendo ${nombre}: ${misiones.length} misiones...`);
  let totalPreguntas = 0;
  for (let i = 0; i < misiones.length; i++) {
    const misionId = `${nombre}-m${String(i+1).padStart(3,'0')}`;
    const preguntas = misiones[i];
    totalPreguntas += preguntas.length;
    await db.collection('mundos').doc(nombre).collection('misiones').doc(misionId).set({
      missionNumber: i + 1,
      subject: nombre,
      title: `Misión ${i+1} - ${nombre}`,
      questions: preguntas,
      totalQuestions: preguntas.length,
      xpReward: 50 + (i * 2),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    if ((i+1) % 10 === 0) console.log(`  ${i+1}/${misiones.length} misiones subidas (${totalPreguntas} preguntas)...`);
  }
  console.log(`✅ ${nombre}: ${misiones.length} misiones, ${totalPreguntas} preguntas TOTAL.`);
}

(async () => {
  try {
    const mundo = args.mundo || 'espanol';
    if (mundo === 'espanol' || mundo === 'todas') {
      await seedMundo('espanol', ESPANOL_MISIONES);
    }
    console.log('🎉 SEED COMPLETADO.');
    process.exit(0);
  } catch(e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
