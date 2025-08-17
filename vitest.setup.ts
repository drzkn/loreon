import { vi } from 'vitest'
import '@testing-library/jest-dom'

vi.mock('dotenv/config', () => ({}))

// Mock CSS imports
vi.mock('*.css', () => ({}))
vi.mock('*.module.css', () => ({}))

// Environment variables mocks
process.env.NOTION_DATABASE_ID = 'test-db-1,test-db-2'
process.env.NOTION_API_KEY = 'test-notion-key'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY = 'test-supabase-key'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-supabase-key'

// Global fetch mock   
global.fetch = vi.fn()

// Global console mock setup (can be overridden in specific tests)
vi.spyOn(console, 'log').mockImplementation(() => { })
vi.spyOn(console, 'error').mockImplementation(() => { })
vi.spyOn(console, 'warn').mockImplementation(() => { })

// Testing Library setup for React components (jsdom environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock window.alert for tests
  Object.defineProperty(window, 'alert', {
    writable: true,
    value: vi.fn(),
  })
}
