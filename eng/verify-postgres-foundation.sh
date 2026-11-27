#!/usr/bin/env bash
set -euo pipefail

repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
postgres_root="$(mktemp -d)"
postgres_data="$postgres_root/data"
postgres_socket="$postgres_root/socket"
postgres_log="$postgres_root/postgres.log"
postgres_port=55432

cleanup() {
  if [[ -f "$postgres_data/postmaster.pid" ]]; then
    pg_ctl -D "$postgres_data" -m fast stop >/dev/null
  fi
}
trap cleanup EXIT

mkdir -p "$postgres_socket"
initdb -D "$postgres_data" --auth-local=trust --auth-host=trust --no-locale >/dev/null
pg_ctl -D "$postgres_data" -l "$postgres_log" -o "-k $postgres_socket -p $postgres_port" start >/dev/null

connection="host=$postgres_socket port=$postgres_port dbname=postgres user=$(id -un)"
server_version="$(psql "$connection" -Atc "SHOW server_version;")"
server_major="${server_version%%.*}"
[[ "$server_major" -ge 17 ]]
psql "$connection" -v ON_ERROR_STOP=1 -f "$repository_root/deploy/postgres/roles.sql" >/dev/null
psql "$connection" -v ON_ERROR_STOP=1 -f "$repository_root/deploy/postgres/roles.sql" >/dev/null

export MAKH_POSTGRES_MIGRATION_CONNECTION="Host=$postgres_socket;Port=$postgres_port;Database=postgres;Username=$(id -un)"
migration_runner="$repository_root/src/MAKH.Migrations/bin/Release/net10.0/MAKH.Migrations.dll"
[[ -f "$migration_runner" ]]
dotnet "$migration_runner" >/dev/null
dotnet "$migration_runner" >/dev/null

approved_schemas="'iam','account','market','scanner','evidence','risk','trading','journal','notification','audit','platform'"
schema_count="$(psql "$connection" -Atc "SELECT count(*) FROM information_schema.schemata WHERE schema_name IN ($approved_schemas);")"
[[ "$schema_count" == "11" ]]

migration_count="$(psql "$connection" -Atc 'SELECT count(*) FROM platform.__ef_migrations_history;')"
[[ "$migration_count" == "16" ]]

owned_schema_count="$(psql "$connection" -Atc "SELECT count(*) FROM pg_namespace n JOIN pg_roles r ON r.oid = n.nspowner WHERE r.rolname = 'makh_owner' AND n.nspname IN ($approved_schemas);")"
[[ "$owned_schema_count" == "11" ]]

migrator_inherits_owner="$(psql "$connection" -Atc "SELECT pg_has_role('makh_migrator', 'makh_owner', 'USAGE');")"
[[ "$migrator_inherits_owner" == "t" ]]

runtime_can_create="$(psql "$connection" -Atc "SELECT has_schema_privilege('makh_runtime', 'platform', 'CREATE');")"
[[ "$runtime_can_create" == "f" ]]

runtime_has_usage="$(psql "$connection" -Atc "SELECT has_schema_privilege('makh_runtime', 'platform', 'USAGE');")"
[[ "$runtime_has_usage" == "t" ]]

identity_account_table_count="$(psql "$connection" -Atc "SELECT count(*) FROM information_schema.tables WHERE (table_schema, table_name) IN (('iam','users'),('iam','external_identities'),('iam','user_sessions'),('account','trading_accounts'),('account','account_entitlements'));")"
[[ "$identity_account_table_count" == "5" ]]

owned_identity_account_table_count="$(psql "$connection" -Atc "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace JOIN pg_roles r ON r.oid = c.relowner WHERE c.relkind = 'r' AND r.rolname = 'makh_owner' AND (n.nspname, c.relname) IN (('iam','users'),('iam','external_identities'),('iam','user_sessions'),('account','trading_accounts'),('account','account_entitlements'));")"
[[ "$owned_identity_account_table_count" == "5" ]]

runtime_can_write_accounts="$(psql "$connection" -Atc "SELECT has_table_privilege('makh_runtime', 'account.trading_accounts', 'SELECT,INSERT,UPDATE,DELETE');")"
[[ "$runtime_can_write_accounts" == "t" ]]

runtime_can_write_sessions="$(psql "$connection" -Atc "SELECT has_table_privilege('makh_runtime', 'iam.user_sessions', 'SELECT,INSERT,UPDATE,DELETE');")"
[[ "$runtime_can_write_sessions" == "t" ]]

scanner_table_count="$(psql "$connection" -Atc "SELECT count(*) FROM information_schema.tables WHERE (table_schema, table_name) IN (('scanner','runs'),('scanner','run_candidates'),('scanner','account_streams'));")"
[[ "$scanner_table_count" == "3" ]]

