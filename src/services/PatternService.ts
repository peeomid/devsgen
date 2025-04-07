import { nanoid } from 'nanoid';
import type { Pattern, PatternInput, PatternSearchResult, PatternValidationResult } from '../types/pattern';
import { PatternCategory } from '../types/pattern';
import { PatternStorageManager } from './PatternStorageManager';
import builtInPatterns from '../data/built-in-patterns.json';

/**
 * Service for managing regex patterns
 */
export class PatternService {
  private patternStorageManager: PatternStorageManager;
  private patterns: Pattern[] = [];
  private isInitialized = false;
  
  constructor() {
    this.patternStorageManager = new PatternStorageManager();
  }
  
  /**
   * Initialize the pattern service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    // Load built-in patterns
    const typedBuiltInPatterns = builtInPatterns as Pattern[];
    
    // Load user patterns from storage
    const userPatterns = await this.patternStorageManager.getAllPatterns();
    
    // Combine patterns, with user patterns taking precedence
    this.patterns = [
      ...typedBuiltInPatterns,
      ...userPatterns
    ];
    
    this.isInitialized = true;
  }
  
  /**
   * Get all patterns
   */
  public async getAllPatterns(): Promise<Pattern[]> {
    await this.ensureInitialized();
    return this.patterns;
  }
  
  /**
   * Get a pattern by ID
   */
  public async getPatternById(id: string): Promise<Pattern | undefined> {
    await this.ensureInitialized();
    return this.patterns.find(pattern => pattern.id === id);
  }
  
