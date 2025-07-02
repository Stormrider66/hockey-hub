import 'reflect-metadata';
import { BaseEntity as TypeORMBaseEntity } from 'typeorm';
export declare abstract class BaseEntity extends TypeORMBaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
//# sourceMappingURL=BaseEntity.d.ts.map