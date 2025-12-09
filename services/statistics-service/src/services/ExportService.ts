import { Injectable } from '@nestjs/common';
import { ReportTemplate, ReportSection, ReportFilters } from '../entities/ReportTemplate';
import * as PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface ExportOptions {
  template: ReportTemplate;
  sections: ReportSection[];
  data: Map<string, any>;
  format: 'pdf' | 'excel' | 'csv' | 'html';
  filters: ReportFilters;
}

export interface ExportResult {
  buffer: Buffer;
  filePath: string;
  downloadUrl: string;
  metadata: {
    fileSize: number;
    pageCount?: number;
    sheetCount?: number;
    format: string;
  };
}

@Injectable()
export class ExportService {
  private readonly exportDir = path.join(process.cwd(), 'storage', 'exports');

  constructor() {
    this.ensureExportDirectory();
  }

  async generateExport(options: ExportOptions): Promise<ExportResult> {
    switch (options.format) {
      case 'pdf':
        return await this.generatePDFExport(options);
      case 'excel':
        return await this.generateExcelExport(options);
      case 'csv':
        return await this.generateCSVExport(options);
      case 'html':
        return await this.generateHTMLExport(options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private async generatePDFExport(options: ExportOptions): Promise<ExportResult> {
    const doc = new PDFDocument({
      size: options.template.layout.format.toUpperCase() as any,
      layout: options.template.layout.orientation,
      margins: {
        top: options.template.layout.margins.top,
        bottom: options.template.layout.margins.bottom,
        left: options.template.layout.margins.left,
        right: options.template.layout.margins.right
      }
    });

    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));

    // Set document properties
    doc.info.Title = options.template.name;
    doc.info.Author = options.template.metadata.author;
    doc.info.Subject = options.template.description || '';
    doc.info.CreationDate = new Date();

    // Add header if configured
    if (options.template.layout.header?.enabled) {
      this.addPDFHeader(doc, options);
    }

    // Add sections
    let yPosition = doc.page.margins.top + (options.template.layout.header?.height || 0);
    
    for (const section of options.sections) {
      yPosition = await this.addPDFSection(doc, section, yPosition, options);
      
      // Check if we need a new page
      if (yPosition > doc.page.height - doc.page.margins.bottom - 50) {
        doc.addPage();
        yPosition = doc.page.margins.top;
      }
    }

    // Add footer if configured
    if (options.template.layout.footer?.enabled) {
      this.addPDFFooter(doc, options);
    }

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', async () => {
        try {
          const buffer = Buffer.concat(chunks);
          const fileName = `${options.template.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
          const filePath = path.join(this.exportDir, fileName);
          
          await fs.writeFile(filePath, buffer);
          
          resolve({
            buffer,
            filePath,
            downloadUrl: `/api/exports/${fileName}`,
            metadata: {
              fileSize: buffer.length,
              pageCount: (doc as any).bufferedPageRange().count,
              format: 'pdf'
            }
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private async generateExcelExport(options: ExportOptions): Promise<ExportResult> {
    const workbook = new ExcelJS.Workbook();
    workbook.properties.title = options.template.name;
    workbook.properties.subject = options.template.description || '';
    workbook.properties.creator = options.template.metadata.author;
    workbook.properties.created = new Date();

    // Create main worksheet
    const worksheet = workbook.addWorksheet('Report');
    
    // Set column widths
    worksheet.columns = [
      { width: 20 }, { width: 30 }, { width: 15 }, { width: 15 }, { width: 20 }
    ];

    let currentRow = 1;

    // Add title
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = options.template.name;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    currentRow += 2;

    // Add filter information
    if (options.filters.dateRange) {
      const filterCell = worksheet.getCell(`A${currentRow}`);
      filterCell.value = `Period: ${options.filters.dateRange.start.toLocaleDateString()} - ${options.filters.dateRange.end.toLocaleDateString()}`;
      filterCell.font = { italic: true };
      currentRow += 1;
    }
    
    currentRow += 1;

    // Add sections
    for (const section of options.sections) {
      currentRow = await this.addExcelSection(worksheet, section, currentRow, options);
      currentRow += 2; // Add spacing between sections
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer() as Buffer;
    const fileName = `${options.template.name.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
    const filePath = path.join(this.exportDir, fileName);
    
    await fs.writeFile(filePath, buffer);

    return {
      buffer,
      filePath,
      downloadUrl: `/api/exports/${fileName}`,
      metadata: {
        fileSize: buffer.length,
        sheetCount: workbook.worksheets.length,
        format: 'excel'
      }
    };
  }

  private async generateCSVExport(options: ExportOptions): Promise<ExportResult> {
    const csvData: string[] = [];
    
    // Add header
    csvData.push(`"${options.template.name}"`);
    csvData.push(''); // Empty line
    
    if (options.filters.dateRange) {
      csvData.push(`"Period: ${options.filters.dateRange.start.toLocaleDateString()} - ${options.filters.dateRange.end.toLocaleDateString()}"`);
      csvData.push(''); // Empty line
    }

    // Add sections
    for (const section of options.sections) {
      csvData.push(`"${section.title || 'Section'}"`);
      
      if (section.type === 'table' && section.content) {
        // Add table headers
        const headers = section.content.headers || [];
        csvData.push(headers.map((h: string) => `"${h}"`).join(','));
        
        // Add table rows
        const rows = section.content.rows || [];
        for (const row of rows) {
          const csvRow = headers.map((header: string) => {
            const value = row[header] || '';
            return `"${value.toString().replace(/"/g, '""')}"`;
          }).join(',');
          csvData.push(csvRow);
        }
      } else if (section.type === 'metric' && section.content) {
        csvData.push(`"${section.content.label}","${section.content.value}"`);
      } else if (section.content) {
        csvData.push(`"${section.content.toString()}"`);
      }
      
      csvData.push(''); // Empty line between sections
    }

    const csvContent = csvData.join('\n');
    const buffer = Buffer.from(csvContent, 'utf8');
    const fileName = `${options.template.name.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    const filePath = path.join(this.exportDir, fileName);
    
    await fs.writeFile(filePath, buffer);

    return {
      buffer,
      filePath,
      downloadUrl: `/api/exports/${fileName}`,
      metadata: {
        fileSize: buffer.length,
        format: 'csv'
      }
    };
  }

  private async generateHTMLExport(options: ExportOptions): Promise<ExportResult> {
    const theme = options.template.layout.theme || {
      primaryColor: '#4F46E5',
      secondaryColor: '#6B7280',
      fontFamily: 'Arial',
      fontSize: 12
    };

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.template.name}</title>
    <style>
        body {
            font-family: ${theme.fontFamily}, sans-serif;
            font-size: ${theme.fontSize}px;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .report-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid ${theme.primaryColor};
            padding-bottom: 20px;
        }
        .report-title {
            color: ${theme.primaryColor};
            font-size: 28px;
            font-weight: bold;
            margin: 0;
        }
        .report-description {
            color: ${theme.secondaryColor};
            margin: 10px 0;
        }
        .filter-info {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .section {
            margin: 30px 0;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
        }
        .section-title {
            color: ${theme.primaryColor};
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        .metric-value {
            font-size: 36px;
            font-weight: bold;
            color: ${theme.primaryColor};
            text-align: center;
        }
        .metric-label {
            color: ${theme.secondaryColor};
            text-align: center;
            margin-top: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th, td {
            border: 1px solid #e5e7eb;
            padding: 12px;
            text-align: left;
        }
        th {
            background: ${theme.primaryColor};
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background: #f8fafc;
        }
        .chart-placeholder {
            background: #f3f4f6;
            border: 2px dashed #d1d5db;
            height: 300px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${theme.secondaryColor};
            border-radius: 8px;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: ${theme.secondaryColor};
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="report-header">
        <h1 class="report-title">${options.template.name}</h1>
        ${options.template.description ? `<p class="report-description">${options.template.description}</p>` : ''}
    </div>

    ${options.filters.dateRange ? `
    <div class="filter-info">
        <strong>Report Period:</strong> ${options.filters.dateRange.start.toLocaleDateString()} - ${options.filters.dateRange.end.toLocaleDateString()}
    </div>
    ` : ''}

    ${options.sections.map(section => this.generateHTMLSection(section)).join('')}

    <div class="footer">
        Generated on ${new Date().toLocaleString()}<br>
        ${options.template.metadata.author ? `By ${options.template.metadata.author}` : ''}
    </div>
</body>
</html>`;

    const buffer = Buffer.from(html, 'utf8');
    const fileName = `${options.template.name.replace(/\s+/g, '_')}_${Date.now()}.html`;
    const filePath = path.join(this.exportDir, fileName);
    
    await fs.writeFile(filePath, buffer);

    return {
      buffer,
      filePath,
      downloadUrl: `/api/exports/${fileName}`,
      metadata: {
        fileSize: buffer.length,
        format: 'html'
      }
    };
  }

  private addPDFHeader(doc: any, options: ExportOptions): void {
    const header = options.template.layout.header;
    if (!header) return;

    doc.fontSize(14).text(header.content, doc.page.margins.left, doc.page.margins.top);
  }

  private addPDFFooter(doc: any, options: ExportOptions): void {
    const footer = options.template.layout.footer;
    if (!footer) return;

    const footerY = doc.page.height - doc.page.margins.bottom - footer.height;
    doc.fontSize(10).text(footer.content, doc.page.margins.left, footerY);
  }

  private async addPDFSection(doc: any, section: ReportSection, yPosition: number, options: ExportOptions): Promise<number> {
    const theme = options.template.layout.theme;
    let currentY = yPosition;

    // Add section title
    if (section.title) {
      doc.fontSize(14).fillColor(theme?.primaryColor || '#000').text(section.title, doc.page.margins.left, currentY);
      currentY += 25;
    }

    // Add section content based on type
    switch (section.type) {
      case 'text':
        doc.fontSize(12).fillColor('#000').text(section.content || '', doc.page.margins.left, currentY);
        currentY += 20;
        break;
        
      case 'metric':
        if (section.content) {
          doc.fontSize(24).fillColor(theme?.primaryColor || '#000')
             .text(section.content.value.toString(), doc.page.margins.left, currentY);
          currentY += 30;
          if (section.content.label) {
            doc.fontSize(10).fillColor('#666')
               .text(section.content.label, doc.page.margins.left, currentY);
            currentY += 15;
          }
        }
        break;
        
      case 'table':
        if (section.content && section.content.headers && section.content.rows) {
          currentY = this.addPDFTable(doc, section.content, currentY);
        }
        break;
        
      case 'chart':
        // Add placeholder for chart
        doc.fontSize(12).fillColor('#666')
           .text('[Chart: Chart would be rendered here in full implementation]', doc.page.margins.left, currentY);
        currentY += 100; // Space for chart
        break;
    }

    return currentY + 20; // Add spacing after section
  }

  private addPDFTable(doc: any, tableContent: any, yPosition: number): number {
    const headers = tableContent.headers || [];
    const rows = tableContent.rows || [];
    const columnWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / headers.length;
    
    let currentY = yPosition;
    
    // Add headers
    doc.fontSize(10).fillColor('#000');
    let xPosition = doc.page.margins.left;
    
    for (const header of headers) {
      doc.text(header, xPosition, currentY, { width: columnWidth, align: 'left' });
      xPosition += columnWidth;
    }
    currentY += 20;
    
    // Add rows
    for (const row of rows.slice(0, 20)) { // Limit rows to prevent overflow
      xPosition = doc.page.margins.left;
      for (const header of headers) {
        const value = row[header] || '';
        doc.text(value.toString(), xPosition, currentY, { width: columnWidth, align: 'left' });
        xPosition += columnWidth;
      }
      currentY += 15;
    }
    
    return currentY;
  }

  private async addExcelSection(worksheet: any, section: ReportSection, startRow: number, options: ExportOptions): Promise<number> {
    let currentRow = startRow;

    // Add section title
    if (section.title) {
      const titleCell = worksheet.getCell(`A${currentRow}`);
      titleCell.value = section.title;
      titleCell.font = { bold: true, size: 14 };
      worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
      currentRow += 1;
    }

    // Add section content
    switch (section.type) {
      case 'text':
        worksheet.getCell(`A${currentRow}`).value = section.content || '';
        currentRow += 1;
        break;
        
      case 'metric':
        if (section.content) {
          worksheet.getCell(`A${currentRow}`).value = section.content.label || 'Metric';
          const valueCell = worksheet.getCell(`B${currentRow}`);
          valueCell.value = section.content.value;
          valueCell.font = { bold: true, size: 16 };
          currentRow += 1;
        }
        break;
        
      case 'table':
        if (section.content && section.content.headers && section.content.rows) {
          currentRow = this.addExcelTable(worksheet, section.content, currentRow);
        }
        break;
        
      case 'chart':
        worksheet.getCell(`A${currentRow}`).value = '[Chart data would be rendered here]';
        currentRow += 1;
        break;
    }

    return currentRow;
  }

  private addExcelTable(worksheet: any, tableContent: any, startRow: number): number {
    const headers = tableContent.headers || [];
    const rows = tableContent.rows || [];
    let currentRow = startRow;

    // Add headers
    headers.forEach((header: string, index: number) => {
      const cell = worksheet.getCell(currentRow, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE5E7EB' }
      };
    });
    currentRow += 1;

    // Add rows
    for (const row of rows) {
      headers.forEach((header: string, index: number) => {
        worksheet.getCell(currentRow, index + 1).value = row[header] || '';
      });
      currentRow += 1;
    }

    return currentRow;
  }

  private generateHTMLSection(section: ReportSection): string {
    let content = '';

    content += `<div class="section">`;
    
    if (section.title) {
      content += `<h2 class="section-title">${section.title}</h2>`;
    }

    switch (section.type) {
      case 'text':
        content += `<p>${section.content || ''}</p>`;
        break;
        
      case 'metric':
        if (section.content) {
          content += `
            <div class="metric-value">${section.content.value}</div>
            <div class="metric-label">${section.content.label || ''}</div>
          `;
        }
        break;
        
      case 'table':
        if (section.content && section.content.headers && section.content.rows) {
          content += this.generateHTMLTable(section.content);
        }
        break;
        
      case 'chart':
        content += `<div class="chart-placeholder">Chart would be rendered here</div>`;
        break;
        
      default:
        content += `<p>${section.content || ''}</p>`;
    }

    content += `</div>`;
    return content;
  }

  private generateHTMLTable(tableContent: any): string {
    const headers = tableContent.headers || [];
    const rows = tableContent.rows || [];

    let html = '<table>';
    
    // Add headers
    html += '<thead><tr>';
    for (const header of headers) {
      html += `<th>${header}</th>`;
    }
    html += '</tr></thead>';
    
    // Add rows
    html += '<tbody>';
    for (const row of rows) {
      html += '<tr>';
      for (const header of headers) {
        html += `<td>${row[header] || ''}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody>';
    
    html += '</table>';
    return html;
  }

  private async ensureExportDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.exportDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create export directory:', error);
    }
  }
}