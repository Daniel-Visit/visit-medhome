#!/bin/bash

# Script para resetear contraseña de MySQL o configurarla sin contraseña

echo "🔧 Configurando MySQL sin contraseña para desarrollo..."
echo ""
echo "Este script intentará resetear la contraseña de root a vacía."
echo "Si MySQL requiere autenticación, necesitarás ejecutar esto manualmente."
echo ""
echo "Opción 1: Si puedes acceder a MySQL con contraseña actual:"
echo "  mysql -u root -p"
echo "  Luego ejecuta:"
echo "    ALTER USER 'root'@'localhost' IDENTIFIED BY '';"
echo "    FLUSH PRIVILEGES;"
echo ""
echo "Opción 2: Si MySQL está en modo seguro (safe mode):"
echo "  1. Detén MySQL: brew services stop mysql"
echo "  2. Inicia en modo seguro: mysqld_safe --skip-grant-tables &"
echo "  3. Conecta: mysql -u root"
echo "  4. Ejecuta:"
echo "     USE mysql;"
echo "     UPDATE user SET authentication_string='' WHERE User='root';"
echo "     FLUSH PRIVILEGES;"
echo "  5. Reinicia MySQL normalmente"
echo ""
echo "Opción 3: Si prefieres usar contraseña 'root':"
echo "  mysql -u root -p"
echo "  ALTER USER 'root'@'localhost' IDENTIFIED BY 'root';"
echo "  FLUSH PRIVILEGES;"
echo ""
echo "Luego actualiza .env con:"
echo "  DB_PASSWORD=root"
echo "  DATABASE_URL=\"mysql://root:root@127.0.0.1:3306/medhome_visits\""




