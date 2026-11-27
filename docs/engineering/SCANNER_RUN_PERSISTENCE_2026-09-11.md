# Scanner run persistence — 2026-09-11

## Outcome

WBS 5.5 now persists immutable scanner runs and their ranked or excluded candidates in PostgreSQL. The application contract remains provider-neutral and grants no order authority.

## Implemented

- Added `IScannerRunRepository` to the application boundary with add and read operations.
- Added PostgreSQL entities for run identity, preset version, as-of time, SHA-256 input snapshot, data quality and complete candidate evidence.
- Added an EF Core repository that writes a run and its candidates atomically and reconstructs the immutable application model.
- Added scanner-schema mappings, precision controls, indexes and fail-closed constraints for canonical hashes, positive ranks, rank/qualification consistency, non-negative float and unique rank per run.
- Added migration `20260911092307_AddScannerRunPersistence` and retained the protected-ticket migration sequence.
- Extended PostgreSQL verification to prove five migrations, two scanner tables, runtime access, two-candidate persistence and rejection of an unqualified ranked candidate.

## Verification

- Release build: passed with zero warnings and zero errors.
- Architecture tests: 317 passed, including three new scanner-persistence tests.
- API security tests: 31 passed.
- EF model comparison: no pending model changes.
- PostgreSQL 17.10 compatibility: passed with 11 approved schemas, five migrations, five IAM/account tables and two scanner tables.
- Secret controls revalidated 2026-09-13: all 14 scanner regressions and the fail-closed scan across 598 tracked and eligible untracked source files passed.

## Decision boundary

This is local compatibility evidence against PostgreSQL 17.10, not PostgreSQL 18 certification or hosted acceptance. Licensed-provider replay, distributed execution, outbox/real-time publication, correction invalidation, load evidence and accountable approval remain pending. No paper or live-trading authority was created.

## Progress decision

WBS 5.5 advances from 70% to 78%, moving formula-driven overall completion from 74.56% to 74.71% (75% displayed). It remains In Progress until the remaining integration, operational and approval evidence is complete.
