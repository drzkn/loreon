'use client';

import { useState, useEffect, useMemo } from 'react';
import { NotionNativeRepository } from '../../adapters/output/infrastructure/supabase/NotionNativeRepository';
import { supabase } from '../../adapters/output/infrastructure/supabase/SupabaseClient';
import {
  VisualizerContainer,
  HeaderSection,
  Title,
  Subtitle,
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
  EmptyIcon,
  EmptyTitle,
  EmptyDescription,
  LoadingSpinner
} from './page.styles';
import { TempDebug } from './TempDebug';
import { Icon } from '@/components';

// Interfaz para páginas del sistema nativo
interface NotionPageData {
  id: string;
  title: string;
  notion_id: string;
  url?: string;
  created_at: string;
  updated_at: string;
  htmlContent?: string;
  plainText?: string;
}

export default function VisualizerPage() {
  const [pages, setPages] = useState<NotionPageData[]>([]);
  const [selectedPage, setSelectedPage] = useState<NotionPageData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const repository = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new NotionNativeRepository(supabase);
    }
    return null;
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (repository) {
      loadPages();
    }
  }, [repository]);

  const loadPages = async () => {
    if (!repository) {
      setError('Repository no disponible en el servidor');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Obtener páginas del sistema nativo - consulta directa a Supabase
      const { data: loadedPages, error: pagesError } = await supabase
        .from('notion_pages')
        .select('*')
        .eq('archived', false)
        .order('updated_at', { ascending: false })
        .limit(1000);

      if (pagesError) {
        throw new Error(`Error obteniendo páginas: ${pagesError.message}`);
      }

      // Transformar datos para el visualizador
      const transformedPages: NotionPageData[] = [];

      for (const page of loadedPages) {
        if (page.archived) continue; // Omitir páginas archivadas

        try {
          // Obtener contenido con bloques para mostrar
          const blocks = await repository.getPageBlocks(page.id);

          // Generar HTML y texto plano desde los bloques
          const htmlContent = blocks.map(block => block.html_content).join('\n') || '<p>Sin contenido disponible</p>';
          const plainText = blocks.map(block => block.plain_text).join(' ') || '';

          transformedPages.push({
            id: page.id,
            title: page.title,
            notion_id: page.notion_id,
            url: page.url,
            created_at: page.created_at,
            updated_at: page.updated_at,
            htmlContent,
            plainText
          });
        } catch (blockError) {
          console.warn(`Error obteniendo bloques para página ${page.title}:`, blockError);
          // Agregar página sin contenido de bloques
          transformedPages.push({
            id: page.id,
            title: page.title,
            notion_id: page.notion_id,
            url: page.url,
            created_at: page.created_at,
            updated_at: page.updated_at,
            htmlContent: '<p>Error cargando contenido</p>',
            plainText: page.title
          });
        }
      }

      setPages(transformedPages);

      if (transformedPages.length > 0 && !selectedPage) {
        setSelectedPage(transformedPages[0]);
      }
    } catch (err) {
      console.error('Error cargando páginas:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const filteredPages = useMemo(() => {
    if (!searchTerm.trim()) return pages;

    const searchLower = searchTerm.toLowerCase();
    return pages.filter(page =>
      page.title.toLowerCase().includes(searchLower) ||
      (page.plainText && page.plainText.toLowerCase().includes(searchLower))
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

  const getPreviewText = (plainText: string) => {
    if (!plainText) return 'Sin contenido disponible';
    return plainText
      .replace(/[#*`\[\]]/g, '')
      .replace(/\n+/g, ' ')
      .trim()
      .substring(0, 120);
  };

  const handlePageSelect = (page: NotionPageData) => {
    setSelectedPage(page);
    setShowSidebar(false);
  };

  const handleBackToList = () => {
    setShowSidebar(true);
  };

  // Mostrar loading durante la hidratación del cliente
  if (!isClient) {
    return (
      <VisualizerContainer>
        <HeaderSection>
          <Title>📚 Visualizador Nativo</Title>
          <Subtitle>Explora y visualiza el contenido JSON nativo sincronizado desde Notion</Subtitle>
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
          <Title><Icon name="square-library" size="xl" color="#10b981" /> Visualizador Nativo</Title>
          <Subtitle>Explora y visualiza el contenido JSON nativo sincronizado desde Notion</Subtitle>
        </HeaderSection>
        <EmptyState>
          <EmptyIcon>❌</EmptyIcon>
          <EmptyTitle>Error al cargar el contenido</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyState>
      </VisualizerContainer>
    );
  }

  return (
    <VisualizerContainer>
      <HeaderSection>
        <Title><Icon name="square-library" size="xl" color="#10b981" /> Visualizador Nativo</Title>
        <Subtitle>Explora y visualiza el contenido JSON nativo sincronizado desde Notion</Subtitle>
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
                <EmptyIcon>📭</EmptyIcon>
                <EmptyTitle>
                  {searchTerm ? 'Sin resultados' : 'No hay páginas'}
                </EmptyTitle>
                <EmptyDescription>
                  {searchTerm
                    ? 'No se encontraron páginas que coincidan con tu búsqueda'
                    : 'Aún no hay contenido nativo sincronizado. Sincroniza desde Notion para ver páginas aquí.'
                  }
                </EmptyDescription>
              </EmptyState>
            ) : (
              filteredPages.map((page) => (
                <PageItem
                  key={page.id}
                  $isSelected={selectedPage?.id === page.id}
                  onClick={() => handlePageSelect(page)}
                >
                  <PageTitle>{page.title}</PageTitle>
                  <PagePreview>{getPreviewText(page.plainText || '')}</PagePreview>
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
                <ContentTitle>{selectedPage.title}</ContentTitle>
                <BackButton onClick={handleBackToList}>
                  ← Volver
                </BackButton>
              </ContentHeader>
              <MarkdownContent
                dangerouslySetInnerHTML={{
                  __html: selectedPage.htmlContent || '<p>Sin contenido disponible</p>'
                }}
              />
            </>
          ) : (
            <EmptyState>
              <EmptyIcon>📄</EmptyIcon>
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