/* ================================================================
   TRIVIVERSO - Seed Matemáticas | Temario SEP 5° y 6° México
   100 misiones × 12 preguntas ÚNICAS cada una
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
  return { type: 'write', prompt, answersAccepted, explanation: [] };
}

const MATE_MISIONES = [
  // ===== M1: Números naturales - Lectura y escritura =====
  [
    qMC('¿Cómo se escribe el número 3,508 en palabras?', ['Tres mil quinientos ocho','Tres mil cincuenta y ocho','Treinta y cinco mil ocho','Trescientos cincuenta y ocho'], 0, 'Se lee por grupos: 3 (tres mil) + 500 (quinientos) + 8 (ocho) = tres mil quinientos ocho.'),
    qMC('El valor del dígito 7 en el número 47,352 es:', ['7,000 (unidades de millar)','700','70','7'], 0, 'En 47,352: 4=40,000, 7=7,000, 3=300, 5=50, 2=2. Cada posición vale 10 veces más.'),
    qMC('En el número 8,326,591: ¿qué dígito está en las centenas de millar?', ['3 (centenas de millar = 300,000)','8','2','5'], 0, '8=unidades millón, 3=centenas de millar, 2=decenas de millar, 6=unidades de millar.'),
    qMC('¿Cuál es el número "novecientos cinco mil cuarenta"?', ['905,040','950,040','905,400','9,050,040'], 0, '900,000 + 5,000 + 40 = 905,040.'),
    qMC('El número 2,304,567 se lee:', ['Dos millones trescientos cuatro mil quinientos sesenta y siete','Dos mil trescientos cuatro','Veintitrés mil cuatrocientos','Doscientos treinta mil'], 0, '2=millones, 304=mil, 567=unidades. Separar en grupos de 3 dígitos desde la derecha.'),
    qMC('En el sistema decimal, cada posición a la izquierda vale:', ['10 veces más que la posición anterior','5 veces más','100 veces más','Lo mismo'], 0, 'Unidades (×1), decenas (×10), centenas (×100), millares (×1,000)... cada paso ×10.'),
    qMC('¿Qué dígito representa las unidades de millón en 4,832,651?', ['4 (unidades de millón)','8','3','2'], 0, 'De izquierda: 4=U.Millón, 8=C.Millar, 3=D.Millar, 2=U.Millar, 6=Centenas, 5=Decenas, 1=Unidades.'),
    qTF('El número 1,050 se lee "mil cincuenta".', true, '1,000 + 50 = 1,050. Correcto: mil cincuenta. El cero en las centenas no se menciona.'),
    qMC('¿Qué número es mayor: CMXCIX o 1,000? (CMXCIX = 999 en romano)', ['1,000','CMXCIX','Son iguales','No se puede comparar'], 0, 'CMXCIX = 1,000-100 + 100-1+10 = 999. 1,000 > 999.'),
    qMC('En la vida diaria usamos números grandes para:', ['Población de ciudades, presupuestos, distancias planetarias','Solo contar monedas','Solo las matemáticas de escuela','No se usan nunca'], 0, 'México tiene ~130 millones de habitantes. Presupuesto nacional en miles de millones. Números grandes en todas partes.'),
    qOrder('Ordena estos números de menor a mayor:', ['25,408','125,000','1,250,000','12,500,000'], 'Comparas primero el número de dígitos y luego el primer dígito de izquierda a derecha.'),
    qWrite('Escribe con dígitos: "cinco millones doscientos mil"', ['5200000','5,200,000','5200000'], '5,000,000 + 200,000 = 5,200,000.'),
  ],

  // ===== M2: Suma y resta con números grandes =====
  [
    qMC('La propiedad conmutativa de la suma dice:', ['El orden de los sumandos no altera la suma (a+b = b+a)','Solo se suma en un orden','No existe esa propiedad','Siempre da cero'], 0, '3+7 = 7+3 = 10. La resta NO es conmutativa: 7-3 ≠ 3-7.'),
    qMC('Para sumar 45,678 + 32,549:', ['Sumas unidades, decenas, centenas... alineando por la derecha, llevando si es necesario','Multiplicas todos los dígitos','No se puede hacer mentalmente','Restas en su lugar'], 0, 'Alinea verticalmente: 45,678+32,549=78,227. Suma columna por columna.'),
    qMC('Si tienes 15,000 pesos y gastas 8,350, ¿cuánto queda?', ['6,650 pesos','7,350 pesos','23,350 pesos','6,750 pesos'], 0, '15,000 - 8,350 = 6,650. Puedes comprobarlo: 6,650 + 8,350 = 15,000.'),
    qMC('En una resta, el número del que se quita se llama:', ['Minuendo','Sustraendo','Diferencia','Producto'], 0, 'Minuendo - Sustraendo = Diferencia. En 15 - 8 = 7: 15=minuendo, 8=sustraendo, 7=diferencia.'),
    qMC('El elemento neutro de la suma es:', ['El 0 (sumar 0 no cambia el número)','El 1','El 10','El número mismo'], 0, '5+0=5, 100+0=100. El cero es la identidad aditiva.'),
    qTF('La resta tiene la propiedad conmutativa: a-b = b-a.', false, '10-3=7 pero 3-10=-7. La resta NO es conmutativa. Sí es anticonmutativa: a-b = -(b-a).'),
    qMC('¿Cómo compruebas que 9,876 + 5,432 = 15,308?', ['Restas: 15,308 - 5,432 = 9,876 o 15,308 - 9,876 = 5,432','Multiplicando','Dividiendo','No se puede comprobar'], 0, 'La suma y la resta son operaciones inversas. Verificar una con la otra.'),
    qMC('¿Cuánto es 100,000 - 45,678?', ['54,322','55,322','64,322','44,322'], 0, '100,000 - 45,678 = 54,322. Presta atención a los ceros al restar.'),
    qMC('Estimar 6,789 + 4,321 es aproximadamente:', ['11,000','10,000','12,000','6,000'], 0, '6,789≈7,000; 4,321≈4,000. 7,000+4,000=11,000. Valor exacto: 11,110. Buen estimado.'),
    qMC('Para resolver 34,567 + 28,945 mentalmente:', ['Agrupas: (34,000+28,000) + (567+945) = 62,000 + 1,512 = 63,512','No se puede hacer mentalmente','Usas calculadora','Multiplicas'], 0, 'Separa miles y unidades. Suma fácil y rápida mente.'),
    qMatch('Relaciona cada operación con su resultado:', [{left:'25,000 + 37,500',right:'62,500'},{left:'100,000 - 45,000',right:'55,000'},{left:'1,000,000 - 250,000',right:'750,000'},{left:'87,350 + 12,650',right:'100,000'}], 'Practica operaciones con números grandes que aparecen en presupuestos o noticias.'),
    qOrder('Ordena estos pasos para restar 1,000 - 687:', ['Alinear por columnas','Restar unidades (0-7, pedir prestado)','Restar decenas (9-8 tras préstamo)','Restar centenas (9-6 tras préstamo)','Resultado: 313'], 'Al restar con ceros pides "prestado" al vecino de la izquierda que valga 10 veces más.'),
  ],

  // ===== M3: Multiplicación - Conceptos y propiedades =====
  [
    qMC('La multiplicación 6 × 8 significa:', ['Sumar 6 veces el 8 (o 8 veces el 6): 8+8+8+8+8+8 = 48','Dividir 6 entre 8','Elevar 6 a la 8','Sumar 6+8'], 0, 'Multiplicar es suma repetida. 6 grupos de 8 objetos = 48 objetos en total.'),
    qMC('La propiedad conmutativa de la multiplicación:', ['a×b = b×a (7×3 = 3×7 = 21)','No existe','Siempre da cero','Solo funciona con números pares'], 0, 'El orden de los factores no altera el producto. ¡Como la suma!'),
    qMC('Multiplicar por 10, 100 o 1,000 equivale a:', ['Agregar 1, 2 o 3 ceros al número original (o mover el punto decimal a la derecha)','Restar ceros','Dividir','No cambia nada'], 0, '57×10=570, 57×100=5,700, 57×1,000=57,000.'),
    qMC('El elemento neutro de la multiplicación es:', ['El 1 (multiplicar por 1 no cambia el valor)','El 0','El 10','El número mismo'], 0, '9×1=9, 1,000×1=1,000. El 1 es la identidad multiplicativa.'),
    qMC('Multiplicar por 0 siempre da:', ['Cero (cualquier número × 0 = 0)','El mismo número','1','Infinito'], 0, 'Propiedad de absorción del cero: 5×0=0, 1,000,000×0=0.'),
    qMC('La propiedad distributiva dice:', ['a×(b+c) = a×b + a×c (3×(4+5) = 3×4 + 3×5 = 12+15 = 27)','Solo se multiplica directo','No existe','Es muy complicada'], 0, 'Distributiva: multiplicar una suma = multiplicar cada sumando y sumar. Muy útil para cálculo mental.'),
    qTF('La multiplicación tiene la propiedad asociativa: (a×b)×c = a×(b×c).', true, '(2×3)×4 = 6×4 = 24. 2×(3×4) = 2×12 = 24. Mismo resultado.'),
    qMC('Para multiplicar 25 × 36 mentalmente:', ['25×36 = (25×30) + (25×6) = 750 + 150 = 900','Solo con calculadora','Es imposible','Solo se puede con papel'], 0, 'Distributiva en acción: separa en decenas y unidades.'),
    qMC('El doble y el triple son casos de multiplicación:', ['Doble = ×2, Triple = ×3','Doble = +2, Triple = +3','No tienen relación con multiplicar','Solo existen en problemas'], 0, 'Doble de 150 = 300. Triple de 150 = 450.'),
    qOrder('Ordena estos pasos para multiplicar 23 × 15:', ['23×10 = 230','23×5 = 115','Sumar: 230+115 = 345','Resultado final: 345'], 'Descomponer 15 como 10+5. Distributiva: 23×15 = 23×10 + 23×5.'),
    qMatch('Relaciona cada multiplicación con su resultado:', [{left:'50×20',right:'1,000'},{left:'125×8',right:'1,000'},{left:'250×4',right:'1,000'},{left:'500×2',right:'1,000'}], 'Muchas combinaciones dan 1,000. Conocerlas ayuda al cálculo mental.'),
    qWrite('¿Cuánto es 99 × 11? (usa el truco de 100-1)', ['1089'], '99×11 = (100-1)×11 = 1,100-11 = 1,089.'),
  ],

  // ===== M4: División - Conceptos y algoritmo =====
  [
    qMC('La división 56 ÷ 8 significa:', ['Repartir 56 en 8 grupos iguales (o cuántas veces cabe 8 en 56)','Sumar 56+8','Multiplicar 56×8','Restar 56-8'], 0, 'Dividir es repartir equitativamente. 56÷8=7 porque 8×7=56.'),
    qMC('En la división: Dividendo ÷ Divisor = Cociente y sobra Residuo. Si 50÷6:', ['Cociente=8, Residuo=2','Cociente=7, Residuo=8','Cociente=6, Residuo=0','Cociente=9, Residuo=1'], 0, '6×8=48, sobran 2. Residuo debe ser MENOR que el divisor.'),
    qMC('La división NO es conmutativa porque:', ['15÷3=5 pero 3÷15≠5','Sí es conmutativa','No funciona con números grandes','Es demasiado difícil'], 0, 'El orden SÍ importa en división: a÷b ≠ b÷a.'),
    qMC('Dividir entre 1 da:', ['El mismo número (a÷1 = a)','Cero','1','No se puede dividir entre 1'], 0, '8÷1=8, 100÷1=100. Entre 1 no cambia nada.'),
    qTF('Todos los divisores dan el mismo resultado.', false, 'Entre 2 = mitad. Entre 4 = cuarta parte. Cada divisor da resultado distinto.'),
    qMC('Para comprobar una división:', ['Multiplicas Cociente × Divisor + Residuo = Dividendo','Sumas todo','No se puede comprobar','Divides otra vez'], 0, 'Ej: 50÷6=8 R2. Comprobación: 8×6+2=48+2=50.'),
    qMC('¿Qué significa "división exacta"?', ['Cuando el residuo es CERO (el divisor cabe exactamente)','Cuando el resultado es decimal','Cuando no se puede dividir','Siempre es exacta'], 0, '24÷6=4 R0. 25÷6=4 R1. La primera es exacta, la segunda no.'),
    qMC('Repartir 1,000 pesos entre 8 personas:', ['1,000÷8 = 125 pesos cada persona','1,000÷8 = 80 pesos','1,000÷8 = 200 pesos','No se puede repartir'], 0, '8×125=1,000. Reparto exacto.'),
    qOrder('Ordena los pasos para dividir 864 ÷ 6:', ['864 entre 6: 8÷6=1, sobra 2','Baja el 6: 26÷6=4, sobra 2','Baja el 4: 24÷6=4, sobra 0','Resultado: 144'], 'División larga: divide, multiplica, resta, baja el siguiente dígito.'),
    qMatch('Relaciona la división con su resultado:', [{left:'100÷4',right:'25'},{left:'1,000÷8',right:'125'},{left:'144÷12',right:'12'},{left:'256÷16',right:'16'}], 'Divisiones comunes que aparecen en problemas cotidianos.'),
    qMC('Si 420 alumnos se reparten en 15 grupos iguales, cada grupo tiene:', ['28 alumnos','30 alumnos','42 alumnos','15 alumnos'], 0, '420÷15=28. Verifica: 15×28=420.'),
    qWrite('¿Cuánto es 10,000 ÷ 25?', ['400'], '25×400=10,000.'),
  ],

  // ===== M5: Cálculo mental - Estrategias =====
  [
    qMC('Para sumar 99 + 47 mentalmente:', ['Sumar 100+47=147 y restar 1 = 146','Hacer la suma normal con papel','Es imposible sin calculadora','Multiplicar en vez de sumar'], 0, 'Redondear al próximo número fácil (99→100) y ajustar después. Estrategia poderosa.'),
    qMC('El truco de "multiplicar por 5" se puede hacer:', ['Dividiendo entre 2 y multiplicando por 10 (o viceversa). 5×34 = (34÷2)×10 = 17×10 = 170','Solo con memorización','Usando decimales','Es imposible mentalmente'], 0, '×5 = (×10)÷2. O alternativamente: ×5 = (÷2)×10.'),
    qMC('Para restar 10,000 - 6,789:', ['Resta complementando: 6,789+211=7,000, +3,000=10,000, total 3,211','No se puede mentalmente','Solo en papel','Ignorar los ceros'], 0, 'Suma hacia arriba desde el menor hasta llegar al mayor. Método de "complemento".'),
    qMC('9×6 se puede calcular como:', ['(10×6) - (1×6) = 60-6 = 54','9+6','9÷6','No tiene truco'], 0, 'Distributiva con números cercanos a decenas: 9 = 10-1.'),
    qTF('La estimación es una herramienta de cálculo mental válida para la vida diaria.', true, 'Estimar ≈ resultado aproximado. Útil para compras, presupuestos rápidos y verificar que una calculadora no tenga error grosero.'),
    qMC('Para calcular 15% de 200:', ['10%=20, 5%=10. Total=30. O 200×0.15=30','Multiplicar 15×200','No se pueden calcular porcentajes mentalmente','Dividir entre 15'], 0, 'Porcentajes: separa en partes fáciles (10% + 5%).'),
    qMC('25×18 se puede calcular como:', ['25×18 = (100÷4)×18 = 1,800÷4 = 450','Solo con calculadora','No hay atajo','Es demasiado difícil'], 0, 'Si sabes que 25=100/4, divides entre 4 después de multiplicar por 100.'),
    qMC('Para verificar rápidamente si una división es correcta:', ['Redondea y estima: 1,234÷11 ≈ 1,200÷12=100','No se puede verificar','Hay que rehacerla completa','Ignorar la verificación'], 0, 'El resultado exacto 112.18... cercano a 100. La estimación confirma que no hay error grave.'),
    qOrder('Ordena estas operaciones para calcular 68+29 mentalmente:', ['68+30 = 98 (redondear 29 a 30)','98-1 = 97 (ajustar)','Resultado: 97'], 'Sumar números cercanos a decenas: redondear hacia arriba y restar el excedente.'),
    qMatch('Relaciona el problema con su truco mental:', [{left:'99×8',right:'(100-1)×8 = 792'},{left:'25×36',right:'(100÷4)×36 = 900'},{left:'12×15',right:'12×10 + 12×5 = 180'},{left:'÷5',right:'(×10)÷2'}], 'Conocer múltiples estrategias da flexibilidad para resolver de la forma más rápida.'),
    qMC('Para multiplicar un número por 11:', ['Suma los dígitos y pon el resultado en medio. 23×11=253 (2+3=5)','No hay truco','Es demasiado difícil','Solo es posible con calculadora'], 0, 'Truco para 2 dígitos: 42×11=462 (4+2=6 en medio). Si la suma >9, llevas 1.'),
    qWrite('Calcula mentalmente: 25 × 32', ['800'], '25=100/4. 32÷4=8. 8×100=800. O 25×32 = 25×4×8 = 100×8 = 800.'),
  ],
  // ===== M6: Fracciones - Conceptos y equivalencias =====
  [
    qMC('Una fracción como 3/4 representa:', ['3 partes de un total de 4 partes iguales','3+4','3-4','4/3 es lo mismo'], 0, 'El numerador (3) = partes tomadas. El denominador (4) = partes totales en que se divide.'),
    qMC('¿Qué fracción es equivalente a 1/2?', ['2/4, 3/6, 4/8, 5/10... (multiplicar numerador y denominador por el mismo número)','2/3','1/3','3/4'], 0, 'Fracciones equivalentes: representan la MISMA cantidad. 1/2 = 2/4 = 3/6 = 50/100.'),
    qMC('Simplificar 8/12 significa:', ['Dividir numerador y denominador entre su MCD (4). 8/12 = 2/3','Multiplicar por 2','Sumar 4','Dejarlo igual'], 0, 'Simplificar = reducir a su mínima expresión. 8÷4=2, 12÷4=3. Resultado 2/3.'),
    qMC('Comparar 3/5 y 2/3:', ['Convierte a común denominador: 3/5=9/15, 2/3=10/15. 2/3 > 3/5','Son iguales','3/5 es mayor','No se pueden comparar'], 0, 'Para comparar fracciones con distinto denominador, busca el mcm de los denominadores.'),
    qMC('Una fracción impropia como 7/4:', ['Tiene el numerador MAYOR que el denominador (>1 entero)','Es menor que 0','No existe','Siempre es negativa'], 0, '7/4 = 1 entero + 3/4. Las fracciones propias tienen numerador menor que denominador.'),
    qMC('Convertir número mixto 2 3/5 a fracción:', ['Multiplica entero×denominador + numerador: 2×5+3 = 13. 13/5','2+3+5=10','2×3×5=30','No se puede'], 0, '2 3/5 = (2×5+3)/5 = 13/5. El número mixto expresa enteros + fracción.'),
    qTF('1/2 y 50/100 representan la MISMA cantidad.', true, 'Son fracciones equivalentes. 50/100 simplificado (÷50) = 1/2.'),
    qOrder('Ordena estas fracciones de menor a mayor:', ['1/4 (0.25)','1/3 (0.33)','1/2 (0.5)','3/4 (0.75)'], 'Con numerador igual, a MAYOR denominador, MENOR valor.'),
    qMatch('Relaciona cada fracción con su equivalente:', [{left:'1/2',right:'2/4 = 3/6 = 50/100'},{left:'1/4',right:'2/8 = 25/100'},{left:'3/4',right:'6/8 = 75/100'},{left:'1/3',right:'2/6 = 3/9'}], 'Conocer equivalentes facilita comparar y operar con fracciones.'),
    qMC('¿Qué fracción de una pizza queda si se comieron 3/8?', ['5/8 (1 - 3/8 = 8/8 - 3/8 = 5/8)','3/8','8/3','1/8'], 0, 'El entero = 1 = 8/8. Quedan 5/8 de pizza.'),
    qMC('Suma de fracciones con igual denominador: 2/7 + 3/7 =', ['5/7','6/7','5/14','1/7'], 0, 'Mismo denominador: solo suma numeradores y conserva denominador.'),
    qWrite('¿3/4 es mayor o menor que 5/6? Escribe "mayor" o "menor"', ['menor'], '3/4=9/12, 5/6=10/12. 10/12 > 9/12.'),
  ],

  // ===== M7: Suma y resta de fracciones =====
  [
    qMC('Para sumar 2/5 + 1/5:', ['Suman los numeradores (2+1=3) y se mantiene denominador 5 = 3/5','Se suman numeradores y denominadores','No se puede sumar','Se multiplican'], 0, 'Con MISMO denominador: suma directa de numeradores. 2/5+1/5=3/5.'),
    qMC('Para sumar 1/3 + 1/4:', ['Buscar común denominador (mcm=12): 4/12+3/12=7/12','Sumar directo: 2/7','No se puede','Multiplicar: 1/12'], 0, 'Con DISTINTO denominador: convierte a fracciones equivalentes con el mismo denominador.'),
    qMC('El mcm (mínimo común múltiplo) de 6 y 8 es:', ['24 (múltiplos de 6: 6,12,18,24... de 8: 8,16,24...)','48','12','2'], 0, 'mcm: el número más pequeño que es múltiplo de ambos. Sirve como denominador común.'),
    qMC('Resultado de 3/4 - 1/8:', ['6/8 - 1/8 = 5/8','2/4','3/8','No se puede restar'], 0, '3/4=6/8. 6/8-1/8=5/8. Siempre iguala denominadores primero.'),
    qMC('Para sumar números mixtos 2 1/2 + 1 1/4:', ['Puedes sumar enteros (2+1=3) y fracciones (2/4+1/4=3/4). Resultado: 3 3/4','No se puede','Solo se suman enteros','Da 4 enteros'], 0, 'Alternativa: convertir a fracciones impropias primero.'),
    qTF('Para restar fracciones SIEMPRE necesitas el mismo denominador.', true, 'Si tienen distinto denominador, conviértelas a equivalentes con mismo denominador.'),
    qOrder('Ordena los pasos para sumar 2/3 + 3/5:', ['Hallar mcm(3,5)=15','Convertir: 2/3=10/15, 3/5=9/15','Sumar: 10/15+9/15=19/15','Simplificar: 1 4/15'], 'Proceso sistemático que funciona para cualquier suma de fracciones.'),
    qMatch('Relaciona la operación con su resultado:', [{left:'1/2+1/3',right:'5/6'},{left:'3/4-1/2',right:'1/4'},{left:'2/3+1/6',right:'5/6'},{left:'7/8-3/8',right:'1/2'}], 'Practica el proceso de: común denominador → operar → simplificar.'),
    qMC('Si compras 3/4 kg de queso y usas 1/3 kg, ¿cuánto queda?', ['9/12 - 4/12 = 5/12 kg','Sobra 1/2 kg','No queda nada','2/4 kg'], 0, 'Problema cotidiano: fracciones en la cocina, compras y reparticiones.'),
    qMC('1/2 + 1/4 + 1/8 =', ['4/8+2/8+1/8=7/8','3/14','1 1/2','No se puede'], 0, 'Común denominador 8. Suma secuencial de fracciones.'),
    qWrite('¿Cuánto es 5/6 - 1/2? Expresa como fracción simplificada', ['1/3'], '1/2=3/6. 5/6-3/6=2/6=1/3.'),
    qWrite('¿Cuánto es 7/8 - 1/4? Simplifica.', ['5/8'], '1/4=2/8. 7/8-2/8=5/8.'),
  ],

  // ===== M8: Multiplicación de fracciones =====
  [
    qMC('Para multiplicar 2/3 × 4/5:', ['Multiplicar numeradores (2×4=8) y denominadores (3×5=15): 8/15','Sumar: 2/3+4/5','No se puede','Solo multiplicar numeradores'], 0, 'Multiplicar fracciones = numerador×numerador / denominador×denominador. ¡Más fácil que sumar!'),
    qMC('Multiplicar una fracción por un entero: 5 × 2/3:', ['5 = 5/1, multiplicas: (5×2)/(1×3) = 10/3 = 3 1/3','5+2+3=10','No se puede','Da 7/3'], 0, 'Todo entero es una fracción con denominador 1.'),
    qMC('"De" en problemas de fracciones significa:', ['MULTIPLICAR. "Calcular 2/3 DE 60" = 2/3 × 60 = 40','Sumar','Dividir','Nada especial'], 0, '"La mitad de" = ×1/2. "Un tercio de" = ×1/3.'),
    qMC('3/4 de 200 pesos es:', ['200 × 3/4 = 600/4 = 150 pesos','50 pesos','300 pesos','75 pesos'], 0, 'Divide entre 4 (50) y multiplica por 3 = 150.'),
    qTF('Multiplicar fracciones es más complicado que sumarlas.', false, 'Multiplicar es DIRECTO: numerador×numerador, denominador×denominador. No necesitas común denominador.'),
    qMC('(2/3) × (3/4) =', ['6/12 = 1/2','5/7','6/4','2/4'], 0, '2×3=6, 3×4=12. Simplifica: 6/12=1/2.'),
    qMC('La mitad de la mitad es:', ['1/2 × 1/2 = 1/4 (un cuarto)','1/2','1','2/2'], 0, '"De" = multiplicar. Mitad de mitad = cuarta parte.'),
    qOrder('Ordena los pasos para calcular 3/5 de 100:', ['Multiplica 100 × 3 = 300','Divide 300 ÷ 5 = 60','Resultado: 60'], 'Fracción DE cantidad: divide por denominador y multiplica por numerador (o viceversa).'),
    qMatch('Relaciona la fracción con su multiplicación:', [{left:'1/2 de 50',right:'25'},{left:'2/3 de 90',right:'60'},{left:'3/4 de 48',right:'36'},{left:'1/5 de 100',right:'20'}], 'Calcular fracción de cantidad es operación MUY frecuente en descuentos y recetas.'),
    qMC('En una clase de 30 alumnos, 2/3 son niñas:', ['2/3 × 30 = 60/3 = 20 niñas','15 niñas','10 niñas','No se puede saber'], 0, 'Problemas contextualizados: aplicar fracciones a situaciones reales.'),
    qWrite('¿Cuánto es 5/6 × 12? Da resultado exacto', ['10'], '12 × 5/6 = 60/6 = 10. O: 12÷6=2, ×5=10.'),
    qWrite('¿Cuánto es 2/5 × 15? Simplifica.', ['6'], '2/5×15=30/5=6.'),
  ],

  // ===== M9: División de fracciones =====
  [
    qMC('Para dividir 3/4 ÷ 2/5:', ['Multiplica cruzado: 3×5=15 (numerador), 4×2=8 (denominador) = 15/8','Solo se multiplica directo','No se puede dividir','Da 6/20'], 0, 'Dividir fracciones = multiplicar por el RECÍPROCO. 3/4 × 5/2 = 15/8.'),
    qMC('El recíproco de 2/3 es:', ['3/2 (se invierte el numerador y el denominador)','2/3 igual','3/3','1/3'], 0, 'Dividir por una fracción = multiplicar por su recíproco. a/b ÷ c/d = a/b × d/c.'),
    qMC('Dividir 6 ÷ 2/3:', ['6/1 × 3/2 = 18/2 = 9','4','No se puede','6 × 2/3 = 4'], 0, 'Dividir entre una fracción = el resultado es MAYOR si la fracción es <1.'),
    qMC('¿Cuántas mitades (1/2) hay en 3 enteros?', ['3 ÷ 1/2 = 3 × 2/1 = 6 mitades','1.5','No se puede','3'], 0, 'Dividir entre una fracción responde: ¿cuántas veces cabe la fracción en el número?'),
    qTF('Dividir entre un número menor que 1 da un resultado MENOR.', false, 'Dividir entre un número entre 0 y 1 MULTIPLICA el resultado. 10 ÷ 0.5 = 20.'),
    qOrder('Ordena los pasos para dividir 2/3 ÷ 3/4:', ['Invertir el divisor: recíproco de 3/4 = 4/3','Multiplicar: 2/3 × 4/3 = 8/9','Resultado: 8/9'], 'Mecanismo simple: invierte el divisor y multiplica.'),
    qMatch('Relaciona la división con su resultado:', [{left:'1/2 ÷ 1/4',right:'2'},{left:'3/4 ÷ 1/2',right:'3/2 = 1 1/2'},{left:'2 ÷ 1/3',right:'6'},{left:'5/6 ÷ 5/6',right:'1'}], 'Dividir fracciones: concepto que aparece en recetas y proporciones.'),
    qMC('Para repartir 3/4 de pizza entre 2 personas:', ['3/4 ÷ 2 = 3/4 × 1/2 = 3/8 para cada uno','1/2 cada uno','No alcanza','6/4 cada uno'], 0, 'Dividir entre 2 = multiplicar por 1/2.'),
    qMC('Dividir entre 1/4 equivale a:', ['Multiplicar por 4','Multiplicar por 1/4','Dividir entre 4','No cambia nada'], 0, '÷(1/4) = ×4. Dividir por la cuarta parte = ver cuánto es 4 veces.'),
    qWrite('¿Cuánto es 4/5 ÷ 2? Simplifica', ['2/5'], '4/5 × 1/2 = 4/10 = 2/5.'),
    qTF('Dividir entre una fracción menor que 1 da resultado MAYOR que el dividendo.', true, '5 ÷ 1/2 = 10. Efectivamente es mayor.'),
    qWrite('¿Cuánto es 3 ÷ 1/3?', ['9'], '3 × 3/1 = 9.'),
  ],

  // ===== M10: Números decimales - Décimos, centésimos, milésimos =====
  [
    qMC('El número 0.5 se lee:', ['5 décimos (cinco décimos)','5 centésimos','5 milésimos','50'], 0, 'Primera cifra tras el punto: décimos. Segunda: centésimos. Tercera: milésimos.'),
    qMC('En el número 3.47, el 4 representa:', ['4 décimos (0.4)','4 unidades','4 centésimos','4 milésimos'], 0, 'El dígito en la primera posición tras el punto son décimos.'),
    qMC('0.05 es igual a:', ['5 centésimos (5/100)','5 décimos','5 milésimos','0.5'], 0, 'El 5 está en la posición de centésimos. 0.05 = 5/100 = 5%.'),
    qMC('Comparar 0.7 y 0.69:', ['0.7 > 0.69 (porque 7 décimos = 70 centésimos > 69 centésimos)','Son iguales','0.69 es mayor','No se pueden comparar'], 0, 'Para comparar decimales, iguala el número de cifras añadiendo ceros: 0.70 > 0.69.'),
    qMC('Convertir 3/10 a decimal:', ['0.3 (tres décimos)','3.0','0.03','30'], 0, 'Fracción con denominador 10, 100, 1000 = fácil conversión a decimal.'),
    qTF('Agregar ceros a la derecha de un decimal cambia su valor.', false, '0.5 = 0.50 = 0.500. Los ceros a la DERECHA no cambian el valor.'),
    qMC('0.125 se lee:', ['125 milésimos','125 décimos','125 centésimos','12.5'], 0, 'Tres cifras tras el punto = milésimos.'),
    qOrder('Ordena estos decimales de menor a mayor:', ['0.05','0.5','0.55','0.555'], 'Compara cifra por cifra: 0.05 = 5 centésimos, 0.5 = 5 décimos = 50 centésimos.'),
    qMatch('Relaciona cada fracción con su decimal:', [{left:'1/2',right:'0.5'},{left:'1/4',right:'0.25'},{left:'3/4',right:'0.75'},{left:'1/10',right:'0.1'}], 'Estas conversiones fracción↔decimal son Frecuentes. Apréndelas de memoria.'),
    qMC('Para sumar decimales: 2.5 + 1.75:', ['Alinea el punto decimal: 2.50+1.75=4.25','Suma sin alinear','No se puede','Multiplica'], 0, 'Alinear puntos decimales = alinear unidades con unidades, décimos con décimos.'),
    qWrite('Escribe "doce centésimos" como decimal', ['0.12'], '12/100 = 0.12.'),
    qMC('Para multiplicar un decimal por 100:', ['Mueve el punto decimal DOS lugares a la DERECHA','No se mueve','Se mueve a la izquierda','Se divide'], 0, '0.35×100=35, 1.75×100=175. Muy útil para porcentajes.'),
  ],

  // ===== M11: Suma y resta de decimales =====
  [
    qMC('Para sumar 3.45 + 2.78:', ['Alinea los puntos decimales: 3.45+2.78=6.23','Suma números como enteros e ignora el punto','No se puede hacer sin calculadora','El resultado es 5.13'], 0, 'Alinear puntos decimales asegura sumar unidades con unidades, décimos con décimos y centésimos con centésimos.'),
    qMC('El resultado de 7.8 + 5.64 es:', ['13.44','12.44','13.00','14.44'], 0, '7.80 + 5.64 = 13.44. Completa con ceros para facilitar: 7.80 es igual a 7.8.'),
    qMC('Si compras un lápiz de $12.50 y un cuaderno de $38.75, ¿cuánto pagas en total?', ['$51.25','$50.25','$51.00','$50.75'], 0, '12.50 + 38.75 = 51.25. Problema cotidiano de compras.'),
    qMC('Para restar 8.3 - 4.75:', ['8.30 - 4.75 = 3.55','8.3 - 4.75 = 3.45','No se puede restar directamente','El resultado es 4.55'], 0, 'Convierte 8.3 a 8.30 (mismo valor) para igualar decimales y restar columna a columna.'),
    qMC('¿Cuánto es 15.6 + 0.4?', ['16.0','16.4','15.10','20.0'], 0, '15.6 + 0.4 = 16.0. Los 6 décimos + 4 décimos = 10 décimos = 1 unidad. Se acumula al entero.'),
    qMC('En la resta 10.00 - 3.79:', ['10.00 - 3.79 = 6.21','Es igual a 7.21','No se puede porque hay ceros','El resultado es 6.79'], 0, 'Resta prestando: 0 centésimos - 9 no se puede, pides 1 décimo convertido en 10 centésimos.'),
    qTF('Cuando sumas decimales, siempre debes alinear los puntos decimales.', true, 'Alinear el punto decimal es la regla fundamental para sumar y restar decimales correctamente.'),
    qMC('Estimar 4.89 + 5.12 es aproximadamente:', ['10 (4.89≈5, 5.12≈5, 5+5=10)','9','11','8'], 0, 'Estimación por redondeo: 4.89 se redondea a 5 y 5.12 se redondea a 5. Valor exacto: 10.01.'),
    qOrder('Ordena los pasos para sumar 6.78 + 9.5:', ['Escribir alineando puntos decimales','Añadir cero: 9.5 = 9.50','Sumar centésimos: 8+0=8','Sumar décimos: 7+5=12, llevar 1','Sumar unidades: 6+9+1=16','Resultado: 16.28'], 'Proceso sistemático para sumar decimales con distinto número de cifras decimales.'),
    qMatch('Relaciona cada suma con su resultado:', [{left:'2.5 + 3.75',right:'6.25'},{left:'0.8 + 0.35',right:'1.15'},{left:'12.6 + 7.8',right:'20.4'},{left:'100.5 - 45.25',right:'55.25'}], 'Practica operaciones con decimales usando problemas de dinero y medidas.'),
    qMC('María tenía $50.00 y gastó $18.79 en fruta y $22.50 en verdura. ¿Cuánto le sobra?', ['$8.71','$9.71','$41.21','$8.29'], 0, 'Total gastado: 18.79+22.50=41.29. Sobra: 50.00-41.29=8.71.'),
    qWrite('Calcula: 25.8 + 14.75 - 10.5 = ?', ['30.05'], '25.8+14.75=40.55. 40.55-10.5=30.05. Operaciones combinadas con decimales.'),
  ],

  // ===== M12: Multiplicación de decimales =====
  [
    qMC('Para multiplicar 3.4 × 2.5:', ['Multiplica como enteros (34×25=850) y coloca 2 decimales: 8.50','Suma los números','No se puede multiplicar','El resultado es 7.5'], 0, 'Cuenta los decimales totales (1 en 3.4 + 1 en 2.5 = 2). 34×25=850 → 8.50.'),
    qMC('El producto de 0.6 × 0.3 es:', ['0.18','1.8','0.018','18'], 0, '6×3=18. Decimales totales: 1+1=2. Resultado: 0.18. Siempre cuenta los decimales de ambos factores.'),
    qMC('Multiplicar un decimal por 10 equivale a:', ['Mover el punto decimal una posición a la DERECHA','Mover el punto una posición a la izquierda','Agregar un cero','No cambia nada'], 0, '0.45×10=4.5. Cada multiplicación por 10 desplaza el punto decimal a la derecha.'),
    qMC('Si un kilogramo de manzanas cuesta $39.50, ¿cuánto cuestan 2.5 kg?', ['$98.75','$79.00','$98.50','$99.00'], 0, '39.50×2.5. 3950×25=98750. Decimales: 2+1=3 → 98.750 = $98.75.'),
    qMC('¿Cuánto es 0.05 × 0.4?', ['0.020 (o simplemente 0.02)','0.2','0.002','2.0'], 0, '5×4=20. Decimales: 2+1=3. Resultado: 0.020. Los ceros a la derecha del último decimal se pueden eliminar: 0.02.'),
    qMC('Para multiplicar 12.6 × 1.5:', ['126×15=1890; decimales=1+1=2 → 18.90','Sumas 12.6+1.5','No hay método','El resultado es 18.6'], 0, 'Convierte a enteros temporalmente: ignora puntos, multiplica, cuenta decimales totales y coloca el punto.'),
    qTF('Al multiplicar decimales, el resultado siempre tiene menos decimales que los factores.', false, 'Falso. El número de decimales del producto es la SUMA de los decimales de los factores, no su diferencia.'),
    qMC('Multiplicar por 0.1 equivale a:', ['Dividir entre 10 (mover el punto a la izquierda)','Multiplicar por 10','No cambia nada','Sumar 0.1'], 0, '×0.1 = ÷10. 50×0.1=5. Multiplicar por un decimal menor que 1 reduce el valor.'),
    qOrder('Ordena los pasos para multiplicar 5.25 × 3.6:', ['Ignorar puntos: 525×36','Multiplicar: 525×36=18900','Contar decimales: 2 en 5.25 + 1 en 3.6 = 3','Colocar 3 decimales: 18.900','Eliminar ceros finales: 18.9'], 'Método paso a paso que funciona para cualquier multiplicación de decimales.'),
    qMatch('Relaciona la multiplicación con su producto:', [{left:'3.5 × 2',right:'7.0'},{left:'0.7 × 0.8',right:'0.56'},{left:'4.25 × 4',right:'17.0'},{left:'0.25 × 0.4',right:'0.10'}], 'Multiplicar decimales es fundamental para porcentajes, áreas y conversiones de unidades.'),
    qMC('En una receta se necesita 0.75 kg de harina por pastel. Para 5 pasteles se necesita:', ['3.75 kg','3.25 kg','15.75 kg','0.375 kg'], 0, '0.75×5=3.75. El punto se desplaza: 75×5=375 → 2 decimales = 3.75.'),
    qWrite('¿Cuánto es 0.125 × 8?', ['1'], '125×8=1000. Decimales=3+0=3. 1.000=1. 0.125=1/8, así que 1/8×8=1.'),
  ],

  // ===== M13: División con decimales =====
  [
    qMC('Para dividir 7.5 ÷ 3:', ['7.5÷3=2.5. El punto decimal se sube directamente al cociente','No se puede dividir','El resultado es 0.25','Se ignora el punto'], 0, 'Divide como enteros y sube el punto decimal al cociente. 75÷3=25 con punto en medio: 2.5.'),
    qMC('El resultado de 48.6 ÷ 9 es:', ['5.4','4.86','5.0','6.0'], 0, '48÷9=5 sobran 3. Baja 6: 36÷9=4. Con punto: 5.4. Verifica: 5.4×9=48.6.'),
    qMC('Para dividir 5 ÷ 0.5:', ['5÷0.5=10 (multiplicas ambos por 10: 50÷5=10)','5÷0.5=0.5','No se puede','El resultado es 1'], 0, 'Al dividir entre un decimal: convierte el divisor a entero multiplicando ambos por 10, 100 o 1000.'),
    qMC('Dividir entre 0.1 equivale a:', ['Multiplicar por 10','Dividir entre 10','No cambia nada','Restar 0.1'], 0, '÷0.1 = ×10. 8÷0.1=80. Al dividir entre un número muy pequeño, el cociente es muy grande.'),
    qMC('¿Cuánto es 36 ÷ 1.2?', ['30','3.0','300','36'], 0, 'Multiplica ambos por 10: 360÷12=30. Verifica: 30×1.2=36.'),
    qMC('Para repartir $45.75 entre 3 personas:', ['45.75÷3 = $15.25 para cada uno','$45 cada uno','$12.50','$15.00'], 0, '45÷3=15. 75¢÷3=25¢. Total: $15.25. Reparto equitativo con decimales.'),
    qTF('Dividir entre 0.25 equivale a multiplicar por 4.', true, '÷0.25 = ×4 porque 0.25=1/4. 20÷0.25=80 y 20×4=80.'),
    qMC('El resultado de 0.84 ÷ 0.7 es:', ['1.2','0.12','12','0.012'], 0, 'Multiplica ambos por 100: 84÷70=1.2. O multiplica por 10: 8.4÷7=1.2.'),
    qOrder('Ordena los pasos para dividir 12.5 ÷ 0.25:', ['Multiplicar divisor por 100: 0.25×100=25','Multiplicar dividendo por 100: 12.5×100=1250','Dividir: 1250÷25=50','Resultado: 50'], 'Truco: siempre convierte el divisor a número entero moviendo el punto a la derecha en ambos números.'),
    qMatch('Relaciona cada división con su cociente:', [{left:'7.2 ÷ 3',right:'2.4'},{left:'9 ÷ 0.3',right:'30'},{left:'6.25 ÷ 0.5',right:'12.5'},{left:'15 ÷ 0.75',right:'20'}], 'Dividir con decimales aparece en cambio de moneda, reparticiones y dosificaciones.'),
    qMC('Un listón de 9.6 metros se corta en tramos de 0.8 metros. ¿Cuántos tramos salen?', ['12 tramos','10 tramos','8 tramos','9 tramos'], 0, '9.6÷0.8 = 96÷8=12 tramos. Cada tramo mide 0.8 m.'),
    qWrite('Calcula: 100 ÷ 0.25 = ?', ['400'], '100÷0.25 = 10000÷25 = 400.'),
  ],

  // ===== M14: Operaciones combinadas con decimales =====
  [
    qMC('Para resolver (3.5 + 2.5) × 2:', ['Primero el paréntesis: 6.0×2=12.0','Multiplicar primero: 3.5+5=8.5','No importa el orden','El resultado es 6'], 0, 'Jerarquía de operaciones: 1° Paréntesis, 2° Multiplicación/División, 3° Suma/Resta.'),
    qMC('El resultado de 2.5 × 4 + 8.5 es:', ['18.5','10.5','25.0','12.5'], 0, 'Sin paréntesis: primero multiplica (2.5×4=10), luego suma (10+8.5=18.5). PEMDAS/PAPOMUDAS.'),
    qMC('¿Cuánto es 15 - 2.5 × 3.2?', ['7.0','12.5×3.2=40','6.0','15-8=7'], 0, 'Multiplicación primero: 2.5×3.2=8.0. Luego: 15-8=7. La resta se hace al final.'),
    qMC('En (8 ÷ 0.5) + (3.6 × 2), el orden correcto es:', ['Resuelve paréntesis: 16+7.2=23.2','Suma todo','Multiplica 0.5+3.6','Es indistinto'], 0, 'Dos paréntesis independientes: 8÷0.5=16 y 3.6×2=7.2, luego suma: 23.2.'),
    qMC('Para calcular 20.4 - (6.8 + 3.2) ÷ 2:', ['Paréntesis: 10.0÷2=5. Luego: 20.4-5=15.4','Restar primero','Multiplicar primero','20.4-10=10.4'], 0, 'El paréntesis agrupa: 6.8+3.2=10. 10÷2=5. 20.4-5=15.4.'),
    qMC('Si compras 3 playeras de $149.50 cada una y pagas con $500, ¿cuánto te devuelven?', ['$51.50','$50.50','$350.50','$100.00'], 0, '3×149.50=448.50. 500-448.50=51.50. Operaciones con dinero en contexto real.'),
    qTF('En una expresión sin paréntesis, primero se suman y restan, luego se multiplican.', false, 'Falso. La jerarquía es: paréntesis → multiplicación/división → suma/resta.'),
    qMC('¿Cuánto es 0.5 × (12 + 8.4)?', ['10.2','20.4','1.02','6+4.2=10.2'], 0, 'Paréntesis: 20.4. Luego: 0.5×20.4=10.2. 0.5 es la mitad.'),
    qOrder('Ordena estos pasos para resolver (25 ÷ 2.5) + (3) × (0.8):', ['Resolver primer paréntesis: 25÷2.5=10','Resolver multiplicación: 3×0.8=2.4','Sumar: 10+2.4=12.4'], 'Resuelve cada grupo independientemente, respetando jerarquía, luego combina.'),
    qMatch('Relaciona la expresión con su resultado:', [{left:'(5×2.5) + (10÷4)',right:'15.0'},{left:'18 - (3.6÷0.9)',right:'14.0'},{left:'(4.5+2.5)×3',right:'21.0'},{left:'50÷(2.5-1.5)',right:'50.0'}], 'La jerarquía de operaciones se aplica igual con decimales que con enteros.'),
    qMC('Un comerciante compra 20 kg a $12.50 el kg y vende a $18.00. ¿Ganancia total?', ['$110.00','$100.00','$250.00','$150.00'], 0, 'Costo: 20×12.50=250. Ingreso: 20×18=360. Ganancia: 360-250=110. Problema de negocio real.'),
    qWrite('Calcula: (6.4 × 5) - (8 ÷ 0.25) = ?', ['0'], '32 - 32 = 0. Curiosamente dan lo mismo ambos términos.'),
  ],

  // ===== M15: Decimales en la vida cotidiana =====
  [
    qMC('En México, 1 dólar ≈ 17 pesos. Con 100 pesos, ¿cuántos dólares obtienes aproximadamente?', ['5.88 dólares','17 dólares','170 dólares','1.7 dólares'], 0, '100÷17≈5.88. Conversión de divisas: dividir el monto en pesos por el tipo de cambio.'),
    qMC('Si caminas 1.85 km a la escuela y 1.85 de regreso, ¿cuánto caminas al día?', ['3.7 km','3.5 km','3.0 km','4.0 km'], 0, '1.85+1.85=3.70 km ida y vuelta. Distancias diarias en kilómetros decimales.'),
    qMC('Un tanque de gasolina tiene 42.5 litros. Si gastas 8.75 litros en un viaje, ¿cuánto queda?', ['33.75 litros','34.25 litros','50.0 litros','33.5 litros'], 0, '42.5-8.75=33.75. Problema de combustible con decimales.'),
    qMC('El IMC se calcula: peso(kg) ÷ estatura(m)². Si pesas 65 kg y mides 1.65 m, tu IMC es:', ['23.88 (aprox)','39.4','20.0','25.5'], 0, '65÷(1.65²)=65÷2.7225≈23.9. IMC normal: 18.5-24.9. Aplicación de decimales en salud.'),
    qMC('En una carrera, el primer lugar llegó en 12.58 seg y el segundo en 12.83 seg. Diferencia:', ['0.25 segundos','0.35 segundos','0.15 segundos','0.50 segundos'], 0, '12.83-12.58=0.25. Diferencia ínfima: cuarto de segundo. Decimales en deportes de alto rendimiento.'),
    qMC('Una botella de agua tiene 0.750 L. Si tomas 0.250 L, ¿qué fracción de la botella queda?', ['2/3 de la botella','1/2','1/3','3/4'], 0, '750-250=500 mL. 500/750=2/3. Relación decimales-fracciones en medidas cotidianas.'),
    qTF('Los decimales se usan para medir tiempo, distancia, dinero y peso en la vida diaria.', true, 'Verificamos decimales en recibos del súper ($89.90), distancias (5.3 km), peso (1.750 kg), temperatura (36.5°C).'),
    qMC('En la factura de luz, el consumo se mide en kWh con decimales. Si consume 285.5 kWh y cada kWh cuesta $0.95, el costo es:', ['$271.23 (aprox)','$285.50','$271.00','$300.00'], 0, '285.5×0.95=271.225. Redondeando: $271.23. Cálculos financieros caseros.'),
    qOrder('Ordena estas situaciones por magnitud del decimal usado:', ['Medalla olímpica: 9.58 segundos','Kilogramo de tortillas: $20','Distancia CDMX-Monterrey: 900 km','Bacteria: 0.0005 mm'], 'Los decimales nos permiten medir desde lo astronómico hasta lo microscópico.'),
    qMatch('Relaciona cada producto con su precio estimado en México:', [{left:'1 L de leche',right:'$26.50'},{left:'1 kg de tortilla',right:'$20.00'},{left:'1 L de gasolina',right:'$24.99'},{left:'Pasaje del camión',right:'$12.50'}], 'Los decimales representan centavos (centésimos) en nuestro sistema monetario.'),
    qMC('Tu meta es ahorrar $500.00 en 5 meses. ¿Cuánto debes ahorrar por mes?', ['$100.00 por mes','$50.00','$250.00','$125.00'], 0, '500÷5=100. Ahorro programado usando división de decimales.'),
    qWrite('Si el IVA es 16% sobre $850.00, ¿cuánto es el IVA en pesos?', ['136','136.00','$136','136 pesos'], '850×0.16=136. El IVA se calcula multiplicando por 0.16.'),
  ],
  // ===== M16: Porcentajes - Conceptos básicos =====
  [
    qMC('El símbolo % significa:', ['"Por ciento" = de cada 100. 50% = 50 de cada 100 = 1/2','Unidad de peso','Grados','Multiplicar por 100'], 0, 'Porcentaje viene del latín "per centum" = por cada cien. Es una fracción con denominador 100.'),
    qMC('Convertir 25% a fracción:', ['25/100 = 1/4','1/25','25/1','100/25'], 0, 'Todo porcentaje es una fracción con denominador 100. 25% = 25/100 = 1/4.'),
    qMC('Convertir 0.75 a porcentaje:', ['75% (0.75×100=75)','7.5%','0.75%','750%'], 0, 'Decimal → porcentaje: multiplica por 100 y agrega %. 0.75×100=75%.'),
    qMC('El 100% de algo significa:', ['El TOTAL, la cantidad completa','La mitad','Nada','El doble'], 0, '100% = 100/100 = 1 = el entero completo. 100% de 200 es 200.'),
    qMC('¿Cuál es el 10% de 350?', ['35','3.5','350','10'], 0, '10% = 10/100 = 1/10 = 0.10. 350×0.10=35. El 10% es la décima parte.'),
    qMC('¿Qué porcentaje de 200 es 50?', ['25%','50%','10%','75%'], 0, '50/200 = 1/4 = 0.25 = 25%. Para hallar qué % es A de B: (A/B)×100.'),
    qTF('50% de una cantidad es lo mismo que dividirla entre 2.', true, '50% = 50/100 = 1/2. Mitad = dividir entre 2. 50% de 80 = 40.'),
    qOrder('Ordena estos porcentajes de menor a mayor:', ['5%','25%','50%','75%','100%'], 'Porcentajes comunes: 25%=1/4, 50%=1/2, 75%=3/4, 100%=1 entero, 5%=1/20.'),
    qMatch('Relaciona cada porcentaje con su equivalente:', [{left:'25%',right:'1/4 = 0.25'},{left:'50%',right:'1/2 = 0.50'},{left:'75%',right:'3/4 = 0.75'},{left:'10%',right:'1/10 = 0.10'}], 'Memorizar estas equivalencias facilita el cálculo mental de porcentajes.'),
    qMC('Si en una escuela hay 800 alumnos y el 60% son niñas, ¿cuántas niñas hay?', ['480 niñas','320 niñas','60 niñas','500 niñas'], 0, '800×0.60=480 niñas. Aplicación directa de porcentaje a población.'),
    qWrite('¿Qué porcentaje es 15 de 60?', ['25','25%'], '15/60=1/4=0.25=25%.'),
    qWrite('¿Qué porcentaje es 3 de 20?', ['15','15%'], '3/20=0.15=15%.'),
  ],

  // ===== M17: Cálculo de porcentajes =====
  [
    qMC('Para calcular el 30% de 450:', ['450×0.30 = 135','450÷30 = 15','450-30 = 420','30×450 = 13,500'], 0, 'Convierte 30% a decimal: 0.30. Multiplica: 450×0.30=135.'),
    qMC('¿Cuál es el 15% de 200?', ['30','15','25','20'], 0, '10% de 200=20. 5% de 200=10. 15% = 20+10=30. Calcular por partes.'),
    qMC('En una tienda, un artículo de $600 tiene 20% de descuento. ¿Cuánto pagas?', ['$480','$120','$580','$600'], 0, 'Descuento: 600×0.20=120. Precio final: 600-120=480.'),
    qMC('Si ahorras el 8% de $5,000 de tu sueldo, ¿cuánto ahorras?', ['$400','$40','$4,000','$8,000'], 0, '5,000×0.08=400. El ahorro es fundamental para metas financieras.'),
    qMC('El IVA en México es del 16%. El IVA de un producto de $1,250 es:', ['$200','$125','$250','$160'], 0, '1,250×0.16=200. IVA = Impuesto al Valor Agregado.'),
    qMC('Para calcular el porcentaje rápido: 20% de 850 es:', ['170 (850÷5=170 porque 20%=1/5)','85','100','42.5'], 0, '20% = 20/100 = 1/5. Dividir entre 5 es más rápido que multiplicar por 0.20.'),
    qTF('El IVA en México es del 16% sobre el precio del producto.', true, 'Sí. IVA = 16% del precio. Precio con IVA = precio × 1.16.'),
    qOrder('Ordena los pasos para calcular precio con 25% de descuento sobre $800:', ['Calcular descuento: 800×0.25=200','Restar: 800-200=600','Resultado: $600'], 'Problema de descuento comercial: primero calcula cuánto descuentan, luego réstalo del precio original.'),
    qMatch('Relaciona el porcentaje con su fracción equivalente:', [{left:'10%',right:'1/10'},{left:'20%',right:'1/5'},{left:'25%',right:'1/4'},{left:'33.3%',right:'1/3'}], 'Usar fracciones equivalentes para calcular porcentajes es más rápido que usar decimales.'),
    qMC('Una chamarra cuesta $950 más 16% de IVA. Precio final:', ['$1,102','$1,000','$1,100','$950'], 0, 'IVA: 950×0.16=152. Total: 950+152=1,102.'),
    qWrite('¿Cuánto es el 40% de 350?', ['140'], '350×0.40=140. O: 4×(10% de 350)=4×35=140.'),
    qWrite('Si un descuento es del 15% sobre $900, ¿cuánto pagas?', ['765','$765'], '900×0.85=765.'),
  ],

  // ===== M18: Porcentajes mayores que 100% y menores que 1% =====
  [
    qMC('El 150% de 200 significa:', ['200×1.5=300 (Es más que el total, un 50% extra)','150','100','No existe'], 0, 'Porcentajes >100% indican cantidad mayor al total. 150%=1.5 veces. Común en crecimiento.'),
    qMC('El 0.5% de 1,000 es:', ['5','0.5','50','500'], 0, '0.5% = 0.5/100 = 0.005. 1,000×0.005=5. Porcentajes menores a 1% representan fracciones muy pequeñas.'),
    qMC('Si una población crece 120% en 10 años y era de 50,000, ¿cuánto creció?', ['Creció 60,000 habitantes','120','120,000','6,000'], 0, '120% de 50,000 = 50,000×1.20=60,000. Nueva población: 110,000.'),
    qMC('Convertir 200% a decimal:', ['2.0','0.2','20','0.02'], 0, '200% = 200/100 = 2.0. Cada 100% = 1 entero.'),
    qMC('El 0.25% de 400 es:', ['1','0.25','10','0.1'], 0, '0.25% = 0.25/100 = 0.0025. 400×0.0025=1.0. Es una cuarta parte del 1%.'),
    qMC('Si una inversión rinde el 250% de lo invertido, y pusiste $1,000, recibes:', ['$2,500','$250','$1,250','$3,500'], 0, '250% de 1,000 = 1,000×2.5 = 2,500. El rendimiento es más del doble de lo invertido.'),
    qTF('Un porcentaje puede ser mayor que 100%.', true, 'Sí, cuando la parte es mayor que el total. Ej: si vendes 200 artículos y tu meta era 100, vendiste el 200% de la meta.'),
    qOrder('Ordena estos porcentajes del menor al mayor valor:', ['0.1% de 10,000 = 10','1% de 1,000 = 10','10% de 200 = 20','100% de 30 = 30','200% de 20 = 40'], 'Porcentaje no es lo mismo que valor absoluto. Un % pequeño de un número grande puede ser mayor que un % grande de un número chico.'),
    qMatch('Relaciona cada caso con su significado:', [{left:'100%',right:'El total'},{left:'200%',right:'El doble del total'},{left:'50%',right:'La mitad'},{left:'0.5%',right:'5 milésimos = 0.005 del total'}], 'Entender el significado real de % ayuda a interpretar noticias, estadísticas y finanzas.'),
    qMC('Si la inflación anual es del 5.5%, ¿cuánto sube un producto de $1,000?', ['$55','$5.50','$550','$1,055'], 0, '1,000×0.055=55. El precio nuevo: $1,055. Inflación = aumento generalizado de precios.'),
    qWrite('El 300% de 45 es: ?', ['135'], '300% = 3. 45×3=135.'),
    qWrite('El 0.1% de 5000 es:', ['5'], '0.1% de 5000 = 5000×0.001=5.'),
  ],

  // ===== M19: Proporcionalidad directa =====
  [
    qMC('Dos magnitudes son directamente proporcionales si:', ['Al aumentar una, la otra aumenta en la MISMA proporción','Una aumenta y la otra disminuye','No tienen relación','Una es fija'], 0, 'Ej: kilos de tortilla y precio. 2 kg = $40, 4 kg = $80. Se mantiene la razón constante.'),
    qMC('Si 5 cuadernos cuestan $125, ¿cuánto cuestan 8?', ['$200','$150','$100','$175'], 0, 'Razón: $125÷5=$25 por cuaderno. 8×25=$200. O regla de tres: 5→125, 8→x; x=(8×125)/5=200.'),
    qMC('En proporcionalidad directa, la constante de proporcionalidad (k) es:', ['k = y/x (se mantiene constante para todos los pares)','k = x+y','No existe','k = y-x'], 0, 'Si 1 kg = $20 (k=20), entonces 2 kg = $40, 3 kg = $60. Siempre y/x = 20.'),
    qMC('Un automóvil recorre 180 km con 12 litros de gasolina. ¿Cuántos km con 20 litros?', ['300 km','240 km','360 km','200 km'], 0, 'k=180÷12=15 km por litro. 20×15=300 km. Proporcionalidad en rendimiento de combustible.'),
    qMC('Si 6 obreros construyen un muro en 8 días, ¿cuánto tardan 12 obreros?', ['4 días (¡INVERSA! Más obreros, menos días)','16 días','8 días','12 días'], 0, 'CUIDADO: Esta es proporcionalidad INVERSA. Más obreros → menos días. 6×8/12=4 días.'),
    qMC('Una impresora saca 45 copias por minuto. ¿Cuántas en 8 minutos?', ['360 copias','53 copias','37 copias','45 copias'], 0, '45×8=360 copias. Proporcionalidad directa: más tiempo, más copias.'),
    qTF('En la proporcionalidad directa, si duplicas una magnitud, la otra se duplica.', true, 'Definición de proporcionalidad directa: y = k·x. Si x se multiplica por n, y también se multiplica por n.'),
    qOrder('Ordena los pasos para resolver "Si 4 playeras cuestan $600, ¿cuánto cuestan 7?":', ['Hallar valor unitario: 600÷4=$150 por playera','Multiplicar por 7: 150×7=$1,050','Resultado: $1,050'], 'Método de reducción a la unidad: encuentra la constante de proporcionalidad primero.'),
    qMatch('Relaciona cada situación con su resultado:', [{left:'3 kg de manzana cuestan $90',right:'$30/kg'},{left:'8 lápices cuestan $40',right:'$5 c/lápiz'},{left:'2 kg de tortilla → $44',right:'$22/kg'},{left:'15 min → 60 copias',right:'4 copias/min'}], 'Problemas de valor unitario y regla de tres directa.'),
    qMC('En una receta, 2 tazas de harina rinden 24 galletas. Para 60 galletas se necesita:', ['5 tazas','4 tazas','6 tazas','3 tazas'], 0, 'Razón: 24÷2=12 galletas por taza. 60÷12=5 tazas. Proporcionalidad en cocina.'),
    qWrite('Si 10 litros de pintura cubren 80 m², ¿cuántos litros para 200 m²?', ['25'], '80÷10=8 m²/L. 200÷8=25 L. O regla de tres: (200×10)/80=25.'),
    qWrite('Si 3 paquetes contienen 36 dulces, ¿cuántos en 7 paquetes?', ['84'], '36÷3=12 por paquete. 7×12=84.'),
  ],

  // ===== M20: Proporcionalidad inversa =====
  [
    qMC('Dos magnitudes son inversamente proporcionales si:', ['Al aumentar una, la otra DISMINUYE en proporción inversa','Ambas aumentan juntas','Ambas disminuyen juntas','No tienen relación'], 0, 'Ej: número de trabajadores y tiempo. 2 trabajadores→6 días, 4 trabajadores→3 días.'),
    qMC('Si 3 llaves llenan un tanque en 8 horas, ¿cuánto tardan 6 llaves iguales?', ['4 horas','16 horas','8 horas','12 horas'], 0, 'Inversa: más llaves, menos tiempo. 3×8/6=4 horas. Producto constante: llaves×horas=24.'),
    qMC('El producto de las dos magnitudes en proporcionalidad inversa:', ['Es CONSTANTE (x·y = k)','Varía siempre','Es cero','Es igual a la suma'], 0, 'Trabajadores×días = constante. 2×12=24, 4×6=24, 8×3=24. Todos dan 24.'),
    qMC('Para repartir $1,200 entre más personas, cada una recibe menos. Esto es:', ['Proporcionalidad inversa','Proporcionalidad directa','No es proporcionalidad','Depende de la persona'], 0, 'Dinero fijo ÷ más personas = menos para cada quien. Producto constante = 1,200.'),
    qMC('Un auto a 80 km/h tarda 3 horas. ¿Cuánto tarda a 120 km/h?', ['2 horas','4.5 horas','3 horas','1.5 horas'], 0, 'Inversa: más velocidad, menos tiempo. 80×3=240 km. 240÷120=2 horas.'),
    qMC('Si 5 pintores pintan una casa en 10 días, ¿cuánto tardan 2 pintores?', ['25 días','4 días','15 días','20 días'], 0, 'Producto constante: 5×10=50. 50÷2=25 días. Menos pintores, más días.'),
    qTF('En la proporcionalidad inversa, el producto de ambas magnitudes es constante.', true, 'Definición clave: x·y = k (constante). Si x se duplica, y se reduce a la mitad.'),
    qOrder('Ordena los pasos para resolver "Un grifo llena un tanque en 12 h; ¿cuánto tardan 4 grifos?":', ['Identificar constante: 1×12=12','Calcular tiempo: 12÷4=3 horas','Resultado: 3 horas'], 'En inversa: multiplicas las magnitudes dadas para hallar k, luego divides entre la nueva magnitud.'),
    qMatch('Relaciona cada situación con su tipo de proporcionalidad:', [{left:'Kilos de tortilla y precio',right:'Directa'},{left:'Velocidad y tiempo (distancia fija)',right:'Inversa'},{left:'Horas de trabajo y salario',right:'Directa'},{left:'Número de alumnos y bocadillos por alumno',right:'Inversa'}], 'Identificar si es directa o inversa es el primer paso para resolver correctamente.'),
    qMC('Un ganadero tiene alimento para 30 vacas durante 20 días. Si vende 10 vacas, ¿para cuántos días alcanza?', ['30 días','15 días','20 días','40 días'], 0, '30×20=600 raciones. Quedan 20 vacas. 600÷20=30 días. Proporcionalidad inversa.'),
    qWrite('Si 8 máquinas producen 400 piezas en 10 horas, ¿cuántas horas tardan 10 máquinas?', ['8'], '8×10=80 horas-máquina. 80÷10=8 horas.'),
    qWrite('Un estanque con 3 bombas se vacía en 4h. ¿Cuánto con 6 bombas?', ['2','2 horas'], '3×4÷6=2 horas.'),
  ],

  // ===== M21: Unidades de longitud =====
  [
    qMC('La unidad básica de longitud en el SI es:', ['El metro (m)','El kilómetro','El centímetro','El pie'], 0, 'El metro fue definido originalmente como la diezmillonésima parte del cuadrante terrestre.'),
    qMC('1 kilómetro equivale a:', ['1,000 metros','100 metros','10,000 metros','10 metros'], 0, 'El prefijo "kilo-" significa mil. 1 km = 1,000 m.'),
    qMC('Para convertir 5.3 km a metros:', ['Multiplicar por 1,000: 5.3×1,000=5,300 m','Dividir entre 1,000','Multiplicar por 100','No se hace'], 0, 'km→m: ×1000. 5.3×1000=5,300. Solo mueve el punto 3 lugares a la derecha.'),
    qMC('¿Cuántos centímetros hay en 2.5 metros?', ['250 cm','25 cm','2,500 cm','0.25 cm'], 0, '1 m = 100 cm. 2.5×100=250 cm.'),
    qMC('1 pulgada equivale aproximadamente a:', ['2.54 cm','10 cm','5 cm','1 cm'], 0, 'Equivalencia exacta: 1 pulgada = 2.54 cm. Muy usada en construcción y tecnología.'),
    qMC('La distancia de La Paz, BCS a Los Cabos es ≈ 160 km. En metros:', ['160,000 metros','1,600 metros','16,000 metros','1,600,000 metros'], 0, '160×1,000=160,000 m. Conversión de distancias carreteras.'),
    qTF('1 metro = 100 centímetros = 1,000 milímetros.', true, 'Sistema decimal: m→×10→dm→×10→cm→×10→mm. 1m=10dm=100cm=1000mm.'),
    qOrder('Ordena estas longitudes de menor a mayor:', ['1 milímetro','1 centímetro (10 mm)','1 decímetro (10 cm)','1 metro (100 cm)','1 kilómetro (1,000 m)'], 'Cada unidad es 10 veces mayor que la anterior en el sistema métrico decimal.'),
    qMatch('Relaciona cada medida con su equivalente:', [{left:'1 km',right:'1,000 m'},{left:'1 m',right:'100 cm'},{left:'1 cm',right:'10 mm'},{left:'1 dm',right:'10 cm'}], 'La escalera métrica: cada escalón multiplica ×10 o divide ÷10.'),
    qMC('Mides la altura de una puerta. La unidad más adecuada es:', ['Metros (aprox. 2.10 m)','Kilómetros','Milímetros','Decámetros'], 0, 'Elegir la unidad adecuada: km para distancias largas, m para objetos cotidianos.'),
    qWrite('Convierte 3,500 metros a kilómetros.', ['3.5','3.5 km'], '3,500÷1,000=3.5 km.'),
    qWrite('Convierte 450 cm a metros.', ['4.5','4.5 m'], '450÷100=4.5 m.'),
  ],

  // ===== M22: Unidades de masa y capacidad =====
  [
    qMC('La unidad básica de masa es:', ['El kilogramo (kg)','El gramo','La tonelada','El litro'], 0, 'Aunque el gramo es la unidad base del SI, el kilogramo es la unidad práctica más usada.'),
    qMC('¿Cuántos gramos hay en 3.2 kilogramos?', ['3,200 g','320 g','32,000 g','32 g'], 0, 'kg→g: ×1,000. 3.2×1,000=3,200 g.'),
    qMC('Una tonelada equivale a:', ['1,000 kilogramos','100 kilogramos','10,000 kilogramos','10 kilogramos'], 0, '1 tonelada métrica = 1,000 kg. Se usa para cargas pesadas como camiones.'),
    qMC('La unidad básica de capacidad es:', ['El litro (L)','El kilogramo','El metro','El galón'], 0, '1 litro = 1,000 mililitros = 1 dm³. 1 L de agua pura pesa exactamente 1 kg.'),
    qMC('¿Cuántos mililitros hay en 0.75 litros?', ['750 mL','75 mL','7,500 mL','7.5 mL'], 0, 'L→mL: ×1,000. 0.75×1,000=750 mL.'),
    qMC('Un galón estadounidense equivale aproximadamente a:', ['3.785 litros','1 litro','5 litros','10 litros'], 0, 'Conversión internacional: 1 galón USA ≈ 3.785 L. Útil en gasolina.'),
    qTF('1 kilogramo de agua equivale exactamente a 1 litro de agua (a 4°C).', true, 'A 4°C y presión normal: 1 L de agua = 1 kg. Relación única entre masa y capacidad.'),
    qOrder('Ordena estas masas de menor a mayor:', ['1 gramo (clip)','1 kg (1 L de agua)','1 arroba (11.5 kg aprox)','1 tonelada (1,000 kg)'], 'Escala de masas: g para objetos ligeros, kg para compras, toneladas para industria.'),
    qMatch('Relaciona cada masa con su equivalente:', [{left:'1 kg',right:'1,000 g'},{left:'1 tonelada',right:'1,000 kg'},{left:'1 mg',right:'0.001 g'},{left:'500 g',right:'0.5 kg'}], 'El sistema métrico: todo basado en potencias de 10.'),
    qMC('Un camión de carga lleva 15 toneladas de cemento. ¿Cuántos kg son?', ['15,000 kg','1,500 kg','150,000 kg','150 kg'], 0, '15×1,000=15,000 kg. Cálculo de cargas pesadas.'),
    qWrite('¿Cuántos mililitros hay en 2.5 litros?', ['2500','2,500'], '2.5×1,000=2,500 mL.'),
    qWrite('¿Cuántos gramos hay en 0.375 kg?', ['375'], '0.375×1000=375 g.'),
  ],

  // ===== M23: Unidades de tiempo =====
  [
    qMC('Las unidades de tiempo se basan en:', ['Sistema sexagesimal (base 60) de los babilonios','Base 10 como el metro','Base 100','Base 2'], 0, '60 segundos = 1 minuto, 60 minutos = 1 hora. Sistema de hace 4000 años.'),
    qMC('¿Cuántos segundos hay en 1 hora?', ['3,600 segundos','60 segundos','360 segundos','6,000 segundos'], 0, '1 h = 60 min × 60 s/min = 3,600 segundos.'),
    qMC('¿Cuántos minutos hay en 2.5 horas?', ['150 minutos','120 minutos','180 minutos','250 minutos'], 0, '2.5×60=150 min. Conversión de horas a minutos: multiplica por 60.'),
    qMC('Un día tiene:', ['24 horas = 1,440 minutos = 86,400 segundos','12 horas','48 horas','10 horas'], 0, '24×60=1,440 min. 1,440×60=86,400 segundos en 1 día exactamente.'),
    qMC('Para convertir 180 minutos a horas:', ['180÷60=3 horas','180×60=10,800','180-60=120','No se puede'], 0, 'min→horas: divide entre 60.'),
    qMC('¿Cuántos días hay en un año bisiesto?', ['366 días','365 días','364 días','360 días'], 0, 'Año bisiesto: cada 4 años se agrega 29 de febrero.'),
    qTF('Un lustro equivale a 5 años.', true, 'Lustro = 5 años. Década = 10 años. Siglo = 100 años. Milenio = 1,000 años.'),
    qOrder('Ordena estos períodos del más corto al más largo:', ['Segundo','Minuto (60 s)','Hora (3600 s)','Día (86400 s)','Semana (7 días)','Mes (~30 días)','Año (365 días)'], 'Escala de tiempo: de las unidades fundamentales a los períodos astronómicos.'),
    qMatch('Relaciona cada período con su duración:', [{left:'1 minuto',right:'60 segundos'},{left:'1 hora',right:'60 minutos'},{left:'1 semana',right:'7 días'},{left:'1 año común',right:'365 días'}], 'Unidades temporales que usamos para organizar nuestra vida.'),
    qMC('Si una película dura 2 horas y 15 minutos, ¿cuántos minutos son en total?', ['135 minutos','215 minutos','120 minutos','125 minutos'], 0, '2×60=120. 120+15=135 minutos.'),
    qWrite('¿Cuántas horas hay en 3 días?', ['72'], '3×24=72 horas.'),
    qWrite('¿Cuántas horas hay en 180 minutos?', ['3'], '180÷60=3 horas.'),
  ],

  // ===== M24: Conversión entre unidades de medida =====
  [
    qMC('Para convertir de una unidad mayor a una menor:', ['MULTIPLICAR (km→m: ×1,000)','DIVIDIR','Sumar','No hay regla'], 0, 'Mayor→menor: multiplicas. Menor→mayor: divides.'),
    qMC('Convertir 5,000 miligramos a gramos:', ['5 g (5,000÷1,000)','50 g','500 g','0.5 g'], 0, 'mg→g: ÷1,000. 5,000÷1,000=5 g.'),
    qMC('¿Cuántos decímetros hay en 3 metros?', ['30 dm','0.3 dm','300 dm','3 dm'], 0, 'm→dm: ×10. 3×10=30 dm.'),
    qMC('Convertir 4,500 mL a litros:', ['4.5 L (4,500÷1,000)','45 L','0.45 L','450 L'], 0, 'mL→L: ÷1,000. 4,500÷1,000=4.5 L.'),
    qMC('2.5 horas a minutos:', ['150 min (2.5×60)','250 min','125 min','25 min'], 0, 'Horas→minutos: ×60. 2.5×60=150 min.'),
    qMC('¿Cuántos kilómetros son 50,000 metros?', ['50 km','5 km','500 km','0.5 km'], 0, 'm→km: ÷1,000. 50,000÷1,000=50 km.'),
    qTF('Para convertir metros a centímetros se multiplica por 100.', true, 'm→cm: 2 escalones (m→dm→cm), cada uno ×10. Total: ×100.'),
    qOrder('Ordena los pasos para convertir 2.3 kg a mg:', ['kg→g: 2.3×1,000=2,300 g','g→mg: 2,300×1,000=2,300,000 mg','Resultado: 2,300,000 mg'], 'Conversión múltiple: paso a paso o de un salto (×1,000,000).'),
    qMatch('Relaciona cada conversión con su factor:', [{left:'km → m',right:'×1,000'},{left:'m → cm',right:'×100'},{left:'kg → g',right:'×1,000'},{left:'L → mL',right:'×1,000'}], 'Todas las conversiones del sistema métrico usan potencias de 10.'),
    qMC('Una alberca tiene 25,000 litros. ¿Cuántos metros cúbicos son?', ['25 m³ (1 m³=1,000 L)','2.5 m³','250 m³','2,500 m³'], 0, '25,000÷1,000=25 m³. 1 m³ = 1,000 litros.'),
    qWrite('Convierte 1.5 toneladas a kilogramos.', ['1500','1,500'], '1 ton=1,000 kg. 1.5×1,000=1,500 kg.'),
    qWrite('Convierte 72 horas a días.', ['3'], '72÷24=3 días.'),
  ],

  // ===== M25: Problemas con unidades de medida =====
  [
    qMC('Juan corre 5 km diarios. ¿Cuántos metros corre en una semana?', ['35,000 metros','5,000 metros','30,000 metros','7,000 metros'], 0, '5×7=35 km. 35×1,000=35,000 m.'),
    qMC('Un tinaco tiene 1,200 L. Se gastan 350 L y se añaden 500 L. ¿Cuánto queda?', ['1,350 litros','1,050 litros','850 litros','1,700 litros'], 0, '1,200-350+500=1,350 L. Operaciones con capacidades.'),
    qMC('La Torre Latinoamericana mide 182 metros. ¿Cuántos cm son?', ['18,200 cm','1,820 cm','182,000 cm','18.2 cm'], 0, '182×100=18,200 cm. Edificio emblemático de CDMX.'),
    qMC('Un vuelo CDMX-Cancún dura 2h 15min. En minutos:', ['135 minutos','125 minutos','215 minutos','150 minutos'], 0, '2×60=120. 120+15=135 min.'),
    qMC('Tres costales: 25.5 kg, 18.75 kg, 32.25 kg. Peso total:', ['76.5 kg','75 kg','77 kg','76 kg'], 0, '25.5+18.75+32.25=76.5 kg. Suma de masas.'),
    qMC('Un ciclista recorre 42.5 km en 2.5 horas. Velocidad promedio:', ['17 km/h','20 km/h','15 km/h','10.6 km/h'], 0, '42.5÷2.5=17 km/h. Velocidad = distancia ÷ tiempo.'),
    qTF('El kilómetro es la unidad más adecuada para medir el largo de un lápiz.', false, 'Para un lápiz (~15 cm) usamos centímetros. Elegir la unidad apropiada es clave.'),
    qOrder('Ordena estos objetos por su masa estimada (menor a mayor):', ['Clip (1 g)','Manzana (150 g)','Libro (500 g)','Gato adulto (4 kg)','Refrigerador (80 kg)'], 'Estimar masas con unidades apropiadas.'),
    qMatch('Relaciona cada objeto con la unidad más adecuada:', [{left:'Distancia entre ciudades',right:'km'},{left:'Largo de una mesa',right:'m'},{left:'Diámetro de una moneda',right:'mm'},{left:'Peso de una persona',right:'kg'}], 'Seleccionar la unidad correcta evita números incómodos.'),
    qMC('Un camión cisterna transporta 25,000 L de agua. ¿Cuántos tanques de 500 L se llenan?', ['50 tanques','100 tanques','25 tanques','500 tanques'], 0, '25,000÷500=50 tanques.'),
    qWrite('¿Cuántos segundos hay en 1 día (24 horas)?', ['86400','86,400'], '24×60×60=86,400 segundos.'),
    qWrite('Un tinaco de 850 L se llena con cubetas de 25 L. ¿Cuántas cubetas?', ['34'], '850÷25=34 cubetas.'),
  ],
  // ===== M26: Perímetro de figuras planas =====
  [
    qMC('El perímetro de una figura es:', ['Suma de longitudes de todos sus lados (el CONTORNO)','El área interior','El volumen','La altura'], 0, 'Perímetro = contorno. Caminar alrededor de un parque rectangular = perímetro.'),
    qMC('El perímetro de un cuadrado de lado 8 cm es:', ['32 cm','64 cm','16 cm','8 cm'], 0, 'Cuadrado: 4 lados iguales. P=4×8=32 cm.'),
    qMC('Rectángulo de 12 m de largo y 5 m de ancho, su perímetro:', ['34 m (2×12 + 2×5 = 24+10)','60 m','17 m','22 m'], 0, 'Rectángulo: P=2×largo + 2×ancho = 2(largo+ancho).'),
    qMC('Triángulo equilátero de lado 15 cm, perímetro:', ['45 cm','30 cm','15 cm','60 cm'], 0, 'Equilátero: 3 lados iguales. P=3×15=45 cm.'),
    qMC('Pentágono regular de lado 7 m, perímetro:', ['35 m','28 m','49 m','14 m'], 0, 'Polígono regular: P = n × L. P=5×7=35 m.'),
    qMC('Circunferencia de un círculo:', ['C=2×π×r (π≈3.1416, r=radio)','C=π×d²','C=r×r×π','No tiene'], 0, 'C = π×diámetro = 2πr. Si r=5 cm, C≈31.416 cm.'),
    qTF('El perímetro de un rectángulo de 10 m × 6 m es 32 m.', true, 'P=2(10+6)=2(16)=32 m. Correcto.'),
    qOrder('Ordena los pasos para calcular perímetro de un hexágono regular de lado 9 dm:', ['Identificar: 6 lados iguales','Multiplicar: 6×9=54 dm','Resultado: 54 dm'], 'Fórmula: P=n×L donde n=número de lados.'),
    qMatch('Relaciona la figura con su fórmula de perímetro:', [{left:'Cuadrado lado L',right:'P=4×L'},{left:'Rectángulo a,b',right:'P=2a+2b'},{left:'Triángulo equilátero L',right:'P=3×L'},{left:'Círculo radio r',right:'C=2πr'}], 'Conocer las fórmulas permite calcular cercas, marcos y bordes.'),
    qMC('Cercar un jardín rectangular de 25 m × 18 m:', ['86 metros','43 metros','450 metros','68 metros'], 0, 'P=2(25+18)=2(43)=86 m de cerca.'),
    qWrite('¿Perímetro de un triángulo con lados 13, 14 y 15 cm?', ['42','42 cm'], '13+14+15=42 cm.'),
    qWrite('¿Perímetro de un pentágono regular de lado 12 cm?', ['60','60 cm'], '5×12=60 cm.'),
  ],

  // ===== M27: Área de cuadrados y rectángulos =====
  [
    qMC('El área de una figura es:', ['La medida de su SUPERFICIE (en unidades cuadradas)','Su perímetro','Su volumen','Su altura'], 0, 'Área = superficie interior. Se mide en m², cm², km².'),
    qMC('Área de un cuadrado de lado 7 cm:', ['49 cm²','28 cm²','14 cm²','7 cm²'], 0, 'Cuadrado: A=lado×lado=7×7=49 cm².'),
    qMC('Rectángulo de 15 m × 4 m, área:', ['60 m² (base × altura)','19 m²','60 m','30 m²'], 0, 'Rectángulo: A=base×altura=15×4=60 m².'),
    qMC('Habitación de 6 m × 4 m, ¿cuántos m²?', ['24 m²','20 m²','10 m²','24 m'], 0, 'Superficie: 6×4=24 m². Importante para piso o pintura.'),
    qMC('Terreno rectangular 20 m × 35 m, área:', ['700 m²','110 m²','55 m²','700 m'], 0, '20×35=700 m². Áreas grandes para terrenos.'),
    qMC('Convertir 1 m² a cm²:', ['1 m² = 10,000 cm² (100×100)','1 m² = 100 cm²','1 m² = 1,000 cm²','No se puede'], 0, '1 m=100 cm. 1 m²=(100 cm)²=10,000 cm².'),
    qTF('El área se expresa SIEMPRE en unidades cuadradas.', true, 'Siempre al cuadrado: m², cm², km². Olvidar el ² = error.'),
    qOrder('Ordena los pasos para calcular losetas (50×50 cm) para habitación 4 m×3 m:', ['Área habitación: 4×3=12 m²','Convertir a cm²: 12×10,000=120,000 cm²','Área loseta: 50×50=2,500 cm²','Dividir: 120,000÷2,500=48 losetas'], 'Cálculo de materiales para construcción.'),
    qMatch('Relaciona la figura con su fórmula de área:', [{left:'Cuadrado lado L',right:'A=L²'},{left:'Rectángulo b,h',right:'A=b×h'},{left:'Romboide b,h',right:'A=b×h'},{left:'Triángulo b,h',right:'A=(b×h)÷2'}], 'Cada figura tiene su propia fórmula.'),
    qMC('Campo de fútbol: 100 m × 70 m. Área:', ['7,000 m² = 0.7 hectáreas','170 m²','7,000 m','700 m²'], 0, '100×70=7,000 m². 1 ha=10,000 m² → 0.7 ha.'),
    qWrite('¿Área de un cuadrado de lado 12 cm?', ['144','144 cm²'], '12×12=144 cm².'),
    qWrite('¿Área de un rectángulo de 20 m × 5 m?', ['100','100 m²'], '20×5=100 m².'),
  ],

  // ===== M28: Área de triángulos =====
  [
    qMC('El área de un triángulo es:', ['(base × altura) ÷ 2','base × altura','base + altura','base × 2'], 0, 'Un triángulo es la MITAD de un rectángulo con misma base y altura.'),
    qMC('Triángulo base 10 cm, altura 6 cm, área:', ['30 cm²','60 cm²','16 cm²','36 cm²'], 0, 'A=(10×6)÷2=60÷2=30 cm².'),
    qMC('La altura de un triángulo es:', ['Distancia PERPENDICULAR de la base al vértice opuesto','Cualquier lado','El lado más largo','El perímetro'], 0, 'Altura = perpendicular a la base que llega al vértice opuesto.'),
    qMC('Triángulo rectángulo catetos 8 cm y 6 cm, área:', ['24 cm² (8×6÷2)','48 cm²','14 cm²','28 cm²'], 0, 'En rectángulo, los catetos son base y altura. A=(8×6)/2=24.'),
    qMC('Triángulo base 25 m, altura 12 m, área:', ['150 m²','300 m²','37 m²','150 m'], 0, 'A=(25×12)÷2=300÷2=150 m².'),
    qMC('Relación triángulo-paralelogramo:', ['2 triángulos iguales = 1 paralelogramo','No tienen relación','El triángulo es más grande','Es lo mismo'], 0, 'Duplicar un triángulo = paralelogramo. Por eso A=bh/2.'),
    qTF('El área de triángulo base 14 cm, altura 5 cm es 35 cm².', true, '(14×5)÷2=70÷2=35 cm².'),
    qOrder('Ordena los pasos para hallar área de un triángulo:', ['Identificar base (b)','Identificar altura (h) perpendicular','Multiplicar b×h','Dividir entre 2'], 'Procedimiento universal para cualquier triángulo.'),
    qMatch('Relaciona triángulo con su área:', [{left:'b=8, h=5',right:'20 u²'},{left:'b=12, h=9',right:'54 u²'},{left:'b=20, h=3',right:'30 u²'},{left:'b=16, h=10',right:'80 u²'}], 'Práctica con distintas combinaciones.'),
    qMC('Vela de barco triangular: base 4 m, altura 6 m. Área:', ['12 m²','24 m²','10 m²','48 m²'], 0, '(4×6)÷2=24÷2=12 m² de tela.'),
    qWrite('¿Área de triángulo base 18 cm, altura 7 cm?', ['63','63 cm²'], '(18×7)÷2=126÷2=63 cm².'),
    qWrite('¿Área de un triángulo de base 30 cm y altura 12 cm?', ['180','180 cm²'], '(30×12)÷2=180 cm².'),
  ],

  // ===== M29: Área de figuras compuestas =====
  [
    qMC('Para hallar área de figura compuesta:', ['Descomponer en figuras simples y sumar sus áreas','Ignorar','Solo perímetro','Calcular como rectángulo'], 0, 'Divide en formas conocidas, calcula área de cada parte, suma.'),
    qMC('Figura en "L" se divide en:', ['2 rectángulos (calculas cada área y sumas)','1 triángulo grande','No se puede','Solo 1 cuadrado'], 0, 'L = rectángulo vertical + rectángulo horizontal.'),
    qMC('Casa dibujada = rectángulo + triángulo. Área total:', ['Área rectángulo + Área triángulo','Solo rectángulo','Solo triángulo','Perímetro'], 0, 'Figuras compuestas comunes: casa, bandera, terrenos.'),
    qMC('Terreno en "T": 2 rectángulos 10×4 m y 6×8 m. Área:', ['40+48=88 m²','40 m²','88 m','14 m²'], 0, 'Suma áreas de partes componentes.'),
    qMC('Figura con "hueco":', ['Área exterior - Área del hueco','Solo área exterior','Ignorar hueco','No se puede'], 0, 'Ej: marco = rectángulo exterior - rectángulo interior.'),
    qMC('Jardín circular r=5m con fuente cuadrada lado 2m al centro:', ['π×25 - 4 ≈ 78.54 - 4 = 74.54 m²','78.54 m²','25 m²','21 m²'], 0, 'Área pasto = área círculo - área fuente.'),
    qTF('Figuras compuestas se dividen en figuras simples conocidas.', true, 'Estrategia universal: descomponer en rectángulos, triángulos y círculos.'),
    qOrder('Ordena los pasos para área de bandera México (3 franjas iguales):', ['Identificar: 3 rectángulos iguales','Área de 1 franja','Multiplicar por 3','Resultado total'], 'Repeticiones de la misma forma básica.'),
    qMatch('Relaciona figura compuesta con descomposición:', [{left:'Casa',right:'Rectángulo + Triángulo'},{left:'Cruz',right:'5 Cuadrados'},{left:'Marco',right:'Rectángulo grande - chico'},{left:'Trapecio',right:'2 Triángulos + Rectángulo'}], 'Visualizar partes simples que forman la figura.'),
    qMC('Logo: cuadrado 12 cm + círculo inscrito r=6 cm. Área fuera:', ['144 - 113.1 ≈ 30.9 cm²','12 cm²','144 cm²','0 cm²'], 0, '144-π×36 ≈ 144-113.1=30.9 cm².'),
    qWrite('¿Área total de 4 cuadrados de lado 5 cm unidos?', ['100','100 cm²'], '4×25=100 cm².'),
    qWrite('En figura compuesta de 3 rectángulos de 10 m², ¿área total?', ['30','30 m²'], '3×10=30 m².'),
  ],

  // ===== M30: Volumen de prismas rectangulares =====
  [
    qMC('El volumen mide:', ['El ESPACIO que ocupa un cuerpo (3 dimensiones)','La superficie','El contorno','El peso'], 0, 'Volumen = largo × ancho × alto. Unidades cúbicas: m³, cm³.'),
    qMC('Volumen de un cubo de arista 5 cm:', ['125 cm³ (5³)','25 cm³','15 cm³','50 cm³'], 0, 'Cubo: V=lado³=5³=125 cm³.'),
    qMC('Prisma rectangular 8×3×4 cm, volumen:', ['96 cm³ (8×3×4)','96 cm²','15 cm³','56 cm³'], 0, 'V=largo×ancho×alto=96.'),
    qMC('¿Cuántos cm³ hay en 1 m³?', ['1,000,000 cm³ (100³)','1,000 cm³','100 cm³','10,000 cm³'], 0, '1m=100cm. 1 m³=(100 cm)³=1,000,000 cm³.'),
    qMC('Tinaco cilíndrico r=1 m, h=2 m, volumen:', ['π×1²×2 ≈ 6.28 m³ = 6,280 litros','3.14 m³','2 m³','1 m³'], 0, 'Cilindro: V=πr²h≈6.28 m³. Cada m³=1,000 litros.'),
    qMC('Caja de zapatos 30×20×12 cm, volumen:', ['7,200 cm³','62 cm³','7,200 cm²','720 cm³'], 0, '30×20×12=7,200 cm³.'),
    qTF('1 litro = 1,000 cm³ = 1 dm³.', true, 'Relación exacta y muy práctica.'),
    qOrder('Ordena los pasos para volumen de alberca 10×5×1.5 m:', ['Multiplicar: 10×5×1.5=75 m³','Convertir a litros: 75×1,000=75,000 L','Total: 75,000 litros'], 'Cálculo de capacidad de contenedores.'),
    qMatch('Relaciona cuerpo con su fórmula:', [{left:'Cubo arista a',right:'V=a³'},{left:'Prisma (l×a×h)',right:'V=l×a×h'},{left:'Cilindro (r,h)',right:'V=πr²h'},{left:'Pirámide (Ab,h)',right:'V=Ab×h÷3'}], 'Cada figura 3D tiene su fórmula propia.'),
    qMC('Pecera 50×30×40 cm, volumen:', ['60,000 cm³ = 60 litros','6,000 cm³','600 litros','20 litros'], 0, '50×30×40=60,000 cm³=60 litros.'),
    qWrite('¿Volumen de un cubo de 7 cm de arista?', ['343','343 cm³'], '7×7×7=343 cm³.'),
    qWrite('¿Volumen de un prisma de 10×4×3 cm?', ['120','120 cm³'], '10×4×3=120 cm³.'),
  ],
  // ===== M31: Figuras geométricas - Polígonos =====
  [
    qMC('Un polígono es:', ['Figura plana cerrada de segmentos rectos','Cualquier figura','Solo cuadrados','Figura con curvas'], 0, 'Polígono = lados rectos y cerrado. Número de lados da su nombre.'),
    qMC('¿Cuántos lados tiene un octágono?', ['8 lados','6 lados','10 lados','7 lados'], 0, 'Oct-=8. Señales STOP son octágonos.'),
    qMC('Polígono REGULAR:', ['Todos sus lados Y ángulos IGUALES','Solo lados iguales','Solo ángulos iguales','Tiene curvas'], 0, 'Regular = equilátero + equiángulo. Cuadrado sí, rectángulo no.'),
    qMC('Suma de ángulos internos de un triángulo:', ['SIEMPRE 180°','90°','270°','360°'], 0, 'Propiedad fundamental de todo triángulo.'),
    qMC('Un decágono tiene:', ['10 lados','12 lados','8 lados','9 lados'], 0, 'Deca-=10. Decágono regular: cada ángulo = 144°.'),
    qMC('Polígono convexo:', ['Todos los ángulos internos < 180°','Algún ángulo >180°','Tiene curvas','Solo 3 lados'], 0, 'Convexo: todo segmento entre 2 puntos queda dentro.'),
    qTF('Un rectángulo es un polígono regular.', false, 'Tiene ángulos iguales (90°) pero lados NO iguales. Necesita AMBOS.'),
    qOrder('Ordena polígonos por lados (menor a mayor):', ['Triángulo (3)','Cuadrilátero (4)','Pentágono (5)','Hexágono (6)','Octágono (8)'], 'Prefijos griegos: tri=3, tetra=4, penta=5, hexa=6.'),
    qMatch('Relaciona polígono con características:', [{left:'Triángulo equilátero',right:'3 lados, 60° c/u'},{left:'Cuadrado',right:'4 lados, 90° c/u'},{left:'Pentágono regular',right:'5 lados, 108° c/u'},{left:'Hexágono regular',right:'6 lados, 120° c/u'}], 'Los regulares tienen propiedades simétricas.'),
    qMC('Cuadrilátero = 4 lados. Ejemplos:', ['Cuadrado, rectángulo, rombo, trapecio','Solo cuadrado','Triángulo','Pentágono'], 0, 'Familia de cuadriláteros: múltiples formas.'),
    qWrite('¿Cuántos lados tiene un dodecágono?', ['12'], 'Dodeca-=12. Dodecágono regular: 12 lados.'),
    qWrite('¿Cuántos lados tiene un heptágono?', ['7','siete'], 'Hepta = 7. Heptágono: 7 lados.'),
  ],

  // ===== M32: Triángulos - Clasificación =====
  [
    qMC('Triángulo equilátero:', ['3 lados IGUALES y 3 ángulos de 60°','2 lados iguales','Ningún lado igual','1 ángulo recto'], 0, 'Máxima simetría en triángulos.'),
    qMC('Triángulo isósceles:', ['DOS lados iguales (y dos ángulos iguales)','3 lados iguales','Todos diferentes','1 ángulo recto'], 0, 'Isósceles: 2 lados congruentes + 2 ángulos iguales.'),
    qMC('Triángulo escaleno:', ['Todos los lados DIFERENTES','Dos lados iguales','Tres lados iguales','Un ángulo recto'], 0, 'Escaleno = sin simetría de lados. El más general.'),
    qMC('Triángulo acutángulo:', ['Los 3 ángulos AGUDOS (< 90°)','Un ángulo recto','Un ángulo obtuso','Ángulos de 60°'], 0, 'Acutángulo = todos < 90°. El equilátero es acutángulo.'),
    qMC('Triángulo obtusángulo:', ['UN ángulo > 90° (obtuso)','Todos rectos','Todos agudos','No existe'], 0, 'Solo UNO puede ser >90° porque suma=180°.'),
    qMC('Triángulo rectángulo:', ['Un ángulo = 90°, los otros suman 90°','Todos rectos','No tiene recto','Todos iguales'], 0, 'Base del Teorema de Pitágoras. Catetos e hipotenusa.'),
    qTF('Un triángulo puede tener dos ángulos rectos.', false, 'Imposible: 90°+90°=180°. El tercero sería 0°.'),
    qOrder('Ordena pasos para clasificar triángulo lados 7,7,10:', ['Comparar lados: 7=7 ≠10 → isósceles','Verificar Pitágoras: 7²+7²=98<100 → obtusángulo','Resultado: isósceles obtusángulo'], 'Clasificación por lados Y por ángulos.'),
    qMatch('Relaciona triángulo con clasificación:', [{left:'5,5,5 cm',right:'Equilátero'},{left:'6,6,8 cm',right:'Isósceles'},{left:'90°,45°,45°',right:'Rectángulo isósceles'},{left:'7,9,11 cm',right:'Escaleno'}], 'Clasificación dual: por lados y por ángulos.'),
    qMC('Triángulo más famoso:', ['Rectángulo 3-4-5 (egipcio)','Equilátero','Isósceles','Escaleno'], 0, '3²+4²=25=5². Usado por egipcios para ángulos rectos.'),
    qWrite('¿Tipo de triángulo con lados 8,8,8 cm?', ['equilatero','equilátero'], 'Tres lados iguales.'),
    qWrite('Clasifica un triángulo con lados 6, 6, 6 cm.', ['equilatero','equilátero'], 'Tres lados iguales: equilátero.'),
  ],

  // ===== M33: Cuadriláteros - Clasificación =====
  [
    qMC('Paralelogramo:', ['Lados opuestos PARALELOS e iguales','Solo ángulos rectos','Solo lados iguales','Todos diferentes'], 0, 'Familia: cuadrado, rectángulo, rombo, romboide.'),
    qMC('El cuadrado es:', ['Paralelogramo con 4 lados = Y 4 ángulos rectos','Solo 4 lados iguales','Solo 4 ángulos rectos','Un triángulo'], 0, 'El más "perfecto": hereda propiedades de todos.'),
    qMC('Un rombo:', ['4 lados IGUALES (ángulos NO necesariamente rectos)','Ángulos rectos','Lados desiguales','Diagonales iguales'], 0, 'Rombo = "cuadrado inclinado". Diagonales perpendiculares.'),
    qMC('Un trapecio:', ['AL MENOS 1 par de lados paralelos','Todos paralelos','Ningún paralelo','Solo rectos'], 0, 'Trapecio: bases paralelas. Isósceles: lados no paralelos =.'),
    qMC('Un trapezoide:', ['Cuadrilátero SIN lados paralelos','Con paralelos','Un triángulo','Regular'], 0, 'Trapezoide = el cuadrilátero más general.'),
    qMC('Suma de ángulos de cualquier cuadrilátero:', ['SIEMPRE 360°','180°','270°','540°'], 0, 'Se divide en 2 triángulos: 2×180°=360°.'),
    qTF('El cuadrado es un tipo especial de rectángulo y de rombo.', true, 'Cuadrado = rectángulo (90°) + rombo (lados =). Hereda todo.'),
    qOrder('Ordena cuadriláteros del más general al más específico:', ['Trapezoide','Trapecio','Paralelogramo','Rombo/Rectángulo','Cuadrado'], 'Cada nivel hereda propiedades del anterior.'),
    qMatch('Relaciona cuadrilátero con propiedades:', [{left:'Paralelogramo',right:'Lados opuestos // e ='},{left:'Rectángulo',right:'4 ángulos rectos'},{left:'Rombo',right:'4 lados iguales'},{left:'Trapecio',right:'≥1 par de lados paralelos'}], 'Cada tipo agrega restricciones al general.'),
    qMC('Un papalote (cometa):', ['2 pares de lados CONSECUTIVOS =','Lados opuestos =','Todos =','Rectos'], 0, 'Deltoide: útil en demostraciones de diagonales.'),
    qWrite('¿Suma de ángulos internos de un rectángulo?', ['360','360°'], 'Todo cuadrilátero: 360°.'),
    qWrite('¿Qué cuadrilátero tiene 4 lados = y 4 ángulos rectos?', ['cuadrado'], 'Único con ambas propiedades.'),
  ],

  // ===== M34: Círculo y circunferencia =====
  [
    qMC('La circunferencia es:', ['Puntos a IGUAL distancia (radio) de un centro','El área','El diámetro','Un polígono'], 0, 'Circunferencia = contorno. Círculo = superficie + contorno.'),
    qMC('El radio:', ['Distancia del CENTRO a cualquier punto de la circunferencia','El doble del diámetro','El perímetro','El área'], 0, 'Radio (r) = mitad del diámetro. d=2r.'),
    qMC('El diámetro:', ['Atraviesa el centro, une 2 puntos de la circunferencia','Es el radio','Es el perímetro','Mitad del radio'], 0, 'd=2r. La cuerda más larga posible.'),
    qMC('Longitud de circunferencia r=10 cm:', ['≈ 62.83 cm (2πr)','≈ 31.42 cm','≈ 314.16 cm','≈ 20 cm'], 0, 'C=2πr=2×3.1416×10=62.832 cm.'),
    qMC('Área de círculo r=7 cm:', ['≈ 153.94 cm² (πr²)','≈ 49 cm²','≈ 21.99 cm²','≈ 100 cm²'], 0, 'A=πr²=3.1416×49≈153.94 cm².'),
    qMC('El número π (pi) es:', ['Razón C/d de cualquier círculo (≈3.1416)','Área/radio','C/r','d/área'], 0, 'π = C/d siempre constante. Irracional. Pi Day: 14 marzo.'),
    qTF('El área de un círculo es π×r².', true, 'A=πr². Si r=5 → A≈78.54.'),
    qOrder('Ordena pasos para área de círculo diámetro 14 cm:', ['Calcular radio: 14÷2=7','Elevar: 7²=49','Multiplicar: 49×π≈153.94 cm²'], 'Siempre calcula r primero.'),
    qMatch('Relaciona medidas del círculo:', [{left:'r=5',right:'d=10, C≈31.42, A≈78.54'},{left:'d=20',right:'r=10, C≈62.83, A≈314.16'},{left:'C≈31.416',right:'d=10, r=5'},{left:'A≈201.06',right:'r=8, d=16'}], 'Sabiendo UNA medida, calculas todas.'),
    qMC('Pizza mediana diámetro 30 cm, área:', ['≈ 706.86 cm² (π×15²)','≈ 94.25 cm²','≈ 900 cm²','≈ 450 cm²'], 0, 'r=15. A=π×15²≈706.86.'),
    qWrite('¿Circunferencia de círculo r=5 cm? (π≈3.14)', ['31.4','31.4 cm'], 'C=2×3.14×5=31.4 cm.'),
    qWrite('¿Área de círculo de radio 10 cm? (π≈3.14)', ['314','314 cm²'], 'π×100=314 cm².'),
  ],

  // ===== M35: Cuerpos geométricos - Prismas y pirámides =====
  [
    qMC('Cuerpo geométrico vs figura plana:', ['Tiene 3 DIMENSIONES (volumen)','Es más bonito','Tiene colores','No hay diferencia'], 0, 'Figura plana=2D. Cuerpo=3D (tiene volumen).'),
    qMC('Un prisma:', ['2 bases IGUALES y PARALELAS + caras rectangulares','Solo curvas','1 base','Forma de pelota'], 0, 'Prisma = 2 bases congruentes. Rectangular, triangular...'),
    qMC('Caras laterales de prisma recto:', ['RECTÁNGULOS','Triángulos','Círculos','Hexágonos'], 0, 'Aristas laterales perpendiculares a las bases.'),
    qMC('Una pirámide:', ['1 base (polígono) + caras TRIANGULARES al vértice','2 bases','Rectangulares','Como prisma'], 0, 'Pirámide: base + triángulos. Giza: base cuadrada.'),
    qMC('Volumen de un prisma:', ['V = Ab × h','Ab×h÷3','b×h÷2','largo+ancho+alto'], 0, 'Fórmula general. Prisma rectangular: V=l×a×h.'),
    qMC('Volumen de una pirámide:', ['V = Ab×h÷3','Ab×h','Igual que prisma','No tiene volumen'], 0, 'Pirámide ocupa 1/3 del prisma con = base y altura.'),
    qTF('Un cubo es un prisma especial.', true, 'Cubo = prisma cuadrangular con altura = lado.'),
    qOrder('Ordena cuerpos de menor a mayor volumen (= base y altura):', ['Pirámide (1/3)','Prisma (1)','Cilindro (depende)'], 'Para misma base: prisma=3×pirámide.'),
    qMatch('Relaciona cuerpo con elementos:', [{left:'Prisma pentagonal',right:'2 bases pentágono + 5 rectángulos'},{left:'Pirámide cuadrada',right:'1 base cuadrada + 4 triángulos'},{left:'Cubo',right:'6 cuadrados ='},{left:'Prisma triangular',right:'2 triángulos + 3 rectángulos'}], 'El nombre viene de la base.'),
    qMC('Un tetraedro es:', ['Pirámide de base triangular (4 caras)','Un prisma','Un cubo','Un cilindro'], 0, 'Tetraedro regular: 4 triángulos equiláteros.'),
    qWrite('¿Cuántas caras tiene un prisma rectangular?', ['6'], '6 rectángulos en 3 pares.'),
    qWrite('¿Cuántos vértices tiene un prisma triangular?', ['6'], '2 triángulos = 3+3 = 6 vértices.'),
  ],
  // ===== M36: Ángulos - Conceptos y medición =====
  [
    qMC('Un ángulo se forma por:', ['Dos rayos con origen común (vértice)','Dos líneas paralelas','Un triángulo','Una curva'], 0, 'Ángulo = abertura entre 2 semirrectas. Se mide en grados.'),
    qMC('Unidad de medida de ángulos:', ['Grado (°). Círculo completo = 360°','Metro','Litro','Porcentaje'], 0, '360° = división babilónica antigua.'),
    qMC('Ángulo RECTO:', ['Exactamente 90°','Menos de 90°','Más de 90°','Exactamente 180°'], 0, 'Recto = esquinas de cuadrado o paredes.'),
    qMC('Ángulo AGUDO:', ['Menos de 90° (entre 0° y 90°)','Exactamente 90°','Más de 90°','180°'], 0, 'Agudo = "afilado". Triángulo equilátero: 60°.'),
    qMC('Ángulo OBTUSO:', ['Más de 90° y menos de 180°','Exactamente 90°','180°','Menos de 90°'], 0, 'Obtuso = "romo". Abanico abierto > 90°.'),
    qMC('Ángulo LLANO:', ['Exactamente 180° (línea recta)','90°','270°','360°'], 0, 'Llano = media vuelta. Reloj a las 6:00.'),
    qTF('Un ángulo de 360° es un ángulo completo.', true, '360° = giro completo. Vuelves al punto de partida.'),
    qOrder('Ordena ángulos de menor a mayor apertura:', ['30° (agudo)','90° (recto)','120° (obtuso)','180° (llano)','270° (cóncavo)','360° (completo)'], 'Cada tipo define un rango específico.'),
    qMatch('Relaciona ángulo con clasificación:', [{left:'45°',right:'Agudo'},{left:'90°',right:'Recto'},{left:'135°',right:'Obtuso'},{left:'180°',right:'Llano'}], 'Clasificar por medida: habilidad básica.'),
    qMC('Para medir un ángulo se usa:', ['Transportador (regla semicircular)','Regla común','Compás','La vista'], 0, 'Alinea centro con vértice, lee donde pasa el otro rayo.'),
    qWrite('¿Cuántos grados tiene un ángulo completo?', ['360','360°'], 'Giro completo = 360°.'),
    qWrite('¿Cómo se llama un ángulo de 150°?', ['obtuso'], '>90° y <180° = obtuso.'),
  ],

  // ===== M37: Clasificación de ángulos por posición =====
  [
    qMC('Ángulos COMPLEMENTARIOS:', ['Suman EXACTAMENTE 90°','Suman 180°','Suman 360°','Son iguales'], 0, 'Ej: 30°+60°=90°. Complementan un ángulo recto.'),
    qMC('Ángulos SUPLEMENTARIOS:', ['Suman EXACTAMENTE 180°','Suman 90°','Suman 360°','Son iguales'], 0, 'Ej: 110°+70°=180°. Suplemento = lo que falta para llano.'),
    qMC('Ángulos ADYACENTES:', ['Comparten vértice y un lado, sin solaparse','Están lejos','Son opuestos','No relacionados'], 0, 'Adyacente = "al lado de". Comparten rayo y vértice.'),
    qMC('Ángulos OPUESTOS POR EL VÉRTICE:', ['Son IGUALES (misma medida)','Suman 90°','Suman 180°','Complementarios'], 0, 'Cuando 2 rectas se cruzan: ángulos enfrentados =.'),
    qMC('Si opuestos por el vértice, uno mide 75°, el otro:', ['75° (son iguales)','105°','15°','180°'], 0, 'Opuestos por el vértice SIEMPRE congruentes.'),
    qMC('Ángulos CONSECUTIVOS:', ['Comparten vértice y lado, uno junto al otro','No se tocan','Opuestos','Suman 90°'], 0, 'Consecutivos = adyacentes en secuencia.'),
    qTF('Dos ángulos suplementarios siempre suman 180°.', true, 'α+β=180°. Si α=120°, β=60°.'),
    qOrder('Ordena relaciones angulares de menor a mayor suma:', ['Complementarios (90°)','Suplementarios (180°)','Opuestos por vértice (iguales)','Conjugados (360°)'], 'Cada relación define una suma o igualdad.'),
    qMatch('Relaciona descripción con tipo:', [{left:'Suman 90°',right:'Complementarios'},{left:'Suman 180°',right:'Suplementarios'},{left:'2 rectas cruzan',right:'Opuestos vértice'},{left:'Comparten vértice+lado',right:'Adyacentes'}], 'Conocer relaciones permite calcular ángulos desconocidos.'),
    qMC('El complemento de 35° es:', ['55° (35+55=90)','145°','65°','125°'], 0, 'Complemento = 90°-ángulo. Suplemento = 180°-ángulo.'),
    qWrite('¿Cuál es el suplemento de 45°?', ['135','135°'], '180°-45°=135°.'),
    qWrite('Si un ángulo mide 30°, ¿cuánto mide su complemento?', ['60','60°'], '90-30=60°.'),
  ],

  // ===== M38: Rectas paralelas y perpendiculares =====
  [
    qMC('Rectas PARALELAS:', ['NUNCA se cruzan, misma distancia entre sí','Se cruzan','Forman 90°','Son la misma'], 0, 'Paralelas: misma dirección. Vías del tren. Símbolo: ∥.'),
    qMC('Rectas PERPENDICULARES:', ['Se cruzan formando 90°','Nunca se cruzan','Cualquier ángulo','Paralelas'], 0, 'Perpendicular: intersección a 90°. Esquinas de cuaderno. ⊥.'),
    qMC('Secante corta 2 paralelas: ángulos alternos internos son:', ['IGUALES','Diferentes','Suman 90°','Suman 180°'], 0, 'Propiedad clave: alternos internos =.'),
    qMC('Rectas secantes:', ['Se CRUZAN en un punto (no necesariamente 90°)','Paralelas','La misma recta','No se tocan'], 0, 'Secantes = se cortan. Perpendicular = caso especial.'),
    qMC('En paralelas con secante, ángulos correspondientes:', ['Son IGUALES','Suman 180°','Suman 90°','Agudos'], 0, 'Correspondientes = misma posición relativa. =.'),
    qMC('Distancia entre 2 rectas paralelas:', ['SIEMPRE CONSTANTE','Varía','No existe','Es cero'], 0, 'La perpendicular entre ellas siempre misma medida.'),
    qTF('Las perpendiculares son un caso especial de secantes.', true, 'Secantes = se cruzan. Perpendiculares = a 90°. Subconjunto.'),
    qOrder('Ordena conceptos de recta (simple a complejo):', ['Recta','Semirrecta','Segmento','Secantes','Paralelas'], 'De lo básico a relaciones entre rectas.'),
    qMatch('Relaciona situación con tipo:', [{left:'Vías del tren',right:'Paralelas ∥'},{left:'Esquinas de libro',right:'Perpendiculares ⊥'},{left:'Calles que se cruzan',right:'Secantes'},{left:'Rieles de escalera',right:'Paralelas'}], 'En la vida cotidiana encontramos estos 3 tipos.'),
    qMC('Av. Reforma y Av. Insurgentes (CDMX) se cruzan:', ['Rectas secantes','Paralelas','Coincidentes','No clasificables'], 0, 'Se cruzan en glorieta. No a 90° exactos → secantes.'),
    qWrite('¿Nombre de rectas que nunca se cruzan?', ['paralelas','rectas paralelas'], 'Paralelas: del griego "junto" y "una a la otra".'),
    qWrite('¿Nombre de rectas que se cruzan a 90°?', ['perpendiculares','rectas perpendiculares'], 'Perpendiculares = cruce a 90°.'),
  ],

  // ===== M39: Ángulos entre paralelas y secante =====
  [
    qMC('Ángulos alternos internos:', ['IGUALES','Suplementarios','Complementarios','Sin relación'], 0, 'Están dentro de paralelas, lados opuestos de secante. =.'),
    qMC('Ángulos colaterales internos:', ['Suman 180° (SUPLEMENTARIOS)','Son iguales','Suman 90°','Suman 360°'], 0, 'Mismo lado de secante, entre paralelas.'),
    qMC('Si alterno interno mide 55°, el otro:', ['55° (son iguales)','125°','35°','180°'], 0, 'Alternos internos: misma medida.'),
    qMC('Ángulos correspondientes:', ['Misma posición relativa en cada intersección','Lados opuestos','Dentro de paralelas','Una intersección'], 0, 'Correspondientes = como deslizar la figura. =.'),
    qMC('Dos paralelas + secante = 8 ángulos. ¿Valores distintos?', ['Solo 2 valores (x y 180°-x)','8 valores','4 valores','1 valor'], 0, 'Grupos: agudos = y obtusos = suplemento.'),
    qMC('Si ángulo agudo = 70°, el obtuso:', ['110° (suman 180°)','70°','20°','90°'], 0, 'Agudo+obtuso = suplementarios.'),
    qTF('Los ángulos alternos externos también son IGUALES.', true, 'Alternos externos: fuera de paralelas. También congruentes.'),
    qOrder('Ordena pasos para hallar todos los ángulos (uno = 60°):', ['Agudo = 60°','Obtuso = 180°-60°=120°','Alternos = 60°','Correspondientes = 60°','Colaterales = 120°'], 'Con 1 ángulo deduces los otros 7.'),
    qMatch('Relaciona par de ángulos entre paralelas:', [{left:'Alternos internos',right:'IGUALES'},{left:'Correspondientes',right:'IGUALES'},{left:'Colaterales',right:'SUMAN 180°'},{left:'Opuestos vértice',right:'IGUALES'}], 'Solo 2 patrones: iguales o suman 180°.'),
    qMC('Esta configuración demuestra que:', ['Suma de ángulos del triángulo = 180°','Cuadrados tienen 4 lados','Círculos son redondos','No sirve'], 0, 'Traza paralela a un lado: 3 ángulos alineados = 180°.'),
    qWrite('Si ángulo entre paralelas = 75°, ¿colateral interno?', ['105','105°'], 'Colaterales: 180°-75°=105°.'),
    qWrite('Si alternos internos miden 65°, ¿cuánto colaterales?', ['115','115°'], 'Colaterales: 180°-65°=115°.'),
  ],

  // ===== M40: Bisectriz y mediatriz =====
  [
    qMC('La bisectriz de un ángulo:', ['Semirrecta que DIVIDE el ángulo en 2 partes IGUALES','Une 2 puntos','Lado opuesto','Perpendicular'], 0, 'Bisectriz: cada punto equidista de los lados.'),
    qMC('Ángulo de 80° con bisectriz, cada parte:', ['40°','80°','160°','20°'], 0, '80°÷2=40°. Siempre a la MITAD.'),
    qMC('La mediatriz de un segmento:', ['Recta PERPENDICULAR al segmento en su PUNTO MEDIO','Un ángulo','Cualquier línea','El segmento'], 0, 'Mediatriz: perpendicular + punto medio. Puntos equidistan de extremos.'),
    qMC('Intersección de 3 bisectrices:', ['INCENTRO (centro de circunferencia inscrita)','Baricentro','Ortocentro','Circuncentro'], 0, 'Incentro: equidista de los 3 lados.'),
    qMC('El circuncentro:', ['Intersección de 3 MEDIATRICES','Bisectrices','Alturas','Medianas'], 0, 'Circuncentro: equidista de los 3 vértices.'),
    qMC('Bisectriz de ángulo 60°:', ['Dos ángulos de 30°','Un ángulo de 60°','Dos de 60°','Uno de 120°'], 0, '60°÷2=30°. División exacta garantizada.'),
    qTF('La mediatriz es SIEMPRE perpendicular al segmento.', true, '2 condiciones: 1) perpendicular, 2) punto medio.'),
    qOrder('Ordena pasos para construir mediatriz de AB:', ['Abrir compás > mitad de AB','Pinchar A, arco arriba y abajo','Pinchar B, = radio, arcos','Unir intersecciones = mediatriz'], 'Construcción clásica con regla y compás.'),
    qMatch('Relaciona punto notable con origen:', [{left:'Incentro',right:'3 bisectrices'},{left:'Circuncentro',right:'3 mediatrices'},{left:'Baricentro',right:'3 medianas'},{left:'Ortocentro',right:'3 alturas'}], 'Cada punto de la intersección de 3 rectas especiales.'),
    qMC('En triángulo equilátero, los 4 puntos notables:', ['COINCIDEN en un punto (gran simetría)','Separados','Diferentes','No existen'], 0, 'Incentro=circuncentro=baricentro=ortocentro. Único.'),
    qWrite('¿Cómo se llama la recta que divide un ángulo en 2 partes =?', ['bisectriz'], 'Bi + sectriz = cortar en dos.'),
    qWrite('El punto de intersección de las 3 alturas es el:', ['ortocentro'], 'Ortocentro = intersección de alturas.'),
  ],

  // ===== M41: Tablas de frecuencia y pictogramas =====
  [
    qMC('Una tabla de frecuencia:', ['ORGANIZA datos contando repeticiones de cada valor','Hace dibujos','Suma números','No sirve'], 0, 'Frecuencia = número de veces que aparece un dato.'),
    qMC('Encuesta mascotas: 12 perros, 8 gatos, 5 peces. Total:', ['25 mascotas','12','20','8'], 0, '12+8+5=25. Suma de frecuencias = total de datos.'),
    qMC('La moda es:', ['El valor más REPETIDO (mayor frecuencia)','El promedio','El valor central','El más pequeño'], 0, 'Moda = dato más frecuente. Puede haber más de una.'),
    qMC('Un pictograma:', ['Representa datos con DIBUJOS o símbolos','Solo números','Solo barras','Solo líneas'], 0, 'Ideal para datos cualitativos. Cada ícono = cierta cantidad.'),
    qMC('Si 😊 = 5 alumnos y hay 7 caritas, total:', ['35 alumnos (7×5)','12','5','7'], 0, 'Íconos × valor de cada uno.'),
    qMC('La frecuencia absoluta:', ['Conteo REAL de veces que aparece un dato','Porcentaje','Promedio','Moda'], 0, 'Absoluta = conteo. Relativa = (absoluta/total)×100.'),
    qTF('La frecuencia relativa se expresa como porcentaje.', true, 'Frec relativa = (absoluta÷total)×100%.'),
    qOrder('Ordena pasos para tabla de frecuencia:', ['Recolectar datos','Listar categorías','Contar cada categoría','Calcular relativa si se pide','Presentar tabla'], 'Proceso básico de todo estudio estadístico.'),
    qMatch('Relaciona concepto con definición:', [{left:'Frecuencia absoluta',right:'Conteo real'},{left:'Frecuencia relativa',right:'Porcentaje del total'},{left:'Moda',right:'Mayor frecuencia'},{left:'Muestra',right:'Total de datos'}], 'Conceptos para leer gráficas y reportes.'),
    qMC('Clase: fútbol 10, basquetbol 6, voleibol 4. Moda:', ['Fútbol (mayor frecuencia: 10)','Basquetbol','Voleibol','Todos igual'], 0, 'Moda = fútbol con 10 preferencias.'),
    qWrite('Si ⭐ = 20 personas y hay 4.5 estrellas, ¿cuántas?', ['90'], '4.5×20=90 personas.'),
    qWrite('Datos: 5, 3, 7, 3, 5. ¿Cuál es la moda?', ['3 y 5','bimodal','3,5'], 'Ambos aparecen 2 veces = bimodal.'),
  ],

  // ===== M42: Gráficas de barras =====
  [
    qMC('Gráfica de barras:', ['COMPARA cantidades entre categorías','Muestra tendencias temporales','Dibuja','Suma'], 0, 'Barras: altura proporcional a la frecuencia.'),
    qMC('Eje horizontal (X) en barras:', ['CATEGORÍAS (meses, colores, deportes)','Frecuencias','Números','Nada'], 0, 'X = categorías. Y = frecuencia o cantidad.'),
    qMC('Altura de cada barra:', ['FRECUENCIA de esa categoría','Color','Grosor','Posición'], 0, 'A mayor barra, mayor frecuencia. Compara visualmente.'),
    qMC('Ventas: Ene=$500, Feb=$800, Mar=$650. Barra más alta:', ['Febrero ($800)','Enero','Marzo','Son iguales'], 0, 'Febrero = $800 = barra más alta.'),
    qMC('Temperaturas: Lun=25°, Mar=28°, Mié=22°, Jue=30°. Día más caluroso:', ['Jueves (30°C)','Martes','Lunes','Miércoles'], 0, 'Barra más alta = jueves 30°C.'),
    qMC('Para leer valor exacto de una barra:', ['Proyectar línea horizontal al eje Y','Adivinar','Medir con regla','No importante'], 0, 'Lectura precisa: línea imaginaria al eje de valores.'),
    qTF('Las gráficas de barras pueden ser horizontales o verticales.', true, 'Ambas válidas. Horizontal útil para categorías con nombres largos.'),
    qOrder('Ordena pasos para interpretar gráfica de barras:', ['Leer título','Identificar categorías (X)','Leer escala (Y)','Comparar alturas','Sacar conclusiones'], 'Lectura sistemática: del contexto a los detalles.'),
    qMatch('Relaciona dato con representación:', [{left:'Colores favoritos',right:'Barras'},{left:'Temperatura diaria por mes',right:'Líneas'},{left:'Partes de presupuesto',right:'Circular'},{left:'Conteo con dibujos',right:'Pictograma'}], 'Cada tipo de gráfica según el mensaje.'),
    qMC('Frutas: 🍎25, 🍌18, 🍊15, 🍇22. Barra más baja:', ['Naranja (15)','Manzana','Plátano','Uvas'], 0, 'Menor frecuencia = barra más baja.'),
    qWrite('¿Qué representa la altura de una barra?', ['frecuencia','la frecuencia','cantidad'], 'La frecuencia de esa categoría.'),
    qWrite('Si la barra más alta tiene valor 95, ¿es la moda?', ['si','sí'], 'Sí, la mayor frecuencia = moda.'),
  ],

  // ===== M43: Gráficas de líneas =====
  [
    qMC('Gráfica de líneas:', ['Muestra CAMBIOS o TENDENCIAS en el tiempo','Compara categorías','Partes de un todo','Dibujos'], 0, 'Líneas = evolución temporal. Temperatura, crecimiento.'),
    qMC('Los puntos se unen para:', ['Mostrar TENDENCIA (sube, baja, estable)','Decorar','Confundir','Sin uso'], 0, 'La línea revela el patrón de cambio.'),
    qMC('Línea sube de izq a der:', ['TENDENCIA CRECIENTE (aumento)','Disminución','Estabilidad','Nada'], 0, 'Pendiente positiva = crecimiento.'),
    qMC('Línea horizontal (plana):', ['Estabilidad = NO HAY CAMBIO','Crecimiento rápido','Caída','Error'], 0, 'Horizontal = valor constante.'),
    qMC('Temp: Lun 15°, Mar 18°, Mié 16°, Jue 20°, Vie 22°. Tendencia:', ['CRECIENTE (subió 7° en la semana)','Decreciente','Estable','Aleatoria'], 0, 'Aunque varió, la tendencia general es al alza.'),
    qMC('Gráfica de líneas puede tener más de una serie:', ['Sí, con colores o estilos distintos','No, solo una','Depende','Solo 2'], 0, 'Multiserie: compara patrones. Ventas 2025 vs 2026.'),
    qTF('Gráfica de líneas > barras para datos en el tiempo.', true, 'Barras = categorías. Líneas = tendencias temporales.'),
    qOrder('Ordena pasos para gráfica de líneas de temp semanal:', ['Dibujar ejes (X=días, Y=°C)','Marcar puntos (día, °C)','Unir con segmentos','Poner título y etiquetas'], 'Ejes → puntos → unión → etiquetas.'),
    qMatch('Relaciona tendencia con significado:', [{left:'Línea sube',right:'Aumento'},{left:'Línea baja',right:'Disminución'},{left:'Línea plana',right:'Estabilidad'},{left:'Zigzag',right:'Variabilidad'}], 'Interpretar pendientes = leer noticias con gráficas.'),
    qMC('Lluvia La Paz: Jul=15, Ago=50, Sep=80, Oct=30mm. Pico:', ['Septiembre (80 mm)','Julio','Agosto','Octubre'], 0, 'Pico = punto más alto. Estacionalidad.'),
    qWrite('¿Tipo de gráfica para crecimiento de planta?', ['lineas','líneas','grafica de lineas'], 'Datos en el tiempo → líneas.'),
    qWrite('¿Qué indica una línea que BAJA?', ['disminucion','disminución','decrece'], 'Decrecimiento en el tiempo.'),
  ],

  // ===== M44: Gráficas circulares =====
  [
    qMC('Gráfica circular:', ['PARTES de un TODO (100% = círculo completo)','Tendencias','Comparación barras','Datos sueltos'], 0, 'Pastel = proporciones. Cada sector = fracción/%.'),
    qMC('Sector = 1/4 del círculo:', ['25% del total','50%','75%','100%'], 0, '1/4 = 90°. 90/360 = 1/4 = 25%.'),
    qMC('Ángulo para sector 30%:', ['360° × 0.30 = 108°','30°','360°','90°'], 0, 'Ángulo = (%÷100)×360°.'),
    qMC('Suma de todos los sectores:', ['360° = 100%','180°','90°','270°'], 0, 'Círculo entero = 360° = 100%.'),
    qMC('Presupuesto: Renta 40%, Comida 25%, Trans 15%, Ahorro 10%, Otros 10%. Mayor:', ['Renta (40% = 144°)','Comida','Transporte','Ahorro'], 0, 'A mayor %, mayor sector.'),
    qMC('Dinero que representa 25% de $8,000:', ['$2,000 (8,000×0.25)','$2,500','$250','$25,000'], 0, 'Multiplica total por % en decimal.'),
    qTF('Gráfica circular ideal para cambios en el tiempo.', false, 'Para cambios: líneas. Circular = composición de un todo en un momento.'),
    qOrder('Ordena pasos para construir gráfica circular:', ['Calcular ángulo de cada categoría','Dibujar círculo','Trazar sectores con transportador','Colorear y etiquetar'], 'Requiere transportador para ángulos exactos.'),
    qMatch('Relaciona % con ángulo:', [{left:'25%',right:'90°'},{left:'50%',right:'180°'},{left:'75%',right:'270°'},{left:'10%',right:'36°'}], '% × 3.6 = grados del sector.'),
    qMC('Uso del tiempo: Dormir 8h, Escuela 7h, Tareas 3h, Comer 2h, Juego 4h. Mayor:', ['Dormir (8/24=33.3%)','Escuela','Juego','Tareas'], 0, '8/24=33.3% = sector 120°.'),
    qWrite('¿Cuántos grados mide el sector de 20%?', ['72','72°'], '360°×0.20=72°.'),
    qWrite('En gráfica circular, 30% = ¿grados?', ['108','108°'], '360°×0.30=108°.'),
  ],

  // ===== M45: Media aritmética (promedio) =====
  [
    qMC('La media aritmética:', ['SUMA de valores ÷ número de datos','Valor central','Más repetido','Máx - mín'], 0, 'Promedio = (suma)÷n. Ej: (8+7+9+6)÷4=7.5.'),
    qMC('Promedio de 8, 12, 15, 9:', ['11 (suma=44, 44÷4=11)','12','10','44'], 0, '44÷4=11. No tiene que ser uno de los datos.'),
    qMC('Tres exámenes: 85, 90, 95. Promedio:', ['90 (270÷3)','85','95','92'], 0, '85+90+95=270. 270÷3=90.'),
    qMC('Promedio de 5 números = 20. Suma total:', ['100 (20×5)','20','5','25'], 0, 'Suma = promedio × n.'),
    qMC('Subir promedio de 70 a 80 con nuevo examen (3 actuales):', ['Necesitas 110 (4×80-3×70=110)','80','90','Imposible'], 0, '4×80=320. Suma=210. Faltan 110. Máx 100, imposible subir tanto.'),
    qMC('Promedio temp: 22°, 24°, 20°, 26°, 23°:', ['23° (115÷5)','24°','22°','25°'], 0, '115÷5=23°C. El promedio suaviza los datos.'),
    qTF('El promedio se afecta mucho por valores extremos.', true, 'Ej: 10,11,10,10,60 → promedio=20.2 (distorsionado).'),
    qOrder('Ordena pasos para calcular promedio:', ['Sumar todos los valores','Contar cuántos hay (n)','Dividir suma entre n','Resultado = promedio'], 'Procedimiento universal aplicable a cualquier conjunto.'),
    qMatch('Relaciona situación con promedio:', [{left:'10, 20, 30',right:'20'},{left:'5, 5, 5, 5',right:'5'},{left:'100, 0, 50',right:'50'},{left:'7,8,9,10,11',right:'9'}], 'El promedio sintetiza en un solo número.'),
    qMC('Edades: 12, 14, 13, 12, 14, 13. Promedio:', ['13 años','12 años','14 años','12.5'], 0, '(12+14+13+12+14+13)÷6=78÷6=13.'),
    qWrite('Calcula promedio de: 15, 25, 35, 45', ['30'], '120÷4=30.'),
    qWrite('Calcula el promedio de: 12, 18, 24, 30', ['21'], '(12+18+24+30)÷4=21.'),
  ],

  // ===== M46: Probabilidad - Conceptos básicos =====
  [
    qMC('Probabilidad =', ['Casos FAVORABLES ÷ Casos POSIBLES','Al azar','Siempre 50%','No existe'], 0, 'P = favorables/posibles. Dado: P(3)=1/6. Entre 0 y 1.'),
    qMC('Probabilidad se expresa como:', ['Fracción (1/2), decimal (0.5) o % (50%)','Solo entero','Solo letras','No se expresa'], 0, 'Tres formas equivalentes: 1/4=0.25=25%.'),
    qMC('Evento SEGURO:', ['P=1 (100%). OCURRIRÁ con certeza','P=0','P=0.5','P=2'], 0, 'Ej: dado, sacar número 1-6. Siempre ocurre.'),
    qMC('Evento IMPOSIBLE:', ['P=0 (0%). NO PUEDE OCURRIR','P=1','P=0.5','P=100%'], 0, 'Ej: dado, sacar 7. Nunca ocurre.'),
    qMC('Moneda, P(águila):', ['1/2 = 50%','1/3','1','0'], 0, '2 resultados equiprobables.'),
    qMC('Urna: 3 rojas, 2 azules, 5 verdes. P(roja):', ['3/10 = 30%','3/5','1/3','5/10'], 0, 'Favorables=3. Posibles=10.'),
    qTF('La probabilidad siempre está entre 0 y 1.', true, 'Nunca negativa ni >1. Fuera de rango = error.'),
    qOrder('Ordena eventos de más a menos probable:', ['Que salga el sol (P≈1)','Águila (P=0.5)','6 en dado (P≈0.167)','Lotería (P≈0.0000001)'], 'De certeza a casi imposible.'),
    qMatch('Relaciona P con significado:', [{left:'P=0',right:'Imposible'},{left:'P=0.5',right:'Equiprobable'},{left:'P=1',right:'Seguro'},{left:'P=0.25',right:'Poco probable'}], 'Interpretar probabilidades para decisiones.'),
    qMC('Rifa 100 boletos, compras 5. P(ganar):', ['5/100 = 5%','1/100','5/1=500%','100%'], 0, '5 de 100 = 1/20 = 5%.'),
    qWrite('¿P de sacar roja si 8 rojas y 12 azules?', ['2/5','0.4','40%'], '8/20=2/5=40%.'),
    qWrite('¿P de sacar sol en moneda?', ['1/2','0.5','50%'], '1 favorable de 2 posibles.'),
  ],

  // ===== M47: Probabilidad experimental vs teórica =====
  [
    qMC('Probabilidad TEÓRICA:', ['Predicción ANTES de experimentar (resultados = probables)','Resultado de experimento','Siempre 50%','No existe'], 0, 'Teórica: P(águila)=1/2.'),
    qMC('Probabilidad EXPERIMENTAL:', ['éxitos/intentos tras MUCHAS repeticiones','Fórmulas teóricas','Adivinando','Siempre igual'], 0, '100 lanzamientos, 47 águilas → P≈0.47.'),
    qMC('Ley de Grandes Números:', ['Muchas repeticiones → frecuencia ≈ probabilidad teórica','Todo aleatorio','P cambia','No existe'], 0, 'Entre más lanzamientos, más cerca del 50%.'),
    qMC('10 volados, 7 águilas. P experimental:', ['7/10 = 70%','1/2=50%','7/3','50%'], 0, 'Pocos intentos pueden alejarse mucho del 50%.'),
    qMC('Probabilidad experimental CONFIABLE:', ['MUCHAS repeticiones (cientos o miles)','1 intento','10 máx','No importa'], 0, 'Pocas repeticiones = poco confiable.'),
    qMC('P(6 en dado) teórica = 1/6. 600 lanzamientos:', ['≈100 veces (600/6)','Exactamente 100','600','Nunca'], 0, 'Valor esperado = n×P. Puede ser 98, 102...'),
    qTF('Probabilidad experimental y teórica siempre coinciden.', false, 'Casi nunca exactas. La experimental se ACERCA con repeticiones.'),
    qOrder('Ordena pasos para P experimental de un dado:', ['Lanzar muchas veces (300)','Anotar frecuencia de cada número','Calcular: frecuencia/total','Esa es la P experimental'], 'Método experimental: observar, contar, dividir.'),
    qMatch('Relaciona ejemplo con tipo:', [{left:'P(as)=4/52',right:'Teórica'},{left:'Repartir 200 cartas, contar ases',right:'Experimental'},{left:'500 lanz, 260 águilas',right:'Exp=0.52'},{left:'Dado: P(par)=3/6',right:'Teórica'}], 'Ambos tipos se complementan.'),
    qMC('Basquetbolista: 7/10 tiros libres en partido:', ['P exp = 70% en ese partido','50%','100%','7%'], 0, 'P experimental = 7/10 = 70%. Puede variar otro día.'),
    qWrite('50 volados, 23 águilas. P experimental:', ['0.46','23/50','46%'], '23/50=0.46=46%. Cercano al 50%.'),
    qWrite('Dado 500 veces, sale 4 en 90. P experimental:', ['0.18','18%','90/500'], '90/500=0.18=18%.'),
  ],

  // ===== M48: Juegos de azar y probabilidad =====
  [
    qMC('Dado normal, P(número PAR):', ['3/6=1/2=50%','2/6=1/3','1/6','4/6=2/3'], 0, 'Pares: 2,4,6. 3 de 6.'),
    qMC('Lanzar DOS dados, resultados posibles:', ['6×6=36','12','6','18'], 0, 'Principio fundamental de conteo: 6×6=36.'),
    qMC('2 dados, P(suma 7):', ['6/36=1/6 (1+6,2+5,3+4,4+3,5+2,6+1)','1/36','7/36','1/2'], 0, '6 formas de sumar 7. La suma más probable.'),
    qMC('Baraja 52 cartas, P(corazón):', ['13/52=1/4=25%','1/52','4/52','26/52=1/2'], 0, '4 palos × 13 cartas.'),
    qMC('Ruleta mexicana (38 números), P(acertar):', ['1/38≈2.63%','1/36','1/37','50%'], 0, 'Un número entre 38 posibles.'),
    qMC('3 volados, P(todas águilas):', ['(1/2)³=1/8','1/3','3/8','1/2'], 0, 'Eventos independientes: multiplicas.'),
    qTF('Moneda: águila y sol tienen P=0.5 cada uno.', true, 'Moneda ideal: 2 lados equiprobables.'),
    qOrder('Ordena juegos del más al menos favorable:', ['Volado (P=0.5)','Dado acertar (P≈0.167)','Lotería (P≈0.000001)'], 'Conocer probabilidades = decisiones informadas.'),
    qMatch('Relaciona situación con P:', [{left:'Moneda: águila',right:'1/2'},{left:'Dado: 4',right:'1/6'},{left:'Baraja: rey',right:'4/52=1/13'},{left:'2 dados: suma 12',right:'1/36'}], 'Cada juego tiene sus probabilidades únicas.'),
    qMC('Tómbola: 10 premios, 100 boletos:', ['P=10% ganar. Comparar costo vs premio','Siempre sí','Nunca','50%'], 0, 'Decisión: valor esperado = P×premio - costo.'),
    qWrite('En baraja de 52 cartas, ¿P de sacar AS?', ['1/13','4/52','7.69%'], '4 ases/52=1/13≈7.69%.'),
    qWrite('En baraja, P(carta negra):', ['1/2','0.5','50%'], '26 negras/52=1/2.'),
  ],

  // ===== M49: Diagrama de árbol =====
  [
    qMC('Diagrama de árbol:', ['Muestra TODAS combinaciones de eventos sucesivos','Planta árboles','Cuenta dinero','Suma fracciones'], 0, 'Herramienta visual para probabilidad y conteo.'),
    qMC('2 monedas, ¿cuántas ramas finales?', ['4 (AA, AS, SA, SS)','2','6','8'], 0, '2×2=4 resultados finales.'),
    qMC('Restaurante: 3 sopas, 4 platos. Combinaciones:', ['12 (3×4)','7','1','No se puede'], 0, 'Principio de multiplicación: 3×4=12 menús.'),
    qMC('Principio fundamental de conteo:', ['A(m opciones) + B(n) → m×n combinaciones','Siempre suma','Solo monedas','No existe'], 0, 'Regla del producto: m×n. Para 3: m×n×p.'),
    qMC('1 moneda + 1 dado, resultados:', ['2×6=12 (A1,A2...S6)','8','36','2'], 0, 'Moneda(2)×Dado(6)=12 combinaciones.'),
    qMC('3 camisas × 2 pantalones, combinaciones:', ['6 outfits (3×2)','5','3','2'], 0, 'Árbol: camisa → bifurcación en pantalones.'),
    qTF('Diagrama de árbol visualiza TODAS las posibilidades.', true, 'Herramienta de organización mental poderosa.'),
    qOrder('Ordena pasos para árbol de 3 helados × 2 salsas:', ['Nivel 1: 3 ramas (sabores)','De cada sabor: 2 ramas (salsas)','Contar finales: 3×2=6','Interpretar: 6 combinaciones'], 'El árbol crece nivel a nivel, multiplicando opciones.'),
    qMatch('Relaciona problema con total:', [{left:'2 camisas × 3 pantalones',right:'6'},{left:'3 monedas',right:'8 (2³)'},{left:'Candado 3 dígitos',right:'1,000 (10³)'},{left:'3 sopas×4 platos×2 postres',right:'24'}], 'Cada nivel multiplica las opciones.'),
    qMC('Candado 3 dígitos (0-9), combinaciones:', ['10³=1,000','30','100','3,000'], 0, 'Cada dígito tiene 10 opciones. 10×10×10=1,000.'),
    qWrite('Al lanzar 2 dados, ¿cuántos resultados?', ['36'], '6×6=36 resultados.'),
    qWrite('Con 4 playeras y 3 pantalones, ¿combinaciones?', ['12'], '4×3=12.'),
  ],

  // ===== M50: Probabilidad compuesta =====
  [
    qMC('Eventos INDEPENDIENTES:', ['Resultado de uno NO AFECTA al otro','Siempre dependen','Son lo mismo','No existen'], 0, 'Ej: moneda y dado. Independientes.'),
    qMC('P(A y B) independientes:', ['P(A)×P(B) (MULTIPLICAR)','P(A)+P(B)','P(A)-P(B)','No se puede'], 0, 'P(águila y 6)=1/2×1/6=1/12.'),
    qMC('Eventos MUTUAMENTE EXCLUYENTES:', ['NO pueden ocurrir AL MISMO TIEMPO','Siempre juntos','Independientes','No existen'], 0, 'Dado: sacar 2 y sacar 5 a la vez.'),
    qMC('P(A o B) mutuamente excluyentes:', ['P(A)+P(B) (SUMAR)','P(A)×P(B)','P(A)-P(B)','No se calcula'], 0, 'P(1 o 6)=1/6+1/6=2/6=1/3.'),
    qMC('P(águila Y 5 en dado) =', ['1/2×1/6=1/12≈8.3%','1/2+1/6=2/3','1/8','50%'], 0, 'Independientes: multiplicar.'),
    qMC('Urna: 3 rojas, 2 azules. P(roja O azul):', ['1 (100%, todos los resultados)','3/5','2/5','1/5'], 0, 'Todos los eventos posibles = P=1.'),
    qTF('Si A y B son mutuamente excluyentes: P(A y B)=0.', true, 'No pueden pasar juntos → P=0.'),
    qOrder('Ordena pasos para P(2 águilas en 2 volados):', ['Identificar: independientes','P(águila)₁=1/2','P(águila)₂=1/2','Multiplicar: 1/2×1/2=1/4=25%'], 'Probabilidad compuesta independiente: multiplica.'),
    qMatch('Relaciona operación con tipo:', [{left:'A Y B (indep.)',right:'P(A)×P(B)'},{left:'A O B (mut.excl.)',right:'P(A)+P(B)'},{left:'A O B (no excl.)',right:'P(A)+P(B)-P(A∩B)'},{left:'Complemento A',right:'1-P(A)'}], 'Cada combinación lógica tiene su fórmula.'),
    qMC('P(no sacar 6 en dado) =', ['1-1/6=5/6≈83.3%','1/6','0','1'], 0, 'Complemento: P(fracaso)=5/6.'),
    qWrite('P(águila Y número par en dado):', ['1/4','0.25','25%'], '1/2×3/6=1/2×1/2=1/4.'),
    qWrite('P(sacar rey Y corazones en 1 carta):', ['1/52'], 'Solo rey de corazones = 1 de 52.'),
  ],
  // ===== M51: Números positivos y negativos - Introducción =====
  [
    qMC('Números negativos representan:', ['Cantidades por DEBAJO de CERO (deudas, bajo cero, profundidad)','Más grandes','No existen','Solo avanzados'], 0, 'Negativos: -5°C (hiela), -$200 (deuda), -10m (bajo nivel mar).'),
    qMC('El cero en la recta numérica:', ['Punto de REFERENCIA: positivos (derecha), negativos (izquierda)','Positivo','Negativo','No es número'], 0, 'Cero = origen. Derecha > 0. Izquierda < 0.'),
    qMC('¿Qué número es MENOR: -8 o -3?', ['-8 (más a la IZQUIERDA)','-3','Iguales','No se compara'], 0, 'Más negativo = más pequeño. -8 < -3.'),
    qMC('Valor absoluto:', ['DISTANCIA al cero (siempre positivo). |-5|=5','Signo contrario','El doble','La mitad'], 0, 'Valor absoluto ignora signo. |-8|=8, |5|=5.'),
    qMC('Números SIMÉTRICOS (opuestos):', ['Mismo valor absoluto, signo contrario. Opuesto de 7 = -7','Mismo número','No existen','Suman cero'], 0, '7 y -7: simétricos respecto al cero. Suma = 0.'),
    qMC('Los ENTEROS incluyen:', ['{...,-3,-2,-1,0,1,2,3,...}','Solo positivos','Solo negativos','Solo cero'], 0, 'ℤ = positivos + negativos + cero.'),
    qTF('-5 es mayor que -10.', true, '-5 está a la DERECHA de -10. Entre más negativo, menor.'),
    qOrder('Ordena de menor a mayor:', ['-12','-5','0','3','8'], 'Recta numérica: izquierda → derecha.'),
    qMatch('Relaciona situación con entero:', [{left:'Deber $50',right:'-50'},{left:'Subir 3 pisos',right:'+3'},{left:'5°C bajo cero',right:'-5'},{left:'Nivel del mar',right:'0'}], 'Los enteros modelan situaciones con 2 direcciones.'),
    qMC('Valor absoluto de -15:', ['15','-15','0','30'], 0, '|-15|=15. Elimina el signo.'),
    qWrite('¿Cuál es el opuesto de 23?', ['-23','menos veintitres'], 'Opuesto de 23 = -23.'),
    qWrite('¿Qué número es MENOR: -15 o -3?', ['-15','menos quince'], 'Más a la izquierda en la recta.'),
  ],

  // ===== M52: Suma con números enteros =====
  [
    qMC('5 + (-3):', ['5+(-3)=2 (avanzas 5, retrocedes 3)','8','-8','-2'], 0, 'Sumar negativo = RESTAR. 5+(-3)=5-3=2.'),
    qMC('(-4) + (-6):', ['-10 (debo 4, debo 6 = debo 10)','2','10','-2'], 0, 'Signos = se suman, conserva signo.'),
    qMC('(-3) + 7 =', ['4 (retrocedo 3, avanzo 7)','-4','-10','10'], 0, 'Signos diferentes: resta abs, signo del mayor.'),
    qMC('(-8) + 5 =', ['-3 (más deuda que saldo)','3','13','-13'], 0, '|8| y |5|, dif=3. Signo del mayor: -.'),
    qMC('(+10) + (-10) =', ['0 (opuestos, se anulan)','20','-20','-10'], 0, 'Suma de opuestos = cero. Inverso aditivo.'),
    qMC('(-5)+(+12)+(-8)+(-2) =', ['-3 (pos=12, neg=-15. 12-15=-3)','17','3','0'], 0, 'Agrupa positivos y negativos por separado.'),
    qTF('Sumar negativo = RESTAR su valor absoluto.', true, 'a+(-b)=a-b. 8+(-3)=8-3=5.'),
    qOrder('Ordena pasos para (-7)+(+10)+(-3):', ['Sumar positivos: 10','Negativos: -10','Combinar: 10+(-10)=0','Resultado: 0'], 'Agrupación para simplificar.'),
    qMatch('Relaciona suma con resultado:', [{left:'6+(-9)',right:'-3'},{left:'(-4)+(-5)',right:'-9'},{left:'(-2)+8',right:'6'},{left:'15+(-15)',right:'0'}], 'Dominar reglas de signos = confianza.'),
    qMC('Buzo: baja 15m (-15), sube 8m. Posición:', ['-7 metros (7m bajo nivel)','-23 m','+7 m','+23 m'], 0, '-15+(+8)=-7m.'),
    qWrite('(-12)+5+(-3) = ?', ['-10'], '-12+5=-7. -7+(-3)=-10.'),
    qWrite('(-20)+8-(-4) = ?', ['-8'], '-20+8+4 = -8.'),
  ],

  // ===== M53: Resta con números enteros =====
  [
    qMC('8 - (-3):', ['8-(-3)=8+3=11','5','-5','-11'], 0, 'Restar negativo = SUMAR. Quitar deuda = ganancia.'),
    qMC('Regla para restar enteros:', ['a-b = a+(opuesto de b). Restar = sumar OPUESTO','Restar abs','No hay regla','Depende'], 0, 'Toda resta → suma con signo cambiado.'),
    qMC('(-6) - (+2) =', ['-8','-4','4','8'], 0, '(-6)-(+2)=(-6)+(-2)=-8.'),
    qMC('4 - 9 =', ['-5','5','13','-13'], 0, '4-9=4+(-9)=-5. Puede dar negativo.'),
    qMC('(-3) - (-7) =', ['4','-4','-10','10'], 0, '(-3)-(-7)=(-3)+7=4.'),
    qMC('Diferencia -5°C y -12°C:', ['7°C (|-5-(-12)|=|7|=7)','-17°C','17°C','-7°C'], 0, 'Diferencia = |resta|.'),
    qTF('Restar un número = sumar su opuesto.', true, 'a-b=a+(-b). Unifica suma y resta.'),
    qOrder('Ordena pasos para 10-(+3)-(-5):', ['Convertir: 10+(-3)+(+5)','10+(-3)=7','7+5=12','Resultado: 12'], 'Cada resta → suma del opuesto.'),
    qMatch('Relaciona resta con resultado:', [{left:'5-(-8)',right:'13'},{left:'(-4)-(+6)',right:'-10'},{left:'(-2)-(-9)',right:'7'},{left:'0-(+7)',right:'-7'}], 'Regla: cambia signo y suma.'),
    qMC('Temperatura: -3°C. BAJA otros 5°:', ['-8°C (-3-5=-8)','+2°C','-2°C','+8°C'], 0, 'Bajar = restar. -3-5=-8.'),
    qWrite('(-8)-(-3) = ?', ['-5'], '-8+3=-5.'),
    qWrite('0-(-12) = ?', ['12'], 'Restar -12 = sumar 12.'),
  ],

  // ===== M54: Multiplicación con números enteros =====
  [
    qMC('(+)×(−) =', ['NEGATIVO. (+5)×(−3)=−15','POSITIVO','CERO','Depende'], 0, 'Signos DIFERENTES → negativo.'),
    qMC('(−)×(−) =', ['POSITIVO. (−4)×(−3)=+12','NEGATIVO','CERO','Depende'], 0, 'Signos IGUALES → positivo.'),
    qMC('¿Por qué (−2)×(−5)=+10?', ['Opuesto de 2×(−5). Quitar deuda ×2 = ganancia','Porque sí','No hay razón','No cierto'], 0, 'Consistente matemática e intuitivamente.'),
    qMC('Multiplicar por −1:', ['CAMBIA el signo. (−1)×8=−8, (−1)×(−7)=7','No hace nada','Duplica','Divide'], 0, '−1 = "cambiador de signo".'),
    qMC('(−3)×(−2)×(−4) =', ['−24 (impar de − → negativo)','+24','−9','12'], 0, '3 negativos = IMPAR → −.'),
    qMC('Signo final de multiplicación:', ['Contar factores NEGATIVOS. PAR→+, IMPAR→−','Siempre +','Siempre −','No importa'], 0, 'Regla: par se cancelan, impar deja uno.'),
    qTF('(+7)×(−3)=−21.', true, 'Signo diferente → negativo.'),
    qOrder('Ordena pasos para (−2)×(+5)×(−3)×(−1):', ['Contar −: 3 negativos','IMPAR → resultado NEGATIVO','Mult abs: 2×5×3×1=30','Resultado: −30'], 'Primero signo, luego valores.'),
    qMatch('Relaciona multiplicación con resultado:', [{left:'6×(−4)',right:'−24'},{left:'(−5)×(−7)',right:'35'},{left:'(−8)×3',right:'−24'},{left:'(−2)³',right:'−8'}], 'Regla de signos: poderosa.'),
    qMC('Debes $15 a 4 amigos:', ['4×(−15)=−$60 (deuda total)','4×15=$60','−4×15','15−4=$11'], 0, 'Modelado: personas×deuda.'),
    qWrite('(−9)×(−3) = ?', ['27'], 'Signos = → +. 9×3=27.'),
    qWrite('(−7)×(−2)×(−1) = ?', ['−14'], '3 negativos (impar) → −14.'),
  ],

  // ===== M55: División con números enteros =====
  [
    qMC('Reglas de signos para división:', ['MISMAS que multiplicación. =→+, ≠→−','Diferentes','No aplican','Siempre +'], 0, 'División y × comparten reglas.'),
    qMC('(+24)÷(−6) =', ['−4','+4','6','−6'], 0, 'Signo ≠ → negativo.'),
    qMC('(−30)÷(−5) =', ['6','−6','−25','25'], 0, 'Signos = → positivo.'),
    qMC('La división NO es conmutativa:', ['(+8)÷(−2)=−4, (−2)÷(+8)=−0.25','Sí es','No importa','Depende'], 0, 'El orden IMPORTA en división.'),
    qMC('(−48)÷(+8) =', ['−6','+6','−48','+48'], 0, 'Signos ≠ → negativo.'),
    qMC('(−120)÷(−15):', ['Ignora signos: 120÷15=8. = → +8','−8','15','No'], 0, 'Método: divide abs, aplica regla.'),
    qTF('(−100)÷(+25)=−4.', true, 'Signos ≠ → negativo.'),
    qOrder('Ordena pasos para (−72)÷(+9)÷(−2):', ['(−72)÷(+9)=−8','(−8)÷(−2)=4','Resultado: 4'], 'Aplica reglas en CADA paso.'),
    qMatch('Relaciona división con cociente:', [{left:'(+36)÷(−4)',right:'−9'},{left:'(−50)÷(−10)',right:'5'},{left:'(−81)÷(+9)',right:'−9'},{left:'(+64)÷(−8)',right:'−8'}], 'División con enteros = directa.'),
    qMC('Submarino baja 120m en 6min:', ['−20 m/min (descenso negativo)','+20','−120','+6'], 0, 'Descenso = cambio −. −120÷6=−20 m/min.'),
    qWrite('(−96)÷(+8) = ?', ['−12'], '96÷8=12. ≠ → −12.'),
    qWrite('(−144)÷12 = ?', ['−12'], '144÷12=12. ≠ → −12.'),
  ],

  // ===== M56: Múltiplos =====
  [
    qMC('Un múltiplo:', ['Resultado de MULTIPLICAR el número por entero positivo','Dividir','Sumar','Número primo'], 0, 'Múltiplos de 3: 3,6,9,12... (3×1,3×2...). Infinitos.'),
    qMC('¿48 es múltiplo de 6?', ['SÍ (6×8=48)','NO','Depende','Solo si par'], 0, '48÷6=8 exacto → sí.'),
    qMC('Primeros 5 múltiplos de 7:', ['7,14,21,28,35','7,17,27,37,47','1,7,14,21,28','No existen'], 0, 'n×1, n×2, n×3...'),
    qMC('¿55 es múltiplo de 11?', ['SÍ (11×5=55)','NO','A veces','Solo pares'], 0, '55÷11=5 exacto.'),
    qMC('Múltiplos de 2 se llaman:', ['Números PARES','Impares','Primos','Compuestos'], 0, 'Todo múltiplo de 2 es par.'),
    qMC('¿Cero es múltiplo de cualquier número?', ['SÍ (0=n×0), pero no en secuencias naturales','NO','De algunos','Depende'], 0, 'n×0=0. Pero al listar empezamos ×1.'),
    qTF('Los múltiplos de un número son INFINITOS.', true, 'Siempre puedes × por un entero más grande.'),
    qOrder('Ordena números según sean múltiplos de 3:', ['9 (3×3)','15 (3×5)','21 (3×7)','30 (3×10)','100 (NO)'], '¿División exacta? Si no, no es múltiplo.'),
    qMatch('Relaciona número con primeros múltiplos:', [{left:'4',right:'4,8,12,16,20...'},{left:'6',right:'6,12,18,24,30...'},{left:'9',right:'9,18,27,36,45...'},{left:'12',right:'12,24,36,48,60...'}], 'Números que aparecen en varias listas = múltiplos COMUNES.'),
    qMC('Múltiplos comunes de 4 y 6:', ['12,24,36,48... (en AMBAS tablas)','Solo 4','Solo 6','No existen'], 0, 'Intersección de listas. El menor = mcm.'),
    qWrite('¿Es 72 múltiplo de 8?', ['si','sí'], '72÷8=9 exacto.'),
    qWrite('¿Es 96 múltiplo de 8?', ['si','sí'], '96÷8=12 exacto.'),
  ],

  // ===== M57: Divisores =====
  [
    qMC('Un divisor:', ['Número que divide EXACTAMENTE (residuo CERO)','Mayor','Solo el mismo','Cualquiera'], 0, 'Divisores de 12: 1,2,3,4,6,12.'),
    qMC('Divisores de 15:', ['1,3,5,15','1,2,3,5','Solo 1 y 15','3 y 5'], 0, '15÷1=15, 15÷3=5, 15÷5=3, 15÷15=1.'),
    qMC('TODO número es divisible entre:', ['1 y entre SÍ MISMO','Solo 1','Solo sí mismo','Ninguno'], 0, 'Divisores triviales siempre existen.'),
    qMC('¿Cuántos divisores tiene 36?', ['9 (1,2,3,4,6,9,12,18,36)','6','12','4'], 0, 'Nueve divisores en total.'),
    qMC('Número PRIMO:', ['Exactamente 2 divisores: 1 y él mismo','Muchos divisores','Ninguno','Uno solo'], 0, 'Primos: 2,3,5,7,11,13,17,19,23...'),
    qMC('Número COMPUESTO:', ['Más de DOS divisores','Exactamente 2','Ninguno','Es primo'], 0, 'Compuesto = al menos 1 divisor no trivial.'),
    qTF('El 1 NO es primo ni compuesto.', true, 'Solo 1 divisor. No califica como primo (2) ni compuesto (>2).'),
    qOrder('Ordena pasos para divisores de 24:', ['1→24, 2→12, 3→8, 4→6','Lista: 1,2,3,4,6,8,12,24'], 'Busca hasta √24. Los demás = pares.'),
    qMatch('Relaciona número con #divisores:', [{left:'7 (primo)',right:'2'},{left:'10',right:'4 (1,2,5,10)'},{left:'16',right:'5 (1,2,4,8,16)'},{left:'30',right:'8'}], 'Contar divisores = clasificar números.'),
    qMC('Repartir 48 en grupos iguales:', ['Tamaños: 1,2,3,4,6,8,12,16,24,48','Solo de 2','Solo 48','De 5'], 0, 'Los divisores = formas de agrupar.'),
    qWrite('¿Cuántos divisores tiene 13?', ['2','dos'], '13 es primo: 1 y 13.'),
    qWrite('¿Cuántos divisores tiene 25?', ['3','tres'], '1, 5, 25. Tres divisores.'),
  ],

  // ===== M58: Criterios de divisibilidad =====
  [
    qMC('Divisible entre 2 si:', ['Termina en 0,2,4,6,8 (PAR)','Termina en 1,3,5,7,9','Cualquiera','Solo 2'], 0, 'Mira último dígito.'),
    qMC('Divisible entre 3 si:', ['SUMA de dígitos ÷3','Termina en 3,6,9','×6','Solo 3'], 0, 'Ej: 471→4+7+1=12, 12÷3=4 → sí.'),
    qMC('¿1,245 divisible entre 5?', ['SÍ (termina en 5)','NO','Solo si 10','Depende'], 0, 'Criterio de 5: termina en 0 o 5.'),
    qMC('Divisible entre 4 si:', ['ÚLTIMOS 2 dígitos → múltiplo de 4','Termina en 4','Par','Suma = 4'], 0, 'Ej: 2,316→16 es ×4 → sí.'),
    qMC('Divisible entre 6 si:', ['Divisible entre 2 Y entre 3','Solo si termina en 6','Todos','Solo par'], 0, '6=2×3. Debe cumplir AMBOS.'),
    qMC('Divisible entre 9:', ['SUMA de dígitos ÷9','Terminar en 9','×3','Ninguno'], 0, 'Como 3 pero más estricto.'),
    qTF('Divisible entre 10 = termina en 0.', true, 'Criterio más fácil.'),
    qOrder('Ordena criterios por frecuencia:', ['÷2: último par','÷3: suma dígitos','÷5: termina 0/5','÷10: termina 0','÷4: últimos 2'], 'Dominar = ahorro de tiempo.'),
    qMatch('Relaciona número con criterios:', [{left:'846 (par, suma=18)',right:'÷2,3,6,9'},{left:'1,735 (termina 5)',right:'÷5'},{left:'9,876 (76=4×19)',right:'÷4'},{left:'4,320',right:'÷2,3,4,5,6,9,10'}], 'Algunos números "estrella".'),
    qMC('¿7,281 divisible entre 3?', ['SÍ (7+2+8+1=18, ÷3)','NO','A veces','Depende'], 0, 'Suma=18→×3→sí.'),
    qWrite('¿Número que termina en 0, divisible entre?', ['2,5,10','2 5 10'], 'Todo número terminado en 0.'),
    qWrite('¿Es 2475 divisible entre 9?', ['si','sí'], '2+4+7+5=18, 18÷9=2. Sí.'),
  ],

  // ===== M59: MCD (Máximo Común Divisor) =====
  [
    qMC('MCD:', ['MAYOR número que divide EXACTAMENTE a todos','Más pequeño','Suma','Producto'], 0, 'MCD(12,18)=6. Máximo divisor común.'),
    qMC('MCD(24,36):', ['Divisores comunes: 1,2,3,4,6,12. MCD=12','Suma','Multiplica','Siempre 1'], 0, 'Método por lista: comunes, tomar mayor.'),
    qMC('MCD(15,28) =', ['1 (coprimos)','3','5','7'], 0, 'Sin divisores >1 comunes.'),
    qMC('DESCOMPOSICIÓN para MCD:', ['Factores primos. MCD = comunes con MENOR exponente','Solo descomponer 1','No se usa','Sumar'], 0, '12=2²×3, 18=2×3². MCD=2×3=6.'),
    qMC('MCD(20,30,50):', ['10 (comunes: 2×5)','5','20','50'], 0, '20=2²×5, 30=2×3×5, 50=2×5². MCD=2×5=10.'),
    qMC('MCD(a,b)=1 →', ['COPRIMOS (primos entre sí)','Compuestos','Múltiplos','Iguales'], 0, 'Coprimos: único divisor común = 1.'),
    qTF('MCD NUNCA > menor de los números.', true, 'MCD ≤ menor. Debe dividir a ambos.'),
    qOrder('Ordena pasos para MCD(48,72):', ['48=2⁴×3','72=2³×3²','Comunes: 2³ y 3','MCD=2³×3=24'], 'Descomposición: rápido y escalable.'),
    qMatch('Relaciona par con MCD:', [{left:'12 y 18',right:'6'},{left:'25 y 35',right:'5'},{left:'48 y 80',right:'16'},{left:'9 y 16',right:'1'}], 'MCD para simplificar fracciones.'),
    qMC('Equipos mixtos 24 niños, 36 niñas:', ['Equipos de 12 (MCD=24)','6','24','36'], 0, 'MCD(24,36)=12. Máximo tamaño equipos.'),
    qWrite('MCD(18,27) = ?', ['9'], '18=2×3², 27=3³. MCD=3²=9.'),
    qWrite('MCD(100,75) = ?', ['25'], '100=2²×5², 75=3×5². MCD=5²=25.'),
  ],

  // ===== M60: mcm (Mínimo Común Múltiplo) =====
  [
    qMC('mcm:', ['MENOR múltiplo COMÚN de todos los números','Mayor divisor','Suma','Producto'], 0, 'mcm(4,6)=12. Menor en ambas listas.'),
    qMC('mcm(5,7) =', ['35 (5×7, coprimos)','12','70','1'], 0, 'Coprimos: mcm = producto.'),
    qMC('MCD × mcm =', ['a × b (propiedad fundamental)','a+b','a−b','No hay relación'], 0, 'MCD(12,18)=6, mcm(12,18)=36. 6×36=216=12×18.'),
    qMC('mcm por DESCOMPOSICIÓN:', ['Todos los factores con MAYOR exponente','Menor exponente','No se usa','Solo 1 número'], 0, '12=2²×3, 18=2×3². mcm=2²×3²=36.'),
    qMC('mcm(8,12,15):', ['120 (2³×3×5)','60','24','30'], 0, 'Toma todos los factores con máx exponente.'),
    qMC('El mcm se usa para:', ['Sumar fracciones con ≠ denominador','Sumar enteros','Multiplicar','Dividir'], 0, '1/4+1/6. mcm=12. Denominador común.'),
    qTF('mcm ≥ mayor de los números.', true, 'Debe ser múltiplo de todos.'),
    qOrder('Ordena pasos para mcm(15,20,30):', ['15=3×5, 20=2²×5, 30=2×3×5','Factores: 2,3,5','Mayor exp: 2²,3,5','Multiplicar: 4×3×5=60'], 'Método de factores primos.'),
    qMatch('Relaciona par con mcm:', [{left:'6 y 8',right:'24'},{left:'10 y 15',right:'30'},{left:'9 y 12',right:'36'},{left:'7 y 11',right:'77'}], 'mcm en sincronización y ciclos.'),
    qMC('Autobuses: cada 15min y 20min:', ['Coinciden cada 60min (mcm=60)','35min','120min','300min'], 0, 'Problema clásico de ciclos.'),
    qWrite('mcm(14,21) = ?', ['42'], '14=2×7, 21=3×7. mcm=2×3×7=42.'),
    qWrite('mcm(11,13) = ?', ['143'], '11×13=143. Coprimos.'),
  ],

  // ===== M61: Razón entre dos cantidades =====
  [
    qMC('Una RAZÓN:', ['COMPARACIÓN de 2 cantidades por división (a:b)','Suma','Opinión','Resta'], 0, 'Razón = cociente. 15 niños:10 niñas = 15/10=3/2.'),
    qMC('"2 de cada 5" →', ['2/5 o 2:5','5/2','2+5','5×2'], 0, 'Notación: a/b o a:b.'),
    qMC('Receta: 3 harina : 2 azúcar:', ['3:2 (o 3/2=1.5)','2:3','3+2=5','3×2=6'], 0, 'Compara cantidades relativas.'),
    qMC('Razón 45 km / 3 horas:', ['15 km/h (45÷3)','45 km/h','3 km/h','135 km/h'], 0, 'Razón = velocidad = d/t.'),
    qMC('Razón áurea φ≈1.618:', ['Naturaleza (conchas) y arte (Da Vinci)','Solo mates','No existe','Solo libros'], 0, 'φ=(1+√5)/2. Partenón, Gioconda.'),
    qMC('Razón equivalente a 2/5:', ['4/10=6/15 (× mismo número)','2/5×2=4/5','Sin equivalentes','50%'], 0, 'Multiplica numerador y denominador.'),
    qTF('Una razón siempre compara misma unidad.', false, 'Pueden ser ≠. km/h ($/kg, hab/km²).'),
    qOrder('Ordena pasos para simplificar 24:36:', ['MCD(24,36)=12','24÷12=2, 36÷12=3','2:3'], 'Simplificar = ÷ entre MCD.'),
    qMatch('Relaciona situación con razón:', [{left:'20 caramelos/4 niños',right:'5:1'},{left:'60km/2h',right:'30 km/h'},{left:'$150/3kg',right:'$50/kg'},{left:'6 de 10 votos',right:'3/5=60%'}], 'Razones en velocidad, precio, estadísticas.'),
    qMC('Densidad (hab/km²) es razón:', ['Entre habitantes y km² (≠ unidades)','Solo =','No es razón','Siempre 1'], 0, 'CDMX≈6,000 hab/km². Compara.'),
    qWrite('Simplifica 45:60.', ['3:4','3/4'], 'MCD=15. 45÷15=3, 60÷15=4.'),
    qWrite('La razón 3:8 como decimal:', ['0.375'], '3÷8=0.375.'),
  ],

  // ===== M62: Proporciones =====
  [
    qMC('PROPORCIÓN:', ['IGUALDAD entre 2 razones (a/b=c/d)','Una razón','Suma','No existe'], 0, '1/2=3/6. Misma parte del todo.'),
    qMC('3/5=9/15, producto cruzado:', ['3×15=5×9=45','3×9=5×15','3+15','No hay'], 0, 'a/b=c/d → a×d=b×c.'),
    qMC('Verificar 4/10=6/15:', ['4×15=60, 10×6=60. SÍ','No se puede','No son','Depende'], 0, 'Productos cruzados =.'),
    qMC('x/8=3/4, x =', ['6 (4x=24)','8','4','2'], 0, '4x=24→x=6. 6/8=3/4 ✓.'),
    qMC('Extremos y medios:', ['a:b::c:d. a,d=extremos, b,c=medios','Iguales','No existen','Solo libros'], 0, 'Extremos×extremos=medios×medios.'),
    qMC('Cuarto proporcional: 6/9=?/12:', ['6×12/9=72/9=8','4','12','6'], 0, 'Producto cruzado: 6×12=9x→x=8.'),
    qTF('Extremos × extremos = medios × medios.', true, 'Propiedad fundamental de proporciones.'),
    qOrder('Ordena pasos para 15/x=5/3:', ['15×3=5×x','45=5x','x=9','Verificar: 15/9=5/3 ✓'], 'Producto cruzado confiable.'),
    qMatch('Relaciona proporción con x:', [{left:'2/3=x/9',right:'x=6'},{left:'x/4=5/10',right:'x=2'},{left:'8/12=10/x',right:'x=15'},{left:'3/x=9/15',right:'x=5'}], 'Resolver con producto cruzado.'),
    qMC('Proporcionalidad se aplica en:', ['Escalas mapas, recetas, fotografía','Solo mates','No se usa','Exámenes'], 0, 'En todas partes: diseño, ciencia, arte.'),
    qWrite('5/8=x/24, ¿x?', ['15'], '5×24=8x, 120=8x → x=15.'),
    qWrite('4/7=20/x, ¿x?', ['35'], '4x=140 → x=35.'),
  ],

  // ===== M63: Escalas =====
  [
    qMC('ESCALA en mapa:', ['Relación distancia mapa : distancia REAL','Temperatura','Altura','Sin significado'], 0, '1:100,000 → 1cm=100,000cm=1km.'),
    qMC('Escala 1:50,000, 4cm en mapa:', ['2 km (4×50,000=200,000cm=2km)','50km','0.2km','20km'], 0, 'cm×escala=cm reales.'),
    qMC('Escala REDUCTORA 1:10:', ['1 dibujo = 10 real (más PEQUEÑO)','Lo contrario','Más grande','No existe'], 0, '1:n→reductor. n:1→ampliador.'),
    qMC('Escala AMPLIADORA 5:1:', ['5 dibujo = 1 real (detalles PEQUEÑOS)','Más chico','No se usa','Igual'], 0, 'Para bacterias, circuitos, insectos.'),
    qMC('CDMX-Guadalajara 550km, escala 1:5,000,000:', ['11 cm en mapa','5.5cm','55cm','550cm'], 0, '550km=55,000,000cm÷5M=11cm.'),
    qMC('Plano arquitectónico 1:100, pared 4m real:', ['4 cm en plano','40cm','400cm','0.4cm'], 0, '4m=400cm. 400÷100=4cm.'),
    qTF('Escala 1:1 = dibujo = objeto real.', true, 'Escala natural. Mismo tamaño.'),
    qOrder('Ordena pasos para distancia real (mapa 1:250,000, 8cm):', ['8×250,000=2,000,000cm','÷100,000=20km','Resultado: 20km'], 'cm mapa × escala /100,000 = km.'),
    qMatch('Relaciona escala con uso:', [{left:'1:1,000,000',right:'Mapa carretera'},{left:'1:100',right:'Plano casa'},{left:'10:1',right:'Detalle pieza'},{left:'1:10,000',right:'Plano ciudad'}], 'Escala según tamaño y detalle.'),
    qMC('Mapa La Paz: aeropuerto 6cm, esc.1:200,000:', ['12 km (6×200k=1,200k cm=12km)','3km','6km','24km'], 0, '1,200,000cm=12km. Aprox distancia real.'),
    qWrite('Escala 1:25,000, 10cm = ¿km?', ['2.5','2.5 km'], '10×25,000=250,000cm=2.5km.'),
    qWrite('Escala 1:500,000, 3cm = ¿km?', ['15'], '3×500,000=1,500,000cm=15km.'),
  ],

  // ===== M64: Proporcionalidad en tablas =====
  [
    qMC('Tabla de proporcionalidad directa:', ['Razón y/x CONSTANTE (k) en cada renglón','Sin constante','Varía','Inversa'], 0, 'Si 1kg=$20, 2=$40... k=20 siempre.'),
    qMC('Tabla: 2→14, entonces 5→:', ['35 (k=14÷2=7, 5×7=35)','28','70','20'], 0, 'Encuentra k, multiplica.'),
    qMC('Tabla de proporcionalidad INVERSA:', ['PRODUCTO x·y constante (2×60=120, 4×30=120)','Suma constante','Razón constante','Sin patrón'], 0, 'Inversa: x×y=k.'),
    qMC('Tabla: x:3,5,8; y:9,?,24. k=', ['k=9/3=3. x=5→y=15. 24/8=3 ✓','k=3/9','No hay k','Varía'], 0, 'Identifica k con datos completos.'),
    qMC('Tabla proporcional si:', ['TODOS y/x (directa) o TODOS x·y (inversa) CONSTANTES','Lista cualquiera','Sin manera','Depende'], 0, 'Prueba de consistencia.'),
    qMC('Pintura: 2L→30m², 5L→75m², 8L→?:', ['120m² (k=15m²/L. 8×15=120)','100','90','80'], 0, 'Problema de cobertura.'),
    qTF('En tabla directa, k=y/x es constante.', true, 'Definición. Si varía, no es proporcional.'),
    qOrder('Ordena pasos para verificar tabla directa:', ['Calcular y/x para cada par','Si todos = → proporcional','Si ≠ → no es','k = ese valor común'], 'Prueba de proporcionalidad.'),
    qMatch('Relaciona tabla con constante:', [{left:'x:1,2,3; y:4,8,12',right:'k=4'},{left:'x:5,10,15; y:25,50,75',right:'k=5'},{left:'x:2,4,8; y:10,20,40',right:'k=5'},{left:'x:3,6,9; y:12,24,36',right:'k=4'}], 'Identificar k = paso clave.'),
    qMC('Ganancia: 2h=$90, 5h=? (directa):', ['$225 (k=$45/h)','$180','$450','$90'], 0, 'Constante = $45/hora.'),
    qWrite('Tabla directa: 4→24, 7→?', ['42'], 'k=24÷4=6. 7×6=42.'),
    qWrite('Si k=9 y x=6, ¿y en prop. directa?', ['54'], 'y=kx=9×6=54.'),
  ],

  // ===== M65: Porcentajes como razones =====
  [
    qMC('% como razón:', ['Razón con denominador 100 (25%=25/100)','Número cualquiera','Solo 50%','Suma'], 0, '% = parte/total×100. 25%=25:100=1:4.'),
    qMC('"3 de cada 4" como razón:', ['3:4=3/4=0.75=75%','4:3','3:1','No es razón'], 0, 'Parte/total=3/4=75%.'),
    qMC('Razón 1:5 como %:', ['20% (1÷5=0.20)','5%','50%','15%'], 0, '1 de 5=1/5=0.20=20%.'),
    qMC('¿Qué % es 30 de 120?', ['25% (30÷120=0.25)','30%','10%','40%'], 0, '30/120=1/4=25%.'),
    qMC('8 de 20 usan lentes, %:', ['40% (8÷20=0.4)','8%','20%','80%'], 0, '8/20=2/5=0.4=40%.'),
    qMC('Oferta "3×2":', ['33.3% descuento (pagas 2/3 del precio)','50%','100%','0%'], 0, 'Ahorras 1 de 3=33.3%.'),
    qTF('"1 de cada 4" = 25%.', true, '1/4=0.25=25%.'),
    qOrder('Ordena pasos para razón → %:', ['Razón como fracción a/b','Dividir a÷b','×100','Agregar %'], 'Fracción→decimal→porcentaje.'),
    qMatch('Relaciona razón con %:', [{left:'1:2',right:'50%'},{left:'1:4',right:'25%'},{left:'3:5',right:'60%'},{left:'7:10',right:'70%'}], 'Razones cotidianas mejor como %.'),
    qMC('Encuesta: aprobación 3:5, %:', ['60% (3/5=0.6)','40%','3%','5%'], 0, '3 de 5 aprueban = 60%.'),
    qWrite('Razón 7:20, ¿%?', ['35','35%'], '7÷20=0.35=35%.'),
    qWrite('Razón 7:8 como %.', ['87.5','87.5%'], '7÷8=0.875=87.5%.'),
  ],

  // ===== M66: Regla de tres simple directa =====
  [
    qMC('Regla de tres directa:', ['Encontrar VALOR DESCONOCIDO en proporción directa','Sumar 3','Dividir','No sirve'], 0, '"Si A→B, C→X". X=(C×B)÷A.'),
    qMC('5kg manzana=$150, ¿8kg?', ['$240 (8×150÷5)','$300','$120','$200'], 0, 'X=(8×150)÷5=240.'),
    qMC('Regla de tres directa:', ['A MÁS kg, MÁS $ (proporción DIRECTA)','Inversa','Aleatoria','Fija'], 0, '¿Ambas crecen juntas? → Directa.'),
    qMC('3m tela=$270, 7m:', ['$630 (k=$90/m, 7×90)','$270','$900','$540'], 0, 'Valor unitario o producto cruzado.'),
    qMC('12L gasolina=180km, 20L:', ['300km (20×180÷12)','200','360','150'], 0, 'Rendimiento: 15km/L×20=300km.'),
    qMC('"4 obreros, 12 días..." piensa:', ['¿DIRECTA o INVERSA? Más obreros → menos días = INVERSA','Siempre directa','No importa','Igual'], 0, 'Identificar tipo = paso crucial.'),
    qTF('En directa: multiplicar en DIAGONAL, dividir entre el tercero.', true, 'A→B, C→X. X=(C×B)÷A.'),
    qOrder('Ordena pasos para "15 cuadernos=$675, ¿22?":', ['Identificar: DIRECTA','Plantear: 15→675, 22→X','X=(22×675)÷15','22×675=14850','÷15=$990'], 'Tipo→proporción→operación.'),
    qMatch('Relaciona problema con solución:', [{left:'5kg→$200, 8kg',right:'$320'},{left:'3h→15km, 7h',right:'35km'},{left:'4L→$96, 6L',right:'$144'},{left:'2doc→$360, 5doc',right:'$900'}], 'Compras, distancias, producción.'),
    qMC('300g harina=12 galletas, 20 galletas:', ['500g (25g/galleta×20)','400g','600g','350g'], 0, 'Cocina: valor unitario × cantidad.'),
    qWrite('9m cable=$135, ¿5m?', ['75','$75'], '$15/m × 5 = $75.'),
    qWrite('3 boletos=$240, ¿5?', ['400','$400'], '240/3=80. 5×80=400.'),
  ],

  // ===== M67: Regla de tres simple inversa =====
  [
    qMC('Regla de tres INVERSA:', ['A MÁS de una, MENOS de otra. X=(A×B)÷C','Igual directa','Más=más','Sin diferencia'], 0, 'Multiplica HORIZONTAL, divide.'),
    qMC('6 pintores=8días, 4 pintores:', ['12 días (6×8÷4=12)','6 días','8 días','5.3'], 0, 'INVERSA: más pintores, menos días.'),
    qMC('90km/h=4h, 120km/h:', ['3h (dist=360km)','5h','4h','6h'], 0, 'Más velocidad→menos tiempo.'),
    qMC('Distinguir directa de inversa:', ['Si A sube y B SUBE→directa. Si BAJA→inversa','Iguales','Sin manera','Siempre directa'], 0, '¿Crecen juntas? ¿o inversas?'),
    qMC('1 grifo=10h, 5 grifos:', ['2h (1×10÷5)','50h','10h','5h'], 0, 'Más grifos, menos tiempo.'),
    qMC('Alimento: 15 vacas=20d, 25 vacas:', ['12d (15×20=300, ÷25)','30d','15d','20d'], 0, 'Más vacas, menos días.'),
    qTF('En inversa, el producto de cada par es CONSTANTE.', true, 'A×B=C×X. X=(A×B)/C.'),
    qOrder('Ordena pasos para "3 obreros=15d, ¿9?":', ['Identificar: INVERSA','3×15=45','45÷9=5 días','Resultado: 5 días'], 'Flujo: tipo → producto → división.'),
    qMatch('Relaciona problema inverso:', [{left:'4 llaves=6h, 12',right:'2h'},{left:'60km/h=3h, 90',right:'2h'},{left:'8 máq=10h, 5',right:'16h'},{left:'20 obr=15d, 25',right:'12d'}], 'La otra cara de la proporcionalidad.'),
    qMC('Forraje: 40 borregos=25d, con 50:', ['20d (40×25÷50)','31.25d','25d','15d'], 0, 'Más borregos→menos días.'),
    qWrite('15 albañiles=6d, ¿9?', ['10'], '(15×6)÷9=10 días.'),
    qWrite('12 máq en 5h → ¿máq para 3h?', ['20'], '(12×5)/3=20 máquinas.'),
  ],

  // ===== M68: Reparto proporcional directo =====
  [
    qMC('Reparto proporcional directo:', ['Dividir cantidad en partes PROPORCIONALES a índices','Partes =','Todo al primero','Aleatorio'], 0, 'Ganancia según inversión.'),
    qMC('$1,000 en proporción 3:2:', ['A=$600, B=$400 (suma=5, factor=$200)','$500 c/u','A=$700','A=$300'], 0, 'Suma partes, calcula factor.'),
    qMC('Paso clave:', ['Total ÷ suma índices = VALOR UNITARIO','No se sabe','Reparte =','Ignora'], 0, 'Factor unitario = total÷suma partes.'),
    qMC('360 entre hijos 8,10,12 años:', ['96,120,144 (suma=30, factor=12)','120 c/u','No se puede','Depende'], 0, 'Verifica: 96+120+144=360 ✓.'),
    qMC('Socios: $20k,$30k,$50k. Ganancia $200k:', ['2do=$60k (factor=$2)×30','$40k','$100k','$50k'], 0, 'Proporcional a inversión.'),
    qMC('Suma de índices:', ['TOTAL de "partes" para repartir','No importa','Resultado','Constante'], 0, 'Determina cuántas unidades de reparto.'),
    qTF('A MAYOR índice, MAYOR cantidad.', true, 'Más partes = más recibes.'),
    qOrder('Ordena pasos para $2,400 en 5:3:2:', ['Suma=10','$2,400÷10=$240','5×240=$1,200','3×240=$720','2×240=$480','Verificar ✓'], 'Suma→factor→multiplica→verifica.'),
    qMatch('Relaciona reparto:', [{left:'$500 en 2:3',right:'$200,$300'},{left:'$900 en 1:2:3',right:'$150,$300,$450'},{left:'$1,200 en 5:3',right:'$750,$450'},{left:'$600 en 1:1:1',right:'$200 c/u'}], 'Equidad (no igualdad).'),
    qMC('100 dulces edades 4,6,10:', ['20,30,50 (suma=20, f=5)','33 c/u aprox','No se puede','Según quieran'], 0, '20+30+50=100 ✓.'),
    qWrite('$1,500 en 5:3:1, ¿último?', ['166.67','$166.67'], 'Suma=9. 1500/9×1≈166.67.'),
    qWrite('$1,800 proporcional a 4 y 5.', ['800 y 1000','$800 y $1000'], 'Suma=9. Factor=200.'),
  ],

  // ===== M69: Regla de tres compuesta =====
  [
    qMC('Regla de tres compuesta:', ['MÁS de 2 magnitudes. Relaciones directas e inversas','Solo 2','Una operación','No existe'], 0, 'Obra: obreros, horas, días, dificultad.'),
    qMC('5 obr/8h/12d → 10 obr/6h:', ['8d (más obr→−d, más h→−d)','6d','12d','24d'], 0, 'Ambas inversas. Compuesta.'),
    qMC('Analizar magnitud por magnitud:', ['¿Cada una directa o inversa con la incógnita?','Todo =','Ignorar','Solo directas'], 0, 'Paso crucial de identificación.'),
    qMC('"Más obreros, menos días" =', ['INVERSA','Directa','No existe','Depende'], 0, 'Identificación correcta de cada relación.'),
    qMC('Método práctico:', ['Directas/Inversas = constante','No funciona','Solo sumas','No aplica'], 0, 'Fórmula de proporcionalidad compuesta.'),
    qMC('12 vacas/300kg/5d → 20 vacas/8d:', ['800kg (dir: +vacas→+forraje, +días→+forraje)','500kg','600kg','300kg'], 0, 'Ambas directas. Producto de razones.'),
    qTF('Regla de tres compuesta solo con 3 magnitudes.', false, 'Con cualquier número. Se analizan de par en par.'),
    qOrder('Ordena pasos compuestos:', ['Comparar obreros-horas: INVERSA','Obreros-días: INVERSA','Plantear: 15×(8/6)×(10/20)=10','Resultado: 10 obreros'], 'Análisis individual de cada relación.'),
    qMatch('Relaciona relación con tipo:', [{left:'Obreros vs Tiempo',right:'INVERSA'},{left:'Horas/d vs Tiempo',right:'INVERSA'},{left:'Obra vs Obreros',right:'DIRECTA'},{left:'Días vs Obra',right:'DIRECTA'}], 'Identificación individual por par.'),
    qMC('3 máq/240piezas/8h → 5 máq/12h:', ['600 piezas (dir×2: (5/3)×(12/8)×240)','400','360','480'], 0, 'Ambas directas, aumentan producción.'),
    qWrite('8×(10/5)×(6/12) = ?', ['8'], '8×2×0.5=8.'),
    qWrite('Simplifica: 4×(6/3)×(9/12)', ['6'], '4×2×0.75=6.'),
  ],

  // ===== M70: Reparto proporcional inverso =====
  [
    qMC('Reparto INVERSO:', ['A MAYOR índice, MENOR cantidad','Igual que directo','No se reparte','Siempre ='], 0, 'El que más tiene, menos recibe.'),
    qMC('Inversamente a 2,3,6:', ['Inversos: 1/2,1/3,1/6 → 3:2:1','Multiplica','Suma','No se puede'], 0, 'Toma inversos y homogeniza.'),
    qMC('$330 inverso a 2 y 3:', ['$198,$132 (inversos 1/2:1/3=3:2)','$165 c/u','$220,$110','$330,$0'], 0, 'Inversos→homogenizar→reparto directo.'),
    qMC('Reparto INVERSO:', ['AL CONTRARIO del directo: menor índice, mayor parte','= que directo','Aleatorio','No definido'], 0, 'Lógica: quien tiene menos, recibe más.'),
    qMC('Convertir inverso a directo:', ['Tomar INVERSOS (1/índice), homogenizar','Ignorar','Sumar','Sin método'], 0, 'Inversos→común denom→proporción directa.'),
    qMC('$1,200 inverso a 1,2,3:', ['≈$654.55,$327.27,$218.18 (6:3:2, suma=11)','$400 c/u','$1,200 al 1ro','$600,$400,$200'], 0, 'Inversos 1:1/2:1/3=6:3:2.'),
    qTF('En inverso: MAYOR índice → MENOR parte.', true, 'Definición: inverso al índice.'),
    qOrder('Ordena pasos para $500 inverso a 4,6:', ['Inversos 1/4,1/6','Homogenizar: 3/12,2/12','Proporción 3:2','Suma=5, factor=$100','$300 y $200'], 'Inversos → homogenizar → reparto directo.'),
    qMatch('Relaciona reparto con tipo:', [{left:'Premio mejor promedio',right:'DIRECTO'},{left:'Beca al que menos tiene',right:'INVERSO'},{left:'Ganancia según inversión',right:'DIRECTO'},{left:'Ayuda más necesitado',right:'INVERSO'}], 'Contexto: ¿a más, más? dir. ¿a más, menos? inv.'),
    qMC('$900 inverso edades 5,8,10:', ['≈$461.54,$288.46,$150 (8:5:4, suma=17)','$300 c/u','Menor $900','No se puede'], 0, 'Menor edad = mayor regalo.'),
    qWrite('$600 inverso a 2 y 3, ¿índice 2?', ['360'], 'Inversos 1/2:1/3=3:2. 600×3/5=$360.'),
    qWrite('$350 inverso a 2 y 5.', ['250 y 100','$250 y $100'], 'Inversos 1/2:1/5=5:2. Suma=7.'),
  ],

  // ===== M71: Sucesiones aritméticas =====
  [
    qMC('SUCESIÓN:', ['Lista ordenada de números con REGLA o patrón','Un número','Suma','No existe'], 0, '2,4,6,8... (sumar 2).'),
    qMC('3,7,11,15,19... regla:', ['SUMAR 4 (progresión aritmética d=+4)','×3','Restar','Dividir'], 0, 'Diferencia CONSTANTE = d=4.'),
    qMC('5,10,15,20, ___', ['25 (d=+5)','30','20','18'], 0, 'Patrón: sumar 5.'),
    qMC('8, __, 16, 20, 24 (d=+4):', ['12 (8+4=12)','10','14','18'], 0, 'Encuentra d con términos conocidos.'),
    qMC('Fórmula aₙ aritmético:', ['aₙ=a₁+(n-1)×d','aₙ=a₁×n','No existe','aₙ=a₁+n'], 0, 'a₁=3,d=4. a₁₀=3+9×4=39.'),
    qMC('a₁=5,d=3. a₈ =', ['5+7×3=26','5×8=40','5+8=13','5+3=8'], 0, 'Fórmula: 5+(8-1)×3=26.'),
    qTF('En aritmética, d entre consecutivos es CONSTANTE.', true, 'Definición. Si d cambia, no es aritmética.'),
    qOrder('Ordena pasos para a₁₅ de 2,6,10,14:', ['a₁=2','d=6-2=4','a₁₅=2+14×4=58','Resultado: 58'], 'Fórmula universal.'),
    qMatch('Relaciona sucesión con regla:', [{left:'1,3,5,7...',right:'d=+2'},{left:'10,20,30...',right:'d=+10'},{left:'100,90,80...',right:'d=-10'},{left:'7,14,21...',right:'d=+7'}], 'Crecen (d>0) o decrecen (d<0).'),
    qMC('13,18,23,___,33:', ['28 (d=5)','25','30','26'], 0, 'Verifica consistencia.'),
    qWrite('Sucesión 4,9,14,19... a₈ = ?', ['39'], 'd=5. a₈=4+7×5=39.'),
    qWrite('Décimo término de 1,4,7,10...?', ['28'], 'd=3. a₁₀=1+9×3=28.'),
  ],

  // ===== M72: Sucesiones con figuras =====
  [
    qMC('Patrón geométrico:', ['#elementos de figuras sigue SECUENCIA numérica','Solo dibujos','Sin regla','Aleatorio'], 0, '1,4,9... cuadrados n×n → n².'),
    qMC('Patrón puntos: ●, ●●, ●●●...', ['1,2,3,4... (triangulares: n(n+1)/2)','Siempre 1','Sin patrón','Aleatorio'], 0, 'Triángulo de puntos: 1+2+3...'),
    qMC('Cuadrados: 1²=1, 2²=4, 3²=9... 10ª:', ['100 (10²)','10','50','20'], 0, 'Figura n = n×n.'),
    qMC('Cerillos triángulos: 1=3,2=5,3=7...', ['3+(n-1)×2. Para 10: 21 cerillos','n×3','2n','3n+1'], 0, 'Cada nuevo comparte 1 lado.'),
    qMC('Torre latas: 1,3,6,10. Fila 5:', ['15 (1+2+3+4+5)','5','13','20'], 0, 'Triangulares: T₅=5×6/2=15.'),
    qMC('Predecir figura n:', ['Encuentra REGLA NUMÉRICA (n², 2n+, etc.)','Dibuja todas','No se puede','Adivinar'], 0, 'Visual→fórmula matemática.'),
    qTF('Patrones geométricos SIEMPRE tienen regla matemática.', true, 'Siempre describibles con números y fórmulas.'),
    qOrder('Ordena pasos para patrón de puntos:', ['F1=3,F2=6,F3=9,F4=12','Patrón: 3×n','F₁₀=30 puntos'], 'Visual→numérico→algebraico.'),
    qMatch('Relaciona patrón con fórmula:', [{left:'Cuadrados n×n',right:'n²'},{left:'Rectángulos 2×n',right:'2n'},{left:'Triángulo n filas',right:'n(n+1)÷2'},{left:'Línea n puntos',right:'n'}], 'Conexión geometría+álgebra.'),
    qMC('Escalera cubos: 1,3,5... piso n:', ['2n-1 (impares)','n²','n','2n'], 0, '1=2(1)-1, 3=2(2)-1.'),
    qWrite('Hexágonos: F1=6,F2=10,F3=14. Regla:', ['4n+2'], 'd=4. aₙ=6+(n-1)×4=4n+2.'),
    qWrite('Círculos: 1,3,6,10... expresión:', ['n(n+1)/2','triangulares'], 'Triangulares Tₙ=n(n+1)/2.'),
  ],

  // ===== M73: Sucesiones geométricas =====
  [
    qMC('Progresión GEOMÉTRICA:', ['Cada término × RAZÓN CONSTANTE (r)','Suma','Resta','Sin regla'], 0, '2,6,18,54... ×3. r=3.'),
    qMC('Razón en 3,6,12,24...:', ['r=2 (DOBLE del anterior)','r=3','r=1','r=6'], 0, '6÷3=2, 12÷6=2.'),
    qMC('1,4,16,64, ___', ['256 (×4)','128','100','70'], 0, '64×4=256. Crecimiento acelerado.'),
    qMC('Fórmula aₙ geométrico:', ['aₙ=a₁×rⁿ⁻¹','aₙ=a₁+(n-1)r','aₙ=a₁×n','No existe'], 0, '3,6,12... a₅=3×2⁴=48.'),
    qMC('a₁=5,r=3. a₄ =', ['5×3³=135','5×12=60','5+12=17','5×4=20'], 0, 'Crecimiento mucho más rápido.'),
    qMC('PGs modelan:', ['Crecimiento exponencial: bacterias, interés compuesto','Solo suma','Nada real','Solo juegos'], 0, 'Bacterias duplican cada 20min.'),
    qTF('2,4,8,16... r=2, crecen MUY rápido.', true, 'a₁₀=2×2⁹=1,024.'),
    qOrder('Ordena pasos para a₇ de 2,6,18:', ['a₁=2','r=6÷2=3','a₇=2×3⁶=2×729=1,458'], 'Fórmula con cálculo de potencia.'),
    qMatch('Relaciona PG con razón:', [{left:'1,2,4,8...',right:'r=2'},{left:'1,3,9,27...',right:'r=3'},{left:'80,40,20...',right:'r=1/2'},{left:'1,10,100...',right:'r=10'}], 'Crecen (r>1) o decrecen (0<r<1).'),
    qMC('Virus duplica c/hora (r=2), 6h:', ['2⁶=64 virus','32','12','6'], 0, '¡Exponencial!'),
    qWrite('5,10,20,40... a₈ = ?', ['640'], 'r=2. a₈=5×2⁷=640.'),
    qWrite('3,12,48... ¿r?', ['4'], '12/3=4, 48/12=4.'),
  ],

  // ===== M74: Sucesiones especiales =====
  [
    qMC('Fibonacci: 0,1,1,2,3,5...', ['Cada término = SUMA de 2 anteriores','+1','×','Sin regla'], 0, '0+1=1, 1+1=2, 1+2=3...'),
    qMC('Fibonacci después de 8,13:', ['21 (8+13)','15','26','34'], 0, 'Suma los dos anteriores.'),
    qMC('Números TRIANGULARES: 1,3,6,10...', ['Suma naturales: n(n+1)/2','Multiplicación','Solo 1','Aleatorio'], 0, 'T₅=5×6/2=15.'),
    qMC('Números CUADRADOS: 1,4,9,16...', ['n²','n×2','n+2','2ⁿ'], 0, '5²=25.'),
    qMC('Sexto triangular T₆:', ['6×7÷2=21','6','12','36'], 0, 'Tₙ=n(n+1)/2.'),
    qMC('Sucesión PRIMOS: 2,3,5,7,11...', ['SIN fórmula simple. Gran misterio matemático','Aritmética','Geométrica','Fácil'], 0, 'Distribución de primos = fascinante.'),
    qTF('Fibonacci: crecimiento de conejos (1202).', true, 'Leonardo de Pisa modeló conejos.'),
    qOrder('Ordena sucesiones de simple a compleja:', ['Aritmética','Geométrica','Triangulares','Fibonacci','Primos'], 'De reglas determinísticas a misteriosas.'),
    qMatch('Relaciona sucesión con nombre:', [{left:'2,4,6,8...',right:'Pares'},{left:'1,4,9,16...',right:'Cuadrados'},{left:'1,3,6,10...',right:'Triangulares'},{left:'1,1,2,3,5,8...',right:'Fibonacci'}], 'Cada una con su encanto.'),
    qMC('Triangulares modelan:', ['Boliche (10=T₄), torres latas','Nada','Solo mates','Rectángulos'], 0, '10 bolos=1+2+3+4=T₄.'),
    qWrite('¿6° número de Fibonacci? (0,1,1,2,3,5,8)', ['8'], 'Posición 6: 8.'),
    qWrite('¿4° número cuadrado?', ['16'], '4²=16.'),
  ],

  // ===== M75: Patrones numéricos avanzados =====
  [
    qMC('1,4,9,16,25, ___', ['36 (6²)','30','49','27'], 0, 'Cuadrados: n².'),
    qMC('2,6,12,20,30, ___', ['42 (n(n+1))','36','40','48'], 0, 'También: n²+n.'),
    qMC('1,8,27,64, ___ (cubos):', ['125 (5³)','100','81','128'], 0, '1³,2³,3³,4³,5³.'),
    qMC('1×1=1, 11×11=121, 111×111=12321...', ['Patrón repunit. 1111²=1234321','Sin patrón','Aleatorio','Solo 111'], 0, 'Cuadrados de 1s = palíndromos.'),
    qMC('1,-2,4,-8,16... regla:', ['×(-2). PG con r negativa','+constante','Siempre +','No existe'], 0, 'Razón negativa: signos alternan.'),
    qMC('Fibonacci/previo:', ['→ 1.618... (φ, número áureo)','2','1','Aleatorio'], 0, 'Conexión Fibonacci-φ fascinante.'),
    qTF('"Todo patrón tiene explicación matemática".', false, 'Matemáticamente: los patrones descubiertos SÍ. Pero del universo, no todos.'),
    qOrder('Ordena pasos para 3,8,15,24,35:', ['n=1→3, n=2→8...','¿n²? 1,4,9... no','¿n(n+2)? 3,8,15✓','aₙ=n(n+2). n=6: 48'], 'Ensayo-error inteligente.'),
    qMatch('Relaciona patrón con fórmula:', [{left:'2,4,8,16...',right:'2ⁿ'},{left:'1,4,9,16...',right:'n²'},{left:'2,6,12,20...',right:'n(n+1)'},{left:'1,3,6,10...',right:'n(n+1)/2'}], 'Patrones→fórmulas: puerta al álgebra.'),
    qMC('Torre Hanoi: 1 disco=1, 2=3, 3=7, n=', ['2ⁿ-1','2n','n²','2n+1'], 0, 'Crecimiento exponencial de movimientos.'),
    qWrite('1,3,7,15,31, ___ (2ⁿ-1)', ['63'], '2⁶-1=63.'),
    qWrite('2,5,10,17, ___ (n²+1)', ['26'], '5²+1=26.'),
  ],
  // ===== M76: Introducción al álgebra - Variables =====
  [
    qMC('VARIABLE:', ['SÍMBOLO (letra) que representa un valor desconocido','Número fijo','Solo x','Triángulo'], 0, 'x+5=12, x=7.'),
    qMC('"3n" significa:', ['3 MULTIPLICADO por n','3+n','n³','3−n'], 0, 'Pegar número y letra = multiplicación.'),
    qMC('"Un número aumentado en 8":', ['x+8','8x','x−8','x/8'], 0, 'Aumentado=suma. Disminuido=resta.'),
    qMC('"El doble de un número":', ['2n','n²','n+2','n/2'], 0, 'Doble=×2. Triple=×3.'),
    qMC('5+x=13, x =', ['8 (13−5)','18','5','2.6'], 0, 'Despejar: x=13−5=8.'),
    qMC('3y=18, y =', ['6 (18÷3)','3','9','54'], 0, 'Operación inversa: ÷3.'),
    qTF('Una variable puede representar CUALQUIER número.', false, 'No cualquiera. Debe SATISFACER la ecuación.'),
    qOrder('Ordena pasos para "Suma de número y su doble = 15":', ['x+2x=15','3x=15','x=5','5+10=15 ✓'], 'Lenguaje natural→álgebra.'),
    qMatch('Relaciona frase con expresión:', [{left:'Número+7',right:'x+7'},{left:'Triple de número',right:'3x'},{left:'Número−4',right:'x−4'},{left:'Mitad de número',right:'x/2'}], 'Álgebra = LENGUAJE.'),
    qMC('"Producto de número y 9":', ['9x','x+9','x/9','9+x'], 0, 'Producto=×. Cociente=÷.'),
    qWrite('Traduce: "Cinco veces un número menos 3"', ['5x-3','5x − 3'], '5x−3.'),
    qWrite('Traduce: "Un número menos el doble de otro"', ['x-2y','x − 2y'], 'x−2y.'),
  ],

  // ===== M77: Ecuaciones de primer grado (+/−) =====
  [
    qMC('ECUACIÓN:', ['IGUALDAD con al menos una variable','Número','Operación','Dibujo'], 0, 'x+5=12. Incógnita.'),
    qMC('x+9=15:', ['Restar 9 ambos: x=6','Sumar 9','×','÷'], 0, 'Operación INVERSA en ambos lados.'),
    qMC('x−7=12, x =', ['19 (sumar 7)','5','−5','84'], 0, 'Suma 7 (inversa de restar).'),
    qMC('32=x+18:', ['x=14 (32−18)','x=50','x=32','x=18'], 0, 'Incógnita a la derecha: válido.'),
    qMC('BALANZA =', ['ECUACIÓN (= peso = =). Quitar/agregar = operar','Pesos','Nada','Dibujo'], 0, 'Analogía perfecta: equilibrio=igualdad.'),
    qMC('x+25=100, x =', ['75','125','4','25'], 0, '100−25=75. ¿Cuánto falta?'),
    qTF('Para x+a=b: x=b−a.', true, 'Inversa: resta a en ambos lados.'),
    qOrder('Ordena para 15+x=42:', ['Identificar: suma','Inversa: resta','15+x−15=42−15','x=27','Verificar ✓'], 'Método sistemático.'),
    qMatch('Relaciona ecuación con solución:', [{left:'x+8=20',right:'x=12'},{left:'x−5=11',right:'x=16'},{left:'25=x+10',right:'x=15'},{left:'x−13=0',right:'x=13'}], 'Practica ambos tipos.'),
    qMC('María compra 8 estampas más, tiene 25:', ['x+8=25, x=17','x−8=25','8x=25','x/8=25'], 0, 'Problema contextualizado.'),
    qWrite('x−18=45, ¿x?', ['63'], '45+18=63.'),
    qWrite('x+23=50, ¿x?', ['27'], '50−23=27.'),
  ],

  // ===== M78: Ecuaciones con × y ÷ =====
  [
    qMC('4x=36:', ['÷4 ambos: x=9','−4','+4','x=144'], 0, 'Inversa de × = ÷.'),
    qMC('x/5=7, x =', ['35 (×5)','7/5','12','2'], 0, 'Inversa de ÷ = ×.'),
    qMC('6n=54, n =', ['9 (54÷6)','324','6','48'], 0, 'Divide.'),
    qMC('x/8=12:', ['x=96 (12×8)','x=4','x=20','x=1.5'], 0, 'Multiplica ambos.'),
    qMC('3x=39, x =', ['13 (39÷3)','117','36','42'], 0, '39÷3=13.'),
    qMC('5 amigos pagan $x, total $225:', ['5x=225, x=$45','x/5=225','x+5=225','5+x=225'], 0, '#personas×pago=total.'),
    qTF('ax=b → x=b÷a.', true, 'Si a multiplica, inversa es ÷.'),
    qOrder('Ordena para x/3=15:', ['Identificar: ÷','Inversa: ×','x=15×3=45','Verificar ✓'], 'Operaciones inversas.'),
    qMatch('Relaciona ecuación con solución:', [{left:'2x=18',right:'x=9'},{left:'x/4=5',right:'x=20'},{left:'7x=56',right:'x=8'},{left:'x/10=3',right:'x=30'}], 'Dominar ambos tipos.'),
    qMC('"Número ×8 = 72":', ['8x=72, x=9','x+8=72','x−8=72','x/8=72'], 0, 'Planteamiento→ecuación→resolución.'),
    qWrite('x/6=11, ¿x?', ['66'], 'x=11×6=66.'),
    qWrite('x/7=9, ¿x?', ['63'], 'x=9×7=63.'),
  ],

  // ===== M79: Ecuaciones de dos pasos =====
  [
    qMC('3x+5=20:', ['1° −5: 3x=15, 2° ÷3: x=5','× primero','Suma todo','Sin solución'], 0, 'Deshacer suma, luego ×.'),
    qMC('2x−7=13, x =', ['10 (2x=20)','20','3','10.5'], 0, '+7→2x=20→x=10.'),
    qMC('x/3+4=10:', ['x=18 (x/3=6)','x=30','x=2','x=42'], 0, '−4→x/3=6→×3.'),
    qMC('4x−9=23:', ['+9→4x=32→x=8','×','x=23','No'], 0, 'Dos inversas: suma y ÷.'),
    qMC('5x+12=47, x =', ['7 (5x=35)','5','9.4','59'], 0, '−12→5x=35→x=7.'),
    qMC('Estrategia 2 pasos:', ['1° eliminar término INDEP, 2° COEFICIENTE','Todo junto','Ignorar orden','Sin estrategia'], 0, 'Deshacer en orden inverso (PEMDAS al revés).'),
    qTF('2x+8=16: 1° −8, 2° ÷2.', true, '2x=8→x=4. Correcto.'),
    qOrder('Ordena para 6x−18=30:', ['6x=48','x=8','Verificar: 48−18=30 ✓'], 'Elimina constante, luego coef.'),
    qMatch('Relaciona ecuación con solución:', [{left:'2x+3=15',right:'x=6'},{left:'3x−5=16',right:'x=7'},{left:'x/2+7=15',right:'x=16'},{left:'5x+10=45',right:'x=7'}], 'Dos pasos en variantes.'),
    qMC('3 cuadernos iguales + lápiz $12 = $72:', ['3x+12=72, x=$20','x+12=72','3x=84','x=$24'], 0, 'Ecuación de dos pasos.'),
    qWrite('7x−14=42, ¿x?', ['8'], '7x=56, x=8.'),
    qWrite('4x+6=30, ¿x?', ['6'], '4x=24, x=6.'),
  ],

  // ===== M80: Problemas con ecuaciones =====
  [
    qMC('"Número + su doble = 36":', ['x+2x=36, x=12','x+2=36','x×2=36','x=38'], 0, 'Planteamiento: 3x=36.'),
    qMC('Edad Luis=2×José. Suma=18:', ['José=6, Luis=12','Luis=18','No','Ambos 9'], 0, 'x+2x=3x=18→x=6.'),
    qMC('Rectángulo: largo=3×ancho. P=32:', ['Ancho=4, Largo=12','Ancho=8','No','Largo=10'], 0, '2(3x)+2x=8x=32.'),
    qMC('Ana ahorra $x, mamá da $3x. Total $200:', ['x+3x=200, x=$50','x=$200','$100','No'], 0, 'Modelado familiar.'),
    qMC('3 números CONSECUTIVOS suman 72:', ['x+x+1+x+2=72, x=23 (23,24,25)','20','24','No'], 0, 'Consecutivos: n,n+1,n+2.'),
    qMC('Gasté $45 de $x, quedan $30:', ['x−45=30, x=$75','$15','$45','$30'], 0, 'Problema simple.'),
    qTF('Todo problema verbal se resuelve con ec. 1er grado.', false, 'Algunos requieren cuadráticas o sistemas. Pero muchos SÍ.'),
    qOrder('Ordena para "x+15=3x−5":', ['x+15=3x−5','15+5=3x−x','20=2x','x=10','Verificar ✓'], 'Leer→plantear→resolver→verificar.'),
    qMatch('Relaciona problema con ecuación:', [{left:'Doble+8=30',right:'2x+8=30'},{left:'3 consec suman 54',right:'3x+3=54'},{left:'Mitad+5=13',right:'x/2+5=13'},{left:'+triple=48',right:'x+3x=48'}], 'Plantear=80% de la solución.'),
    qMC('Quíntuple−12=48:', ['x=12 (5x=60)','10','60','5'], 0, 'Quíntuple=×5.'),
    qWrite('Número + su triple = 64:', ['16'], '4x=64, x=16.'),
    qWrite('Perím rect 40, largo triple ancho:', ['5','5 cm'], '8x=40, x=5.'),
  ],

  // ===== M81: Simetría axial =====
  [
    qMC('SIMETRÍA AXIAL:', ['Reflejo sobre RECTA (eje) como ESPEJO','Giro','Movimiento','Sin cambio'], 0, 'Punto e imagen = distancia al eje.'),
    qMC('Eje de simetría:', ['Recta ESPEJO: divide figura en 2 partes IDÉNTICAS','Cualquier línea','Borde','Punto'], 0, 'Mariposa: 1 eje, 2 alas =.'),
    qMC('Ejes de simetría de un CUADRADO:', ['4 ejes (2 diag, 2 ptos medios)','2','1','Ninguno'], 0, 'Vertical, horizontal, 2 diagonales.'),
    qMC('Triángulo EQUILÁTERO:', ['3 ejes (cada mediatriz)','1','Ninguno','2'], 0, 'Vértice a punto medio lado opuesto.'),
    qMC('Rectángulo (no cuadrado):', ['2 ejes (horiz y vert ptos medios)','4','Ninguno','1'], 0, 'Solo ptos medios de lados opuestos.'),
    qMC('Letra "A":', ['1 eje VERTICAL','Ninguno','Horizontal','2'], 0, 'Reflejo vertical central.'),
    qTF('Círculo: INFINITOS ejes (cualquier recta por centro).', true, 'Cada diámetro = eje. Máxima simetría.'),
    qOrder('Ordena pasos para reflejar punto A:', ['⊥ de A al eje','Medir distancia','Copiar al otro lado','Ese es A\''], 'Perpendicular + = distancia.'),
    qMatch('Relaciona figura con #ejes:', [{left:'Triáng isósceles',right:'1'},{left:'Cuadrado',right:'4'},{left:'Hexágono regular',right:'6'},{left:'Rombo (no cuad.)',right:'2'}], 'Simetría = regularidad.'),
    qMC('Simetría axial en naturaleza:', ['Mariposas, rostros, hojas, copos nieve','Solo mates','No aparece','Dibujos'], 0, 'Simetría bilateral ubicua.'),
    qWrite('¿Ejes de pentágono regular?', ['5'], '5 ejes: vértice a pto medio opuesto.'),
    qWrite('¿Ejes de triángulo escaleno?', ['0','ninguno','cero'], 'Sin lados =, sin ejes.'),
  ],

  // ===== M82: Simetría central =====
  [
    qMC('SIMETRÍA CENTRAL:', ['Rotación 180° alrededor de PUNTO (centro)','Reflexión','Desplazamiento','No existe'], 0, 'Punto e imagen alineados, = distancia opuesta.'),
    qMC('Centro de simetría:', ['PUNTO alrededor del cual gira 180° y coincide','Línea','Cualquier punto','No existe'], 0, 'Ej: centro de rectángulo.'),
    qMC('¿Triángulo equilátero tiene sim central?', ['NO (no coincide tras 180°)','SÍ','Depende','Siempre'], 0, 'Sí tiene rotacional de 120°, pero no central de 180°.'),
    qMC('Paralelogramo (no rectángulo):', ['Sim CENTRAL (gira 180° coincide)','Axial','Ninguna','Ambas'], 0, 'Centro=centro de simetría.'),
    qMC('Letra "S":', ['Simetría CENTRAL','Axial','Ninguna','Ambas'], 0, 'Gira 180° = igual.'),
    qMC('Simetría rotacional orden n:', ['Coincide al girar 360°/n','Solo axial','No existe','180°'], 0, 'Equilátero: 120° (orden 3).'),
    qTF('Rectángulo tiene sim axial Y central.', true, '2 ejes + centro (gira 180° coincide).'),
    qOrder('Ordena pasos para simetría central de A:', ['Unir A con centro O','Prolongar AO al otro lado','Copiar = distancia','Marcar A\''], 'Duplica a través del centro.'),
    qMatch('Relaciona figura con sus simetrías:', [{left:'Círculo',right:'∞ ejes + central'},{left:'Cuadrado',right:'4 ejes + central'},{left:'Equilátero',right:'3 ejes, sin central'},{left:'Romboide',right:'Solo central'}], 'Axial y central pueden coexistir.'),
    qMC('Simetría central =', ['Rotación de 180°','Espejo','Desplazamiento','No se sabe'], 0, 'Equivalencia: giro media vuelta.'),
    qWrite('¿Grados en simetría central?', ['180','180°'], 'Simetría central = 180°.'),
    qWrite('¿Letra N tiene sim central?', ['si','sí'], 'Sí, tiene centro de simetría.'),
  ],

  // ===== M83: Traslación de figuras =====
  [
    qMC('TRASLACIÓN:', ['DESPLAZAR figura sin girar ni cambiar tamaño','Girar','Agrandar','Reflejar'], 0, 'Mover en línea recta.'),
    qMC('Figura trasladada:', ['CONGRUENTE (= forma y tamaño), cambia posición','Más chica','Girada','Reflejada'], 0, 'Traslación=isometría.'),
    qMC('Vector (a,b):', ['Mover a en X, b en Y','Solo X','Solo Y','No existe'], 0, '(3,−2): 3 derecha, 2 abajo.'),
    qMC('(5,3) con vector (2,−4):', ['(7,−1)','(3,7)','(5,3)','(2,−4)'], 0, '5+2=7, 3−4=−1.'),
    qMC('Traslaciones en plano cartesiano:', ['Videojuegos, diseño, arquitectura','Solo mates','No se usan','Exámenes'], 0, 'Movimiento sin giro = traslación.'),
    qMC('Teselado:', ['TRASLACIONES repetidas que encajan sin huecos','Un dibujo','Círculos','No se puede'], 0, 'Arte islámico y Escher.'),
    qTF('Traslación conserva distancias, ángulos y orientación.', true, 'Idéntica excepto posición. Isometría.'),
    qOrder('Ordena pasos para trasladar triángulo (4,−2):', ['Sumar 4 a x de cada vértice','Restar 2 a y','Unir nuevos vértices','Triángulo listo'], 'Mismo proceso para cada punto.'),
    qMatch('Relaciona transformación:', [{left:'Traslación',right:'Desplazar sin giro'},{left:'Rotación',right:'Giro'},{left:'Reflexión',right:'Espejo'},{left:'Homotecia',right:'Ampliar/reducir'}], 'Cuatro transformaciones fundamentales.'),
    qMC('P(−3,6) + vector (−1,4):', ['(−4,10)','(−2,10)','(−3,6)','(4,2)'], 0, '−3−1=−4, 6+4=10.'),
    qWrite('Traslada (4,−2) con (−3,5):', ['(1,3)','1,3'], '4−3=1, −2+5=3.'),
    qWrite('Cuadrado (0,0) trasladado (3,1):', ['(3,1)','3,1'], 'Origen + vector.'),
  ],

  // ===== M84: Rotación de figuras =====
  [
    qMC('ROTACIÓN:', ['GIRAR alrededor de PUNTO FIJO un ÁNGULO','Desplazar','Reflejar','Agrandar'], 0, 'Manecillas, rueda fortuna, ventilador.'),
    qMC('Rotar (2,3) 90° antihorario (origen):', ['(−3,2) (regla (x,y)→(−y,x))','(3,−2)','(−2,−3)','(2,3)'], 0, 'Regla: (x,y)→(−y,x).'),
    qMC('Rotación 180° (origen):', ['(−x,−y)','(y,x)','(−y,x)','(y,−x)'], 0, 'Media vuelta: ambos signos cambian.'),
    qMC('Giros del reloj:', ['−6° por minuto (360°/60) horario','+6°/min','−90°','+180°'], 0, '360°÷60=−6°/min. − = horario.'),
    qMC('Rotación CONSERVA:', ['Distancias y ángulos (no deforma)','Tamaño no forma','Solo ángulos','Nada'], 0, 'Isometría: igual que traslación y reflexión.'),
    qMC('Rotar triángulo completo:', ['Rotar CADA vértice y unir','Un vértice','Aleatorio','No se puede'], 0, 'Transforma cada punto.'),
    qTF('Rotación 360° = identidad (sin cambio).', true, 'Giro completo = figura original.'),
    qOrder('Ordena ángulos notables:', ['90° (1/4 vuelta)','180° (1/2)','270° (3/4)','360° (1)'], 'Cada 90° = cuarto de vuelta.'),
    qMatch('Relaciona ángulo con regla:', [{left:'90° antihorario',right:'(x,y)→(−y,x)'},{left:'180°',right:'(−x,−y)'},{left:'270° (−90°)',right:'(y,−x)'},{left:'360°',right:'(x,y)'}], 'Reglas prácticas.'),
    qMC('Cuadrado lado 2, centro (1,1), giro 90°:', ['Vértices según (−y,x)','Más chico','Desaparece','No cambia'], 0, 'Cada vértice se transforma.'),
    qWrite('(5,0) rotado 90° antihorario:', ['(0,5)','0,5'], '(−0,5)=(0,5).'),
    qWrite('Rota (x,y) 180°:', ['(-x,-y)'], 'Media vuelta: ambos signos.'),
  ],

  // ===== M85: Homotecia =====
  [
    qMC('HOMOTECIA:', ['AMPLIAR o REDUCIR figura manteniendo FORMA','Girar','Desplazar','Espejo'], 0, 'Zoom. k>1 amplía, 0<k<1 reduce.'),
    qMC('k=2:', ['DOBLE de grande (×2 cada coord)','Igual','Mitad','Triple'], 0, 'Área × k² = ×4.'),
    qMC('k=0.5:', ['Reduce a MITAD cada dimensión','Duplica','No cambia','Triplica'], 0, 'Reducción: área ×0.25.'),
    qMC('Triángulo base 6, altura 4, k=3:', ['Base=18, altura=12. Área orig=12, nueva=108=12×9','9','12','6'], 0, 'k=3: dimens×3, área×9.'),
    qMC('Homotecia NO es isometría:', ['CAMBIA tamaño (no conserva distancias)','Sí conserva','No cambia','= traslación'], 0, 'Isometría=misma medida. Homotecia cambia pero conserva proporciones.'),
    qMC('Homotecia conserva:', ['FORMA y ÁNGULOS, cambia TAMAÑO','Tamaño','Posición','Todo'], 0, 'Semejantes (no congruentes).'),
    qTF('k=1: figura NO cambia (identidad).', true, 'Factor 1 = no hace nada.'),
    qOrder('Ordena pasos para homotecia (0,0)+k=2 a (3,4):', ['Mult cada coord ×2','(6,8)','Distancia duplicada: 5→10'], 'Multiplica coordenadas.'),
    qMatch('Relaciona k con efecto:', [{left:'k=2',right:'Duplica'},{left:'k=0.5',right:'Mitad'},{left:'k=3',right:'Triplica'},{left:'k=0.25',right:'Cuarta parte'}], 'Escalamiento proporcional.'),
    qMC('Fotocopia al 150%:', ['k=1.5','k=150','k=0.15','k=15'], 0, '150%=150/100=1.5.'),
    qWrite('k=4, ¿área cuadrado × ?', ['16','16 veces'], 'Área∝k². 4²=16.'),
    qWrite('Homotecia k=3. Segmento 5cm:', ['15','15 cm'], '5×3=15 cm.'),
  ],

  // ===== M86: Sistema Internacional de Unidades =====
  [
    qMC('SI:', ['Unidades ESTÁNDAR mundiales para magnitudes físicas','Solo México','Por país','No existe'], 0, '1960. 7 unidades base.'),
    qMC('7 magnitudes fundamentales SI:', ['Longitud, masa, tiempo, corriente, temp, sustancia, luz','Solo 3','No definidas','Varían'], 0, 'Derivadas: velocidad, fuerza, presión.'),
    qMC('Metro (m):', ['Longitud. Distancia luz en 1/299792458s','Pie del rey','Aleatorio','100cm'], 0, 'Definición moderna con constantes universales.'),
    qMC('Kilogramo (kg):', ['Masa. Única con prefijo. Definida con Planck desde 2019','Gramo','Tonelada','Libra'], 0, 'Prototipo de París = reliquia.'),
    qMC('Segundo (s):', ['Tiempo. Vibraciones del cesio-133','Hora','Minuto','Día'], 0, '9,192,631,770 oscilaciones. Precisión atómica.'),
    qMC('Múltiplo SI correcto:', ['Kilo- = ×1,000','Mili- = ×100','Centi- = ×1,000','Deci- = ×100'], 0, 'M=10⁶, k=10³, c=10⁻², m=10⁻³.'),
    qTF('Todos los países usan obligatoriamente SI.', false, 'EE.UU., Liberia, Myanmar usan imperial.'),
    qOrder('Ordena prefijos de mayor a menor:', ['Giga(10⁹)','Mega(10⁶)','Kilo(10³)','Base(10⁰)','Centi(10⁻²)','Mili(10⁻³)','Micro(10⁻⁶)'], 'Potencia de 10. Átomos a galaxias.'),
    qMatch('Relaciona prefijo con factor:', [{left:'Kilo',right:'10³'},{left:'Centi',right:'10⁻²'},{left:'Mili',right:'10⁻³'},{left:'Mega',right:'10⁶'}], 'Mediciones enormes o minúsculas.'),
    qMC('Velocidad: magnitud DERIVADA:', ['m/s (longitud y tiempo)','kg','s','m'], 0, 'Combina 2 unidades base.'),
    qWrite('¿Factor del prefijo "micro" (μ)?', ['0.000001','10^-6','1/1000000'], 'Micro=10⁻⁶=millonésima.'),
    qWrite('¿Factor del prefijo "nano" (n)?', ['10^-9','0.000000001'], 'Nano=mil millonésima.'),
  ],

  // ===== M87: Conversiones entre sistemas =====
  [
    qMC('1 pulgada =', ['2.54 cm (exacto desde 1959)','5cm','10cm','1cm'], 0, 'Fundamental construcción/electrónica.'),
    qMC('1 milla =', ['1.609 km','1km','5km','10km'], 0, '1,609.344m exactos. EE.UU./RU carreteras.'),
    qMC('1 libra (lb) =', ['0.4536 kg (≈454g)','1kg','0.1kg','2kg'], 0, '453.592g. Gimnasios/recetas.'),
    qMC('1 galón USA =', ['3.785 L','1L','5L','10L'], 0, '3.785411784L. Gasolina EE.UU.'),
    qMC('1 onza (oz) =', ['28.35 g','1g','100g','10g'], 0, 'Joyería, cocina.'),
    qMC('°F→°C:', ['°C=(°F−32)×5/9','°F+32','×2','Sin fórmula'], 0, '100°F≈37.8°C.'),
    qTF('1 kg ≈ 2.2 lb.', true, '2.2046 lb. Conversión práctica.'),
    qOrder('Ordena pasos para 68°F→°C:', ['68−32=36','36×5÷9=20','20°C (ambiente agradable)'], 'Origen diferente: −32, ×5/9.'),
    qMatch('Relaciona imperial con métrico:', [{left:'1 pulg',right:'2.54cm'},{left:'1 pie',right:'30.48cm'},{left:'1 yarda',right:'0.9144m'},{left:'1 milla',right:'1.609km'}], '12 pulg=1pie, 3pies=1yarda.'),
    qMC('5 pies 9 pulg → m:', ['≈1.75m (152.4+22.86=175.26cm)','1.80m','1.70m','1.60m'], 0, 'Conversión compuesta.'),
    qWrite('10 millas → km.', ['16.09','16.1'], '10×1.609=16.09km.'),
    qWrite('¿1 yarda = cuántos pies?', ['3','tres'], '1 yarda = 3 pies.'),
  ],

  // ===== M88: Superficie y volumen SI =====
  [
    qMC('1 m² = ___ cm²:', ['10,000 (100×100)','100','1,000','10'], 0, 'Conversión áreas: factor lineal².'),
    qMC('1 km² = ___ m²:', ['1,000,000 (1000×1000)','1,000','100','10,000'], 0, 'km²→m²: ×1M. CDMX≈1,485km².'),
    qMC('1 m³ = ___ L:', ['1,000 (1,000 dm³=L)','100','10','10,000'], 0, 'Relación perfecta. Alberca 50m³=50,000L.'),
    qMC('1 hectárea (ha) =', ['10,000 m² (100m×100m)','1,000','100','1km²'], 0, 'Terrenos agrícolas. Fútbol≈0.7ha.'),
    qMC('1 cm³ =', ['1 mL (exacto)','1L','1m³','Nada'], 0, 'Jeringa 5mL=5cm³.'),
    qMC('500 cm³ → L:', ['0.5L (500mL)','500L','50L','5L'], 0, 'cm³=mL. ÷1000=L.'),
    qTF('1 dm³ = 1 L EXACTAMENTE.', true, 'Relación hermosa del SI.'),
    qOrder('Ordena áreas (menor a mayor):', ['1cm²','1m²','1 área=100m²','1ha=10,000m²','1km²=1M m²'], 'Superficie crece al cuadrado.'),
    qMatch('Relaciona volumen:', [{left:'1m³',right:'1,000L'},{left:'1cm³',right:'1mL'},{left:'1dm³',right:'1L'},{left:'1mL',right:'1cm³'}], 'SI conecta volumen-capacidad.'),
    qMC('Tinaco 2m³:', ['2,000 L','200L','20L','2L'], 0, '2×1,000=2,000L.'),
    qWrite('¿m² en 2.5 hectáreas?', ['25000','25,000'], '2.5×10,000=25,000m².'),
    qWrite('¿Litros en 3.5 m³?', ['3500','3,500'], '3.5×1,000=3,500L.'),
  ],

  // ===== M89: Velocidad y densidad =====
  [
    qMC('Velocidad:', ['v=d/t. m/s (SI) o km/h (cotidiano)','t×d','d+t','m×t'], 0, '1m/s=3.6km/h.'),
    qMC('72 km/h → m/s:', ['72÷3.6=20 m/s','259.2','72','72km'], 0, '÷3.6 para m/s.'),
    qMC('Densidad ρ:', ['ρ=m/V. Cuán "compacta" es la sustancia','v×t','m+V','A÷h'], 0, 'Agua:1g/cm³. Oro:19.3.'),
    qMC('500g ocupa 250cm³:', ['2 g/cm³ (500÷250)','0.5','5','2kg'], 0, '>1g/cm³→se HUNDE.'),
    qMC('Vel sonido: 340m/s. km/h:', ['1,224 km/h (×3.6)','340','94.4','3,400'], 0, 'Mach 1≈1,224km/h.'),
    qMC('Densidad agua de mar:', ['≈1.025 g/cm³ (>agua dulce por sal)','1','0.5','2'], 0, 'Flotamos más fácil. Arquímedes.'),
    qTF('km/h→m/s: multiplicar ×3.6.', false, 'Al revés: km/h÷3.6=m/s.'),
    qOrder('Ordena para densidad cubo 5cm, 625g:', ['V=5³=125cm³','ρ=625/125=5g/cm³','5× más denso que agua'], 'Masa/volumen geométrico.'),
    qMatch('Relaciona velocidad:', [{left:'Caminar',right:'≈5km/h'},{left:'Auto ciudad',right:'≈50km/h'},{left:'Carretera',right:'≈110km/h'},{left:'Avión',right:'≈900km/h'}], 'Contextualiza distancias.'),
    qMC('Zona escolar 20km/h → m/s:', ['≈5.56 m/s (÷3.6)','20','72','2'], 0, 'Por eso límite bajo.'),
    qWrite('90 km/h → m/s.', ['25'], '90÷3.6=25m/s.'),
    qWrite('¿Densidad 800g, 100cm³?', ['8','8 g/cm³'], '800/100=8g/cm³.'),
  ],

  // ===== M90: Unidades de temperatura =====
  [
    qMC('3 escalas:', ['Celsius(°C), Fahrenheit(°F), Kelvin(K)','Solo °C','°C y m','°F y L'], 0, '°C:0 congela,100 hierve. °F:32,212.'),
    qMC('CERO ABSOLUTO (0K):', ['−273.15°C. Temperatura MÍNIMA posible','0°C','100°C','−100°C'], 0, 'Cesa movimiento molecular.'),
    qMC('°C→K:', ['K=°C+273.15','°C−273','×2','Sin fórmula'], 0, '25°C=298.15K. Sin °, solo K.'),
    qMC('Agua hierve a nivel mar:', ['100°C','0°C','212°C','50°C'], 0, '100°C=212°F=373.15K.'),
    qMC('37°C (corporal) → °F:', ['98.6°F (×9/5+32)','37°F','100°F','212°F'], 0, '37×9/5+32=98.6.'),
    qMC('Kelvin: escala SI:', ['SIN valores negativos (0K=mínimo)','Más fácil','Más antigua','Sin ventaja'], 0, 'Escala termodinámica absoluta.'),
    qTF('Agua hierve a 212°F.', true, '212°F=100°C=373.15K.'),
    qOrder('Ordena de más fría a más caliente:', ['−10°C','0°C','20°C','37°C','100°C'], 'La Paz: verano>40°C, invierno rara<15°C.'),
    qMatch('Relaciona °C con °F:', [{left:'0°C',right:'32°F'},{left:'20°C',right:'68°F'},{left:'30°C',right:'86°F'},{left:'40°C',right:'104°F'}], 'Dobla °C y suma 30 (estimado).'),
    qMC('Verano La Paz 40°C=', ['104°F','40°F','86°F','120°F'], 0, 'Baja California Sur: extremos.'),
    qWrite('50°C → K.', ['323.15'], '50+273.15=323.15K.'),
    qWrite('¿A qué °C congela el agua?', ['0','0°','0 grados'], '0°C=32°F=273.15K.'),
  ],

  // ===== M91: Finanzas personales =====
  [
    qMC('PRESUPUESTO:', ['PLAN que organiza INGRESOS y GASTOS','Solo gastos','Solo ahorro','No sirve'], 0, 'Ingresos−gastos=ahorro.'),
    qMC('Regla 50-30-20:', ['Necesidades 50%, Deseos 30%, Ahorro 20%','Todo necesidades','50% ahorro','Todo ='], 0, 'Guía financiera popular.'),
    qMC('Ganas $8,000, gastas $6,500. %ahorro:', ['18.75% ((1500/8000)×100)','25%','50%','10%'], 0, 'Tasa ahorro=(I−G)/I×100.'),
    qMC('Ahorro importante:', ['Emergencias, metas, tranquilidad financiera','No importante','Solo ricos','Aburrido'], 0, 'Fondo: 3-6 meses gastos.'),
    qMC('Necesidad vs deseo:', ['Necesidad: comida, vivienda, salud. Deseo: cine, ropa marca','Iguales','Sin diferencia','Todo necesidad'], 0, 'Distinguir = finanzas sanas.'),
    qMC('Ahorras $200/mes, 1 año:', ['$2,400 (sin intereses)','$200','$2,000','$1,200'], 0, 'Ahorro constante. Con intereses, más.'),
    qTF('Presupuesto solo para quien tiene mucho.', false, '¡Al contrario! Quien tiene menos necesita MÁS organización.'),
    qOrder('Ordena pasos para presupuesto:', ['Anotar TODOS ingresos','Gastos FIJOS','Gastos VARIABLES','Diferencia','Asignar a AHORRO'], 'Primer paso a libertad económica.'),
    qMatch('Relaciona concepto:', [{left:'Ingreso',right:'Dinero recibido'},{left:'Gasto fijo',right:'= cada mes'},{left:'Gasto variable',right:'Cambia'},{left:'Ahorro',right:'Guardado futuro'}], 'Conceptos financieros básicos.'),
    qMC('Gastos > ingresos:', ['DÉFICIT (peligroso)','Superávit','Equilibrio','Normal'], 0, 'Déficit continuo=deuda creciente.'),
    qWrite('Ganas $12,000, gastas $9,600. %ahorro:', ['20','20%'], '(3000/12000)=20%.'),
    qWrite('Ingresos $9,500, gastos $7,600:', ['1900','$1,900'], 'Ahorro=$1,900.'),
  ],

  // ===== M92: Interés simple =====
  [
    qMC('Interés SIMPLE:', ['I=C×i×t (Capital×tasa×tiempo)','Sobre intereses','No existe','Aleatorio'], 0, '$1,000 al 10% por 3a=$300.'),
    qMC('$5,000 al 8%, 2 años:', ['$800 (5000×0.08×2)','$400','$5,400','$5,800'], 0, 'Monto=$5,800.'),
    qMC('CAPITAL:', ['Cantidad INICIAL invertida/prestada','Interés','Tiempo','Banco'], 0, 'C o P=Principal.'),
    qMC('Tasa de interés (i):', ['% anual en decimal (10%=0.10)','En pesos','Horas','Metros'], 0, 'Tasa y tiempo misma unidad.'),
    qMC('$2,000 al 5%, 4 años:', ['$400 interés. Total=$2,400','$200','$100','$2,500'], 0, 'NO reinvierte intereses. Capital original.'),
    qMC('Ventaja interés simple:', ['FÁCIL de calcular. Préstamos corto plazo','Nunca se usa','Más caro','Sin ventaja'], 0, 'Pagarés, CETES frecuentemente.'),
    qTF('Interés simple: siempre sobre capital ORIGINAL.', true, 'No hay "interés sobre interés".'),
    qOrder('Ordena para préstamo $3,000 al 12%, 2a:', ['I=3000×0.12×2=720','Monto=3000+720=3720','Pagarás $3,720'], 'Cálculo para decisiones financieras.'),
    qMatch('Relaciona préstamo con interés:', [{left:'$1k,10%,1a',right:'$100'},{left:'$2k,5%,3a',right:'$300'},{left:'$500,20%,2a',right:'$200'},{left:'$4k,7.5%,2a',right:'$600'}], 'Interés = costo dinero o premio ahorro.'),
    qMC('$10,000 al 6% simple, 5 años:', ['$13,000 (+3,000 int)','$10,600','$16,000','$13,382'], 0, 'Así crecen ahorros.'),
    qWrite('$8,000 al 4.5%, 3a:', ['1080','$1,080'], '8000×0.045×3=1080.'),
    qWrite('$6,000 al 4%, 5a:', ['1200','$1,200'], '6000×0.04×5=1200.'),
  ],

  // ===== M93: Interés compuesto =====
  [
    qMC('Interés COMPUESTO:', ['Intereses se REINVIERTEN y generan MÁS intereses','= simple','Más fácil','No existe'], 0, 'Efecto "bola de nieve".'),
    qMC('Monto compuesto:', ['M=C(1+i)ⁿ','M=C+i×t','M=C×i','No existe'], 0, '$1k,10%,3a=1000(1.1)³=$1,331.'),
    qMC('$2,000 al 10%, 2a comp:', ['$2,420 (2000→2200→2420)','$2,400','$2,200','$2,500'], 0, 'Simple=$2,400. Comp=$20 más.'),
    qMC('$10,000 al 8%, 30a:', ['Comp≈$100,627. Simple=$34,000','=','Simple>','Sin dif'], 0, 'Einstein: "octava maravilla".'),
    qMC('REGLA DEL 72:', ['¿Años para DUPLICAR? ≈72÷tasa','Nada','Expertos','No funciona'], 0, '8%→9años. 12%→6años.'),
    qMC('$5,000 al 5% comp, 10a:', ['≈$8,144 (5000×1.05¹⁰)','$7,500','$5,500','$10,000'], 0, 'No lineal. Acelera con tiempo.'),
    qTF('Compuesto genera MENOS que simple.', false, 'n>1: compuesto SIEMPRE da más.'),
    qOrder('Ordena para $3,000 al 6% comp, 5a:', ['(1.06)⁵≈1.3382','3000×1.3382≈4014.68','Int=$1,014.68'], 'Factor (1+i)ⁿ crece exponencialmente.'),
    qMatch('Relaciona inversión:', [{left:'$1k,10%,10a',right:'≈$2,594'},{left:'$5k,7%,5a',right:'≈$7,013'},{left:'$2k,5%,20a',right:'≈$5,307'},{left:'$500,12%,15a',right:'≈$2,737'}], 'Pequeñas difs→grandes resultados.'),
    qMC('Clave para jóvenes:', ['EMPEZAR TEMPRANO. Tiempo = aliado','Esperar mucho $','No ahorrar','Al final'], 0, 'Ahorrar a los 20 vs 30: gran diferencia.'),
    qWrite('Regla 72: ¿años para duplicar al 9%?', ['8'], '72÷9=8 años.'),
    qWrite('Regla 72: ¿años para duplicar al 6%?', ['12'], '72÷6=12 años.'),
  ],

  // ===== M94: Descuentos e IVA =====
  [
    qMC('Precio CON IVA (16%):', ['Precio×1.16','Precio×0.16','−0.16','/0.16'], 0, '$100×1.16=$116.'),
    qMC('$850 con 20% desc:', ['$680 (×0.80, pagas 80%)','$170','$870','$830'], 0, 'Pagas (1−%desc)×precio.'),
    qMC('Precio SIN IVA:', ['Total÷1.16','Total×0.16','Total−16','No se puede'], 0, '$1,160÷1.16=$1,000.'),
    qMC('Descuentos SUCESIVOS 10%+20%:', ['NO suman 30%. $100: −10%=$90, −20%=$72 (28% real)','=30%','No combinar','Igual'], 0, 'Sucesivos rinden MENOS que suma.'),
    qMC('¿30% directo o 20%+10%?', ['30% directo ($70). Sucesivo ($72). Directo mejor','Sucesivo','Iguales','Depende'], 0, '2do descuento sobre base menor.'),
    qMC('Licuadora $1,200 sin IVA:', ['$1,392 ($192 IVA)','$1,200','$1,360','$1,160'], 0, 'IVA 16%.'),
    qTF('50%+50% sucesivo = GRATIS.', false, '50% de $100=$50, otro 50%=$25. NO gratis.'),
    qOrder('Ordena para $2,000: −15% + IVA:', ['2000×0.85=$1,700','1700×1.16=$1,972','Final: $1,972'], 'Descuento sobre precio lista, luego IVA.'),
    qMatch('Relaciona precio final:', [{left:'$500+IVA',right:'$580'},{left:'$800−25%',right:'$600'},{left:'$1,000 sin IVA',right:'$1,160'},{left:'$1,500−30%',right:'$1,050'}], 'Cálculos en súper y facturas.'),
    qMC('Buen Fin: TV $15,000 −40%:', ['$9,000','$6,000','$15,000','$12,000'], 0, '15,000×0.60=$9,000.'),
    qWrite('$2,500+IVA−10%:', ['2610','$2,610'], '2900×0.9=$2,610.'),
    qWrite('$2,000 con 35% desc:', ['1300','$1,300'], '2000×0.65=1300.'),
  ],

  // ===== M95: Ganancia y punto de equilibrio =====
  [
    qMC('GANANCIA:', ['Ingresos − Costos (G=I−C)','I+C','Solo I','No se calcula'], 0, 'Tacos: $50k−$35k=$15k.'),
    qMC('Compra $80, vende $120:', ['$40 ganancia. Margen=33.3%','$120','$80','−$40'], 0, 'Margen=(Pv−C)/Pv×100.'),
    qMC('PUNTO DE EQUILIBRIO:', ['Ingresos = Costos (ni gana ni pierde)','Máx ganancia','Pérdida total','No existe'], 0, 'Mínimo ventas para no quebrar.'),
    qMC('Costos fijos $10k, margen $50/prod:', ['PE=200 productos (10k/50)','5,000','1','No'], 0, 'Cada prod después de 200=ganancia.'),
    qMC('Tenis: compra $500, venta $800:', ['Ganancia $300. Margen 37.5%','$500','−$300','50%'], 0, 'Mayor margen=mayor rentabilidad.'),
    qMC('% descuento $200→$150:', ['(200−150)/200×100=25%','50%','75%','15%'], 0, '%desc=(Orig−Rebaj)/Orig×100.'),
    qTF('Costo > Precio venta = PÉRDIDA.', true, 'Vendes por menos de lo que costó.'),
    qOrder('Ordena para precio con 30% margen sobre costo $200:', ['Costo=70% del precio','$200=0.7×P','P=$285.71','Margen=$85.71 (30%)'], 'Cálculo de precios de negocio.'),
    qMatch('Relaciona situación:', [{left:'I>C',right:'GANANCIA'},{left:'I<C',right:'PÉRDIDA'},{left:'I=C',right:'EQUILIBRIO'},{left:'(P−C)/P',right:'MARGEN'}], 'Conceptos para emprendedores.'),
    qMC('Aguas: vaso $3, agua $2, azúcar $1. Venta $12:', ['$6/vaso ganancia','$9','$12','$3'], 0, 'Suma costos, resta a precio.'),
    qWrite('% ganancia sobre costo: compra $5k, venta $6.5k:', ['30','30%'], '(1500/5000)=30%.'),
    qWrite('Costos fijos $5k, margen $25/prod:', ['200','200 productos'], '5,000÷25=200 para equilibrio.'),
  ],
  // ===== M96: Repaso integral 1 - Números y operaciones =====
  [
    qMC('¿Cómo se lee 7,054,321?', ['Siete millones cincuenta y cuatro mil trescientos veintiuno','Siete mil quinientos','Setenta millones','Setecientos mil'], 0, 'Grupos de 3 dígitos desde la derecha.'),
    qMC('(3/4)×(2/5) =', ['6/20=3/10','5/9','3/20','6/5'], 0, 'Numerador×numerador, denom×denom.'),
    qMC('15% de 240:', ['36 (24+12)','24','15','30'], 0, '10%=24, 5%=12. 24+12=36.'),
    qMC('(−5)+(+3)−(−2) =', ['0 (−5+3+2)','6','−4','−6'], 0, '−5+3+2=0.'),
    qMC('MCD(18,24) =', ['6','12','3','8'], 0, '18=2×3², 24=2³×3. MCD=2×3=6.'),
    qMC('3/5 → %:', ['60%','35%','50%','30%'], 0, '3÷5=0.6=60%.'),
    qMC('4.5×6 =', ['27.0','24.5','30','27.5'], 0, '45×6=270, 1decimal→27.0.'),
    qTF('1/3=0.333...=33.3% son equivalentes.', true, 'Tres formas de la misma cantidad.'),
    qOrder('Ordena para (12−3×2)+4²:', ['3×2=6','12−6=6','4²=16','6+16=22'], 'PEMDAS: Par, Exp, Mult/Div, Sum/Rest.'),
    qMatch('Relaciona operación con propiedad:', [{left:'8+0=8',right:'Neutro aditivo'},{left:'9×1=9',right:'Neutro multiplicativo'},{left:'3+5=5+3',right:'Conmutativa'},{left:'4×(2+3)=20',right:'Distributiva'}], 'Propiedades fundamentales.'),
    qMC('mcm(6,8,10) =', ['120','60','80','24'], 0, '6=2×3, 8=2³, 10=2×5. mcm=2³×3×5=120.'),
    qWrite('Simplifica 45/60.', ['3/4'], 'MCD=15. 45÷15=3, 60÷15=4.'),
  ],

  // ===== M97: Repaso integral 2 - Geometría y medición =====
  [
    qMC('Perímetro rectángulo 15cm×8cm:', ['46 cm (2×15+2×8)','120cm','23cm','38cm'], 0, 'P=2(15+8)=46cm.'),
    qMC('Área triángulo base 14m, altura 9m:', ['63 m²','126m²','23m²','63m'], 0, 'A=(14×9)/2=63m².'),
    qMC('Volumen cubo arista 6cm:', ['216 cm³','36cm³','18cm³','108cm³'], 0, 'V=6³=216cm³.'),
    qMC('Ángulo LLANO:', ['180°','90°','360°','45°'], 0, 'Llano=línea recta=180°.'),
    qMC('Ejes de simetría triángulo EQUILÁTERO:', ['3 ejes','1','Ninguno','6'], 0, 'Cada mediatriz = eje.'),
    qMC('5 km → cm:', ['500,000 cm','50,000','5,000','50'], 0, 'km→m→cm: ×1,000×100.'),
    qMC('Triángulo: ángulos 50° y 60°, tercero:', ['70° (180−110)','10°','110°','180°'], 0, '180−110=70°.'),
    qTF('1 m³ = 1,000 L.', true, 'Relación fundamental por definición.'),
    qOrder('Ordena para área círculo diámetro 10cm:', ['r=5cm','r²=25','A=π×25≈78.54cm²'], 'Siempre calcula r primero.'),
    qMatch('Relaciona figura con área:', [{left:'Cuadrado lado 9',right:'81u²'},{left:'Triángulo b12,h5',right:'30u²'},{left:'Rectángulo 8×3',right:'24u²'},{left:'Círculo r4',right:'≈50.27u²'}], 'Repaso rápido de fórmulas.'),
    qMC('Escala 1:250,000. 6cm en mapa:', ['15 km (6×250k=1.5M cm)','25km','1.5km','6km'], 0, 'cm×escala÷100,000=km.'),
    qWrite('¿Minutos en 3.5 horas?', ['210'], '3.5×60=210min.'),
  ],

  // ===== M98: Repaso integral 3 - Estadística y probabilidad =====
  [
    qMC('Moda de 5,8,8,10,5,8,12:', ['8 (aparece 3 veces)','5','10','12'], 0, 'Moda=más frecuente.'),
    qMC('Promedio 70,80,90:', ['80 (240÷3)','70','90','85'], 0, '(70+80+90)÷3=80.'),
    qMC('P(cara moneda):', ['1/2=50%','1/3','100%','0%'], 0, '2 resultados equiprobables.'),
    qMC('Urna: 5 rojas, 3 azules, 2 verdes. P(azul):', ['3/10=30%','3/5','1/3','50%'], 0, '3/10=30%.'),
    qMC('Dado: P(número>4):', ['2/6=1/3 (5,6)','1/6','50%','1/2'], 0, 'Favorables: 5,6.'),
    qMC('P(A)+P(no A) =', ['SIEMPRE 1 (100%)','0.5','Depende','Cualquier número'], 0, 'Propiedad fundamental.'),
    qTF('Sector 25% en gráfica circular = 90°.', true, '0.25×360°=90°.'),
    qOrder('Ordena pasos para leer gráfica de barras:', ['Leer título','Ver etiquetas ejes','Identificar barra más alta','Comparar','Concluir'], 'Interpretación de gráficas.'),
    qMatch('Relaciona concepto estadístico:', [{left:'Moda',right:'Más frecuente'},{left:'Mediana',right:'Valor central'},{left:'Promedio',right:'Suma÷cantidad'},{left:'Probabilidad',right:'Fav/posibles'}], 'Herramientas para analizar datos.'),
    qMC('300 lanzamientos dado, "6" esperados:', ['≈50 veces (300×1/6)','300','30','100'], 0, 'Valor esperado=n×P.'),
    qWrite('P(sacar AS) 52 cartas:', ['1/13','4/52'], '4/52=1/13≈7.69%.'),
    qWrite('P(NO sacar 1 en dado):', ['5/6'], '5 caras no son 1.'),
  ],

  // ===== M99: Repaso integral 4 - Álgebra y patrones =====
  [
    qMC('x+15=37:', ['x=22','x=52','15','37'], 0, '37−15=22.'),
    qMC('3x=72:', ['x=24 (72÷3)','69','75','216'], 0, '÷3.'),
    qMC('Sucesión 4,7,10,13... diferencia:', ['+3','+4','+2','Varía'], 0, 'd=3.'),
    qMC('1,4,9,16... siguiente:', ['25 (5²)','20','32','18'], 0, 'Cuadrados: n².'),
    qMC('"Triple de número +5=26". x=', ['3x+5=26, x=7','x+5=26','3x=26','x−5=26'], 0, 'Planteamiento, despeje.'),
    qMC('Perímetro cuadrado=48cm, lado:', ['12cm (48/4)','24cm','6cm','16cm'], 0, '4L=48, L=12.'),
    qTF('Fórmula de 2,5,8,11... es aₙ=2+3(n−1).', true, 'aₙ=a₁+d(n−1).'),
    qOrder('Ordena demostración: 3 impares consec = ×3:', ['(2k−1)+(2k+1)+(2k+3)','6k+3=3(2k+1)','¡Múltiplo de 3!','Ej:3+5+7=15=3×5'], 'Álgebra=demostrar intuiciones.'),
    qMatch('Relaciona sucesión con fórmula:', [{left:'3,6,9,12...',right:'3n'},{left:'1,2,4,8...',right:'2ⁿ⁻¹'},{left:'1,3,6,10...',right:'n(n+1)/2'},{left:'2,4,8,16...',right:'2ⁿ'}], 'Conexión sucesión-álgebra.'),
    qMC('Papá=3×hijo. Juntos=48:', ['Papá=36, Hijo=12','Papá=36,Hijo=18','24 c/u','No'], 0, 'h+3h=48, h=12.'),
    qWrite('5x−7=18, ¿x?', ['5'], '5x=25, x=5.'),
    qWrite('Sucesión 1,4,7,10... a₇:', ['19'], 'd=3. a₇=1+6×3=19.'),
  ],

  // ===== M100: Problemas contextualizados (gran final) =====
  [
    qMC('Receta: 24 galletas con 3 tazas harina. Para 16:', ['2 tazas (8gal/taza)','4 tazas','1.5','3'], 0, 'Proporcionalidad en cocina.'),
    qMC('Ahorras $350/mes, meta $4,200:', ['12 meses','10','15','8'], 0, '4,200÷350=12. Planificación.'),
    qMC('Foto 12×18cm ampliada 150%:', ['18×27cm (×1.5)','24×36','15×22.5','12×18'], 0, 'Homotecia: ampliación fotográfica.'),
    qMC('Población La Paz 300k, crece 2.5%:', ['307,500 (×1.025)','375k','303k','350k'], 0, 'Crecimiento poblacional con %.'),
    qMC('Terreno triangular base 40m, altura 25m:', ['500 m²','1,000m²','65m²','500m'], 0, 'A=(40×25)/2=500m².'),
    qMC('86°F → °C:', ['30°C ((86−32)×5/9)','15°C','25°C','35°C'], 0, 'Conversión contextualizada.'),
    qTF('El SI tiene 7 unidades base.', true, 'SI: m,kg,s,A,K,mol,cd.'),
    qOrder('Ordena para "3 camisas idénticas + pantalón $350 = $980":', ['3x+350=980','3x=630','x=$210','Verificar ✓'], 'Del mundo a la ecuación.'),
    qMatch('Relaciona problema con operación:', [{left:'−30% sobre $1,500',right:'$1,050'},{left:'IVA 16% sobre $600',right:'$96'},{left:'Inv 8%, 5a simple',right:'C×0.08×5'},{left:'Reparto $900 en 2:3',right:'$360,$540'}], 'Matemáticas financieras reales.'),
    qMC('Maratón 42.195km, 12km/h:', ['≈3.5h','2h','4.5h','5h'], 0, 'Cálculo de tiempo para runners.'),
    qWrite('$2,000 + $150/mes × 8 meses:', ['3200','$3,200'], '2000+1200=3200.'),
    qWrite('Ahorras $180/mes, ¿15 meses?', ['2700','$2,700'], '180×15=2700.'),
  ],

];
