import { app, BrowserWindow } from 'electron';

function createWindow(): void {
  const win = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: `${__dirname}/../preload/index.js`,
    },
  });
  win.loadURL(
    process.env.ELECTRON_RENDERER_URL ?? `file://${__dirname}/../renderer/index.html`,
  );
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
