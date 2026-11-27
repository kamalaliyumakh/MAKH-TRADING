# Foundation verification checkpoint

Date: 11 September 2026  
Scope: WBS 3.1 and WBS 3.8  
Local controls: PASS  
Gate decision: DEFER

## Verified results

- Toolchain: Node 24.15.0, pnpm 10.27.0 and .NET SDK 10.0.400.
- DevSecOps policy: immutable actions, required gates and release-only signing pass.
- Environment contracts: three synthetic-only manifests preserve entry lock, database role separation, protected shared-key requirements, disabled broker connectivity, telemetry, PostgreSQL 18 targeting and recovery controls.
- .NET restore/build: all projects restored from locked dependencies; Release build completed with zero warnings and zero errors.
- .NET tests: 314 architecture and 31 API security tests passed; 345 total, zero failed or skipped.
- PostgreSQL compatibility: PostgreSQL 17.10 verified 11 schemas, four migrations, five IAM/account tables, protected durable tickets, session revocation, unique identity, no-live entitlement and runtime DDL denial.
- Frozen frontend install: lockfile current and dependency graph already up to date using pnpm 10.27.0.
- Repository security scan: all fourteen reader/discovery regressions passed; the fail-closed scan passed across 591 tracked and eligible untracked files with no findings or unreadable candidates.
- Angular: import boundaries and formatting pass; five libraries, the public application and trading portal build in production mode. The public application prerenders nine routes.
- Angular tests: 26 public, 69 portal and five library tests passed; 100 total.
- Bundles: public initial browser bundle 299.52 kB raw / 81.66 kB estimated transfer; portal initial bundle 466.26 kB raw / 111.31 kB estimated transfer.

## Runner reliability change

`eng/verify-foundation.sh` now honors a valid explicit `DOTNET_ROOT` before the repository-local SDK and accepts optional `MAKH_PNPM_STORE_DIR` and `MAKH_PNPM_VIRTUAL_STORE_DIR` values. This preserves the verification sequence while supporting a recovered local runtime and package cache outside cloud-managed storage.

## Decision boundary

The executable gate reports local controls PASS, decision DEFER, entry locked and live authorization false. Seven blockers remain: architecture-gate approval, component-owner acceptance, hosted CI/signing evidence, PostgreSQL 18 certification, identity-provider/shared-key deployment, approved infrastructure/private connectivity and a timed recovery exercise.

WBS 3.1 remains 80%, WBS 3.8 remains 75%, and overall completion remains 74.56% (75% displayed). This checkpoint is local engineering evidence, not production, paper-trading or live-trading approval.
