-- Run with a PostgreSQL cluster administrator before application migrations.
-- These are group roles only. Environment-specific login roles and passwords are
-- provisioned by the secrets/IaC system and granted the appropriate membership.

DO $roles$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'makh_owner') THEN
        CREATE ROLE makh_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'makh_migrator') THEN
        CREATE ROLE makh_migrator NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'makh_runtime') THEN
        CREATE ROLE makh_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'makh_readonly') THEN
        CREATE ROLE makh_readonly NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
    END IF;
END
$roles$;

GRANT makh_owner TO makh_migrator;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
