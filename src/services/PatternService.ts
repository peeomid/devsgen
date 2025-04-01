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
    
    // Create the pattern
    const newPattern: Pattern = {
      id,
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
    
    // Search in name, description, and tags
    const matchedPatterns = this.patterns.filter(pattern => {
      return (
        pattern.name.toLowerCase().includes(normalizedQuery) ||
        pattern.description.toLowerCase().includes(normalizedQuery) ||
        pattern.tags.some(tag => tag.toLowerCase().includes(normalizedQuery)) ||
        pattern.category.toLowerCase().includes(normalizedQuery)
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
   * Validate a pattern
   */
  public validatePattern(pattern: PatternInput | Pattern): PatternValidationResult {
    const errors = [];
    
    // Check required fields
    if (!pattern.name || pattern.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Name is required' });
    }
    
    if (!pattern.description || pattern.description.trim().length === 0) {
      errors.push({ field: 'description', message: 'Description is required' });
    }
    
    if (!pattern.searchRegex || pattern.searchRegex.trim().length === 0) {
      errors.push({ field: 'searchRegex', message: 'Search regex is required' });
    }
    
    if (!pattern.example || !pattern.example.input || !pattern.example.output) {
      errors.push({ field: 'example', message: 'Example input and output are required' });
    }
    
    // Validate regex syntax
    try {
      new RegExp(pattern.searchRegex);
    } catch (error) {
      errors.push({ field: 'searchRegex', message: 'Invalid search regex syntax' });
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  /**
   * Generate a pattern ID from name
   */
  private generatePatternId(name: string): string {
    // Create a slug from the name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Add a unique suffix
    const uniqueSuffix = nanoid(6);
    
    return `${slug}-${uniqueSuffix}`;
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
