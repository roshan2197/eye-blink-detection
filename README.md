# Eye Blink Detection

Eye Blink Detection is an Angular + Electron application that monitors blink activity using the webcam and provides on-screen/desktop reminders.

## Project structure

- **Web app (Angular)**: runs in browser and can be deployed to GitHub Pages.
- **Desktop app (Electron)**: bundles the Angular app into installable apps for macOS and Windows.

## Local development

### Prerequisites

- Node.js 22+
- npm 11+

### Install dependencies

```bash
npm ci
```

### Run web app locally

```bash
npm start
```

### Run Electron app in dev mode

```bash
npm run electron:dev
```

## Build commands

### Build Angular web app

```bash
npm run build
```

### Build desktop installers locally

```bash
npm run electron:build:mac
npm run electron:build:win
```

Generated desktop packages are written to `release/`.

## Deploying web app to GitHub Pages

This repository includes `.github/workflows/deploy-gh-pages.yml` which deploys automatically when `main` is updated.

### One-time GitHub setup

1. Push this repository (with workflow) to GitHub.
2. Open **Settings → Pages**.
3. Set **Source** to **Deploy from a branch**.
4. Select branch `gh-pages` and folder `/ (root)`.
5. Save.

After the next successful workflow run, the app URL format is:

```text
https://<your-github-username>.github.io/eye-blink-detection/
```

## Downloading macOS and Windows desktop apps

This repository includes `.github/workflows/build-electron-release.yml` to produce desktop binaries.

### Option A: Automatic release downloads (recommended)

1. Create and push a tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

2. The workflow builds macOS + Windows packages.
3. Artifacts are attached to a GitHub Release for that tag.
4. Users download installers from **Releases**.

### Option B: Manual workflow run

1. Go to **Actions → Build Desktop Apps (macOS + Windows)**.
2. Click **Run workflow**.
3. Download build outputs from the workflow artifacts.

## Notes

- Camera access (`getUserMedia`) works in desktop app and on GitHub Pages (HTTPS).
- Angular production config disables font inlining to avoid CI failures when fetching external Google Fonts during build.

## Useful scripts

- `npm start` → Angular dev server
- `npm run build` → Angular production build
- `npm run electron:dev` → Angular + Electron dev mode
- `npm run electron:build` → Generic desktop packaging
- `npm run electron:build:mac` → macOS packages (`.dmg`, `.zip`)
- `npm run electron:build:win` → Windows packages (`.exe`)
