# Solución para MySQL

## Problema
MySQL está corriendo pero rechaza conexiones sin contraseña.

## Soluciones

### Opción 1: Resetear contraseña a vacía (Recomendado para desarrollo)

1. Intenta conectarte con la contraseña que tengas configurada:
```bash
mysql -u root -p
```
(Si no sabes la contraseña, prueba con Enter o "root")

2. Una vez dentro de MySQL, ejecuta:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
FLUSH PRIVILEGES;
EXIT;
```

3. Verifica la conexión:
```bash
mysql -u root -e "SELECT 1"
```

4. Ejecuta las migraciones:
```bash
npm run migrate:sql
```

### Opción 2: Usar contraseña 'root'

1. Conéctate a MySQL (puede requerir sudo):
```bash
sudo mysql -u root
```

2. Ejecuta:
```sql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';
FLUSH PRIVILEGES;
EXIT;
```

3. Actualiza `.env`:
```bash
DB_PASSWORD=root
DATABASE_URL="mysql://root:root@127.0.0.1:3306/medhome_visits"
```

4. Ejecuta migraciones:
```bash
npm run migrate:sql
```

### Opción 3: Modo seguro (si nada funciona)

1. Detén MySQL:
```bash
brew services stop mysql
```

2. Inicia en modo seguro:
```bash
sudo mysqld_safe --skip-grant-tables &
```

3. Conecta sin contraseña:
```bash
mysql -u root
```

4. Ejecuta:
```sql
USE mysql;
UPDATE user SET authentication_string='' WHERE User='root';
FLUSH PRIVILEGES;
EXIT;
```

5. Reinicia MySQL normalmente:
```bash
brew services start mysql
```

## Después de configurar

Una vez que MySQL acepte conexiones, ejecuta:

```bash
npm run migrate:sql
```

Esto creará la base de datos y las tablas necesarias.




