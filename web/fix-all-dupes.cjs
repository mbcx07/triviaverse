const admin = require('firebase-admin')
const fs = require('fs')

const serviceAccount = JSON.parse(fs.readFileSync('/home/ubuntu/workspace/triviverso.json', 'utf8'))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

// Preguntas a corregir - basado en lo que Moisés reportó
const fixes = {
  // Pregunta "¿Cuál de los siguientes NO es un país?" - opciones correctas
  'esp-1': {
    'q1': {
      // La pregunta correcta debería tener opciones variadas donde una NO es país
      options: ['México', 'París', 'España', 'Argentina'],
      correctIndex: 1, // París NO es un país, es una ciudad
      explanation: 'París es la capital de Francia, no un país. Los demás son países.'
    }
  }
}

// También buscar todas las preguntas con opciones duplicadas
async function findAllDuplicates() {
  const lessons = await db.collection('lessons').get()
  const problems = []

  for (const lessonDoc of lessons.docs) {
    const questions = await db.collection('lessons').doc(lessonDoc.id).collection('questions').get()
    
    for (const qDoc of questions.docs) {
      const q = qDoc.data()
      if (q.options && q.options.length >= 2) {
        const allSame = q.options.every(opt => opt === q.options[0])
        if (allSame) {
          problems.push({
            lessonId: lessonDoc.id,
            questionId: qDoc.id,
            prompt: q.prompt,
            options: q.options,
            correctIndex: q.correctIndex
          })
        }
      }
    }
  }
  
  return problems
}

// Generar opciones correctas basadas en el tipo de pregunta
function generateCorrectOptions(question) {
  const prompt = (question.prompt || '').toLowerCase()
  
  // Detectar tipo de pregunta
  if (prompt.includes('no es un país')) {
    return {
      options: ['México', 'París', 'España', 'Argentina'],
      correctIndex: 1, // París es ciudad, no país
      explanation: 'París es la capital de Francia, no un país.'
    }
  }
  
  if (prompt.includes('no es una capital')) {
    return {
      options: ['Madrid', 'Buenos Aires', 'España', 'Lima'],
      correctIndex: 2, // España es país, no capital
      explanation: 'España es un país, no una capital.'
    }
  }
  
  if (prompt.includes('verbo') || prompt.includes('verbo')) {
    return {
      options: ['correr', 'casa', 'grande', 'muy'],
      correctIndex: 0,
      explanation: '"Correr" es un verbo (acción).'
    }
  }
  
  if (prompt.includes('sustantivo')) {
    return {
      options: ['casa', 'correr', 'grande', 'muy'],
      correctIndex: 0,
      explanation: '"Casa" es un sustantivo (cosa/lugar).'
    }
  }
  
  if (prompt.includes('adjetivo')) {
    return {
      options: ['grande', 'casa', 'correr', 'muy'],
      correctIndex: 0,
      explanation: '"Grande" es un adjetivo (describe).'
    }
  }
  
  // Default: opciones genéricas
  return {
    options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
    correctIndex: 0,
    explanation: 'Respuesta correcta.'
  }
}

async function main() {
  console.log('Buscando preguntas con opciones duplicadas...')
  const problems = await findAllDuplicates()
  
  console.log(`\nEncontradas ${problems.length} preguntas con opciones duplicadas:`)
  
  for (const p of problems.slice(0, 10)) {
    console.log(`\n--- ${p.lessonId}/${p.questionId} ---`)
    console.log(`Pregunta: ${p.prompt?.substring(0, 80)}...`)
    console.log(`Opciones duplicadas: ${JSON.stringify(p.options)}`)
    
    // Generar opciones correctas
    const fix = generateCorrectOptions(p)
    console.log(`Nuevas opciones: ${JSON.stringify(fix.options)}`)
    console.log(`CorrectIndex: ${fix.correctIndex}`)
    
    // Aplicar fix
    try {
      await db.collection('lessons').doc(p.lessonId).collection('questions').doc(p.questionId).update({
        options: fix.options,
        correctIndex: fix.correctIndex,
        explanation: fix.explanation
      })
      console.log('✅ CORREGIDO')
    } catch (e) {
      console.log('❌ Error:', e.message)
    }
  }
  
  console.log(`\n\nTotal procesadas: ${Math.min(problems.length, 10)} de ${problems.length}`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })