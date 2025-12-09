import { Exercise, SessionTemplate } from '../types';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Type definitions for export/import
export interface ExportOptions {
  format: 'json' | 'csv' | 'excel' | 'pdf';
  includeMetadata?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: {
    category?: string;
    players?: string[];
    teams?: string[];
  };
}

export interface ImportResult<T> {
  success: boolean;
  data?: T[];
  errors?: string[];
  duplicates?: T[];
}

export interface ExportData {
  version: string;
  exportDate: string;
  type: string;
  data: any[];
  metadata?: {
    totalCount: number;
    filters?: any;
  };
}

// Exercise Export/Import Functions
export async function exportExercises(
  exercises: Exercise[],
  options: ExportOptions
): Promise<void> {
  const exportData: ExportData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    type: 'exercises',
    data: exercises,
    metadata: {
      totalCount: exercises.length,
      filters: options.filters
    }
  };

  switch (options.format) {
    case 'json':
      exportToJSON(exportData, 'exercises_export');
      break;
    case 'csv':
      exportExercisesToCSV(exercises, 'exercises_export');
      break;
    case 'excel':
      exportExercisesToExcel(exercises, 'exercises_export');
      break;
    case 'pdf':
      exportExercisesToPDF(exercises, 'exercises_export');
      break;
  }
}

export async function importExercises(
  file: File,
  existingExercises: Exercise[]
): Promise<ImportResult<Exercise>> {
  try {
    const fileType = file.name.split('.').pop()?.toLowerCase();
    let exercises: Exercise[] = [];

    if (fileType === 'json') {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Handle both direct array and wrapped export format
      if (Array.isArray(data)) {
        exercises = data;
      } else if (data.type === 'exercises' && Array.isArray(data.data)) {
        exercises = data.data;
      } else {
        throw new Error('Invalid JSON format');
      }
    } else if (fileType === 'csv') {
      exercises = await parseCSVToExercises(file);
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      exercises = await parseExcelToExercises(file);
    } else {
      throw new Error('Unsupported file format');
    }

    // Validate exercises
    const errors: string[] = [];
    const validExercises: Exercise[] = [];
    const duplicates: Exercise[] = [];

    exercises.forEach((exercise, index) => {
      if (!exercise.name) {
        errors.push(`Row ${index + 1}: Exercise name is required`);
        return;
      }
      if (!exercise.category) {
        errors.push(`Row ${index + 1}: Exercise category is required`);
        return;
      }

      // Check for duplicates
      const isDuplicate = existingExercises.some(
        ex => ex.name.toLowerCase() === exercise.name.toLowerCase() &&
             ex.category === exercise.category
      );

      if (isDuplicate) {
        duplicates.push(exercise);
      } else {
        validExercises.push(exercise);
      }
    });

    return {
      success: errors.length === 0,
      data: validExercises,
      errors: errors.length > 0 ? errors : undefined,
      duplicates: duplicates.length > 0 ? duplicates : undefined
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    };
  }
}

// Template Export/Import Functions
export async function exportTemplates(
  templates: SessionTemplate[],
  options: ExportOptions
): Promise<void> {
  const exportData: ExportData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    type: 'templates',
    data: templates,
    metadata: {
      totalCount: templates.length,
      filters: options.filters
    }
  };

  switch (options.format) {
    case 'json':
      exportToJSON(exportData, 'templates_export');
      break;
    case 'csv':
      exportTemplatesToCSV(templates, 'templates_export');
      break;
    case 'excel':
      exportTemplatesToExcel(templates, 'templates_export');
      break;
    case 'pdf':
      exportTemplatesToPDF(templates, 'templates_export');
      break;
  }
}

export async function importTemplates(
  file: File,
  existingTemplates: SessionTemplate[]
): Promise<ImportResult<SessionTemplate>> {
  try {
    const fileType = file.name.split('.').pop()?.toLowerCase();
    let templates: SessionTemplate[] = [];

    if (fileType === 'json') {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (Array.isArray(data)) {
        templates = data;
      } else if (data.type === 'templates' && Array.isArray(data.data)) {
        templates = data.data;
      } else {
        throw new Error('Invalid JSON format');
      }
    } else {
      throw new Error('Templates can only be imported from JSON files');
    }

    // Validate templates
    const errors: string[] = [];
    const validTemplates: SessionTemplate[] = [];
    const duplicates: SessionTemplate[] = [];

    templates.forEach((template, index) => {
      if (!template.name) {
        errors.push(`Template ${index + 1}: Name is required`);
        return;
      }
      if (!template.type) {
        errors.push(`Template ${index + 1}: Type is required`);
        return;
      }

      // Check for duplicates
      const isDuplicate = existingTemplates.some(
        t => t.name.toLowerCase() === template.name.toLowerCase()
      );

      if (isDuplicate) {
        duplicates.push(template);
      } else {
        validTemplates.push(template);
      }
    });

    return {
      success: errors.length === 0,
      data: validTemplates,
      errors: errors.length > 0 ? errors : undefined,
      duplicates: duplicates.length > 0 ? duplicates : undefined
    };
  } catch (error) {
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    };
  }
}

