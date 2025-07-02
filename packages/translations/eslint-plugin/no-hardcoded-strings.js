/**
 * ESLint rule to detect hardcoded strings that should be translated
 * Add to your .eslintrc.js:
 * 
 * rules: {
 *   'no-hardcoded-strings': ['warn', {
 *     ignore: ['^[0-9]+$', '^[a-z0-9-_]+$', '^/', '^https?://', '^#'],
 *     ignoreAttribute: ['className', 'id', 'name', 'type', 'href', 'src', 'alt'],
 *     ignoreProperty: ['key', 'ref', 'style'],
 *   }]
 * }
 */

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Detect hardcoded strings that should use i18n',
      category: 'Internationalization',
      recommended: false,
    },
    schema: [{
      type: 'object',
      properties: {
        ignore: {
          type: 'array',
          items: { type: 'string' },
          default: []
        },
        ignoreAttribute: {
          type: 'array',
          items: { type: 'string' },
          default: ['className', 'id', 'type']
        },
        ignoreProperty: {
          type: 'array',
          items: { type: 'string' },
          default: ['key', 'ref']
        }
      }
    }]
  },

  create(context) {
    const options = context.options[0] || {};
    const ignorePatterns = options.ignore || [
      '^[0-9]+$',           // Numbers
      '^[a-z0-9-_]+$',      // IDs, keys
      '^[A-Z_]+$',          // Constants
      '^/',                 // Paths
      '^https?://',         // URLs
      '^#',                 // Anchors
      '^\\s*$',             // Whitespace
      '^[+-]?[0-9.]+$',     // Numeric values
      '^[a-zA-Z]$',         // Single letters
    ];
    const ignoreAttributes = new Set(options.ignoreAttribute || []);
    const ignoreProperties = new Set(options.ignoreProperty || []);

    function shouldIgnoreString(value) {
      if (!value || typeof value !== 'string') return true;
      if (value.length < 2) return true;
      
      return ignorePatterns.some(pattern => {
        const regex = new RegExp(pattern);
        return regex.test(value);
      });
    }

    return {
      // Check JSX text
      JSXText(node) {
        const text = node.value.trim();
        if (!shouldIgnoreString(text)) {
          context.report({
            node,
            message: `Hardcoded string "${text}" should use i18n translation`
          });
        }
      },

      // Check JSX attributes
      JSXAttribute(node) {
        if (ignoreAttributes.has(node.name.name)) return;
        
        if (node.value && node.value.type === 'Literal') {
          const value = node.value.value;
          if (!shouldIgnoreString(value)) {
            context.report({
              node: node.value,
              message: `Hardcoded string "${value}" in ${node.name.name} attribute should use i18n translation`
            });
          }
        }
      },

      // Check object properties
      Property(node) {
        if (ignoreProperties.has(node.key.name)) return;
        
        if (node.value.type === 'Literal' && typeof node.value.value === 'string') {
          const value = node.value.value;
          if (!shouldIgnoreString(value)) {
            // Allow in test files
            const filename = context.getFilename();
            if (filename.includes('.test.') || filename.includes('.spec.')) return;
            
            context.report({
              node: node.value,
              message: `Hardcoded string "${value}" should use i18n translation`
            });
          }
        }
      },

      // Check template literals
      TemplateLiteral(node) {
        if (node.quasis.length === 1 && node.expressions.length === 0) {
          const value = node.quasis[0].value.raw;
          if (!shouldIgnoreString(value)) {
            context.report({
              node,
              message: `Hardcoded string "${value}" should use i18n translation`
            });
          }
        }
      }
    };
  }
};