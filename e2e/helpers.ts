import { Page, expect } from '@playwright/test';

/** Credenciales de la semilla `db.json` (ver tabla en el README). */
export const SEED_USER = { username: 'mbeltran', password: 'demo1234', fullName: 'Martina Beltran' };

export async function login(page: Page, username = SEED_USER.username, password = SEED_USER.password): Promise<void> {
  await page.goto('/login');
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /ingresar/i }).click();
  await expect(page).toHaveURL(/\/projects$/);
}

function columnSection(page: Page, label: string) {
  return page.locator('.board-column', { has: page.locator('h3', { hasText: label }) });
}

export function columnList(page: Page, label: string) {
  return columnSection(page, label).locator('.column-list');
}

export function taskCard(page: Page, title: string) {
  return page.locator('.task-card', { has: page.locator('h4', { hasText: title }) });
}

/**
 * Crea una tarea desde el boton "+ Agregar tarea" de una columna, llenando
 * el modal (`app-task-dialog`).
 */
export async function createTask(
  page: Page,
  columnLabel: string,
  data: { title: string; description?: string; assignee?: string }
): Promise<void> {
  await columnSection(page, columnLabel).getByRole('button', { name: /agregar tarea/i }).click();

  const dialog = page.locator('.dialog-card');
  await expect(dialog).toBeVisible();
  await dialog.locator('#title').fill(data.title);
  if (data.description) {
    await dialog.locator('#description').fill(data.description);
  }
  if (data.assignee) {
    await dialog.locator('#assignee').fill(data.assignee);
  }
  await dialog.getByRole('button', { name: /guardar/i }).click();
  await expect(dialog).toBeHidden();
}

/**
 * Simula un drag & drop "real" (eventos de mouse, no HTML5 Drag API) de una
 * tarjeta de tarea hacia otra columna. Angular CDK Drag&Drop escucha
 * pointer/mouse events, no el Drag and Drop nativo del navegador, por eso
 * `locator.dragTo()` no sirve aqui: hace falta mover el mouse en varios
 * pasos pequenos para superar el umbral de arrastre que usa el CDK.
 */
export async function dragTaskToColumn(page: Page, taskTitle: string, targetColumnLabel: string): Promise<void> {
  const card = taskCard(page, taskTitle);
  const target = columnList(page, targetColumnLabel);

  const cardBox = await card.boundingBox();
  const targetBox = await target.boundingBox();
  if (!cardBox || !targetBox) {
    throw new Error('No se pudo calcular la posicion de la tarjeta o la columna destino para el drag and drop');
  }

  const startX = cardBox.x + cardBox.width / 2;
  const startY = cardBox.y + cardBox.height / 2;
  const endX = targetBox.x + targetBox.width / 2;
  const endY = targetBox.y + Math.min(30, targetBox.height / 2);

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  // Un primer micro-movimiento para que el CDK detecte el inicio del drag.
  await page.mouse.move(startX + 5, startY + 5, { steps: 3 });
  await page.waitForTimeout(100);

  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    const x = startX + ((endX - startX) * i) / steps;
    const y = startY + ((endY - startY) * i) / steps;
    await page.mouse.move(x, y, { steps: 3 });
    await page.waitForTimeout(40);
  }

  await page.waitForTimeout(150);
  await page.mouse.up();
}
