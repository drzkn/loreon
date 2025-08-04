'use client';

import { useState, useEffect, useMemo } from 'react';
import { NotionNativeRepository } from '../../adapters/output/infrastructure/supabase/NotionNativeRepository';
import { SupabaseMarkdownRepository } from '../../adapters/output/infrastructure/supabase';
import { supabase } from '../../adapters/output/infrastructure/supabase/SupabaseClient';
import {
  VisualizerContainer,
  HeaderSection,
  Title,
  MainContent,
  SidebarSection,
  SearchContainer,
  SearchInput,
  PagesList,
  PageItem,
  PageTitle,
  PagePreview,
  PageDate,
  ContentSection,
  ContentHeader,
  ContentTitle,
  BackButton,
  MarkdownContent,
  EmptyState,
  EmptyTitle,
  EmptyDescription,
  LoadingSpinner
} from './page.styles';
import { TempDebug } from './TempDebug';
import { Icon } from '@/components';
import { renderMarkdown } from './page.constants';

// Interfaz unificada para ambos sistemas
interface UnifiedPageData {
  id: string;
  title: string;
  content: string; // HTML o Markdown según el sistema
  source: 'native' | 'legacy';
  notion_id?: string;
  url?: string;
  created_at: string;
  updated_at: string;
}

interface SystemStatus {
  nativePages: number;
  legacyPages: number;
  selectedSystem: 'native' | 'legacy' | 'none';
  error?: string;
}

