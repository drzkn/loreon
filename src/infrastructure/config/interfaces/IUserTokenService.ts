export interface IUserTokenService {
  hasTokensForProvider(
    userId: string,
    provider: 'notion' | 'slack' | 'github' | 'drive' | 'calendar'
  ): Promise<boolean>;
  getDecryptedToken(
    userId: string,
    provider: 'notion' | 'slack' | 'github' | 'drive' | 'calendar',
    tokenName?: string
  ): Promise<string | null>;
}
