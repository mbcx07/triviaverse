# Trivia PWA - App de Trivias (100% Firebase)

Aplicación web progresiva (PWA) para aprender y competir con trivias de 5to y 6to de primaria.

## 🎯 Características

- ✅ **100% Firebase Gratis** (Auth + Firestore + Realtime DB + Hosting)
- ✅ **Instalable como App** en iOS y Android (PWA)
- ✅ **Usuario + PIN** (4 dígitos) - SIN email
- ✅ **Seguimiento de progreso** por usuario (XP, niveles, rachas)
- ✅ **Niveles infinitos** (cada 100 XP = 1 nivel)
- ✅ **Temas variados:** Matemáticas, Historia, Ciencias, Español
- ✅ **Modo Estudio:** Practica con preguntas escritas
- ✅ **Modo Competencia en Vivo:** 1v1, 1v3, 2v2, 3v3
- ✅ **Equipos:** Rojo vs Azul
- ✅ **Leaderboard:** Ranking en tiempo real
- ✅ **Preguntas escritas** (SIN opciones - como el concurso)
- ✅ **Validación flexible:** Sinónimos, acentos, mayúsculas
- ✅ **Panel Admin:** Cargar preguntas con PIN de administrador
- ✅ **Fácil de compartir:** Solo un enlace a los papás

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd trivia-pwa
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita los siguientes servicios:

   **Authentication:**
   - Email/Password (para configuración básica)
   - **NO se usa para login** (usamos usuario + PIN personalizado)

   **Firestore Database:**
   - Crear base de datos en modo producción o prueba
   - Reglas (iniciales - cambiar a producción):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
       match /{document=**} {
         allow read, write: if true; // Para desarrollo
       }
     }
   }
   ```

   **Realtime Database:**
   - Crear base de datos
   - Reglas (iniciales):
   ```javascript
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```

3. Copia las credenciales desde "Project Settings"
4. Crea archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

5. Edita `.env` con tus credenciales de Firebase

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

La app estará disponible en `http://localhost:5173`

### 5. Compilar para producción

```bash
npm run build
```

Los archivos generados estarán en `dist/`

### 6. Desplegar en Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar (si es la primera vez)
firebase init

# Desplegar
firebase deploy
```

## 📱 Instalar como App (PWA)

### Android

1. Abre la app en Chrome
2. Toca los 3 puntos ⋮
3. Selecciona "Agregar a pantalla principal"
4. Confirma "Agregar"

### iOS

1. Abre la app en Safari
2. Toca el botón de compartir ⎋
3. Selecciona "Agregar a inicio"
4. Confirma "Agregar"

## 🏗️ Estructura del Proyecto

```
trivia-pwa/
├── src/
│   ├── pages/          # Páginas de la app
│   │   ├── LoginPage.tsx          # Login con usuario + PIN
│   │   ├── HomePage.tsx            # Dashboard (XP, rachas, leaderboard)
│   │   ├── CompetitionPage.tsx      # Crear/unirse a sala
│   │   ├── WaitingRoomPage.tsx     # Sala de espera (pendiente)
│   │   └── LiveGamePage.tsx        # Juego en vivo (pendiente)
│   ├── components/     # Componentes reutilizables
│   ├── hooks/          # Hooks personalizados
│   ├── services/       # Firebase y API
│   │   └── firebase.ts            # Auth, Firestore, Realtime DB, Admin
│   ├── types/          # Definiciones TypeScript
│   │   └── index.ts
│   ├── data/           # Datos de preguntas
│   │   └── questions.ts           # Banco de preguntas
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── App.css
├── public/            # Archivos estáticos (iconos, manifest)
├── .env.example       # Plantilla de variables de entorno
└── vite.config.ts    # Configuración de Vite + PWA
```

## 🎮 Funcionalidades

### Modo Estudio
- Preguntas escritas (SIN opciones)
- XP por aciertos
- Niveles infinitos
- Racha diaria
- Progreso guardado

### Modo Competencia en Vivo
- **Opciones de juego:**
  - Individual (1 vs 1)
  - Equipos:
    - 1 vs 1
    - 1 vs 3
    - 2 vs 2
    - 3 vs 3
- Sala con código (ej. A7K2)
- Pregunta sincronizada (todos al mismo tiempo)
- Temporizador por pregunta
- Ranking en tiempo real
- Equipos: Rojo vs Azul

### Panel Admin (PENDIENTE de implementar en frontend)
- Cargar preguntas
- Editar preguntas
- Eliminar preguntas
- Protegido con PIN de administrador

### Sistema de Progreso
- XP por aciertos
- Niveles infinitos (100 XP = 1 nivel)
- Racha diaria
- Leaderboard en tiempo real

## 📝 Validación de Respuestas

El sistema valida las respuestas escritas con:

1. **Normalización:** Mayúsculas/minúsculas, acentos, espacios
2. **Respuesta exacta:** Coincidencia perfecta
3. **Sinónimos:** Lista de respuestas aceptadas (ej. "La piel", "piel", "Piel")

Ejemplo de configuración de pregunta:

```typescript
{
  id: 'q1',
  text: '¿Cuánto es 234 + 567?',
  type: 'written',
  correctAnswer: '801',
  acceptedAnswers: ['801'],
  explanation: '234 + 567 = 801',
  difficulty: 'easy',
  grade: '5to'
}
```

## 🔧 Tecnología

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **Estilos:** Tailwind CSS
- **Backend:** 100% Firebase
  - Auth (personalizado con usuario + PIN)
  - Firestore (progreso, leaderboard)
  - Realtime Database (competencia en vivo)
  - Hosting (despliegue gratis)
- **PWA:** vite-plugin-pwa
- **Router:** React Router v6

## 💾 Arquitectura de Datos

### Firestore Database
```
users/{username}
  - username: string
  - pin: string (hash)
  - totalXP: number
  - currentLevel: number
  - streak: number
  - lastActiveDate: string
  - completedQuizzes: string[]
  - totalCorrectAnswers: number
  - totalAnswers: number
```

### Realtime Database
```
games/{code}
  - id: string
  - code: string
  - status: 'waiting' | 'playing' | 'finished'
  - gameMode: '1v1' | '1v3' | '2v2' | '3v3'
  - hostId: string
  - players: []
  - questions: []
  - currentQuestionIndex: number
  - currentQuestion: Question | null
  - timerEnd: number

questions/{id}
  - id: string
  - text: string
  - type: 'written'
  - acceptedAnswers: string[]
  - correctAnswer: string
  - explanation: string
  - difficulty: 'easy' | 'medium' | 'hard'
  - grade: '5to' | '6to'

sessions/{username}
  - username: string
  - active: boolean
  - lastSeen: number
```

## 📄 Licencia

MIT License

---

**Desarrollado por Pia** 🤖
**Versión:** 1.0.0
**100% Firebase Free**
