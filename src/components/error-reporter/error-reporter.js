import { logger } from '../../utils/error-logger.js';

export class ErrorReporter {
  constructor(container) {
    this.container = container;
  }
  
  init() {
    this.render();
    return this;
  }
  
  render() {
    const errors = logger.getErrors();
    if (errors.length === 0) {
      this.container.innerHTML = '<p>No errors logged</p>';
      return;
    }
    
    const html = `
      <div class="error-reporter">
        <h3>Application Errors (${errors.length})</h3>
        <div class="error-actions">
          <button id="clear-errors" class="error-btn">Clear</button>
          <button id="export-errors" class="error-btn">Export</button>
        </div>
        <div class="error-list">
          ${errors.map(error => this.renderError(error)).join('')}
        </div>
      </div>
    `;
    
    this.container.innerHTML = html;
    
    // Add event listeners
    this.container.querySelector('#clear-errors')
      .addEventListener('click', () => {
        logger.clearErrors();
        this.render();
      });
    
    this.container.querySelector('#export-errors')
      .addEventListener('click', () => {
        this.exportErrors();
      });
  }
  
  renderError(error) {
    const levelClass = `error-level-${error.level || 'error'}`;
    return `
      <div class="error-item ${levelClass}">
        <div class="error-header">
          <span class="error-level">${error.level || 'error'}</span>
          <span class="error-context">${error.context}</span>
          <span class="error-time">${new Date(error.timestamp).toLocaleString()}</span>
        </div>
        <div class="error-message">${error.message}</div>
        ${error.stack ? `<details>
          <summary>Stack Trace</summary>
          <pre class="error-stack">${error.stack}</pre>
        </details>` : ''}
        ${Object.keys(error.data).length > 0 ? `<details>
          <summary>Additional Data</summary>
          <pre class="error-data">${JSON.stringify(error.data, null, 2)}</pre>
        </details>` : ''}
      </div>
    `;
  }
  
  exportErrors() {
    const errors = logger.exportErrors();
    const blob = new Blob([errors], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-errors-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  static initializeForDebug() {
    // Create a floating error reporter for development purposes
    const container = document.createElement('div');
    container.className = 'floating-error-reporter';
    container.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      width: 40px;
      height: 40px;
      background: #f44336;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      z-index: 9999;
    `;
    
    document.body.appendChild(container);
    
    const reporter = new ErrorReporter(container);
    const errors = logger.getErrors();
    
    // Show error count in the button
    container.textContent = errors.length;
    
    // Update error count when new errors are logged
    const originalLogError = logger.logError;
    logger.logError = function(...args) {
      const result = originalLogError.apply(this, args);
      container.textContent = this.errors.length;
      return result;
    };
    
    // Create error panel element
    const panel = document.createElement('div');
    panel.className = 'error-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 55px;
      right: 10px;
      width: 400px;
      max-height: 400px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: auto;
      padding: 15px;
      z-index: 9998;
      display: none;
    `;
    document.body.appendChild(panel);
    
    // Toggle panel on button click
    container.addEventListener('click', () => {
      const panelReporter = new ErrorReporter(panel);
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      if (panel.style.display === 'block') {
        panelReporter.render();
      }
    });
    
    return reporter;
  }
}

// Add CSS styles for the error reporter
const styles = document.createElement('style');
styles.textContent = `
.error-reporter {
  font-family: sans-serif;
  color: #333;
}

.error-actions {
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
}

.error-btn {
  padding: 6px 12px;
  background: #f1f1f1;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.error-btn:hover {
  background: #e0e0e0;
}

.error-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.error-item {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  background: #f9f9f9;
}

.error-level-error {
  border-left: 4px solid #f44336;
}

.error-level-warning {
  border-left: 4px solid #ff9800;
}

.error-level-info {
  border-left: 4px solid #2196f3;
}

.error-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 12px;
  color: #666;
}

.error-level {
  text-transform: uppercase;
  font-weight: bold;
}

.error-context {
  font-weight: bold;
}

.error-message {
  margin-bottom: 8px;
  font-weight: 500;
}

.error-stack, .error-data {
  background: #f1f1f1;
  padding: 8px;
  border-radius: 3px;
  font-size: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  margin-top: 8px;
}

details {
  margin-top: 8px;
}

summary {
  cursor: pointer;
  font-size: 13px;
  color: #555;
}
`;
document.head.appendChild(styles);