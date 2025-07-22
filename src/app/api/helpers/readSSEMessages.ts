export async function readSSEMessages(response: Response, maxMessages = 10): Promise<string[]> {
  const reader = response.body?.getReader()
  if (!reader) return []

  const decoder = new TextDecoder()
  const messages: string[] = []
  let count = 0

  try {
    while (count < maxMessages) {
      const { done, value } = await reader.read()
      if (done) break

      if (value) {
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const content = line.slice(6)

            // Manejar mensaje especial SYNC_COMPLETE
            if (content.startsWith('SYNC_COMPLETE:')) {
              messages.push(content)
              count++
            } else {
              // Intentar parsear como JSON normal
              try {
                const data = JSON.parse(content)
                messages.push(data.message)
                count++
              } catch {
                messages.push(content)
                count++
              }
            }
          }
        }
      }
    }
  } catch {
    // Ignorar errores de lectura para tests
  } finally {
    reader.releaseLock()
  }

  return messages
}