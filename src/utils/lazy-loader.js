import { logger } from './error-logger.js';

/**
 * Manages lazy loading of images for improved performance
 */
export class LazyLoader {
  /**
   * Creates a new LazyLoader instance
   * @param {Object} options - Configuration options
   * @param {string} [options.selector='img[data-src]'] - Selector for images to lazy load
   * @param {string} [options.srcAttribute='data-src'] - Data attribute containing the real image source
   * @param {string} [options.rootMargin='50px'] - Root margin for IntersectionObserver
   * @param {string} [options.placeholderSrc=''] - Optional placeholder image while loading
   * @param {string} [options.errorSrc=''] - Optional fallback image for errors
   * @param {boolean} [options.trackPerformance=false] - Whether to track load performance
   */
  constructor(options = {}) {
    this.options = {
      selector: options.selector || 'img[data-src]',
      srcAttribute: options.srcAttribute || 'data-src',
      rootMargin: options.rootMargin || '50px',
      placeholderSrc: options.placeholderSrc || '',
      errorSrc: options.errorSrc || '',
      trackPerformance: options.trackPerformance || false,
      backgroundImageSelector: options.backgroundImageSelector || '[data-background]',
      backgroundSrcAttribute: options.backgroundSrcAttribute || 'data-background'
    };

    this.observer = null;
    this.images = new Set();
    this.stats = {
      totalImages: 0,
      loadedImages: 0,
      failedImages: 0,
      totalLoadTime: 0
    };
  }

  /**
   * Initialize the lazy loader
   * @returns {LazyLoader} This instance for chaining
   */
  init() {
    try {
      // Check if IntersectionObserver is supported
      if ('IntersectionObserver' in window) {
        const observerOptions = {
          rootMargin: this.options.rootMargin,
          threshold: 0.01
        };
        
        this.observer = new IntersectionObserver(
          this.onIntersection.bind(this),
          observerOptions
        );
        
        // Find all images matching the selector
        const allImages = this.findImages();
        
        if (allImages.length === 0) {
          logger.logWarning('No images found matching selector', 'LazyLoader.init', {
            selector: this.options.selector,
            backgroundSelector: this.options.backgroundImageSelector
          });
        } else {
          // Update stats
          this.stats.totalImages = allImages.length;
          logger.logInfo(`Found ${allImages.length} images to lazy load`, 'LazyLoader.init');
        }
        
        // Observe each image
        allImages.forEach(image => {
          this.prepareImage(image);
          this.observer.observe(image);
          this.images.add(image);
        });
      } else {
        // Fallback for browsers without IntersectionObserver
        logger.logWarning('IntersectionObserver not supported, loading images immediately', 'LazyLoader.init');
        this.loadImagesImmediately();
      }
      
      // Add event listener for page visibility changes
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
      
      return this;
    } catch (error) {
      logger.logError(error, 'LazyLoader.init');
      // Fallback to immediate loading on error
      this.loadImagesImmediately();
      return this;
    }
  }

  /**
   * Find all images that should be lazy loaded
   * @returns {NodeListOf<Element>} Collection of images
   */
  findImages() {
    const imgSelector = this.options.selector;
    const bgSelector = this.options.backgroundImageSelector;
    
    // Combine selectors if both are provided
    const combinedSelector = imgSelector === bgSelector ? 
      imgSelector : `${imgSelector}, ${bgSelector}`;
    
    return document.querySelectorAll(combinedSelector);
  }

  /**
   * Prepare an image for lazy loading
   * @param {Element} image - The image element to prepare
   */
  prepareImage(image) {
    try {
      // Add placeholder if specified for <img> elements
      if (this.options.placeholderSrc && image.tagName === 'IMG') {
        // Only set placeholder if src is empty or not set
        if (!image.src || image.src === window.location.href) {
          image.src = this.options.placeholderSrc;
        }
      }
      
      // Add loading class
      image.classList.add('lazy-loading');
      
      // Add data-lazy-monitored attribute to mark this as being monitored
      image.setAttribute('data-lazy-monitored', 'true');
    } catch (error) {
      logger.logError(error, 'LazyLoader.prepareImage', { 
        imageElement: image.outerHTML 
      });
    }
  }

