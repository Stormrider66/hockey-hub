#!/usr/bin/env node

/**
 * Translation Update Helper Script
 * 
 * Usage:
 * node scripts/update-translations.js <namespace> <key-path> <english-text>
 * 
 * Example:
 * node scripts/update-translations.js common "newFeature.title" "New Feature"
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../apps/frontend/public/locales');
const LANGUAGES = [
  'sv', 'no', 'fi', 'da', 'de', 'nl', 'fr', 'it', 'es', 
  'cs', 'sk', 'pl', 'ru', 'et', 'lv', 'lt', 'hu', 'sl'
];

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}

function updateTranslation(lang, namespace, keyPath, englishText) {
  const filePath = path.join(LOCALES_DIR, lang, `${namespace}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const translations = JSON.parse(content);
    
    // Add placeholder with English text and [TODO] marker
    const placeholder = `[TODO: Translate] ${englishText}`;
    setNestedValue(translations, keyPath, placeholder);
    
    fs.writeFileSync(filePath, JSON.stringify(translations, null, 2) + '\n');
    console.log(`✅ Updated ${lang}/${namespace}.json`);
  } catch (error) {
    console.error(`❌ Error updating ${lang}/${namespace}.json:`, error.message);
  }
}

function main() {
  const [,, namespace, keyPath, englishText] = process.argv;
  
  if (!namespace || !keyPath || !englishText) {
    console.log('Usage: node update-translations.js <namespace> <key-path> <english-text>');
    console.log('Example: node update-translations.js common "newFeature.title" "New Feature"');
    process.exit(1);
  }
  
  console.log(`🔄 Adding translation key: ${keyPath}`);
  console.log(`📝 English text: ${englishText}`);
  console.log(`📁 Namespace: ${namespace}`);
  console.log('');
  
  LANGUAGES.forEach(lang => {
    updateTranslation(lang, namespace, keyPath, englishText);
  });
  
  console.log('');
  console.log('🎯 Next steps:');
  console.log('1. Replace [TODO: Translate] placeholders with actual translations');
  console.log('2. Test the translations in the UI');
  console.log('3. Commit the changes');
}

main();