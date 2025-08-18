export interface FilterSetConfig {
  id: string;
  name: string;
  type: FilterType;
  values: string[];
  active: boolean;
  description?: string;
  examples?: string[];
  createdAt: number;
  updatedAt: number;
}

export type FilterType = 'path' | 'value';

export interface FilterSetValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FilterSetResult {
  filterId: string;
  matchCount: number;
  matchedPaths: string[];
  executionTime: number;
  error?: string;
}

export interface FilterSetInput {
  name: string;
  type: FilterType;
  values: string[];
  description?: string;
}

export interface FilterTag {
  id: string;
  value: string;
  isValid: boolean;
  error?: string;
}

export const FILTER_TYPE_ICONS = {
  path: '📍',
  value: '🔍'
} as const;

export const FILTER_TYPE_LABELS = {
  path: 'JSON Path',
  value: 'Value Search'
} as const;

export const MAX_FILTER_VALUES = 10;
export const MAX_FILTER_NAME_LENGTH = 50;