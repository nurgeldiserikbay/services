# Cross-repository collaboration rules

- The services repository is the source of truth for product behavior, domain invariants, architecture decisions and agreed OpenAPI contracts.
- For breaking changes: document the domain rule and migration plan; update API contract; implement backend; update typed clients and admin/front; verify compatibility.
- Do not make unreviewed breaking API or permission changes in client repositories.
- Prefer feature branches and reviewable PRs. Keep main deployable. Never self-merge without explicit project-owner instruction.
- Parallel tasks must have isolated file/module ownership and documented integration points.
- Tests: domain unit and invariant tests, integration/database tests, auth/security tests, API contract tests, frontend accessibility/E2E, mobile device smoke tests.
- Security: no credentials, secrets, tokens, real customer data or personal medical details in git. Provide example env files with placeholders.
- Every repository has its own CI. Include lint/typecheck/tests in relevant pipelines.
- Public web SEO needs server-rendered pages; mobile Capacitor webview consumes static assets and remote APIs.
- Changes to pricing, ratings and permissions require auditable product decisions.
