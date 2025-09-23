#!/bin/bash

# 🧪 Script para simular GitHub Actions localmente
# Este script replica exactamente los pasos del workflow de Playwright

set -e  # Salir si algún comando falla

echo "🚀 Simulando GitHub Actions - Playwright Tests"
echo "=============================================="

# Simular variables de entorno de CI
export CI=true
export NODE_ENV=test

echo "📋 Variables de entorno configuradas:"
echo "CI=$CI"
echo "NODE_ENV=$NODE_ENV"
echo ""

# Paso 1: Limpiar dependencias (simular fresh install)
echo "🧹 Limpiando node_modules..."
rm -rf node_modules
rm -f yarn.lock

# Paso 2: Instalar dependencias (como en CI)
echo "📦 Instalando dependencias..."
yarn install --frozen-lockfile

# Paso 3: Instalar navegadores de Playwright
echo "🌐 Instalando navegadores de Playwright..."
npx playwright install --with-deps

# Paso 4: Verificar configuración
echo "🔍 Verificando configuración de Playwright..."
npx playwright --version

# Paso 5: Ejecutar tests (exactamente como en CI)
echo "🎭 Ejecutando tests de Playwright..."
npx playwright test

echo ""
echo "✅ ¡Tests completados exitosamente!"
echo "📊 Los reportes están disponibles en:"
echo "   - playwright-report/ (HTML)"
echo "   - test-results/ (Screenshots, videos, traces)"
