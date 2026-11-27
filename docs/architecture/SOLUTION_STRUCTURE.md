# MAKH Trading Platform — Proposed Solution Structure

Status: Baseline v1.0  
Date: 12 August 2026

## Repository layout

```text
MAKH Trading/
├── apps/
│   ├── web-public/                 # Angular SSR/prerender landing application
│   └── trading-portal/             # Authenticated Angular portal
├── libs/
│   ├── ui/                         # Design tokens and reusable accessible UI
│   ├── auth/                       # Session, guards and authorization directives
│   ├── api-client/                 # Generated OpenAPI client and adapters
│   ├── realtime/                   # SignalR connection, sequencing and recovery
│   ├── market/                     # Market pulse, scanner and watchlists
│   ├── evidence/                   # News, filings and social evidence
│   ├── trading/                    # Order and position presentation logic
│   ├── risk/                       # Risk-state and policy presentation
│   ├── journal/                    # Journal and reports
│   └── shared/                     # Framework-neutral utilities and types
├── src/
│   ├── MAKH.Domain/
│   ├── MAKH.Application/
│   ├── MAKH.Infrastructure/
│   ├── MAKH.Migrations/             # Deployment-only EF migration executable
│   ├── MAKH.Api/
│   └── MAKH.Worker/
├── tests/
│   ├── MAKH.Domain.Tests/
│   ├── MAKH.Application.Tests/
│   ├── MAKH.Architecture.Tests/
│   ├── MAKH.Infrastructure.IntegrationTests/
│   ├── MAKH.Api.ContractTests/
│   └── e2e/
├── deploy/
│   ├── containers/
│   ├── infrastructure/
│   └── environments/
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── runbooks/
│   └── decisions/
├── Directory.Build.props
├── Directory.Packages.props
├── global.json
├── package.json
├── angular.json
└── MAKH.Trading.sln
```

## .NET namespace convention

```text
MAKH.Domain.<Module>
MAKH.Application.<Module>.Commands
MAKH.Application.<Module>.Queries
MAKH.Application.<Module>.Ports
MAKH.Infrastructure.<Module>.Persistence
MAKH.Infrastructure.<Module>.Providers
MAKH.Migrations.Migrations
MAKH.Api.Endpoints.<Module>
```

Modules are vertical business slices inside the architectural layers. A module may not reference another module's Infrastructure implementation. Cross-module collaboration occurs through Application contracts or domain events approved in `MODULE_BOUNDARIES.md`.

## Angular import boundaries

- Applications may import feature and shared libraries.
- Feature libraries may import `ui`, `auth`, `api-client`, `realtime` and `shared`.
- Feature libraries may not import application shells or another feature's internal implementation.
- `api-client` is generated from OpenAPI and contains transport contracts, not product rules.
- `shared` must stay small and framework-neutral where practical.

## Build and dependency governance

- Central package versions are pinned and updated deliberately.
- .NET nullable analysis and warnings-as-errors are enabled for platform projects.
- TypeScript strict mode and Angular template strictness are enabled.
- Architecture tests enforce .NET layer dependencies.
- Lint/import rules enforce Angular library boundaries.
- No production project references test fixtures or vendor sandbox implementations.

## Initial solution creation order

1. Pin .NET SDK and Node/pnpm versions.
2. Create the .NET solution and five production projects.
3. Add domain/application dependency rules and architecture tests.
4. Create Angular public and portal applications plus shared libraries.
5. Add PostgreSQL/Npgsql Infrastructure registration and a controlled migration project pattern.
6. Add OpenAPI generation and TypeScript-client generation.
7. Establish CI gates before feature implementation.
