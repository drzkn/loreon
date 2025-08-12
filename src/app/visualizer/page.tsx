'use client';

import { useState, useMemo } from 'react';
import { TempDebug } from './TempDebug';
import { Icon } from '@/components';
import { useSystemDataLoader } from './hooks/useSystemDataLoader';
import { SearchBar } from './components/SearchBar';
import { PagesList } from './components/PagesList';
import { ContentViewer } from './components/ContentViewer';
import type { UnifiedPageData } from './components/PagesList';
import {
  VisualizerContainer,
  HeaderSection,
  Title,
  MainContent,
  SidebarSection,
  EmptyState,
  EmptyTitle,
  EmptyDescription,
  LoadingSpinner
} from './page.styles';

export default function VisualizerPage() {
  const [selectedPage, setSelectedPage] = useState<UnifiedPageData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);

  const { pages, loading, error, isClient, systemStatus } = useSystemDataLoader();

  const filteredPages = useMemo(() => {
    if (!searchTerm.trim()) return pages;

    const searchLower = searchTerm.toLowerCase();
    return pages.filter(page =>
      page.title.toLowerCase().includes(searchLower) ||
      page.content.toLowerCase().includes(searchLower)
    );
  }, [pages, searchTerm]);

  const handlePageSelect = (page: UnifiedPageData) => {
    setSelectedPage(page);
    setShowSidebar(false);
  };

  const handleBackToList = () => {
    setShowSidebar(true);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
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
          <SearchBar 
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
          />
          
          <PagesList
            pages={filteredPages}
            loading={loading}
            searchTerm={searchTerm}
            systemStatus={systemStatus}
            selectedPageId={selectedPage?.id || null}
            onPageSelect={handlePageSelect}
          />
        </SidebarSection>

        <ContentViewer
          selectedPage={selectedPage}
          onBack={handleBackToList}
          showSidebar={showSidebar}
        />
      </MainContent>
    </VisualizerContainer>
  );
}
