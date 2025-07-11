import type { Preview } from '@storybook/nextjs'
import '../src/app/globals.css'

// Flag para evitar cargar las fuentes múltiples veces
let fontsLoaded = false

// Importar las fuentes de Google Fonts
const loadFonts = () => {
  if (fontsLoaded || typeof window === 'undefined') return

  // Verificar si las fuentes ya están cargadas
  const existingGeistSans = document.querySelector('link[href*="Geist:wght"]')
  const existingGeistMono = document.querySelector('link[href*="Geist+Mono:wght"]')

  if (!existingGeistSans) {
    const geistSansLink = document.createElement('link')
    geistSansLink.href = 'https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap'
    geistSansLink.rel = 'stylesheet'
    geistSansLink.crossOrigin = 'anonymous'
    document.head.appendChild(geistSansLink)
  }

  if (!existingGeistMono) {
    const geistMonoLink = document.createElement('link')
    geistMonoLink.href = 'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&display=swap'
    geistMonoLink.rel = 'stylesheet'
    geistMonoLink.crossOrigin = 'anonymous'
    document.head.appendChild(geistMonoLink)
  }

  // Configurar las variables CSS para las fuentes
  const root = document.documentElement
  root.style.setProperty('--font-geist-sans', 'Geist, ui-sans-serif, system-ui, sans-serif')
  root.style.setProperty('--font-geist-mono', '"Geist Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace')

  // Aplicar la fuente al body
  document.body.style.fontFamily = 'var(--font-geist-sans)'
  document.body.classList.add('antialiased')

  fontsLoaded = true
}

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#1a1a1a',
        },
        {
          name: 'darker',
          value: '#0d1117',
        },
        {
          name: 'charcoal',
          value: '#2d3748',
        },
        {
          name: 'light',
          value: '#ffffff',
        },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
  },
  decorators: [
    (Story) => {
      // Cargar fuentes cuando se renderiza la historia
      loadFonts()

      return Story()
    },
  ],
  globalTypes: {
    fontFamily: {
      name: 'Font Family',
      description: 'Choose font family for stories',
      defaultValue: 'geist-sans',
      toolbar: {
        icon: 'type',
        items: [
          { value: 'geist-sans', title: 'Geist Sans' },
          { value: 'geist-mono', title: 'Geist Mono' },
          { value: 'system', title: 'System Font' },
        ],
        showName: true,
      },
    },
  },
};

export default preview;