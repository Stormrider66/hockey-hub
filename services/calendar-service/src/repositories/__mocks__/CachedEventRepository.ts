// Manual Jest mock for CachedEventRepository used by service unit tests
// Provides the methods the tests expect to spy on
export class CachedEventRepository {
  create = jest.fn();
  save = jest.fn();
  findOne = jest.fn();
  findAndCount = jest.fn();
  getUpcomingEventsForUser = jest.fn();
  checkConflicts = jest.fn();
  findEventsByOrganization = jest.fn();
  findEventsByTeam = jest.fn();
  findEventsByDateRange = jest.fn();
  findConflictingEvents = jest.fn();
  find = jest.fn();
  createQueryBuilder = jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    getOne: jest.fn(),
  }));
}


