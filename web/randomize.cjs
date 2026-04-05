const admin = require('firebase-admin')
const fs = require('fs')

const serviceAccount = JSON.parse(fs.readFileSync('/home/ubuntu/workspace/triviverso.json', 'utf8'))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

// Función para mezclar array y devolver nuevo índice correcto
function shuffleOptions(options, correctIndex) {
  if (!options || options.length === 0) return { options, correctIndex: 0 }
  
  const correctAnswer = options[correctIndex]
  const shuffled = [...options]
  
  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  // Encontrar nueva posición de la respuesta correcta
  const newCorrectIndex = shuffled.findIndex(opt => opt === correctAnswer)
  
  return { options: shuffled, correctIndex: newCorrectIndex }
}

async function main() {
  console.log('Randomizando opciones de preguntas...\n')
  
  // Solo procesar algunas lecciones para evitar quota
  const lessonsToFix = ['esp-1', 'esp-2', 'esp-3', 'esp-4', 'esp-5']
  
  for (const lessonId of lessonsToFix) {
    console.log(`Procesando ${lessonId}...`)
    
    for (let i = 1; i <= 12; i++) {
      const qId = `q${i}`
      try {
        const doc = await db.collection('lessons').doc(lessonId).collection('questions').doc(qId).get()
        
        if (doc.exists) {
          const data = doc.data()
          
          // Solo randomizar si tiene opciones y correctIndex
          if (data.options && data.options.length >= 2 && data.correctIndex !== undefined) {
            const { options: shuffled, correctIndex: newCorrect } = shuffleOptions(data.options, data.correctIndex)
            
            await db.collection('lessons').doc(lessonId).collection('questions').doc(qId).update({
              options: shuffled,
              correctIndex: newCorrect
            })
            
            console.log(`  ✅ ${qId}: correctIndex ${data.correctIndex} → ${newCorrect}`)
          }
        }
      } catch (e) {
        console.log(`  ⚠️ ${qId}: ${e.message}`)
      }
    }
  }
  
  console.log('\n✅ Done!')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })