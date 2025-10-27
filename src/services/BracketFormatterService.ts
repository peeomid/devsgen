/**
 * Bracket-based code formatter service
 * Handles formatting of code structures using bracket-based indentation
 * while respecting strings and escape sequences
 */

type BracketType = '{' | '[' | '(';

interface BracketContext {
  type: BracketType;
  multiline: boolean;
}

interface BracketContentAnalysis {
  hasNested: boolean;
  hasAssignment: boolean;
  contentLength: number;
  commaCount: number;
  hasNewline: boolean;
  firstToken: string;
}

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
    const contextStack: BracketContext[] = [];

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
          const recentOutput = out.substring(Math.max(0, out.length - 30));
          if (recentOutput.includes('function ') && recentOutput.endsWith(')')) {
            out += ' ';
          }
        }

        const previousOutput = out;
        const parentContext = contextStack.length > 0 ? contextStack[contextStack.length - 1] : undefined;

        out += ch;
        depth++;

        // Look ahead to see if this is an empty structure
        let j = i + 1;
        while (j < input.length && /\s/.test(input[j])) j++;
        const isEmptyStructure = j < input.length && closers.has(input[j]);

        let context: BracketContext = {
          type: ch as BracketType,
          multiline: false,
        };

        if (!isEmptyStructure) {
          if (ch === '(') {
            const lookBack = previousOutput.trimEnd();
            const isPhpType = /\b(int|string|float|bool|array|object|resource|NULL)\s*$/.test(lookBack);
            if (!isPhpType) {
              const analysis = this.analyzeBracketContent(input, i, '(');
              if (analysis) {
                const isFunctionLike = this.isFunctionLikeCall(previousOutput);
                context.multiline = this.shouldIndentParentheses(analysis, parentContext, isFunctionLike);
              }
            }
          } else if (ch === '[') {
            const analysis = this.analyzeBracketContent(input, i, '[');
            if (analysis) {
              context.multiline = this.shouldIndentArray(analysis, parentContext);
            }
          } else if (ch === '{') {
            context.multiline = true;
          }
        }

        contextStack.push(context);

        if (context.multiline) {
          pushIndent();
        }
        continue;
      }

      if (closers.has(ch)) {
        const context = contextStack.pop();
        depth = Math.max(0, depth - 1);

        // Check if this is closing a PHP type declaration like int(42)
        let isClosingPhpType = false;
        if (ch === ')') {
          const lookBack = out.substring(Math.max(0, out.length - 50));
          if (/\b(int|string|float|bool|array|object|resource|NULL)\s*\([^)]*$/.test(lookBack)) {
            isClosingPhpType = true;
          }
        }

        // Check if this is closing an empty structure
        let lastNonWhitespace = '';
        for (let k = out.length - 1; k >= 0; k--) {
          if (!/\s/.test(out[k])) {
            lastNonWhitespace = out[k];
            break;
          }
        }

        const shouldIndentCloser = this.shouldIndentClosingBracket(out, ch, lastNonWhitespace, isClosingPhpType, context);

        if (shouldIndentCloser) {
          out += '\n' + indentStr.repeat(depth);
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
        const currentContext = contextStack.length > 0 ? contextStack[contextStack.length - 1] : undefined;
        const shouldBreakLine = this.shouldBreakAfterComma(currentContext);
        
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
          const lastChar = out[out.length - 1];
          if (lastChar && lastChar !== " " && lastChar !== "\n") {
            out += " ";
          }

          let lastNonWhitespaceChar = '';
          for (let k = out.length - 1; k >= 0; k--) {
            const candidate = out[k];
            if (!/\s/.test(candidate)) {
              lastNonWhitespaceChar = candidate;
              break;
            }
          }

          let lookaheadIndex = i + 2;
          while (lookaheadIndex < input.length && /\s/.test(input[lookaheadIndex])) {
            lookaheadIndex++;
          }
          const upcomingWord = input.substring(lookaheadIndex, lookaheadIndex + 5).toLowerCase();

          let hasBraceAfterArray = false;
          if (upcomingWord.startsWith('array')) {
            let closeParenIndex = lookaheadIndex;
            while (closeParenIndex < input.length && input[closeParenIndex] !== ')') {
              closeParenIndex++;
            }
            if (closeParenIndex < input.length) {
              let afterParen = closeParenIndex + 1;
              while (afterParen < input.length && /\s/.test(input[afterParen])) {
                afterParen++;
              }
              if (afterParen < input.length && input[afterParen] === '{') {
                hasBraceAfterArray = true;
              }
            }
          }

          const currentContext = contextStack.length > 0 ? contextStack[contextStack.length - 1] : undefined;
          const shouldBreakAfterArrow = lastNonWhitespaceChar === ']' || (currentContext?.type === '{' && hasBraceAfterArray);

          out += "=>";
          i++; // Skip the '>'

          if (shouldBreakAfterArrow) {
            out += "\n" + indentStr.repeat(Math.max(0, depth + 1));

            // Skip immediate whitespace/newlines we've replaced
            let skipIndex = i + 1;
            while (skipIndex < input.length && (input[skipIndex] === '\n' || input[skipIndex] === ' ' || input[skipIndex] === '\t')) {
              skipIndex++;
            }
            i = skipIndex - 1;
          } else {
            out += " ";
          }
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
  private static shouldBreakAfterComma(context?: BracketContext): boolean {
    if (!context) {
      return false;
    }

    if (context.type === '{') {
      return true;
    }

    return context.multiline;
  }

  private static shouldIndentParentheses(analysis: BracketContentAnalysis, parentContext?: BracketContext, isFunctionLike = false): boolean {
    if (analysis.hasAssignment || analysis.hasNewline) {
      return true;
    }

    if (!isFunctionLike && analysis.hasNested && analysis.firstToken !== 'function') {
      return true;
    }

    if (analysis.hasNested && analysis.contentLength > 80 && analysis.firstToken !== 'function') {
      return true;
    }

    if (!isFunctionLike && analysis.firstToken === 'function') {
      return false;
    }

    if (!isFunctionLike && parentContext?.multiline && analysis.commaCount > 0 && (analysis.hasNested || analysis.contentLength > 12)) {
      return true;
    }

    if (analysis.commaCount >= 2 && analysis.contentLength > 60) {
      return true;
    }

    if (analysis.contentLength > 120) {
      return true;
    }

    return false;
  }

  /**
   * Determines whether to indent array content
   * @param input - The full input string
   * @param arrayStart - The index of the opening bracket
   * @returns true if should indent, false for inline
   */
  private static shouldIndentArray(analysis: BracketContentAnalysis, parentContext?: BracketContext): boolean {
    if (analysis.hasNested || analysis.hasAssignment || analysis.hasNewline) {
      return true;
    }

    if (analysis.contentLength > 100 || analysis.commaCount >= 6) {
      return true;
    }

    if (parentContext?.multiline && (analysis.hasNested || analysis.contentLength > 60 || analysis.commaCount >= 4)) {
      return true;
    }

    return false;
  }

  private static analyzeBracketContent(input: string, startIndex: number, opener: BracketType): BracketContentAnalysis | null {
    const matching = opener === '(' ? ')' : opener === '[' ? ']' : '}';
    const openerSet = new Set(['(', '[', '{']);
    const closerSet = new Set([')', ']', '}']);

    const stack: string[] = [];
    let inString = false;
    let stringChar = '';
    let escape = false;
    let hasNested = false;
    let hasAssignment = false;
    let contentLength = 0;
    let commaCount = 0;
    let hasNewline = false;
    let firstToken = '';
    let capturedToken = false;

    for (let i = startIndex + 1; i < input.length; i++) {
      const ch = input[i];

      if (escape) {
        escape = false;
        contentLength++;
        continue;
      }

      if (ch === '\\') {
        escape = true;
        contentLength++;
        continue;
      }

      if (inString) {
        if (ch === stringChar) {
          inString = false;
        }
        contentLength++;
        continue;
      }

      if (ch === '"' || ch === "'") {
        inString = true;
        stringChar = ch;
        contentLength++;
        if (!capturedToken) {
          capturedToken = true;
          firstToken = ch;
        }
        continue;
      }

      if (ch === '\n') {
        hasNewline = true;
        continue;
      }

      if (ch === ',') {
        commaCount++;
        continue;
      }

      if (!/\s/.test(ch)) {
        contentLength++;
        if (!capturedToken) {
          capturedToken = true;
          let endIndex = i;
          while (endIndex < input.length && /[a-zA-Z0-9_]/.test(input[endIndex])) {
            endIndex++;
          }
          firstToken = input.substring(i, endIndex).toLowerCase();
        }
      }

      if (ch === '=' ) {
        if (i + 1 < input.length && input[i + 1] === '>') {
          hasAssignment = true;
        } else {
          hasAssignment = true;
        }
        continue;
      }

      if (openerSet.has(ch)) {
        stack.push(ch);
        if (stack.length === 1) {
          hasNested = true;
        }
        continue;
      }

      if (closerSet.has(ch)) {
        if (stack.length === 0) {
          if (ch === matching) {
            return {
              hasNested,
              hasAssignment,
              contentLength,
              commaCount,
              hasNewline,
              firstToken,
            };
          }
          return {
            hasNested,
            hasAssignment,
            contentLength,
            commaCount,
            hasNewline,
            firstToken,
          };
        }

        const expectedOpener = stack[stack.length - 1];
        const expectedCloser = expectedOpener === '(' ? ')' : expectedOpener === '[' ? ']' : '}';
        if (ch === expectedCloser) {
          stack.pop();
        } else {
          stack.pop();
        }
        continue;
      }
    }

    return null;
  }

  private static isFunctionLikeCall(previousOutput: string): boolean {
    const trimmed = previousOutput.trimEnd();
    if (!trimmed) {
      return false;
    }

    const lastChar = trimmed[trimmed.length - 1];
    return /[a-zA-Z0-9_.\)]/.test(lastChar);
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
  private static shouldIndentClosingBracket(output: string, closingBracket: string, lastNonWhitespace: string, isClosingPhpType: boolean, context?: BracketContext): boolean {
    // Never indent PHP type closures
    if (isClosingPhpType) return false;
    
    // Never indent if we just opened the structure (empty structure)
    if (lastNonWhitespace === '{' || lastNonWhitespace === '[' || lastNonWhitespace === '(') return false;

    if (context?.multiline) {
      return true;
    }
    
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
