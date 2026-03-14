# Triviaverse

PWA estilo Duolingo para trivias (5º–6º primaria), con:
- Login simple: **nickname + PIN de 4 dígitos**
- Modo estudio (typed answer)
- Multi-usuario desde casa (cada niño entra con su nickname)
- **Firestore mode**: usuarios, lecciones/preguntas y progreso

> Nota importante: este prototipo NO usa Firebase Auth. El PIN se guarda en Firestore en texto plano (requerimiento). Las reglas incluidas (`firestore.rules`) están **abiertas** para facilitar el piloto.

---

## 1) Firebase / Firestore setup

1. Crea (o usa) un proyecto de Firebase.
2. En **Build → Firestore Database**, crea una base de datos (modo test o production; para este piloto las reglas están abiertas de todas formas).
3. En **Project settings → Your apps → Web app**, registra una app web y copia la configuración.

### Variables de entorno (Vite)

Copia el archivo de ejemplo:

```bash
cd web
cp .env.example .env.local
```

Llena `.env.local` con tu config:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- (opcional) `VITE_FIREBASE_MEASUREMENT_ID`

---

## 2) Seed de datos (colecciones)

### lessons (colección)

Crea al menos 1 documento en `lessons`:

**lessons/geo-1**
```json
{ "title": "Geografía 1", "order": 1, "grade": "5-6" }
```

### lessons/{lessonId}/questions (subcolección)

Ejemplo de pregunta:

**lessons/geo-1/questions/q1**
```json
{
  "prompt": "¿Cuál es la capital de México?",
  "answersAccepted": ["ciudad de mexico", "cdmx", "mexico, ciudad de mexico"],
  "explanation": "La capital es la Ciudad de México (CDMX).",
  "order": 1
}
```

---

## Dev

```bash
cd web
npm install
npm run dev
```

## Build

```bash
cd web
npm run build
```

---

## Deploy (Firebase Hosting)

Este repo está pensado para deploy automático por GitHub Actions.

Requisitos en GitHub Secrets:
- `FIREBASE_SERVICE_ACCOUNT_TRIVIAVERSE` (JSON de service account)
- `FIREBASE_PROJECT_ID` (por ejemplo: `triviaverse`)

Si usas Firebase CLI localmente, los archivos relevantes están en el root:
- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`
