/**
 * Bracket-based code formatter service
 * Handles formatting of code structures using bracket-based indentation
 * while respecting strings and escape sequences
 */
export class BracketFormatterService {
  /**
   * Format code using bracket-based pretty printing
   * @param input - The input string to format
   * @param indentStr - The indentation string to use (default: "  ")
   * @returns Formatted string with proper indentation
   */
  static format(input: string, indentStr = "  "): string {
    let out = "";
    let depth = 0;
    let inSingle = false;
    let inDouble = false;
    let escape = false;

    const openers = new Set(["{", "[", "("]);
    const closers = new Set(["}", "]", ")"]);

    const pushIndent = () => {
      out += "\n" + indentStr.repeat(depth);
    };

    for (let i = 0; i < input.length; i++) {
      const ch = input[i];

      if (escape) {
        out += ch;
        escape = false;
        continue;
      }

      if (ch === "\\") {
        out += ch;
        if (inSingle || inDouble) escape = true;
        continue;
      }

      if (!inDouble && ch === "'" && !inSingle) {
        inSingle = true;
        out += ch;
        continue;
      } else if (inSingle && ch === "'") {
        inSingle = false;
        out += ch;
        continue;
      }

      if (!inSingle && ch === '"' && !inDouble) {
        inDouble = true;
        out += ch;
        continue;
      } else if (inDouble && ch === '"') {
        inDouble = false;
        out += ch;
        continue;
      }

      if (inSingle || inDouble) {
        out += ch;
        continue;
      }

      if (openers.has(ch)) {
        // Add space before { if this is a function body
        if (ch === '{') {
          let recentOutput = out.substring(Math.max(0, out.length - 30));
          if (recentOutput.includes('function ') && recentOutput.endsWith(')')) {
            out += ' ';
          }
        }
        
        out += ch;
        depth++;
        
        // Look ahead to see if this is an empty structure
        let j = i + 1;
        while (j < input.length && /\s/.test(input[j])) j++;
        if (j < input.length && closers.has(input[j])) {
          // Empty structure - don't add newline
        } else {
          // Smart indentation logic
          let shouldIndent = true;
          
          // Special handling for PHP var_dump: don't break up type declarations like int(42), string(3), array(3)
          if (ch === "(") {
            let lookBack = out.trim();
            if (/\b(int|string|float|bool|array|object|resource|NULL)\s*$/.test(lookBack)) {
              shouldIndent = false; // PHP type declaration
            } else {
              // All other parentheses (function calls/parameters) - keep inline
              shouldIndent = false;
            }
          }
          
          // For arrays, keep inline if they're simple
          if (ch === "[") {
            // Simple heuristic: if the content looks short and simple, keep inline
            shouldIndent = this.shouldIndentArray(input, i);
          }
          
          // For objects, usually indent unless very simple or function body
          if (ch === "{") {
            // Check if this is a function body (preceded by closing parenthesis)
            let recentOutput = out.substring(Math.max(0, out.length - 50));
            if (recentOutput.includes('function ') && (recentOutput.endsWith(')') || recentOutput.endsWith(') '))) {
              shouldIndent = false; // Keep function body brace inline
            } else {
              shouldIndent = true;
            }
          }
          
          if (shouldIndent) {
            pushIndent();
          }
        }
        continue;
      }

      if (closers.has(ch)) {
        depth = Math.max(0, depth - 1);
        
        // Check if this is closing a PHP type declaration like int(42)
        let isClosingPhpType = false;
        if (ch === ")") {
          // Look for pattern like int(digits) or string(digits)
          let lookBack = out.substring(Math.max(0, out.length - 50)); // Check last 50 chars
          if (/\b(int|string|float|bool|array|object|resource|NULL)\s*\([^)]*$/.test(lookBack)) {
            isClosingPhpType = true;
          }
        }
        
        // Check if this is closing an empty structure
        let lastNonWhitespace = "";
        for (let k = out.length - 1; k >= 0; k--) {
          if (!/\s/.test(out[k])) {
            lastNonWhitespace = out[k];
            break;
          }
        }
        
        // Smart closing bracket handling - add newlines for proper indentation
        const shouldIndentCloser = this.shouldIndentClosingBracket(out, ch, lastNonWhitespace, isClosingPhpType);
        
        if (shouldIndentCloser) {
          out += "\n" + indentStr.repeat(depth);
        }
        out += ch;
        continue;
      }

      if (ch === ",") {
        out += ch;
        
        // Check if this is a trailing comma (next non-whitespace is closing bracket)
        let j = i + 1;
        while (j < input.length && /\s/.test(input[j])) j++;
        const isTrailingComma = j < input.length && (input[j] === '}' || input[j] === ']' || input[j] === ')');
        
        if (isTrailingComma) {
          // Trailing comma - don't add newline/indentation, just continue
          continue;
        }
        
        // Smart comma handling: don't break lines for function parameters
        // but do break for object/array items
        const shouldBreakLine = this.shouldBreakAfterComma(input, i, depth);
        
        if (shouldBreakLine) {
          pushIndent();
        } else {
          // Add a space after comma for inline parameters
          out += " ";
        }
        continue;
      }

      if (ch === ";") {
        out += ch;
        
        // Look ahead to see if there's more content
        let j = i + 1;
        while (j < input.length && /\s/.test(input[j])) j++;
        if (j < input.length && depth === 0) {
          out += "\n\n"; // Double newline for statement separation at top level
        }
        continue;
      }

      // Handle common operators with spacing  
      if ((ch === "+" || ch === "-" || ch === "*" || ch === "/" || ch === "=") && 
          !inSingle && !inDouble && 
          // Handle = at any depth for assignments, others only inside structures
          (ch === "=" || depth > 0) &&
          // Skip = if it's part of => (PHP arrow operator)
          !(ch === "=" && i + 1 < input.length && input[i + 1] === ">")) {
        // Don't add spaces around operators in string contexts or at top level
        // Add space before operator if there isn't one
        if (out.length > 0 && !out.endsWith(" ") && !out.endsWith("\n")) {
          const lastChar = out[out.length - 1];
          if (/[a-zA-Z0-9_$)]/.test(lastChar)) {
            out += " ";
          }
        }
        out += ch;
        // Add space after operator if there isn't one and next char is not whitespace
        if (i + 1 < input.length && !/\s/.test(input[i + 1])) {
          out += " ";
        }
        continue;
      }

      if (ch === ":" || (ch === "=" && i + 1 < input.length && input[i + 1] === ">")) {
        if (ch === "=" && input[i + 1] === ">") {
          // For =>, only add space before if there isn't already one (preserve original spacing)
          const lastChar = out[out.length - 1];
          if (lastChar && lastChar !== " " && lastChar !== "\n") {
            out += " ";
          }
          out += "=>";
          // Always ensure space after =>
          out += " ";
          i++; // Skip the '>'
        } else {
          out += ": ";
        }
        continue;
      }

      if (ch === "\n") {
        // Look ahead to see if there are multiple consecutive newlines (empty lines)
        let j = i + 1;
        let newlineCount = 1;
        while (j < input.length && input[j] === "\n") {
          newlineCount++;
          j++;
        }
        
        if (newlineCount >= 2) {
          // Reduce multiple blank lines to single blank line
          if (!out.endsWith("\n")) {
            out += "\n\n";
          } else if (!out.endsWith("\n\n")) {
            out += "\n";
          }
          i = j - 1; // Skip the additional newlines we've processed
        } else {
          // Single newline - add with proper indentation
          if (!out.endsWith("\n")) {
            out += "\n";
            if (depth > 0) {
              out += indentStr.repeat(depth);
            }
          }
        }
        continue;
      }

      if (!/\s/.test(ch)) {
        out += ch;
        
        // Note: space for function definitions is now handled in the { processing above
      } else if (ch === " ") {
        // Preserve leading spaces at start of line when no structural indent applied (depth===0)
        if (out.endsWith("\n")) {
          if (depth === 0) {
            out += ch;
          }
          continue;
        }
        if (!out.endsWith(" ")) {
          // Smart space handling: avoid extra spaces around brackets
          const lastChar = out[out.length - 1];
          const nextChar = i + 1 < input.length ? input[i + 1] : '';
          // Don't add space immediately after opening brackets
          if (openers.has(lastChar)) {
            continue;
          }
          // Don't add space immediately before closing brackets  
          if (closers.has(nextChar)) {
            continue;
          }
          out += ch;
        }
      }
    }

