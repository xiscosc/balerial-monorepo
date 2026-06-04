# Marcos MMSS - Order Management System

A comprehensive **Order Management and Back-Office Administration System** for a print/mold shop business. Built as a monorepo using Turborepo, it provides a modern web interface for managing orders, customers, pricing, and reporting.

## Features

- **Order Management**: Create, track, and manage orders with custom pricing calculations
- **Dynamic Pricing**: Mold pricing, list pricing, discounts, and multi-dimensional calculations
- **Customer Database**: Contact management and order history tracking
- **File Management**: S3-integrated file uploads with automatic image optimization
- **Reporting & Analytics**: Daily/monthly reports with audit trail tracking
- **Public Order Tracking**: External interface with QR code support
- **Multi-Store Support**: Manage multiple store locations

## Tech Stack

**Frontend**

- [SvelteKit](https://kit.svelte.dev/) - Full-stack framework
- [Svelte 5](https://svelte.dev/) - Reactive UI components
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS
- [Bits UI](https://bits-ui.com/) - Component library
- [Chart.js](https://www.chartjs.org/) - Data visualization

**Backend & Infrastructure**

- [AWS CDK](https://aws.amazon.com/cdk/) - Infrastructure as Code
- [DynamoDB](https://aws.amazon.com/dynamodb/) - NoSQL database
- [AWS Lambda](https://aws.amazon.com/lambda/) - Serverless functions
- [S3](https://aws.amazon.com/s3/) - File storage
- [Auth0](https://auth0.com/) - Authentication

**Analytics**

- [PostHog](https://posthog.com/) - Product analytics and user behavior tracking

**Build Tools**

- [Turborepo](https://turbo.build/) - Monorepo task runner
- [Bun](https://bun.sh/) - Package manager
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## Project Structure

```
balerial/
├── apps/
│   ├── marcos/                 # SvelteKit backoffice application
│   │   ├── src/
│   │   │   ├── routes/         # Pages and API endpoints
│   │   │   ├── lib/            # Components, services, utilities
│   │   │   └── auth.ts         # Auth0 configuration
│   │   └── svelte.config.js
│   │
│   └── marcos-aws/             # AWS CDK infrastructure
│       ├── lib/                # Stack definitions
│       │   ├── database/       # DynamoDB tables
│       │   ├── file/           # S3 buckets
│       │   └── function/       # Lambda functions
│       └── src/lambda/         # Lambda implementations
│
├── packages/
│   ├── marcos-core/            # Core business logic
│   │   └── src/
│   │       ├── service/        # Domain services
│   │       ├── repository/     # Data access layer
│   │       ├── types/          # TypeScript definitions
│   │       └── utilities/      # Helpers and calculations
│   │
│   ├── marcos-lambda-logic/    # Lambda handlers
│   ├── balerial-s3/            # S3 utilities
│   ├── balerial-dynamo/        # DynamoDB utilities
│   ├── eslint-config/          # Shared ESLint config
│   └── typescript-config/      # Shared TypeScript config
│
├── turbo.json                  # Turborepo configuration
└── package.json                # Workspace configuration
```

## Apps

| App          | Description                                           |
| ------------ | ----------------------------------------------------- |
| `marcos`     | SvelteKit backoffice application for order management |
| `marcos-aws` | AWS CDK app for infrastructure deployment             |

## Packages

| Package                            | Description                                      |
| ---------------------------------- | ------------------------------------------------ |
| `@marcsimolduressonsardina/core`   | Core business logic, types, and services         |
| `@marcsimolduressonsardina/lambda` | Lambda handlers for reports and image processing |
| `@balerial/s3`                     | S3 utilities (presigned URLs, uploads, tagging)  |
| `@balerial/dynamo`                 | DynamoDB repository and table abstractions       |
| `@repo/eslint-config`              | Shared ESLint configuration                      |
| `@repo/typescript-config`          | Shared TypeScript configuration                  |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [Bun](https://bun.sh/) 1.x+ (package manager — do not use npm/yarn/pnpm)
- AWS CLI configured with credentials (for infrastructure deployment)

### Installation

```bash
# Install dependencies
bun install

# Start the dev server
bun run dev

# Build all packages
bun run build
```

> **Note:** Use `bun run <script>` for package scripts. `bun build` (without `run`) invokes Bun's built-in bundler instead of the Turborepo `build` task, so it will not do what you expect. `bun install` is the one exception — it's a built-in Bun command.

### Available Scripts

These scripts are defined at the repo root and run across the workspace via Turborepo:

| Command                  | Description                                          |
| ------------------------ | ---------------------------------------------------- |
| `bun install`            | Install all workspace dependencies                   |
| `bun run dev`            | Start development mode for all apps                  |
| `bun run build`          | Build all packages and apps                          |
| `bun run lint`           | Lint all packages                                    |
| `bun run format`         | Format code with Prettier                            |
| `bun run update-packages`| Update dependencies across the workspace and reinstall |
| `bun run skills`         | Install Claude Code skills                           |

## How to Develop

The backoffice app (`apps/marcos`) talks to **real AWS resources** (DynamoDB tables and S3 buckets) — there is no local emulator. To develop locally you therefore need those resources to exist in an AWS account and a set of credentials that are allowed to use them. The high-level flow is:

1. Deploy the CDK infrastructure to an AWS account (creates the tables, buckets, and IAM policies).
2. Create an AWS access key for a user/role that holds those policies.
3. Put that key plus the rest of the configuration into `apps/marcos/.env`.
4. Run the dev server.

### 1. Deploy the CDK environment

The infrastructure lives in `apps/marcos-aws` and is deployed with the AWS CDK. In CI this is automated (see `.github/workflows/aws-deploy-*.yml`), but you can deploy an environment manually.

First, configure AWS credentials for an account/identity that has permission to create the infrastructure (CDK bootstrap, CloudFormation, DynamoDB, S3, IAM, Lambda, EventBridge, SQS). The pipeline deploys to **`eu-central-1`**, so use the same region unless you intend to run a separate environment:

```bash
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_REGION=eu-central-1
```

The CDK app reads its configuration from environment variables (see `apps/marcos-aws/lib/mmss.app.ts`). All four are **required** or the synth will throw:

| Variable                | Description                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| `CDK_ENV_NAME`          | Environment name, used as a prefix for all resources (e.g. `preview`)  |
| `ALLOWED_UPLOAD_ORIGINS`| Comma-separated list of origins allowed to upload to S3 (CORS)         |
| `MAIN_STORE_ID`         | Primary store identifier                                               |
| `POSTHOG_KEY`           | PostHog server key                                                     |

Then, from `apps/marcos-aws`, run the CDK commands through Bun:

```bash
cd apps/marcos-aws

# Bootstrap the target account/region (first time only)
bun run cdk bootstrap

# Preview the changes
bun run cdk diff

# Deploy the stack
bun run cdk deploy --all --require-approval never
```

This creates the DynamoDB tables, S3 buckets, Lambda functions, and — importantly — three IAM **managed policies** that scope access to those resources:

- `${CDK_ENV_NAME}-main-store-read-policy`
- `${CDK_ENV_NAME}-main-store-write-policy`
- `${CDK_ENV_NAME}-public-track-orders-policy`

Their ARNs are exported as CloudFormation outputs.

### 2. Get an AWS key with the deployment's role to develop locally

The local app does **not** reuse your deployment credentials. Instead, you need an AWS access key for an IAM user (or role) that has the managed policies created by the CDK deployment attached to it. Without those policies the app cannot read or write the tables/buckets and will fail at runtime.

1. In IAM, create (or pick) a user for local development.
2. Attach the `${CDK_ENV_NAME}-main-store-read-policy` and `${CDK_ENV_NAME}-main-store-write-policy` managed policies (and `${CDK_ENV_NAME}-public-track-orders-policy` if you are working on the public order tracking flow).
3. Create an access key for that user — this is the `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` pair the app uses.

The public tracking feature uses a **separate, narrower** credential pair (`TRACK_AWS_ACCESS_KEY_ID` / `TRACK_AWS_SECRET_ACCESS_KEY`) that should only carry the `public-track-orders-policy`.

### 3. Configure the app environment

Create `apps/marcos/.env` and fill in the values produced by the deployment plus the third-party credentials (Auth0, PostHog). The table/bucket names must match those created by CDK for your `CDK_ENV_NAME`. See the [Environment Variables](#environment-variables) section below for the full list.

> SvelteKit reads these via `$env/static/private` and `$env/static/public`, so changes to `.env` require restarting the dev server.

### 4. Run the app

```bash
# From the repo root
bun run dev

# …or scope it to just the backoffice app
bun run dev --filter=mmss-marcos-app
```

## Environment Variables

The application requires the following environment variables:

### AWS Configuration

- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region
- `TRACK_AWS_ACCESS_KEY_ID` - AWS access key for public tracking
- `TRACK_AWS_SECRET_ACCESS_KEY` - AWS secret key for public tracking

### Database Tables

- `ORDER_TABLE` - Orders table name
- `CUSTOMER_TABLE` - Customers table name
- `FILE_TABLE` - Files table name
- `CONFIG_TABLE` - Configuration table name
- `LIST_PRICING_TABLE` - List pricing table name
- `ORDER_SET_TABLE` - Order sets table name
- `ORDER_AUDIT_TRAIL_TABLE` - Audit trail table name
- `CALCULATED_ITEM_ORDER_TABLE` - Calculated items table name

### S3 Buckets

- `MOLD_PRICES_BUCKET` - Mold prices storage
- `FILES_BUCKET` - File uploads storage
- `REPORTS_BUCKET` - Reports storage

### Authentication

- `AUTH_SECRET` - Auth.js secret
- `AUTH_AUTH0_ID` - Auth0 client ID
- `AUTH_AUTH0_SECRET` - Auth0 client secret
- `AUTH_AUTH0_ISSUER` - Auth0 issuer URL

### Application

- `PUBLIC_POSTHOG_KEY` - PostHog public key
- `POSTHOG_KEY` - PostHog server key
- `ENV_NAME` - Environment name (preview/production)
- `MAIN_STORE_ID` - Primary store identifier
- `MAINTENANCE_MODE` - Set to `true` to enable maintenance mode (redirects all traffic to `/maintenance`)
- `VERCEL_GIT_COMMIT_REF` - Git branch reference (provided by Vercel)

## Feature Flags

Feature flags are managed via [PostHog](https://posthog.com/) and split into server-side and client-side enums:

- **Server-side**: `ServerFeature` in `apps/marcos/src/lib/server/shared/tracking/server.features.ts`
- **Client-side**: `ClientFeature` in `apps/marcos/src/lib/shared/tracking/client.features.ts`

## Deployment

### AWS Infrastructure (CDK)

Infrastructure deployment is automated via GitHub Actions (`.github/workflows/aws-deploy-*.yml`, deploying to `eu-central-1`). To deploy manually, set the required CDK env vars (`CDK_ENV_NAME`, `ALLOWED_UPLOAD_ORIGINS`, `MAIN_STORE_ID`, `POSTHOG_KEY` — see [How to Develop](#how-to-develop)) and run:

```bash
cd apps/marcos-aws

# Bootstrap CDK (first time only)
bun run cdk bootstrap

# Preview changes
bun run cdk diff

# Deploy infrastructure
bun run cdk deploy --all --require-approval never
```

### Infrastructure Resources

- **DynamoDB Tables**: Customer, Order, File, Config, ListPricing, OrderSet, OrderAuditTrail, CalculatedItemOrder
- **S3 Buckets**: MoldPrices, Files, Reports
- **Lambda Functions**: Daily report generation, image optimization
- **EventBridge Rules**: Scheduled report generation (21:50 daily)

## License

Private
