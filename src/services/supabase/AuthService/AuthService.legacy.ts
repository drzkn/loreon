/**
 * @deprecated Use @/application/services/AuthService instead
 * This file will be removed in the next major version
 * 
 * Legacy compatibility wrapper for the old AuthService
 */

import { AuthService as NewAuthService } from '@/application/services/AuthService';
import { container } from '@/infrastructure/di/container';
import type { Provider } from '@supabase/supabase-js';

export class AuthService {
  private newService: NewAuthService;

  constructor() {
    // Use the new service from the container
    this.newService = container.authService as NewAuthService;

    console.warn('⚠️ [DEPRECATED] Using legacy AuthService. Please migrate to @/application/services/AuthService');
  }

  async signInWithGoogle() {
    return await this.newService.signInWithGoogle();
  }

  async hasTokensForProvider(provider: 'notion' | 'slack' | 'github' | 'drive' | 'calendar', userId?: string) {
    return await this.newService.hasTokensForProvider(provider, userId);
  }

  async getIntegrationToken(provider: 'notion' | 'slack' | 'github' | 'drive' | 'calendar', tokenName?: string, userId?: string) {
    return await this.newService.getIntegrationToken(provider, tokenName, userId);
  }

  async signInWithProvider(provider: Provider, redirectTo?: string) {
    return await this.newService.signInWithProvider(provider, redirectTo);
  }

  async signInAnonymously() {
    return await this.newService.signInAnonymously();
  }

  async getCurrentUser() {
    return await this.newService.getCurrentUser();
  }

  async isAuthenticated() {
    return await this.newService.isAuthenticated();
  }

  async isAuthenticatedWithProvider(provider: string) {
    return await this.newService.isAuthenticatedWithProvider(provider);
  }

  async getUserProfile() {
    return await this.newService.getUserProfile();
  }

  async signOut() {
    return await this.newService.signOut();
  }

  async getSession() {
    return await this.newService.getSession();
  }
}
