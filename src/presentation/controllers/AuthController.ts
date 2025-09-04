import { IAuthService } from '@/application/interfaces/IAuthService';
import { ILogger } from '@/application/interfaces/ILogger';
import { SignInRequestDto, AuthResponseDto, UserProfileResponseDto } from '@/presentation/dto/AuthRequestDto';

interface UserInfo {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  provider?: string;
}

export class AuthController {
  constructor(
    private readonly authService: IAuthService,
    private readonly logger: ILogger
  ) { }

  async signInWithProvider(request: SignInRequestDto): Promise<AuthResponseDto> {
    try {
      this.logger.info('Starting provider sign-in', { provider: request.provider });

      await this.authService.signInWithProvider(request.provider, request.redirectTo);

      this.logger.info('Provider sign-in initiated successfully', { provider: request.provider });

      return {
        success: true,
        // Note: OAuth flows return redirect data, not immediate user data
      };

    } catch (error) {
      const errorMessage = `Error en autenticación con ${request.provider}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      this.logger.error('Provider sign-in failed', error as Error, { provider: request.provider });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async signInWithGoogle(): Promise<AuthResponseDto> {
    try {
      this.logger.info('Starting Google sign-in');

      await this.authService.signInWithGoogle();

      this.logger.info('Google sign-in initiated successfully');

      return {
        success: true,
        // Note: OAuth flows return redirect data, not immediate user data
      };

    } catch (error) {
      const errorMessage = `Error en autenticación con Google: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      this.logger.error('Google sign-in failed', error as Error);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async signInAnonymously(): Promise<AuthResponseDto> {
    try {
      this.logger.info('Starting anonymous sign-in');

      const result = await this.authService.signInAnonymously();

      this.logger.info('Anonymous sign-in completed successfully');

      // Extract user and session data from result
      const user = result.data?.user;
      const session = result.data?.session;

      return {
        success: true,
        user: user ? {
          id: user.id,
          email: user.email,
          name: 'Usuario Anónimo',
          provider: 'anonymous'
        } : undefined,
        session: session ? {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at
        } : undefined
      };

    } catch (error) {
      const errorMessage = `Error en autenticación anónima: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      this.logger.error('Anonymous sign-in failed', error as Error);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async getUserProfile(): Promise<UserProfileResponseDto> {
    try {
      this.logger.debug('Getting user profile');

      const profile = await this.authService.getUserProfile();

      if (!profile) {
        this.logger.warn('No user profile found - user not authenticated');
        return {
          success: false,
          error: 'Usuario no autenticado'
        };
      }

      this.logger.debug('User profile retrieved successfully', { userId: profile.id });

      return {
        success: true,
        profile: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
          provider: profile.provider,
          lastSignIn: profile.lastSignIn,
          createdAt: profile.createdAt
        }
      };

    } catch (error) {
      const errorMessage = `Error obteniendo perfil de usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      this.logger.error('Failed to get user profile', error as Error);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.info('Starting sign-out');

      await this.authService.signOut();

      this.logger.info('Sign-out completed successfully');

      return {
        success: true
      };

    } catch (error) {
      const errorMessage = `Error cerrando sesión: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      this.logger.error('Sign-out failed', error as Error);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async checkAuthentication(): Promise<{
    success: boolean;
    authenticated: boolean;
    user?: UserInfo;
    error?: string;
  }> {
    try {
      this.logger.debug('Checking authentication status');

      const isAuthenticated = await this.authService.isAuthenticated();

      let user = null;
      if (isAuthenticated) {
        const profile = await this.authService.getUserProfile();
        user = profile ? {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
          provider: profile.provider
        } : null;
      }

      this.logger.debug('Authentication check completed', {
        authenticated: isAuthenticated,
        hasProfile: !!user
      });

      return {
        success: true,
        authenticated: isAuthenticated,
        user: user || undefined
      };

    } catch (error) {
      const errorMessage = `Error verificando autenticación: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      this.logger.error('Authentication check failed', error as Error);

      return {
        success: false,
        authenticated: false,
        error: errorMessage
      };
    }
  }

  async checkProviderTokens(
    provider: 'notion' | 'slack' | 'github' | 'drive' | 'calendar'
  ): Promise<{
    success: boolean;
    hasTokens: boolean;
    error?: string;
  }> {
    try {
      this.logger.debug('Checking provider tokens', { provider });

      const hasTokens = await this.authService.hasTokensForProvider(provider);

      this.logger.debug('Provider tokens check completed', { provider, hasTokens });

      return {
        success: true,
        hasTokens
      };

    } catch (error) {
      const errorMessage = `Error verificando tokens de ${provider}: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      this.logger.error('Provider tokens check failed', error as Error, { provider });

      return {
        success: false,
        hasTokens: false,
        error: errorMessage
      };
    }
  }
}
