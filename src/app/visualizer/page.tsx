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
import { TempDebug } from './debug-temp';
import { Icon } from '@/components';

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

      console.log('🔍 [VISUALIZER] Iniciando carga de páginas...');
      console.log('🔍 [VISUALIZER] Variables disponibles:', {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'CONFIGURADA' : 'NO CONFIGURADA'
      });

      const loadedPages = await repository.findAll({ limit: 1000 });
      console.log('✅ [VISUALIZER] Páginas cargadas:', loadedPages.length);

      setPages(loadedPages.sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      ));

      if (loadedPages.length > 0 && !selectedPage) {
        setSelectedPage(loadedPages[0]);
      }
    } catch (err) {
      console.error('❌ [VISUALIZER] Error cargando páginas:', err);
      console.error('❌ [VISUALIZER] Error stack:', err instanceof Error ? err.stack : 'No stack');
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

  const renderMarkdown = (content: string) => {
    console.log('🔍 [renderMarkdown] Input:', content.substring(0, 200));

    let result = content;
    const imageStore: Record<string, string> = {};
    let imageCounter = 0;

    // PASO 1: Proteger imágenes - reemplazarlas con placeholders
    result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, (match, alt, src) => {
      console.log('🖼️ [renderMarkdown] Imagen encontrada:', { alt, src });
      const cleanSrc = src.trim();
      const cleanAlt = alt.trim() || 'Imagen';

      // No escapar la URL (mantenerla intacta), solo el alt text
      const escapedAlt = cleanAlt.replace(/"/g, '&quot;');

      // Función para crear un handler de error más detallado
      const errorHandler = `
        console.error('❌ Error cargando imagen:', this.src); 
        console.error('❌ Detalles del error:', {
          src: this.src,
          naturalWidth: this.naturalWidth,
          naturalHeight: this.naturalHeight,
          complete: this.complete
        });
        
        // Verificar si es un error de URL expirada
        fetch(this.src, { method: 'HEAD' })
          .then(response => {
            if (response.status === 403) {
              console.warn('🕐 URL de imagen expirada de Notion:', this.src);
              this.nextElementSibling.innerHTML = '⏰ URL de imagen expirada<br><small>Las imágenes de Notion expiran después de 1 hora.<br>Ejecuta una nueva sincronización para obtener URLs frescas.</small>';
            } else {
              console.log('🔍 Respuesta HTTP para imagen:', {
                url: this.src,
                status: response.status,
                statusText: response.statusText,
                contentType: response.headers.get('content-type'),
                contentLength: response.headers.get('content-length')
              });
              this.nextElementSibling.innerHTML = '❌ Error cargando imagen: ${escapedAlt}<br><small>Status: ' + response.status + ' - ' + response.statusText + '</small>';
            }
          })
          .catch(err => {
            console.error('🚫 Error haciendo fetch a imagen:', err);
            this.nextElementSibling.innerHTML = '🚫 Error de conexión<br><small>No se pudo verificar la imagen</small>';
          });
        
        // Mostrar error inmediatamente
        if (!this.hasAttribute('data-fallback-attempted')) {
          this.setAttribute('data-fallback-attempted', 'true');
          this.style.display='none'; 
          this.nextElementSibling.style.display='block';
          this.nextElementSibling.style.background='rgba(255,140,0,0.1)';
          this.nextElementSibling.style.borderColor='#ff8c00';
          this.nextElementSibling.style.color='#ff8c00';
        }
      `;

      const loadHandler = `
        console.log('✅ Imagen cargada exitosamente:', this.src);
        this.nextElementSibling.style.display='none';
      `;

      const imageHtml = `<div class="markdown-image-container" style="text-align: center; margin: 1.5rem 0; padding: 1rem; border: 2px dashed #10b981; border-radius: 8px;">
        <img 
          src="${cleanSrc}" 
          alt="${escapedAlt}" 
          style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);" 
          onError="${errorHandler}"
          onLoad="${loadHandler}"
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
        />
        <div style="display: block; text-align: center; padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 8px; color: #10b981; border: 1px solid #10b981;">
          🔄 Cargando imagen: ${escapedAlt}
        </div>
      </div>`;

      const placeholder = `___IMAGE_PLACEHOLDER_${imageCounter}___`;
      imageStore[placeholder] = imageHtml;
      imageCounter++;

      console.log('🏗️ [renderMarkdown] Imagen protegida con placeholder:', placeholder);
      return placeholder;
    });

    // PASO 2: Procesar texto normal (sin romper las imágenes)
    // Encabezados
    result = result.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    result = result.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    result = result.replace(/^### (.*$)/gim, '<h3>$1</h3>');

    // Texto con formato básico
    result = result.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    result = result.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    result = result.replace(/`(.*?)`/gim, '<code>$1</code>');

    // Enlaces
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>');

    // Párrafos básicos
    result = result.replace(/\n\n/gim, '</p><p>');
    result = result.replace(/\n/gim, '<br>');
    result = result.replace(/^(.+)/gim, '<p>$1</p>');
    result = result.replace(/<p><\/p>/gim, '');

    // Limpiar párrafos mal formados
    result = result.replace(/<p>\s*(<h[1-6]>)/gim, '$1');
    result = result.replace(/(<\/h[1-6]>)\s*<\/p>/gim, '$1');

    // Limpiar párrafos que solo contienen placeholders de imagen
    result = result.replace(/<p>(___IMAGE_PLACEHOLDER_\d+___)<\/p>/gim, '$1');

    // PASO 3: Restaurar las imágenes
    Object.keys(imageStore).forEach(placeholder => {
      result = result.replace(placeholder, imageStore[placeholder]);
    });

    console.log('✅ [renderMarkdown] Output:', result.substring(0, 200));
    return result;
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