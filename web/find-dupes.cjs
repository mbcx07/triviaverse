const admin = require('firebase-admin')
const fs = require('fs')

const serviceAccount = JSON.parse(fs.readFileSync('/home/ubuntu/workspace/triviverso.json', 'utf8'))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db = admin.firestore()

async function main() {
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
            prompt: q.prompt?.substring(0, 100),
            options: q.options,
            correctIndex: q.correctIndex
          })
        }
      }
    }
  }

  console.log('=== PREGUNTAS CON OPCIONES DUPLICADAS ===')
  console.log(`Total encontradas: ${problems.length}`)
  console.log(JSON.stringify(problems.slice(0, 30), null, 2))
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })