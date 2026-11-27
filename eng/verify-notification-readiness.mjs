import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/NOTIFICATION_ACCEPTANCE.md',
  'src/MAKH.Application/Notifications/NotificationContracts.cs',
  'src/MAKH.Application/Notifications/NotificationService.cs',
  'src/MAKH.Infrastructure/Notifications/InMemoryNotificationStore.cs',
  'tests/MAKH.Architecture.Tests/NotificationServiceTests.cs',
  'outputs/environment-foundation-readiness/readiness-manifest.json',
  'outputs/portal-provenance-gate/local-evidence-manifest.json',
  'outputs/paper-trading-gate/local-evidence-manifest.json',
  'outputs/operational-readiness/local-evidence-manifest.json',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));
const acceptance = contents.get(files[0]);
const contracts = contents.get(files[1]);
const service = contents.get(files[2]);
const store = contents.get(files[3]);
const tests = contents.get(files[4]);
const environment = JSON.parse(contents.get(files[5]));
const portalGate = JSON.parse(contents.get(files[6]));
const paperGate = JSON.parse(contents.get(files[7]));
const operationalGate = JSON.parse(contents.get(files[8]));

const checks = [
  {
    id: 'fail-closed-preference-routing',
    passed: service.includes('no mandatory rule or matching enabled severity preference exists')
      && tests.includes('MissingPreferenceSuppressesDeliveryFailClosed')
      && tests.includes('ChannelPreferencesAreIndependent'),
    detail: 'Missing, disabled, wrong-channel and below-severity preferences suppress delivery.',
  },
  {
    id: 'exact-mandatory-safety-policy',
    passed: contracts.includes('Mandatory notification rules must be unique by event type and channel')
      && tests.includes('MandatorySafetyPolicyCannotBeWeakenedByDisabledPreference')
      && tests.includes('MandatorySafetyPolicyRequiresExactEventType'),
    detail: 'Mandatory safety delivery is exact, non-ambiguous and cannot be weakened by ordinary preferences.',
  },
  {
    id: 'defined-bounded-contracts',
    passed: contracts.includes('!Enum.IsDefined(channel)')
      && contracts.includes('!Enum.IsDefined(minimumSeverity)')
      && contracts.includes('subject.Length > 200')
      && tests.includes('UndefinedEnumsAndNonUtcOrFutureEventsFailClosed'),
    detail: 'Undefined enums and oversized or control-bearing evidence fail closed.',
  },
  {
    id: 'utc-and-future-fence',
    passed: contracts.includes('occurredAt.Offset != TimeSpan.Zero')
      && service.includes('notification.OccurredAt > now.AddSeconds(30)')
      && service.includes('Clock must return non-default UTC time'),
    detail: 'Occurrence, queue and result chronology require non-default UTC and reject future evidence.',
  },
  {
    id: 'complete-intent-idempotency',
    passed: contracts.includes('Dictionary<string, NotificationIntent> IntentsByIdempotencyKey')
      && service.includes('state.IntentsByIdempotencyKey.GetValueOrDefault(key) == intent')
      && tests.includes('ChangedEventContentWithSameIdentityAndKeyConflicts'),
    detail: 'Idempotency binds complete account, content, correlation, time and channel intent.',
  },
  {
    id: 'delivery-state-and-retry-integrity',
    passed: service.includes('MaximumDeliveryAttempts = 10')
      && service.includes('current.State == DeliveryState.Delivered')
      && service.includes('now < current.AttemptedAt')
      && tests.includes('ResultAuditRejectsSensitiveOrRegressingEvidence'),
    detail: 'Terminal delivery, retry limits and non-regressing result time protect audit state.',
  },
  {
    id: 'sensitive-evidence-defense',
    passed: contracts.includes('Notification evidence must not contain direct addresses or token material')
      && service.includes('ContainsSensitiveMaterial(requiredReason)')
      && service.includes('RedactReceipt'),
    detail: 'Event, result and provider evidence reject or redact direct sensitive material.',
  },
  {
    id: 'atomic-in-memory-model',
    passed: store.includes('lock (sync) return operation(state)')
      && service.includes('state.AttemptsByIdempotencyKey.Add(key, attempt)')
      && service.includes('state.IntentsByIdempotencyKey.Add(key, intent)'),
    detail: 'The local store serializes preference, intent and attempt mutations atomically.',
  },
  {
    id: 'immutable-no-trading-authority',
    passed: contracts.includes('public bool IsAuthoritativeTradingState => AttemptNumber < 0')
      && contracts.includes('public bool CreatesLiveAuthority => AttemptNumber < 0')
      && tests.includes('Assert.False(result.IsAuthoritativeTradingState)')
      && tests.includes('Assert.False(result.CreatesLiveAuthority)'),
    detail: 'Notification attempts cannot become authoritative trading state or live authority.',
  },
  {
    id: 'test-evidence-qualified',
    passed: acceptance.includes('20 focused')
      && acceptance.includes('not claimed as executed')
      && acceptance.includes('431 architecture tests and 66 API-security tests'),
    detail: 'New authored cases and the retained executed baseline are explicitly distinguished.',
  },
  {
    id: 'predecessor-acceptance-negative',
    passed: environment.environmentFoundationAccepted === false
      && portalGate.gateAccepted === false
      && paperGate.gateAccepted === false
      && operationalGate.gateAccepted === false,
    detail: 'Environment, portal, paper and operational predecessor gates remain unaccepted.',
  },
  {
    id: 'external-delivery-disabled',
    passed: acceptance.includes('no API, SignalR hub, email provider, address, credential or external connection')
      && acceptance.includes('cannot change risk, reconciliation, order or live-trading state'),
    detail: 'No authenticated route, provider connection or operational/trading authority is inferred.',
  },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Notification readiness failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  'PostgreSQL preference/attempt persistence, transactional outbox/inbox, leases, retry scheduling and dead-letter recovery are absent.',
  'Authenticated account/user routing plus SignalR sequence, gap, snapshot and revocation behavior are not integrated.',
  'No approved email provider, verified sender/domain, templates, unsubscribe rules or bounce/complaint handling exists.',
  'Mandatory production rules, rate limits, quiet hours, escalation and privacy/retention decisions remain unapproved.',
  'Provider sandbox, load/failure/recovery, accessibility and incident-drill evidence remains incomplete.',
  'Fresh .NET execution is blocked by sandbox named-pipe denial; accountable Product, Security, Privacy and Operations approvals are pending.',
];
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 8.1 Notification readiness',
  localControls: 'PASS',
  readinessDecision: 'Local Notification Domain Ready / Durable Delivery and Accountable Acceptance Pending',
  notificationAccepted: false,
  postgresPersistenceEnabled: false,
  authenticatedRoutingEnabled: false,
  signalRDeliveryEnabled: false,
  emailDeliveryEnabled: false,
  externalDeliveryEnabled: false,
  operationalAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts: files.map((file) => ({
    path: file,
    sha256: createHash('sha256').update(contents.get(file)).digest('hex'),
  })),
};
await mkdir(path.join(root, 'outputs/notification-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/notification-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Notification readiness: ${checks.length} checks, ${files.length} hashed artifacts, ${blockers.length} blockers; ${manifest.readinessDecision}.`);
