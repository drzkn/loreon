#!/bin/bash

# Script para ejecutar tests de producción localmente
# Uso: ./scripts/run-production-tests.sh [test-type] [environment]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
TEST_TYPE=${1:-"full"}  # full, health-only, performance-only
ENVIRONMENT=${2:-"local"}  # local, staging, production
BASE_URL=${3:-"http://localhost:3000"}

echo -e "${BLUE}🚀 Iniciando tests de producción${NC}"
echo -e "${BLUE}   Tipo de test: ${TEST_TYPE}${NC}"
echo -e "${BLUE}   Entorno: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}   URL base: ${BASE_URL}${NC}"
echo ""

# Verificar que el servidor esté corriendo
echo -e "${YELLOW}🔍 Verificando que el servidor esté disponible...${NC}"
if ! curl -s -f "${BASE_URL}" > /dev/null; then
    echo -e "${RED}❌ El servidor no está disponible en ${BASE_URL}${NC}"
    echo -e "${YELLOW}💡 Asegúrate de que la aplicación esté corriendo:${NC}"
    echo -e "   ${BLUE}yarn dev${NC} (para desarrollo)"
    echo -e "   ${BLUE}yarn build && yarn start${NC} (para producción)"
    exit 1
fi
echo -e "${GREEN}✅ Servidor disponible${NC}"

# Verificar variables de entorno
echo -e "${YELLOW}🔍 Verificando variables de entorno...${NC}"
MISSING_VARS=()

if [ -z "$NOTION_API_KEY" ]; then
    MISSING_VARS+=("NOTION_API_KEY")
fi

if [ -z "$NOTION_DATABASE_ID" ]; then
    MISSING_VARS+=("NOTION_DATABASE_ID")
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    MISSING_VARS+=("NEXT_PUBLIC_SUPABASE_URL")
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    MISSING_VARS+=("NEXT_PUBLIC_SUPABASE_ANON_KEY")
fi

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}❌ Variables de entorno faltantes: ${MISSING_VARS[*]}${NC}"
    echo -e "${YELLOW}💡 Configura las variables requeridas en tu .env${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Variables de entorno configuradas${NC}"

# Ejecutar health checks directos
echo -e "${YELLOW}🏥 Ejecutando health checks directos...${NC}"

echo "  📊 System Health:"
SYSTEM_HEALTH=$(curl -s "${BASE_URL}/api/health/system" || echo '{"status":"error"}')
SYSTEM_STATUS=$(echo "$SYSTEM_HEALTH" | jq -r '.status // "error"')
echo -e "     Status: ${SYSTEM_STATUS}"

echo "  🗄️ Database Health:"
DATABASE_HEALTH=$(curl -s "${BASE_URL}/api/health/database" || echo '{"tablesAccessible":false}')
DB_STATUS=$(echo "$DATABASE_HEALTH" | jq -r '.tablesAccessible // false')
echo -e "     Tables Accessible: ${DB_STATUS}"

echo "  🧠 Embeddings Health:"
EMBEDDINGS_HEALTH=$(curl -s -X POST "${BASE_URL}/api/health/embeddings" \
    -H "Content-Type: application/json" \
    -d '{"dryRun": true}' || echo '{"success":false}')
EMB_STATUS=$(echo "$EMBEDDINGS_HEALTH" | jq -r '.success // false')
echo -e "     Service Available: ${EMB_STATUS}"

# Instalar browsers de Playwright si no están instalados
if [ ! -d "$HOME/.cache/ms-playwright" ]; then
    echo -e "${YELLOW}🎭 Instalando browsers de Playwright...${NC}"
    yarn playwright install
fi

# Ejecutar tests según el tipo especificado
echo -e "${YELLOW}🧪 Ejecutando tests de Playwright...${NC}"

case $TEST_TYPE in
    "health-only")
        echo -e "${BLUE}   Ejecutando solo tests de health checks${NC}"
        yarn playwright test tests/e2e/production/production-health.spec.ts \
            --grep "Production Health Checks" \
            --reporter=line
        ;;
    "performance-only")
        echo -e "${BLUE}   Ejecutando solo tests de rendimiento${NC}"
        yarn playwright test tests/e2e/production/production-health.spec.ts \
            --grep "Production Performance Tests" \
            --reporter=line
        ;;
    "full")
        echo -e "${BLUE}   Ejecutando suite completa de tests${NC}"
        yarn playwright test tests/e2e/production/production-health.spec.ts \
            --reporter=line
        ;;
    *)
        echo -e "${RED}❌ Tipo de test inválido: ${TEST_TYPE}${NC}"
        echo -e "${YELLOW}💡 Tipos válidos: health-only, performance-only, full${NC}"
        exit 1
        ;;
esac

# Generar reporte de salud
echo -e "${YELLOW}📊 Generando reporte de salud...${NC}"
REPORT_FILE="health-report-$(date +%Y%m%d-%H%M%S).json"

cat > "$REPORT_FILE" <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "$ENVIRONMENT",
  "baseUrl": "$BASE_URL",
  "testType": "$TEST_TYPE",
  "healthChecks": {
    "system": $SYSTEM_HEALTH,
    "database": $DATABASE_HEALTH,
    "embeddings": $EMBEDDINGS_HEALTH
  }
}
EOF

echo -e "${GREEN}✅ Reporte guardado en: ${REPORT_FILE}${NC}"

# Mostrar resumen
echo ""
echo -e "${BLUE}📋 RESUMEN DE RESULTADOS${NC}"
echo -e "${BLUE}========================${NC}"

if [ "$SYSTEM_STATUS" = "healthy" ]; then
    echo -e "${GREEN}✅ Sistema: Saludable${NC}"
elif [ "$SYSTEM_STATUS" = "degraded" ]; then
    echo -e "${YELLOW}⚠️ Sistema: Degradado${NC}"
else
    echo -e "${RED}❌ Sistema: No saludable${NC}"
fi

if [ "$DB_STATUS" = "true" ]; then
    echo -e "${GREEN}✅ Base de datos: Accesible${NC}"
else
    echo -e "${RED}❌ Base de datos: No accesible${NC}"
fi

if [ "$EMB_STATUS" = "true" ]; then
    echo -e "${GREEN}✅ Embeddings: Funcional${NC}"
else
    echo -e "${RED}❌ Embeddings: No funcional${NC}"
fi

# Determinar código de salida
if [ "$SYSTEM_STATUS" = "healthy" ] && [ "$DB_STATUS" = "true" ] && [ "$EMB_STATUS" = "true" ]; then
    echo ""
    echo -e "${GREEN}🎉 Todos los checks pasaron exitosamente${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️ Algunos checks fallaron - revisar logs para más detalles${NC}"
    exit 1
fi
