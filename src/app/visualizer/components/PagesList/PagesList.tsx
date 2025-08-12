import { Icon } from '@/components';
import {
  PagesListContainer,
  PageItem,
  PageTitle,
  PagePreview,
  PageDate,
  EmptyState,
  EmptyTitle,
  EmptyDescription,
  LoadingSpinner
} from './PagesList.styles';

export interface UnifiedPageData {
  id: string;
  title: string;
  content: string;
  source: 'native' | 'legacy';
  notion_id?: string;
  url?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemStatus {
  nativePages: number;
  legacyPages: number;
  selectedSystem: 'native' | 'legacy' | 'none';
  error?: string;
}

interface PagesListProps {
  pages: UnifiedPageData[];
  loading: boolean;
  searchTerm: string;
  systemStatus: SystemStatus;
  selectedPageId: string | null;
  onPageSelect: (page: UnifiedPageData) => void;
}

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
    .replace(/<[^>]*>/g, '')
    .replace(/[#*`\[\]]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .substring(0, 120);
};

export function PagesList({
  pages,
  loading,
  searchTerm,
  systemStatus,
  selectedPageId,
  onPageSelect
}: PagesListProps) {
  if (loading) {
    return (
      <PagesListContainer>
        <LoadingSpinner>Cargando páginas...</LoadingSpinner>
      </PagesListContainer>
    );
  }

  if (pages.length === 0) {
    return (
      <PagesListContainer>
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
      </PagesListContainer>
    );
  }

  return (
    <PagesListContainer>
      {pages.map((page) => (
        <PageItem
          key={page.id}
          $isSelected={selectedPageId === page.id}
          onClick={() => onPageSelect(page)}
        >
          <PageTitle>{page.title}</PageTitle>
          <PagePreview>{getPreviewText(page.content)}</PagePreview>
          <PageDate>
            Actualizado: {formatDate(page.updated_at)}
          </PageDate>
        </PageItem>
      ))}
    </PagesListContainer>
  );
}
