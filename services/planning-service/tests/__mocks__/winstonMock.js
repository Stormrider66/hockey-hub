const noop = () => {};

const mock = {
  addColors: noop,
  createLogger: () => ({
    info: noop,
    error: noop,
    debug: noop,
    warn: noop,
  }),
  format: {
    combine: noop,
    timestamp: noop,
    printf: noop,
    colorize: noop,
    align: noop,
  },
  transports: {
    Console: function () {},
  },
};

module.exports = mock;
module.exports.default = mock;