runtime_can_write_scanner="$(psql "$connection" -Atc "SELECT has_table_privilege('makh_runtime', 'scanner.runs', 'SELECT,INSERT,UPDATE,DELETE') AND has_table_privilege('makh_runtime', 'scanner.run_candidates', 'SELECT,INSERT,UPDATE,DELETE');")"
[[ "$runtime_can_write_scanner" == "t" ]]

runtime_can_write_scanner_stream="$(psql "$connection" -Atc "SELECT has_table_privilege('makh_runtime', 'scanner.account_streams', 'SELECT,INSERT,UPDATE,DELETE');")"
[[ "$runtime_can_write_scanner_stream" == "t" ]]

runtime_can_write_outbox="$(psql "$connection" -Atc "SELECT has_table_privilege('makh_runtime', 'platform.outbox_messages', 'SELECT,INSERT,UPDATE,DELETE');")"
[[ "$runtime_can_write_outbox" == "t" ]]

evidence_table_count="$(psql "$connection" -Atc "SELECT count(*) FROM information_schema.tables WHERE (table_schema, table_name) IN (('evidence','documents'),('evidence','outbox_messages'),('evidence','source_snapshots'),('evidence','social_attention_aggregates'),('evidence','combined_snapshots'));")"
[[ "$evidence_table_count" == "5" ]]

owned_evidence_table_count="$(psql "$connection" -Atc "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace JOIN pg_roles r ON r.oid = c.relowner WHERE c.relkind = 'r' AND r.rolname = 'makh_owner' AND (n.nspname, c.relname) IN (('evidence','documents'),('evidence','outbox_messages'),('evidence','source_snapshots'),('evidence','social_attention_aggregates'),('evidence','combined_snapshots'));")"
[[ "$owned_evidence_table_count" == "5" ]]

runtime_can_write_evidence="$(psql "$connection" -Atc "SELECT has_table_privilege('makh_runtime', 'evidence.documents', 'SELECT,INSERT,UPDATE,DELETE') AND has_table_privilege('makh_runtime', 'evidence.outbox_messages', 'SELECT,INSERT,UPDATE,DELETE') AND has_table_privilege('makh_runtime', 'evidence.source_snapshots', 'SELECT,INSERT,UPDATE,DELETE') AND has_table_privilege('makh_runtime', 'evidence.social_attention_aggregates', 'SELECT,INSERT,UPDATE,DELETE');")"
[[ "$runtime_can_write_evidence" == "t" ]]

runtime_snapshot_privileges="$(psql "$connection" -Atc "SELECT has_table_privilege('makh_runtime', 'evidence.combined_snapshots', 'SELECT,INSERT') AND NOT has_table_privilege('makh_runtime', 'evidence.combined_snapshots', 'UPDATE,DELETE,TRUNCATE');")"
[[ "$runtime_snapshot_privileges" == "t" ]]

social_audit_owned="$(psql "$connection" -Atc "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace JOIN pg_roles r ON r.oid = c.relowner WHERE c.relkind = 'r' AND r.rolname = 'makh_owner' AND n.nspname = 'audit' AND c.relname = 'social_retention_deletions';")"
[[ "$social_audit_owned" == "1" ]]
runtime_social_audit_privileges="$(psql "$connection" -Atc "SELECT has_table_privilege('makh_runtime', 'audit.social_retention_deletions', 'SELECT,INSERT') AND NOT has_table_privilege('makh_runtime', 'audit.social_retention_deletions', 'UPDATE,DELETE,TRUNCATE');")"
[[ "$runtime_social_audit_privileges" == "t" ]]

