# LikasLens Android App — Ownership & Signing Report

**Last updated:** September 3, 2026 (demo-day prep)

---

## 1. App identity

| Field | Value |
|---|---|
| Package name | `dev.syntaxure.likaslensapp.twa` |
| App label | LikasLens |
| Signer subject | `C=US, O=LikasLens, OU=Engineering, CN=LikasLens Admin` |
| Build type | PWABuilder Trusted Web Activity (TWA) wrapping `https://likaslensapp.syntaxure.dev` |
| APK version | versionCode `1`, versionName `1.0.0.0`, targetSdk 36, compileSdk 36 |
| APK size | 2,199,565 bytes (md5 `8320e3eb4633aab2f843b0327328c70b`) |
| AAB size | 2,323,457 bytes (md5 `8ada20301286c69c69526522a413d386`) |

## 2. Official signing key (KEEP THIS SAFE)

The **58:5A** key below is now the app's official signing identity (APK, AAB, and
assetlinks.json all match it). The zip `lou_context/LikasLens - Google Play package.zip`
is the only source of this keystore — **back it up**.

| Field | Value |
|---|---|
| Keystore file | `mobile/android/signing.keystore` (also inside the zip) |
| Keystore password | `gv23YfubsQzF` |
| Key alias | `my-key-alias` |
| Key password | `gv23YfubsQzF` |
| Cert SHA-256 fingerprint | `58:5A:81:2F:B1:1E:7A:84:64:E4:5A:C6:F6:D6:3E:36:84:A0:88:8B:BA:DF:40:7A:61:6C:FB:A6:EE:37:6C:1D` |
| Key-info file | `mobile/android/signing-key-info.txt` |

> **Retired key:** an earlier build (Sep 2) was signed with cert `FB:32:B3:72:…`
> (keystore password `bmTd18B6G32U`). That key is **no longer used** — the app was never
> published with it (Google Play page 404s), so there is no update-chain conflict.
> Anyone with the old APK installed must uninstall before installing the new one.

## 3. Where the identity is declared (all updated to 58:5A)

| File | Purpose |
|---|---|
| `apps/frontend/public/.well-known/assetlinks.json` | Served at `/.well-known/assetlinks.json` on the site — **this is what Android verifies** |
| `apps/mobile-pwa/src/app/.well-known/assetlinks.json/route.ts` | PWA app copy of the same file |
| `mobile/android/assetlinks.json` | Artifact copy in the mobile folder |

## 4. Distribution artifacts

| File | Where it lives | What it's for |
|---|---|---|
| `LikasLens.apk` | `mobile/android/LikasLens.apk` + `apps/frontend/public/downloads/likaslens.apk` | Direct download button on the website (`/downloads/likaslens.apk`) — **was 404 on production; fixed by the next deploy** |
| `LikasLens.aab` | `mobile/android/LikasLens.aab` | Upload artifact for Google Play (App Bundle) |
| `signing.keystore` | `mobile/android/signing.keystore` | The only key that can sign future updates |

## 5. Google Play status

- **NOT published** — `play.google.com/store/apps/details?id=dev.syntaxure.likaslensapp.twa` returns 404.
- First submission should upload `LikasLens.aab` (signed with the 58:5A key) and set up
  Play App Signing. Keep `signing-key-info.txt` + keystore somewhere safe (password manager).

## 6. Production status

- `https://likaslensapp.syntaxure.dev` — **up** (root + `/en/onboarding` return 200).
- `/.well-known/assetlinks.json` — served correctly (was FB:32; must be re-deployed to flip to 58:5A).
- `/downloads/likaslens.apk` — **404 before this change** (the file was missing from the deployed build); fixed once the updated repo is pushed/deployed.

## 7. Security notes ⚠️

- `mobile/android/signing.keystore` and `signing-key-info.txt` (plaintext password) are
  **committed to git**. Acceptable for the demo, but before publishing to Google Play:
  (a) make the repository private, or (b) rotate the key.
- The zip in `lou_context/` is untracked (good) — keep it as the offline backup.

## 8. Rebuild workflow (future updates)

1. Push the latest `apps/mobile-pwa` to production (the APK loads the live URL — app fixes ship with the web deploy, not the APK).
2. To refresh the wrapper itself: PWABuilder → Package for stores → upload **`mobile/android/signing.keystore`** (pw `gv23YfubsQzF`, alias `my-key-alias`) so the new build keeps the same signature, and **bump versionCode** (current: 1).
3. Replace the APK in `apps/frontend/public/downloads/` + `mobile/android/`, keep assetlinks untouched.
4. Upload the new `.aab` to Play Console when ready.