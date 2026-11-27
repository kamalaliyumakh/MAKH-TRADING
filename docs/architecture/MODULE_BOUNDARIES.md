# Backend Module and Layer Boundaries

Date: 14 October 2026  
WBS: 3.2  
Status: Executable foundation baseline

## Dependency direction

| Project | May reference | Prohibited direct references |
|---|---|---|
| `MAKH.Domain` | .NET base libraries | every other MAKH project; EF/HTTP/vendor packages |
| `MAKH.Application` | Domain | Infrastructure, API, Worker and vendor SDKs |
| `MAKH.Infrastructure` | Application, Domain | API and Worker |
| `MAKH.Migrations` | Infrastructure | Domain, Application, API and Worker |
| `MAKH.Api` | Application, Infrastructure | direct Domain coupling and Worker |
| `MAKH.Worker` | Application, Infrastructure | direct Domain coupling and API |

The API and Worker are composition roots. Infrastructure implements Application ports. Domain owns invariants and has no framework dependency. `MAKH.Migrations` is a deployment-only executable and is never referenced by API or Worker. The initial `IClock`/`SystemClock` pair proves the port/adapter direction without selecting a provider.

## Planned vertical modules

Market, Scanner, Evidence, Watchlists, Risk, Orders, Positions, Journal, Reporting, Identity and Administration remain vertical slices inside the layers. A module cannot call another module's Infrastructure namespace. Cross-module work uses an Application contract, domain event or explicitly reviewed orchestration.

## Enforcement

`MAKH.Architecture.Tests` inspects compiled MAKH assembly references and rejects dependencies outside each layer's allowlist. Six focused tests cover Domain, Application, Infrastructure, Migrations, API and Worker. Project references also remain reviewable in the `.csproj` files. Later tests will add namespace/module, persistence and generated-contract rules as implementation grows.
