# Updating the upstream version

This package wraps two upstream artifacts from the [ark-bitcoin](https://gitlab.com/ark-bitcoin) project, both pinned in `bark.Dockerfile`:

- **`bark-web`** — the frontend GUI and its API proxy, built from a git tag (`BARK_WEB_VERSION`).
- **`barkd`** — the wallet daemon, fetched as a release binary with a pinned SHA-256 (`BARK_VERSION`).

The two are versioned independently, but the `bark-web` frontend bundles a `@secondts/barkd` JS client that must match the `barkd` daemon. Keep `BARK_VERSION` aligned with the client version `bark-web` ships.

## Determining the upstream versions

- **bark-web** ([labs/bark-web](https://gitlab.com/ark-bitcoin/labs/bark-web)) — latest git tag:

  ```sh
  git ls-remote --tags https://gitlab.com/ark-bitcoin/labs/bark-web.git | tail
  ```

  Confirm the bundled daemon client version in that tag's `package-lock.json` under `node_modules/@secondts/barkd` — `BARK_VERSION` should match it.

- **barkd** ([ark-bitcoin/bark](https://gitlab.com/ark-bitcoin/bark)) — release tags are named `bark-<version>`:

  ```sh
  curl -s 'https://gitlab.com/api/v4/projects/ark-bitcoin%2Fbark/releases?per_page=5' | jq -r '.[].tag_name'
  ```

## Applying the bump

1. In `bark.Dockerfile`, update the `ARG BARK_WEB_VERSION` and `ARG BARK_VERSION` defaults.
2. Refresh the pinned daemon checksums from the release `SHA256SUMS`:

   ```sh
   curl -fsSL "https://gitlab.com/ark-bitcoin/bark/-/releases/bark-<version>/downloads/SHA256SUMS" \
     | grep -E 'barkd-<version>-linux-(x86_64|arm64)'
   ```

   Put the `x86_64` hash in `BARKD_SHA256_AMD64` and the `arm64` hash in `BARKD_SHA256_ARM64`.
3. Bump `version` and `releaseNotes` in `startos/versions/current.ts`.
4. Run `make` and verify the build succeeds.
