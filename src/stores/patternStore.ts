import { atom, map } from 'nanostores';
import type { Pattern, TransformationResult } from '../types/pattern';
import { PatternService } from '../services/PatternService';
import { RegexService } from '../services/RegexService';

// Create instances of services
const patternService = new PatternService();
const regexService = new RegexService();

// Store for patterns
export const patternsStore = atom<Pattern[]>([]);
export const selectedPatternIdStore = atom<string | null>(null);
export const isLoadingStore = atom<boolean>(false);
export const searchQueryStore = atom<string>('');
export const searchResultsStore = atom<Pattern[]>([]);

// Store for transformation
export const transformationStore = map<{
  input: string;
  result: TransformationResult | null;
  isProcessing: boolean;
  error: string | null;
}>({
  input: '',
  result: null,
  isProcessing: false,
  error: null
});

// Store for UI state
export const uiStateStore = map<{
  isCommandPaletteOpen: boolean;
  isMobileMenuOpen: boolean;
  layout: 'vertical' | 'horizontal';
}>({
  isCommandPaletteOpen: false,
  isMobileMenuOpen: false,
  layout: 'horizontal' // Default layout, will be updated on client-side
});

// Initialize layout based on window width (client-side only)
if (typeof window !== 'undefined') {
  uiStateStore.setKey('layout', window.innerWidth > 768 ? 'horizontal' : 'vertical');
}

/**
 * Initialize the pattern store
 */
export async function initializePatternStore(): Promise<void> {
  isLoadingStore.set(true);
  
  try {
    // Initialize pattern service
    await patternService.initialize();
    
    // Get all patterns
    const patterns = await patternService.getAllPatterns();
    
    // Set patterns in store
    patternsStore.set(patterns);
    
    // Register patterns with regex service
    regexService.registerPatterns(patterns);
    
    // Try to load previously selected pattern from localStorage
    if (typeof window !== 'undefined' && patterns.length > 0) {
      const savedPatternId = localStorage.getItem('regex_selected_pattern');
      
      if (savedPatternId && patterns.some(p => p.id === savedPatternId)) {
        // If the saved pattern exists in our patterns, select it
        selectedPatternIdStore.set(savedPatternId);
      } else {
        // Otherwise select the first pattern
        selectedPatternIdStore.set(patterns[0].id);
      }
    }
  } catch (error) {
    console.error('Error initializing pattern store:', error);
  } finally {
    isLoadingStore.set(false);
  }
}

/**
 * Select a pattern
 */
export function selectPattern(patternId: string): void {
  selectedPatternIdStore.set(patternId);
}

/**
 * Get the selected pattern
 */
export function getSelectedPattern(): Pattern | undefined {
  const patterns = patternsStore.get();
  const selectedPatternId = selectedPatternIdStore.get();
  
  if (!selectedPatternId) {
    return undefined;
  }
  
  return patterns.find(pattern => pattern.id === selectedPatternId);
}

/**
 * Search patterns
 */
export async function searchPatterns(query: string): Promise<void> {
  searchQueryStore.set(query);
  
  if (!query) {
    searchResultsStore.set(patternsStore.get());
    return;
  }
  
  const result = await patternService.searchPatterns(query);
  searchResultsStore.set(result.patterns);
}

/**
 * Transform text using selected pattern
 */
export async function transformText(input: string): Promise<void> {
  const selectedPatternId = selectedPatternIdStore.get();
  
  if (!selectedPatternId) {
    transformationStore.setKey('error', 'No pattern selected');
    return;
  }
  
  transformationStore.setKey('isProcessing', true);
  transformationStore.setKey('input', input);
  transformationStore.setKey('error', null);
  
  try {
    const startTime = performance.now();
    const output = regexService.transform(selectedPatternId, input);
    const endTime = performance.now();
    
    transformationStore.setKey('result', {
      output,
      executionTime: endTime - startTime
    });
  } catch (error) {
    transformationStore.setKey('error', error instanceof Error ? error.message : 'Unknown error');
    transformationStore.setKey('result', null);
  } finally {
    transformationStore.setKey('isProcessing', false);
  }
}

