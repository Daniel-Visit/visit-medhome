import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should navigate through login flow', async ({ page }) => {
    await page.goto('/login');
    
    // Verificar que estamos en la página de login
    await expect(page.locator('h1')).toContainText('Iniciar sesión');
    
    // Ingresar RUT
    await page.fill('input[type="text"]', '156362743');
    await page.click('button[type="submit"]');
    
    // Debería redirigir a /login/code
    await expect(page).toHaveURL(/\/login\/code/);
    
    // Verificar que aparece el código de 6 dígitos
    await expect(page.locator('input[type="text"]')).toBeVisible();
  });
});

