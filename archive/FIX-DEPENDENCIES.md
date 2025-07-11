# Fix Dependencies Installation

This is a **pnpm workspace** project, not an npm project. You must use pnpm to install dependencies.

## Solution 1: Install from Root Directory (Recommended)

In **Windows PowerShell**:
```powershell
cd "C:\Hockey Hub"
pnpm install
```

This will install all dependencies for all workspaces including the frontend.

## Solution 2: Install pnpm if not available

If you don't have pnpm installed:
```powershell
npm install -g pnpm
```

Then run:
```powershell
cd "C:\Hockey Hub"
pnpm install
```

## Solution 3: Install only frontend dependencies

```powershell
cd "C:\Hockey Hub"
pnpm --filter hockey-hub-frontend install
```

## Why npm install fails

The project uses pnpm workspaces with the "workspace:*" protocol for internal dependencies. npm doesn't understand this protocol, which is why you get the "EUNSUPPORTEDPROTOCOL" error.

## After Installation

Once dependencies are installed, you can start the frontend with either:
- From root: `pnpm dev:frontend`
- From frontend directory: `pnpm dev`

## Quick Check

To verify pnpm is working:
```powershell
cd "C:\Hockey Hub"
pnpm --version
```

The missing Radix UI dependencies (@radix-ui/react-separator and @radix-ui/react-tooltip) have already been added to package.json, so running `pnpm install` will get them.