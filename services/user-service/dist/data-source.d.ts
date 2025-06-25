import 'reflect-metadata';
import { DataSource, DataSourceOptions, DefaultNamingStrategy } from 'typeorm';
export declare class SnakeCaseNamingStrategy extends DefaultNamingStrategy {
    tableName(targetName: string, userSpecifiedName: string | undefined): string;
    columnName(propertyName: string, customName: string | undefined): string;
}
export declare const dataSourceOptions: DataSourceOptions;
declare const AppDataSource: DataSource;
export default AppDataSource;
//# sourceMappingURL=data-source.d.ts.map