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
        out += ch;
        depth++;
        
        // Look ahead to see if this is an empty structure
        let j = i + 1;
        while (j < input.length && /\s/.test(input[j])) j++;
        if (j < input.length && closers.has(input[j])) {
          // Empty structure - don't add newline
        } else {
          // Special handling for PHP var_dump: don't break up type declarations like int(42), string(3), array(3)
          // Look back to see if this is a PHP type declaration
          let isPhpType = false;
          if (ch === "(") {
            let lookBack = out.trim();
            if (/\b(int|string|float|bool|array|object|resource|NULL)\s*$/.test(lookBack)) {
              isPhpType = true;
            }
          }
          
          if (!isPhpType) {
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
        
        if (!openers.has(lastNonWhitespace) && !isClosingPhpType) {
          out += "\n" + indentStr.repeat(depth);
        }
        out += ch;
        continue;
      }

      if (ch === ",") {
        out += ch;
        pushIndent();
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
      } else if (ch === " " && !out.endsWith(" ") && !out.endsWith("\n")) {
        // Only add space if we don't already have whitespace
        out += ch;
      }
    }

    return out;
  }
}