import { IUserTokenService } from './interfaces/IUserTokenService';
import { UserTokenService as OriginalUserTokenService } from '@/services/UserTokenService';

export class UserTokenServiceAdapter implements IUserTokenService {
  private userTokenService: OriginalUserTokenService;

  constructor(clientSide: boolean = false) {
    this.userTokenService = new OriginalUserTokenService(clientSide);
  }

  async hasTokensForProvider(
    userId: string,
    provider: 'notion' | 'slack' | 'github' | 'drive' | 'calendar'
  ): Promise<boolean> {
    return await this.userTokenService.hasTokensForProvider(userId, provider);
  }

  async getDecryptedToken(
    userId: string,
    provider: 'notion' | 'slack' | 'github' | 'drive' | 'calendar',
    tokenName?: string
  ): Promise<string | null> {
    return await this.userTokenService.getDecryptedToken(userId, provider, tokenName);
  }
}
