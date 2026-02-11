# Eye Blink Detection

Eye Blink Detection is an Angular + Electron application that monitors blink activity using the webcam and provides on-screen/desktop reminders.

## Project structure

- **Web app (Angular)**: runs in browser and can be deployed to GitHub Pages.
- **Desktop app (Electron)**: bundles the Angular app into installable apps for Windows, macOS, and Linux.

## Quick Start for Users

### Download the desktop app

The easiest way to get started:

1. Visit [GitHub Releases](https://github.com/roshan2197/eye-blink-detection/releases)
2. Download the latest `.exe` file for Windows or `.dmg` for macOS
3. Run the installer and grant camera permissions when prompted
4. Start monitoring your blink activity!

### Use the web app

No installation needed:

1. Visit: `https://<your-github-username>.github.io/eye-blink-detection/`
2. Click "Allow" when prompted for camera access
3. Check the settings to adjust sensitivity and blink thresholds

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

## Downloading desktop apps

### For End Users

**Pre-built installers (recommended)**

1. Go to [GitHub Releases](https://github.com/roshan2197/eye-blink-detection/releases)
2. Download the latest release:
   - **Windows**: `eye-blink-detection-x.x.x.exe` (installers) or `.portable.exe` (portable version)
   - **macOS**: `eye-blink-detection-x.x.x.dmg` or `.zip`
3. Run the installer and follow the setup wizard.

**When are releases available?**

- Automatic releases are created when a version tag is pushed (e.g., `v1.0.0`)
- Releases are built and uploaded to GitHub Releases within a few minutes
- Check the "Releases" section on the GitHub repository for the latest version

### For Developers

#### Option A: Automatic release builds (recommended)

1. Create and push a version tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

2. The workflow `.github/workflows/build-electron-release.yml` automatically builds macOS + Windows packages.
3. Artifacts are attached to a GitHub Release for that tag.
4. Download installers from the **Releases** page.

#### Option B: Manual workflow run

1. Go to **Actions → Build Desktop Apps (macOS + Windows)**.
2. Click **Run workflow**.
3. Download build outputs from the workflow artifacts.

#### Option C: Build locally

```bash
npm run electron:build:win   # Windows .exe and portable
npm run electron:build:mac   # macOS .dmg and .zip
npm run electron:build:linux # Linux AppImage and deb
```

Generated packages are in `release/` directory.

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
