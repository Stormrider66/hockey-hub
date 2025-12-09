import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { createMigrate } from 'redux-persist';

// Mock storage
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('redux-persist/lib/storage', () => ({
  default: mockStorage,
}));

// Test reducer
interface TestState {
  version: number;
  data: string[];
  preferences: {
    theme: string;
    language: string;
  };
}

const initialState: TestState = {
  version: 1,
  data: [],
  preferences: {
    theme: 'light',
    language: 'en',
  },
};

const testSlice = {
  name: 'test',
  initialState,
  reducers: {
    addData: (state: TestState, action: { payload: string }) => {
      state.data.push(action.payload);
    },
    setTheme: (state: TestState, action: { payload: string }) => {
      state.preferences.theme = action.payload;
    },
  },
};

describe('Redux Persist Configuration', () => {
  let store: any;
  let persistor: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getItem.mockResolvedValue(null);
  });

  test('should configure redux-persist with correct settings', async () => {
    const persistConfig = {
      key: 'root',
      version: 1,
      storage: mockStorage as any,
      whitelist: ['test'],
      blacklist: [],
      timeout: 10000,
    };

    const persistedReducer = persistReducer(persistConfig, (state = initialState) => state);

    store = configureStore({
      reducer: {
        test: persistedReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          },
        }),
    });

    persistor = persistStore(store);

    // Wait for persist to complete
    await waitFor(() => {
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'persist:root',
        expect.any(String)
      );
    });

    // Verify persisted data structure
    const persistedData = JSON.parse(mockStorage.setItem.mock.calls[0][1]);
    expect(persistedData).toHaveProperty('test');
    expect(persistedData._persist).toEqual({
      version: 1,
      rehydrated: true,
    });
  });

  test('should handle state rehydration correctly', async () => {
    const savedState = {
      test: JSON.stringify({
        version: 1,
        data: ['item1', 'item2'],
        preferences: {
          theme: 'dark',
          language: 'fr',
        },
      }),
      _persist: JSON.stringify({ version: 1, rehydrated: true }),
    };

    mockStorage.getItem.mockResolvedValue(JSON.stringify(savedState));

    const persistConfig = {
      key: 'root',
      version: 1,
      storage: mockStorage as any,
    };

    const persistedReducer = persistReducer(persistConfig, (state = initialState) => state);

    store = configureStore({
      reducer: {
        test: persistedReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          },
        }),
    });

    persistor = persistStore(store);

    // Wait for rehydration
    await waitFor(() => {
      const state = store.getState();
      expect(state.test.data).toEqual(['item1', 'item2']);
      expect(state.test.preferences.theme).toBe('dark');
      expect(state.test.preferences.language).toBe('fr');
    });
  });

  test('should handle cache versioning and migrations', async () => {
    const migrations = {
      2: (state: any) => {
        return {
          ...state,
          version: 2,
          preferences: {
            ...state.preferences,
            notifications: true, // New field in v2
          },
        };
      },
      3: (state: any) => {
        return {
          ...state,
          version: 3,
          data: state.data.map((item: string) => item.toUpperCase()), // Transform data in v3
        };
      },
    };

    const migrate = createMigrate(migrations, { debug: false });

    const oldState = {
      test: JSON.stringify({
        version: 1,
        data: ['item1', 'item2'],
        preferences: {
          theme: 'dark',
          language: 'fr',
        },
      }),
      _persist: JSON.stringify({ version: 1, rehydrated: true }),
    };

    mockStorage.getItem.mockResolvedValue(JSON.stringify(oldState));

    const persistConfig = {
      key: 'root',
      version: 3,
      storage: mockStorage as any,
      migrate,
    };

    const persistedReducer = persistReducer(persistConfig, (state = initialState) => state);

    store = configureStore({
      reducer: {
        test: persistedReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          },
        }),
    });

    persistor = persistStore(store);

    // Wait for migration and rehydration
    await waitFor(() => {
      const state = store.getState();
      expect(state.test.version).toBe(3);
      expect(state.test.data).toEqual(['ITEM1', 'ITEM2']);
      expect(state.test.preferences.notifications).toBe(true);
    });
  });

  test('should validate migration functions handle errors gracefully', async () => {
    const errorMigration = {
      2: (state: any) => {
        if (!state.preferences) {
          throw new Error('Invalid state structure');
        }
        return state;
      },
    };

    const migrate = createMigrate(errorMigration, { debug: false });

    const invalidState = {
      test: JSON.stringify({
        version: 1,
        data: ['item1'],
        // Missing preferences
      }),
      _persist: JSON.stringify({ version: 1, rehydrated: true }),
    };

    mockStorage.getItem.mockResolvedValue(JSON.stringify(invalidState));

    const persistConfig = {
      key: 'root',
      version: 2,
      storage: mockStorage as any,
      migrate,
    };

    const persistedReducer = persistReducer(persistConfig, (state = initialState) => state);

    store = configureStore({
      reducer: {
        test: persistedReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          },
        }),
    });

    persistor = persistStore(store);

    // Should fall back to initial state on migration error
    await waitFor(() => {
      const state = store.getState();
      expect(state.test).toEqual(initialState);
    });
  });

  test('should handle selective persistence with whitelist/blacklist', async () => {
    const complexState = {
      user: { id: 1, name: 'Test User' },
      session: { token: 'secret-token' },
      cache: { data: 'cached-data' },
      ui: { theme: 'dark' },
    };

    const rootReducer = (state = complexState) => state;

    const persistConfig = {
      key: 'root',
      storage: mockStorage as any,
      whitelist: ['user', 'ui'],
      blacklist: ['session', 'cache'],
    };

    const persistedReducer = persistReducer(persistConfig, rootReducer);

    store = configureStore({
      reducer: persistedReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          },
        }),
    });

    persistor = persistStore(store);

    await waitFor(() => {
      expect(mockStorage.setItem).toHaveBeenCalled();
    });

    const persistedData = JSON.parse(mockStorage.setItem.mock.calls[0][1]);
    expect(persistedData.user).toBeDefined();
    expect(persistedData.ui).toBeDefined();
    expect(persistedData.session).toBeUndefined();
    expect(persistedData.cache).toBeUndefined();
  });

  test('should handle transform functions for encryption/decryption', async () => {
    const encrypt = (data: string) => btoa(data); // Simple base64 encoding for test
    const decrypt = (data: string) => atob(data);

    const createTransform = (
      inbound: (state: any) => any,
      outbound: (state: any) => any,
      config: any
    ) => ({
      in: inbound,
      out: outbound,
      whitelist: config.whitelist,
    });

    const encryptTransform = createTransform(
      (inboundState) => encrypt(JSON.stringify(inboundState)),
      (outboundState) => JSON.parse(decrypt(outboundState)),
      { whitelist: ['user'] }
    );

    const persistConfig = {
      key: 'root',
      storage: mockStorage as any,
      transforms: [encryptTransform],
    };

    const testState = {
      user: { id: 1, password: 'secret' },
      public: { data: 'public-info' },
    };

    const persistedReducer = persistReducer(
      persistConfig,
      (state = testState) => state
    );

    store = configureStore({
      reducer: persistedReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          },
        }),
    });

    persistor = persistStore(store);

    await waitFor(() => {
      expect(mockStorage.setItem).toHaveBeenCalled();
    });

    const persistedData = JSON.parse(mockStorage.setItem.mock.calls[0][1]);
    expect(typeof persistedData.user).toBe('string'); // Should be encrypted
    expect(persistedData.public).toEqual({ data: 'public-info' }); // Should not be encrypted
  });

  test('should handle storage quota exceeded errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    mockStorage.setItem.mockRejectedValue(
      new DOMException('QuotaExceededError')
    );

    const persistConfig = {
      key: 'root',
      storage: mockStorage as any,
    };

    const persistedReducer = persistReducer(
      persistConfig,
      (state = initialState) => state
    );

    store = configureStore({
      reducer: persistedReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          },
        }),
    });

    persistor = persistStore(store);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('persist/PERSIST'),
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  test('should support PersistGate component integration', async () => {
    const persistConfig = {
      key: 'root',
      storage: mockStorage as any,
    };

    const persistedReducer = persistReducer(
      persistConfig,
      (state = initialState) => state
    );

    store = configureStore({
      reducer: persistedReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          },
        }),
    });

    persistor = persistStore(store);

    const TestComponent = () => <div>App Loaded</div>;
    const LoadingComponent = () => <div>Loading...</div>;

    const { getByText } = render(
      <Provider store={store}>
        <PersistGate loading={<LoadingComponent />} persistor={persistor}>
          <TestComponent />
        </PersistGate>
      </Provider>
    );

    // Should show loading initially
    expect(getByText('Loading...')).toBeInTheDocument();

    // Should show app after rehydration
    await waitFor(() => {
      expect(getByText('App Loaded')).toBeInTheDocument();
    });
  });

  test('should handle nested state persistence correctly', async () => {
    const nestedState = {
      level1: {
        level2: {
          level3: {
            data: ['deep', 'nested', 'array'],
            config: {
              enabled: true,
              value: 42,
            },
          },
        },
      },
    };

    const persistConfig = {
      key: 'root',
      storage: mockStorage as any,
    };

    const persistedReducer = persistReducer(
      persistConfig,
      (state = nestedState) => state
    );

    store = configureStore({
      reducer: persistedReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          },
        }),
    });

    persistor = persistStore(store);

    await waitFor(() => {
      expect(mockStorage.setItem).toHaveBeenCalled();
    });

    const persistedData = JSON.parse(mockStorage.setItem.mock.calls[0][1]);
    expect(persistedData.level1.level2.level3.data).toEqual(['deep', 'nested', 'array']);
    expect(persistedData.level1.level2.level3.config.value).toBe(42);
  });
});