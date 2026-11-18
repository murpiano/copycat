module.exports = new Proxy(
  {},
  {
    get(_, key) {
      if (key === '__esModule') return false;
      return String(key).replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    },
  },
);
