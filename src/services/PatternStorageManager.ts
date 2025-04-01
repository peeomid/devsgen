import type { Pattern, PatternImportResult } from '../types/pattern';

/**
 * Storage utility for managing patterns in localStorage
 */
export class PatternStorageManager {
  private readonly storageKey = 'regex-patterns';
  private readonly isBrowser: boolean;
  
  constructor() {
    this.isBrowser = typeof window !== 'undefined';
  }
  
  /**
   * Get all user-created patterns from localStorage
   */
  public async getAllPatterns(): Promise<Pattern[]> {
    if (!this.isBrowser) return [];
    
    try {
      const patternsJson = localStorage.getItem(this.storageKey);
      if (!patternsJson) {
        return [];
      }
      
      const patterns = JSON.parse(patternsJson) as Pattern[];
      return patterns;
    } catch (error) {
      console.error('Error loading patterns from localStorage:', error);
      return [];
    }
  }
  
  /**
   * Save a pattern to localStorage
   */
  public savePattern(pattern: Pattern): boolean {
    if (!this.isBrowser) return false;
    
    try {
      const patterns = this.getPatterns();
      
      // Check if pattern already exists
      const existingIndex = patterns.findIndex(p => p.id === pattern.id);
      
      if (existingIndex >= 0) {
        // Update existing pattern
        patterns[existingIndex] = {
          ...pattern,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Add new pattern
        patterns.push({
          ...pattern,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(patterns));
      return true;
    } catch (error) {
      console.error('Error saving pattern to localStorage:', error);
      return false;
    }
  }
  
  /**
   * Delete a pattern from localStorage
   */
  public deletePattern(patternId: string): boolean {
    if (!this.isBrowser) return false;
    
    try {
      const patterns = this.getPatterns();
      const filteredPatterns = patterns.filter(p => p.id !== patternId);
      
      if (patterns.length === filteredPatterns.length) {
        return false; // Pattern not found
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(filteredPatterns));
      return true;
    } catch (error) {
      console.error('Error deleting pattern from localStorage:', error);
      return false;
    }
  }
  
  /**
   * Import patterns from JSON string
   */
  public async importPatterns(jsonString: string): Promise<PatternImportResult> {
    if (!this.isBrowser) {
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: ['Cannot import patterns in server environment']
      };
    }
    try {
      const result: PatternImportResult = {
        success: false,
        imported: 0,
        skipped: 0,
        errors: []
      };
      
      let importedPatterns: Pattern[];
      
      try {
        importedPatterns = JSON.parse(jsonString) as Pattern[];
      } catch (error) {
        result.errors = ['Invalid JSON format'];
        return result;
      }
      
      if (!Array.isArray(importedPatterns)) {
        result.errors = ['Imported data is not an array'];
        return result;
      }
      
      const currentPatterns = this.getPatterns();
      
      for (const pattern of importedPatterns) {
        // Validate required fields
        if (!this.isValidPattern(pattern)) {
          result.skipped++;
          result.errors.push(`Invalid pattern: ${pattern.name || 'Unnamed pattern'}`);
          continue;
        }
        
        // Check for duplicates
        const isDuplicate = currentPatterns.some(p => p.id === pattern.id);
        
        if (isDuplicate) {
          // Update existing pattern
          this.savePattern({
            ...pattern,
            updatedAt: new Date().toISOString()
          });
        } else {
          // Add new pattern
          this.savePattern({
            ...pattern,
            isBuiltIn: false, // Ensure imported patterns are not marked as built-in
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        
        result.imported++;
      }
      
      result.success = result.imported > 0;
      return result;
    } catch (error) {
      console.error('Error importing patterns:', error);
      return {
        success: false,
        imported: 0,
        skipped: 0,
        errors: ['Unknown error during import']
      };
    }
  }
  
  /**
   * Export patterns to JSON string
   */
  public exportPatterns(): string {
    if (!this.isBrowser) return '[]';
    
    try {
      const patterns = this.getPatterns();
      return JSON.stringify(patterns, null, 2);
    } catch (error) {
      console.error('Error exporting patterns:', error);
      return '[]';
    }
  }
  
  /**
   * Get patterns from localStorage
   */
  private getPatterns(): Pattern[] {
    if (!this.isBrowser) return [];
    
    try {
      const patternsJson = localStorage.getItem(this.storageKey);
      if (!patternsJson) {
        return [];
      }
      
      return JSON.parse(patternsJson) as Pattern[];
    } catch (error) {
      console.error('Error getting patterns from localStorage:', error);
      return [];
    }
  }
  
  /**
   * Validate pattern structure
   */
  private isValidPattern(pattern: any): boolean {
    return (
      pattern &&
      typeof pattern === 'object' &&
      typeof pattern.id === 'string' &&
      typeof pattern.name === 'string' &&
      typeof pattern.description === 'string' &&
      typeof pattern.searchRegex === 'string' &&
      typeof pattern.replaceRegex === 'string' &&
      pattern.example &&
      typeof pattern.example.input === 'string' &&
      typeof pattern.example.output === 'string'
    );
  }
}
