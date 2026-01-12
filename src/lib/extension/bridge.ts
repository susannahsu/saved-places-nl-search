/**
 * Bridge between React app and Chrome Extension APIs
 * Handles communication with service worker and tabs
 */

export interface ExtensionBridge {
  isExtension: boolean;
  openMapsUrl: (url: string) => Promise<void>;
  getCurrentTab: () => Promise<chrome.tabs.Tab | null>;
}

/**
 * Check if running in Chrome Extension context
 */
function isExtensionContext(): boolean {
  return typeof chrome !== 'undefined' && 
         chrome.runtime && 
         chrome.runtime.id !== undefined;
}

/**
 * Open a Google Maps URL in the current tab
 */
async function openMapsUrl(url: string): Promise<void> {
  if (!isExtensionContext()) {
    // Fallback for local development: open in new tab
    window.open(url, '_blank');
    return;
  }
  
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab?.id) {
      // Update current tab with the Maps URL
      await chrome.tabs.update(tab.id, { url });
    } else {
      // Fallback: create new tab
      await chrome.tabs.create({ url });
    }
  } catch (error) {
    console.error('Error opening Maps URL:', error);
    // Final fallback
    window.open(url, '_blank');
  }
}

/**
 * Get the current active tab
 */
async function getCurrentTab(): Promise<chrome.tabs.Tab | null> {
  if (!isExtensionContext()) {
    return null;
  }
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab || null;
  } catch (error) {
    console.error('Error getting current tab:', error);
    return null;
  }
}

/**
 * Create extension bridge instance
 */
export function createExtensionBridge(): ExtensionBridge {
  return {
    isExtension: isExtensionContext(),
    openMapsUrl,
    getCurrentTab,
  };
}

// Singleton instance
export const extensionBridge = createExtensionBridge();
