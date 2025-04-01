import type { Pattern, RegexValidationResult } from '../types/pattern';

/**
 * Service for handling regex transformations and validations
 */
export class RegexService {
  private patterns: Map<string, { searchRegex: string; replaceRegex: string; flags?: string }> = new Map();
  
  /**
   * Register a pattern for transformation
   */
  public registerPattern(id: string, searchRegex: string, replaceRegex: string, flags?: string): void {
    // Validate the regex before registering
    const validation = this.validateRegex(searchRegex);
    if (!validation.isValid) {
      throw new Error(`Invalid search regex: ${validation.error}`);
    }
    
    this.patterns.set(id, { searchRegex, replaceRegex, flags });
  }
  
  /**
   * Register multiple patterns at once
   */
  public registerPatterns(patterns: Pattern[]): void {
    for (const pattern of patterns) {
      this.registerPattern(pattern.id, pattern.searchRegex, pattern.replaceRegex, pattern.flags);
    }
  }
  
  /**
   * Transform text using a registered pattern
   */
  public transform(patternId: string, input: string): string {
    const pattern = this.patterns.get(patternId);
    
    if (!pattern) {
      throw new Error(`Pattern not found: ${patternId}`);
    }
    
    // Special cases for case conversions
    if (patternId === 'kebab-to-camel') {
      return this.transformKebabToCamel(input);
    } else if (patternId === 'camel-to-kebab') {
      return this.transformCamelToKebab(input);
    } else if (patternId === 'path-slash-to-dot') {
      return this.transformSlashToDot(input);
    }
    
    return this.transformWithRegex(input, pattern.searchRegex, pattern.replaceRegex, pattern.flags);
  }
  
  /**
   * Special handler for kebab-to-camel case conversion
   */
  private transformKebabToCamel(input: string): string {
    return input.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  }
  
  /**
   * Special handler for camel-to-kebab case conversion
   */
  private transformCamelToKebab(input: string): string {
    return input.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
  }
  
  /**
   * Special handler for slash-to-dot path conversion
   */
  private transformSlashToDot(input: string): string {
    return input.replace(/\//g, '.');
  }
  
  /**
   * Transform text using provided regex patterns
   */
  public transformWithRegex(input: string, searchRegex: string, replaceRegex: string, flags?: string): string {
    try {
      // Validate the regex
      const validation = this.validateRegex(searchRegex);
      if (!validation.isValid) {
        throw new Error(`Invalid regex: ${validation.error}`);
      }
      
      // Create regex object with specified flags or default to global
      const regex = new RegExp(searchRegex, flags || 'g');
      
      // Perform the transformation
      return input.replace(regex, replaceRegex);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Transformation error: ${error.message}`);
      }
      throw new Error('Unknown transformation error');
    }
  }
  
  /**
   * Validate a regex pattern
   */
  public validateRegex(regex: string): RegexValidationResult {
    try {
      // Test if the regex is valid by creating a RegExp object
      new RegExp(regex);
      return { isValid: true };
    } catch (error) {
      if (error instanceof Error) {
        return {
          isValid: false,
          error: error.message
        };
      }
      return {
        isValid: false,
        error: 'Invalid regular expression'
      };
    }
  }
  
  /**
   * Get a registered pattern
   */
  public getPattern(patternId: string): { searchRegex: string; replaceRegex: string; flags?: string } | undefined {
    return this.patterns.get(patternId);
  }
  
  /**
   * Check if a pattern is registered
   */
  public hasPattern(patternId: string): boolean {
    return this.patterns.has(patternId);
  }
  
  /**
   * Clear all registered patterns
   */
  public clearPatterns(): void {
    this.patterns.clear();
  }
}
