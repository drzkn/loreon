import { vi } from 'vitest'

vi.mock('dotenv/config', () => ({}))

// Environment variables mocks
process.env.NOTION_DATABASE_ID = 'test-db-1,test-db-2'
process.env.NOTION_API_KEY = 'test-notion-key'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY = 'test-supabase-key'

// Global fetch mock   
global.fetch = vi.fn()
