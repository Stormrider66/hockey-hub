# Installing Missing Dependencies

Two Radix UI dependencies were missing and have been added to package.json:
- @radix-ui/react-separator
- @radix-ui/react-tooltip

## Option 1: Windows Terminal/PowerShell (Recommended)

Open Windows Terminal or PowerShell and run:

```powershell
cd "C:\Hockey Hub\apps\frontend"
npm install
```

## Option 2: Using Yarn in WSL

```bash
cd /mnt/c/Hockey\ Hub/apps/frontend
yarn install
```

## Option 3: Manual Installation in WSL

```bash
cd /mnt/c/Hockey\ Hub/apps/frontend

# Try with legacy peer deps flag
npm install --legacy-peer-deps
```

## Option 4: Using pnpm

```bash
cd /mnt/c/Hockey\ Hub/apps/frontend
pnpm install
```

## Quick Fix (if install fails)

If package installation is problematic, you can temporarily comment out the separator import in the affected files until dependencies are properly installed.

The dependencies have been added to package.json, so any successful install command will get them.