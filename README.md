# Triviaverse

PWA estilo Duolingo para trivias (5º–6º primaria), con:
- Login simple: **nickname + PIN**
- Modo estudio (typed answer)
- Modo en vivo (individual o por equipos) — por implementar

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

## Deploy (Firebase Hosting)

Este repo está pensado para deploy automático por GitHub Actions.

Requisitos en GitHub Secrets:
- `FIREBASE_SERVICE_ACCOUNT_TRIVIAVERSE` (JSON de service account)
- `FIREBASE_PROJECT_ID` (por ejemplo: `triviaverse`)

