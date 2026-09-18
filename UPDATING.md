# Updating the upstream version

This package wraps two upstream artifacts from the [ark-bitcoin](https://gitlab.com/ark-bitcoin) project, both pinned in `bark.Dockerfile`:

- **`bark-web`** — the frontend GUI and its API proxy, built from a git tag (`BARK_WEB_VERSION`).
- **`barkd`** — the wallet daemon, fetched as a release binary with a pinned SHA-256 (`BARK_VERSION`).

The two are versioned independently. Keep `BARK_VERSION` aligned with the daemon release that the `bark-web` tag pins in `.env.mainnet`, `docker/checksums.env`, and `start9-app/Dockerfile`. The bundled `@secondts/barkd` JS client can be a patch ahead of that binary — client 0.7.2 is generated from daemon 0.7.1's spec — so the client version alone does not select the daemon artifact.

The client is generated from the daemon's OpenAPI spec. Only move the daemon ahead of bark-web's own pin when `bark-rest/openapi.json` is unchanged between the two daemon tags apart from its `version` string:

```sh
curl -s 'https://gitlab.com/api/v4/projects/ark-bitcoin%2Fbark/repository/compare?from=bark-<old>&to=bark-<new>' \
  | jq -r '.diffs[] | select(.new_path=="bark-rest/openapi.json") | .diff'
```

## Determining the upstream versions

- **bark-web** ([ark-bitcoin/bark-web](https://gitlab.com/ark-bitcoin/bark-web)) — latest git tag:

  ```sh
  git ls-remote --tags https://gitlab.com/ark-bitcoin/bark-web.git | tail
  ```

  Confirm the paired daemon release in that tag's `.env.mainnet`, `docker/checksums.env`, and `start9-app/Dockerfile`. Also record the bundled client version from `package-lock.json` under `node_modules/@secondts/barkd`; a patch difference is expected when upstream pins one.

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