psql "$connection" -v ON_ERROR_STOP=1 >/dev/null <<'SQL'
INSERT INTO iam.users (id, display_name, created_at)
VALUES ('10000000-0000-0000-0000-000000000001', 'UAT Owner', '2026-08-26T12:00:00Z');
INSERT INTO iam.external_identities (id, user_id, issuer, subject, linked_at, last_authenticated_at)
VALUES ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'https://identity.example', 'owner-subject', '2026-08-26T12:00:00Z', '2026-08-26T12:00:00Z');
INSERT INTO account.trading_accounts (id, provider, provider_account_reference, mode, status, created_at, version)
VALUES ('30000000-0000-0000-0000-000000000003', 'synthetic-paper', 'paper-account-1', 'Paper', 'Pending', '2026-08-26T12:00:00Z', 1);
INSERT INTO account.account_entitlements (id, user_id, account_id, permission, effective_from, allows_live_trading)
VALUES ('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'Trade', '2026-08-26T12:00:00Z', FALSE);
INSERT INTO iam.user_sessions (id, user_id, issued_at, last_seen_at, expires_at, ticket_key_hash, protected_ticket, version)
VALUES ('70000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', '2026-08-27T12:00:00Z', '2026-08-27T12:00:00Z', '2026-08-27T20:00:00Z', decode(repeat('ab', 32), 'hex'), decode('010203', 'hex'), 1);
UPDATE iam.user_sessions
SET revoked_at = '2026-08-27T12:05:00Z', version = version + 1
WHERE id = '70000000-0000-0000-0000-000000000007';
INSERT INTO scanner.runs (id, account_id, preset_version_key, as_of, input_snapshot_hash, data_quality)
VALUES ('90000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000003', 'dddddddddddddddddddddddddddddddd:1', '2026-09-11T14:30:00Z', repeat('a', 64), 'Partial');
INSERT INTO scanner.run_candidates (run_id, security_id, symbol, rank, qualified, extreme_move_risk, price, gain_percent, relative_volume, public_float, spread_percent, dollar_volume, exclusion_reason)
VALUES
('90000000-0000-0000-0000-000000000009', '91000000-0000-0000-0000-000000000001', 'TRKA', 1, TRUE, TRUE, 4.72, 98.21, 8.4, 420000, 1.2, 1982400, ''),
('90000000-0000-0000-0000-000000000009', '92000000-0000-0000-0000-000000000002', 'NOPE', NULL, FALSE, FALSE, 8.50, 20, 1.1, 800000, 1.4, 935000, 'Price is outside the preset range.');
WITH assigned AS (
  INSERT INTO scanner.account_streams (account_id, last_sequence)
  VALUES ('30000000-0000-0000-0000-000000000003', 1)
  ON CONFLICT (account_id) DO UPDATE
  SET last_sequence = scanner.account_streams.last_sequence + 1
  RETURNING last_sequence
)
INSERT INTO scanner.runs (id, account_id, stream_sequence, preset_version_key, as_of, input_snapshot_hash, data_quality)
SELECT '90000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000003', last_sequence,
       'dddddddddddddddddddddddddddddddd:1', '2026-09-11T14:31:00Z', repeat('c', 64), 'Complete'
FROM assigned;
WITH assigned AS (
  INSERT INTO scanner.account_streams (account_id, last_sequence)
  VALUES ('30000000-0000-0000-0000-000000000003', 1)
  ON CONFLICT (account_id) DO UPDATE
  SET last_sequence = scanner.account_streams.last_sequence + 1
  RETURNING last_sequence
)
INSERT INTO scanner.runs (id, account_id, stream_sequence, preset_version_key, as_of, input_snapshot_hash, data_quality)
SELECT '90000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000003', last_sequence,
       'dddddddddddddddddddddddddddddddd:1', '2026-09-11T14:32:00Z', repeat('d', 64), 'Complete'
FROM assigned;
INSERT INTO platform.outbox_messages (id, account_id, aggregate_id, event_type, schema_version, stream_sequence, occurred_at, payload, attempt_count, next_attempt_at)
VALUES
('a0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000011', 'scanner.updated', 1, 1, '2026-09-11T14:31:00Z', '{"runId":"90000000-0000-0000-0000-000000000011"}'::jsonb, 0, '2026-09-11T14:31:00Z'),
('a0000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000012', 'scanner.updated', 1, 2, '2026-09-11T14:32:00Z', '{"runId":"90000000-0000-0000-0000-000000000012"}'::jsonb, 0, '2026-09-11T14:32:00Z');
SQL

psql "$connection" -v ON_ERROR_STOP=1 >/dev/null <<'SQL'
INSERT INTO evidence.documents
    (id, security_id, source_kind, headline, publisher, accession_number, excerpt, trust_state,
     provider, provider_record_id, canonical_uri, published_at, observed_at, version,
     content_right, supersedes_record_id, is_deleted, content_sha256)
VALUES
    ('b0000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001',
     'News', 'Synthetic issuer update', 'Synthetic Publisher', NULL, 'Synthetic excerpt',
     'PublisherAttributed', 'synthetic-evidence', 'record-1', 'https://example.test/record-1',
     '2026-10-01T12:00:00Z', '2026-10-01T12:01:00Z', 1, 'Excerpt', NULL, FALSE, repeat('a', 64));
INSERT INTO evidence.source_snapshots
    (evidence_document_id, payload_sha256, byte_count, media_type, scanner_version, captured_at, retain_until)
VALUES
    ('b0000000-0000-0000-0000-000000000001', repeat('b', 64), 128, 'application/json',
     'synthetic-scanner-v1', '2026-10-01T12:01:00Z', '2027-10-01T12:01:00Z');
INSERT INTO evidence.outbox_messages
    (id, evidence_document_id, event_type, schema_version, occurred_at, payload,
     attempt_count, next_attempt_at)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
     'evidence.updated', 1, '2026-10-01T12:01:00Z',
     '{"evidenceDocumentId":"b0000000-0000-0000-0000-000000000001"}'::jsonb,
     0, '2026-10-01T12:01:00Z');
