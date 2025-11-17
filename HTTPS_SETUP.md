# Configuración HTTPS con ngrok

## Pasos para configurar HTTPS sin romper nada

### 1. Verificar que ngrok esté instalado
```bash
which ngrok
```

### 2. Si no tienes cuenta de ngrok, crea una en https://ngrok.com (es gratis)

### 3. Obtén tu authtoken desde https://dashboard.ngrok.com/get-started/your-authtoken

### 4. Configura ngrok (solo una vez):
```bash
ngrok config add-authtoken TU_TOKEN_AQUI
```

### 5. Asegúrate de que el servidor Next.js esté corriendo:
```bash
npm run dev
```

### 6. En otra terminal, inicia ngrok:
```bash
./start-https.sh
```

O directamente:
```bash
ngrok http 3000
```

### 7. Copia la URL HTTPS que aparece (algo como: https://xxxx-xxxx-xxxx.ngrok-free.app)

### 8. Usa esa URL HTTPS en tu móvil

## Ventajas de esta solución:
- ✅ No modifica el código
- ✅ No requiere certificados locales
- ✅ Funciona inmediatamente
- ✅ Mantiene todos los logs de debugging
- ✅ Si algo falla, solo detienes ngrok y todo vuelve a la normalidad

## Detener ngrok:
```bash
pkill ngrok
```

## Ver logs de ngrok:
```bash
tail -f /tmp/ngrok.log
```