    // Post-process to add missing semicolons (disabled - formatter should only format, not add missing syntax)
    // out = this.addMissingSemicolons(out);

    return out;
  }

  /**
   * Determines whether to break line after a comma based on context
   * @param input - The full input string
   * @param commaIndex - The index of the comma
   * @param currentDepth - Current nesting depth
   * @returns true if should break line, false for inline spacing
   */
  private static shouldBreakAfterComma(input: string, commaIndex: number, currentDepth: number): boolean {
    // Find the most recent opening bracket to determine context
    let recentOpener = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = commaIndex - 1; i >= 0; i--) {
      const ch = input[i];
      
      // Handle string boundaries
      if (!inString && (ch === '"' || ch === "'")) {
        inString = true;
        stringChar = ch;
        continue;
      }
      if (inString && ch === stringChar && input[i-1] !== '\\') {
        inString = false;
        stringChar = '';
        continue;
      }
      if (inString) continue;
      
      if (ch === ')' || ch === ']' || ch === '}') {
        depth++;
      } else if (ch === '(' || ch === '[' || ch === '{') {
        if (depth === 0) {
          recentOpener = ch;
          break;
        }
        depth--;
      }
    }
    
    // Decision logic:
    // - In parentheses (): likely function parameters - keep inline for short lists
    // - In square brackets []: arrays - break for readability if nested
    // - In curly braces {}: objects - usually break
    
    if (recentOpener === '(') {
      // Parentheses (function calls/parameters) - keep inline by default
      return false;
    }
    
    if (recentOpener === '[') {
      // Arrays - keep inline for simple cases
      return false;
    }
    
    if (recentOpener === '{') {
      // Objects - always break for readability
      return true;
    }
    
    // Default: break the line
    return true;
  }

  /**
   * Determines whether to indent array content
   * @param input - The full input string
   * @param arrayStart - The index of the opening bracket
   * @returns true if should indent, false for inline
   */
  private static shouldIndentArray(input: string, arrayStart: number): boolean {
    // Find the closing bracket and analyze content
    let depth = 0;
    let inString = false;
    let stringChar = '';
    let contentLength = 0;
    let hasNestedStructures = false;
    
    for (let i = arrayStart + 1; i < input.length; i++) {
      const ch = input[i];
      
      // Handle strings
      if (!inString && (ch === '"' || ch === "'")) {
        inString = true;
        stringChar = ch;
        contentLength++;
        continue;
      }
      if (inString && ch === stringChar && input[i-1] !== '\\') {
        inString = false;
        stringChar = '';
        contentLength++;
        continue;
      }
      if (inString) {
        contentLength++;
        continue;
      }
      
      // Handle brackets
      if (ch === '[' || ch === '(' || ch === '{') {
        depth++;
        hasNestedStructures = true;
        contentLength++;
      } else if (ch === ']' || ch === ')' || ch === '}') {
        if (depth === 0 && ch === ']') {
          break; // Found closing bracket
        }
        depth--;
        contentLength++;
      } else if (ch !== ' ' && ch !== '\t' && ch !== '\n') {
        contentLength++;
      }
    }
    
    // Keep simple arrays inline - only break for very complex or very long arrays
    // This preserves the JavaScript formatting behavior while handling complex cases
    return hasNestedStructures && contentLength > 30;
  }

  /**
   * Adds missing semicolons to JavaScript-like statements
   * @param output - The formatted output string
   * @returns Output with missing semicolons added
   */
  private static addMissingSemicolons(output: string): string {
    const lines = output.split('\n');
    const result: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const trimmed = line.trim();
      
      // Skip empty lines and lines that already end with semicolon
      if (!trimmed || trimmed.endsWith(';') || trimmed.endsWith('{') || trimmed.endsWith('}')) {
        result.push(line);
        continue;
      }
      
      // Check if this looks like a statement that needs a semicolon
      const needsSemicolon = (
        // Variable assignments, return statements etc that don't end with brace
        (/^[\s]*(const|let|var|return)\s/.test(trimmed) && !trimmed.endsWith('{'))
        // Don't auto-add semicolons to function calls - let them be as they are
      );
      
      if (needsSemicolon) {
        line = line.trimRight() + ';';
      }
      
      result.push(line);
    }
    
    return result.join('\n');
  }

  /**
   * Determines whether to add newline/indentation before closing bracket
   * @param output - Current output string
   * @param closingBracket - The closing bracket character
   * @param lastNonWhitespace - Last non-whitespace character in output
   * @param isClosingPhpType - Whether this is closing a PHP type declaration
   * @returns true if should add newline before closing bracket
   */
  private static shouldIndentClosingBracket(output: string, closingBracket: string, lastNonWhitespace: string, isClosingPhpType: boolean): boolean {
    // Never indent PHP type closures
    if (isClosingPhpType) return false;
    
    // Never indent if we just opened the structure (empty structure)
    if (lastNonWhitespace === '{' || lastNonWhitespace === '[' || lastNonWhitespace === '(') return false;
    
    // For parentheses, check if this looks like an inline function call/parameter list
    if (closingBracket === ')') {
      // Look at the last 50 characters to see if this looks like inline content
      const recentOutput = output.substring(Math.max(0, output.length - 50));
      
      // If the content is all on one line (no newlines in recent output), keep it inline
      const lastNewlineIndex = recentOutput.lastIndexOf('\n');
      if (lastNewlineIndex === -1) {
        // No newlines in recent output - this is inline content
        return false;
      }
      
      // If there's only one line of content since the last newline, keep inline
      const contentSinceNewline = recentOutput.substring(lastNewlineIndex + 1);
      if (contentSinceNewline.trim().length < 50 && !contentSinceNewline.includes('\n')) {
        return false;
      }
    }
    
    // For arrays, check if content looks inline
    if (closingBracket === ']') {
      const recentOutput = output.substring(Math.max(0, output.length - 30));
      const lastNewlineIndex = recentOutput.lastIndexOf('\n');
      
      // If no newlines in recent output, or very short content, keep inline
      if (lastNewlineIndex === -1 || recentOutput.substring(lastNewlineIndex + 1).trim().length < 30) {
        return false;
      }
    }
    
    // For objects and function bodies, always indent closing brace
    if (closingBracket === '}') {
      return true;
    }
    
    // Default: indent
    return true;
  }
}
