#!/bin/bash

echo "🚀 Migrando aplicación web al monorepo..."

# Limpiar directorio de destino
echo "🧹 Limpiando directorio web..."
rm -rf apps/web/src
rm -rf apps/web/public
rm -f apps/web/package.json
rm -f apps/web/next.config.ts
rm -f apps/web/tailwind.config.js
rm -f apps/web/tsconfig.json
rm -f apps/web/.env*

# Copiar código fuente
echo "📁 Copiando código fuente..."
cp -r ../loreon/src apps/web/
cp -r ../loreon/public apps/web/

# Copiar archivos de configuración
echo "⚙️ Copiando configuraciones..."
cp ../loreon/next.config.ts apps/web/
cp ../loreon/tailwind.config.js apps/web/
cp ../loreon/tsconfig.json apps/web/
cp ../loreon/postcss.config.js apps/web/
cp ../loreon/.env apps/web/ 2>/dev/null || echo "No .env file found"

# Crear nuevo package.json para la app web
echo "📦 Creando package.json para web..."
cat > apps/web/package.json << 'EOF'
{
  "name": "@loreon/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "@loreon/tamagui-ui": "*",
    "@loreon/solito-navigation": "*",
    "@supabase/supabase-js": "^2.50.2",
    "@tamagui/core": "^1.103.18",
    "@tamagui/next-plugin": "^1.103.18",
    "@tamagui/babel-plugin": "^1.103.18",
    "solito": "^4.1.0",
    "axios": "^1.10.0",
    "dotenv": "^17.0.0",
    "next": "15.3.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "supabase": "^2.26.9",
    "tailwindcss": "^4.1.11",
    "autoprefixer": "^10.4.21"
  },
  "devDependencies": {
    "@chromatic-com/storybook": "^4.0.1",
    "@eslint/eslintrc": "^3",
    "@storybook/addon-a11y": "^9.0.14",
    "@storybook/addon-docs": "^9.0.14",
    "@storybook/addon-onboarding": "^9.0.14",
    "@storybook/addon-vitest": "^9.0.14",
    "@storybook/nextjs": "^9.0.14",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitest/browser": "^3.2.4",
    "@vitest/coverage-v8": "^3.2.4",
    "@vitest/ui": "3.2.4",
    "eslint": "^9",
    "eslint-config-next": "15.3.4",
    "eslint-config-prettier": "^10.1.5",
    "eslint-plugin-prettier": "^5.5.1",
    "eslint-plugin-storybook": "^9.0.14",
    "husky": "^9.1.7",
    "jsdom": "^26.1.0",
    "playwright": "^1.53.1",
    "postcss-cli": "^11.0.1",
    "prettier": "^3.6.2",
    "typescript": "^5",
    "vite": "^6.3.5",
    "vitest": "^3.2.4"
  }
}
EOF

# Copiar archivos de configuración adicionales
echo "📄 Copiando configuraciones adicionales..."
cp ../loreon/.prettierrc apps/web/ 2>/dev/null || echo "No .prettierrc found"
cp ../loreon/.prettierignore apps/web/ 2>/dev/null || echo "No .prettierignore found"
cp ../loreon/vitest.config.ts apps/web/ 2>/dev/null || echo "No vitest.config.ts found"
cp ../loreon/vitest.setup.ts apps/web/ 2>/dev/null || echo "No vitest.setup.ts found"

# Crear directorio .storybook si existe en el original
if [ -d "../loreon/.storybook" ]; then
    echo "📚 Copiando configuración de Storybook..."
    cp -r ../loreon/.storybook apps/web/
fi

# Crear directorio .vscode si existe en el original
if [ -d "../loreon/.vscode" ]; then
    echo "⚙️ Copiando configuración de VS Code..."
    cp -r ../loreon/.vscode apps/web/
fi

echo "✅ Migración de aplicación web completada!"
echo "📁 Archivos copiados a: apps/web/"
echo ""
echo "🔧 Próximos pasos:"
echo "1. cd apps/web && npm install"
echo "2. Configurar Tamagui Provider en layout.tsx"
echo "3. Migrar componentes a usar @loreon/tamagui-ui"
echo "4. Configurar navegación con Solito" 