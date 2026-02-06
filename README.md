# Menu Microservice

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![gRPC](https://img.shields.io/badge/gRPC-244C5A?style=flat&logo=google&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=flat&logo=jest&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=flat&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=flat&logo=prettier&logoColor=black)

A NestJS-based gRPC microservice for managing menu categories and menu items for the CoffeeDoor application. Supports multi-language content (EN, UA, RU) with full CRUD operations and position-based ordering.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technologies](#technologies)
- [Data Models](#data-models)
- [gRPC API](#grpc-api)
- [Environment Configuration](#environment-configuration)
- [Getting Started](#getting-started)
- [Docker Deployment](#docker-deployment)
- [Testing](#testing)
- [Project Structure](#project-structure)

## Overview

The Menu Microservice provides:

- **Menu Category Management**: Create, read, update, delete, and reorder menu categories
- **Menu Item Management**: CRUD operations for items within categories
- **Multi-language Support**: Content available in English, Ukrainian, and Russian
- **Position-based Ordering**: Transaction-safe reordering of categories and items
- **Health Monitoring**: Service and database health check endpoints

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       Menu Microservice                          │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │ 
│  │ MenuCategory    │  │ MenuItem        │  │ HealthCheck      │  │
│  │ Controller      │  │ Controller      │  │ Controller       │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬─────────┘  │
│           │                    │                    │            │
│  ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼─────────┐  │
│  │ MenuCategory    │  │ MenuItem        │  │ HealthCheck      │  │
│  │ Service         │  │ Service         │  │ Service          │  │
│  └────────┬────────┘  └────────┬────────┘  └────────-┬────────┘  │
│           │                    │                     │           │
│  ┌────────▼────────┐  ┌────────▼────────┐            │           │
│  │ MenuCategory    │  │ MenuItem        │            │           │
│  │ Repository      │  │ Repository      │            │           │
│  └────────┬────────┘  └────────┬────────┘            │           │
│           │                    │                     │           │
│           └──────────┬─────────┴─────────────────────┘           │
│                      │                                           │
│             ┌────────▼────────┐                                  │
│             │  Prisma Service │                                  │
│             └────────┬────────┘                                  │
└──────────────────────┼─────────────────────────────────────-─────┘
                       │
              ┌────────▼────────┐
              │   PostgreSQL    │
              └─────────────────┘
```

## Technologies

| Category | Technology | Version |
|----------|------------|---------|
| Framework | NestJS | 11.0.1 |
| Language | TypeScript | 5.7.3 |
| Database | PostgreSQL | Latest |
| ORM | Prisma | 7.2.0 |
| Communication | gRPC | @grpc/grpc-js 1.14.3 |
| Validation | class-validator | 0.14.3 |
| Testing | Jest | 29.7.0 |
| Container | Docker | Node 24-Alpine |

## Data Models

### MenuCategory

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Auto-generated primary key |
| `language` | Enum | EN, UA, or RU |
| `title` | String | Category name |
| `description` | String? | Optional description |
| `position` | Integer | Display order |
| `imageUrl` | String? | Category image URL |
| `isAvailable` | Boolean | Availability flag (default: true) |
| `createdAt` | DateTime | Auto-generated |
| `updatedAt` | DateTime | Auto-updated |
| `menuItems` | MenuItem[] | Related items |

### MenuItem

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Auto-generated primary key |
| `language` | Enum | EN, UA, or RU |
| `title` | String | Item name |
| `description` | String? | Optional description |
| `price` | String | Price (string for currency precision) |
| `position` | Integer | Display order within category |
| `imageUrl` | String? | Item image URL |
| `isAvailable` | Boolean | Availability flag (default: true) |
| `createdAt` | DateTime | Auto-generated |
| `updatedAt` | DateTime | Auto-updated |
| `categoryId` | UUID | Foreign key to MenuCategory |

## gRPC API

### MenuCategoryService

| Method | Request | Response | Description |
|--------|---------|----------|-------------|
| `GetFullMenuByLanguage` | `Language` | `MenuCategoryListWithItems` | Get all categories with items |
| `GetMenuCategoriesByLanguage` | `Language` | `MenuCategoryList` | Get categories without items |
| `GetMenuCategoryById` | `Id` | `MenuCategory` | Get single category |
| `CreateMenuCategory` | `CreateMenuCategoryRequest` | `MenuCategory` | Create new category |
| `UpdateMenuCategory` | `UpdateMenuCategoryRequest` | `MenuCategory` | Update existing category |
| `ChangeMenuCategoryPosition` | `ChangeMenuCategoryPositionRequest` | `MenuCategory` | Reorder category |
| `DeleteMenuCategory` | `Id` | `StatusResponse` | Delete category |

### MenuItemService

| Method | Request | Response | Description |
|--------|---------|----------|-------------|
| `GetMenuItemById` | `Id` | `MenuItem` | Get single item |
| `GetMenuItemsByCategoryId` | `Id` | `MenuItemList` | Get items by category |
| `CreateMenuItem` | `CreateMenuItemRequest` | `MenuItem` | Create new item |
| `UpdateMenuItem` | `UpdateMenuItemRequest` | `MenuItem` | Update existing item |
| `ChangeMenuItemPosition` | `ChangeMenuItemPositionRequest` | `MenuItem` | Reorder item |
| `DeleteMenuItem` | `Id` | `StatusResponse` | Delete item |

### HealthCheckService

| Method | Request | Response | Description |
|--------|---------|----------|-------------|
| `CheckAppHealth` | `Empty` | `HealthCheckResponse` | Service availability |
| `CheckDatabaseConnection` | `Empty` | `HealthCheckResponse` | Database connectivity |

## Environment Configuration

Create a `.env.local` file based on `.env.example`:

```env
# gRPC server URL
TRANSPORT_URL=

# PostgreSQL connection string
DATABASE_URL=
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TRANSPORT_URL` | gRPC server binding address | `0.0.0.0:5001` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev
```

### Running the Service

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

### Generate TypeScript Types from Proto

```bash
# Generate types for menu-category
npx protoc --plugin=./node_modules/.bin/protoc-gen-ts_proto \
  --ts_proto_out=./src/generated-types ./proto/menu-category.proto \
  --ts_proto_opt=nestJs=true --ts_proto_opt=fileSuffix=.pb

# Generate types for menu-item
npx protoc --plugin=./node_modules/.bin/protoc-gen-ts_proto \
  --ts_proto_out=./src/generated-types ./proto/menu-item.proto \
  --ts_proto_opt=nestJs=true --ts_proto_opt=fileSuffix=.pb

# Generate types for health-check
npx protoc --plugin=./node_modules/.bin/protoc-gen-ts_proto \
  --ts_proto_out=./src/generated-types ./proto/health-check.proto \
  --ts_proto_opt=nestJs=true --ts_proto_opt=fileSuffix=.pb
```

## Docker Deployment

### Build and Run with Docker Compose

```bash
# Build and start containers
docker-compose up -d --build

# View logs
docker-compose logs -f menu-microservice

# Stop containers
docker-compose down
```

### Docker Compose Configuration

The service runs on the `coffeedoor-network` external network:

```yaml
services:
  menu-microservice:
    build: .
    ports:
      - "5001:5001"
    environment:
      - TRANSPORT_URL=0.0.0.0:5001
      - DATABASE_URL=postgresql://...
    networks:
      - coffeedoor-network
```

### Dockerfile Features

- Multi-stage build for optimized image size
- Node 24-Alpine base image
- Production dependencies only in final image
- Prisma client generated at build time

## Testing

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test coverage report
npm run test:cov

# Watch mode
npm run test:watch

# Run specific module tests
npm test -- --testPathPattern="menu-item"
npm test -- --testPathPattern="menu-category"
npm test -- --testPathPattern="health-check"
```

### Test Structure

Each module follows a layered testing approach:

| Layer | Test File | Description |
|-------|-----------|-------------|
| Controller | `*.controller.spec.ts` | Tests gRPC method routing and request handling |
| Service | `*.service.spec.ts` | Tests business logic and error handling |
| Repository | `*.repository.spec.ts` | Tests database operations with mocked Prisma |

## Project Structure

```
menu-microservice/
├── src/
│   ├── main.ts                      # Application bootstrap
│   ├── app.module.ts                # Root module
│   ├── menu-category/               # Menu category module
│   │   ├── menu-category.controller.ts
│   │   ├── menu-category.service.ts
│   │   ├── menu-category.repository.ts
│   │   ├── menu-category.module.ts
│   │   └── tests/                   # Unit tests
│   │       ├── menu-category.controller.spec.ts
│   │       ├── menu-category.service.spec.ts
│   │       └── menu-category.repository.spec.ts
│   ├── menu-item/                   # Menu item module
│   │   ├── menu-item.controller.ts
│   │   ├── menu-item.service.ts
│   │   ├── menu-item.repository.ts
│   │   ├── menu-item.module.ts
│   │   └── tests/                   # Unit tests
│   │       ├── menu-item.controller.spec.ts
│   │       ├── menu-item.service.spec.ts
│   │       └── menu-item.repository.spec.ts
│   ├── health-check/                # Health check module
│   │   ├── health-check.controller.ts
│   │   ├── health-check.service.ts
│   │   ├── health-check.module.ts
│   │   └── tests/                   # Unit tests
│   │       ├── health-check.controller.spec.ts
│   │       └── health-check.service.spec.ts
│   ├── prisma/                      # Database service
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── utils/                       # Shared utilities
│   │   ├── errors/                  # Custom error classes
│   │   │   ├── app-error.ts
│   │   │   └── rpc-error-code.enum.ts
│   │   ├── filters/                 # Exception filters
│   │   │   └── grpc-exception.filter.ts
│   │   ├── validators/              # Validation utilities
│   │   │   └── env-validator.ts
│   │   └── env.dto.ts               # Environment DTO
│   └── generated-types/             # Auto-generated proto types
├── proto/                           # Protocol Buffer definitions
│   ├── menu-category.proto
│   ├── menu-item.proto
│   └── health-check.proto
├── prisma/
│   ├── schema.prisma                # Database schema
│   └── migrations/                  # Database migrations
├── test/                            # E2E tests
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Error Handling

The service uses standardized gRPC error codes:

| Code | Usage |
|------|-------|
| `NOT_FOUND` | Resource doesn't exist |
| `ALREADY_EXISTS` | Duplicate resource |
| `INVALID_ARGUMENT` | Invalid input data |
| `INTERNAL` | Server-side error |

## Network Configuration

- **gRPC Port**: 5001
- **Network**: `coffeedoor-network` (external Docker network)
- **Database Port**: 5432 (PostgreSQL)

## License

This project is part of the CoffeeDoor microservices ecosystem.
