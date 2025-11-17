import { test, expect } from '@playwright/test';

test.describe('Visits Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock de autenticación - establecer cookie de auth
    await page.context().addCookies([
      {
        name: 'auth_token',
        value: 'mock-jwt-token',
        domain: 'localhost',
        path: '/',
      },
    ]);
  });

  test('should display visits page', async ({ page }) => {
    // Mock de la API de visitas
    await page.route('**/api/visits/today', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          visits: [
            {
              id: 1,
              patientName: 'Juan Pérez',
              address: 'Av. Providencia 1234',
              lat: -33.4265,
              lng: -70.6170,
              scheduledStart: new Date().toISOString(),
              scheduledEnd: new Date(Date.now() + 3600000).toISOString(),
              status: 'PENDING',
            },
          ],
        }),
      });
    });

    await page.goto('/visits');

    // Verificar que aparece el header
    await expect(page.locator('text=Visitas domiciliarias')).toBeVisible();
  });

  test('should open accordion item on click', async ({ page }) => {
    await page.route('**/api/visits/today', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          visits: [
            {
              id: 1,
              patientName: 'Juan Pérez',
              address: 'Av. Providencia 1234',
              lat: -33.4265,
              lng: -70.6170,
              scheduledStart: new Date().toISOString(),
              scheduledEnd: new Date(Date.now() + 3600000).toISOString(),
              status: 'PENDING',
            },
          ],
        }),
      });
    });

    await page.goto('/visits');

    // Hacer clic en el primer item del acordeón
    const accordionHeader = page.locator('article').first().locator('div').first();
    await accordionHeader.click();

    // Verificar que se muestra el contenido (botón de confirmar)
    await expect(page.locator('text=Confirmar asistencia')).toBeVisible();
  });
});




