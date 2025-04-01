/**
 * Pattern interface for regex patterns
 */
export interface Pattern {
  id: string;
  name: string;
  description: string;
  category: PatternCategory;
  searchRegex: string;
  replaceRegex: string;
  flags?: string;
  example: {
    input: string;
    output: string;
  };
  isBuiltIn: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Pattern category enum
 */
export enum PatternCategory {
  FORMAT_CONVERSION = 'Format Conversion',
  TEXT_EXTRACTION = 'Text Extraction',
  CODE_FORMATTING = 'Code Formatting',
  DATA_VALIDATION = 'Data Validation',
  CUSTOM = 'Custom'
}

/**
 * Pattern creation input
 */
export interface PatternInput {
  name: string;
  description: string;
  category: PatternCategory;
  searchRegex: string;
  replaceRegex: string;
  flags?: string;
  example: {
    input: string;
    output: string;
  };
  tags?: string[];
}

/**
 * Pattern validation result
 */
export interface PatternValidationResult {
  isValid: boolean;
  errors?: {
    field: string;
    message: string;
  }[];
}

/**
 * Regex validation result
 */
export interface RegexValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Pattern search result
 */
export interface PatternSearchResult {
  patterns: Pattern[];
  query: string;
}

/**
 * Pattern import result
 */
export interface PatternImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors?: string[];
}

/**
 * Pattern transformation result
 */
export interface TransformationResult {
  output: string;
  error?: string;
  executionTime?: number;
}
