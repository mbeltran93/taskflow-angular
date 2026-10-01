import { test, expect, Page } from '@playwright/test';
import { SEED_USER, login, createTask, dragTaskToColumn, taskCard, columnList } from './helpers';

/**
 * Suite E2E de un flujo de usuario real sobre TaskFlow:
 * login -> listado de proyectos -> crear proyecto -> tablero Kanban ->
 * crear tarea -> moverla de columna (drag & drop) -> editarla -> borrarla
 * -> logout.
 *
 * Los tests corren en modo serial y comparten una sola `page` (una sesion
 * de navegador), igual que lo haria una persona navegando la app paso a
 * paso: cada test depende del estado que deja el anterior.
 *
 * El backend que usan estos tests es `db.e2e.json`, una copia descartable
 * de `db.json` creada por `scripts/run-e2e.js` (ver `npm run test:e2e`),
 * asi que lo que crean/editan/borran estos tests nunca afecta la semilla
 * real del repo.
 */
test.describe.configure({ mode: 'serial' });

test.describe('Flujo completo de usuario', () => {
  let page: Page;
  const projectName = `Proyecto E2E ${Date.now()}`;
  const taskTitle = 'Tarea creada por Playwright';
  const taskTitleEdited = 'Tarea creada por Playwright (editada)';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    // Las acciones de borrado (proyecto/tarea) usan `window.confirm`; lo
    // aceptamos siempre para poder automatizarlas.
    page.on('dialog', (dialog) => dialog.accept());
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('login con un usuario de la semilla', async () => {
    await login(page);
    await expect(page.locator('.app-user span')).toHaveText(SEED_USER.fullName);
  });

  test('ve el listado de proyectos y crea uno nuevo', async () => {
    await expect(page.locator('h2')).toHaveText('Mis proyectos');
    const initialCount = await page.locator('.project-card').count();

    await page.getByRole('button', { name: /nuevo proyecto/i }).click();
    await page.locator('#name').fill(projectName);
    await page.locator('#description').fill('Proyecto de prueba generado por el suite E2E de Playwright');
    await page.getByRole('button', { name: /crear proyecto/i }).click();

    const newCard = page.locator('.project-card', { hasText: projectName });
    await expect(newCard).toBeVisible();
    await expect(page.locator('.project-card')).toHaveCount(initialCount + 1);
  });

  test('entra al tablero Kanban del proyecto creado', async () => {
    await page.locator('.project-card', { hasText: projectName }).locator('.project-card-link').click();
    await expect(page).toHaveURL(/\/projects\/\d+\/board$/);
    await expect(page.locator('h2')).toHaveText(projectName);

    // El tablero nuevo arranca vacio: las tres columnas estan en 0.
    await expect(page.locator('.board-column')).toHaveCount(3);
    for (const label of ['Por hacer', 'En progreso', 'Hecho']) {
      await expect(columnList(page, label).locator('.drag-item')).toHaveCount(0);
    }
  });

  test('crea una tarea nueva via el modal', async () => {
    await createTask(page, 'Por hacer', {
      title: taskTitle,
      description: 'Descripcion de prueba',
      assignee: 'QA Playwright'
    });

    await expect(taskCard(page, taskTitle)).toBeVisible();
    await expect(columnList(page, 'Por hacer').locator('.drag-item')).toHaveCount(1);
  });

  test('mueve la tarea de "Por hacer" a "En progreso" con drag & drop', async () => {
    await dragTaskToColumn(page, taskTitle, 'En progreso');

    await expect(columnList(page, 'Por hacer').locator('.drag-item')).toHaveCount(0);
    await expect(columnList(page, 'En progreso').locator('.drag-item')).toHaveCount(1);
    await expect(columnList(page, 'En progreso').locator('.task-card', { hasText: taskTitle })).toBeVisible();
  });

  test('edita la tarea movida', async () => {
    const card = taskCard(page, taskTitle);
    await card.getByRole('button', { name: /editar/i }).click();

    const dialog = page.locator('.dialog-card');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('#title')).toHaveValue(taskTitle);

    await dialog.locator('#title').fill(taskTitleEdited);
    await dialog.getByRole('button', { name: /guardar/i }).click();
    await expect(dialog).toBeHidden();

    await expect(taskCard(page, taskTitleEdited)).toBeVisible();
    // La columna no cambio: sigue en "En progreso".
    await expect(columnList(page, 'En progreso').locator('.task-card', { hasText: taskTitleEdited })).toBeVisible();
  });

  test('borra la tarea', async () => {
    await expect(columnList(page, 'En progreso').locator('.drag-item')).toHaveCount(1);

    await taskCard(page, taskTitleEdited).getByRole('button', { name: /eliminar/i }).click();

    await expect(taskCard(page, taskTitleEdited)).toHaveCount(0);
    await expect(columnList(page, 'En progreso').locator('.drag-item')).toHaveCount(0);
  });

  test('logout', async () => {
    await page.getByRole('button', { name: /salir/i }).click();
    await expect(page).toHaveURL(/\/login$/);
    // Una ruta protegida ya no deberia ser accesible sin sesion.
    await page.goto('/projects');
    await expect(page).toHaveURL(/\/login\?returnUrl=/);
  });
});
