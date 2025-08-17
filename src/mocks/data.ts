import { UserToken, CreateUserTokenInput } from '@/types/UserToken';

// ===============================
// USER TOKEN TEST DATA
// ===============================
export const mockUserId = 'user-123';
export const mockUserId2 = 'user-456';

export const createMockUserToken = (overrides: Partial<UserToken> = {}): UserToken => ({
  id: 'token-1',
  user_id: mockUserId,
  provider: 'notion',
  token_name: 'Test Token',
  encrypted_token: 'encrypted-token-1',
  token_metadata: { workspace: 'test' },
  is_active: true,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  ...overrides
});

export const mockTokens: UserToken[] = [
  createMockUserToken({
    id: 'token-1',
    provider: 'notion',
    token_name: 'Notion Token 1',
    token_metadata: { workspace: 'test' }
  }),
  createMockUserToken({
    id: 'token-2',
    provider: 'slack',
    token_name: 'Slack Token 1',
    encrypted_token: 'encrypted-token-2',
    token_metadata: { team: 'myteam' },
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z'
  })
];

export const createMockTokenInput = (overrides: Partial<CreateUserTokenInput> = {}): CreateUserTokenInput => ({
  provider: 'notion',
  token_name: 'Test Token',
  token: 'secret_123',
  metadata: { test: true },
  ...overrides
});

// ===============================
// NOTION TEST DATA
// ===============================
export const createMockNotionPage = (overrides: Record<string, unknown> = {}) => ({
  id: 'page-123',
  title: 'Test Page',
  url: 'https://notion.so/test',
  properties: { title: 'Test' },
  created_time: '2024-01-01T00:00:00Z',
  last_edited_time: '2024-01-02T00:00:00Z',
  archived: false,
  ...overrides
});

export const createMockNotionBlock = (overrides: Record<string, unknown> = {}) => ({
  id: 'block-123',
  type: 'paragraph',
  paragraph: {
    rich_text: [
      {
        type: 'text',
        text: { content: 'Test content' }
      }
    ]
  },
  has_children: false,
  ...overrides
});

export const mockNotionBlocks = [
  createMockNotionBlock({
    id: 'block-1',
    type: 'heading_1',
    heading_1: {
      rich_text: [{ type: 'text', text: { content: 'Test Heading' } }]
    }
  }),
  createMockNotionBlock({
    id: 'block-2',
    type: 'paragraph'
  }),
  createMockNotionBlock({
    id: 'block-3',
    type: 'bulleted_list_item',
    bulleted_list_item: {
      rich_text: [{ type: 'text', text: { content: 'List item' } }]
    }
  })
];

// ===============================
// API TEST DATA
// ===============================
export const createMockNextRequest = (body: Record<string, unknown> = {}, method = 'POST') => {
  return new Request('http://localhost:3000/api/test', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
};

export const createMockRequestWithAuth = (body: Record<string, unknown> = {}, token = 'test-token') => {
  return new Request('http://localhost:3000/api/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
};

// ===============================
// CHAT TEST DATA
// ===============================
export const createMockChatMessage = (overrides: Record<string, unknown> = {}) => ({
  role: 'user',
  content: 'Test message',
  ...overrides
});

export const mockChatMessages = [
  createMockChatMessage({ role: 'user', content: 'Hello' }),
  createMockChatMessage({ role: 'assistant', content: 'Hi there!' }),
  createMockChatMessage({ role: 'user', content: 'How are you?' })
];

// ===============================
// EMBEDDINGS TEST DATA
// ===============================
export const createMockEmbedding = (overrides: Record<string, unknown> = {}) => ({
  id: 'emb-123',
  content: 'Test content for embedding',
  embedding: new Array(1536).fill(0.1),
  metadata: { source: 'test' },
  ...overrides
});

export const mockEmbeddings = [
  createMockEmbedding({ id: 'emb-1', content: 'First embedding' }),
  createMockEmbedding({ id: 'emb-2', content: 'Second embedding' }),
  createMockEmbedding({ id: 'emb-3', content: 'Third embedding' })
];

// ===============================
// ERROR TEST DATA
// ===============================
export const mockErrors = {
  authError: new Error('Authentication failed'),
  notFoundError: new Error('Resource not found'),
  validationError: new Error('Validation failed'),
  networkError: new Error('Network error'),
  supabaseError: {
    message: 'Database error',
    code: 'PGRST116',
    details: null,
    hint: null
  }
};
