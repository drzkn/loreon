# Git Hooks

## Pre-push Hook

Se ha configurado un hook de pre-push que ejecuta las siguientes verificaciones antes de permitir un push:

### 🚫 Protección de rama main

- **Bloquea pushes directos a main**: No se permite hacer push directamente a la rama main
- **Mensaje de error**: Se muestra un mensaje claro sugiriendo usar un pull request

### 🧪 Verificación de tests

- **Ejecuta todos los tests**: Corre `npm run test:coverage` antes del push
- **Bloquea si fallan**: Si algún test falla, se cancela el push
- **Salida completa**: Muestra todos los resultados de los tests

### 📊 Verificación de coverage

- **Mínimo requerido**: 80% de coverage en líneas, funciones, ramas y declaraciones
- **Configuración en vitest.config.ts**: Thresholds configurados para todas las métricas
- **Extracción automática**: Lee el porcentaje del output de vitest y del archivo JSON
- **Fallback robusto**: Múltiples métodos para verificar el coverage

### 📁 Archivos del hook

- **`.husky/pre-push`**: Script del hook
- **`package.json`**: Script `prepare` para inicializar husky
- **`vitest.config.ts`**: Configuración de thresholds de coverage

### 🎯 Uso

El hook se ejecuta automáticamente en cada `git push`. Para uso manual:

```bash
# Ejecutar tests con coverage
npm run test:coverage

# Verificar coverage actual
npm run test:coverage | grep "All files"
```

### 🔧 Configuración

Para modificar el porcentaje mínimo de coverage, edita `vitest.config.ts`:

```typescript
coverage: {
  thresholds: {
    lines: 80,        // Cambiar aquí
    functions: 80,    // Cambiar aquí
    branches: 80,     // Cambiar aquí
    statements: 80    // Cambiar aquí
  }
}
```

### 🚀 Desarrollo

Para desarrollar sin ejecutar el hook:

```bash
# Saltar el hook (NO recomendado)
git push --no-verify

# Mejor: trabajar en branch y crear PR
git checkout -b feature/nueva-funcionalidad
git push origin feature/nueva-funcionalidad
```

### 🐛 Resolución de problemas

Si el hook falla:

1. **Tests fallan**: Corrige los tests antes de hacer push
2. **Coverage bajo**: Agrega más tests para alcanzar el 80%
3. **Error de parsing**: Verifica que vitest esté configurado correctamente

### 📈 Coverage actual

El proyecto actual tiene **86.93%** de coverage, cumpliendo con el requisito del 80%.
