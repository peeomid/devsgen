import Dexie, { type Table } from 'dexie';
import type { FileData, Line, CSVLine, DatabaseSchema } from '../types/database';

interface OriginalLines {
  id: number;
  fileId: string;
  lines: string[];
}

class LineFilterDatabase extends Dexie {
  files!: Table<FileData, string>;
  lines!: Table<Line, number>;
  csvLines!: Table<CSVLine, number>;
  originalLines!: Table<OriginalLines, number>;

  constructor() {
    super('LineFilterDB');
    
    this.version(1).stores({
      files: 'id, name, type, uploadedAt',
      lines: '++id, lineNumber',
      csvLines: '++id, lineNumber'
    });
    
    this.version(2).stores({
      files: 'id, name, type, uploadedAt',
      lines: '++id, lineNumber',
      csvLines: '++id, lineNumber',
      originalLines: '++id, fileId'
    });
  }
}

export class DatabaseService {
  private db: LineFilterDatabase;

  constructor() {
    this.db = new LineFilterDatabase();
  }

  async storeTextLines(fileId: string, lines: string[]): Promise<void> {
    try {
      const lineObjects: Omit<Line, 'id'>[] = lines.map((content, index) => ({
        content,
        lineNumber: index + 1
      }));

      await this.db.transaction('rw', this.db.lines, async () => {
        await this.db.lines.clear();
        await this.db.lines.bulkAdd(lineObjects);
      });
    } catch (error) {
      throw new Error(`Failed to store text lines: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async storeCSVLines(fileId: string, csvData: string[][], headers?: string[]): Promise<void> {
    try {
      const csvLineObjects: Omit<CSVLine, 'id'>[] = csvData.map((data, index) => ({
        lineNumber: index + 1,
        data,
        originalContent: data.join(',')
      }));

      await this.db.transaction('rw', this.db.csvLines, async () => {
        await this.db.csvLines.clear();
        await this.db.csvLines.bulkAdd(csvLineObjects);
      });
    } catch (error) {
      throw new Error(`Failed to store CSV lines: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async storeFileData(fileData: FileData): Promise<void> {
    try {
      await this.db.files.put(fileData);
    } catch (error) {
      throw new Error(`Failed to store file data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFileData(fileId: string): Promise<FileData | undefined> {
    try {
      return await this.db.files.get(fileId);
    } catch (error) {
      throw new Error(`Failed to get file data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTextLines(limit?: number, offset?: number): Promise<Line[]> {
    try {
      let query = this.db.lines.orderBy('lineNumber');
      
      if (offset) {
        query = query.offset(offset);
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      return await query.toArray();
    } catch (error) {
      throw new Error(`Failed to get text lines: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCSVLines(limit?: number, offset?: number): Promise<CSVLine[]> {
    try {
      let query = this.db.csvLines.orderBy('lineNumber');
      
      if (offset) {
        query = query.offset(offset);
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      return await query.toArray();
    } catch (error) {
      throw new Error(`Failed to get CSV lines: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getLinesByNumbers(lineNumbers: number[], type: 'text' | 'csv'): Promise<(Line | CSVLine)[]> {
    try {
      if (type === 'text') {
        return await this.db.lines
          .where('lineNumber')
          .anyOf(lineNumbers)
          .toArray();
      } else {
        return await this.db.csvLines
          .where('lineNumber')
          .anyOf(lineNumbers)
          .toArray();
      }
    } catch (error) {
      throw new Error(`Failed to get lines by numbers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getLineCount(): Promise<{ text: number; csv: number }> {
    try {
      const [textCount, csvCount] = await Promise.all([
        this.db.lines.count(),
        this.db.csvLines.count()
      ]);
      
      return { text: textCount, csv: csvCount };
    } catch (error) {
      throw new Error(`Failed to get line count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clearData(): Promise<void> {
    try {
      await this.db.transaction('rw', [this.db.files, this.db.lines, this.db.csvLines, this.db.originalLines], async () => {
        await Promise.all([
          this.db.files.clear(),
          this.db.lines.clear(),
          this.db.csvLines.clear(),
          this.db.originalLines.clear()
        ]);
      });
    } catch (error) {
      throw new Error(`Failed to clear data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllTextLinesForFiltering(): Promise<Line[]> {
    try {
      return await this.db.lines.orderBy('lineNumber').toArray();
    } catch (error) {
      throw new Error(`Failed to get all text lines: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllCSVLinesForFiltering(): Promise<CSVLine[]> {
    try {
      return await this.db.csvLines.orderBy('lineNumber').toArray();
    } catch (error) {
      throw new Error(`Failed to get all CSV lines: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async hasData(fileId: string): Promise<boolean> {
    try {
      const file = await this.db.files.get(fileId);
      if (!file) return false;
      
      // Check if we have actual line data
      const counts = await this.getLineCount();
      return counts.text > 0 || counts.csv > 0;
    } catch (error) {
      console.warn('Failed to check if data exists:', error);
      return false;
    }
  }

  async storeOriginalLines(fileId: string, lines: string[]): Promise<void> {
    try {
      await this.db.originalLines.clear();
      await this.db.originalLines.add({ fileId, lines });
    } catch (error) {
      throw new Error(`Failed to store original lines: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getOriginalLines(fileId: string): Promise<string[]> {
    try {
      const record = await this.db.originalLines.where('fileId').equals(fileId).first();
      return record?.lines || [];
    } catch (error) {
      console.warn('Failed to get original lines:', error);
      return [];
    }
  }

  async clearCSVData(): Promise<void> {
    try {
      await this.db.csvLines.clear();
    } catch (error) {
      throw new Error(`Failed to clear CSV data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteDatabase(): Promise<void> {
    try {
      await this.db.delete();
    } catch (error) {
      throw new Error(`Failed to delete database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const databaseService = new DatabaseService();