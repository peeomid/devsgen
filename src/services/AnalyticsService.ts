/**
 * Google Analytics Service
 * Provides utility functions for tracking events across the application
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

class AnalyticsService {
  private isEnabled(): boolean {
    return typeof window !== 'undefined' && typeof window.gtag === 'function';
  }

  /**
   * Track a custom event
   */
  private trackEvent(eventName: string, parameters: Record<string, any> = {}) {
    if (!this.isEnabled()) return;
    
    try {
      window.gtag('event', eventName, parameters);
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }

  // Pattern-related events
  patternSelected(patternId: string, patternName: string, selectionMethod: 'command_palette' | 'url_direct' | 'keyboard_shortcut') {
    this.trackEvent('pattern_selected', {
      pattern_id: patternId,
      pattern_name: patternName,
      selection_method: selectionMethod,
      event_category: 'pattern_interaction'
    });
  }

  patternModified(patternId: string, modificationType: 'search' | 'replace' | 'flags') {
    this.trackEvent('pattern_modified', {
      pattern_id: patternId,
      modification_type: modificationType,
      event_category: 'pattern_interaction'
    });
  }

  patternReset(patternId: string) {
    this.trackEvent('pattern_reset', {
      pattern_id: patternId,
      event_category: 'pattern_interaction'
    });
  }

  // Transform events
  textTransformed(patternId: string, inputLength: number, outputLength: number, executionTime: number) {
    this.trackEvent('text_transformed', {
      pattern_id: patternId,
      input_length: inputLength,
      output_length: outputLength,
      execution_time: executionTime,
      event_category: 'transformation'
    });
  }

  transformError(patternId: string, errorType: string) {
    this.trackEvent('transform_error', {
      pattern_id: patternId,
      error_type: errorType,
      event_category: 'error'
    });
  }

  // Pattern management events
  patternsImported(count: number, method: 'json_paste' | 'file_upload') {
    this.trackEvent('patterns_imported', {
      pattern_count: count,
      import_method: method,
      event_category: 'pattern_management'
    });
  }

  patternsExported(count: number, method: 'json_copy' | 'file_download') {
    this.trackEvent('patterns_exported', {
      pattern_count: count,
      export_method: method,
      event_category: 'pattern_management'
    });
  }

  // User interface events
  keyboardShortcutUsed(shortcut: string, action: string) {
    this.trackEvent('keyboard_shortcut_used', {
      shortcut: shortcut,
      action: action,
      event_category: 'ui_interaction'
    });
  }

  commandPaletteOpened(method: 'keyboard' | 'button') {
    this.trackEvent('command_palette_opened', {
      open_method: method,
      event_category: 'ui_interaction'
    });
  }

  copyActionPerformed(target: 'output' | 'pattern_json', method: 'button' | 'keyboard') {
    this.trackEvent('copy_performed', {
      copy_target: target,
      copy_method: method,
      event_category: 'ui_interaction'
    });
  }

  // Page view events for pattern-specific URLs
  patternPageViewed(patternId: string, patternName: string, isDirectAccess: boolean) {
    this.trackEvent('pattern_page_view', {
      pattern_id: patternId,
      pattern_name: patternName,
      is_direct_access: isDirectAccess,
      page_path: window.location.pathname,
      event_category: 'page_navigation'
    });
  }

  // Search and discovery events
  patternSearched(query: string, resultsCount: number) {
    this.trackEvent('pattern_searched', {
      search_query: query,
      results_count: resultsCount,
      event_category: 'search'
    });
  }

  // Tool engagement events
  toolSessionStarted(toolName: string) {
    this.trackEvent('tool_session_started', {
      tool_name: toolName,
      event_category: 'tool_engagement'
    });
  }

  toolSessionDuration(toolName: string, durationSeconds: number) {
    this.trackEvent('tool_session_duration', {
      tool_name: toolName,
      duration_seconds: durationSeconds,
      event_category: 'tool_engagement'
    });
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();
export default analytics;