/**
 * Transform text using custom regex
 */
export async function transformWithCustomRegex(
  input: string,
  searchRegex: string,
  replaceRegex: string
): Promise<void> {
  transformationStore.setKey('isProcessing', true);
  transformationStore.setKey('input', input);
  transformationStore.setKey('error', null);
  
  try {
    const startTime = performance.now();
    const output = regexService.transformWithRegex(input, searchRegex, replaceRegex);
    const endTime = performance.now();
    
    transformationStore.setKey('result', {
      output,
      executionTime: endTime - startTime
    });
  } catch (error) {
    transformationStore.setKey('error', error instanceof Error ? error.message : 'Unknown error');
    transformationStore.setKey('result', null);
  } finally {
    transformationStore.setKey('isProcessing', false);
  }
}

/**
 * Create a new pattern
 */
export async function createPattern(pattern: any): Promise<Pattern> {
  isLoadingStore.set(true);
  
  try {
    const newPattern = await patternService.createPattern(pattern);
    
    // Update patterns in store
    const patterns = await patternService.getAllPatterns();
    patternsStore.set(patterns);
    
    // Register with regex service
    regexService.registerPattern(newPattern.id, newPattern.searchRegex, newPattern.replaceRegex);
    
    return newPattern;
  } catch (error) {
    console.error('Error creating pattern:', error);
    throw error;
  } finally {
    isLoadingStore.set(false);
  }
}

/**
 * Update a pattern
 */
export async function updatePattern(patternId: string, updates: any): Promise<Pattern> {
  isLoadingStore.set(true);
  
  try {
    const updatedPattern = await patternService.updatePattern(patternId, updates);
    
    // Update patterns in store
    const patterns = await patternService.getAllPatterns();
    patternsStore.set(patterns);
    
    // Update in regex service
    regexService.registerPattern(updatedPattern.id, updatedPattern.searchRegex, updatedPattern.replaceRegex);
    
    return updatedPattern;
  } catch (error) {
    console.error('Error updating pattern:', error);
    throw error;
  } finally {
    isLoadingStore.set(false);
  }
}

/**
 * Delete a pattern
 */
export async function deletePattern(patternId: string): Promise<boolean> {
  isLoadingStore.set(true);
  
  try {
    const success = await patternService.deletePattern(patternId);
    
    if (success) {
      // Update patterns in store
      const patterns = await patternService.getAllPatterns();
      patternsStore.set(patterns);
      
      // If the deleted pattern was selected, select another one
      if (selectedPatternIdStore.get() === patternId) {
        selectedPatternIdStore.set(patterns.length > 0 ? patterns[0].id : null);
      }
    }
    
    return success;
  } catch (error) {
    console.error('Error deleting pattern:', error);
    throw error;
  } finally {
    isLoadingStore.set(false);
  }
}

/**
 * Toggle command palette
 */
export function toggleCommandPalette(): void {
  uiStateStore.setKey('isCommandPaletteOpen', !uiStateStore.get().isCommandPaletteOpen);
}

/**
 * Set layout mode
 */
export function setLayout(layout: 'vertical' | 'horizontal'): void {
  uiStateStore.setKey('layout', layout);
  
  // Only access localStorage in browser environment
  if (typeof window !== 'undefined') {
    localStorage.setItem('regex-layout', layout);
  }
}

/**
 * Initialize layout from localStorage
 */
export function initializeLayout(): void {
  // Only access localStorage in browser environment
  if (typeof window !== 'undefined') {
    const savedLayout = localStorage.getItem('regex-layout') as 'vertical' | 'horizontal' | null;
    if (savedLayout) {
      uiStateStore.setKey('layout', savedLayout);
    }
  }
}
