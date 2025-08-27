export class RefreshTokenRepository {
  async create(data?: any): Promise<any> {
    return { id: 'token-id', ...(data || {}) };
  }
  async findOne(_query?: any): Promise<any> {
    return null;
  }
  async save(_entity: any): Promise<any> {
    return {};
  }
  async invalidateToken(_token: string): Promise<void> {}
  async invalidateAllUserTokens(_userId: string): Promise<void> {}
}



