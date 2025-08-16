export interface Line {
  id: number;
  content: string;
  lineNumber: number;
}

export interface CSVLine {
  id: number;
  lineNumber: number;
  data: string[];
  originalContent: string;
}

export interface FileData {
  id: string;
  name: string;
  type: 'text' | 'csv';
  size: number;
  lineCount: number;
  headers?: string[];
  uploadedAt: Date;
}

export interface DatabaseSchema {
  files: FileData;
  lines: Line;
  csvLines: CSVLine;
}