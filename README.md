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

- [Bun](https://bun.sh/) 1.x+
- AWS CLI configured (for deployment)

### Installation

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Build all packages
bun build
```

### Available Scripts

| Command             | Description                        |
| ------------------- | ---------------------------------- |
| `bun dev`           | Start development mode             |
| `bun build`         | Build all packages and apps        |
| `bun lint`          | Lint all packages                  |
| `bun format`        | Format code with Prettier          |
| `bun syncpack:list` | List dependency version mismatches |
| `bun syncpack:fix`  | Fix dependency version mismatches  |

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
- `MAINTENANCE_MODE` - Set to "yes" to enable maintenance mode
- `VERCEL_GIT_COMMIT_REF` - Git branch reference (provided by Vercel)

### Profiler

- `PUBLIC_PROFILER_CONFIG` - Base64-encoded profiler configuration
- `PUBLIC_PROFILER_KEY` - Base64-encoded profiler function key

## Deployment

### AWS Infrastructure (CDK)

Infrastructure deployment is automated via GitHub Actions. To deploy manually:

```bash
cd apps/marcos-aws

# Bootstrap CDK (first time only)
cdk bootstrap

# Preview changes
cdk diff

# Deploy infrastructure
cdk deploy
```

### Infrastructure Resources

- **DynamoDB Tables**: Customer, Order, File, Config, ListPricing, OrderSet, OrderAuditTrail, CalculatedItemOrder
- **S3 Buckets**: MoldPrices, Files, Reports
- **Lambda Functions**: Daily report generation, image optimization
- **EventBridge Rules**: Scheduled report generation (21:50 daily)

## License

Private
