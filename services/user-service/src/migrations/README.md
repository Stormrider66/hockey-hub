# Database Migrations

This directory contains TypeORM migrations for the User Service.

## Creating a new migration

```bash
npm run typeorm migration:create -- -n MigrationName
```

## Running migrations

```bash
npm run typeorm migration:run
```

## Reverting migrations

```bash
npm run typeorm migration:revert
```

## Generating migrations from entities

```bash
npm run typeorm migration:generate -- -n MigrationName
```