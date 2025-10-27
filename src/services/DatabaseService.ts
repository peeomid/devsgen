import Dexie, { type Table } from 'dexie';
import type { FileData, Line, CSVLine } from '../types/database';

interface OriginalLines {
  id: number;
  fileId: string;
  lines: string[];
}

type QueryResult<T> = {
  offset(value: number): QueryResult<T>;
  limit(value: number): QueryResult<T>;
  toArray(): Promise<T[]>;
};

type WhereResult<T> = {
  anyOf(values: Array<T[keyof T]>): { toArray(): Promise<T[]> };
};

interface TableLike<T> {
  clear(): Promise<void>;
  bulkAdd(items: Array<Omit<T, 'id'>>): Promise<void>;
  put(item: T): Promise<void>;
  get(key: any): Promise<T | undefined>;
  orderBy(field: keyof T): QueryResult<T>;
  where(field: keyof T): WhereResult<T>;
  count(): Promise<number>;
}

interface DatabaseLike {
  files: TableLike<FileData>;
  lines: TableLike<Line>;
  csvLines: TableLike<CSVLine>;
  originalLines: TableLike<OriginalLines>;
  transaction(_mode: 'rw', tables: TableLike<any>[] | TableLike<any>, callback: () => Promise<void> | void): Promise<void>;
}

const hasIndexedDB = typeof indexedDB !== 'undefined';

class MemoryTable<T extends { id?: number | string }> implements TableLike<T> {
  private data: T[] = [];
  private autoIncrement = 1;

  async clear(): Promise<void> {
    this.data = [];
  }

  async bulkAdd(items: Array<Omit<T, 'id'>>): Promise<void> {
    for (const item of items) {
      await this.put(item as T);
    }
  }

  async put(item: T): Promise<void> {
    if (typeof item.id === 'undefined' || item.id === null) {
      (item as any).id = this.autoIncrement++;
      this.data.push(item);
      return;
    }

    const index = this.data.findIndex(entry => entry.id === item.id);
    if (index === -1) {
      this.data.push(item);
    } else {
      this.data[index] = item;
    }
  }

  async get(key: any): Promise<T | undefined> {
    return this.data.find(entry => entry.id === key);
  }

  private createQuery(field: keyof T): QueryResult<T> {
    let offsetValue = 0;
    let limitValue: number | null = null;

    const exec = async (): Promise<T[]> => {
      const sorted = [...this.data].sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return aVal - bVal;
        }

        return String(aVal ?? '').localeCompare(String(bVal ?? ''));
      });

      const start = Math.max(0, offsetValue);
      const end = limitValue != null ? start + limitValue : undefined;
      return sorted.slice(start, end);
    };

    return {
      offset(value: number) {
        offsetValue = value;
        return this;
      },
      limit(value: number) {
        limitValue = value;
        return this;
      },
      toArray: exec,
    } as QueryResult<T>;
  }

  orderBy(field: keyof T): QueryResult<T> {
    return this.createQuery(field);
  }

  where(field: keyof T): WhereResult<T> {
    return {
      anyOf: (values: Array<T[keyof T]>) => ({
        toArray: async () => this.data.filter(entry => values.includes(entry[field])),
      }),
    };
  }

  async count(): Promise<number> {
    return this.data.length;
  }
}

class MemoryDatabase implements DatabaseLike {
  files = new MemoryTable<FileData>();
  lines = new MemoryTable<Line>();
  csvLines = new MemoryTable<CSVLine>();
  originalLines = new MemoryTable<OriginalLines>();

  async transaction(_mode: 'rw', tables: TableLike<any>[] | TableLike<any>, callback: () => Promise<void> | void): Promise<void> {
    await callback();
  }
}

class DexieDatabase extends Dexie implements DatabaseLike {
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

function createDatabase(): DatabaseLike {
  if (hasIndexedDB) {
    return new DexieDatabase();
  }
  return new MemoryDatabase();
}

export class DatabaseService {
  private db: DatabaseLike;

  constructor() {
    this.db = createDatabase();
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
