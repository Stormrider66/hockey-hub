#!/usr/bin/env node

/**
 * Translation Validation Script
 * 
 * Checks for:
 * - Missing translations
 * - TODO placeholders
 * - Structural differences between languages
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../apps/frontend/public/locales');
const NAMESPACES = [
  'common', 'player', 'coach', 'parent', 'medicalStaff', 'equipment',
  'physicalTrainer', 'clubAdmin', 'admin', 'calendar', 'training',
  'communication', 'medical', 'payment', 'errors', 'chat'
];
const LANGUAGES = [
  'en', 'sv', 'no', 'fi', 'da', 'de', 'nl', 'fr', 'it', 'es', 
  'cs', 'sk', 'pl', 'ru', 'et', 'lv', 'lt', 'hu', 'sl'
];

function getAllKeys(obj, prefix = '') {
  let keys = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

function validateNamespace(namespace) {
  console.log(`\n🔍 Validating namespace: ${namespace}`);
  
  // Load English as reference
  const enPath = path.join(LOCALES_DIR, 'en', `${namespace}.json`);
  if (!fs.existsSync(enPath)) {
    console.log(`❌ English reference file missing: ${enPath}`);
    return;
  }
  
  const enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const enKeys = new Set(getAllKeys(enContent));
  
  // Check each language
  LANGUAGES.slice(1).forEach(lang => { // Skip 'en'
    const langPath = path.join(LOCALES_DIR, lang, `${namespace}.json`);
    
    if (!fs.existsSync(langPath)) {
      console.log(`❌ ${lang}: File missing`);
      return;
    }
    
    try {
      const langContent = JSON.parse(fs.readFileSync(langPath, 'utf8'));
      const langKeys = new Set(getAllKeys(langContent));
      
      // Find missing keys
      const missingKeys = [...enKeys].filter(key => !langKeys.has(key));
      
      // Find TODO placeholders
      const langText = fs.readFileSync(langPath, 'utf8');
      const todoCount = (langText.match(/\[TODO/g) || []).length;
      
      if (missingKeys.length > 0 || todoCount > 0) {
        console.log(`⚠️  ${lang}:`);
        if (missingKeys.length > 0) {
          console.log(`   Missing keys (${missingKeys.length}): ${missingKeys.slice(0, 3).join(', ')}${missingKeys.length > 3 ? '...' : ''}`);
        }
        if (todoCount > 0) {
          console.log(`   TODO placeholders: ${todoCount}`);
        }
      } else {
        console.log(`✅ ${lang}: Complete`);
      }
    } catch (error) {
      console.log(`❌ ${lang}: JSON parse error - ${error.message}`);
    }
  });
}

function main() {
  console.log('🔍 Hockey Hub Translation Validation');
  console.log('=====================================');
  
  NAMESPACES.forEach(validateNamespace);
  
  console.log('\n📊 Summary:');
  console.log(`Languages: ${LANGUAGES.length}`);
  console.log(`Namespaces: ${NAMESPACES.length}`);
  console.log(`Total files: ${LANGUAGES.length * NAMESPACES.length}`);
}

main();