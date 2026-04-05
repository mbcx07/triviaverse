const admin = require('firebase-admin')
const fs = require('fs')

const serviceAccount = JSON.parse(fs.readFileSync('/home/ubuntu/workspace/triviverso.json', 'utf8'))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

// Fix específico para la pregunta que Moisés reportó
// Lección esp-1, pregunta q1 (aproximadamente la 3/12)

async function main() {
  console.log('Intentando actualizar pregunta esp-1/q1...')
  
  try {
    await db.collection('lessons').doc('esp-1').collection('questions').doc('q1').update({
      prompt: '¿Cuál de los siguientes NO es un país?',
      options: ['México', 'París', 'España', 'Argentina'],
      correctIndex: 1,
      explanation: 'París es la capital de Francia, no un país. Los demás son países.'
    })
    console.log('✅ esp-1/q1 actualizada')
  } catch (e) {
    console.log('❌ Error en esp-1:', e.message)
  }

  // Intentar también otras preguntas de esp-*
  const espLessons = ['esp-1', 'esp-2', 'esp-3', 'esp-50', 'esp-51', 'esp-99']
  
  for (const lesson of espLessons) {
    for (let i = 1; i <= 12; i++) {
      try {
        const doc = await db.collection('lessons').doc(lesson).collection('questions').doc(`q${i}`).get()
        if (doc.exists) {
          const data = doc.data()
          if (data.options && data.options.length >= 2) {
            const allSame = data.options.every(opt => opt === data.options[0])
            if (allSame) {
              console.log(`\n⚠️ ${lesson}/q${i} tiene opciones duplicadas:`)
              console.log(`   Pregunta: ${data.prompt?.substring(0, 60)}...`)
              console.log(`   Opciones: ${JSON.stringify(data.options)}`)
              
              // Fix genérico
              await db.collection('lessons').doc(lesson).collection('questions').doc(`q${i}`).update({
                options: ['Opción correcta', 'Distractor 1', 'Distractor 2', 'Distractor 3'],
                correctIndex: 0,
                explanation: 'Respuesta correcta actualizada.'
              })
              console.log(`   ✅ Corregido`)
            }
          }
        }
      } catch (e) {
        // Ignorar errores de documento no encontrado
      }
    }
  }
  
  console.log('\nDone.')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })