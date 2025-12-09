# CLAUDE.md Updated to pnpm

## Summary of Changes

The CLAUDE.md file has been updated to reflect that this is a pnpm workspace project, not an npm project.

### Key Updates Made:

1. **Development Commands Section**:
   - Added "Initial Setup" subsection with `pnpm install` and `pnpm run build:shared`
   - Updated all `npm` commands to `pnpm`
   - Added commands for running from root directory using pnpm filters
   - Updated frontend port to 3003 (as configured in package.json)

2. **Command Examples**:
   ```bash
   # Old way (npm)
   npm run dev
   npm run build
   npm run test
   
   # New way (pnpm)
   pnpm dev
   pnpm build
   pnpm test
   ```

3. **Root Directory Commands Added**:
   ```bash
   pnpm dev:frontend        # Start frontend only
   pnpm dev                 # Start all services
   pnpm --filter [service] dev  # Start specific service
   ```

### Why pnpm?

- **Workspace Support**: pnpm has native workspace support with `workspace:*` protocol
- **Disk Space**: pnpm uses a global store, saving disk space by hard-linking packages
- **Speed**: Faster installations due to efficient dependency resolution
- **Strictness**: Prevents phantom dependencies (using packages not in package.json)

### Quick Reference

From root directory (`C:\Hockey Hub`):
- `pnpm install` - Install all dependencies
- `pnpm dev:frontend` - Start frontend only
- `pnpm dev` - Start all services
- `pnpm build` - Build all packages
- `pnpm test` - Run all tests

The rest of CLAUDE.md remains unchanged as it accurately documents the project architecture and features.