INSERT INTO evidence.combined_snapshots
    (id, as_of, schema_version, manifest_sha256, item_count, items_json)
VALUES
    ('e0000000-0000-0000-0000-000000000001', '2026-10-01T12:02:00Z',
     'evidence-snapshot-v1', repeat('9', 64), 1,
     '[{"securityId":"91000000-0000-0000-0000-000000000001","provider":"synthetic-evidence"}]'::jsonb);
SQL

if psql "$connection" -v ON_ERROR_STOP=1 -c "INSERT INTO evidence.combined_snapshots (id, as_of, schema_version, manifest_sha256, item_count, items_json) VALUES ('e0000000-0000-0000-0000-000000000002', '2026-10-01T12:02:00Z', 'evidence-snapshot-v1', repeat('8', 64), 1, '[]'::jsonb);" >/dev/null 2>&1; then
  echo "Conflicting evidence snapshot replay was accepted." >&2
  exit 1
fi

snapshot_pids=()
for worker in 1 2 3 4 5 6 7 8; do
  psql "$connection" -v ON_ERROR_STOP=1 -c "INSERT INTO evidence.combined_snapshots (id, as_of, schema_version, manifest_sha256, item_count, items_json) VALUES (md5('snapshot-worker-$worker')::uuid, '2026-10-01T12:03:00Z', 'evidence-snapshot-v1', repeat('7', 64), 0, '[]'::jsonb) ON CONFLICT (as_of) DO NOTHING;" >/dev/null &
  snapshot_pids+=("$!")
done
for snapshot_pid in "${snapshot_pids[@]}"; do
  wait "$snapshot_pid"
done
concurrent_snapshot_count="$(psql "$connection" -Atc "SELECT count(*) FROM evidence.combined_snapshots WHERE as_of = '2026-10-01T12:03:00Z' AND manifest_sha256 = repeat('7', 64);")"
[[ "$concurrent_snapshot_count" == "1" ]]

evidence_claimed="$(psql "$connection" -Atqc "WITH candidates AS (SELECT message.id FROM evidence.outbox_messages message WHERE message.published_at IS NULL AND message.next_attempt_at <= '2026-10-01T12:02:00Z' AND (message.lease_until IS NULL OR message.lease_until <= '2026-10-01T12:02:00Z') ORDER BY message.occurred_at, message.id FOR UPDATE SKIP LOCKED LIMIT 10) UPDATE evidence.outbox_messages message SET lease_owner = 'evidence-smoke-a', lease_until = '2026-10-01T12:02:30Z', attempt_count = message.attempt_count + 1 FROM candidates WHERE message.id = candidates.id RETURNING message.attempt_count;")"
[[ "$evidence_claimed" == "1" ]]

wrong_owner_transition="$(psql "$connection" -Atqc "WITH changed AS (UPDATE evidence.outbox_messages SET published_at = '2026-10-01T12:02:01Z' WHERE id = 'c0000000-0000-0000-0000-000000000001' AND lease_owner = 'wrong-owner' AND published_at IS NULL RETURNING 1) SELECT count(*) FROM changed;")"
[[ "$wrong_owner_transition" == "0" ]]

psql "$connection" -v ON_ERROR_STOP=1 -c "UPDATE evidence.outbox_messages SET next_attempt_at = '2026-10-01T12:03:00Z', last_error = 'SyntheticFailure', lease_owner = NULL, lease_until = NULL WHERE id = 'c0000000-0000-0000-0000-000000000001' AND lease_owner = 'evidence-smoke-a' AND published_at IS NULL;" >/dev/null

early_reclaim="$(psql "$connection" -Atqc "SELECT count(*) FROM evidence.outbox_messages WHERE published_at IS NULL AND next_attempt_at <= '2026-10-01T12:02:59Z' AND (lease_until IS NULL OR lease_until <= '2026-10-01T12:02:59Z');")"
[[ "$early_reclaim" == "0" ]]

