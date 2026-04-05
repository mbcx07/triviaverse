import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'

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
  // Buscar lecciones de español
  const lessons = await getDocs(collection(db, 'lessons'))
  
  for (const lessonDoc of lessons.docs) {
    if (!lessonDoc.id.startsWith('esp-')) continue
    
    console.log('\\n=== Lección:', lessonDoc.id, '===')
    const questionsSnap = await getDocs(collection(db, 'lessons', lessonDoc.id, 'questions'))
    
    for (const qDoc of questionsSnap.docs) {
      const q = qDoc.data()
      console.log('\\nID:', qDoc.id)
      console.log('Tipo:', q.type)
      console.log('Pregunta:', q.prompt?.substring(0, 100))
      if (q.options) {
        console.log('Opciones:', q.options)
        console.log('CorrectIndex:', q.correctIndex)
        const allSame = q.options.every(opt => opt === q.options[0])
        if (allSame) console.log('⚠️ TODAS LAS OPCIONES SON IGUALES!')
      }
    }
  }
  
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
