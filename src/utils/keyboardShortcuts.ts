/**
 * Keyboard shortcuts utility for the Regex Helper Tool
 * Provides a consistent way to register and handle keyboard shortcuts across the application
 */

type KeyboardShortcutHandler = (event: KeyboardEvent) => void;

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  handler: KeyboardShortcutHandler;
  id: string;
}

class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private isEnabled: boolean = true;
  private isBrowser: boolean;

  constructor() {
    this.isBrowser = typeof window !== 'undefined';
    
    // Initialize the event listener only in browser environment
    if (this.isBrowser) {
      document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
  }

  /**
   * Generate a unique ID for a keyboard shortcut
   */
  private generateShortcutId(shortcut: Omit<KeyboardShortcut, 'id'>): string {
    const modifiers = [
      shortcut.ctrlKey ? 'Ctrl' : '',
      shortcut.metaKey ? 'Meta' : '',
      shortcut.shiftKey ? 'Shift' : '',
      shortcut.altKey ? 'Alt' : '',
    ].filter(Boolean).join('+');
    
    return modifiers ? `${modifiers}+${shortcut.key}` : shortcut.key;
  }

  /**
   * Register a new keyboard shortcut
   */
  register(shortcut: Omit<KeyboardShortcut, 'id'>): string {
    const id = this.generateShortcutId(shortcut);
    this.shortcuts.set(id, { ...shortcut, id });
    return id;
  }

  /**
   * Unregister a keyboard shortcut by its ID
   */
  unregister(id: string): boolean {
    return this.shortcuts.delete(id);
  }

  /**
   * Enable all keyboard shortcuts
   */
  enable(): void {
    this.isEnabled = true;
  }

  /**
   * Disable all keyboard shortcuts
   */
  disable(): void {
    this.isEnabled = false;
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    // Skip if the event target is an input, textarea, or contentEditable element
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Allow specific shortcuts even in input fields
      const isCommandK = (event.metaKey || event.ctrlKey) && event.key === 'k';
      const isCommandEnter = (event.metaKey || event.ctrlKey) && event.key === 'Enter';
      
      if (!isCommandK && !isCommandEnter) {
        return;
      }
    }

    // Check for matching shortcuts
    for (const shortcut of this.shortcuts.values()) {
      if (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        !!event.ctrlKey === !!shortcut.ctrlKey &&
        !!event.metaKey === !!shortcut.metaKey &&
        !!event.shiftKey === !!shortcut.shiftKey &&
        !!event.altKey === !!shortcut.altKey
      ) {
        shortcut.handler(event);
        return;
      }
    }
  }

  /**
   * Get all registered shortcuts
   */
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Format a keyboard shortcut for display
   */
  formatShortcut(id: string): string {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) return '';

    const parts = [];
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.metaKey) parts.push('⌘');
    if (shortcut.shiftKey) parts.push('⇧');
    if (shortcut.altKey) parts.push('⌥');
    
    // Format the key nicely
    let key = shortcut.key;
    if (key === ' ') key = 'Space';
    else if (key === 'ArrowUp') key = '↑';
    else if (key === 'ArrowDown') key = '↓';
    else if (key === 'ArrowLeft') key = '←';
    else if (key === 'ArrowRight') key = '→';
    else if (key === 'Enter') key = '↵';
    else if (key === 'Escape') key = 'Esc';
    else if (key.length === 1) key = key.toUpperCase();
    
    parts.push(key);
    return parts.join('+');
  }
}

// Create a singleton instance
// Use a function to create the instance to avoid immediate execution during SSR
const createKeyboardShortcuts = () => {
  return new KeyboardShortcutManager();
};

// Export the singleton instance or a dummy implementation for SSR
const keyboardShortcuts = typeof window !== 'undefined' 
  ? createKeyboardShortcuts()
  : {
      register: () => '',
      unregister: () => false,
      enable: () => {},
      disable: () => {},
      getShortcuts: () => [],
      formatShortcut: () => ''
    };
export default keyboardShortcuts;
