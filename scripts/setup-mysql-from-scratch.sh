#!/bin/bash

# Script para configurar MySQL desde cero sin contraseña

echo "🔧 Configurando MySQL sin contraseña..."
echo ""
echo "Este script intentará configurar MySQL para desarrollo local."
echo ""

# Intentar conectar sin contraseña primero
if mysql -u root -e "SELECT 1" 2>/dev/null; then
    echo "✅ MySQL ya está configurado sin contraseña"
    exit 0
fi

echo "⚠️  MySQL requiere configuración. Opciones:"
echo ""
echo "1. Si tienes acceso sudo, ejecuta:"
echo "   sudo mysql -u root"
echo "   Luego dentro de MySQL:"
echo "     ALTER USER 'root'@'localhost' IDENTIFIED BY '';"
echo "     FLUSH PRIVILEGES;"
echo ""
echo "2. Si MySQL fue instalado por Homebrew y tiene contraseña temporal:"
echo "   Busca en: cat ~/.mysql_secret"
echo "   O en: cat /usr/local/var/mysql/*.err | grep 'temporary password'"
echo ""
echo "3. Si nada funciona, reinstala MySQL:"
echo "   brew services stop mysql"
echo "   brew uninstall mysql"
echo "   brew install mysql"
echo "   brew services start mysql"
echo "   mysql_secure_installation"
echo "   (Cuando pregunte por contraseña, presiona Enter para dejarla vacía)"




