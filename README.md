# FoosTimer ⚽️⏱️

Application web mobile-first pour l'entraînement au timing de tir au baby-foot.

## Fonctionnalités

- Détection automatique des tirs via microphone (100% local).
- Feedback vocal du temps de tir.
- Statistiques de régularité et zones cibles.
- Mode PWA (installable sur téléphone).
- Respect total de la vie privée (aucune donnée envoyée).

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

## Build & Production

```bash
npm run build
npm run preview
```

## Déploiement

### Vercel / Netlify
1. Connecte ton repo GitHub.
2. Commande de build : `npm run build`.
3. Répertoire de sortie : `dist`.

## Sécurité & Confidentialité

L'audio capturé par le microphone est traité en temps réel dans le navigateur (Web Audio API) et **immédiatement jeté**. Aucune donnée audio n'est stockée ou transmise.

### Headers recommandés

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; media-src 'self' blob:;
```
