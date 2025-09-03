/**
 * PHP var_dump formatter
 * Simple regex-based approach to format PHP var_dump output exactly
 */
export function formatPhpVarDump(text: string, indentStr: string): string {
  // Basic validation - if this doesn't look like var_dump, return original
  if (!text.includes('array(') || !text.includes('=>')) {
    return text;
  }

  // Start with the original text and apply transformations step by step
  let result = text;
  
  // 1. Normalize array declarations: array(n) { (with proper spacing)
  result = result.replace(/array\s*\(\s*(\d+)\s*\)\s*\{/g, 'array($1) {');
  
  // 2. Add proper spacing around =>
  result = result.replace(/([^\s])=>/g, '$1 =>');
  result = result.replace(/=>([^\s])/g, '=> $1');
  
  // 3. Add space between type(param) and string literals
  result = result.replace(/(string\(\d+\))"([^"]*)"/g, '$1 "$2"');
  
  // 4. Split concatenated entries like [0]=>value[1]=>value into separate lines
  // This handles cases where multiple key-value pairs are on one line
  result = result.replace(/(\]\s*=>\s*[^[}]+)(\[)/g, '$1\n$2');
  
  // 4b. Add newline after { if content follows immediately
  result = result.replace(/(\{)([^}\n])/g, '$1\n$2');
  
  // 4c. Add newline before } if content precedes immediately (except for empty arrays)
  result = result.replace(/([^{\n])(\})/g, '$1\n$2');
  
  // 4d. Split consecutive closing braces }}
  result = result.replace(/(\})(\})/g, '$1\n$2');
  
  // 5. Fix line breaks and indentation
  const lines = result.split('\n');
  const formattedLines = [];
  let depth = 0;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    
    // Special handling for array(...) { that got split
    if (line.match(/^array\(\d+\)$/) && i + 1 < lines.length && lines[i + 1].trim() === '{') {
      // Combine with next line
      line = line + ' {';
      i++; // Skip the next line
      depth++;
      formattedLines.push(indentStr.repeat(Math.max(0, depth - 1)) + line);
      continue;
    }
    
    // Handle closing braces
    if (line === '}') {
      depth = Math.max(0, depth - 1);
      formattedLines.push(indentStr.repeat(depth) + line);
      continue;
    }
    
    // Handle regular lines
    formattedLines.push(indentStr.repeat(depth) + line);
    
    // Track depth changes
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    depth += openBraces - closeBraces;
    depth = Math.max(0, depth);
  }
  
  return formattedLines.join('\n');
}