/**
 * event-monitor.js - Real-time event monitoring dashboard for Miami AI Concierge
 * 
 * This module creates a developer dashboard that displays all events flowing
 * through the EventBus system in real-time, with filtering and inspection capabilities.
 */

import eventBus from './src/core/EventBus.js';
import { ERROR_EVENTS } from './ErrorEvents.js';
import { FORM_EVENTS } from './src/core/FormEvents.js';
import { MAP_EVENTS } from './MapEvents.js';

// Configuration
const CONFIG = {
  maxEvents: 100,           // Maximum number of events to store in history
  defaultExpanded: false,   // Whether dashboard is expanded by default
  position: 'bottom-right', // Dashboard position: 'bottom-right', 'bottom-left', 'top-right', 'top-left'
  theme: 'dark',            // Dashboard theme: 'dark', 'light'
  showTimestamps: true,     // Whether to show timestamps
  groupSimilarEvents: true, // Whether to group similar events
  filterSystemEvents: true, // Whether to filter out system events by default
};

// Event categories with colors
const EVENT_CATEGORIES = {
  'error': { color: '#ff5252', icon: '🚨' },
  'form': { color: '#4caf50', icon: '📝' },
  'map': { color: '#2196f3', icon: '🗺️' },
  'analytics': { color: '#9c27b0', icon: '📊' },
  'system': { color: '#757575', icon: '⚙️' },
  'unknown': { color: '#ff9800', icon: '❓' }
};

// Event history storage
let eventHistory = [];
let isMonitoringActive = false;
let dashboardElement = null;
let eventListElement = null;
let filterInput = null;
let categoryFilters = {};
let isExpanded = CONFIG.defaultExpanded;

/**
 * Initialize the event monitoring dashboard
 */
export function initEventMonitor() {
  console.log('🔍 Initializing event monitoring dashboard...');
  
  // Create dashboard if it doesn't exist
  if (!dashboardElement) {
    createDashboardUI();
  }
  
  // Start monitoring events if not already active
  if (!isMonitoringActive) {
    startEventMonitoring();
  }
  
  return {
    show: showDashboard,
    hide: hideDashboard,
    toggle: toggleDashboard,
    clear: clearEventHistory,
    getHistory: getEventHistory
  };
}

/**
 * Create the dashboard UI
 */
function createDashboardUI() {
  // Create main container
  dashboardElement = document.createElement('div');
  dashboardElement.id = 'event-monitor-dashboard';
  dashboardElement.className = `event-monitor ${CONFIG.position} ${CONFIG.theme} ${isExpanded ? 'expanded' : 'collapsed'}`;
  
  // Create header
  const header = document.createElement('div');
  header.className = 'event-monitor-header';
  header.innerHTML = `
    <div class="event-monitor-title">
      <span class="event-monitor-icon">📡</span>
      <h3>Event Monitor</h3>
    </div>
    <div class="event-monitor-controls">
      <button class="event-monitor-clear-btn" title="Clear Events">🧹</button>
      <button class="event-monitor-filter-btn" title="Filter Events">🔍</button>
      <button class="event-monitor-toggle-btn" title="Toggle Dashboard">${isExpanded ? '▼' : '▲'}</button>
    </div>
  `;
  
  // Create filter panel
  const filterPanel = document.createElement('div');
  filterPanel.className = 'event-monitor-filter-panel hidden';
  filterPanel.innerHTML = `
    <div class="event-monitor-search">
      <input type="text" placeholder="Filter events..." class="event-monitor-filter-input">
    </div>
    <div class="event-monitor-categories">
      ${Object.entries(EVENT_CATEGORIES).map(([category, { color, icon }]) => `
        <label class="event-monitor-category" style="--category-color: ${color}">
          <input type="checkbox" data-category="${category}" ${category !== 'system' || !CONFIG.filterSystemEvents ? 'checked' : ''}>
          <span>${icon} ${category}</span>
        </label>
      `).join('')}
    </div>
  `;
  
  // Create event list container
  eventListElement = document.createElement('div');
  eventListElement.className = 'event-monitor-events';
  
  // Create footer
  const footer = document.createElement('div');
  footer.className = 'event-monitor-footer';
  footer.innerHTML = `
    <div class="event-monitor-stats">
      <span class="event-monitor-count">0 events</span>
    </div>
    <div class="event-monitor-actions">
      <button class="event-monitor-export-btn" title="Export Events">📤</button>
      <button class="event-monitor-settings-btn" title="Settings">⚙️</button>
    </div>
  `;
  
  // Assemble dashboard
  dashboardElement.appendChild(header);
  dashboardElement.appendChild(filterPanel);
  dashboardElement.appendChild(eventListElement);
  dashboardElement.appendChild(footer);
  
  // Add dashboard to document
  document.body.appendChild(dashboardElement);
  
  // Store filter input reference
  filterInput = filterPanel.querySelector('.event-monitor-filter-input');
  
  // Initialize category filters
  Object.keys(EVENT_CATEGORIES).forEach(category => {
    categoryFilters[category] = category !== 'system' || !CONFIG.filterSystemEvents;
  });
  
  // Add event listeners
  setupDashboardEventListeners();
  
  // Add styles
  addDashboardStyles();
  
  console.log('✅ Event monitor dashboard created');
}

