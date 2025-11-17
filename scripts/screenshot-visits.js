const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Para ver mejor lo que pasa
  });
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 }, // iPhone size
  });
  const page = await context.newPage();
  
  try {
    console.log('🌐 Navegando a http://localhost:3000/visits...');
    await page.goto('http://localhost:3000/visits');
    await page.waitForTimeout(3000);
    
    // Tomar screenshot de la página completa
    await page.screenshot({ path: 'screenshot-visits-full.png', fullPage: true });
    console.log('✅ Screenshot completo guardado en screenshot-visits-full.png');
    
    // Tomar screenshot de la viewport
    await page.screenshot({ path: 'screenshot-visits-viewport.png' });
    console.log('✅ Screenshot del viewport guardado en screenshot-visits-viewport.png');
    
    console.log('📸 Screenshots tomados. Revisa las imágenes para ver qué necesita arreglarse.');
    console.log('⏸️  Manteniendo el navegador abierto por 10 segundos para que puedas ver...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
})();
