import { DataSource } from 'typeorm';
import { 
  Injury, 
  Treatment, 
  MedicalReport, 
  WellnessEntry, 
  PlayerAvailability, 
  ReturnToPlayProtocol, 
  RehabilitationSession,
  InjuryCorrelation,
  RecoveryTracking,
  MedicalPerformanceCorrelation
} from '../entities';

const isTest = process.env.NODE_ENV === 'test';

let CurrentDataSource: DataSource | null = null;

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5437'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: isTest ? process.env.DB_TEST_NAME || 'medical_test' : (process.env.DB_NAME || 'medical'),
  synchronize: isTest || process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [
    Injury,
    Treatment,
    MedicalReport,
    WellnessEntry,
    PlayerAvailability,
    ReturnToPlayProtocol,
    RehabilitationSession,
    InjuryCorrelation,
    RecoveryTracking,
    MedicalPerformanceCorrelation
  ],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
});

CurrentDataSource = AppDataSource;

export function getDataSource(): DataSource {
  return CurrentDataSource ?? AppDataSource;
}

// Test-only setter to override data source
export function __setDataSource(ds: DataSource | null): void {
  CurrentDataSource = ds;
}