/**
 * Set up event listeners for dashboard controls
 */
function setupDashboardEventListeners() {
  // Toggle button
  const toggleBtn = dashboardElement.querySelector('.event-monitor-toggle-btn');
  toggleBtn.addEventListener('click', toggleDashboard);
  
  // Clear button
  const clearBtn = dashboardElement.querySelector('.event-monitor-clear-btn');
  clearBtn.addEventListener('click', clearEventHistory);
  
  // Filter button
  const filterBtn = dashboardElement.querySelector('.event-monitor-filter-btn');
  const filterPanel = dashboardElement.querySelector('.event-monitor-filter-panel');
  filterBtn.addEventListener('click', () => {
    filterPanel.classList.toggle('hidden');
  });
  
  // Filter input
  filterInput.addEventListener('input', updateEventList);
  
  // Category checkboxes
  dashboardElement.querySelectorAll('.event-monitor-category input').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const category = checkbox.dataset.category;
      categoryFilters[category] = checkbox.checked;
      updateEventList();
    });
  });
  
  // Export button
  const exportBtn = dashboardElement.querySelector('.event-monitor-export-btn');
  exportBtn.addEventListener('click', exportEventHistory);
  
  // Settings button
  const settingsBtn = dashboardElement.querySelector('.event-monitor-settings-btn');
  settingsBtn.addEventListener('click', showSettings);
}

/**
 * Add CSS styles for the dashboard
 */
function addDashboardStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    .event-monitor {
      position: fixed;
      z-index: 9999;
      width: 400px;
      max-height: 500px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      font-size: 14px;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    
    .event-monitor.bottom-right {
      bottom: 20px;
      right: 20px;
    }
    
    .event-monitor.bottom-left {
      bottom: 20px;
      left: 20px;
    }
    
    .event-monitor.top-right {
      top: 20px;
      right: 20px;
    }
    
    .event-monitor.top-left {
      top: 20px;
      left: 20px;
    }
    
    .event-monitor.dark {
      background-color: #1e1e1e;
      color: #e0e0e0;
    }
    
    .event-monitor.light {
      background-color: #ffffff;
      color: #333333;
    }
    
    .event-monitor.collapsed {
      height: 50px;
    }
    
    .event-monitor.expanded {
      height: 500px;
    }
    
    .event-monitor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      cursor: pointer;
    }
    
    .event-monitor.light .event-monitor-header {
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .event-monitor-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .event-monitor-title h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .event-monitor-controls {
      display: flex;
      gap: 8px;
    }
    
    .event-monitor-controls button {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    
    .event-monitor.dark .event-monitor-controls button:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    .event-monitor.light .event-monitor-controls button:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }
    
    .event-monitor-filter-panel {
      padding: 10px 15px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .event-monitor.light .event-monitor-filter-panel {
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .event-monitor-filter-panel.hidden {
      display: none;
    }
    
    .event-monitor-search {
      margin-bottom: 10px;
    }
    
    .event-monitor-filter-input {
      width: 100%;
      padding: 8px 10px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background-color: rgba(255, 255, 255, 0.1);
      color: inherit;
    }
    
    .event-monitor.light .event-monitor-filter-input {
      border: 1px solid rgba(0, 0, 0, 0.2);
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    .event-monitor-categories {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .event-monitor-category {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 4px;
      background-color: rgba(255, 255, 255, 0.1);
      cursor: pointer;
    }
    
    .event-monitor-events {
      overflow-y: auto;
      height: calc(100% - 130px);
    }
    
    .event-monitor-event {
      padding: 10px 15px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .event-monitor.light .event-monitor-event {
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }
    
    .event-monitor-event:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
    
    .event-monitor.light .event-monitor-event:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    .event-monitor-event-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    
    .event-monitor-event-name {
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .event-monitor-event-category {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 6px;
    }
    
    .event-monitor-event-time {
      font-size: 12px;
      opacity: 0.7;
    }
    
    .event-monitor-event-data {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 12px;
      white-space: pre-wrap;
      overflow-x: auto;
      max-height: 100px;
      padding: 8px;
      border-radius: 4px;
      background-color: rgba(0, 0, 0, 0.2);
      display: none;
    }
    
    .event-monitor.light .event-monitor-event-data {
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    .event-monitor-event.expanded .event-monitor-event-data {
      display: block;
    }
    
    .event-monitor-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .event-monitor.light .event-monitor-footer {
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .event-monitor-count {
      font-size: 12px;
      opacity: 0.7;
    }
    
    .event-monitor-actions {
      display: flex;
      gap: 8px;
    }
    
    .event-monitor-actions button {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    
    .event-monitor.dark .event-monitor-actions button:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    .event-monitor.light .event-monitor-actions button:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }
    
    .event-monitor-empty {
      padding: 20px;
      text-align: center;
      opacity: 0.7;
      font-style: italic;
    }
  `;
  
  document.head.appendChild(styleElement);
}

/**
 * Start monitoring events
 */
function startEventMonitoring() {
  console.log('🔄 Starting event monitoring...');
  
  // Store original emit method
  const originalEmit = eventBus.emit;
  
  // Create monitoring wrapper
  eventBus.emit = function(eventName, data) {
    // Determine event category
    const category = getEventCategory(eventName);
    
    // Create event record
    const eventRecord = {
      id: generateEventId(),
      name: eventName,
      data,
      category,
      timestamp: Date.now(),
      formattedTime: formatTimestamp(Date.now())
    };
    
    // Add to history
    addEventToHistory(eventRecord);
    
    // Call original method
    return originalEmit.call(this, eventName, data);
  };
  
  isMonitoringActive = true;
  console.log('✅ Event monitoring started');
}

/**
 * Add event to history
 * @param {Object} eventRecord - Event record to add
 */
function addEventToHistory(eventRecord) {
  // Add to beginning of array for newest-first order
  eventHistory.unshift(eventRecord);
  
  // Limit history size
  if (eventHistory.length > CONFIG.maxEvents) {
    eventHistory = eventHistory.slice(0, CONFIG.maxEvents);
  }
  
  // Update UI
  updateEventList();
  updateEventCount();
}

/**
 * Update the event list in the UI
 */
function updateEventList() {
  if (!eventListElement) return;
  
  // Get filter text
  const filterText = filterInput ? filterInput.value.toLowerCase() : '';
  
  // Filter events
  const filteredEvents = eventHistory.filter(event => {
    // Check category filter
    if (!categoryFilters[event.category]) {
      return false;
    }
    
    // Check text filter
    if (filterText) {
      return (
        event.name.toLowerCase().includes(filterText) ||
        JSON.stringify(event.data).toLowerCase().includes(filterText)
      );
    }
    
    return true;
  });
  
  // Clear current list
  eventListElement.innerHTML = '';
  
  // Add filtered events
  if (filteredEvents.length === 0) {
    eventListElement.innerHTML = '<div class="event-monitor-empty">No events match the current filters</div>';
  } else {
    filteredEvents.forEach(event => {
      const eventElement = createEventElement(event);
      eventListElement.appendChild(eventElement);
    });
  }
}

/**
 * Create an element for an event
 * @param {Object} event - Event record
 * @returns {HTMLElement} Event element
 */
function createEventElement(event) {
  const { color, icon } = EVENT_CATEGORIES[event.category] || EVENT_CATEGORIES.unknown;
  
  const eventElement = document.createElement('div');
  eventElement.className = 'event-monitor-event';
  eventElement.dataset.eventId = event.id;
  
  eventElement.innerHTML = `
    <div class="event-monitor-event-header">
      <div class="event-monitor-event-name">
        <span class="event-monitor-event-category" style="background-color: ${color}"></span>
        ${icon} ${event.name}
      </div>
      <div class="event-monitor-event-time">${event.formattedTime}</div>
    </div>
    <div class="event-monitor-event-data">${formatEventData(event.data)}</div>
  `;
  
  // Add click handler to toggle expanded state
  eventElement.addEventListener('click', () => {
    eventElement.classList.toggle('expanded');
  });
  
  return eventElement;
}

/**
 * Format event data for display
 * @param {*} data - Event data
 * @returns {string} Formatted data
 */
function formatEventData(data) {
  try {
    return JSON.stringify(data, null, 2);
  } catch (error) {
    return `[Error formatting data: ${error.message}]`;
  }
}

/**
 * Update the event count in the UI
 */
function updateEventCount() {
  const countElement = dashboardElement.querySelector('.event-monitor-count');
  if (countElement) {
    countElement.textContent = `${eventHistory.length} event${eventHistory.length !== 1 ? 's' : ''}`;
  }
}

/**
 * Show the dashboard
 */
function showDashboard() {
  if (!dashboardElement) return;
  
  dashboardElement.classList.remove('hidden');
  console.log('🔍 Event monitor dashboard shown');
}

/**
 * Hide the dashboard
 */
function hideDashboard() {
  if (!dashboardElement) return;
  
  dashboardElement.classList.add('hidden');
  console.log('🔍 Event monitor dashboard hidden');
}

/**
 * Toggle dashboard expanded/collapsed state
 */
function toggleDashboard() {
  if (!dashboardElement) return;
  
  isExpanded = !isExpanded;
  dashboardElement.classList.toggle('expanded', isExpanded);
  dashboardElement.classList.toggle('collapsed', !isExpanded);
  
  const toggleBtn = dashboardElement.querySelector('.event-monitor-toggle-btn');
  if (toggleBtn) {
    toggleBtn.textContent = isExpanded ? '▼' : '▲';
  }
  
  console.log(`🔍 Event monitor dashboard ${isExpanded ? 'expanded' : 'collapsed'}`);
}

/**
 * Clear event history
 */
function clearEventHistory() {
  eventHistory = [];
  updateEventList();
  updateEventCount();
  console.log('🧹 Event history cleared');
}

/**
 * Get event history
 * @returns {Array} Event history
 */
function getEventHistory() {
  return [...eventHistory];
}

/**
 * Export event history
 */
function exportEventHistory() {
  try {
    const exportData = {
      timestamp: Date.now(),
      events: eventHistory
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileName = `event-history-${formatTimestamp(Date.now(), true)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
    
    console.log('📤 Event history exported');
  } catch (error) {
    console.error('Failed to export event history:', error);
  }
}

/**
 * Show settings panel
 */
function showSettings() {
  const settings = prompt('Settings (JSON format):', JSON.stringify(CONFIG, null, 2));
  if (settings) {
    try {
      const newConfig = JSON.parse(settings);
      Object.assign(CONFIG, newConfig);
      console.log('⚙️ Settings updated:', CONFIG);
    } catch (error) {
      alert('Invalid JSON format');
    }
  }
}

/**
 * Get category for an event
 * @param {string} eventName - Event name
 * @returns {string} Category name
 */
function getEventCategory(eventName) {
  if (eventName.startsWith('error:')) return 'error';
  if (eventName.startsWith('form:')) return 'form';
  if (eventName.startsWith('map:')) return 'map';
  if (eventName.startsWith('analytics:')) return 'analytics';
  if (eventName.startsWith('system:')) return 'system';
  return 'unknown';
}

/**
 * Format timestamp
 * @param {number} timestamp - Timestamp in milliseconds
 * @param {boolean} forFilename - Whether to format for filename
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(timestamp, forFilename = false) {
  const date = new Date(timestamp);
  
  if (forFilename) {
    return date.toISOString().replace(/:/g, '-').replace(/\..+/, '');
  }
  
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Generate unique event ID
 * @returns {string} Unique ID
 */
function generateEventId() {
  return `event-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

// Export default for convenience
export default {
  init: initEventMonitor,
  show: showDashboard,
  hide: hideDashboard,
  toggle: toggleDashboard,
  clear: clearEventHistory,
  getHistory: getEventHistory
};

console.log('🔍 Event Monitor module loaded successfully');