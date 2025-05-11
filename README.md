# Balerial Apps Monorepo

Turborepo

## What's inside?

This Turborepo includes the following packages/apps:

### Apps

- `marcos-aws`: Marcos AWS CDK app to deploy and manage all infra (DynamoDB, S3, Lambdas, etc)
- `marcos`: SvelteKit app for the Marcos backoffice (admin UI)

### Packages

- `@marcsimolduressonsardina/core`: Marcos core business logic, types, services, and utilities for Marcos
- `@marcsimolduressonsardina/lambda`: Marcos lambda handlers and logic for Marcos (reports, images, storage, etc)
- `@balerial/s3`: S3 utility library (presigned URLs, upload/download, tagging, etc)
- `@balerial/dynamo`: DynamoDB repository, table, and utility abstractions
- `@repo/eslint-config`: Shared eslint config for all packages/apps
- `@repo/typescript-config`: Shared tsconfig for all packages/apps
