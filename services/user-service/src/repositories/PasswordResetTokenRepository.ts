export class PasswordResetTokenRepository {
  async create(data?: any): Promise<any> {
    return { id: 'reset-id', used: false, ...(data || {}) };
  }
  async findOne(_query?: any): Promise<any> {
    return null;
  }
  async save(_entity: any): Promise<any> {
    return {};
  }
}



