import { UserTokenService } from '@/services/UserTokenService';

// Interfaz para cliente HTTP simple
interface HttpClient {
  get(url: string, headers?: Record<string, string>): Promise<any>;
}

// Cliente HTTP simple para requests a Notion
class SimpleHttpClient implements HttpClient {
  constructor(private baseURL: string = 'https://api.notion.com/v1') { }

  async get(url: string, headers: Record<string, string> = {}): Promise<any> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
        ...headers
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
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

  constructor() {
    this.httpClient = new SimpleHttpClient();
  }

  // Verificar si el usuario tiene un token guardado
  hasUserToken(): boolean {
    return UserTokenService.hasUserToken();
  }

  // Validar y guardar token del usuario
  async validateAndSaveUserToken(token: string): Promise<boolean> {
    try {
      console.log('🔍 [NOTION AUTH] Validando token del usuario...');

      // Limpiar token
      const cleanedToken = UserTokenService.cleanToken(token);

      // Validar formato básico
      if (!UserTokenService.validateTokenFormat(cleanedToken)) {
        throw new Error('Formato de token inválido. Debe empezar con "secret_" o "ntn_"');
      }

      // Probar el token haciendo una llamada a la API
      const user = await this.getCurrentNotionUser(cleanedToken);

      if (!user) {
        throw new Error('Token inválido o sin permisos');
      }

      // Si llegamos aquí, el token es válido
      UserTokenService.saveUserToken(cleanedToken);

      console.log('✅ [NOTION AUTH] Token validado y guardado');
      return true;
    } catch (error) {
      console.error('❌ [NOTION AUTH] Error validando token:', error);
      throw error;
    }
  }

  // Obtener usuario actual de Notion usando token del usuario
  async getCurrentNotionUser(token?: string): Promise<NotionUser | null> {
    try {
      const userToken = token || UserTokenService.getUserToken();

      if (!userToken) {
        console.log('❌ [NOTION AUTH] No hay token de usuario disponible');
        return null;
      }

      console.log('🔍 [NOTION AUTH] Obteniendo usuario de Notion con token personal...');

      const user = await this.httpClient.get('/users/me', {
        'Authorization': `Bearer ${userToken}`
      });

      if (!user) {
        console.log('❌ [NOTION AUTH] No se pudo obtener usuario de Notion');
        return null;
      }

      console.log('✅ [NOTION AUTH] Usuario obtenido:', user.name);
      return user;
    } catch (error) {
      console.error('💥 [NOTION AUTH] Error obteniendo usuario:', error);

      // Si hay error de autenticación, limpiar token inválido
      if (error instanceof Error && error.message.includes('401')) {
        console.log('🗑️ [NOTION AUTH] Token inválido, limpiando...');
        UserTokenService.clearUserToken();
      }

      return null;
    }
  }

  // Verificar conexión con Notion
  async verifyNotionConnection(): Promise<boolean> {
    try {
      const user = await this.getCurrentNotionUser();
      return user !== null;
    } catch (error) {
      console.error('💥 [NOTION AUTH] Error verificando conexión:', error);
      return false;
    }
  }

  // Obtener perfil completo del usuario
  async getNotionUserProfile() {
    try {
      const notionUser = await this.getCurrentNotionUser();

      if (!notionUser) {
        return null;
      }

      // Extraer información del usuario
      const profile = {
        id: notionUser.id,
        name: notionUser.name,
        email: notionUser.person?.email || null,
        avatar: notionUser.avatar_url || null,
        provider: 'notion_personal',
        isBot: !!notionUser.bot,
        // Si es un bot, intentar obtener info del owner
        ownerInfo: notionUser.bot?.owner?.user ? {
          id: notionUser.bot.owner.user.id,
          name: notionUser.bot.owner.user.name,
          email: notionUser.bot.owner.user.person?.email
        } : null
      };

      // Guardar datos del usuario para uso offline
      UserTokenService.saveUserData(profile);

      return profile;
    } catch (error) {
      console.error('💥 [NOTION AUTH] Error obteniendo perfil:', error);

      // Si hay error, intentar usar datos guardados
      const cachedData = UserTokenService.getUserData();
      if (cachedData) {
        console.log('📱 [NOTION AUTH] Usando datos guardados localmente');
        return cachedData;
      }

      return null;
    }
  }

  // Autenticar con token personal
  async authenticateWithUserToken() {
    try {
      console.log('🔐 [NOTION AUTH] Autenticando con token personal...');

      if (!this.hasUserToken()) {
        throw new Error('No hay token personal configurado');
      }

      const profile = await this.getNotionUserProfile();

      if (!profile) {
        throw new Error('No se pudo obtener el perfil del usuario de Notion');
      }

      console.log('✅ [NOTION AUTH] Autenticación exitosa:', profile.name);
      return profile;
    } catch (error) {
      console.error('❌ [NOTION AUTH] Error en autenticación:', error);
      throw error;
    }
  }

  // Limpiar datos del usuario (logout)
  clearUserData(): void {
    UserTokenService.clearUserToken();
    console.log('🗑️ [NOTION AUTH] Datos de usuario eliminados');
  }
}