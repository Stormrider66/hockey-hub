#!/usr/bin/env node

/**
 * Mock data generator for Medical Analytics testing
 * Creates sample injuries, availability records, and wellness entries
 */

const { createConnection } = require('typeorm');
const { Injury, PlayerAvailability, WellnessEntry } = require('./dist/entities');

const mockPlayers = [
  'player-5', 'player-3', 'player-7', 'player-10', 'player-12', 'player-15',
  'player-18', 'player-22', 'player-24', 'player-27', 'player-31', 'player-33'
];

const injuryTypes = [
  'Concussion', 'Muscle Strain', 'Sprained Ankle', 'Knee Injury', 'Shoulder Injury',
  'Groin Strain', 'Hip Flexor', 'Lower Back', 'Wrist Fracture', 'Broken Nose'
];

const bodyParts = [
  'Head', 'Shoulder', 'Knee', 'Ankle', 'Groin', 'Hip', 'Back', 'Wrist', 'Nose', 'Hamstring'
];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function generateMockData() {
  console.log('🏥 Generating Medical Analytics Mock Data');
  console.log('=========================================\n');

  try {
    // Connect to database
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'postgres',
      database: process.env.DB_NAME || 'hockey_medical',
      entities: ['dist/entities/*.js'],
      synchronize: false
    });

    console.log('✅ Connected to database');

    // Clear existing data
    await connection.query('TRUNCATE TABLE injuries CASCADE');
    await connection.query('TRUNCATE TABLE player_availability CASCADE'); 
    await connection.query('TRUNCATE TABLE wellness_entries CASCADE');
    console.log('✅ Cleared existing data');

    // Generate injuries
    const injuries = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    for (let i = 0; i < 20; i++) {
      const injuryDate = randomDate(oneYearAgo, new Date());
      const expectedReturn = new Date(injuryDate);
      expectedReturn.setDate(injuryDate.getDate() + Math.random() * 60 + 7); // 7-67 days

      const injury = {
        id: `injury-${i + 1}`,
        playerId: randomElement(mockPlayers),
        injuryType: randomElement(injuryTypes),
        injuryDate,
        recoveryStatus: Math.random() > 0.3 ? 'active' : Math.random() > 0.5 ? 'recovering' : 'recovered',
        expectedReturnDate: expectedReturn,
        severityLevel: Math.floor(Math.random() * 5) + 1,
        bodyPart: randomElement(bodyParts),
        mechanismOfInjury: 'Training incident',
        isActive: Math.random() > 0.2,
        notes: `Mock injury for testing purposes`,
        createdAt: injuryDate,
        updatedAt: injuryDate
      };
      injuries.push(injury);
    }

    await connection.createQueryBuilder()
      .insert()
      .into('injuries')
      .values(injuries)
      .execute();
    
    console.log(`✅ Generated ${injuries.length} injuries`);

    // Generate player availability records
    const availabilityRecords = [];
    for (const playerId of mockPlayers) {
      const status = Math.random() > 0.8 ? 'injured' : 
                    Math.random() > 0.9 ? 'load_management' : 'available';
      
      const effectiveDate = randomDate(thirtyDaysAgo, new Date());
      const availability = {
        id: `avail-${playerId}`,
        playerId,
        effectiveDate,
        availabilityStatus: status,
        reason: status === 'injured' ? 'Active injury' : status === 'load_management' ? 'Preventive measure' : null,
        expectedReturnDate: status !== 'available' ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
        medicalClearanceRequired: status === 'injured',
        clearanceProvided: false,
        restrictions: status !== 'available' ? ['No contact drills', 'Limited ice time'] : [],
        isCurrent: true,
        createdAt: effectiveDate,
        updatedAt: effectiveDate
      };
      availabilityRecords.push(availability);
    }

    await connection.createQueryBuilder()
      .insert()
      .into('player_availability')
      .values(availabilityRecords)
      .execute();
    
    console.log(`✅ Generated ${availabilityRecords.length} availability records`);

    // Generate wellness entries  
    const wellnessEntries = [];
    for (let i = 0; i < 100; i++) {
      const entryDate = randomDate(thirtyDaysAgo, new Date());
      const wellness = {
        id: `wellness-${i + 1}`,
        playerId: randomElement(mockPlayers),
        entryDate,
        energyLevel: Math.floor(Math.random() * 10) + 1,
        sleepQuality: Math.floor(Math.random() * 10) + 1,
        stressLevel: Math.floor(Math.random() * 10) + 1,
        sorenessLevel: Math.floor(Math.random() * 10) + 1,
        overallWellness: Math.floor(Math.random() * 10) + 1,
        notes: Math.random() > 0.7 ? 'Feeling good today' : null,
        createdAt: entryDate,
        updatedAt: entryDate
      };
      wellnessEntries.push(wellness);
    }

    await connection.createQueryBuilder()
      .insert()
      .into('wellness_entries')
      .values(wellnessEntries)
      .execute();
    
    console.log(`✅ Generated ${wellnessEntries.length} wellness entries`);

    await connection.close();
    console.log('✅ Database connection closed');

    console.log('\n🎉 Mock data generation complete!');
    console.log('You can now run the test script: node test-medical-analytics.js');

  } catch (error) {
    console.error('❌ Error generating mock data:', error.message);
    if (error.query) {
      console.error('Query:', error.query);
    }
    process.exit(1);
  }
}

// Run the mock data generator
generateMockData();