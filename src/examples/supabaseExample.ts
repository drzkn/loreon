import 'dotenv/config';
import { container } from '../infrastructure/di/container';

async function supabaseExample() {
  try {
    console.log('🚀 Iniciando ejemplo de Supabase...');

    // Obtener servicios del contenedor
    const { supabaseMarkdownService, getPageUseCase } = container;

    // ID de página de ejemplo - reemplaza con tu ID de página real
    const pageId = '1a5dac88-dee4-805a-9fcc-c1527c8bcf0e';

    console.log(`📄 Obteniendo página de Notion: ${pageId}`);

    // Obtener página de Notion
    const page = await getPageUseCase.execute(pageId);

    if (!page) {
      throw new Error('No se pudo obtener la página');
    }

    console.log(`✅ Página obtenida: ${page.properties?.title || 'Sin título'}`);

    // Convertir y guardar en Supabase
    console.log('💾 Convirtiendo y guardando en Supabase...');
    const savedPage = await supabaseMarkdownService.convertAndSavePage(page, true);

    console.log('✅ Página guardada exitosamente en Supabase:');
    console.log(`   - ID: ${savedPage.id}`);
    console.log(`   - Título: ${savedPage.title}`);
    console.log(`   - Notion ID: ${savedPage.notion_page_id}`);
    console.log(`   - Tags: ${savedPage.tags.join(', ') || 'Sin tags'}`);
    console.log(`   - Contenido: ${savedPage.content.substring(0, 100)}...`);

    // Buscar páginas guardadas
    console.log('\n🔍 Buscando páginas guardadas...');
    const allPages = await supabaseMarkdownService.getAllStoredPages({ limit: 5 });
    console.log(`Encontradas ${allPages.length} páginas:`);

    allPages.forEach((storedPage, index) => {
      console.log(`   ${index + 1}. ${storedPage.title} (${storedPage.notion_page_id})`);
    });

    // Buscar por texto
    console.log('\n🔎 Buscando páginas por texto...');
    const searchResults = await supabaseMarkdownService.searchStoredPages('notion', { limit: 3 });
    console.log(`Resultados de búsqueda: ${searchResults.length} páginas`);

    searchResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.title}`);
    });

    console.log('\n🎉 Ejemplo completado exitosamente!');

  } catch (error) {
    console.error('❌ Error en el ejemplo de Supabase:', error);

    if (error instanceof Error) {
      console.error('Mensaje de error:', error.message);

      // Ayuda para errores comunes
      if (error.message.includes('SUPABASE_URL')) {
        console.log('\n💡 Asegúrate de configurar las variables de entorno:');
        console.log('   - VITE_SUPABASE_URL o SUPABASE_URL');
        console.log('   - VITE_SUPABASE_ANON_KEY o SUPABASE_ANON_KEY');
      }

      if (error.message.includes('tu-notion-page-id-aqui')) {
        console.log('\n💡 Reemplaza "tu-notion-page-id-aqui" con un ID de página real de Notion');
      }
    }
  }
}

// Ejecutar el ejemplo si este archivo se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  supabaseExample();
}

export { supabaseExample }; 