const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs } = require('firebase/firestore')

const firebaseConfig = {
  apiKey: 'AIzaSyDqNhwBf0kJ8Q0sYvqwQV5JPhjDCkXmJBk',
  authDomain: 'triviverso.firebaseapp.com',
  projectId: 'triviverso',
  storageBucket: 'triviverso.appspot.com',
  messagingSenderId: '296782638563',
  appId: '1:296782638563:web:abc123'
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function main() {
  const lessons = await getDocs(collection(db, 'lessons'))
  const problems = []
  
  for (const lessonDoc of lessons.docs) {
    const questionsSnap = await getDocs(collection(db, 'lessons', lessonDoc.id, 'questions'))
    for (const qDoc of questionsSnap.docs) {
      const q = qDoc.data()
      // Check if all options are the same
      if (q.options && q.options.length >= 2) {
        const allSame = q.options.every(opt => opt === q.options[0])
        if (allSame) {
          problems.push({
            lessonId: lessonDoc.id,
            questionId: qDoc.id,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex
          })
        }
      }
    }
  }
  
  console.log(JSON.stringify(problems, null, 2))
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
