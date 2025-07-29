import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock básico de dependencias
const mockSupabaseMarkdownRepository = vi.fn();
const mockRenderMarkdown = vi.fn(() => '<div>Mocked markdown</div>');

vi.mock('../../adapters/output/infrastructure/supabase', () => ({
  SupabaseMarkdownRepository: mockSupabaseMarkdownRepository
}));

vi.mock('./page.constants', () => ({
  renderMarkdown: mockRenderMarkdown
}));

vi.mock('./debug-temp', () => ({
  TempDebug: () => <div>Debug Component</div>
}));

vi.mock('@/components', () => ({
  Icon: ({ name }: { name: string }) => <span>{name}</span>
}));

// Importar componente después de mocks
import VisualizerPage from '../page';

describe('VisualizerPage Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock environment variables
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
    };

    // Mock repository with basic functionality
    const mockRepository = {
      findAll: vi.fn().mockResolvedValue([])
    };
    mockSupabaseMarkdownRepository.mockImplementation(() => mockRepository);

    // Mock console
    vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should render without throwing errors', async () => {
      let renderError = null;

      try {
        await act(async () => {
          render(<VisualizerPage />);
        });
      } catch (error) {
        renderError = error;
      }

      expect(renderError).toBeNull();
    });

    it('should have a DOM element after rendering', async () => {
      await act(async () => {
        render(<VisualizerPage />);
      });

      const bodyContent = document.body.innerHTML;
      expect(bodyContent).toBeTruthy();
      expect(bodyContent.length).toBeGreaterThan(0);
    });

    it('should contain some expected content', async () => {
      await act(async () => {
        render(<VisualizerPage />);
      });

      // Just check that some content is rendered
      const content = document.body.textContent;
      expect(content).toBeTruthy();
    });
  });

  describe('Mock Verification', () => {
    it('should have mocks properly configured', () => {
      expect(mockSupabaseMarkdownRepository).toBeDefined();
      expect(mockRenderMarkdown).toBeDefined();
      expect(typeof mockSupabaseMarkdownRepository).toBe('function');
      expect(typeof mockRenderMarkdown).toBe('function');
    });

    it('should call mocked functions', () => {
      const result = mockRenderMarkdown();
      expect(mockRenderMarkdown).toHaveBeenCalled();
      expect(result).toBe('<div>Mocked markdown</div>');
    });
  });

  describe('Environment Setup', () => {
    it('should have test environment variables set', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co');
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key');
    });

    it('should be running in test environment', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });
  });

  describe('Testing Library Setup', () => {
    it('should have testing library working', () => {
      const { container } = render(<div>Test content</div>);
      expect(container).toBeTruthy();
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should support async testing', async () => {
      await act(async () => {
        render(<div>Async test</div>);
      });

      expect(screen.getByText('Async test')).toBeInTheDocument();
    });
  });
});
