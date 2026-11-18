// CSS Modules stub for Jest: returns the class name as-is
module.exports = new Proxy(
  {},
  {
    get(_, key) {
      if (key === '__esModule') return false;
      return String(key);
    },
  },
);