evidence_reclaimed="$(psql "$connection" -Atqc "WITH candidates AS (SELECT message.id FROM evidence.outbox_messages message WHERE message.published_at IS NULL AND message.next_attempt_at <= '2026-10-01T12:03:00Z' AND (message.lease_until IS NULL OR message.lease_until <= '2026-10-01T12:03:00Z') ORDER BY message.occurred_at, message.id FOR UPDATE SKIP LOCKED LIMIT 10) UPDATE evidence.outbox_messages message SET lease_owner = 'evidence-smoke-b', lease_until = '2026-10-01T12:03:30Z', attempt_count = message.attempt_count + 1 FROM candidates WHERE message.id = candidates.id RETURNING message.attempt_count;")"
[[ "$evidence_reclaimed" == "2" ]]

psql "$connection" -v ON_ERROR_STOP=1 -c "UPDATE evidence.outbox_messages SET published_at = '2026-10-01T12:03:01Z', last_error = NULL, lease_owner = NULL, lease_until = NULL WHERE id = 'c0000000-0000-0000-0000-000000000001' AND lease_owner = 'evidence-smoke-b' AND published_at IS NULL;" >/dev/null
evidence_terminal_count="$(psql "$connection" -Atc "SELECT count(*) FROM evidence.outbox_messages WHERE id = 'c0000000-0000-0000-0000-000000000001' AND published_at IS NOT NULL AND attempt_count = 2 AND lease_owner IS NULL AND lease_until IS NULL;")"
[[ "$evidence_terminal_count" == "1" ]]

if psql "$connection" -v ON_ERROR_STOP=1 -c "INSERT INTO evidence.documents (id, security_id, source_kind, headline, publisher, trust_state, provider, provider_record_id, canonical_uri, published_at, observed_at, version, content_right, is_deleted, content_sha256) VALUES ('b0000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000001', 'News', 'Duplicate', 'Synthetic Publisher', 'Unverified', 'synthetic-evidence', 'record-1', 'https://example.test/duplicate', '2026-10-01T12:00:00Z', '2026-10-01T12:01:00Z', 1, 'MetadataOnly', FALSE, repeat('c', 64));" >/dev/null 2>&1; then
  echo "Duplicate evidence provider record/version was accepted." >&2
  exit 1
fi

if psql "$connection" -v ON_ERROR_STOP=1 -c "DELETE FROM evidence.documents WHERE id = 'b0000000-0000-0000-0000-000000000001';" >/dev/null 2>&1; then
  echo "Evidence document deletion bypassed restricted snapshot/outbox lineage." >&2
  exit 1
fi

psql "$connection" -v ON_ERROR_STOP=1 -c "INSERT INTO evidence.social_attention_aggregates (id, security_id, mention_count, distinct_author_estimate, attention_change_percent, confidence, manipulation_risk, limitation_label, provider, aggregate_id, window_start, window_end, observed_at, version, method, is_deleted, retain_until, content_sha256) VALUES ('d0000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', 12, 10, 25, 'Low', 'Elevated', 'Aggregate only; not proof of a catalyst.', 'synthetic-social-attention', 'aggregate-1', '2026-10-02T11:55:00Z', '2026-10-02T12:00:00Z', '2026-10-02T12:01:00Z', 1, 'Synthetic aggregate; no identifiers retained.', FALSE, '2026-10-09T12:01:00Z', repeat('d', 64));" >/dev/null

if psql "$connection" -v ON_ERROR_STOP=1 -c "INSERT INTO evidence.social_attention_aggregates (id, security_id, mention_count, distinct_author_estimate, attention_change_percent, confidence, manipulation_risk, limitation_label, provider, aggregate_id, window_start, window_end, observed_at, version, method, is_deleted, retain_until, content_sha256) VALUES ('d0000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000001', 12, 10, 25, 'Low', 'Elevated', 'Duplicate', 'synthetic-social-attention', 'aggregate-1', '2026-10-02T11:55:00Z', '2026-10-02T12:00:00Z', '2026-10-02T12:01:00Z', 1, 'Duplicate', FALSE, '2026-10-09T12:01:00Z', repeat('e', 64));" >/dev/null 2>&1; then
  echo "Duplicate social provider aggregate/version was accepted." >&2
  exit 1
fi

if psql "$connection" -v ON_ERROR_STOP=1 -c "INSERT INTO evidence.social_attention_aggregates (id, security_id, mention_count, distinct_author_estimate, attention_change_percent, confidence, manipulation_risk, limitation_label, provider, aggregate_id, window_start, window_end, observed_at, version, method, is_deleted, retain_until, content_sha256) VALUES ('d0000000-0000-0000-0000-000000000003', '91000000-0000-0000-0000-000000000001', 1, 1, 1, 'Low', 'Unknown', 'Invalid tombstone', 'synthetic-social-attention', 'aggregate-2', '2026-10-02T11:55:00Z', '2026-10-02T12:00:00Z', '2026-10-02T12:01:00Z', 1, 'Synthetic', TRUE, '2026-10-09T12:01:00Z', repeat('f', 64));" >/dev/null 2>&1; then
  echo "Deleted social aggregate retained metrics." >&2
  exit 1
