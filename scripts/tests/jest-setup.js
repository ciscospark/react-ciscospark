import dotenv from "dotenv";
dotenv.config();

// Set up fake localstorage for tests
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key],
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    }
  };
})();

Reflect.defineProperty(window, `localStorage`, {value: localStorageMock});
Reflect.defineProperty(window, `performance`, {
  value: {
    now: jest.fn().mockReturnValue(10)
  }
});
