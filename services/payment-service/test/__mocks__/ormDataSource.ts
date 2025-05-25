/* Jest mock for TypeORM DataSource in Payment Service */
class StubQueryBuilder {
  andWhere() { return this; }
  leftJoinAndSelect() { return this; }
  innerJoinAndSelect() { return this; }
  orderBy() { return this; }
  select() { return this; }
  where() { return this; }
  getMany = async () => [];
  getOne = async () => null;
}

class StubRepository {
  createQueryBuilder = () => new StubQueryBuilder();
  find = async () => [] as any[];
  findOne = async () => null as any;
  save = async <T>(entity: T) => entity;
  update = async () => ({});
  delete = async () => ({ affected: 0 });
  create = <T extends object>(dto: Partial<T>) => dto as T;
}

const repo = new StubRepository();

const dataSource = {
  isInitialized: true,
  initialize: async () => dataSource,
  getRepository: () => repo as any,
  manager: repo as any,
  query: async () => [],
  transaction: async (fn: any) => fn(repo),
  destroy: async () => {},
};

export default dataSource as any; 