fi

psql "$connection" -v ON_ERROR_STOP=1 -c "INSERT INTO evidence.social_attention_aggregates (id, security_id, mention_count, distinct_author_estimate, attention_change_percent, confidence, manipulation_risk, limitation_label, provider, aggregate_id, window_start, window_end, observed_at, version, method, is_deleted, retain_until, content_sha256) VALUES ('d0000000-0000-0000-0000-000000000004', '91000000-0000-0000-0000-000000000001', 0, 0, 0, 'Low', 'Unknown', 'Expired tombstone', 'synthetic-social-attention', 'expired-1', '2026-10-02T11:55:00Z', '2026-10-02T12:00:00Z', '2026-10-02T12:01:00Z', 1, 'Synthetic', TRUE, '2026-10-02T13:00:00Z', repeat('1', 64)), ('d0000000-0000-0000-0000-000000000005', '91000000-0000-0000-0000-000000000001', 0, 0, 0, 'Low', 'Unknown', 'Expired tombstone', 'synthetic-social-attention', 'expired-2', '2026-10-02T11:55:00Z', '2026-10-02T12:00:00Z', '2026-10-02T12:01:00Z', 1, 'Synthetic', TRUE, '2026-10-02T14:00:00Z', repeat('2', 64));" >/dev/null

deleted_social_count="$(psql "$connection" -Atqc "WITH expired AS MATERIALIZED (SELECT aggregate.id, aggregate.provider, aggregate.aggregate_id, aggregate.version, aggregate.retain_until, aggregate.content_sha256 FROM evidence.social_attention_aggregates aggregate WHERE aggregate.retain_until <= '2026-10-03T00:00:00Z' ORDER BY aggregate.retain_until, aggregate.id FOR UPDATE SKIP LOCKED LIMIT 1), deleted AS (DELETE FROM evidence.social_attention_aggregates aggregate USING expired WHERE aggregate.id = expired.id RETURNING aggregate.id), audited AS (INSERT INTO audit.social_retention_deletions (id, aggregate_record_id, provider, aggregate_id, version, retain_until, deleted_at, reason, content_sha256) SELECT gen_random_uuid(), expired.id, expired.provider, expired.aggregate_id, expired.version, expired.retain_until, '2026-10-03T00:00:00Z', 'RetentionExpired', expired.content_sha256 FROM expired INNER JOIN deleted ON deleted.id = expired.id RETURNING 1) SELECT count(*) FROM audited;")"
[[ "$deleted_social_count" == "1" ]]
remaining_expired_social="$(psql "$connection" -Atc "SELECT count(*) FROM evidence.social_attention_aggregates WHERE retain_until <= '2026-10-03T00:00:00Z';")"
[[ "$remaining_expired_social" == "1" ]]
retained_social_count="$(psql "$connection" -Atc "SELECT count(*) FROM evidence.social_attention_aggregates WHERE id = 'd0000000-0000-0000-0000-000000000001' AND retain_until > '2026-10-03T00:00:00Z';")"
[[ "$retained_social_count" == "1" ]]
social_deletion_audit_count="$(psql "$connection" -Atc "SELECT count(*) FROM audit.social_retention_deletions WHERE aggregate_record_id = 'd0000000-0000-0000-0000-000000000004' AND reason = 'RetentionExpired' AND deleted_at = '2026-10-03T00:00:00Z';")"
[[ "$social_deletion_audit_count" == "1" ]]

revoked_session_count="$(psql "$connection" -Atc "SELECT count(*) FROM iam.user_sessions WHERE id = '70000000-0000-0000-0000-000000000007' AND revoked_at IS NOT NULL AND version = 2;")"
[[ "$revoked_session_count" == "1" ]]

scanner_candidate_count="$(psql "$connection" -Atc "SELECT count(*) FROM scanner.run_candidates WHERE run_id = '90000000-0000-0000-0000-000000000009';")"
[[ "$scanner_candidate_count" == "2" ]]

scanner_owner_count="$(psql "$connection" -Atc "SELECT count(*) FROM scanner.runs WHERE id = '90000000-0000-0000-0000-000000000009' AND account_id = '30000000-0000-0000-0000-000000000003';")"
[[ "$scanner_owner_count" == "1" ]]

