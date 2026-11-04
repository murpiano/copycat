import { test, expect, _electron as electron } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

test('preserves work across window hiding and saves interface preferences', async () => {
  test.setTimeout(90_000);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'copycat-e2e-'));
  const env: Record<string, string> = {
    ...Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined)),
    COPYCAT_DEV_WINDOW: '1', XDG_CONFIG_HOME: profile, APPDATA: profile,
  };
  delete env.ELECTRON_RUN_AS_NODE;
  const launch = () => electron.launch({ args: [path.join(__dirname, '../../out/main/index.js')], env });
  let app = await launch();
  try {
    let win = await app.firstWindow();
    await win.emulateMedia({ reducedMotion: 'reduce' });
    expect(await app.evaluate(({ app }) => app.getPath('userData'))).toContain(profile);
    const hideAndShow = async () => {
      await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].hide());
      expect(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isVisible())).toBe(false);
      await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].show());
      expect(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].isVisible())).toBe(true);
    };

    await win.getByRole('button', { name: 'Создать', exact: true }).click();
    await win.getByRole('textbox', { name: 'Название', exact: true }).fill('Текст');
    await win.getByRole('textbox', { name: 'Содержимое', exact: true }).fill('Содержимое пользователя');
    await win.getByRole('dialog', { name: 'Новый блок' }).getByRole('button', { name: 'Создать', exact: true }).click();
    const search = win.getByPlaceholder('Поиск по буферу обмена...');
    await search.fill('пользователя');
    await win.getByRole('button', { name: 'Избранное', exact: true }).click();
    await expect(search).toHaveValue('пользователя');
    await win.getByRole('button', { name: 'Текст', exact: true }).click();
    await expect(search).toHaveValue('пользователя');
    await win.locator('.item-card-content').getByText('Содержимое пользователя', { exact: true }).click();
    await hideAndShow();
    await expect(win.getByRole('dialog', { name: 'Содержимое' })).toBeVisible();
    await win.getByRole('dialog').getByRole('button', { name: 'Редактировать', exact: true }).click();
    const content = win.getByRole('textbox', { name: 'Содержимое', exact: true });
    await content.fill('Содержимое пользователя — черновик');
    await hideAndShow();
    await expect(content).toHaveValue('Содержимое пользователя — черновик');
    await win.getByRole('button', { name: 'Сохранить', exact: true }).click();
    await win.getByRole('button', { name: 'Очистить поиск', exact: true }).click();

    await win.getByRole('button', { name: 'Категории', exact: true }).click();
    await win.getByRole('button', { name: 'Добавить категорию', exact: true }).click();
    await win.getByPlaceholder('Название категории').fill('Профиль');
    await win.getByPlaceholder('Название категории').press('Enter');
    const files = win.locator('.nav-row').filter({ has: win.locator('.nav-row-main span').getByText('Файлы', { exact: true }) });
    await files.locator('.nav-row-main').click();
    await expect(files).not.toHaveClass(/active/);
    await hideAndShow();
    await expect(win.getByRole('button', { name: 'Категории', exact: true })).toHaveAttribute('aria-expanded', 'false');
    await expect(files.locator('.nav-row-main')).toHaveAttribute('aria-expanded', 'false');

    await win.getByRole('button', { name: 'Настройки', exact: true }).click();
    await win.getByRole('button', { name: 'ENG', exact: true }).click();
    const settings = win.getByRole('dialog', { name: 'Settings', exact: true });
    await expect(settings).toBeVisible();
    await settings.getByLabel('Expand categories', { exact: true }).check();
    await settings.getByLabel('Expand files', { exact: true }).check();
    await settings.getByRole('button', { name: 'Close', exact: true }).first().click();
    await hideAndShow();
    await expect(win.getByRole('button', { name: 'Categories', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await expect(win.getByRole('button', { name: 'Профиль', exact: true })).toBeVisible();
    await expect(win.locator('.item-card-kind').getByText('Текст', { exact: true })).toBeVisible();
    await expect(win.locator('.item-card-content')).toContainText('Содержимое пользователя');

    const sample = path.join(profile, 'sample.txt');
    fs.writeFileSync(sample, 'example');
    await win.evaluate((content) => window.copycat.createItem({ title: 'sample.txt', content, type: 'file', tags: ['Профиль'] }), sample);
    await win.getByPlaceholder('Search clipboard history...').fill('sample.txt');
    await win.getByRole('button', { name: 'All', exact: true }).click();
    const card = win.locator('.item-card').filter({ hasText: 'sample.txt' });
    await card.hover();
    await expect(card.getByRole('button', { name: 'Open', exact: true })).toBeVisible();
    expect(await card.locator('.item-open').evaluate((node) => {
      const style = getComputedStyle(node);
      return [style.display, style.alignItems, style.justifyContent];
    })).toEqual(['flex', 'center', 'center']);
    expect(await win.locator('.item-grid').evaluate((node) => [getComputedStyle(node, '::-webkit-scrollbar').width, getComputedStyle(node, '::-webkit-scrollbar-thumb').borderRadius])).toEqual(['5px', '999px']);
    await win.screenshot({ path: test.info().outputPath('object-card-en.png') });
    await card.locator('.item-card-content').click();
    await expect(win.getByRole('dialog').getByRole('button', { name: 'Open', exact: true })).toBeVisible();
    await win.screenshot({ path: test.info().outputPath('object-detail-en.png') });

    await app.close();
    app = await launch();
    win = await app.firstWindow();
    await win.emulateMedia({ reducedMotion: 'reduce' });
    await expect(win.getByRole('button', { name: 'Settings', exact: true })).toBeVisible();
    await expect(win.getByRole('button', { name: 'Categories', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await expect(win.getByRole('button', { name: 'Профиль', exact: true })).toBeVisible();
    expect(await win.evaluate(() => window.copycat.getSettings())).toMatchObject({ language: 'en', filesExpanded: true, categoriesExpanded: true });

    await win.getByRole('button', { name: 'Settings', exact: true }).click();
    await win.getByRole('button', { name: 'Configure sections', exact: true }).click();
    await win.getByRole('button', { name: 'Delete category Профиль', exact: true }).click();
    await win.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(win.getByRole('button', { name: 'Профиль', exact: true })).toHaveCount(0);
    const objects = await win.evaluate(() => window.copycat.getItems({}));
    expect(objects.some((item) => item.title === 'sample.txt' && item.tags.length === 0)).toBe(true);
  } finally {
    await app.close();
  }
});
