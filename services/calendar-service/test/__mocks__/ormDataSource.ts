/*
  Jest mock for the TypeORM DataSource used in the service. It prevents
  TypeORM from attempting to validate entity metadata (which fails in our
  lightweight in-memory test setup).
*/

class StubQueryBuilder {
  andWhere(): this { return this; }
  leftJoinAndSelect(): this { return this; }
  innerJoinAndSelect(): this { return this; }
  orderBy(): this { return this; }
  select(): this { return this; }
  where(): this { return this; }
  getMany = async () => [];
  getOne = async () => null;
}

class StubRepository {
  createQueryBuilder = () => new StubQueryBuilder();
  find = async () => [] as any[];
  findOne = async () => null as any;
  save = async <T>(entity: T) => entity;
  delete = async () => ({ affected: 0 });
  create = <T extends object>(dto: Partial<T>) => dto as T;
}

const stubRepository = new StubRepository();

const ormDataSource = {
  isInitialized: true,
  initialize: async () => ormDataSource,
  getRepository: () => stubRepository as any,
  manager: stubRepository as any,
  query: async () => [],
  transaction: async (fn: any) => fn(stubRepository),
  destroy: async () => {},
};

export default ormDataSource as any; 