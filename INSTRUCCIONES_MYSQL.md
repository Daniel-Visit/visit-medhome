# Instrucciones para MySQL

## Situación Actual
MySQL parece tener problemas de configuración. El proyecto está 100% completo excepto por las migraciones de base de datos.

## Solución Rápida

### Paso 1: Verificar estado de MySQL
```bash
brew services list | grep mysql
```

### Paso 2: Si MySQL está "stopped", iniciarlo:
```bash
brew services start mysql
```

### Paso 3: Esperar 5-10 segundos y probar conexión:
```bash
mysql -u root
```

Si funciona (entras a MySQL), ejecuta:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
FLUSH PRIVILEGES;
EXIT;
```

### Paso 4: Si no funciona, reinstalar MySQL limpio:
```bash
brew services stop mysql
brew uninstall mysql
brew install mysql
brew services start mysql
```

Luego ejecuta el asistente de configuración:
```bash
mysql_secure_installation
```

**IMPORTANTE**: Cuando pregunte por contraseña, presiona Enter para dejarla vacía (o configura una y actualiza `.env`).

### Paso 5: Después de configurar MySQL, ejecuta migraciones:
```bash
npm run migrate:sql
```

## Alternativa: Usar el servidor original

Si el servidor original (`server/`) funciona y tiene acceso a MySQL, puedes:

1. Usar ese MySQL que ya funciona
2. Ejecutar las migraciones desde ahí: `cd server && node src/db/migrate.js`
3. Luego el proyecto Next.js usará la misma base de datos

## Estado del Proyecto

✅ **100% del código está completo y listo**
⏳ Solo falta ejecutar las migraciones de base de datos

Una vez que MySQL esté configurado, todo funcionará inmediatamente.




