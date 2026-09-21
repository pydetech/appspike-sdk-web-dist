# AppSpike SDK for Web

**The free Firebase Remote Config alternative.**

> **Firebase Remote Config is going paid.** Google's usage-based pricing took effect on
> September 1, 2026. Existing free-plan (Spark) projects hit enforcement on
> **December 1, 2026**: past 100K daily fetches they get a 30-day grace period and are
> then throttled. Existing Blaze projects are billed automatically from
> **February 1, 2027**. The dates come from
> [Firebase's own pricing schedule](https://firebase.google.com/docs/remote-config/pricing).
> The [migration schedule below](#when-to-migrate) fits inside that window.


TypeScript web SDK for [AppSpike Remote Config](https://appspike.dev/remote-config).
**Free** remote configuration, feature flags, and staged rollouts, with every condition
evaluated **locally in the browser**. AppSpike Remote Config is also a drop-in replacement
for Firebase Remote Config (`firebase/remote-config`), behind the same modular API: no
fetch limits, no usage fees, no per-platform surprises.

[Product](https://appspike.dev/remote-config) · [Docs](https://appspike.dev/docs/remote-config)

> **Native apps:** use the [iOS SDK](https://github.com/pydetech/appspike-sdk-ios-dist) for
> Swift/SwiftUI apps or the [Kotlin Multiplatform SDK](https://github.com/pydetech/appspike-sdk-kmp-dist)
> for KMP/Android projects. Every SDK evaluates the same template format, so a config
> behaves the same on every platform.

## Installation

```bash
npm install github:pydetech/appspike-sdk-web-dist#1.4.5
```

This installs the package as `@appspike/web`. Works with npm, pnpm, yarn, and any bundler
(Vite, webpack, Next.js, …). ES modules and CommonJS are both shipped, with full TypeScript
declarations.

## Quick Start

**1. Register your app.** Create your app at [console.appspike.dev](https://console.appspike.dev)
and copy its `pk_live_…` API key.

**2. Initialize** with your API key from the AppSpike console.

```ts
import { initializeApp } from '@appspike/web/app';
import {
  fetchAndActivate,
  getBoolean,
  getRemoteConfig,
  getString,
} from '@appspike/web/remote-config';

const app = initializeApp({ apiKey: 'YOUR_API_KEY' });
```

**3. Get the Remote Config instance**

```ts
const remoteConfig = getRemoteConfig(app);
```

**4. Configure.** This step is optional. The defaults are a 12h interval and a 60s timeout.

```ts
remoteConfig.settings.minimumFetchIntervalMillis = 3_600_000;
```

**5. Set in-app defaults.** These are served until a fetch activates, and for missing keys.

```ts
remoteConfig.defaultConfig = {
  welcome_message: 'Hello',
  new_checkout_enabled: false,
  items_per_page: 20,
};
```

**6. Fetch and activate.** A failed fetch is an ordinary outcome (offline, or a
backoff window), so catch it. Your defaults stay in place either way.

```ts
try {
  await fetchAndActivate(remoteConfig);
} catch (e) {
  console.warn('Fetch skipped:', e);
}
```

**7. Read values.** Typed accessors, with in-app defaults as the fallback.

```ts
const message = getString(remoteConfig, 'welcome_message');
const checkoutEnabled = getBoolean(remoteConfig, 'new_checkout_enabled');
```

**8. Custom signals for targeting.** Evaluated on-device.

```ts
import { fetchConfig, activate, setCustomSignals } from '@appspike/web/remote-config';

await setCustomSignals(remoteConfig, { plan: 'premium', cart_items: 3 });
await fetchConfig(remoteConfig, 0); // 0 bypasses the fetch interval so the signal applies now
await activate(remoteConfig);
```

## Why AppSpike Remote Config?

- **A free, direct replacement for Firebase Remote Config.** Same fetch/activate
  lifecycle and typed accessors, with no fetch metering. Firebase Remote Config
  bills $0.06 per 10K fetches past 100K/day. AppSpike Remote Config is free at any
  scale.
- **Targeting data stays on the device.** Conditions (country, language, custom signals,
  percent rollouts, date windows) are evaluated locally. Custom signals are never
  transmitted anywhere.
- **Battle tested.** It already serves millions of users in PokeRaid and PokeTrade.

## Migrating from Firebase Remote Config

### Feature comparison

| Capability | Firebase Remote Config (Web) | AppSpike Remote Config (Web) |
| --- | --- | --- |
| `fetchConfig` / `activate` / `fetchAndActivate` | ✅ | ✅ |
| `getValue` / `getAll` / `getString` / `getBoolean` / `getNumber` | ✅ | ✅ |
| `defaultConfig` in-app defaults | ✅ | ✅ |
| `settings` (fetch interval / timeout) | ✅ | ✅ |
| `ensureInitialized` / `isSupported` / `setLogLevel` | ✅ | ✅ |
| Custom signals (`setCustomSignals`) | ✅ | ✅ (evaluated locally, never sent) |
| Percentage rollouts | ✅ | ✅ |
| Condition targeting (country, language, version, date…) | ✅ | ✅ |
| Typed-getter fall-through to in-app defaults | ❌ (Android only) | ✅ |
| `getKeysByPrefix` | ❌ (Android/iOS only) | ✅ |
| Config-update listeners | ❌ | ✅ |
| Client-side fetch backoff | ❌ | ✅ |
| Price at scale | 100K fetches/day free, then $0.06 per 10K | Free, no fetch metering |
| Config import | ❌ No import path from other providers | ✅ One-click import from Firebase |
| Version history & rollback | ✅ | ✅ |
| Real-time config updates | ✅ Real-time Remote Config | ✅ (push setup required) |
| A/B testing | ✅ Firebase A/B Testing | ✅ Via percentage conditions |
| Analytics audience targeting | ✅ Google Analytics audiences | ❌ Use custom signals instead |

### When to migrate

The two SDKs run side by side in the same app, so nothing forces a single cutover day. Two dates bound the plan: existing Spark projects face throttling enforcement from December 1, 2026, and existing Blaze projects are billed from February 1, 2027.

1. **Today.** Register your app at [console.appspike.dev](https://console.appspike.dev), import your Firebase Remote Config template, and publish. Nothing in your app changes yet.
2. **Next development cycle.** Make the code changes below in a branch. Debug builds can run both SDKs together and compare values.
3. **Before the cutover release.** Finish any in-flight percentage rollouts and experiments on Firebase Remote Config. Rollout groups are re-randomized on AppSpike, so a mid-rollout user can change groups. If your template changed since step 1, import it again.
4. **The cutover release.** Ship the swap as a normal app release. Keep your in-app defaults registered. They cover every device that has not fetched yet.
5. **After the rollout.** Once the release has reached most of your fleet, delete the remaining `firebase/remote-config` imports.

### Step-by-step

**1. Move your config template.** In the [AppSpike console](https://console.appspike.dev), register your app, import your Firebase Remote Config template (Firebase export upload is supported), review it, and publish. Your parameters and conditions exist on the AppSpike side before the app code changes.

**2. Replace the dependency**

```sh
npm install github:pydetech/appspike-sdk-web-dist#1.4.5
```

Stop importing `firebase/remote-config`.

**3. Update the Remote Config imports.** The function names are identical, so only the module specifier changes.

```ts
// Before
import {
  activate,
  fetchAndActivate,
  fetchConfig,
  getAll,
  getBoolean,
  getNumber,
  getRemoteConfig,
  getString,
  getValue,
  setCustomSignals,
} from 'firebase/remote-config';

// After
import {
  activate,
  fetchAndActivate,
  fetchConfig,
  getAll,
  getBoolean,
  getNumber,
  getRemoteConfig,
  getString,
  getValue,
  setCustomSignals,
} from '@appspike/web/remote-config';
```

**4. Add AppSpike initialization.** One call at startup, one API key.

```ts
import { initializeApp as initializeAppSpike } from '@appspike/web/app';

const appSpikeApp = initializeAppSpike({ apiKey: 'YOUR_APPSPIKE_API_KEY' });
```

**5. Get the Remote Config instance.** Same function name, and it takes the AppSpike app.
Called with no argument it uses the default AppSpike app.

```ts
// Before
const remoteConfig = getRemoteConfig(firebaseApp);

// After
const remoteConfig = getRemoteConfig(appSpikeApp);   // or getRemoteConfig()
```

**6. Defaults (unchanged)**

```ts
// Before and after — the same
remoteConfig.defaultConfig = {
  welcome_message: 'Hello',
  new_checkout_enabled: false,
  items_per_page: 20,
};
```

**7. Settings (unchanged)**

```ts
// Before and after — the same
remoteConfig.settings.minimumFetchIntervalMillis = 3_600_000;
remoteConfig.settings.fetchTimeoutMillis = 60_000;
```

**8. Fetch / activate (unchanged)**

```ts
// Before and after — the same
try {
  await fetchAndActivate(remoteConfig);
} catch (e) {
  // A failed fetch is an ordinary outcome — offline, or a backoff window.
  // Your defaults (or the last activated config) stay in place.
  console.warn('Fetch skipped:', e);
}
```

Keep whatever `try`/`catch` you had around the Firebase call. `fetchConfig` and `activate`
are also unchanged. AppSpike's `fetchConfig` adds an optional second argument, an interval
override in seconds.

**9. Read values (unchanged)**

```ts
// Before and after — the same
const message = getString(remoteConfig, 'welcome_message');
const enabled = getBoolean(remoteConfig, 'new_checkout_enabled');
const count = getNumber(remoteConfig, 'items_per_page');
const value = getValue(remoteConfig, 'welcome_message');
const all = getAll(remoteConfig);
```

`getBoolean` and `getNumber` additionally fall through to your in-app default when the
remote value doesn't convert. Firebase Web returns the static zero value there.

**10. Custom signals (unchanged)**

```ts
// Before and after — the same
await setCustomSignals(remoteConfig, { plan: 'premium', cart_items: 3 });
```

Signals are evaluated on-device and never transmitted, so they take effect at the next
fetch + activate. To apply one immediately, bypass the fetch interval:

```ts
await fetchConfig(remoteConfig, 0);
await activate(remoteConfig);
```

### API mapping reference

| Firebase (`firebase/remote-config`) | AppSpike (`@appspike/web/remote-config`) | Notes |
| --- | --- | --- |
| `getRemoteConfig(app)` | `getRemoteConfig(app)` | Same |
| `fetchConfig(rc)` | `fetchConfig(rc)` | Optional interval-override second argument added |
| `activate(rc)` | `activate(rc)` | Same |
| `fetchAndActivate(rc)` | `fetchAndActivate(rc)` | Same |
| `ensureInitialized(rc)` | `ensureInitialized(rc)` | Same |
| `getValue` / `getAll` / `getString` / `getBoolean` / `getNumber` | identical | `getBoolean`/`getNumber` also fall through to defaults when the remote value doesn't convert |
| `setCustomSignals(rc, signals)` | `setCustomSignals(rc, signals)` | Signals never leave the device |
| `isSupported()` / `setLogLevel(rc, level)` | identical | |
| `rc.settings` / `rc.defaultConfig` / `rc.fetchTimeMillis` / `rc.lastFetchStatus` | identical | |

### AI-Assisted Migration

<details>
<summary>Migration prompt</summary>

Copy this prompt into Claude, Cursor, or Copilot along with your codebase:

```
Migrate this codebase from Firebase Remote Config (Web) to AppSpike Remote Config.

Rules:
1. Add `import { initializeApp as initializeAppSpike } from '@appspike/web/app'` and call
   `initializeAppSpike({ apiKey: 'YOUR_APPSPIKE_API_KEY' })` at startup. Do not modify any
   existing `firebase/app` initialization.
2. Replace all imports from 'firebase/remote-config' with '@appspike/web/remote-config'.
   Function and type names are identical: getRemoteConfig, fetchConfig, activate,
   fetchAndActivate, ensureInitialized, getValue, getAll, getString, getBoolean,
   getNumber, setCustomSignals, isSupported, setLogLevel, and the types RemoteConfig,
   RemoteConfigSettings, Value, ValueSource, FetchStatus, CustomSignals.
3. Leave rc.settings, rc.defaultConfig, and all getter call sites unchanged.
4. Remove firebase-only concepts if present: getApps/deleteApp multi-app handling
   (AppSpike has a single default app), and any Analytics/A-B testing wiring
   (not supported).
6. Do not rename any AppSpike symbols — the API deliberately matches Firebase naming.
7. If the code reads value.asLong(), replace with Math.trunc(getNumber(...)).
8. Ensure `npm install github:pydetech/appspike-sdk-web-dist#1.4.5` is added.
9. Report every call site you changed and any Firebase feature you could not map.
```

</details>

## Modules

| Entry | Contents |
| --- | --- |
| `@appspike/web/app` | `initializeApp`, `getApp` (the session and identity layer) |
| `@appspike/web/remote-config` | The full Remote Config API |
| `@appspike/web` | Root entry re-exporting both |

## Requirements

- Evergreen browser (ES2020, `fetch`, `localStorage`)
- Any bundler, or `<script type="module">` with an import map
- TypeScript optional, with full `.d.ts` declarations included

## Sample App

Set your API key in `SampleApp/src/apiKey.ts` (the `API_KEY` constant), then:

```bash
cd SampleApp
npm install
npm run dev
```

Or, without a local Node install, run it in Docker (optional):

```bash
cd SampleApp
docker compose up          # builds and serves http://localhost:4173
```

Then open http://localhost:4173 and press **Initialize** (with `SampleApp/src/apiKey.ts`
already holding your key, since the Docker image bakes it in at build time).

## License

Copyright (c) 2026 Pyde Technologies LTD. All rights reserved.

The AppSpike SDK is proprietary software, free to use with AppSpike services. Redistribution, modification, and reverse engineering are not permitted. See [LICENSE](LICENSE) for the full terms, or contact info@pyde.tech.
