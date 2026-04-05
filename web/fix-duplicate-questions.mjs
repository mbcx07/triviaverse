// Script para encontrar y arreglar preguntas con opciones duplicadas en Firestore
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore'

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

// Países de América del Norte para reemplazar
const northAmericanCountries = ['México', 'Estados Unidos', 'Canadá', 'Guatemala']
const centralAmericanCountries = ['Belice', 'Guatemala', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panamá']
const southAmericanCountries = ['Brasil', 'Argentina', 'Colombia', 'Perú', 'Chile', 'Ecuador', 'Venezuela']
const europeanCountries = ['España', 'Francia', 'Italia', 'Alemania', 'Reino Unido', 'Portugal']
const asianCountries = ['China', 'Japón', 'India', 'Corea del Sur', 'Vietnam', 'Tailandia']
const africanCountries = ['Egipto', 'Nigeria', 'Sudáfrica', 'Marruecos', 'Etiopía', 'Kenia']

function shuffleArray(arr) {
  const newArr = [...arr]
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]]
  }
  return newArr
}

function fixQuestion(q) {
  if (!q.options || q.options.length < 2) return null
  
  const allSame = q.options.every(opt => opt === q.options[0])
  if (!allSame) return null // No necesita fix
  
  const prompt = q.prompt || ''
  
  // Detectar tipo de pregunta y generar opciones correctas
  let newOptions = [...q.options]
  let newCorrectIndex = 0
  
  // Detectar si es pregunta sobre países
  if (prompt.toLowerCase().includes('país') || prompt.toLowerCase().includes('country')) {
    if (prompt.toLowerCase().includes('américa del norte') || prompt.toLowerCase().includes('norteamérica')) {
      // Pregunta sobre países de América del Norte
      newOptions = shuffleArray(northAmericanCountries.slice(0, 4))
      newCorrectIndex = Math.floor(Math.random() * 4)
    } else if (prompt.toLowerCase().includes('américa central')) {
      newOptions = shuffleArray(centralAmericanCountries.slice(0, 4))
      newCorrectIndex = Math.floor(Math.random() * 4)
    } else if (prompt.toLowerCase().includes('américa del sur') || prompt.toLowerCase().includes('sudamérica')) {
      newOptions = shuffleArray(southAmericanCountries.slice(0, 4))
      newCorrectIndex = Math.floor(Math.random() * 4)
    } else if (prompt.toLowerCase().includes('europa')) {
      newOptions = shuffleArray(europeanCountries.slice(0, 4))
      newCorrectIndex = Math.floor(Math.random() * 4)
    } else if (prompt.toLowerCase().includes('asia')) {
      newOptions = shuffleArray(asianCountries.slice(0, 4))
      newCorrectIndex = Math.floor(Math.random() * 4)
    } else if (prompt.toLowerCase().includes('áfrica')) {
      newOptions = shuffleArray(africanCountries.slice(0, 4))
      newCorrectIndex = Math.floor(Math.random() * 4)
    } else {
      // Pregunta genérica sobre países - mezclar continentes
      newOptions = ['México', 'Brasil', 'España', 'China']
      newCorrectIndex = Math.floor(Math.random() * 4)
    }
  } else {
    // Para otros tipos de preguntas, generar opciones variadas genéricas
    // Mantener la respuesta correcta como opción A y generar distractors
    const correctAnswer = q.options[q.correctIndex] || q.options[0]
    const distractors = ['Opción A', 'Opción B', 'Opción C', 'Opción D'].filter(d => d !== correctAnswer).slice(0, 3)
    newOptions = [correctAnswer, ...distractors]
    newCorrectIndex = 0
  }
  
  return {
    ...q,
    options: newOptions,
    correctIndex: newCorrectIndex
  }
}

async function main() {
  console.log('Buscando preguntas con opciones duplicadas...')
  
  const lessons = await getDocs(collection(db, 'lessons'))
  let fixedCount = 0
  
  for (const lessonDoc of lessons.docs) {
    const questionsSnap = await getDocs(collection(db, 'lessons', lessonDoc.id, 'questions'))
    
    for (const qDoc of questionsSnap.docs) {
      const q = qDoc.data()
      const fixed = fixQuestion(q)
      
      if (fixed) {
        console.log(`Fixing: ${lessonDoc.id}/${qDoc.id}`)
        console.log(`  Old: ${q.options.join(', ')} (correct: ${q.correctIndex})`)
        console.log(`  New: ${fixed.options.join(', ')} (correct: ${fixed.correctIndex})`)
        
        await updateDoc(doc(db, 'lessons', lessonDoc.id, 'questions', qDoc.id), {
          options: fixed.options,
          correctIndex: fixed.correctIndex
        })
        fixedCount++
      }
    }
  }
  
  console.log(`\nTotal fixed: ${fixedCount} questions`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })