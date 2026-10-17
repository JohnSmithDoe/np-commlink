# jamserve client — SIMSENSE against a server on the internet

**Research; what got decided lives in [domains.md](../domains.md) under SIMSENSE.** What it takes for SIMSENSE to stream from a self-hosted
[jamserve](https://github.com/ffalt/jamserve) (v0.6.17, Jam API 0.2.1) on the internet as well as from
the local folder grant. Server facts were checked in the jamserve source on 2026-10-11 (paths below are
relative to the jamserve checkout); the general infra lessons are in
`devops/docs/jamserve-internet-exposure.md`.

## Local development: plain HTTP

Develop against a local jamserve on `http://localhost:4040` with `pnpm start` (`http://localhost:4200`).
Both are plain HTTP on localhost, so there is no TLS, no mixed content, and
`JAM_SESSION_COOKIE_SECURE=false` is accepted, because the server only warns when the domain is not
localhost.

- **CORS, tested 2026-10-11 against the container:** with
  `JAM_ALLOWED_COOKIE_DOMAINS=http://localhost:4040,http://localhost:4200`, origin
  `http://localhost:4200` gets preflight 204 and `Access-Control-Allow-Origin` echoed back.
- **The deployed PWA against a local server:** add `https://johnsmithdoe.github.io` to the list. The
  origin has no path, so `/np-commlink/` is not part of it. Tested 2026-10-11 with that origin, the whole
  chain passed: login → `user/subsonic/generate` → Subsonic `ping` with the token → `/rest/stream` with a
  track id from `track/search`, which returned `200 audio/mpeg` with `Accept-Ranges: bytes`, so `<audio>`
  can seek. Not tested in a real browser: an HTTPS page calling `http://localhost` is exempt from
  mixed-content blocking, but Chrome asks for local-network-access permission first.
- **An unlisted origin comes back as 500, not 403**, because jamserve's CORS callback throws — the same
  status a wrong path gets, so a client cannot tell the two apart.
- **On a phone, `localhost` is the phone.** `adb reverse tcp:4040 tcp:4040` maps it to the dev machine,
  or use `10.0.2.2:4040` on the emulator. Debug builds permit cleartext to exactly those two hosts
  (`../../android/app/src/debug/res/xml/network_security_config.xml`); verified 2026-10-11 on an API 36
  emulator: login, browsing and ExoPlayer streaming over `http://localhost`.

## The server as it would run on the internet

```text
phone / PWA ──HTTPS──▶ reverse proxy (TLS) ──HTTP──▶ jamserve ──▶ Postgres
                                                        └──▶ media volume
```

- **TLS ends at the proxy, and it has to be HTTPS.** Both shells of this app are secure origins
  (Capacitor `androidScheme: 'https'`, the PWA on GitHub Pages), so a plain-HTTP server is blocked as
  mixed content before CORS is even consulted.
- **Postgres**, not SQLite. The README says SQLite does not support multiple users.
- **Secrets** `JAM_JWT_SECRET` and `JAM_SESSION_SECRET` must be at least 64 characters, and known
  defaults are refused at startup (`jamserve/src/modules/engine/services/config.service.ts`).
- **`JAM_SESSION_TRUST_PROXY=true`** behind the proxy (sets `trust proxy` to 1 hop). Without it every
  client shares the proxy's IP, and the 5 logins per 15 min limit is global. With it but no proxy in
  front, `X-Forwarded-For` is client-controlled.

## Two APIs, two auth models

| | Jam API `/jam/v1` | Subsonic API `/rest` |
| --- | --- | --- |
| Auth | `Authorization: Bearer <jwt>` only, HS256, no query fallback | query string: `u` + `t`=md5(subsonic token+salt) + `s`; the token comes from the Jam API, not the password |
| Login | `POST /jam/v1/auth/login` with `{server, username, password, client, jwt: true}` | none, every request carries credentials |
| Revocation | each JWT hash is checked against revoked sessions | generate a new Subsonic token |
| Typed client | server generates one: `/docs/axios-client.zip`, `/docs/angular-client.zip` (Angular services + `NgModule`, one service per resource) | none from the server, the spec is public |
| Spec | `/docs/openapi.json`, GraphQL at `/docs/schema.graphql` | `/docs/subsonic-openapi.json` |
| Rate limit (per IP / 15 min) | 2000 | 1000 |

Sources: `jamserve/src/modules/server/middlewares/passport.middleware.ts`,
`jamserve/src/modules/subsonic/login.ts`, `jamserve/src/modules/server/middlewares/docs.middleware.ts`.
JWTs live **one year** unless `JAM_JWT_MAXAGE` is set.

## What this app has to solve

- **CORS binds the PWA only.** jamserve accepts an origin only if it is listed in
  `JAM_ALLOWED_COOKIE_DOMAINS`, which is also its CORS allow-list despite the name; requests with no
  `Origin` pass. The APK sends none — its Jam client runs on a `CapacitorHttp` adapter
  (`../../src/app/music/data/capacitor-http.adapter.ts`), verified on the emulator. **Assume a third-party
  server whose list this app does not control.** Then:
  - **PWA:** cannot browse such a server. A browser always sends `Origin`, so the only options are the
    server's admin adding the Pages origin, or a proxy run by this app's owner, which then sees every
    user's credentials. Playback alone would work (see below), but there is nothing to browse it with.
- **The PWA's `<audio>` cannot send a header, and the cookie will not travel.** jamserve's session cookie
  is `SameSite=Lax`, so a cross-site media request from the Pages origin goes out without it. The options
  are Subsonic stream URLs, which are self-authenticating, or fetching into a blob, which loses
  progressive playback and seeking.
- **Revoking a cookie session does not end it.** `POST /session/remove` deletes the row, but
  `ExpressSessionStore` serves sessions from an in-memory LRU it never evicts on removal
  (`jamserve/src/modules/server/middlewares/session-store.ts`), so the revoked cookie keeps answering
  200 until a restart or eviction. Tested 2026-10-11. JWT revocation is checked against the database and
  is unaffected.
- **Per-IP limits and mobile networks.** Mobile carriers often put many users behind one public IP
  (carrier-grade NAT), and a full library sync is many requests. 2000 per 15 min is enough for a page
  view, but tight for a first index pull.

## The cheapest path

**One server, two of its APIs.** jamserve is the only backend; no second Subsonic server is involved.
Browse with the Jam API, and play through jamserve's own Subsonic API. The stream URLs work
unchanged in both ExoPlayer and `<audio>`, which removes the two hardest points above.

1. `POST /jam/v1/auth/login` returns a JWT for the Jam API (typed Axios client).
2. `POST /jam/v1/user/subsonic/generate` with `{id, password}` returns a **Subsonic token**.
3. Play with `/rest/stream?id=<track id>&u=<user>&t=md5(token + salt)&s=<salt>&v=1.16.0&c=<client>`.

- **The token is not the password.** jamserve checks Subsonic logins against that generated token,
  never the account password (`jamserve/src/entity/user/user.service.ts`, `authSubsonicToken`). What
  lands in proxy access logs is a salted hash of a revocable token.
- **One token per user, and generating one rotates it.** Each call replaces the previous token
  (`jamserve/src/entity/session/session.service.ts`, `createSubsonic`), which logs out every other
  Subsonic client. Generate once, keep it in device storage, and regenerate only on an auth failure.
- **IDs are shared.** `/rest/stream` resolves `id` against the same database as the Jam API, so a track
  id from the Jam API streams as is.
- **Protocol version 1.16.0, OpenSubsonic.** A request with a higher `v` fails with error 30. The
  extensions offered are `songLyrics`, `formPost` and `transcodeOffset`; there is no `apiKeyAuthentication`.
- **Steps 1 and 2 go through native HTTP on the APK** (see above), because the server's CORS list is
  not this app's to change. Step 3 is a media load and needs no CORS. `/rest` is mounted before the CORS middleware, so the app cannot read
  Subsonic JSON from the WebView anyway, and browsing stays on the Jam API.
