export class UserTokenService {
  private static readonly TOKEN_KEY = 'loreon_notion_token';
  private static readonly USER_DATA_KEY = 'loreon_user_data';

  // Guardar token del usuario
  static saveUserToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
      console.log('✅ Token de usuario guardado localmente');
    }
  }

  // Obtener token del usuario
  static getUserToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  // Verificar si hay token guardado
  static hasUserToken(): boolean {
    return this.getUserToken() !== null;
  }

  // Eliminar token del usuario (logout)
  static clearUserToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_DATA_KEY);
      console.log('🗑️ Token de usuario eliminado');
    }
  }

  // Guardar datos del usuario (después de obtenerlos de Notion)
  static saveUserData(userData: any): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
    }
  }

  // Obtener datos del usuario guardados
  static getUserData(): any | null {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(this.USER_DATA_KEY);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  // Validar formato de token (básico)
  static validateTokenFormat(token: string): boolean {
    // Los tokens de Notion pueden empezar con "secret_" o "ntn_" dependiendo del tipo
    return (token.startsWith('secret_') || token.startsWith('ntn_')) && token.length > 20;
  }

  // Limpiar token (remover espacios, etc.)
  static cleanToken(token: string): string {
    return token.trim();
  }
}