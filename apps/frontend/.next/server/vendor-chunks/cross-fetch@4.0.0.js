/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/cross-fetch@4.0.0";
exports.ids = ["vendor-chunks/cross-fetch@4.0.0"];
exports.modules = {

/***/ "(ssr)/../../node_modules/.pnpm/cross-fetch@4.0.0/node_modules/cross-fetch/dist/node-ponyfill.js":
/*!*************************************************************************************************!*\
  !*** ../../node_modules/.pnpm/cross-fetch@4.0.0/node_modules/cross-fetch/dist/node-ponyfill.js ***!
  \*************************************************************************************************/
/***/ ((module, exports, __webpack_require__) => {

eval("const nodeFetch = __webpack_require__(/*! node-fetch */ \"(ssr)/../../node_modules/.pnpm/node-fetch@2.7.0/node_modules/node-fetch/lib/index.mjs\")\nconst realFetch = nodeFetch.default || nodeFetch\n\nconst fetch = function (url, options) {\n  // Support schemaless URIs on the server for parity with the browser.\n  // Ex: //github.com/ -> https://github.com/\n  if (/^\\/\\//.test(url)) {\n    url = 'https:' + url\n  }\n  return realFetch.call(this, url, options)\n}\n\nfetch.ponyfill = true\n\nmodule.exports = exports = fetch\nexports.fetch = fetch\nexports.Headers = nodeFetch.Headers\nexports.Request = nodeFetch.Request\nexports.Response = nodeFetch.Response\n\n// Needed for TypeScript consumers without esModuleInterop.\nexports[\"default\"] = fetch\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL2Nyb3NzLWZldGNoQDQuMC4wL25vZGVfbW9kdWxlcy9jcm9zcy1mZXRjaC9kaXN0L25vZGUtcG9ueWZpbGwuanMiLCJtYXBwaW5ncyI6IkFBQUEsa0JBQWtCLG1CQUFPLENBQUMseUdBQVk7QUFDdEM7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBLGFBQWE7QUFDYixlQUFlO0FBQ2YsZUFBZTtBQUNmLGdCQUFnQjs7QUFFaEI7QUFDQSxrQkFBZSIsInNvdXJjZXMiOlsiQzpcXEhvY2tleSBIdWJcXG5vZGVfbW9kdWxlc1xcLnBucG1cXGNyb3NzLWZldGNoQDQuMC4wXFxub2RlX21vZHVsZXNcXGNyb3NzLWZldGNoXFxkaXN0XFxub2RlLXBvbnlmaWxsLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImNvbnN0IG5vZGVGZXRjaCA9IHJlcXVpcmUoJ25vZGUtZmV0Y2gnKVxuY29uc3QgcmVhbEZldGNoID0gbm9kZUZldGNoLmRlZmF1bHQgfHwgbm9kZUZldGNoXG5cbmNvbnN0IGZldGNoID0gZnVuY3Rpb24gKHVybCwgb3B0aW9ucykge1xuICAvLyBTdXBwb3J0IHNjaGVtYWxlc3MgVVJJcyBvbiB0aGUgc2VydmVyIGZvciBwYXJpdHkgd2l0aCB0aGUgYnJvd3Nlci5cbiAgLy8gRXg6IC8vZ2l0aHViLmNvbS8gLT4gaHR0cHM6Ly9naXRodWIuY29tL1xuICBpZiAoL15cXC9cXC8vLnRlc3QodXJsKSkge1xuICAgIHVybCA9ICdodHRwczonICsgdXJsXG4gIH1cbiAgcmV0dXJuIHJlYWxGZXRjaC5jYWxsKHRoaXMsIHVybCwgb3B0aW9ucylcbn1cblxuZmV0Y2gucG9ueWZpbGwgPSB0cnVlXG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGZldGNoXG5leHBvcnRzLmZldGNoID0gZmV0Y2hcbmV4cG9ydHMuSGVhZGVycyA9IG5vZGVGZXRjaC5IZWFkZXJzXG5leHBvcnRzLlJlcXVlc3QgPSBub2RlRmV0Y2guUmVxdWVzdFxuZXhwb3J0cy5SZXNwb25zZSA9IG5vZGVGZXRjaC5SZXNwb25zZVxuXG4vLyBOZWVkZWQgZm9yIFR5cGVTY3JpcHQgY29uc3VtZXJzIHdpdGhvdXQgZXNNb2R1bGVJbnRlcm9wLlxuZXhwb3J0cy5kZWZhdWx0ID0gZmV0Y2hcbiJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOlswXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/../../node_modules/.pnpm/cross-fetch@4.0.0/node_modules/cross-fetch/dist/node-ponyfill.js\n");

/***/ })

};
;