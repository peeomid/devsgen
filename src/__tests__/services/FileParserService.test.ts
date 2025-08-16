import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileParserService } from '../../services/FileParserService';

// Mock FileReader
global.FileReader = class MockFileReader {
  onload: ((event: any) => void) | null = null;
  onerror: (() => void) | null = null;
  
  readAsText(file: File) {
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: { result: file.name.includes('test') ? 'line1\nline2\nline3' : 'col1,col2\nval1,val2' } });
      }
    }, 0);
  }
} as any;

describe('FileParserService', () => {
  let service: FileParserService;
  let mockFile: File;

  beforeEach(() => {
    service = new FileParserService();
    mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
  });

  describe('parseFile', () => {
    it('should parse a text file successfully', async () => {
      const textFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(textFile, 'size', { value: 1000 });
      
      const result = await service.parseFile(textFile);
      
      expect(result.fileInfo.type).toBe('text');
      expect(result.fileInfo.name).toBe('test.txt');
      expect(result.data.lines).toEqual(['line1', 'line2', 'line3']);
      expect(result.fileInfo.lineCount).toBe(3);
    });

    it('should parse a CSV file successfully', async () => {
      const csvFile = new File(['col1,col2\nval1,val2'], 'test.csv', { type: 'text/csv' });
      Object.defineProperty(csvFile, 'size', { value: 1000 });
      
      const result = await service.parseFile(csvFile);
      
      expect(result.fileInfo.type).toBe('csv');
      expect(result.fileInfo.name).toBe('test.csv');
      expect(result.data.csvData).toEqual([['col1', 'col2'], ['val1', 'val2']]);
      expect(result.data.headers).toEqual(['col1', 'col2']);
      expect(result.delimiter).toBe(',');
    });

    it('should reject files that are too large', async () => {
      const largeFile = new File(['content'], 'large.txt', { type: 'text/plain' });
      Object.defineProperty(largeFile, 'size', { value: 10 * 1024 * 1024 }); // 10MB
      
      await expect(service.parseFile(largeFile)).rejects.toThrow('File size exceeds maximum limit');
    });

    it('should reject files with too many lines', async () => {
      const manyLinesContent = Array(15000).fill('line').join('\n');
      const manyLinesFile = new File([manyLinesContent], 'many.txt', { type: 'text/plain' });
      
      // Mock FileReader to return many lines
      global.FileReader = class MockFileReader {
        onload: ((event: any) => void) | null = null;
        
        readAsText() {
          setTimeout(() => {
            if (this.onload) {
              this.onload({ target: { result: manyLinesContent } });
            }
          }, 0);
        }
      } as any;
      
      await expect(service.parseFile(manyLinesFile)).rejects.toThrow('exceeds the maximum limit of 10000 lines');
    });
  });

  describe('parseText', () => {
    it('should parse plain text successfully', () => {
      const text = 'line1\nline2\nline3';
      
      const result = service.parseText(text);
      
      expect(result.fileInfo.type).toBe('text');
      expect(result.fileInfo.name).toBe('Pasted Text');
      expect(result.data.lines).toEqual(['line1', 'line2', 'line3']);
      expect(result.fileInfo.lineCount).toBe(3);
    });

    it('should detect and parse CSV text', () => {
      const csvText = 'name,age,city\nJohn,25,NYC\nJane,30,LA';
      
      const result = service.parseText(csvText);
      
      expect(result.fileInfo.type).toBe('csv');
      expect(result.data.csvData).toEqual([
        ['name', 'age', 'city'],
        ['John', '25', 'NYC'],
        ['Jane', '30', 'LA']
      ]);
      expect(result.data.headers).toEqual(['name', 'age', 'city']);
    });

    it('should reject text with too many lines', () => {
      const manyLinesText = Array(15000).fill('line').join('\n');
      
      expect(() => service.parseText(manyLinesText)).toThrow('exceeds the maximum limit of 10000 lines');
    });
  });

  describe('detectFileType', () => {
    it('should detect CSV files by extension', () => {
      const csvFile = new File(['content'], 'test.csv', { type: 'text/csv' });
      const lines = ['col1,col2', 'val1,val2'];
      
      const result = service.detectFileType(csvFile, lines);
      
      expect(result).toBe('csv');
    });

    it('should detect TSV files by extension', () => {
      const tsvFile = new File(['content'], 'test.tsv', { type: 'text/tab-separated-values' });
      const lines = ['col1\tcol2', 'val1\tval2'];
      
      const result = service.detectFileType(tsvFile, lines);
      
      expect(result).toBe('csv');
    });

    it('should detect CSV by content pattern', () => {
      const textFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const lines = ['name,age,city', 'John,25,NYC', 'Jane,30,LA'];
      
      const result = service.detectFileType(textFile, lines);
      
      expect(result).toBe('csv');
    });

    it('should default to text for non-CSV content', () => {
      const textFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const lines = ['This is a regular text file', 'with multiple lines', 'of content'];
      
      const result = service.detectFileType(textFile, lines);
      
      expect(result).toBe('text');
    });
  });

  describe('extractCSVHeaders', () => {
    it('should extract headers from first line with comma delimiter', () => {
      const lines = ['name,age,city', 'John,25,NYC'];
      
      const result = service.extractCSVHeaders(lines, ',');
      
      expect(result).toEqual(['name', 'age', 'city']);
    });

    it('should extract headers with tab delimiter', () => {
      const lines = ['name\tage\tcity', 'John\t25\tNYC'];
      
      const result = service.extractCSVHeaders(lines, '\t');
      
      expect(result).toEqual(['name', 'age', 'city']);
    });

    it('should handle quoted headers', () => {
      const lines = ['"First Name","Last Name","Age"', 'John,Doe,25'];
      
      const result = service.extractCSVHeaders(lines, ',');
      
      expect(result).toEqual(['First Name', 'Last Name', 'Age']);
    });

    it('should return empty array for empty lines', () => {
      const result = service.extractCSVHeaders([], ',');
      
      expect(result).toEqual([]);
    });
  });

  describe('static methods', () => {
    it('should return correct max file size', () => {
      expect(FileParserService.getMaxFileSize()).toBe(5 * 1024 * 1024);
    });

    it('should return correct max lines', () => {
      expect(FileParserService.getMaxLines()).toBe(10000);
    });

    it('should return supported delimiters', () => {
      const delimiters = FileParserService.getSupportedDelimiters();
      expect(delimiters).toEqual([',', ';', '\t', '|']);
    });
  });

  describe('edge cases', () => {
    it('should handle empty files', async () => {
      const emptyFile = new File([''], 'empty.txt', { type: 'text/plain' });
      
      // Mock FileReader to return empty content
      global.FileReader = class MockFileReader {
        onload: ((event: any) => void) | null = null;
        
        readAsText() {
          setTimeout(() => {
            if (this.onload) {
              this.onload({ target: { result: '' } });
            }
          }, 0);
        }
      } as any;
      
      const result = await service.parseFile(emptyFile);
      
      expect(result.fileInfo.lineCount).toBe(0);
      expect(result.data.lines).toEqual([]);
    });

    it('should handle files with only whitespace', () => {
      const whitespaceText = '   \n  \t  \n   ';
      
      const result = service.parseText(whitespaceText);
      
      expect(result.fileInfo.lineCount).toBe(0);
      expect(result.data.lines).toEqual([]);
    });

    it('should handle CSV with inconsistent column counts', () => {
      const inconsistentCSV = 'col1,col2,col3\nval1,val2\nval3,val4,val5,val6';
      
      const result = service.parseText(inconsistentCSV);
      
      // Should still parse as CSV but with varying column counts
      expect(result.fileInfo.type).toBe('csv');
      expect(result.data.csvData).toBeDefined();
    });

    it('should handle different line endings', () => {
      const mixedLineEndings = 'line1\rline2\nline3\r\nline4';
      
      const result = service.parseText(mixedLineEndings);
      
      expect(result.data.lines).toEqual(['line1', 'line2', 'line3', 'line4']);
    });
  });
});