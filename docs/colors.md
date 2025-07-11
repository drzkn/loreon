# 🎨 Sistema de Colores - Loreon

Este documento describe el sistema de colores global del proyecto Loreon, diseñado para mantener consistencia y facilitar el desarrollo.

## 📋 Tabla de Contenidos

1. [Uso con Tailwind CSS](#uso-con-tailwind-css)
2. [Uso con Variables CSS](#uso-con-variables-css)
3. [Paleta de Colores](#paleta-de-colores)
4. [Ejemplos de Uso](#ejemplos-de-uso)
5. [Migración de Colores Existentes](#migración-de-colores-existentes)

## 🚀 Uso con Tailwind CSS

### Colores Principales

```jsx
// Colores del tema Realm
<div className="bg-realm-bg-primary text-realm-text-primary">
<div className="bg-realm-glass-light border-glass">
<div className="text-realm-primary-500">

// Colores con variaciones
<div className="bg-realm-primary-500 hover:bg-realm-primary-600">
<div className="text-realm-secondary-400">
```

### Colores Semánticos

```jsx
// Éxito
<div className="bg-success-500 text-success-50">
<div className="border-success-glass">

// Advertencia
<div className="bg-warning-500 text-warning-50">
<div className="border-warning-glass">

// Error
<div className="bg-error-500 text-error-50">
<div className="border-error-glass">

// Información
<div className="bg-info-500 text-info-50">
<div className="border-info-glass">
```

### Gradientes

```jsx
// Gradientes de fondo
<div className="bg-gradient-primary">
<div className="bg-gradient-purple">
<div className="bg-gradient-blue">
<div className="bg-gradient-green">
<div className="bg-gradient-orange">
```

## 🎯 Uso con Variables CSS

### En CSS Modules

```css
.container {
  background: var(--glass-light);
  border: 1px solid var(--border-glass);
  color: var(--text-primary);
}

.success-button {
  background: var(--success-500);
  color: var(--success-50);
}

.gradient-title {
  background: var(--gradient-purple);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### En Styled Components o Inline Styles

```jsx
// Styled Components
const Container = styled.div`
  background: var(--glass-light);
  border: 1px solid var(--border-glass);
  color: var(--text-primary);
`;

// Inline styles
<div style={{
  background: 'var(--glass-light)',
  border: '1px solid var(--border-glass)',
  color: 'var(--text-primary)'
}}>
```

## 🎨 Paleta de Colores

### Colores del Tema Principal (Realm)

#### Fondos

- `--bg-primary`: #0B0F1A (Fondo principal)
- `--bg-secondary`: #0a0a0a (Fondo secundario)
- `--bg-tertiary`: #1a1a1a (Fondo terciario)
- `--bg-gradient`: Gradiente principal del body

#### Efectos de Cristal

- `--glass-light`: rgba(255, 255, 255, 0.1)
- `--glass-medium`: rgba(255, 255, 255, 0.15)
- `--glass-dark`: rgba(30, 42, 63, 0.6)
- `--glass-darker`: rgba(0, 0, 0, 0.3)
- `--glass-black`: rgba(0, 0, 0, 0.9)

#### Colores Primarios (Cian)

- `--primary-50` hasta `--primary-900`: Escala completa de #00CFFF

#### Colores Secundarios (Morado)

- `--secondary-50` hasta `--secondary-900`: Escala completa de #6B2FFF

#### Texto

- `--text-primary`: #FFFFFF (Texto principal)
- `--text-secondary`: #C4CADC (Texto secundario)
- `--text-muted`: #6b7280 (Texto apagado)
- `--text-disabled`: rgba(255, 255, 255, 0.5)

### Colores Semánticos

#### Éxito (Verde)

- `--success-500`: #10b981 (Color principal)
- `--success-50` hasta `--success-900`: Escala completa

#### Advertencia (Naranja)

- `--warning-500`: #f59e0b (Color principal)
- `--warning-50` hasta `--warning-900`: Escala completa

#### Error (Rojo)

- `--error-500`: #ef4444 (Color principal)
- `--error-50` hasta `--error-900`: Escala completa

#### Información (Azul)

- `--info-500`: #3b82f6 (Color principal)
- `--info-50` hasta `--info-900`: Escala completa

### Colores Específicos

#### Terminal

- `--terminal-bg`: rgba(0, 0, 0, 0.9)
- `--terminal-text`: #00ff00
- `--terminal-error`: #ef4444
- `--terminal-success`: #10b981
- `--terminal-info`: #3b82f6
- `--terminal-warning`: #f59e0b

#### Navegación

- `--nav-bg`: rgba(255, 255, 255, 0.1)
- `--nav-hover`: rgba(255, 255, 255, 0.15)
- `--nav-active`: rgba(16, 185, 129, 0.2)
- `--nav-border`: rgba(255, 255, 255, 0.2)
- `--nav-active-border`: rgba(16, 185, 129, 0.4)

## 📝 Ejemplos de Uso

### Componente Card

```jsx
// Antes
<div style={{
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.1)'
}}>

// Después
<div className="bg-realm-glass-light border-glass">
// O con CSS variables
<div style={{
  background: 'var(--glass-light)',
  border: '1px solid var(--border-glass)'
}}>
```

### Botón de Éxito

```jsx
// Antes
<button style={{
  background: '#10b981',
  color: 'white'
}}>

// Después
<button className="bg-success-500 text-success-50 hover:bg-success-600">
// O con CSS variables
<button style={{
  background: 'var(--success-500)',
  color: 'var(--success-50)'
}}>
```

### Título con Gradiente

```jsx
// Antes
<h1 style={{
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent'
}}>

// Después
<h1 className="gradient-text-purple">
// O con CSS variables
<h1 style={{
  background: 'var(--gradient-purple)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent'
}}>
```

## 🔄 Migración de Colores Existentes

### Reemplazos Comunes

| Color Anterior              | Nuevo Color                                    |
| --------------------------- | ---------------------------------------------- |
| `#10b981`                   | `var(--success-500)` o `success-500`           |
| `#f59e0b`                   | `var(--warning-500)` o `warning-500`           |
| `#ef4444`                   | `var(--error-500)` o `error-500`               |
| `#3b82f6`                   | `var(--info-500)` o `info-500`                 |
| `rgba(255, 255, 255, 0.1)`  | `var(--glass-light)` o `realm-glass-light`     |
| `rgba(255, 255, 255, 0.15)` | `var(--glass-medium)` o `realm-glass-medium`   |
| `#00CFFF`                   | `var(--primary-500)` o `realm-primary-500`     |
| `#6B2FFF`                   | `var(--secondary-500)` o `realm-secondary-500` |

### Clases Utilitarias Disponibles

```css
/* Efectos de cristal */
.glass-effect {
  /* Efecto de cristal básico */
}
.glass-effect-medium {
  /* Efecto de cristal medio */
}
.glass-effect-dark {
  /* Efecto de cristal oscuro */
}

/* Gradientes de texto */
.gradient-text-purple {
  /* Texto con gradiente morado */
}
.gradient-text-blue {
  /* Texto con gradiente azul */
}
.gradient-text-green {
  /* Texto con gradiente verde */
}
.gradient-text-orange {
  /* Texto con gradiente naranja */
}
.gradient-text-primary {
  /* Texto con gradiente primario */
}
```

## 🚀 Beneficios del Sistema

1. **Consistencia**: Todos los colores están centralizados
2. **Mantenibilidad**: Cambios globales desde un solo lugar
3. **Accesibilidad**: Escalas de color bien definidas
4. **Flexibilidad**: Funciona con Tailwind CSS y CSS variables
5. **Documentación**: Cada color tiene un propósito claro
6. **Rendimiento**: Menor CSS duplicado

## 📌 Mejores Prácticas

1. **Usa colores semánticos**: Prefiere `success-500` sobre colores específicos
2. **Mantén consistencia**: Usa el mismo color para la misma función
3. **Escala apropiada**: Usa variaciones (50, 100, 200, etc.) para hover/focus
4. **Efectos de cristal**: Usa las variables `--glass-*` para elementos overlay
5. **Gradientes**: Usa las variables predefinidas para gradientes consistentes

---

¿Necesitas ayuda con la migración o tienes preguntas sobre el sistema de colores? ¡Consulta este documento como referencia!