// Helper Functions
function exportToJSON(data: any, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.json`);
}

function exportExercisesToCSV(exercises: Exercise[], filename: string): void {
  const headers = ['Name', 'Category', 'Sets', 'Reps', 'Duration', 'Distance', 'Weight', 'Notes'];
  const rows = exercises.map(ex => [
    ex.name,
    ex.category,
    ex.sets || '',
    ex.reps || '',
    ex.duration || '',
    ex.distance || '',
    ex.weight || '',
    ex.notes || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportExercisesToExcel(exercises: Exercise[], filename: string): void {
  const workbook = XLSX.utils.book_new();
  
  const worksheetData = [
    ['Name', 'Category', 'Sets', 'Reps', 'Duration', 'Distance', 'Weight', 'Notes'],
    ...exercises.map(ex => [
      ex.name,
      ex.category,
      ex.sets || '',
      ex.reps || '',
      ex.duration || '',
      ex.distance || '',
      ex.weight || '',
      ex.notes || ''
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Exercises');
  
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

function exportExercisesToPDF(exercises: Exercise[], filename: string): void {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Exercise Library Export', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 14, 30);
  doc.text(`Total Exercises: ${exercises.length}`, 14, 36);

  const tableData = exercises.map(ex => [
    ex.name,
    ex.category,
    ex.sets || '-',
    ex.reps || '-',
    ex.duration ? `${ex.duration}s` : '-',
    ex.distance || '-',
    ex.weight || '-'
  ]);

  (doc as any).autoTable({
    head: [['Name', 'Category', 'Sets', 'Reps', 'Duration', 'Distance', 'Weight']],
    body: tableData,
    startY: 45,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] }
  });

  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
}

function exportTemplatesToCSV(templates: SessionTemplate[], filename: string): void {
  const headers = ['Name', 'Type', 'Duration', 'Target Players', 'Description', 'Exercise Count'];
  const rows = templates.map(t => [
    t.name,
    t.type,
    `${t.duration} min`,
    t.targetPlayers,
    t.description,
    t.exercises.length.toString()
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportTemplatesToExcel(templates: SessionTemplate[], filename: string): void {
  const workbook = XLSX.utils.book_new();
  
  // Summary sheet
  const summaryData = [
    ['Name', 'Type', 'Duration', 'Target Players', 'Description', 'Exercise Count'],
    ...templates.map(t => [
      t.name,
      t.type,
      `${t.duration} min`,
      t.targetPlayers,
      t.description,
      t.exercises.length
    ])
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Templates');
  
  // Individual template sheets
  templates.forEach((template, index) => {
    const exerciseData = [
      ['Exercise Name', 'Duration', 'Intensity'],
      ...template.exercises.map(ex => [
        ex.name,
        `${ex.duration} min`,
        ex.intensity
      ])
    ];
    
    const exerciseSheet = XLSX.utils.aoa_to_sheet(exerciseData);
    const sheetName = `Template_${index + 1}`.substring(0, 31); // Excel sheet name limit
    XLSX.utils.book_append_sheet(workbook, exerciseSheet, sheetName);
  });
  
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

function exportTemplatesToPDF(templates: SessionTemplate[], filename: string): void {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text('Session Templates Export', 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 14, 30);
  doc.text(`Total Templates: ${templates.length}`, 14, 36);

  let yPosition = 45;

  templates.forEach((template, index) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.text(`${index + 1}. ${template.name}`, 14, yPosition);
    yPosition += 6;

    doc.setFontSize(10);
    doc.text(`Type: ${template.type} | Duration: ${template.duration} min | Target: ${template.targetPlayers}`, 14, yPosition);
    yPosition += 6;
    
    doc.text(`Description: ${template.description}`, 14, yPosition);
    yPosition += 10;
  });

  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
}

async function parseCSVToExercises(file: File): Promise<Exercise[]> {
  const text = await file.text();
  const lines = text.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  const exercises: Exercise[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const exercise: any = {};
    
    headers.forEach((header, index) => {
      const value = values[index];
      const key = header.toLowerCase().replace(' ', '_');
      
      if (value && value !== '') {
        if (['sets', 'reps', 'duration', 'distance', 'weight'].includes(key)) {
          exercise[key] = parseInt(value, 10) || undefined;
        } else {
          exercise[key] = value;
        }
      }
    });
    
    if (exercise.name && exercise.category) {
      exercises.push(exercise as Exercise);
    }
  }
  
  return exercises;
}

async function parseExcelToExercises(file: File): Promise<Exercise[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
  return jsonData.map((row: any) => ({
    id: row.id || Date.now() + Math.random(),
    name: row.Name || row.name,
    category: row.Category || row.category,
    sets: parseInt(row.Sets || row.sets) || undefined,
    reps: parseInt(row.Reps || row.reps) || undefined,
    duration: parseInt(row.Duration || row.duration) || undefined,
    distance: parseInt(row.Distance || row.distance) || undefined,
    weight: parseInt(row.Weight || row.weight) || undefined,
    notes: row.Notes || row.notes,
    orderIndex: 0
  }));
}

// Test Data Export Functions
export async function exportTestData(
  testData: any[],
  options: ExportOptions & { testType?: string }
): Promise<void> {
  const exportData: ExportData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    type: `test_data_${options.testType || 'all'}`,
    data: testData,
    metadata: {
      totalCount: testData.length,
      filters: options.filters
    }
  };

  switch (options.format) {
    case 'json':
      exportToJSON(exportData, `test_data_${options.testType || 'all'}_export`);
      break;
    case 'csv':
      exportTestDataToCSV(testData, `test_data_${options.testType || 'all'}_export`);
      break;
    case 'excel':
      exportTestDataToExcel(testData, `test_data_${options.testType || 'all'}_export`);
      break;
    case 'pdf':
      exportTestDataToPDF(testData, `test_data_${options.testType || 'all'}_export`, options.testType);
      break;
  }
}

function exportTestDataToCSV(testData: any[], filename: string): void {
  if (testData.length === 0) return;

  // Extract headers from first item
  const headers = Object.keys(testData[0]);
  const rows = testData.map(item => 
    headers.map(header => item[header]?.toString() || '')
  );

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportTestDataToExcel(testData: any[], filename: string): void {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(testData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Data');
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

function exportTestDataToPDF(testData: any[], filename: string, testType?: string): void {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text(`${testType || 'Test'} Data Export`, 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 14, 30);
  doc.text(`Total Records: ${testData.length}`, 14, 36);

  if (testData.length > 0) {
    const headers = Object.keys(testData[0]);
    const tableData = testData.map(item => 
      headers.map(header => item[header]?.toString() || '-')
    );

    (doc as any).autoTable({
      head: [headers],
      body: tableData,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });
  }

  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
}