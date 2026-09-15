# Osama Pos - Desktop Environment (Electron + SQLite)

This folder contains the Electron desktop integration for Osama Pos:
- `main.cjs`: Electron main process with SQLite WAL mode, monotonic timestamps, IPC bridge, and thermal print handlers.
- `preload.cjs`: Secure preload bridge exposing `window.bayaaDesktop`.

### Running on Local Desktop (Windows / macOS / Linux)

To run as a native desktop application with SQLite:

1. Install desktop development dependencies on your local machine:
   ```bash
   npm install --save-dev electron better-sqlite3 electron-builder concurrently wait-on
   ```

2. Run desktop dev server:
   ```bash
   npm run desktop:dev
   ```

3. Build desktop installer (.exe / installer):
   ```bash
   npm run desktop:build
   ```
