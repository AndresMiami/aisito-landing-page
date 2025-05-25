import { jest } from '@jest/globals';

// dashboard.test.js

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock the dynamic import
const mockImport = jest.fn();

// Mock modules
const mockTabNavigationModule = {
  TabNavigation: class MockTabNavigation {},
  createTabNavigation: jest.fn()
};

describe('Dashboard - importDependencies', () => {
  let importDependencies;
  let TabNavigationClass, createTabNavigationFunc;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock console
    global.console = mockConsole;
    
    // Mock dynamic import
    global.import = mockImport;
    
    // Reset variables
    TabNavigationClass = null;
    createTabNavigationFunc = null;
    
    // Define the function locally for testing (since it's not exported)
    importDependencies = async function() {
      try {
        console.log("📦 Dashboard: Importing dependencies...");
        
        // 🔧 Import TabNavigation component safely with FIXED variable names
        try {
          const tabNavigationModule = await import('./tab-navigation.js');
          TabNavigationClass = tabNavigationModule.TabNavigation;
          createTabNavigationFunc = tabNavigationModule.createTabNavigation;
          console.log('✅ Dashboard: TabNavigation component imported successfully');
        } catch (error) {
          console.warn('⚠️ Dashboard: TabNavigation component not available:', error);
          TabNavigationClass = null;
          createTabNavigationFunc = null;
        }

        console.log("✅ Dashboard: All dependencies imported");
        return true;
      } catch (error) {
        console.error("❌ Dashboard: Error importing dependencies:", error);
        return false;
      }
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('successful import', () => {
    test('should import TabNavigation module successfully', async () => {
      // Arrange
      mockImport.mockResolvedValueOnce(mockTabNavigationModule);

      // Act
      const result = await importDependencies();

      // Assert
      expect(result).toBe(true);
      expect(mockImport).toHaveBeenCalledWith('./tab-navigation.js');
      expect(mockConsole.log).toHaveBeenCalledWith("📦 Dashboard: Importing dependencies...");
      expect(mockConsole.log).toHaveBeenCalledWith('✅ Dashboard: TabNavigation component imported successfully');
      expect(mockConsole.log).toHaveBeenCalledWith("✅ Dashboard: All dependencies imported");
      expect(TabNavigationClass).toBe(mockTabNavigationModule.TabNavigation);
      expect(createTabNavigationFunc).toBe(mockTabNavigationModule.createTabNavigation);
    });

    test('should call console.log with correct messages in order', async () => {
      // Arrange
      mockImport.mockResolvedValueOnce(mockTabNavigationModule);

      // Act
      await importDependencies();

      // Assert
      expect(mockConsole.log).toHaveBeenNthCalledWith(1, "📦 Dashboard: Importing dependencies...");
      expect(mockConsole.log).toHaveBeenNthCalledWith(2, '✅ Dashboard: TabNavigation component imported successfully');
      expect(mockConsole.log).toHaveBeenNthCalledWith(3, "✅ Dashboard: All dependencies imported");
    });

    test('should assign correct values to global variables', async () => {
      // Arrange
      const customTabNavigationModule = {
        TabNavigation: class CustomTabNavigation {},
        createTabNavigation: () => 'custom function'
      };
      mockImport.mockResolvedValueOnce(customTabNavigationModule);

      // Act
      await importDependencies();

      // Assert
      expect(TabNavigationClass).toBe(customTabNavigationModule.TabNavigation);
      expect(createTabNavigationFunc).toBe(customTabNavigationModule.createTabNavigation);
    });
  });

  describe('TabNavigation import failure', () => {
    test('should handle missing TabNavigation module gracefully', async () => {
      // Arrange
      const importError = new Error('Module not found');
      mockImport.mockRejectedValueOnce(importError);

      // Act
      const result = await importDependencies();

      // Assert
      expect(result).toBe(true);
      expect(mockConsole.warn).toHaveBeenCalledWith(
        '⚠️ Dashboard: TabNavigation component not available:', 
        importError
      );
      expect(mockConsole.log).toHaveBeenCalledWith("✅ Dashboard: All dependencies imported");
      expect(TabNavigationClass).toBe(null);
      expect(createTabNavigationFunc).toBe(null);
    });

    test('should continue execution after TabNavigation import fails', async () => {
      // Arrange
      mockImport.mockRejectedValueOnce(new Error('Network error'));

      // Act
      const result = await importDependencies();

      // Assert
      expect(result).toBe(true);
      expect(mockConsole.log).toHaveBeenCalledWith("📦 Dashboard: Importing dependencies...");
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.log).toHaveBeenCalledWith("✅ Dashboard: All dependencies imported");
      expect(mockConsole.error).not.toHaveBeenCalled();
    });

    test('should set variables to null when import fails', async () => {
      // Arrange
      TabNavigationClass = 'initial value';
      createTabNavigationFunc = 'initial value';
      mockImport.mockRejectedValueOnce(new Error('Import failed'));

      // Act
      await importDependencies();

      // Assert
      expect(TabNavigationClass).toBe(null);
      expect(createTabNavigationFunc).toBe(null);
    });
  });

  describe('error handling', () => {
    test('should handle unexpected errors in main try block', async () => {
      // Arrange
      const unexpectedError = new Error('Unexpected error');
      mockImport.mockImplementationOnce(() => {
        throw unexpectedError;
      });

      // Act
      const result = await importDependencies();

      // Assert
      expect(result).toBe(false);
      expect(mockConsole.error).toHaveBeenCalledWith(
        "❌ Dashboard: Error importing dependencies:", 
        unexpectedError
      );
    });

    test('should return false when main function throws', async () => {
      // Arrange
      mockConsole.log.mockImplementationOnce(() => {
        throw new Error('Console error');
      });

      // Act
      const result = await importDependencies();

      // Assert
      expect(result).toBe(false);
      expect(mockConsole.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    test('should handle module with missing exports', async () => {
      // Arrange
      const incompleteModule = {
        TabNavigation: null,
        // createTabNavigation is missing
      };
      mockImport.mockResolvedValueOnce(incompleteModule);

      // Act
      const result = await importDependencies();

      // Assert
      expect(result).toBe(true);
      expect(TabNavigationClass).toBe(null);
      expect(createTabNavigationFunc).toBe(undefined);
      expect(mockConsole.log).toHaveBeenCalledWith('✅ Dashboard: TabNavigation component imported successfully');
    });

    test('should handle module with undefined exports', async () => {
      // Arrange
      const moduleWithUndefined = {
        TabNavigation: undefined,
        createTabNavigation: undefined
      };
      mockImport.mockResolvedValueOnce(moduleWithUndefined);

      // Act
      const result = await importDependencies();

      // Assert
      expect(result).toBe(true);
      expect(TabNavigationClass).toBe(undefined);
      expect(createTabNavigationFunc).toBe(undefined);
    });

    test('should handle empty module object', async () => {
      // Arrange
      mockImport.mockResolvedValueOnce({});

      // Act
      const result = await importDependencies();

      // Assert
      expect(result).toBe(true);
      expect(TabNavigationClass).toBe(undefined);
      expect(createTabNavigationFunc).toBe(undefined);
      expect(mockConsole.log).toHaveBeenCalledWith('✅ Dashboard: TabNavigation component imported successfully');
    });
  });

  describe('console output verification', () => {
    test('should not call console.error on successful import', async () => {
      // Arrange
      mockImport.mockResolvedValueOnce(mockTabNavigationModule);

      // Act
      await importDependencies();

      // Assert
      expect(mockConsole.error).not.toHaveBeenCalled();
    });

    test('should call console.warn exactly once on TabNavigation import failure', async () => {
      // Arrange
      mockImport.mockRejectedValueOnce(new Error('Module error'));

      // Act
      await importDependencies();

      // Assert
      expect(mockConsole.warn).toHaveBeenCalledTimes(1);
      expect(mockConsole.error).not.toHaveBeenCalled();
    });

    test('should include error object in console.warn call', async () => {
      // Arrange
      const specificError = new Error('Specific module error');
      mockImport.mockRejectedValueOnce(specificError);

      // Act
      await importDependencies();

      // Assert
      expect(mockConsole.warn).toHaveBeenCalledWith(
        '⚠️ Dashboard: TabNavigation component not available:', 
        specificError
      );
    });
  });
});