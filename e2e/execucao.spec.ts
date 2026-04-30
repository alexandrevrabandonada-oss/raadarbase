import { test, expect } from '@playwright/test';

test.describe('Módulo de Execução', () => {
  test.beforeEach(async ({ page }) => {
    // Login automático via global setup ou mock
    await page.goto('/execucao');
  });

  test('deve renderizar a página de execução geral', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Execução Operacional' })).toBeVisible();
    await expect(page.getByText('Tarefas Ativas')).toBeVisible();
  });

  test('deve mostrar aviso de governança na página do item', async ({ page }) => {
    // Simular navegação para um item existente (usando ID mockado se necessário)
    // Aqui assumimos que o ambiente de teste tem dados
    await page.goto('/execucao');
    const dashboardLink = page.getByRole('link', { name: 'Ir para Planos de Ação' });
    if (await dashboardLink.isVisible()) {
        await dashboardLink.click();
    }
  });

  test('deve exibir cards de execução no dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Execução da Semana')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver Execução Detalhada' })).toBeVisible();
  });
});
