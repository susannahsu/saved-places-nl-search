/**
 * Content Script for Google Maps
 * Injects a "Search Saved" button on Google Maps pages
 */

(function() {
  'use strict';
  
  // Only run once
  if (window.__savedPlacesInjected) return;
  window.__savedPlacesInjected = true;
  
  /**
   * Create and inject the "Search Saved" button
   */
  function injectButton() {
    // Check if button already exists
    if (document.getElementById('savedplaces-search-btn')) return;
    
    const button = document.createElement('button');
    button.id = 'savedplaces-search-btn';
    button.className = 'savedplaces-search-btn';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <span>Search Saved</span>
    `;
    button.title = 'Search your saved places with natural language';
    
    button.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error opening side panel:', chrome.runtime.lastError);
        }
      });
    });
    
    document.body.appendChild(button);
  }
  
  // Inject button when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectButton);
  } else {
    injectButton();
  }
  
  // Re-inject if Google Maps does a soft navigation (SPA behavior)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      setTimeout(injectButton, 1000); // Delay to let Maps UI settle
    }
  }).observe(document.body, { childList: true, subtree: true });
})();
