import { NextRequest, NextResponse } from 'next/server';

const NOTION_BASE_URL = 'https://api.notion.com/v1';

interface RouteContext {
  params: Promise<{
    path: string[];
  }>;
}

async function proxyToNotion(request: NextRequest, path: string[]) {
  try {
    // Obtener API key del servidor (no expuesta al cliente)
    const notionApiKey = process.env.VITE_NOTION_API_KEY || process.env.NOTION_API_KEY;

    if (!notionApiKey) {
      return NextResponse.json(
        { error: 'Notion API key not configured on server' },
        { status: 500 }
      );
    }

    // Construir la URL de destino
    const targetPath = path.join('/');
    const url = new URL(`${NOTION_BASE_URL}/${targetPath}`);

    // Agregar parámetros de query si existen
    const searchParams = request.nextUrl.searchParams;
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });

    // Preparar headers para Notion
    const headers: HeadersInit = {
      'Authorization': `Bearer ${notionApiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    };

    // Configurar opciones de fetch
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    // Incluir body para requests POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const body = await request.text();
        if (body) {
          fetchOptions.body = body;
        }
      } catch (error) {
        console.error('Error reading request body:', error);
      }
    }

    // Hacer la llamada a Notion
    const response = await fetch(url.toString(), fetchOptions);

    // Obtener el contenido de la respuesta
    const data = await response.text();

    // Crear la respuesta del proxy manteniendo el status code
    const proxyResponse = new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
    });

    // Copiar headers relevantes
    const headersToProxy = ['content-type'];
    headersToProxy.forEach(headerName => {
      const headerValue = response.headers.get(headerName);
      if (headerValue) {
        proxyResponse.headers.set(headerName, headerValue);
      }
    });

    // Agregar headers CORS para desarrollo
    proxyResponse.headers.set('Access-Control-Allow-Origin', '*');
    proxyResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    proxyResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return proxyResponse;

  } catch (error) {
    console.error('Proxy error:', error);

    return NextResponse.json(
      {
        error: 'Proxy error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxyToNotion(request, path);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxyToNotion(request, path);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxyToNotion(request, path);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxyToNotion(request, path);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;
  return proxyToNotion(request, path);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 