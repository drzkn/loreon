# 🚀 Configuración Monorepo Loreon

## Configuración Multiplataforma con Turborepo + Tamagui + Solito

Esta documentación detalla la configuración completa para convertir Loreon en una aplicación multiplataforma usando las mejores herramientas del ecosistema.

## 📋 Arquitectura del Monorepo

```
loreon-monorepo/
├── apps/
│   ├── web/              # Aplicación Next.js (Web)
│   ├── app/              # Aplicación Expo (iOS/Android)
│   └── docs/             # Documentación Storybook
├── packages/
│   ├── tamagui-ui/       # Componentes UI compartidos
│   ├── solito-navigation/ # Navegación multiplataforma
│   ├── ui/               # Componentes base (Turborepo)
│   ├── eslint-config/    # Configuración ESLint
│   └── typescript-config/ # Configuración TypeScript
├── package.json          # Configuración del workspace
└── turbo.json           # Configuración Turborepo
```

## ✅ Progreso Actual

### 🎯 **Completado:**

- ✅ Estructura base del monorepo con Turborepo
- ✅ Aplicación Expo creada (`apps/app`)
- ✅ Paquete de componentes UI con Tamagui (`packages/tamagui-ui`)
- ✅ Paquete de navegación con Solito (`packages/solito-navigation`)
- ✅ Configuración de temas personalizados de Tamagui
- ✅ Componente Card migrado a Tamagui
- ✅ Sistema de colores integrado

### 📦 **Paquetes Configurados:**

#### `@loreon/tamagui-ui`

- Componentes UI que funcionan en web y móvil
- Configuración de temas personalizada
- Sistema de colores del proyecto integrado
- Componente Card con variantes glass/solid

#### `@loreon/solito-navigation`

- Navegación unificada entre web y móvil
- Definición de rutas tipadas
- Pantallas base configuradas

## 🔧 Pasos para Completar la Configuración

### 1. **Migrar el Código Existente**

```bash
# Copiar el código del proyecto original
cp -r ../loreon/src/* apps/web/src/
cp -r ../loreon/public/* apps/web/public/
cp ../loreon/package.json apps/web/package.json
cp ../loreon/next.config.ts apps/web/next.config.ts
cp ../loreon/tailwind.config.js apps/web/tailwind.config.js
```

### 2. **Configurar la Aplicación Web**

```bash
cd apps/web
# Instalar dependencias específicas de web
npm install @loreon/tamagui-ui @loreon/solito-navigation
npm install @tamagui/next-plugin @tamagui/babel-plugin

# Configurar Next.js con Tamagui
# Editar next.config.ts para incluir el plugin de Tamagui
```

### 3. **Configurar la Aplicación Móvil**

```bash
cd apps/app
# Instalar dependencias específicas de móvil
npm install @loreon/tamagui-ui @loreon/solito-navigation
npm install @tamagui/babel-plugin
npm install react-native-screens react-native-safe-area-context

# Para iOS
cd ios && pod install

# Para Android - configurar en android/app/src/main/java/
```

### 4. **Configurar Tamagui Provider**

#### En `apps/web/src/app/layout.tsx`:

```tsx
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '@loreon/tamagui-ui';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='es'>
      <body>
        <TamaguiProvider config={tamaguiConfig}>{children}</TamaguiProvider>
      </body>
    </html>
  );
}
```

#### En `apps/app/App.tsx`:

```tsx
import { TamaguiProvider } from '@tamagui/core';
import { tamaguiConfig } from '@loreon/tamagui-ui';
import { NavigationProvider } from '@loreon/solito-navigation';

export default function App() {
  return (
    <TamaguiProvider config={tamaguiConfig}>
      <NavigationProvider>{/* Tu aplicación */}</NavigationProvider>
    </TamaguiProvider>
  );
}
```

### 5. **Configurar Solito para Navegación**

#### En `apps/web/src/app/page.tsx`:

```tsx
import { HomeScreen } from '@loreon/solito-navigation';

export default function HomePage() {
  return <HomeScreen />;
}
```

#### En `apps/app/App.tsx`:

```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@loreon/solito-navigation';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name='Home' component={HomeScreen} />
      <Stack.Screen name='Settings' component={SettingsScreen} />
      {/* Más pantallas */}
    </Stack.Navigator>
  );
}
```

### 6. **Migrar Componentes Existentes**

```bash
# Migrar componentes uno por uno a Tamagui
# Ejemplo: Card, Navigation, Terminal, etc.

# En packages/tamagui-ui/src/components/
# - Card.tsx ✅ (Ya migrado)
# - Navigation.tsx (Por migrar)
# - Terminal.tsx (Por migrar)
# - PageHeader.tsx (Por migrar)
```

### 7. **Configurar Scripts de Desarrollo**

```json
// En package.json raíz
{
  "scripts": {
    "dev": "turbo run dev",
    "dev:web": "turbo run dev --filter=web",
    "dev:app": "turbo run dev --filter=app",
    "dev:all": "turbo run dev --parallel",
    "build": "turbo run build",
    "build:web": "turbo run build --filter=web",
    "build:app": "turbo run build --filter=app",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check"
  }
}
```

## 🎯 Beneficios de esta Arquitectura

### 🔄 **Reutilización de Código**

- 90% del código compartido entre web y móvil
- Componentes UI unificados
- Lógica de negocio centralizada

### 🚀 **Rendimiento**

- Tamagui: componentes optimizados y compilados
- Solito: navegación eficiente
- Turborepo: builds incrementales

### 🛠️ **Mantenibilidad**

- Tipado estricto con TypeScript
- Lint y format consistentes
- Arquitectura modular y escalable

### 📱 **Multiplataforma**

- Web: Next.js con SSR/SSG
- iOS/Android: Expo con compilación nativa
- Código compartido al máximo

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Todas las apps
npm run dev:web          # Solo web
npm run dev:app          # Solo móvil

# Build
npm run build            # Todas las apps
npm run build:web        # Solo web
npm run build:app        # Solo móvil

# Instalar dependencias
npm install              # Instala en todo el monorepo
npm install --filter=web # Solo en web
npm install --filter=app # Solo en móvil

# Agregar dependencias
npm install react-hook-form --workspace=@loreon/tamagui-ui
```

## 📚 Recursos Útiles

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Tamagui Documentation](https://tamagui.dev/)
- [Solito Documentation](https://solito.dev/)
- [Expo Documentation](https://docs.expo.dev/)

## 🎯 Próximos Pasos Inmediatos

1. **Migrar la aplicación web** al monorepo
2. **Configurar Tamagui** en ambas plataformas
3. **Migrar componentes** uno por uno
4. **Configurar navegación** con Solito
5. **Configurar builds** y CI/CD

## 📝 Notas Importantes

- Usar `$` para tokens de Tamagui (ej: `$primary`, `$4`)
- Solito maneja automáticamente las diferencias de navegación
- Turborepo cachea los builds para acelerar el desarrollo
- Expo permite compilar para las stores sin configuración adicional

¿Necesitas ayuda con algún paso específico? ¡Estoy aquí para ayudarte! 🚀
