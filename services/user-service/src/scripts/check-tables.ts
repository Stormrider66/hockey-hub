import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import AppDataSource from '../data-source';

async function checkTables() {
  try {
    await AppDataSource.initialize();
    console.log('Connected to database');
    
    // Query to list all tables in the public schema
    const tables = await AppDataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('\nExisting tables in database:');
    console.log('----------------------------');
    tables.forEach((table: any) => {
      console.log(`- ${table.table_name}`);
    });
    
    if (tables.length === 0) {
      console.log('No tables found! Migrations need to be run.');
    }
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTables(); 