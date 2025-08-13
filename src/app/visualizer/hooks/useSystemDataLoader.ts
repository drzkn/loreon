import { useState, useEffect, useMemo, useCallback } from 'react';
import { NotionNativeRepository } from '../../../adapters/output/infrastructure/supabase/NotionNativeRepository';
import { SupabaseMarkdownRepository } from '../../../adapters/output/infrastructure/supabase';
import { supabase } from '../../../adapters/output/infrastructure/supabase/SupabaseClient';
import { renderMarkdown } from '../page.constants';
import type { UnifiedPageData, SystemStatus } from '../components/PagesList';

export function useSystemDataLoader() {
  const [pages, setPages] = useState<UnifiedPageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    nativePages: 0,
    legacyPages: 0,
    selectedSystem: 'none'
  });

  const nativeRepository = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new NotionNativeRepository(supabase);
    }
    return null;
  }, []);

  const legacyRepository = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new SupabaseMarkdownRepository();
    }
    return null;
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const checkSystemsAndLoadPages = useCallback(async () => {
    const loadNativePages = async () => {
      try {
        console.log('📱 Cargando páginas del sistema nativo...');

        const { data: loadedPages, error: pagesError } = await supabase
          .from('notion_pages')
          .select('*')
          .eq('archived', false)
          .order('updated_at', { ascending: false })
          .limit(100);

        if (pagesError) {
          throw new Error(`Error obteniendo páginas nativas: ${pagesError.message}`);
        }

        if (!loadedPages || loadedPages.length === 0) {
          console.log('📭 No hay páginas en el sistema nativo');
          setPages([]);
          return;
        }

        console.log(`📄 Obtenidas ${loadedPages.length} páginas nativas`);

        const transformedPages: UnifiedPageData[] = [];

        for (const page of loadedPages.slice(0, 20)) {
          try {
            const blocks = await nativeRepository!.getPageBlocks(page.id);

            let htmlContent;

            if (blocks.length > 0) {
              htmlContent = blocks.map(block => block.html_content).join('\n');
            } else {
              const originalContent = page.raw_data?.original_content || '';
              if (originalContent) {
                htmlContent = renderMarkdown(originalContent);
              } else {
                htmlContent = '<p>Sin contenido disponible</p>';
              }
            }

            transformedPages.push({
              id: page.id,
              title: page.title,
              content: htmlContent,
              source: 'native',
              notion_id: page.notion_id,
              url: page.url,
              created_at: page.created_at,
              updated_at: page.updated_at
            });

          } catch (blockError) {
            console.warn(`⚠️ Error obteniendo bloques para página ${page.title}:`, blockError);

            const originalContent = page.raw_data?.original_content || '';
            let htmlContent;

            if (originalContent) {
              htmlContent = renderMarkdown(originalContent);
            } else {
              htmlContent = '<p>Error cargando contenido</p>';
            }

            transformedPages.push({
              id: page.id,
              title: page.title,
              content: htmlContent,
              source: 'native',
              notion_id: page.notion_id,
              url: page.url,
              created_at: page.created_at,
              updated_at: page.updated_at
            });
          }
        }

        setPages(transformedPages);
        console.log(`✅ Cargadas ${transformedPages.length} páginas nativas exitosamente`);

      } catch (err) {
        console.error('❌ Error cargando páginas nativas:', err);
        throw err;
      }
    };

    const loadLegacyPages = async () => {
      try {
        console.log('📚 Cargando páginas del sistema legacy...');

        const loadedPages = await legacyRepository!.findAll({ limit: 100 });

        const transformedPages: UnifiedPageData[] = loadedPages.map(page => ({
          id: page.id,
          title: page.title,
          content: page.content,
          source: 'legacy',
          notion_id: page.notion_page_id || undefined,
          url: page.notion_url || undefined,
          created_at: page.created_at,
          updated_at: page.updated_at
        }));

        setPages(transformedPages.sort((a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        ));

        console.log(`✅ Cargadas ${transformedPages.length} páginas legacy exitosamente`);

      } catch (err) {
        console.error('❌ Error cargando páginas legacy:', err);
        throw err;
      }
    };
    if (!nativeRepository || !legacyRepository) {
      setError('Repositorios no disponibles en el servidor');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Verificando sistemas disponibles...');

      const { data: nativePages, error: nativeError } = await supabase
        .from('notion_pages')
        .select('id')
        .eq('archived', false)
        .limit(1);

      const nativeCount = nativeError ? 0 : (nativePages?.length || 0);

      let legacyCount = 0;
      try {
        const legacyPages = await legacyRepository.findAll({ limit: 1 });
        legacyCount = legacyPages.length;
      } catch (legacyError) {
        console.warn('Error verificando sistema legacy:', legacyError);
      }

      const selectedSystem = nativeCount > 0 ? 'native' : legacyCount > 0 ? 'legacy' : 'none';

      setSystemStatus({
        nativePages: nativeCount,
        legacyPages: legacyCount,
        selectedSystem
      });

      console.log(`📊 Estado de sistemas: Nativo: ${nativeCount}, Legacy: ${legacyCount}, Usando: ${selectedSystem}`);

      if (selectedSystem === 'native') {
        await loadNativePages();
      } else if (selectedSystem === 'legacy') {
        await loadLegacyPages();
      } else {
        setPages([]);
      }

    } catch (err) {
      console.error('Error verificando sistemas:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido verificando sistemas');
    } finally {
      setLoading(false);
    }
  }, [nativeRepository, legacyRepository]);

  useEffect(() => {
    if (nativeRepository && legacyRepository) {
      checkSystemsAndLoadPages();
    }
  }, [nativeRepository, legacyRepository, checkSystemsAndLoadPages]);

  return {
    pages,
    loading,
    error,
    isClient,
    systemStatus
  };
}
