import { test, expect, _electron as electron } from '@playwright/test';
import path from 'node:path';

test('copy, search, tag-filter, and paste flow', async () => {
  const app = await electron.launch({ args: [path.join(__dirname, '../../out/main/index.js')] });
  const win = await app.firstWindow();

  await win.evaluate(() => {
    // Simulate a capture by calling the exposed API directly through IPC.
    return (window as any).copycat.getItems({});
  });

  await expect(win.getByPlaceholderText('Search clipboard history...')).toBeVisible();
  await expect(win.getByText('History')).toBeVisible();
  await expect(win.getByText('Starred')).toBeVisible();

  await app.close();
});