scanner_sequence_count="$(psql "$connection" -Atc "SELECT count(*) FROM scanner.runs WHERE account_id = '30000000-0000-0000-0000-000000000003' AND ((id = '90000000-0000-0000-0000-000000000011' AND stream_sequence = 1) OR (id = '90000000-0000-0000-0000-000000000012' AND stream_sequence = 2));")"
[[ "$scanner_sequence_count" == "2" ]]
scanner_cursor="$(psql "$connection" -Atc "SELECT last_sequence FROM scanner.account_streams WHERE account_id = '30000000-0000-0000-0000-000000000003';")"
[[ "$scanner_cursor" == "2" ]]

outbox_sequence="$(psql "$connection" -Atc "SELECT string_agg(stream_sequence::text, ',' ORDER BY stream_sequence) FROM platform.outbox_messages WHERE account_id = '30000000-0000-0000-0000-000000000003' AND event_type = 'scanner.updated' AND published_at IS NULL;")"
[[ "$outbox_sequence" == "1,2" ]]

claimed_first="$(psql "$connection" -Atqc "WITH candidate AS (SELECT message.id FROM platform.outbox_messages message WHERE message.published_at IS NULL AND message.next_attempt_at <= '2026-09-16T12:00:00Z' AND (message.lease_until IS NULL OR message.lease_until <= '2026-09-16T12:00:00Z') AND NOT EXISTS (SELECT 1 FROM platform.outbox_messages earlier WHERE earlier.account_id = message.account_id AND earlier.event_type = message.event_type AND earlier.published_at IS NULL AND earlier.stream_sequence < message.stream_sequence) ORDER BY message.occurred_at, message.id FOR UPDATE SKIP LOCKED LIMIT 10) UPDATE platform.outbox_messages message SET lease_owner = 'smoke-worker', lease_until = '2026-09-16T12:00:30Z', attempt_count = message.attempt_count + 1 FROM candidate WHERE message.id = candidate.id RETURNING message.stream_sequence;")"
[[ "$claimed_first" == "1" ]]
psql "$connection" -v ON_ERROR_STOP=1 -c "UPDATE platform.outbox_messages SET published_at = '2026-09-16T12:00:01Z', lease_owner = NULL, lease_until = NULL WHERE id = 'a0000000-0000-0000-0000-000000000001' AND lease_owner = 'smoke-worker';" >/dev/null
claimed_second="$(psql "$connection" -Atqc "WITH candidate AS (SELECT message.id FROM platform.outbox_messages message WHERE message.published_at IS NULL AND message.next_attempt_at <= '2026-09-16T12:00:02Z' AND (message.lease_until IS NULL OR message.lease_until <= '2026-09-16T12:00:02Z') AND NOT EXISTS (SELECT 1 FROM platform.outbox_messages earlier WHERE earlier.account_id = message.account_id AND earlier.event_type = message.event_type AND earlier.published_at IS NULL AND earlier.stream_sequence < message.stream_sequence) ORDER BY message.occurred_at, message.id FOR UPDATE SKIP LOCKED LIMIT 10) UPDATE platform.outbox_messages message SET lease_owner = 'smoke-worker', lease_until = '2026-09-16T12:00:32Z', attempt_count = message.attempt_count + 1 FROM candidate WHERE message.id = candidate.id RETURNING message.stream_sequence;")"
[[ "$claimed_second" == "2" ]]

if psql "$connection" -v ON_ERROR_STOP=1 -c "INSERT INTO platform.outbox_messages (id, account_id, aggregate_id, event_type, schema_version, stream_sequence, occurred_at, payload, attempt_count, next_attempt_at) VALUES ('a0000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '90000000-0000-0000-0000-000000000012', 'scanner.updated', 1, 2, '2026-09-11T14:32:00Z', '{}'::jsonb, 0, '2026-09-11T14:32:00Z');" >/dev/null 2>&1; then
  echo "Duplicate account/event outbox sequence was accepted." >&2
  exit 1
fi

if psql "$connection" -v ON_ERROR_STOP=1 -c "INSERT INTO scanner.runs (id, account_id, stream_sequence, preset_version_key, as_of, input_snapshot_hash, data_quality) VALUES ('90000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000003', 2, 'dddddddddddddddddddddddddddddddd:1', '2026-09-11T14:33:00Z', repeat('e', 64), 'Complete');" >/dev/null 2>&1; then
  echo "Duplicate account-scoped scanner sequence was accepted." >&2
  exit 1
fi

