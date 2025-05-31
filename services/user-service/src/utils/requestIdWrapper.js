// CommonJS wrapper around express-request-id
const { v4: uuidv4 } = require('uuid');

// Recreate the express-request-id middleware using CommonJS
module.exports = function(options) {
  options = options || {};
  
  return function(req, res, next) {
    req.id = req.id || req.headers[options.header || 'x-request-id'] || uuidv4();
    res.setHeader(options.header || 'x-request-id', req.id);
    next();
  };
}; 