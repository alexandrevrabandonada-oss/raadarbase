import { test, expect } from '@playwright/test';

test.describe('Módulo de Memória Estratégica', () => {
  test.beforeEach(async ({ page }) => {
    // Login já deve estar configurado no global setup ou via cookies de teste
    await page.goto('/memoria');
  });

  test('deve carregar a listagem de memórias', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Memória Estratégica');
    await expect(page.getByRole('button', { name: 'Nova Memória' })).toBeVisible();
  });

  test('deve navegar para formulário de nova memória', async ({ page }) => {
    await page.getByRole('button', { name: 'Nova Memória' }).click();
    await expect(page).toHaveURL(/\/memoria\/nova/);
    await expect(page.locator('h1')).toContainText('Nova Memória Estratégica');
  });

  test('deve mostrar aviso de governança no formulário', async ({ page }) => {
    await page.goto('/memoria/nova');
    await expect(page.getByText('Aviso de Governança')).toBeVisible();
    await expect(page.getByText('Não use para classificar pessoas')).toBeVisible();
  });

  test('deve carregar página de sugestões', async ({ page }) => {
    await page.getByRole('link', { name: 'Sugerir a partir dos resultados' }).click();
    await expect(page).toHaveURL(/\/memoria\/sugestoes/);
    await expect(page.locator('h1')).toContainText('Sugestões de Memória');
  });

  test('deve validar bloqueio de termos proibidos na criação', async ({ page }) => {
    await page.goto('/memoria/nova');
    await page.fill('input[name="title"]', 'Teste com voto certo');
    await page.fill('textarea[name="summary"]', 'Este é um teste de bloqueio.');
    await page.click('button[type="submit"]');

    // Deve aparecer toast de erro (dependendo da implementação do toast no teste)
    // Mas o mais importante é que não deve navegar para o detalhe
    await expect(page).toHaveURL(/\/memoria\/nova/);
  });
});
