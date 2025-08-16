export interface TextFilter {
  id: string;
  pattern: string;
  type: 'include' | 'exclude';
  caseSensitive: boolean;
  useRegex: boolean;
  isActive: boolean;
  created: Date;
}

export interface CSVFilter extends TextFilter {
  columnIndex?: number;
  columnName?: string;
  scope: 'all' | 'column';
}

export interface FilterResult {
  filterId: string;
  matchedLines: number[];
  totalMatches: number;
  processingTime: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  description: string;
  filters: (TextFilter | CSVFilter)[];
  category: string;
}

export type FilterType = TextFilter | CSVFilter;