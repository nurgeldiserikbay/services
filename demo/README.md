# Local integrated demo (development only)

Requires Docker Desktop with Compose v2 and the four repositories cloned side by side, with this documentation repository named services. Run from services/demo:

    docker compose up

Open http://localhost:3000/kk or /ru. Search globally or online for Demo. Open http://localhost:3002 for the admin shell. Database and API are internal to the compose network; only loopback web ports are published. All identities are synthetic. No OTP provider, privileged session or mutation feature flags are enabled. This is a real catalog stack, not full marketplace acceptance or a public deployment.

Stop with docker compose down. Volumes persist. Use fresh checkouts without node_modules or .env files; never mount production credentials or use a real database. To rebuild from updated sources, stop the stack and remove only the demo work volumes (not external databases). The sample password is for the isolated demo network only.

Verification pending: first cold boot, catalog results, profile and offer navigation, admin shell, repeat startup. Next milestone: isolated interactive request/auth demo using approved fixture delivery, then staging TLS and provider configuration.