  /**
   * Handle intersection events
   * @param {IntersectionObserverEntry[]} entries - The intersection entries
   */
  onIntersection(entries) {
    entries.forEach(entry => {
      // Load image when it enters the viewport
      if (entry.isIntersecting) {
        this.loadImage(entry.target);
        // Stop observing this image
        this.observer.unobserve(entry.target);
      }
    });
  }

  /**
   * Load an image
   * @param {Element} image - The image to load
   */
  loadImage(image) {
    try {
      const startTime = performance.now();
      const isBackgroundImage = this.isBackgroundImage(image);
      const srcAttribute = isBackgroundImage ? 
        this.options.backgroundSrcAttribute : 
        this.options.srcAttribute;
      
      const src = image.getAttribute(srcAttribute);
      
      if (!src) {
        logger.logWarning(`No source found in attribute: ${srcAttribute}`, 'LazyLoader.loadImage', {
          element: image.outerHTML
        });
        this.handleImageError(image);
        return;
      }
      
      // Handle <img> elements
      if (image.tagName === 'IMG') {
        // Set up load and error handlers
        const onLoad = () => {
          this.handleImageLoaded(image, startTime);
          image.removeEventListener('load', onLoad);
          image.removeEventListener('error', onError);
        };
        
        const onError = (e) => {
          logger.logError(`Failed to load image: ${src}`, 'LazyLoader.loadImage', {
            errorEvent: e.type,
            src: src
          });
          this.handleImageError(image);
          image.removeEventListener('load', onLoad);
          image.removeEventListener('error', onError);
        };
        
        image.addEventListener('load', onLoad);
        image.addEventListener('error', onError);
        
        // Set srcset if available
        const srcset = image.getAttribute('data-srcset');
        if (srcset) {
          image.srcset = srcset;
        }
        
        // Set sizes if available
        const sizes = image.getAttribute('data-sizes');
        if (sizes) {
          image.sizes = sizes;
        }
        
        // Finally set the src to trigger loading
        image.src = src;
      } 
      // Handle background images
      else if (isBackgroundImage) {
        // Create a new image to preload
        const preloader = new Image();
        
        preloader.onload = () => {
          image.style.backgroundImage = `url('${src}')`;
          this.handleImageLoaded(image, startTime);
        };
        
        preloader.onerror = (e) => {
          logger.logError(`Failed to load background image: ${src}`, 'LazyLoader.loadImage', {
            errorEvent: e.type,
            src: src
          });
          this.handleImageError(image);
        };
        
        preloader.src = src;
      }
      
      // Remove the data attribute to prevent future loading
      image.removeAttribute(srcAttribute);
      
    } catch (error) {
      logger.logError(error, 'LazyLoader.loadImage', {
        imageElement: image.outerHTML
      });
      this.handleImageError(image);
    }
  }

  /**
   * Determines if an element should be treated as a background image
   * @param {Element} element - The element to check
   * @returns {boolean} Whether this is a background image element
   */
  isBackgroundImage(element) {
    return element.hasAttribute(this.options.backgroundSrcAttribute);
  }

  /**
   * Handle successful image load
   * @param {Element} image - The loaded image
   * @param {number} startTime - When loading started
   */
  handleImageLoaded(image, startTime) {
    try {
      // Remove loading class
      image.classList.remove('lazy-loading');
      
      // Add loaded class
      image.classList.add('lazy-loaded');
      
      // Update stats
      this.stats.loadedImages++;
      const loadTime = performance.now() - startTime;
      this.stats.totalLoadTime += loadTime;
      
      // Track performance if needed
      if (this.options.trackPerformance) {
        logger.logInfo(`Image loaded in ${loadTime.toFixed(2)}ms`, 'LazyLoader.handleImageLoaded', {
          src: image.src || image.style.backgroundImage,
          loadTime: loadTime.toFixed(2)
        });
      }
      
      // Fire custom event
      image.dispatchEvent(new CustomEvent('lazyloaded', {
        bubbles: true,
        detail: { loadTime }
      }));
    } catch (error) {
      logger.logError(error, 'LazyLoader.handleImageLoaded');
    }
  }

