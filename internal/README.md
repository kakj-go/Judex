# Backend boundaries

The runnable scaffold implements configuration, HTTP lifecycle, probes, request IDs, error responses and frontend hosting. `transport/http` contains no business state. `agent` defines the execution boundary only; it never executes commands on the API host.

Modules are reserved for identity, project, work, decision, handoff, discussion, material, workflow, job and audit. Their implementations, authorization, PostgreSQL repositories, migrations, S3 adapter, SQLite context store and OpenSandbox client are not yet provided. Placeholder APIs respond with HTTP 501, never simulated success.

Gin contexts must not enter domain services or background jobs. Authoritative state belongs in PostgreSQL; temporary Agent context belongs in isolated SQLite stores; project shared files are read-only to Agents.
