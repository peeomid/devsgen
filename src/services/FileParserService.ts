import type { FileData } from '../types/database';

export interface ParsedFile {
  data: {
    lines?: string[];
    csvData?: string[][];
    headers?: string[];
  };
  fileInfo: Omit<FileData, 'uploadedAt'>;
  delimiter?: string;
}

export class FileParserService {
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly MAX_LINES = 10000;
  private static readonly CSV_DELIMITERS = [',', ';', '\t', '|'];

  async parseFile(file: File, hasHeaders: boolean = true): Promise<ParsedFile> {
    this.validateFile(file);
    
    const content = await this.readFileContent(file);
    const lines = this.splitIntoLines(content);
    
    this.validateLineCount(lines);
    
    const fileType = this.detectFileType(file, lines);
    const fileId = this.generateFileId(file);
    
    if (fileType === 'csv') {
      const { csvData, headers, delimiter } = this.parseCSV(lines, hasHeaders);
      
      return {
        data: {
          csvData,
          headers
        },
        fileInfo: {
          id: fileId,
          name: file.name,
          type: 'csv',
          size: file.size,
          lineCount: csvData.length, // This is now correct (data rows only)
          headers
        },
        delimiter
      };
    } else {
      return {
        data: {
          lines
        },
        fileInfo: {
          id: fileId,
          name: file.name,
          type: 'text',
          size: file.size,
          lineCount: lines.length
        }
      };
    }
  }

  parseText(text: string, hasHeaders: boolean = true): ParsedFile {
    const lines = this.splitIntoLines(text);
    this.validateLineCount(lines);
    
    const fileType = this.detectTextType(lines);
    const fileId = this.generateTextId();
    
    if (fileType === 'csv') {
      const { csvData, headers, delimiter } = this.parseCSV(lines, hasHeaders);
      
      return {
        data: {
          csvData,
          headers
        },
        fileInfo: {
          id: fileId,
          name: 'Pasted Text',
          type: 'csv',
          size: text.length,
          lineCount: csvData.length, // This is now correct (data rows only)
          headers
        },
        delimiter
      };
    } else {
      return {
        data: {
          lines
        },
        fileInfo: {
          id: fileId,
          name: 'Pasted Text',
          type: 'text',
          size: text.length,
          lineCount: lines.length
        }
      };
    }
  }

  detectFileType(file: File, lines: string[]): 'text' | 'csv' {
    const extension = file.name.toLowerCase().split('.').pop();
    
    if (extension === 'csv' || extension === 'tsv') {
      return 'csv';
    }
    
    return this.detectTextType(lines);
  }

  private detectTextType(lines: string[]): 'text' | 'csv' {
    if (lines.length === 0) return 'text';
    
    const sampleSize = Math.min(5, lines.length);
    const sampleLines = lines.slice(0, sampleSize);
    
    for (const delimiter of FileParserService.CSV_DELIMITERS) {
      if (this.looksLikeCSV(sampleLines, delimiter)) {
        return 'csv';
      }
    }
    
    return 'text';
  }

  private looksLikeCSV(lines: string[], delimiter: string): boolean {
    if (lines.length < 2) return false;
    
    const columnCounts = lines.map(line => line.split(delimiter).length);
    const firstCount = columnCounts[0];
    
    if (firstCount < 2) return false;
    
    const consistentColumns = columnCounts.every(count => count === firstCount);
    return consistentColumns;
  }

  extractCSVHeaders(lines: string[], delimiter: string = ',', hasHeaders: boolean = true): string[] {
    if (lines.length === 0) return [];
    
    if (hasHeaders) {
      return lines[0].split(delimiter).map(header => header.trim().replace(/^["']|["']$/g, ''));
    } else {
      // Generate column names when no headers
      const columnCount = lines[0].split(delimiter).length;
      return Array.from({ length: columnCount }, (_, i) => `Column ${i + 1}`);
    }
  }

  private parseCSV(lines: string[], hasHeaders: boolean = true): { csvData: string[][]; headers: string[]; delimiter: string } {
    let bestDelimiter = ',';
    let maxColumns = 0;
    
    for (const delimiter of FileParserService.CSV_DELIMITERS) {
      if (lines.length > 0) {
        const columns = lines[0].split(delimiter).length;
        if (columns > maxColumns && this.looksLikeCSV(lines.slice(0, Math.min(3, lines.length)), delimiter)) {
          maxColumns = columns;
          bestDelimiter = delimiter;
        }
      }
    }
    
    const headers = this.extractCSVHeaders(lines, bestDelimiter, hasHeaders);
    
    // Skip the first line only if it contains headers
    const dataLines = hasHeaders ? lines.slice(1) : lines;
    const csvData = dataLines.map(line => 
      line.split(bestDelimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
    );
    
    return { csvData, headers, delimiter: bestDelimiter };
  }

  private validateFile(file: File): void {
    if (file.size > FileParserService.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum limit of ${FileParserService.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
  }

  private validateLineCount(lines: string[]): void {
    if (lines.length > FileParserService.MAX_LINES) {
      throw new Error(`File contains ${lines.length} lines, which exceeds the maximum limit of ${FileParserService.MAX_LINES} lines`);
    }
  }

  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error('Failed to read file content'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('File reading failed'));
      };
      
      reader.readAsText(file);
    });
  }

  private splitIntoLines(content: string): string[] {
    return content
      .split(/\r?\n/)
      .filter(line => line.trim().length > 0);
  }

  private generateFileId(file: File): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${file.name.replace(/[^a-zA-Z0-9]/g, '')}`;
  }

  private generateTextId(): string {
    return `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getMaxFileSize(): number {
    return FileParserService.MAX_FILE_SIZE;
  }

  static getMaxLines(): number {
    return FileParserService.MAX_LINES;
  }

  static getSupportedDelimiters(): string[] {
    return [...FileParserService.CSV_DELIMITERS];
  }

  reParseCSV(lines: string[], hasHeaders: boolean): { csvData: string[][]; headers: string[]; delimiter: string } {
    return this.parseCSV(lines, hasHeaders);
  }
}

export const fileParserService = new FileParserService();