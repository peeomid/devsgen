export type BeautifyMode = 'structure' | 'jsonish' | 'phpish';

export interface BeautifyOptions {
  mode: BeautifyMode;
  indent: number;
  useTabs: boolean;
  newlineAfterComma: boolean;
  keepComments: boolean;
  conservative: boolean;
}

export interface BeautifyDiagnostics {
  unbalancedBrackets?: boolean;
  truncated?: boolean;
  warnings: string[];
}

export interface BeautifyResult {
  output: string;
  diagnostics: BeautifyDiagnostics;
  timeMs: number;
}

export type TokenType = 
  | 'open'
  | 'close'
  | 'comma'
  | 'colon'
  | 'string'
  | 'comment'
  | 'other';

export interface Token {
  type: TokenType;
  value: string;
  bracket?: '{' | '[' | '(' | '}' | ']' | ')';
  start: number;
  end: number;
}

export type Detected =
  | 'json'
  | 'jsonish'
  | 'pythonRepr'
  | 'phpArray'
  | 'phpVarDump'
  | 'unknown';

export interface WorkerRequest {
  id: string;
  text: string;
  options: BeautifyOptions;
}

export interface WorkerProgress {
  id: string;
  type: 'progress';
  processed: number;
  total: number;
}

export interface WorkerResult {
  id: string;
  type: 'result';
  result: BeautifyResult;
}

export interface WorkerError {
  id: string;
  type: 'error';
  error: string;
}

export type WorkerMessage = WorkerProgress | WorkerResult | WorkerError;