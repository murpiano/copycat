import { autoUpdater } from 'electron-updater';
import type { Tray } from 'electron';

const CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Pulls new versions from the GitHub release feed configured in
 * electron-builder.yml. The app is a tray resident, so a download is never
 * announced with a dialog that would steal focus: it installs on the next
 * quit, and the tray tooltip is the only hint that something is pending.
 */
export function startAutoUpdates(getTray: () => Tray | null): void {
  // Packaged builds only; a dev run has no update feed to talk to.
  if (!autoUpdater.isUpdaterActive()) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-downloaded', ({ version }) => {
    getTray()?.setToolTip(`Copycat — версия ${version} установится при выходе`);
  });

  autoUpdater.on('error', (error) => {
    // A failed check must never take the app down with it; the next tick retries.
    console.error('[copycat] update check failed:', error.message);
  });

  void autoUpdater.checkForUpdates();
  setInterval(() => void autoUpdater.checkForUpdates(), CHECK_INTERVAL_MS);
}
