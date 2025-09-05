# 🚀 Plan de Acción Inmediata - Inicio del Refactor

## ⚡ **Primeros Pasos (Esta Semana)**

### **🎯 Objetivo**: Establecer bases para arquitectura desacoplada sin romper funcionalidad existente

---

## 📋 **Tareas Prioritarias - Day 1**

### **1. Crear Estructura de Carpetas** (30 min)

```bash
mkdir -p src/application/{interfaces,services,usecases,commands,queries,handlers}
mkdir -p src/infrastructure/{database,external-apis,messaging,config}
mkdir -p src/presentation/{controllers,middleware,dto}
```

### **2. Crear Interfaces Core** (2 horas)

#### **2.1 Interface de NotionMigrationService**

```typescript
// src/application/interfaces/INotionMigrationService.ts
export interface INotionMigrationService {
  migratePage(pageId: string): Promise<MigrationResult>;
  getMigrationStats(): Promise<MigrationStats>;
}

export interface MigrationResult {
  success: boolean;
  pageId: string;
  blocksProcessed: number;
  embeddingsGenerated: number;
  errors: string[];
}

export interface MigrationStats {
  totalPages: number;
  successfulMigrations: number;
  failedMigrations: number;
  averageProcessingTime: number;
}
```

#### **2.2 Interface de AuthService**

```typescript
// src/application/interfaces/IAuthService.ts
export interface IAuthService {
  signInWithGoogle(): Promise<AuthResult>;
  getCurrentUser(): Promise<User | null>;
  signOut(): Promise<void>;
  hasTokensForProvider(provider: string): Promise<boolean>;
  getIntegrationToken(provider: string): Promise<string | null>;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}
```

#### **2.3 Interface de EmbeddingsService**

```typescript
// src/application/interfaces/IEmbeddingsService.ts
export interface IEmbeddingsService {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}
```

### **3. Expandir DI Container** (1 hora)

```typescript
// src/infrastructure/di/container.ts - AGREGAR
interface Container {
  // Existentes...
  notionRepository: NotionRepository;
  // ... otros existentes

  // NUEVOS - Agregar gradualmente
  notionMigrationService: INotionMigrationService;
  authService: IAuthService;
  embeddingsService: IEmbeddingsService;

  // Infraestructura
  logger: ILogger;
}

// Implementación temporal (mantener compatibilidad)
const createContainer = () => {
  // ... código existente

  // AGREGAR gradualmente
  const notionMigrationService = new NotionMigrationService(); // Temporal
  const authService = new AuthService(); // Temporal
  const embeddingsService = new EmbeddingsService(); // Temporal

  _container = {
    // ... existentes
    notionMigrationService,
    authService,
    embeddingsService,
  };
};
```

---

## 📋 **Tareas Prioritarias - Day 2-3**

### **4. Refactorizar NotionMigrationService** (4 horas)

#### **4.1 Crear versión nueva sin romper la existente**

```typescript
// src/application/services/NotionMigrationService.ts (NUEVA)
export class NotionMigrationService implements INotionMigrationService {
  constructor(
    private readonly notionNativeRepository?: INotionNativeRepository,
    private readonly embeddingsService?: IEmbeddingsService,
    private readonly logger?: ILogger
  ) {
    // Compatibilidad temporal - si no se inyectan, usar las versiones directas
    this.notionNativeRepository =
      notionNativeRepository || new NotionNativeRepository(supabase);
    this.embeddingsService = embeddingsService || new EmbeddingsService();
    this.logger = logger || console;
  }

  async migratePage(pageId: string): Promise<MigrationResult> {
    // Mover lógica del servicio existente aquí
    // Usar this.logger.info() en lugar de console.log
  }
}
```

#### **4.2 Mantener servicio existente como legacy**

```typescript
// src/services/notion/NotionMigrationService.ts (MARCAR COMO LEGACY)
/**
 * @deprecated Use src/application/services/NotionMigrationService instead
 * Will be removed in next major version
 */
export class NotionMigrationService {
  // Código existente sin cambios
}
```

### **5. Crear Logger Interface** (30 min)

```typescript
// src/application/interfaces/ILogger.ts
export interface ILogger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, error?: Error): void;
  debug(message: string, meta?: any): void;
}

// src/infrastructure/logging/ConsoleLogger.ts
export class ConsoleLogger implements ILogger {
  info(message: string, meta?: any): void {
    console.log(`ℹ️ [INFO] ${message}`, meta || "");
  }

  warn(message: string, meta?: any): void {
    console.warn(`⚠️ [WARN] ${message}`, meta || "");
  }

  error(message: string, error?: Error): void {
    console.error(`❌ [ERROR] ${message}`, error || "");
  }

  debug(message: string, meta?: any): void {
    console.debug(`🐛 [DEBUG] ${message}`, meta || "");
  }
}
```

