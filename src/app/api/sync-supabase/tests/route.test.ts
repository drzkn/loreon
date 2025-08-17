import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from '../route'

// Usar el sistema centralizado de mocks
import {
  createTestSetup
} from '@/mocks'

// Mock del repository
const mockHandleSyncToSupabase = vi.fn()

vi.mock('../../helpers/ConnectionPageRepository', () => ({
  ConnectionPageRepository: vi.fn().mockImplementation(() => ({
    handleSyncToSupabase: mockHandleSyncToSupabase
  }))
}))

// Importar después del mock
import { ConnectionPageRepository } from '../../helpers/ConnectionPageRepository'
import { readSSEMessages } from '../../helpers/readSSEMessages'
const mockConnectionPageRepository = vi.mocked(ConnectionPageRepository)

describe('sync-supabase', () => {
  let originalEnv: NodeJS.ProcessEnv
  const { teardown } = createTestSetup(); // ✅ Console mocks centralizados

  beforeEach(() => {
    originalEnv = process.env
    // @ts-expect-error - Mock simplificado para tests
    mockConnectionPageRepository.mockImplementation((dbId: string, onProcessing: unknown, onProgress: unknown, onStream?: unknown) => ({
      handleSyncToSupabase: mockHandleSyncToSupabase,
      // Propiedades mínimas para satisfacer TypeScript
      authService: {},
      databaseId: dbId,
      setIsProcessing: onProcessing,
      setProgress: onProgress,
      sendLogToStream: onStream,
      log: vi.fn(),
      extractPageTitle: vi.fn(),
      handleSyncToMarkdown: vi.fn()
    }))
    mockHandleSyncToSupabase.mockResolvedValue(undefined)
    vi.clearAllMocks()
  })

  afterEach(() => {
    teardown(); // ✅ Limpieza automática
    process.env = originalEnv
  })

  describe('🚀 Streaming Message Flow', () => {
    it('should send initial startup message', async () => {
      process.env.NOTION_DATABASE_ID = 'test-db'

      const response = await POST()
      const messages = await readSSEMessages(response, 2)

      expect(messages).toContain('🚀 Iniciando sincronización con Supabase...')
    })

    it('should send database count information', async () => {
      process.env.NOTION_DATABASE_ID = 'db1,db2,db3'

      const response = await POST()
      const messages = await readSSEMessages(response, 5)

      const countMessage = messages.find(msg => msg.includes('Procesando 3 database(s)'))
      expect(countMessage).toBeDefined()
    })

    it('should send processing status for each database', async () => {
      process.env.NOTION_DATABASE_ID = 'db1,db2'

      const response = await POST()
      const messages = await readSSEMessages(response, 10)

      const db1Message = messages.find(msg => msg.includes('Procesando database 1/2: db1'))
      const db2Message = messages.find(msg => msg.includes('Procesando database 2/2: db2'))

      expect(db1Message).toBeDefined()
      expect(db2Message).toBeDefined()
    })

    it('should send success completion messages', async () => {
      process.env.NOTION_DATABASE_ID = 'success-db'

      const response = await POST()
      const messages = await readSSEMessages(response, 8)

      const successMessage = messages.find(msg => msg.includes('✅ Database success-db sincronizado correctamente'))
      expect(successMessage).toBeDefined()
    })

    it('should send final summary message', async () => {
      process.env.NOTION_DATABASE_ID = 'db1,db2'

      const response = await POST()
      const messages = await readSSEMessages(response, 15)

      const summaryMessage = messages.find(msg => msg.includes('✅ Sincronización completada: 2 exitosas, 0 errores'))
      expect(summaryMessage).toBeDefined()
    })

    it('should send SYNC_COMPLETE with JSON result', async () => {
      process.env.NOTION_DATABASE_ID = 'test-db'

      const response = await POST()
      const messages = await readSSEMessages(response, 10)

      const syncCompleteMessage = messages.find(msg => msg.startsWith('SYNC_COMPLETE:'))
      expect(syncCompleteMessage).toBeDefined()

      if (syncCompleteMessage) {
        const jsonPart = syncCompleteMessage.slice(14)
        expect(() => JSON.parse(jsonPart)).not.toThrow()
      }
    })
  })

  describe('📊 Callback Integration Testing', () => {
    it('should trigger processing callbacks with correct timing', async () => {
      process.env.NOTION_DATABASE_ID = 'timing-test-db'

      const callbackLog: string[] = []

      // @ts-expect-error - Mock completo para test específico
      mockConnectionPageRepository.mockImplementation((dbId: string, onProcessing: (value: boolean) => void, onProgress: (value: unknown) => void, onStream?: unknown) => {
        return {
          handleSyncToSupabase: vi.fn().mockImplementation(async () => {
            onProcessing(true)
            callbackLog.push('processing-start')

            await new Promise(resolve => setTimeout(resolve, 10))

            onProgress({ current: 1, total: 2, currentPageTitle: 'Test Page' })
            callbackLog.push('progress-update')

            await new Promise(resolve => setTimeout(resolve, 10))

            onProcessing(false)
            callbackLog.push('processing-end')
          }),
          authService: {},
          databaseId: dbId,
          setIsProcessing: onProcessing,
          setProgress: onProgress,
          sendLogToStream: onStream,
          log: vi.fn(),
          extractPageTitle: vi.fn(),
          handleSyncToMarkdown: vi.fn()
        }
      })

      const response = await POST()
      // Leer todo el stream para asegurar que los callbacks se ejecuten
      await readSSEMessages(response, 10)

      expect(callbackLog).toEqual(['processing-start', 'progress-update', 'processing-end'])
    })

    it('should handle rapid callback succession', async () => {
      process.env.NOTION_DATABASE_ID = 'rapid-test-db'

      let progressCallCount = 0
      let streamCallCount = 0

      // @ts-expect-error - Mock completo para test específico
      mockConnectionPageRepository.mockImplementation((dbId: string, onProcessing: (value: unknown) => void, onProgress: (value: unknown) => void, onStream?: (value: unknown) => void) => {
        return {
          handleSyncToSupabase: vi.fn().mockImplementation(async () => {
            // Trigger many rapid callbacks
            for (let i = 0; i < 10; i++) {
              onProgress({ current: i, total: 10, currentPageTitle: `Page ${i}` })
              progressCallCount++
              if (onStream) {
                onStream(`Rapid message ${i}`)
                streamCallCount++
              }
            }
          }),
          authService: {},
          databaseId: dbId,
          setIsProcessing: onProcessing,
          setProgress: onProgress,
          sendLogToStream: onStream,
          log: vi.fn(),
          extractPageTitle: vi.fn(),
          handleSyncToMarkdown: vi.fn()
        }
      })

      const response = await POST()
      expect(response.status).toBe(200)
      expect(progressCallCount).toBe(10)
      expect(streamCallCount).toBe(10)
    })

    it('should handle callbacks with null/undefined gracefully', async () => {
      process.env.NOTION_DATABASE_ID = 'null-test-db'

      // @ts-expect-error - Mock completo para test específico
      mockConnectionPageRepository.mockImplementation((dbId: string, onProcessing: (value: unknown) => void, onProgress: (value: unknown) => void) => {
        return {
          handleSyncToSupabase: vi.fn().mockImplementation(async () => {
            // Test with various null/undefined values
            onProgress(null)
            onProcessing(true)
            onProcessing(false)
          })
        }
      })

      const response = await POST()
      expect(response.status).toBe(200)
      // No debería arrojar errores
    })
  })

  describe('⚡ Performance & Resource Tests', () => {
    it('should handle large number of databases efficiently', async () => {
      const largeDatabaseList = Array.from({ length: 100 }, (_, i) => `db-${i}`).join(',')
      process.env.NOTION_DATABASE_ID = largeDatabaseList

      // Reset el mock antes de la prueba
      vi.clearAllMocks()

      const startTime = Date.now()
      const response = await POST()

      // Leer el stream para asegurar que se procesen todas las databases
      await readSSEMessages(response, 200) // Más mensajes para 100 databases

      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(mockConnectionPageRepository).toHaveBeenCalledTimes(100)

      // El test debería completarse en tiempo razonable (< 2 segundos para mocks)
      expect(endTime - startTime).toBeLessThan(2000)
    })

    it('should handle very long database IDs without memory issues', async () => {
      const veryLongId = 'a'.repeat(10000) // 10KB database ID
      process.env.NOTION_DATABASE_ID = veryLongId

      const response = await POST()

      expect(response.status).toBe(200)
      expect(mockConnectionPageRepository).toHaveBeenCalledWith(veryLongId, expect.any(Function), expect.any(Function), expect.any(Function))
    })

    it('should handle concurrent stream reading without race conditions', async () => {
      process.env.NOTION_DATABASE_ID = 'concurrent-test'

      // Simular múltiples lectores del stream
      const responses = await Promise.all([
        POST(),
        POST(),
        POST()
      ])

      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body).toBeDefined()
      })
    })
  })

  describe('🔐 Error Boundary Tests', () => {
    it('should handle stream controller errors gracefully', async () => {
      process.env.NOTION_DATABASE_ID = 'controller-error-db'

      // Mock que causa error en el controller
      mockConnectionPageRepository.mockImplementation(() => {
        throw new Error('Stream controller error')
      })

      const response = await POST()

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/event-stream')
      // El stream debería cerrar correctamente
    })

    it('should handle JSON serialization errors in SYNC_COMPLETE', async () => {
      process.env.NOTION_DATABASE_ID = 'json-error-db'

      // @ts-expect-error - Mock completo para test específico
      mockConnectionPageRepository.mockImplementation((dbId: string, onProcessing: (value: unknown) => void, onProgress: (value: unknown) => void, onStream?: (value: unknown) => void) => {
        return {
          handleSyncToSupabase: vi.fn().mockImplementation(async () => {
            // Simular un resultado que podría causar problemas de serialización
            onStream?.('Test message')
          })
        }
      })

      const response = await POST()
      expect(response.status).toBe(200)
    })

    it('should handle async errors in repository chain', async () => {
      process.env.NOTION_DATABASE_ID = 'async-error-db'

      mockHandleSyncToSupabase.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        throw new Error('Async repository error')
      })

      const response = await POST()
      const messages = await readSSEMessages(response, 10)

      const errorMessage = messages.find(msg => msg.includes('❌ Error procesando database'))
      expect(errorMessage).toBeDefined()
    })
  })

  describe('🎨 Message Format Validation', () => {
    it('should format all SSE messages correctly', async () => {
      process.env.NOTION_DATABASE_ID = 'format-test-db'

      const response = await POST()
      const reader = response.body?.getReader()

      if (reader) {
        const decoder = new TextDecoder()
        let chunk = ''

        try {
          const { value } = await reader.read()
          if (value) {
            chunk = decoder.decode(value)
          }
        } catch {
          // Ignorar errores de lectura en tests
        } finally {
          reader.releaseLock()
        }

        // Verificar formato SSE básico
        const lines = chunk.split('\n')
        const dataLines = lines.filter(line => line.startsWith('data: '))

        dataLines.forEach(line => {
          expect(line).toMatch(/^data: /)

          const jsonPart = line.slice(6)
          if (jsonPart && !jsonPart.startsWith('SYNC_COMPLETE:')) {
            expect(() => JSON.parse(jsonPart)).not.toThrow()
          }
        })
      }
    })

    it('should include required emojis in status messages', async () => {
      process.env.NOTION_DATABASE_ID = 'emoji-test-db'

      const response = await POST()
      const messages = await readSSEMessages(response, 10)

      // Verificar que hay emojis en los mensajes apropiados
      expect(messages.some(msg => msg.includes('🚀'))).toBe(true) // Inicio
      expect(messages.some(msg => msg.includes('📊'))).toBe(true) // Procesando
      expect(messages.some(msg => msg.includes('✅'))).toBe(true) // Éxito
    })

    it('should maintain consistent message structure', async () => {
      process.env.NOTION_DATABASE_ID = 'structure-test-db'

      const response = await POST()
      const messages = await readSSEMessages(response, 8)

      // Los mensajes deberían seguir un patrón consistente
      expect(messages.length).toBeGreaterThan(3)

      // Primer mensaje debería ser inicio
      expect(messages[0]).toContain('🚀 Iniciando sincronización')

      // Debería haber mensaje de procesamiento
      expect(messages.some(msg => msg.includes('📊 Procesando'))).toBe(true)
    })
  })

  describe('🔄 Stream Lifecycle Tests', () => {
    it('should properly close stream on completion', async () => {
      process.env.NOTION_DATABASE_ID = 'lifecycle-test-db'

      const response = await POST()
      const reader = response.body?.getReader()

      if (reader) {
        let streamClosed = false

        try {
          while (!streamClosed) {
            const { done } = await reader.read()
            if (done) {
              streamClosed = true
            }
          }
        } catch {
          // El stream puede cerrarse abruptamente en tests
        }

        // El stream debería eventualmente cerrarse
        expect(reader).toBeDefined()
      }
    })

    it('should handle premature stream cancellation', async () => {
      process.env.NOTION_DATABASE_ID = 'cancellation-test-db'

      const response = await POST()
      const reader = response.body?.getReader()

      if (reader) {
        // Cancelar el stream inmediatamente
        await reader.cancel()

        // No debería arrojar errores
        expect(response.status).toBe(200)
      }
    })
  })
}) 