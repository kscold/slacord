# Runtime Profiles

Slacord can run against the current-code local web/server pair while reusing
container-forwarded infrastructure like MongoDB and MinIO.

## Included Profiles

### `local-container`

- Current repo server runs on `127.0.0.1:18084`
- Current repo web runs on `127.0.0.1:3103`
- Forwarded MongoDB is expected on `127.0.0.1:27020`
- MinIO is expected on `http://127.0.0.1:9000`
- Mongo credentials are discovered from a running Docker container whose image
  contains `ubuntu-slacord`, unless a local override file provides them

### `local-container-discord-mock`

- Extends `local-container`
- Starts the server on `127.0.0.1:18085`
- Injects the Discord fetch mock automatically
- Used by `discord-import-mock-check.mjs`

## Local Override

Create `config/profiles/local-container.local.env` if Docker credential discovery
is unavailable or you want to pin credentials explicitly.

```env
SLACORD_MONGO_USERNAME=slacord
SLACORD_MONGO_PASSWORD=change-me
```

All `*.local.env` profile files are gitignored.

## Useful Commands

```bash
yarn profile:print
yarn dev:stack:profile
yarn build:server
yarn build:web:profile
yarn start:stack:profile
yarn verify:full
```

## What `verify:full` Runs

- Playwright Chromium install check
- `yarn test:server`
- `yarn build:server`
- `yarn test:web`
- `yarn build:web:profile`
- `yarn test:desktop`
- `yarn build:desktop`
- current-code server startup on the runtime profile
- current-code web startup on the runtime profile
- `yarn test:e2e:web`
- `scripts/live-surface-check.mjs`
- mock server startup on the Discord mock profile
- `scripts/discord-import-mock-check.mjs`