export default function VisualizerPage() {
  const [pages, setPages] = useState<UnifiedPageData[]>([]);
  const [selectedPage, setSelectedPage] = useState<UnifiedPageData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
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

  useEffect(() => {
    if (nativeRepository && legacyRepository) {
      checkSystemsAndLoadPages();
    }
  }, [nativeRepository, legacyRepository]);

  const checkSystemsAndLoadPages = async () => {
    if (!nativeRepository || !legacyRepository) {
      setError('Repositorios no disponibles en el servidor');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Verificando sistemas disponibles...');

      // Verificar sistema nativo
      const { data: nativePages, error: nativeError } = await supabase
        .from('notion_pages')
        .select('id')
        .eq('archived', false)
        .limit(1);

      const nativeCount = nativeError ? 0 : (nativePages?.length || 0);

      // Verificar sistema legacy
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

      // Cargar páginas del sistema seleccionado
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
  };

  const loadNativePages = async () => {
    try {
      console.log('📱 Cargando páginas del sistema nativo...');

      // Obtener páginas del sistema nativo
      const { data: loadedPages, error: pagesError } = await supabase
        .from('notion_pages')
        .select('*')
        .eq('archived', false)
        .order('updated_at', { ascending: false })
        .limit(100); // Limitar para mejor rendimiento inicial

      if (pagesError) {
        throw new Error(`Error obteniendo páginas nativas: ${pagesError.message}`);
      }

      if (!loadedPages || loadedPages.length === 0) {
        console.log('📭 No hay páginas en el sistema nativo');
        setPages([]);
        return;
      }

      console.log(`📄 Obtenidas ${loadedPages.length} páginas nativas`);

      // Transformar páginas nativas
      const transformedPages: UnifiedPageData[] = [];

      for (const page of loadedPages.slice(0, 20)) { // Procesar solo las primeras 20 para mejor rendimiento
        try {
          // Obtener bloques para la página
          const blocks = await nativeRepository!.getPageBlocks(page.id);

          let htmlContent;

          if (blocks.length > 0) {
            // Si hay bloques, usarlos
            htmlContent = blocks.map(block => block.html_content).join('\n');
          } else {
            // Si no hay bloques, usar contenido original desde raw_data
            const originalContent = page.raw_data?.original_content || '';
            if (originalContent) {
              // Renderizar Markdown usando el renderizador que ya funciona
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

          // Fallback: usar contenido original desde raw_data
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

      if (transformedPages.length > 0 && !selectedPage) {
        setSelectedPage(transformedPages[0]);
      }

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
        content: page.content, // Markdown content
        source: 'legacy',
        notion_id: page.notion_page_id || undefined,
        url: page.notion_url || undefined,
        created_at: page.created_at,
        updated_at: page.updated_at
      }));

      setPages(transformedPages.sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ));

      if (transformedPages.length > 0 && !selectedPage) {
        setSelectedPage(transformedPages[0]);
      }

      console.log(`✅ Cargadas ${transformedPages.length} páginas legacy exitosamente`);

    } catch (err) {
      console.error('❌ Error cargando páginas legacy:', err);
      throw err;
    }
  };

  const filteredPages = useMemo(() => {
    if (!searchTerm.trim()) return pages;

    const searchLower = searchTerm.toLowerCase();
    return pages.filter(page =>
      page.title.toLowerCase().includes(searchLower) ||
      page.content.toLowerCase().includes(searchLower)
    );
  }, [pages, searchTerm]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPreviewText = (content: string) => {
    if (!content) return 'Sin contenido disponible';
    return content
      .replace(/<[^>]*>/g, '') // Remover HTML tags
      .replace(/[#*`\[\]]/g, '') // Remover markdown
      .replace(/\n+/g, ' ')
      .trim()
      .substring(0, 120);
  };

  const handlePageSelect = (page: UnifiedPageData) => {
    setSelectedPage(page);
    setShowSidebar(false);
  };

  const handleBackToList = () => {
    setShowSidebar(true);
  };

  const renderPageContent = (page: UnifiedPageData) => {
    if (page.source === 'legacy') {
      // Renderizar Markdown para páginas legacy
      return (
        <MarkdownContent
          dangerouslySetInnerHTML={{
            __html: renderMarkdown(page.content)
          }}
        />
      );
    } else {
      // Renderizar HTML para páginas nativas
      return (
        <MarkdownContent
          dangerouslySetInnerHTML={{
            __html: page.content || '<p>Sin contenido disponible</p>'
          }}
        />
      );
    }
  };

  // Mostrar loading durante la hidratación del cliente
  if (!isClient) {
    return (
      <VisualizerContainer>
        <HeaderSection>
          <Title><Icon name="square-library" size="xl" color="#10b981" /> Visualizador</Title>
        </HeaderSection>
        <EmptyState>
          <LoadingSpinner>Inicializando visualizador...</LoadingSpinner>
        </EmptyState>
      </VisualizerContainer>
    );
  }

  if (error) {
    return (
      <VisualizerContainer>
        <TempDebug />
        <HeaderSection>
          <Title><Icon name="square-library" size="xl" color="#10b981" /> Visualizador</Title>
        </HeaderSection>
        <EmptyState>
          <Icon name="x" size="md" />
          <EmptyTitle>Error al cargar el contenido</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyState>
      </VisualizerContainer>
    );
  }

  return (
    <VisualizerContainer>
      <HeaderSection>
        <Title><Icon name="square-library" size="xl" color="#10b981" /> Visualizador</Title>
      </HeaderSection>

      <MainContent>
        <SidebarSection hidden={!showSidebar}>
          <SearchContainer>
            <SearchInput
              type="text"
              placeholder="Buscar páginas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>

          <PagesList>
            {loading ? (
              <LoadingSpinner>Cargando páginas...</LoadingSpinner>
            ) : filteredPages.length === 0 ? (
              <EmptyState>
                <Icon name="mailbox" size="xl" />
                <EmptyTitle>
                  {searchTerm ? 'Sin resultados' : 'No hay páginas disponibles'}
                </EmptyTitle>
                <EmptyDescription>
                  {searchTerm ? (
                    'No se encontraron páginas que coincidan con tu búsqueda'
                  ) : systemStatus.selectedSystem === 'none' ? (
                    <>
                      <strong>No hay datos en ningún sistema.</strong><br /><br />
                      Para usar el visualizador:<br />
                      1. Ve a /settings y sincroniza desde Notion (sistema legacy)<br />
                      2. O usa la API de migración para poblar el sistema nativo<br /><br />
                      <code>POST /api/sync-notion</code> con pageIds
                    </>
                  ) : (
                    'Todas las páginas se han cargado correctamente'
                  )}
                </EmptyDescription>
              </EmptyState>
            ) : (
              filteredPages.map((page) => (
                <PageItem
                  key={page.id}
                  $isSelected={selectedPage?.id === page.id}
                  onClick={() => handlePageSelect(page)}
                >
                  <PageTitle>
                    {page.title}
                  </PageTitle>
                  <PagePreview>{getPreviewText(page.content)}</PagePreview>
                  <PageDate>
                    Actualizado: {formatDate(page.updated_at)}
                  </PageDate>
                </PageItem>
              ))
            )}
          </PagesList>
        </SidebarSection>

        <ContentSection hidden={showSidebar}>
          {selectedPage ? (
            <>
              <ContentHeader>
                <ContentTitle>
                  <span style={{ fontSize: '0.7em', opacity: 0.6, marginLeft: '10px' }}>
                    ({selectedPage.source === 'native' ? 'Sistema Nativo' : 'Sistema Legacy'})
                  </span>
                </ContentTitle>
                <BackButton onClick={handleBackToList}>
                  <Icon name="chevron-left" /> Volver
                </BackButton>
              </ContentHeader>
              {renderPageContent(selectedPage)}
            </>
          ) : (
            <EmptyState>
              <Icon name="book-open" size="xxl" color="white" />
              <EmptyTitle>Selecciona una página</EmptyTitle>
              <EmptyDescription>
                Elige una página de la lista para ver su contenido aquí
              </EmptyDescription>
            </EmptyState>
          )}
        </ContentSection>
      </MainContent>
    </VisualizerContainer>
  );
} 