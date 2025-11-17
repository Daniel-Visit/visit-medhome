# Modo Mock de Geolocalización

## Descripción

El modo mock de geolocalización permite probar la funcionalidad de check-in sin necesidad de otorgar permisos de geolocalización reales. Esto es especialmente útil cuando se usa el browser tab de Cursor, donde no se pueden otorgar permisos manualmente.

## Configuración

### Activar el modo mock

1. Crea o edita el archivo `.env.local` en la raíz del proyecto:

```bash
NEXT_PUBLIC_MOCK_GEOLOCATION=true
```

2. (Opcional) Configura coordenadas por defecto:

```bash
NEXT_PUBLIC_MOCK_GEOLOCATION=true
NEXT_PUBLIC_MOCK_LAT=-33.424034
NEXT_PUBLIC_MOCK_LNG=-70.5260594
```

3. Reinicia el servidor de desarrollo:

```bash
npm run dev
```

## Uso

### Con coordenadas por defecto

Si configuraste `NEXT_PUBLIC_MOCK_LAT` y `NEXT_PUBLIC_MOCK_LNG`, las coordenadas se usarán automáticamente cuando hagas clic en "Compartir mi ubicación".

### Sin coordenadas por defecto

1. Abre una visita en el acordeón
2. Verás un formulario amarillo con campos para ingresar latitud y longitud
3. Ingresa las coordenadas manualmente o usa el botón "Usar coordenadas del paciente"
4. Haz clic en "Usar coordenadas"
5. La ubicación se establecerá y podrás hacer check-in

### Fallback automático

Si el permiso de geolocalización es denegado en modo normal (no mock), el sistema mostrará automáticamente los campos para ingresar coordenadas manualmente como fallback.

## Ejemplos de coordenadas

### Coordenadas del paciente de prueba (cerca de Las Condes)
- Latitud: `-33.424034`
- Longitud: `-70.5260594`

### Coordenadas para probar fuera del radio (150m)
- Latitud: `-33.425000` (aproximadamente 100m al sur)
- Longitud: `-70.5260594`

## Desactivar el modo mock

Para volver al comportamiento normal con geolocalización real:

1. Edita `.env.local`:

```bash
NEXT_PUBLIC_MOCK_GEOLOCATION=false
```

2. Reinicia el servidor de desarrollo

## Notas importantes

- El modo mock solo está disponible en desarrollo (`NODE_ENV=development`)
- En producción, siempre se usa geolocalización real
- Las coordenadas mock se validan antes de usarse
- Puedes usar coordenadas del paciente para probar check-ins válidos (dentro del radio)