  /**
   * Create a new pattern
   */
  public async createPattern(patternInput: PatternInput): Promise<Pattern> {
    await this.ensureInitialized();
    
    // Validate the pattern
    const validationResult = this.validatePattern(patternInput);
    if (!validationResult.isValid) {
      throw new Error(`Invalid pattern: ${validationResult.errors?.map(e => e.message).join(', ')}`);
    }
    
    // Generate a unique ID
    const id = this.generatePatternId(patternInput.name);
    
    // Generate a unique key number
    const keyNumber = this.generateNextKeyNumber();
    
    // Create the pattern
    const newPattern: Pattern = {
      id,
      keyNumber,
      shortKeys: patternInput.shortKeys || [],
      ...patternInput,
      tags: patternInput.tags || [],
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save to storage
    const success = this.patternStorageManager.savePattern(newPattern);
    if (!success) {
      throw new Error('Failed to save pattern');
    }
    
    // Add to in-memory patterns
    this.patterns.push(newPattern);
    
    return newPattern;
  }
  
  /**
   * Update an existing pattern
   */
  public async updatePattern(id: string, patternInput: Partial<PatternInput>): Promise<Pattern> {
    await this.ensureInitialized();
    
    // Find the pattern
    const existingPattern = await this.getPatternById(id);
    if (!existingPattern) {
      throw new Error(`Pattern not found: ${id}`);
    }
    
    // Don't allow updating built-in patterns
    if (existingPattern.isBuiltIn) {
      throw new Error('Cannot update built-in patterns');
    }
    
    // Create the updated pattern
    const updatedPattern: Pattern = {
      ...existingPattern,
      ...patternInput,
      updatedAt: new Date().toISOString()
    };
    
    // Validate the updated pattern
    const validationResult = this.validatePattern(updatedPattern);
    if (!validationResult.isValid) {
      throw new Error(`Invalid pattern: ${validationResult.errors?.map(e => e.message).join(', ')}`);
    }
    
    // Save to storage
    const success = this.patternStorageManager.savePattern(updatedPattern);
    if (!success) {
      throw new Error('Failed to update pattern');
    }
    
    // Update in-memory pattern
    const index = this.patterns.findIndex(p => p.id === id);
    if (index >= 0) {
      this.patterns[index] = updatedPattern;
    }
    
    return updatedPattern;
  }
  
  /**
   * Delete a pattern
   */
  public async deletePattern(id: string): Promise<boolean> {
    await this.ensureInitialized();
    
    // Find the pattern
    const existingPattern = await this.getPatternById(id);
    if (!existingPattern) {
      return false;
    }
    
    // Don't allow deleting built-in patterns
    if (existingPattern.isBuiltIn) {
      throw new Error('Cannot delete built-in patterns');
    }
    
    // Delete from storage
    const success = this.patternStorageManager.deletePattern(id);
    if (!success) {
      return false;
    }
    
    // Remove from in-memory patterns
    this.patterns = this.patterns.filter(p => p.id !== id);
    
    return true;
  }
  
  /**
   * Search for patterns
   */
  public async searchPatterns(query: string): Promise<PatternSearchResult> {
    await this.ensureInitialized();
    
    if (!query) {
      return {
        patterns: this.patterns,
        query: ''
      };
    }
    
    const normalizedQuery = query.toLowerCase();
    
    // Check if query is a number (key number)
    const isNumeric = /^\d+$/.test(normalizedQuery);
    
    // Prioritize exact matches for key numbers and short keys
    if (isNumeric) {
      const keyNumber = parseInt(normalizedQuery, 10);
      const exactMatch = this.patterns.find(pattern => pattern.keyNumber === keyNumber);
      
      if (exactMatch) {
        return {
          patterns: [exactMatch],
          query
        };
      }
    }
    
    // Check for exact matches on short keys
    const shortKeyMatches = this.patterns.filter(pattern => 
      pattern.shortKeys.some(key => key.toLowerCase() === normalizedQuery)
    );
    
    if (shortKeyMatches.length > 0) {
      return {
        patterns: shortKeyMatches,
        query
      };
    }
    
    // If no exact matches, search in all fields including short keys
    const matchedPatterns = this.patterns.filter(pattern => {
      return (
        pattern.name.toLowerCase().includes(normalizedQuery) ||
        pattern.description.toLowerCase().includes(normalizedQuery) ||
        pattern.tags.some(tag => tag.toLowerCase().includes(normalizedQuery)) ||
        pattern.category.toLowerCase().includes(normalizedQuery) ||
        pattern.shortKeys.some(key => key.toLowerCase().includes(normalizedQuery)) ||
        (isNumeric && pattern.keyNumber.toString().includes(normalizedQuery))
      );
    });
    
    return {
      patterns: matchedPatterns,
      query
    };
  }
  
  /**
   * Get patterns by category
   */
  public async getPatternsByCategory(category: PatternCategory): Promise<Pattern[]> {
    await this.ensureInitialized();
    return this.patterns.filter(pattern => pattern.category === category);
  }
  
  /**
   * Import patterns from JSON
   */
  public async importPatterns(jsonString: string): Promise<Pattern[]> {
    await this.ensureInitialized();
    
    const result = await this.patternStorageManager.importPatterns(jsonString);
    
    if (!result.success) {
      throw new Error(`Import failed: ${result.errors?.join(', ')}`);
    }
    
    // Reload patterns from storage
    const userPatterns = await this.patternStorageManager.getAllPatterns();
    
    // Update in-memory patterns
    this.patterns = [
      ...builtInPatterns as Pattern[],
      ...userPatterns
    ];
    
    return userPatterns;
  }
  
  /**
   * Export user patterns to JSON
   */
  public async exportPatterns(): Promise<string> {
    await this.ensureInitialized();
    
    // Get only user-created patterns
    const userPatterns = this.patterns.filter(pattern => !pattern.isBuiltIn);
    
    return JSON.stringify(userPatterns, null, 2);
  }
  
  /**
   * Validate pattern input data
   */
  private validatePattern(patternInput: PatternInput | Pattern): PatternValidationResult {
    const errors: { field: string; message: string }[] = [];

    // Basic field validation
    if (!patternInput.name?.trim()) {
      errors.push({ field: 'name', message: 'Pattern name is required' });
    }
    if (!patternInput.description?.trim()) {
      errors.push({ field: 'description', message: 'Pattern description is required' });
    }

    // Short key validation
    if (patternInput.shortKeys && patternInput.shortKeys.length > 0) {
      const uniqueShortKeys = new Set<string>();
      for (const key of patternInput.shortKeys) {
        if (!key) continue; // Skip empty keys if allowed
        const lowerKey = key.toLowerCase();
        
        if (key.length > 3) {
          errors.push({ field: 'shortKeys', message: `Short key '${key}' exceeds maximum length of 3 characters` });
        }
        if (!/^[a-z0-9]+$/i.test(key)) { // Allow uppercase alphanumeric too
          errors.push({ field: 'shortKeys', message: `Short key '${key}' must contain only alphanumeric characters` });
        }
        
        // Check for uniqueness within the pattern being validated
        if (uniqueShortKeys.has(lowerKey)) {
           errors.push({ field: 'shortKeys', message: `Duplicate short key '${key}' within the same pattern` });
        }
        uniqueShortKeys.add(lowerKey);

        // Check for uniqueness across all patterns (excluding the pattern being edited, if applicable)
        const patternId = 'id' in patternInput ? patternInput.id : undefined;
        const existingPatternWithKey = this.patterns.find(p => p.id !== patternId && p.shortKeys.some(sk => sk.toLowerCase() === lowerKey));
        if (existingPatternWithKey) {
          errors.push({ field: 'shortKeys', message: `Short key '${key}' is already used by pattern '${existingPatternWithKey.name}'` });
        }
      }
    }

    // Validate regex syntax
    if ('searchRegex' in patternInput && patternInput.searchRegex) { 
      try {
        new RegExp(patternInput.searchRegex, patternInput.flags || ''); // Use flags if available
      } catch (error) {
        errors.push({ field: 'searchRegex', message: `Invalid search regex: ${error instanceof Error ? error.message : 'Unknown error'}` });
      }
    }
    // TODO: Add validation for replaceRegex if needed

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Generate a unique pattern ID based on the name
   */
  private generatePatternId(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    const timestamp = Date.now().toString(36);
    
    return `${base}-${timestamp}`;
  }
  
  /**
   * Generate the next key number for a new pattern
   * This finds the highest existing key number and adds 1
   */
  private generateNextKeyNumber(): number {
    if (this.patterns.length === 0) {
      return 1; // Start with 1 if no patterns exist
    }
    
    const highestKeyNumber = Math.max(...this.patterns.map(p => p.keyNumber || 0));
    return highestKeyNumber + 1;
  }
  
  /**
   * Ensure the service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
}
