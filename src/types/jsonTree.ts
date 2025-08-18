export interface TreeNodeData {
  key: string;
  value: any;
  type: JSONValueType;
  path: string;
  level: number;
  parentPath: string | null;
  index?: number; // For array items
}

export interface TreeNodeState {
  isExpanded: boolean;
  isSelected: boolean;
  isHighlighted: boolean;
  hasChildren: boolean;
  childCount: number;
  visibleChildren: TreeNodeData[];
}

export interface TreeViewState {
  expandedPaths: Set<string>;
  selectedPath: string | null;
  highlightedPaths: Set<string>;
  collapsedArrayLimit: number;
  collapsedObjectLimit: number;
  searchTerm: string;
  searchResults: string[];
}

export interface TreeNodeProps {
  node: TreeNodeData;
  state: TreeNodeState;
  onExpand: (path: string) => void;
  onCollapse: (path: string) => void;
  onSelect: (path: string) => void;
  onClick: (path: string, value: any) => void;
  isRoot?: boolean;
}

export interface TreePathInfo {
  fullPath: string;
  segments: string[];
  isArrayIndex: boolean;
  arrayPath?: string;
  objectPath?: string;
}

export type JSONValueType = 
  | 'object' 
  | 'array' 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'null' 
  | 'undefined';

export interface TreeDisplayOptions {
  maxArrayPreview: number;
  maxObjectPreview: number;
  maxStringLength: number;
  showTypes: boolean;
  showIndices: boolean;
  compactArrays: boolean;
  compactObjects: boolean;
}

export interface TreeSearchResult {
  path: string;
  value: any;
  type: JSONValueType;
  matchType: 'key' | 'value' | 'path';
  context: string;
}

export const DEFAULT_TREE_OPTIONS: TreeDisplayOptions = {
  maxArrayPreview: 3,
  maxObjectPreview: 3,
  maxStringLength: 100,
  showTypes: true,
  showIndices: true,
  compactArrays: false,
  compactObjects: false
};

export const JSON_TYPE_COLORS = {
  object: 'text-blue-600',
  array: 'text-green-600',
  string: 'text-orange-600',
  number: 'text-purple-600',
  boolean: 'text-red-600',
  null: 'text-gray-500',
  undefined: 'text-gray-400'
} as const;