  /**
   * Handle image load errors
   * @param {Element} image - The image that failed to load
   */
  handleImageError(image) {
    try {
      // Remove loading class
      image.classList.remove('lazy-loading');
      
      // Add error class
      image.classList.add('lazy-error');
      
      // Update stats
      this.stats.failedImages++;
      
      // Set fallback image if specified
      if (this.options.errorSrc) {
        if (image.tagName === 'IMG') {
          image.src = this.options.errorSrc;
        } else if (this.isBackgroundImage(image)) {
          image.style.backgroundImage = `url('${this.options.errorSrc}')`;
        }
      }
      
      // Fire custom event
      image.dispatchEvent(new CustomEvent('lazyerror', {
        bubbles: true
      }));
    } catch (error) {
      logger.logError(error, 'LazyLoader.handleImageError');
    }
  }

  /**
   * Load all images immediately without waiting for intersection
   */
  loadImagesImmediately() {
    try {
      const allImages = this.findImages();
      
      allImages.forEach(image => {
        this.prepareImage(image);
        this.loadImage(image);
      });
    } catch (error) {
      logger.logError(error, 'LazyLoader.loadImagesImmediately');
    }
  }

  /**
   * Handle visibility change (e.g., tab switching)
   */
  handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      // Re-observe any images that haven't loaded yet
      this.refresh();
    }
  }

  /**
   * Refresh the lazy loader to find and observe new images
   * @returns {LazyLoader} This instance for chaining
   */
  refresh() {
    try {
      if (!this.observer) {
        this.init();
        return this;
      }
      
      const allImages = this.findImages();
      
      allImages.forEach(image => {
        // Skip already processed images
        if (image.classList.contains('lazy-loaded') || 
            image.classList.contains('lazy-error') ||
            this.images.has(image)) {
          return;
        }
        
        this.prepareImage(image);
        this.observer.observe(image);
        this.images.add(image);
        
        // Update stats
        this.stats.totalImages++;
      });
      
      return this;
    } catch (error) {
      logger.logError(error, 'LazyLoader.refresh');
      return this;
    }
  }

  /**
   * Get statistics about loaded images
   * @returns {Object} Image loading statistics
   */
  getStats() {
    return {
      ...this.stats,
      pendingImages: this.stats.totalImages - this.stats.loadedImages - this.stats.failedImages,
      averageLoadTime: this.stats.loadedImages > 0 
        ? (this.stats.totalLoadTime / this.stats.loadedImages).toFixed(2) 
        : 0
    };
  }

  /**
   * Disconnect observers and clean up resources
   */
  disconnect() {
    try {
      if (this.observer) {
        this.observer.disconnect();
      }
      
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      
      // Log stats if tracking performance
      if (this.options.trackPerformance) {
        const stats = this.getStats();
        logger.logInfo('LazyLoader disconnected with stats', 'LazyLoader.disconnect', { stats });
      }
      
      this.images.clear();
    } catch (error) {
      logger.logError(error, 'LazyLoader.disconnect');
    }
  }
}

/**
 * Creates and initializes a new LazyLoader instance
 * @param {Object} options - Configuration options
 * @returns {LazyLoader} A new LazyLoader instance
 */
export function createLazyLoader(options = {}) {
  return new LazyLoader(options).init();
}

// Add necessary CSS styles for lazy loading if not already defined
function addLazyLoadStyles() {
  // Check if styles are already added
  if (document.getElementById('lazy-loader-styles')) {
    return;
  }
  
  const styleElement = document.createElement('style');
  styleElement.id = 'lazy-loader-styles';
  styleElement.textContent = `
    .lazy-loading {
      opacity: 0.25;
      transition: opacity 0.3s ease;
    }
    
    .lazy-loaded {
      opacity: 1;
      transition: opacity 0.3s ease;
    }
    
    .lazy-error {
      opacity: 0.5;
      filter: grayscale(100%);
    }
    
    /* Add loading animation */
    img.lazy-loading:not([src]) {
      min-height: 60px;
    }
    
    div.lazy-loading[data-background] {
      position: relative;
    }
    
    div.lazy-loading[data-background]::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 30px;
      height: 30px;
      margin: -15px 0 0 -15px;
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top-color: rgba(0, 0, 0, 0.4);
      animation: lazySpinner 0.8s linear infinite;
    }
    
    @keyframes lazySpinner {
      to {
        transform: rotate(360deg);
      }
    }
  `;
  
  document.head.appendChild(styleElement);
}

// Add the styles when this module is imported
if (typeof document !== 'undefined') {
  // Wait for DOM content loaded if we're in the browser
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addLazyLoadStyles);
  } else {
    addLazyLoadStyles();
  }
}