psql "$connection" -v ON_ERROR_STOP=1 -c "INSERT INTO scanner.runs (id, account_id, stream_sequence, supersedes_run_id, correction_reason, preset_version_key, as_of, input_snapshot_hash, data_quality) VALUES ('90000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000003', 3, '90000000-0000-0000-0000-000000000012', 'Vendor corrected source snapshot', 'dddddddddddddddddddddddddddddddd:1', '2026-09-11T14:34:00Z', repeat('f', 64), 'Complete');" >/dev/null
correction_lineage_count="$(psql "$connection" -Atc "SELECT count(*) FROM scanner.runs WHERE id = '90000000-0000-0000-0000-000000000014' AND supersedes_run_id = '90000000-0000-0000-0000-000000000012' AND correction_reason = 'Vendor corrected source snapshot';")"
[[ "$correction_lineage_count" == "1" ]]

if psql "$connection" -v ON_ERROR_STOP=1 -c "INSERT INTO scanner.runs (id, account_id, stream_sequence, supersedes_run_id, correction_reason, preset_version_key, as_of, input_snapshot_hash, data_quality) VALUES ('90000000-0000-0000-0000-000000000015', '30000000-0000-0000-0000-000000000003', 4, '90000000-0000-0000-0000-000000000012', 'Second correction', 'dddddddddddddddddddddddddddddddd:1', '2026-09-11T14:35:00Z', repeat('1', 64), 'Complete');" >/dev/null 2>&1; then
  echo "A scanner run was superseded more than once." >&2
  exit 1
fi

if psql "$connection" -v ON_ERROR_STOP=1 -c "INSERT INTO scanner.runs (id, account_id, stream_sequence, supersedes_run_id, preset_version_key, as_of, input_snapshot_hash, data_quality) VALUES ('90000000-0000-0000-0000-000000000016', '30000000-0000-0000-0000-000000000003', 4, '90000000-0000-0000-0000-000000000014', 'dddddddddddddddddddddddddddddddd:1', '2026-09-11T14:36:00Z', repeat('2', 64), 'Complete');" >/dev/null 2>&1; then
  echo "Correction lineage without a reason was accepted." >&2
  exit 1
fi

if psql "$connection" -v ON_ERROR_STOP=1 -c "INSERT INTO scanner.runs (id, account_id, preset_version_key, as_of, input_snapshot_hash, data_quality) VALUES ('90000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000999', 'dddddddddddddddddddddddddddddddd:1', '2026-09-11T14:30:00Z', repeat('b', 64), 'Partial');" >/dev/null 2>&1; then
  echo "Scanner run with unknown account was accepted." >&2
  exit 1
fi

if psql "$connection" -v ON_ERROR_STOP=1 -c "INSERT INTO account.account_entitlements (id, user_id, account_id, permission, effective_from, allows_live_trading) VALUES ('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'View', '2026-08-26T12:00:00Z', TRUE);" >/dev/null 2>&1; then
  echo "Live entitlement was accepted before controlled-live authorization." >&2
  exit 1
fi

if psql "$connection" -v ON_ERROR_STOP=1 -c "INSERT INTO iam.external_identities (id, user_id, issuer, subject, linked_at, last_authenticated_at) VALUES ('60000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'https://identity.example', 'owner-subject', '2026-08-26T12:00:00Z', '2026-08-26T12:00:00Z');" >/dev/null 2>&1; then
  echo "Duplicate issuer/subject identity was accepted." >&2
  exit 1
fi

if psql "$connection" -v ON_ERROR_STOP=1 -c "INSERT INTO iam.user_sessions (id, user_id, issued_at, last_seen_at, expires_at, ticket_key_hash, protected_ticket, version) VALUES ('80000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', '2026-08-27T12:00:00Z', '2026-08-27T12:00:00Z', '2026-08-27T12:00:00Z', decode(repeat('cd', 32), 'hex'), decode('01', 'hex'), 1);" >/dev/null 2>&1; then
  echo "Invalid session expiry window was accepted." >&2
  exit 1
fi

if psql "$connection" -v ON_ERROR_STOP=1 -c "INSERT INTO scanner.run_candidates (run_id, security_id, symbol, rank, qualified, extreme_move_risk, exclusion_reason) VALUES ('90000000-0000-0000-0000-000000000009', '93000000-0000-0000-0000-000000000003', 'INVALID', 2, FALSE, FALSE, 'must fail');" >/dev/null 2>&1; then
  echo "An unqualified scanner candidate with a rank was accepted." >&2
  exit 1
fi

echo "PostgreSQL $server_version compatibility verified: 11 approved schemas, 16 migrations, 5 IAM/account tables, 3 scanner tables, 5 evidence tables, replay-safe combined evidence snapshots, privacy-safe social aggregates with immutable deletion audit, immutable source snapshots, owner-bound evidence retry/publication, immutable scanner correction lineage, leased ordered outbox dispatch, scanner account binding and sequences, protected durable tickets, scanner rank integrity, session revocation, unique identity, no-live entitlement and runtime DDL denial."
