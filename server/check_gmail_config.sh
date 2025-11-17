#!/bin/bash
echo "🔍 Verificando configuración de Gmail API..."
echo ""

if [ -f .env ]; then
    echo "📄 Archivo .env encontrado"
    echo ""
    
    if grep -q "GMAIL_CLIENT_ID=" .env && grep -q "GMAIL_CLIENT_ID=.*[^[:space:]]" .env; then
        CLIENT_ID=$(grep "^GMAIL_CLIENT_ID=" .env | cut -d '=' -f2-)
        if [ -n "$CLIENT_ID" ]; then
            echo "✅ GMAIL_CLIENT_ID configurado"
        else
            echo "⚠️  GMAIL_CLIENT_ID está vacío"
        fi
    else
        echo "❌ GMAIL_CLIENT_ID no configurado"
    fi
    
    if grep -q "GMAIL_CLIENT_SECRET=" .env && grep -q "GMAIL_CLIENT_SECRET=.*[^[:space:]]" .env; then
        CLIENT_SECRET=$(grep "^GMAIL_CLIENT_SECRET=" .env | cut -d '=' -f2-)
        if [ -n "$CLIENT_SECRET" ]; then
            echo "✅ GMAIL_CLIENT_SECRET configurado"
        else
            echo "⚠️  GMAIL_CLIENT_SECRET está vacío"
        fi
    else
        echo "❌ GMAIL_CLIENT_SECRET no configurado"
    fi
    
    if grep -q "GMAIL_REFRESH_TOKEN=" .env && grep -q "GMAIL_REFRESH_TOKEN=.*[^[:space:]]" .env; then
        REFRESH_TOKEN=$(grep "^GMAIL_REFRESH_TOKEN=" .env | cut -d '=' -f2-)
        if [ -n "$REFRESH_TOKEN" ]; then
            echo "✅ GMAIL_REFRESH_TOKEN configurado"
        else
            echo "⚠️  GMAIL_REFRESH_TOKEN está vacío"
        fi
    else
        echo "❌ GMAIL_REFRESH_TOKEN no configurado"
    fi
    
    if grep -q "GMAIL_USER=" .env && grep -q "GMAIL_USER=.*[^[:space:]]" .env; then
        GMAIL_USER=$(grep "^GMAIL_USER=" .env | cut -d '=' -f2-)
        if [ -n "$GMAIL_USER" ]; then
            echo "✅ GMAIL_USER configurado: $GMAIL_USER"
        else
            echo "⚠️  GMAIL_USER está vacío"
        fi
    else
        echo "❌ GMAIL_USER no configurado"
    fi
    
    echo ""
    echo "📋 Para configurar Gmail API, sigue estos pasos:"
    echo "   1. Ve a: https://console.cloud.google.com/"
    echo "   2. Crea un proyecto"
    echo "   3. Habilita Gmail API"
    echo "   4. Crea credenciales OAuth2"
    echo "   5. Obtén refresh token"
    echo "   6. Configura en .env"
    echo ""
    echo "💡 Ver: PASOS_GMAIL_API.md para instrucciones detalladas"
else
    echo "❌ Archivo .env no encontrado"
    echo "💡 Crea el archivo .env en server/"
fi
