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
    const originalContent = win.locator('.item-card-content').getByText('Содержимое пользователя', { exact: true });
    await originalContent.waitFor();
    await app.evaluate(({ Menu }) => {
      const original = Menu.buildFromTemplate;
      const state = globalThis as unknown as { excerptMenu?: Electron.Menu; restoreMenu?: () => void };
      Menu.buildFromTemplate = (template) => {
        const menu = original.call(Menu, template);
        state.excerptMenu = menu;
        return menu;
      };
      state.restoreMenu = () => { Menu.buildFromTemplate = original; };
    });
    const excerptPoint = await originalContent.evaluate((node) => {
      const range = document.createRange();
      range.setStart(node.firstChild!, 0);
      range.setEnd(node.firstChild!, 10);
      window.getSelection()!.removeAllRanges();
      window.getSelection()!.addRange(range);
      const rect = range.getBoundingClientRect();
      return { x: rect.left + 4, y: rect.top + rect.height / 2 };
    });
    await win.mouse.click(excerptPoint.x, excerptPoint.y, { button: 'right' });
    await expect.poll(() => app.evaluate(() => (globalThis as unknown as { excerptMenu?: Electron.Menu }).excerptMenu?.items[0].label)).toBe('Копировать');
    expect(await app.evaluate(({ clipboard }) => {
      const state = globalThis as unknown as { excerptMenu: Electron.Menu; restoreMenu: () => void };
      state.excerptMenu.items[0].click();
      state.excerptMenu.closePopup();
      state.restoreMenu();
      return clipboard.readText();
    })).toBe('Содержимое');
    const originalCard = win.locator('.item-card').filter({ has: originalContent });
    await originalCard.getByRole('button', { name: 'В избранное', exact: true }).click();
    await originalCard.getByRole('button', { name: 'Удалить', exact: true }).click();
    await expect(win.getByRole('alertdialog')).toContainText('Блок добавлен в избранное.');
    await win.screenshot({ path: test.info().outputPath('protected-delete-ru.png') });
    await win.keyboard.press('Tab');
    await expect(win.getByRole('alertdialog').getByRole('button', { name: 'Удалить', exact: true })).toBeFocused();
    await win.keyboard.press('Tab');
    await expect(win.getByRole('alertdialog').getByRole('button', { name: 'Отмена', exact: true })).toBeFocused();
    await win.getByRole('alertdialog').getByRole('button', { name: 'Отмена', exact: true }).click();
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
    const closeSettings = settings.locator('.popup-head .item-card-action');
    expect(await closeSettings.evaluate((node) => [node.getBoundingClientRect().width, node.getBoundingClientRect().height])).toEqual([36, 36]);
    await closeSettings.click({ position: { x: 3, y: 3 } });
    await expect(settings).toHaveCount(0);
    await hideAndShow();
    await expect(win.getByRole('button', { name: 'Categories', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await expect(win.getByRole('button', { name: 'Профиль', exact: true })).toBeVisible();
    expect(await win.locator('.category-list').first().evaluate((node) => getComputedStyle(node).paddingLeft)).toBe('42px');
    expect(await win.locator('.nav-row-main > svg').evaluateAll((nodes) => nodes.every((node) => node.getBoundingClientRect().width === 18 && node.getBoundingClientRect().height === 18))).toBe(true);
    await expect(win.locator('.item-card-kind').getByText('Текст', { exact: true })).toBeVisible();
    await expect(win.locator('.item-card-content').filter({ hasText: 'Содержимое пользователя' })).toBeVisible();

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
    await win.locator('.overlay').click({ position: { x: 5, y: 5 } });
    await expect(win.getByRole('dialog')).toHaveCount(0);
    await win.evaluate(async () => {
      for (let index = 0; index < 30; index++) {
        await window.copycat.createItem({ title: `toolbar-${index}`, content: 'toolbar regression', type: 'text', tags: [] });
      }
    });
    await win.getByPlaceholder('Search clipboard history...').fill('toolbar');
    await win.getByRole('button', { name: 'Text', exact: true }).click();
    await expect(win.locator('.item-card')).toHaveCount(30);
    await win.locator('.item-grid').evaluate((node) => { node.scrollTop = node.scrollHeight; node.dispatchEvent(new Event('scroll')); });
    const backToTop = win.getByRole('button', { name: 'Back to top', exact: true });
    await expect(backToTop).toBeVisible();
    expect(await backToTop.evaluate((node) => getComputedStyle(node).whiteSpace)).toBe('nowrap');
    const toolbarSizes = await win.locator('.grid-toolbar .grid-reorder-toggle').evaluateAll((nodes) => nodes.map((node) => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height })));
    expect(toolbarSizes[0].width).toBe(toolbarSizes[1].width);
    expect(new Set(toolbarSizes.map((size) => size.height)).size).toBe(1);
    await win.screenshot({ path: test.info().outputPath('toolbar-en.png') });

    await app.close();
    app = await launch();
    win = await app.firstWindow();
    await win.emulateMedia({ reducedMotion: 'reduce' });
    await expect(win.getByRole('button', { name: 'Settings', exact: true })).toBeVisible();
    await expect(win.getByRole('button', { name: 'Categories', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await expect(win.getByRole('button', { name: 'Профиль', exact: true })).toBeVisible();
    expect(await win.evaluate(() => window.copycat.getSettings())).toMatchObject({ language: 'en', filesExpanded: true, categoriesExpanded: true });

    await win.getByRole('button', { name: 'Settings', exact: true }).click();
    await win.getByLabel('Expand categories', { exact: true }).uncheck();
    await win.getByLabel('Expand files', { exact: true }).uncheck();
    await win.getByRole('button', { name: 'Configure sections', exact: true }).click();
    await hideAndShow();
    await expect(win.locator('.sidebar')).toHaveClass(/reordering/);
    await expect(win.getByRole('button', { name: 'Categories', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await expect(win.getByRole('button', { name: 'All files', exact: true })).toBeVisible();
    await win.getByRole('button', { name: 'Delete category Профиль', exact: true }).click();
    await win.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(win.getByRole('button', { name: 'Профиль', exact: true })).toHaveCount(0);
    const objects = await win.evaluate(() => window.copycat.getItems({}));
    expect(objects.some((item) => item.title === 'sample.txt' && item.tags.length === 0)).toBe(true);
  } finally {
    await app.close();
  }
});
