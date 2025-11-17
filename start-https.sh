#!/bin/bash

# Script para iniciar ngrok y crear túnel HTTPS
# No modifica el código, solo crea un túnel seguro

echo "🔒 Iniciando túnel HTTPS con ngrok..."
echo ""

# Verificar que ngrok esté instalado
if ! command -v ngrok &> /dev/null; then
    echo "❌ ERROR: ngrok no está instalado"
    echo "   Instala con: brew install ngrok/ngrok/ngrok"
    exit 1
fi

# Verificar que el servidor esté corriendo
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ ERROR: El servidor Next.js no está corriendo en el puerto 3000"
    echo "   Ejecuta primero: npm run dev"
    exit 1
fi

echo "✅ Servidor detectado en puerto 3000"
echo ""

# Verificar configuración de ngrok
if ! ngrok config check &> /dev/null; then
    echo "⚠️  ngrok no está configurado"
    echo ""
    echo "Para configurar ngrok:"
    echo "1. Crea una cuenta en https://ngrok.com (es gratis)"
    echo "2. Obtén tu authtoken desde https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "3. Ejecuta: ngrok config add-authtoken TU_TOKEN_AQUI"
    echo ""
    echo "O si prefieres usar ngrok sin cuenta (limitado):"
    echo "   ngrok http 3000 --domain=TU_DOMINIO_GRATIS"
    exit 1
fi

echo "✅ ngrok configurado correctamente"
echo ""
echo "🚀 Iniciando túnel HTTPS..."
echo "📋 La URL HTTPS aparecerá abajo"
echo "📱 Usa esa URL en tu móvil para acceder con HTTPS"
echo ""
echo "💡 Para detener ngrok: Ctrl+C o pkill ngrok"
echo ""

# Iniciar ngrok en el puerto 3000
ngrok http 3000

