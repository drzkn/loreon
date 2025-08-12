import { Icon } from '@/components';
import { renderMarkdown } from '../../page.constants';
import type { UnifiedPageData } from '../PagesList';
import {
  ContentSection,
  BackButton,
  MarkdownContent,
  EmptyState,
  EmptyTitle,
  EmptyDescription
} from './ContentViewer.styles';

interface ContentViewerProps {
  selectedPage: UnifiedPageData | null;
  onBack: () => void;
  showSidebar: boolean;
}

export function ContentViewer({ selectedPage, onBack, showSidebar }: ContentViewerProps) {
  const renderPageContent = (page: UnifiedPageData) => {
    if (page.source === 'legacy') {
      return (
        <MarkdownContent
          dangerouslySetInnerHTML={{
            __html: renderMarkdown(page.content)
          }}
        />
      );
    } else {
      return (
        <MarkdownContent
          dangerouslySetInnerHTML={{
            __html: page.content || '<p>Sin contenido disponible</p>'
          }}
        />
      );
    }
  };

  return (
    <ContentSection hidden={showSidebar}>
      {selectedPage ? (
        <>
          <BackButton onClick={onBack}>
            <Icon name="chevron-left" /> Volver
          </BackButton>
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
  );
}
