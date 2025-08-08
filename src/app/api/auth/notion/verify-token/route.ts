import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.notion.com/v1/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [API] Error de Notion:', response.status, errorText);

      return NextResponse.json(
        {
          error: 'Invalid token or API error',
          details: errorText,
          status: response.status
        },
        { status: response.status }
      );
    }

    const userData = await response.json();
    console.log('✅ [API] Usuario obtenido:', userData.name);

    return NextResponse.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('💥 [API] Error en verify-token:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}