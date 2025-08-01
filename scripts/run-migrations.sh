#!/bin/bash

# ===========================================
# SCRIPT DE MIGRACIONES - SISTEMA JSON NATIVO
# ===========================================

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Banner
echo -e "${BLUE}"
echo "=========================================="
echo "🚀 MIGRACIÓN AL SISTEMA JSON NATIVO"
echo "=========================================="
echo -e "${NC}"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    log_error "Este script debe ejecutarse desde la raíz del proyecto"
    exit 1
fi

# Verificar que existen las migraciones
if [ ! -f "database/migrations/001_create_notion_native_tables.sql" ]; then
    log_error "No se encontró el archivo de migración 001_create_notion_native_tables.sql"
    exit 1
fi

if [ ! -f "database/migrations/002_add_vector_search_functions.sql" ]; then
    log_error "No se encontró el archivo de migración 002_add_vector_search_functions.sql"
    exit 1
fi

# Verificar variables de entorno
log_info "Verificando configuración..."

if [ -z "$SUPABASE_URL" ]; then
    log_warning "SUPABASE_URL no está configurada. Necesitarás configurarla manualmente."
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    log_warning "SUPABASE_ANON_KEY no está configurada. Necesitarás configurarla manualmente."
fi

# Función para extraer la URL de conexión directa
extract_db_url() {
    if [ ! -z "$SUPABASE_URL" ]; then
        PROJECT_ID=$(echo $SUPABASE_URL | sed 's/https:\/\///' | sed 's/\.supabase\.co//')
        DB_URL="postgresql://postgres.${PROJECT_ID}:${DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
        echo $DB_URL
    fi
}

# Mostrar información del proyecto
log_info "Configuración del proyecto:"
echo "  📁 Directorio: $(pwd)"
echo "  📊 Migraciones encontradas: 2"
echo "  🔗 Supabase URL: ${SUPABASE_URL:-'No configurada'}"

echo ""
log_info "Opciones de ejecución:"
echo "  1. Manual (copiar y pegar en Supabase SQL Editor)"
echo "  2. Automática (requiere configuración de DB_PASSWORD)"
echo "  3. Mostrar comandos psql"
echo ""

read -p "Selecciona una opción (1-3): " OPTION

case $OPTION in
    1)
        log_info "=== EJECUCIÓN MANUAL ==="
        echo ""
        log_info "Copia y pega estos archivos SQL en tu Supabase SQL Editor:"
        echo ""
        echo "1️⃣ PRIMERA MIGRACIÓN:"
        echo "   📁 Archivo: database/migrations/001_create_notion_native_tables.sql"
        echo "   📝 Descripción: Crea tablas principales y funciones básicas"
        echo ""
        echo "2️⃣ SEGUNDA MIGRACIÓN:"
        echo "   📁 Archivo: database/migrations/002_add_vector_search_functions.sql"
        echo "   📝 Descripción: Añade funciones avanzadas de búsqueda"
        echo ""
        log_warning "IMPORTANTE: Ejecuta las migraciones EN ORDEN (001 antes que 002)"
        echo ""
        log_info "Para abrir el SQL Editor de Supabase:"
        echo "   🔗 https://supabase.com/dashboard/project/[tu-project-id]/sql"
        ;;
        
    2)
        log_info "=== EJECUCIÓN AUTOMÁTICA ==="
        echo ""
        
        if [ -z "$DB_PASSWORD" ]; then
            log_warning "Necesitas configurar DB_PASSWORD para conectarte directamente"
            echo ""
            echo "Para obtener tu password de base de datos:"
            echo "1. Ve a Supabase Dashboard"
            echo "2. Settings > Database > Connection string"
            echo "3. Copia el password"
            echo ""
            read -s -p "Ingresa el password de la base de datos: " DB_PASSWORD
            echo ""
        fi
        
        DB_URL=$(extract_db_url)
        
        if [ -z "$DB_URL" ]; then
            log_error "No se pudo construir la URL de base de datos"
            log_info "Verifica que SUPABASE_URL esté configurada correctamente"
            exit 1
        fi
        
        log_info "Ejecutando migración 001..."
        if psql "$DB_URL" -f database/migrations/001_create_notion_native_tables.sql; then
            log_success "Migración 001 completada"
        else
            log_error "Error en migración 001"
            exit 1
        fi
        
        log_info "Ejecutando migración 002..."
        if psql "$DB_URL" -f database/migrations/002_add_vector_search_functions.sql; then
            log_success "Migración 002 completada"
        else
            log_error "Error en migración 002"
            exit 1
        fi
        
        log_success "¡Todas las migraciones completadas exitosamente!"
        ;;
        
    3)
        log_info "=== COMANDOS PSQL ==="
        echo ""
        log_info "Si tienes psql instalado y configurado, ejecuta:"
        echo ""
        echo "# Migración 001"
        echo "psql 'postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres' \\"
        echo "  -f database/migrations/001_create_notion_native_tables.sql"
        echo ""
        echo "# Migración 002"
        echo "psql 'postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres' \\"
        echo "  -f database/migrations/002_add_vector_search_functions.sql"
        echo ""
        log_warning "Reemplaza [password] y [project-id] con tus valores reales"
        ;;
        
    *)
        log_error "Opción inválida"
        exit 1
        ;;
esac

echo ""
log_info "=== PRÓXIMOS PASOS ==="
echo ""
echo "1️⃣ Verificar que las migraciones se ejecutaron correctamente"
echo "   npm run migration:api"
echo ""
echo "2️⃣ Configurar variables de entorno para activar el sistema nativo"
echo "   echo 'NEXT_PUBLIC_USE_NATIVE_JSON=true' >> .env.local"
echo ""
echo "3️⃣ Ejecutar tu primera migración de contenido"
echo "   npm run embeddings:native"
echo ""
echo "4️⃣ Verificar el visualizer con contenido JSON nativo"
echo "   npm run dev"
echo "   # Visita http://localhost:3000/visualizer"
echo ""

log_info "📚 Para más información, consulta: docs/ENVIRONMENT_VARIABLES.md"

log_success "Script completado. ¡Listo para el sistema JSON nativo! 🚀" 