---

## 📋 **Tareas Prioritarias - Day 4-5**

### **6. Crear Controller para API más problemática** (3 horas)

#### **6.1 SyncController para /api/sync-notion**

```typescript
// src/presentation/controllers/SyncController.ts
export class SyncController {
  constructor(
    private readonly notionMigrationService: INotionMigrationService,
    private readonly logger: ILogger
  ) {}

  async syncPages(request: SyncPagesRequest): Promise<SyncPagesResponse> {
    this.logger.info(
      `Iniciando sincronización de ${request.pageIds.length} páginas`
    );

    const results: PageSyncResult[] = [];
    let errors = 0;

    for (const pageId of request.pageIds) {
      try {
        const result = await this.notionMigrationService.migratePage(pageId);
        results.push({
          pageId,
          success: result.success,
          blocksProcessed: result.blocksProcessed,
        });

        if (!result.success) errors++;
      } catch (error) {
        errors++;
        this.logger.error(`Error en página ${pageId}`, error);
        results.push({
          pageId,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      success: errors === 0,
      totalProcessed: results.length,
      errors,
      results,
    };
  }
}
```

#### **6.2 Actualizar route para usar controller**

```typescript
// src/app/api/sync-notion/route.ts - MODIFICAR GRADUALMENTE
export async function POST(
  request: NextRequest
): Promise<NextResponse<SyncResponse>> {
  try {
    const body: SyncRequest = await request.json();

    // NUEVO: Usar controller si está disponible
    if (container.syncController) {
      const syncController = container.syncController;
      const response = await syncController.syncPages(body);
      return NextResponse.json(response);
    }

    // LEGACY: Mantener código existente como fallback
    const migrationService = new NotionMigrationService();
    // ... resto del código existente sin cambios
  } catch (error) {
    // Código existente sin cambios
  }
}
```

---

## ✅ **Criterios de Éxito - Semana 1**

### **Must Have** (Obligatorio)

- [ ] ✅ **Build funciona** - No se rompe nada existente
- [ ] ✅ **Tests pasan** - Todas las pruebas existentes funcionan
- [ ] ✅ **Interfaces creadas** - Base para desacoplamiento
- [ ] ✅ **DI expandido** - Container incluye nuevos servicios

### **Should Have** (Deseable)

- [ ] 🎯 **1 servicio refactorizado** - NotionMigrationService con interface
- [ ] 🎯 **1 controller creado** - SyncController funcional
- [ ] 🎯 **Logger implementado** - Logging consistente

### **Could Have** (Opcional)

- [ ] 💡 **Documentación actualizada** - Nuevos patrones explicados
- [ ] 💡 **Métricas básicas** - Tiempo de respuesta de APIs

---

## 🚨 **Precauciones y Rollback**

### **Estrategia de Seguridad**

1. **Branch dedicado**: `feature/backend-refactor`
2. **Commits pequeños**: Cada tarea = 1 commit
3. **Tests antes/después**: Verificar que todo funciona
4. **Compatibilidad**: Mantener código legacy hasta validar nuevo

### **Plan de Rollback**

```bash
# Si algo sale mal, rollback inmediato
git checkout main
git branch -D feature/backend-refactor

# O rollback parcial
git revert <commit-hash>
```

### **Validación Continua**

```bash
# Después de cada cambio
npm run build    # Verificar build
npm test         # Verificar tests
npm run lint     # Verificar estilo
```

---

## 🎯 **Siguiente Semana (Preview)**

### **Objetivos Semana 2**

- Refactorizar AuthService y EmbeddingsService
- Crear 2 controllers más (ChatController, AuthController)
- Implementar validation middleware
- Migrar 1-2 API routes completamente

### **Objetivos Semana 3**

- Eliminar código legacy
- Reorganizar estructura de carpetas
- Implementar error handling centralizado
- Métricas y logging avanzado

---

## 📞 **¿Necesitas Ayuda?**

### **Dudas Frecuentes**

1. **"¿Rompo algo existente?"** → No, mantén código legacy en paralelo
2. **"¿Por dónde empiezo?"** → Sigue el orden exacto de este plan
3. **"¿Tests fallan?"** → Revierte el último cambio y continúa
4. **"¿Demora mucho?"** → Cada tarea es 30min-4h máximo

### **Comandos de Emergencia**

```bash
# Verificar estado
git status
npm run build
npm test

# Rollback si es necesario
git stash
git checkout main
```

**¡Empezar hoy mismo con las tareas Day 1! El refactor será incremental y seguro.** 🚀
