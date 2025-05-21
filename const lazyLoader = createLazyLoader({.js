const lazyLoader = createLazyLoader({
  selector: 'img:not([data-no-lazy])',
  placeholderSrc: 'images/placeholder.svg',
  errorSrc: 'images/error-placeholder.svg',
  trackPerformance: true
});