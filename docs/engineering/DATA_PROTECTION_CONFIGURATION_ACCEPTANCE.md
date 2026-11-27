# Data Protection Configuration Acceptance

Date: 2026-08-27  
WBS: 3.5 Identity and access

## Accepted implementation

- The server has an explicit `DataProtection` configuration contract for key-ring path, certificate path and externally supplied certificate password.
- When production identity is enabled, startup validation rejects a missing or relative key-ring path, missing certificate and missing certificate password.
- Configured keys persist to the selected filesystem repository and are encrypted with the configured PKCS#12 certificate.
- Local disabled-identity development remains available without production key material.

## Verification

- Release build completed with zero warnings and errors.
- 314 architecture tests and 31 API-security tests passed.
- 87 Angular tests and all seven production builds passed.
- PostgreSQL 17.10 smoke verification passed with four migrations.

## Deployment boundary

No production key repository or certificate was created or accessed. Operations must provision shared durable storage, mount the certificate/password through approved secret management, prove multi-replica decryptability, exercise rotation and recovery, and approve the evidence. No production or live-trading authority is granted.
