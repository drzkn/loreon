'use client';

import { useState, useEffect, useMemo } from 'react';
import { SupabaseMarkdownRepository } from '../../adapters/output/infrastructure/supabase';
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
import { renderMarkdown } from './page.constants';

interface MarkdownPage {
  id: string;
  title: string;
  content: string;
  notion_page_id: string;
  created_at: string;
  updated_at: string;
}

export default function VisualizerPage() {
  const [pages, setPages] = useState<MarkdownPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<MarkdownPage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const repository = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new SupabaseMarkdownRepository();
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

      const loadedPages = await repository.findAll({ limit: 1000 });

      setPages(loadedPages.sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ));

      if (loadedPages.length > 0 && !selectedPage) {
        setSelectedPage(loadedPages[0]);
      }
    } catch (err) {
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
    return content
      .replace(/[#*`\[\]]/g, '')
      .replace(/\n+/g, ' ')
      .trim()
      .substring(0, 120);
  };

  const handlePageSelect = (page: MarkdownPage) => {
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
          <Title>📚 Visualizador Markdown</Title>
          <Subtitle>Explora y visualiza el contenido markdown sincronizado desde Notion</Subtitle>
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
          <Title><Icon name="square-library" size="xl" color="#10b981" /> Visualizador Markdown</Title>
          <Subtitle>Explora y visualiza el contenido markdown sincronizado desde Notion</Subtitle>
        </HeaderSection>
        <EmptyState>
          <EmptyIcon>❌</EmptyIcon>
          <EmptyTitle>Error al cargar el contenido</EmptyTitle>
        </EmptyState>
      </VisualizerContainer>
    );
  }

  return (
    <VisualizerContainer>
      <HeaderSection>
        <Title><Icon name="square-library" size="xl" color="#10b981" /> Visualizador Markdown</Title>
        <Subtitle>Explora y visualiza el contenido markdown sincronizado desde Notion</Subtitle>
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
                    : 'Aún no hay contenido markdown sincronizado. Sincroniza desde Notion para ver páginas aquí.'
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
                <ContentTitle>{selectedPage.title}</ContentTitle>
                <BackButton onClick={handleBackToList}>
                  ← Volver
                </BackButton>
              </ContentHeader>
              <MarkdownContent
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(selectedPage.content)
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