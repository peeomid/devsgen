export interface JSONValidationResult {
  isValid: boolean;
  parsed?: any;
  error?: string;
  suggestion?: string;
  line?: number;
  column?: number;
  position?: number;
}

export interface JSONFixResult {
  fixed: string;
  changes: string[];
}

/**
 * Comprehensive JSON validator with helpful error messages and auto-fix capabilities
 */
export class JSONValidator {
  /**
   * Attempts to fix common JSON issues
   */
  static fixCommonIssues(jsonString: string): JSONFixResult {
    let fixed = jsonString;
    const changes: string[] = [];

    // Remove leading/trailing whitespace
    const trimmed = fixed.trim();
    if (trimmed !== fixed) {
      fixed = trimmed;
      changes.push('Removed leading/trailing whitespace');
    }

    // Remove trailing commas
    const trailingCommaPattern = /,(\s*[}\]])/g;
    if (trailingCommaPattern.test(fixed)) {
      fixed = fixed.replace(trailingCommaPattern, '$1');
      changes.push('Removed trailing commas');
    }

    // Fix single quotes to double quotes (disabled to avoid corrupting apostrophes)
    // Modern JSON typically already uses double quotes correctly
    // const singleQuotePattern = /'([^'\\]*(\\.[^'\\]*)*)'/g;
    // if (singleQuotePattern.test(fixed)) {
    //   fixed = fixed.replace(singleQuotePattern, '"$1"');
    //   changes.push('Converted single quotes to double quotes');
    // }

    // Remove JavaScript-style comments
    const commentPattern = /\/\*[\s\S]*?\*\/|\/\/.*$/gm;
    if (commentPattern.test(fixed)) {
      fixed = fixed.replace(commentPattern, '');
      changes.push('Removed JavaScript-style comments');
    }

    // Fix unquoted keys (basic pattern)
    const unquotedKeyPattern = /(\s*)([\w$]+)(\s*):/g;
    const withQuotedKeys = fixed.replace(unquotedKeyPattern, (match, space1, key, space2) => {
      // Don't quote if already quoted or if it's a number
      if (key.match(/^".*"$/) || key.match(/^\d+$/)) {
        return match;
      }
      return `${space1}"${key}"${space2}:`;
    });
    
    if (withQuotedKeys !== fixed) {
      fixed = withQuotedKeys;
      changes.push('Added quotes around unquoted object keys');
    }

    // Handle multiple JSON objects concatenated together - show error instead of auto-fix
    // if (/\}\s*\{/.test(fixed)) {
    //   // Convert multiple objects to an array
    //   fixed = '[' + fixed.replace(/(\}\s*\{)/g, '}, {') + ']';
    //   changes.push('Converted multiple JSON objects to array');
    // }

    // Remove any text after the JSON ends
    const jsonPattern = /^(\s*[\{\[][\s\S]*[\}\]]\s*).*/;
    const match = fixed.match(jsonPattern);
    if (match && match[0] !== match[1]) {
      fixed = match[1];
      changes.push('Removed extra text after JSON');
    }

    return { fixed, changes };
  }

  /**
   * Validates JSON with detailed error reporting
   */
  static validate(jsonString: string): JSONValidationResult {
    if (!jsonString || jsonString.trim() === '') {
      return {
        isValid: false,
        error: 'Empty input',
        suggestion: 'Please paste or upload a JSON file'
      };
    }

    // First, try to parse as-is
    try {
      const parsed = JSON.parse(jsonString);
      return {
        isValid: true,
        parsed
      };
    } catch (initialError) {
      // If initial parsing fails, try to fix common issues
      const fixResult = this.fixCommonIssues(jsonString);
      
      // Try parsing the fixed version
      try {
        const parsed = JSON.parse(fixResult.fixed);
        return {
          isValid: true,
          parsed,
          suggestion: fixResult.changes.length > 0 
            ? `Fixed automatically: ${fixResult.changes.join(', ')}`
            : undefined
        };
      } catch (finalError) {
        return this.parseJSONError(finalError as Error, jsonString);
      }
    }
  }

  /**
   * Parses JSON.parse error to provide helpful information
   */
  private static parseJSONError(error: Error, jsonString: string): JSONValidationResult {
    const message = error.message;
    
    // Extract position information from error message
    const positionMatch = message.match(/at position (\d+)/);
    const lineMatch = message.match(/line (\d+)/);
    const columnMatch = message.match(/column (\d+)/);
    
    const position = positionMatch ? parseInt(positionMatch[1]) : undefined;
    const line = lineMatch ? parseInt(lineMatch[1]) : undefined;
    const column = columnMatch ? parseInt(columnMatch[1]) : undefined;

    // Calculate line/column from position if not provided
    let calculatedLine = line;
    let calculatedColumn = column;
    
    if (position !== undefined && !line) {
      const lines = jsonString.slice(0, position).split('\n');
      calculatedLine = lines.length;
      calculatedColumn = lines[lines.length - 1].length + 1;
    }

    // Generate helpful error messages and suggestions
    let friendlyError = 'Invalid JSON format';
    let suggestion = 'Please check your JSON syntax';

    if (message.includes('Unexpected end of JSON input')) {
      friendlyError = 'Incomplete JSON - missing closing brackets or braces';
      suggestion = 'Check that all opening { [ have matching closing } ]';
    } else if (message.includes('Unexpected token')) {
      const tokenMatch = message.match(/Unexpected token (.+?) in JSON/);
      const token = tokenMatch ? tokenMatch[1] : 'unknown';
      friendlyError = `Unexpected character: ${token}`;
      
      if (token === "'") {
        suggestion = 'Use double quotes (") instead of single quotes (\') for strings';
      } else if (token === ',') {
        suggestion = 'Remove trailing commas before closing brackets';
      } else if (token.match(/[a-zA-Z]/)) {
        suggestion = 'Unquoted strings must be wrapped in double quotes';
      }
    } else if (message.includes('Unexpected non-whitespace character after JSON')) {
      friendlyError = 'Extra text found after valid JSON';
      suggestion = 'Remove any text that appears after the closing bracket/brace of your JSON';
      
      // Try to show what the extra content is
      if (position) {
        const extraContent = jsonString.slice(position, position + 50);
        if (extraContent.trim()) {
          suggestion += `. Found: "${extraContent.trim()}"`;
        }
      }
    }

    // Add line/column information to suggestion if available
    if (calculatedLine && calculatedColumn) {
      suggestion += ` (Error at line ${calculatedLine}, column ${calculatedColumn})`;
    }

    return {
      isValid: false,
      error: friendlyError,
      suggestion,
      line: calculatedLine,
      column: calculatedColumn,
      position
    };
  }

  /**
   * Highlights the error location in JSON string
   */
  static highlightError(jsonString: string, line?: number, column?: number, position?: number): string {
    if (!line && !column && !position) {
      return jsonString;
    }

    const lines = jsonString.split('\n');
    
    if (line && line <= lines.length) {
      const errorLine = lines[line - 1];
      const col = column || 1;
      
      if (col <= errorLine.length) {
        const before = errorLine.slice(0, col - 1);
        const errorChar = errorLine.slice(col - 1, col);
        const after = errorLine.slice(col);
        
        lines[line - 1] = `${before}>>>${errorChar}<<<${after}`;
      }
    }

    return lines.join('\n');
  }
}