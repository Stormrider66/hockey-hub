# Shared Types Usage in User Service

## Overview

This document explains how the User Service integrates with the `@hockey-hub/shared-types` package, which provides common TypeScript interfaces, types, and validation schemas across all Hockey Hub services.

## Module Resolution Strategy

The shared types package can be imported in two ways:

1. As `@hockey-hub/shared-types` (the official package name in package.json)
2. As `@hockey-hub/types` (the directory name under node_modules)

Both import paths are supported to maintain compatibility with existing code and to support the actual directory structure in node_modules.

## Configuration Details

### TypeScript Path Mapping

The `tsconfig.json` includes path mappings for both module names to ensure TypeScript compilation works correctly:

```json
"paths": {
  "@hockey-hub/types": ["../../shared/types/dist"],
  "@hockey-hub/types/*": ["../../shared/types/dist/*"],
  "@hockey-hub/shared-types": ["../../shared/types/dist"],
  "@hockey-hub/shared-types/*": ["../../shared/types/dist/*"]
}
```

### Package.json Dependencies

The `package.json` includes references to both module names:

```json
"dependencies": {
  "@hockey-hub/shared-types": "file:../../shared/types",
  "@hockey-hub/types": "file:../../shared/types"
}
```

## Best Practices

1. **Preferred Import Path**: Always use `@hockey-hub/types` for new code to match the actual directory structure in node_modules.
2. **Consistency**: Maintain consistent imports within a file - don't mix the two import paths.
3. **Maintenance**: When updating shared types, ensure both paths continue to work.

## Common Issues

### Module Not Found Error

If you encounter a "Module not found" error, it's typically because:

1. Node.js is looking for the actual directory in node_modules (`@hockey-hub/types`)
2. But the code is importing from `@hockey-hub/shared-types`

Solution: Update your imports to use `@hockey-hub/types`.

### Type Checking Errors

TypeScript compilation may succeed due to the path mappings in tsconfig.json, but Node.js will fail at runtime if the wrong import path is used. Always ensure your imports match the actual directory structure.

## Testing

To verify that shared types are correctly imported, run the test script:

```bash
node dist/shared-types-test.js
```

This will validate that the essential schema types can be imported and used correctly. 