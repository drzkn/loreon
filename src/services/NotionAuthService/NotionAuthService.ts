import { UserTokenService } from '@/services/UserTokenService';

interface HttpClient {
  get(url: string, headers?: Record<string, string>): Promise<unknown>;
}

interface NotionUserResponse {
  user: NotionUser;
}

class ApiHttpClient implements HttpClient {
  constructor(private baseURL: string = '/api/auth/notion') { }

  async get(url: string, headers: Record<string, string> = {}): Promise<unknown> {
    if (url === '/users/me') {
      const token = headers['Authorization']?.replace('Bearer ', '');

      const response = await fetch(`${this.baseURL}/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as NotionUserResponse;
      return data.user;
    }

    throw new Error(`Endpoint ${url} not supported`);
  }
}

export interface NotionUser {
  id: string;
  name: string;
  avatar_url?: string;
  person?: {
    email?: string;
  };
  bot?: {
    owner?: {
      type: string;
      user?: NotionUser;
    };
  };
}

export class NotionAuthService {
  private httpClient: HttpClient;
  private userTokenService: UserTokenService;

  constructor() {
    this.httpClient = new ApiHttpClient();
    this.userTokenService = new UserTokenService();
  }

  hasUserToken(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('notion_user_token');
  }

  private cleanToken(token: string): string {
    return token.trim().replace(/^['"]+|['"]+$/g, '');
  }

  private validateTokenFormat(token: string): boolean {
    return token.startsWith('secret_') || token.startsWith('ntn_');
  }

  private saveUserToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notion_user_token', token);
    }
  }

  private getUserToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('notion_user_token');
  }

  private clearUserToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('notion_user_token');
      localStorage.removeItem('notion_user_data');
    }
  }

  async validateAndSaveUserToken(token: string): Promise<boolean> {
    try {
      const cleanedToken = this.cleanToken(token);

      if (!this.validateTokenFormat(cleanedToken)) {
        throw new Error('Formato de token inválido. Debe empezar con "secret_" o "ntn_"');
      }

      const user = await this.getCurrentNotionUser(cleanedToken);

      if (!user) {
        throw new Error('Token inválido o sin permisos');
      }

      this.saveUserToken(cleanedToken);

      console.log('✅ [NOTION AUTH] Token validado y guardado');
      return true;
    } catch (error) {
      console.error('❌ [NOTION AUTH] Error validando token:', error);
      throw error;
    }
  }

  async getCurrentNotionUser(token?: string): Promise<NotionUser | null> {
    try {
      const userToken = token || this.getUserToken();

      if (!userToken) {
        return null;
      }

      const user = await this.httpClient.get('/users/me', {
        'Authorization': `Bearer ${userToken}`
      });

      if (!user) {
        return null;
      }

      return user as NotionUser;
    } catch (error) {
      console.error('💥 [NOTION AUTH] Error obteniendo usuario:', error);

      if (error instanceof Error && error.message.includes('401')) {
        this.clearUserToken();
      }

      return null;
    }
  }

  async verifyNotionConnection(): Promise<boolean> {
    try {
      const user = await this.getCurrentNotionUser();
      return user !== null;
    } catch (error) {
      console.error('💥 [NOTION AUTH] Error verificando conexión:', error);
      return false;
    }
  }

  private saveUserData(data: unknown): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notion_user_data', JSON.stringify(data));
    }
  }

  private getUserData(): unknown | null {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem('notion_user_data');
    return data ? JSON.parse(data) : null;
  }

  async getNotionUserProfile() {
    try {
      const notionUser = await this.getCurrentNotionUser();

      if (!notionUser) {
        return null;
      }

      const profile = {
        id: notionUser.id,
        name: notionUser.name,
        email: notionUser.person?.email || null,
        avatar: notionUser.avatar_url || null,
        provider: 'notion_personal',
        isBot: !!notionUser.bot,
        ownerInfo: notionUser.bot?.owner?.user ? {
          id: notionUser.bot.owner.user.id,
          name: notionUser.bot.owner.user.name,
          email: notionUser.bot.owner.user.person?.email
        } : null
      };

      this.saveUserData(profile);

      return profile;
    } catch (error) {
      console.error('💥 [NOTION AUTH] Error obteniendo perfil:', error);

      const cachedData = this.getUserData();
      if (cachedData) {
        console.log('📱 [NOTION AUTH] Usando datos guardados localmente');
        return cachedData;
      }

      return null;
    }
  }

  async authenticateWithUserToken() {
    try {
      if (!this.hasUserToken()) {
        throw new Error('No hay token personal configurado');
      }

      const profile = await this.getNotionUserProfile();

      if (!profile) {
        throw new Error('No se pudo obtener el perfil del usuario de Notion');
      }

      return profile;
    } catch (error) {
      console.error('❌ [NOTION AUTH] Error en autenticación:', error);
      throw error;
    }
  }

  clearUserData(): void {
    this.clearUserToken();
    console.log('🗑️ [NOTION AUTH] Datos de usuario eliminados');
  }
}