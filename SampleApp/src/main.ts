import { getApp, initializeApp } from '@appspike/web/app';
import {
  activate,
  ensureInitialized,
  fetchAndActivate,
  fetchConfig,
  getAll,
  getBoolean,
  getKeysByPrefix,
  getNumber,
  getRemoteConfig,
  getString,
  getValue,
  isSupported,
  reset,
  setCustomSignals,
  setLogLevel,
  RemoteConfigThrottledError,
  type RemoteConfig,
  type RemoteConfigLogLevel,
} from '@appspike/web/remote-config';
import { API_KEY, API_KEY_IS_PLACEHOLDER } from './apiKey';

// In-app defaults (Firebase's `defaultConfig`): served until a fetched template is
// activated, and as fallback for keys the template does not define. All three value types
// are accepted; before the first activation the All Key/Values view shows each of these
// with source (default).
const sampleDefaults = {
  welcome_message: 'Hello from defaults', // string
  feature_enabled: false, // boolean
  max_retries: 3, // number
  price_multiplier: 1.0, // number
};

// The SDK's own settings defaults, restored by "Restore Defaults".
const defaultMinimumFetchIntervalMillis = 43_200_000; // twelve hours
const defaultFetchTimeoutMillis = 60_000;

const element = <T extends HTMLElement>(id: string): T => {
  const found = document.getElementById(id);
  if (found === null) {
    throw new Error(`Missing element #${id}`);
  }
  return found as T;
};

const sdkStatus = element<HTMLParagraphElement>('sdk-status');
const setupResult = element<HTMLOutputElement>('setup-result');
const settingsResult = element<HTMLOutputElement>('settings-result');
const signalResult = element<HTMLOutputElement>('signal-result');
const fetchResult = element<HTMLOutputElement>('fetch-result');
const readResult = element<HTMLOutputElement>('read-result');
const toolsResult = element<HTMLOutputElement>('tools-result');

let remoteConfig: RemoteConfig | null = null;

function requireRemoteConfig(): RemoteConfig {
  if (remoteConfig === null) {
    throw new Error('Initialize the SDK first');
  }
  return remoteConfig;
}

function describeState(rc: RemoteConfig): string {
  const fetchTime =
    rc.fetchTimeMillis === -1 ? 'never' : new Date(rc.fetchTimeMillis).toLocaleString();
  return `lastFetchStatus=${rc.lastFetchStatus} · lastFetch=${fetchTime}`;
}

// The header line reflects live fetch state; every state-changing action re-renders it.
function refreshSdkStatus(rc: RemoteConfig): void {
  sdkStatus.textContent = `Ready (app "${getApp().name}") · ${describeState(rc)}`;
}

function describeError(error: unknown): string {
  if (error instanceof RemoteConfigThrottledError) {
    const until =
      error.throttleEndTimeMillis === null
        ? 'unknown'
        : new Date(error.throttleEndTimeMillis).toLocaleTimeString();
    return `Throttled — next attempt allowed at ${until}. Use "Bypass Cache & Activate" to skip the interval.`;
  }
  return String(error);
}

// Environment support check — resolves before anything else is worth doing.
isSupported().then((supported) => {
  if (!supported) {
    sdkStatus.textContent = 'This environment lacks fetch/TextEncoder/localStorage support.';
  }
});

// --- All Key/Values view ---------------------------------------------------

const valuesBody = element<HTMLTableSectionElement>('values-body');
const valuesEmpty = element<HTMLOutputElement>('values-empty');
const valuesFilter = element<HTMLInputElement>('values-filter');

function renderAllValues(): void {
  valuesBody.replaceChildren();
  if (remoteConfig === null) {
    valuesEmpty.textContent = 'Initialize the SDK first.';
    return;
  }
  // getKeysByPrefix('') returns every key (activated remote + defaults), so one code
  // path serves both the unfiltered list and the prefix filter.
  const matching = new Set(getKeysByPrefix(remoteConfig, valuesFilter.value.trim()));
  const entries = Object.entries(getAll(remoteConfig)).filter(([key]) => matching.has(key));
  valuesEmpty.textContent = entries.length === 0 ? '(no values)' : '';
  for (const [key, value] of entries) {
    const row = document.createElement('tr');
    const keyCell = document.createElement('td');
    keyCell.textContent = key;
    const valueCell = document.createElement('td');
    valueCell.className = 'value';
    valueCell.textContent = value.asString();
    const sourceCell = document.createElement('td');
    sourceCell.className = 'source';
    sourceCell.textContent = `(${value.getSource()})`;
    row.append(keyCell, valueCell, sourceCell);
    valuesBody.append(row);
  }
}

valuesFilter.addEventListener('input', renderAllValues);

// --- Hash navigation between the two views ---------------------------------

function showView(): void {
  const onValues = window.location.hash === '#values';
  element<HTMLElement>('view-controls').hidden = onValues;
  element<HTMLElement>('view-values').hidden = !onValues;
  element<HTMLAnchorElement>('tab-controls').setAttribute(
    'aria-current',
    onValues ? 'false' : 'page',
  );
  element<HTMLAnchorElement>('tab-values').setAttribute(
    'aria-current',
    onValues ? 'page' : 'false',
  );
  if (onValues) {
    renderAllValues();
  }
}

window.addEventListener('hashchange', showView);
showView();

// --- Setup -----------------------------------------------------------------

const placeholderKeyMessage =
  'Set your API key in SampleApp/src/apiKey.ts — the sample will not initialize while it ' +
  'still reads YOUR_API_KEY.';

if (API_KEY_IS_PLACEHOLDER) {
  sdkStatus.textContent = placeholderKeyMessage;
}

element<HTMLButtonElement>('initialize').addEventListener('click', () => {
  if (API_KEY_IS_PLACEHOLDER) {
    sdkStatus.textContent = placeholderKeyMessage;
    return;
  }
  const appVersion = element<HTMLInputElement>('app-version').value.trim();
  const appBuild = element<HTMLInputElement>('app-build').value.trim();
  try {
    const app = initializeApp({
      apiKey: API_KEY,
      ...(appVersion === '' ? {} : { appVersion }),
      ...(appBuild === '' ? {} : { appBuild }),
    });
    remoteConfig = getRemoteConfig(app);
  } catch (error) {
    sdkStatus.textContent = `Initialize failed: ${describeError(error)}`;
    return;
  }
  remoteConfig.defaultConfig = { ...sampleDefaults };

  sdkStatus.textContent = 'Initializing session…';
  ensureInitialized(remoteConfig)
    .then(() => {
      const rc = requireRemoteConfig();
      refreshSdkStatus(rc);
      element<HTMLInputElement>('min-interval').value = String(
        rc.settings.minimumFetchIntervalMillis,
      );
      element<HTMLInputElement>('fetch-timeout').value = String(rc.settings.fetchTimeoutMillis);
      showCurrentSettings(rc);
    })
    .catch((error: unknown) => {
      sdkStatus.textContent = `Session failed: ${describeError(error)}`;
    });
});

element<HTMLButtonElement>('device-context').addEventListener('click', () => {
  try {
    requireRemoteConfig();
    setupResult.textContent = JSON.stringify(getApp().deviceContext(), null, 2);
  } catch (error) {
    setupResult.textContent = describeError(error);
  }
});

// --- Settings --------------------------------------------------------------

const settingsCurrent = element<HTMLSpanElement>('settings-current');

function showCurrentSettings(rc: RemoteConfig): void {
  settingsCurrent.textContent =
    `minimumFetchIntervalMillis=${rc.settings.minimumFetchIntervalMillis} · ` +
    `fetchTimeoutMillis=${rc.settings.fetchTimeoutMillis}`;
}

element<HTMLButtonElement>('apply-settings').addEventListener('click', () => {
  try {
    const rc = requireRemoteConfig();
    const minInterval = Number(element<HTMLInputElement>('min-interval').value);
    const fetchTimeout = Number(element<HTMLInputElement>('fetch-timeout').value);
    if (Number.isFinite(minInterval)) {
      rc.settings.minimumFetchIntervalMillis = minInterval;
    }
    if (Number.isFinite(fetchTimeout)) {
      rc.settings.fetchTimeoutMillis = fetchTimeout;
    }
    const logLevel = element<HTMLSelectElement>('log-level').value as RemoteConfigLogLevel;
    setLogLevel(rc, logLevel);
    showCurrentSettings(rc);
    settingsResult.textContent = `Applied · logLevel=${logLevel}`;
  } catch (error) {
    settingsResult.textContent = describeError(error);
  }
});

element<HTMLButtonElement>('restore-settings').addEventListener('click', () => {
  try {
    const rc = requireRemoteConfig();
    rc.settings.minimumFetchIntervalMillis = defaultMinimumFetchIntervalMillis;
    rc.settings.fetchTimeoutMillis = defaultFetchTimeoutMillis;
    element<HTMLInputElement>('min-interval').value = String(defaultMinimumFetchIntervalMillis);
    element<HTMLInputElement>('fetch-timeout').value = String(defaultFetchTimeoutMillis);
    showCurrentSettings(rc);
    settingsResult.textContent = 'Restored the SDK default settings.';
  } catch (error) {
    settingsResult.textContent = describeError(error);
  }
});

// --- Custom signals --------------------------------------------------------

// Signals only take effect on the next non-throttled fetch, so applying or removing one
// bypasses the cache and activates — the All Key/Values view is then already up to date.
async function refetchWithSignals(rc: RemoteConfig, message: string): Promise<void> {
  await fetchConfig(rc, 0);
  const changed = await activate(rc);
  signalResult.textContent = `${message} Re-fetched and activated (changed=${changed}).`;
  refreshSdkStatus(rc);
  renderAllValues();
}

element<HTMLButtonElement>('set-signal').addEventListener('click', async () => {
  try {
    const rc = requireRemoteConfig();
    const key = element<HTMLInputElement>('signal-key').value.trim();
    const raw = element<HTMLInputElement>('signal-value').value.trim();
    if (key === '') {
      signalResult.textContent = 'Enter a signal key.';
      return;
    }
    // Numeric strings become number signals; anything else stays a string.
    const value = raw !== '' && Number.isFinite(Number(raw)) ? Number(raw) : raw;
    await setCustomSignals(rc, { [key]: value });
    await refetchWithSignals(rc, `Signal ${key}=${JSON.stringify(value)} applied.`);
  } catch (error) {
    signalResult.textContent = describeError(error);
  }
});

element<HTMLButtonElement>('remove-signal').addEventListener('click', async () => {
  try {
    const rc = requireRemoteConfig();
    const key = element<HTMLInputElement>('signal-key').value.trim();
    if (key === '') {
      signalResult.textContent = 'Enter a signal key.';
      return;
    }
    await setCustomSignals(rc, { [key]: null }); // null removes the key
    await refetchWithSignals(rc, `Signal ${key} removed.`);
  } catch (error) {
    signalResult.textContent = describeError(error);
  }
});

// A convenience preset in addition to the free-form entry above, not instead of it.
element<HTMLButtonElement>('preset-signal').addEventListener('click', async () => {
  try {
    const rc = requireRemoteConfig();
    element<HTMLInputElement>('signal-key').value = 'tier';
    element<HTMLInputElement>('signal-value').value = 'gold';
    await setCustomSignals(rc, { tier: 'gold', session_count: 12 });
    await refetchWithSignals(rc, 'Preset tier=gold, session_count=12 applied.');
  } catch (error) {
    signalResult.textContent = describeError(error);
  }
});

// --- Fetch -----------------------------------------------------------------

element<HTMLButtonElement>('fetch').addEventListener('click', async () => {
  try {
    const rc = requireRemoteConfig();
    fetchResult.textContent = 'Fetching…';
    await fetchConfig(rc);
    fetchResult.textContent = `Fetched (not yet activated) · ${describeState(rc)}`;
    refreshSdkStatus(rc);
  } catch (error) {
    fetchResult.textContent = describeError(error);
  }
});

element<HTMLButtonElement>('fetch-activate').addEventListener('click', async () => {
  try {
    const rc = requireRemoteConfig();
    fetchResult.textContent = 'Fetching…';
    const changed = await fetchAndActivate(rc);
    fetchResult.textContent = `Activated (changed=${changed}) · ${describeState(rc)}`;
    refreshSdkStatus(rc);
  } catch (error) {
    fetchResult.textContent = describeError(error);
  }
});

element<HTMLButtonElement>('bypass-activate').addEventListener('click', async () => {
  try {
    const rc = requireRemoteConfig();
    fetchResult.textContent = 'Fetching (cache bypassed)…';
    // The 0 override is the AppSpike extension mirroring fetch(withExpirationDuration: 0)
    // on iOS/Android — it skips the minimum fetch interval, never the failure backoff.
    await fetchConfig(rc, 0);
    const changed = await activate(rc);
    fetchResult.textContent = `Bypassed cache, activated (changed=${changed}) · ${describeState(rc)}`;
    refreshSdkStatus(rc);
  } catch (error) {
    fetchResult.textContent = describeError(error);
  }
});

// --- Read a value ----------------------------------------------------------

element<HTMLButtonElement>('read').addEventListener('click', () => {
  try {
    const rc = requireRemoteConfig();
    const key = element<HTMLInputElement>('key').value.trim();
    const value = getValue(rc, key);
    // The typed getters are NOT `getValue(key).asX()`: an activated value that does not
    // convert falls through to the in-app default (see the API docs), so both forms are
    // shown side by side.
    readResult.textContent = [
      `source: ${value.getSource()}`,
      `getString:  ${JSON.stringify(getString(rc, key))}`,
      `getBoolean: ${getBoolean(rc, key)}   (Value.asBoolean: ${value.asBoolean()})`,
      `getNumber:  ${getNumber(rc, key)}   (Value.asNumber: ${value.asNumber()})`,
    ].join('\n');
  } catch (error) {
    readResult.textContent = describeError(error);
  }
});

// --- Reset -----------------------------------------------------------------

element<HTMLButtonElement>('reset').addEventListener('click', () => {
  try {
    const rc = requireRemoteConfig();
    reset(rc); // clears fetched, activated, and default values
    // …so the sample re-registers its defaults: the All Key/Values view afterwards shows
    // the defaults set with (default) sources and no remote rows.
    rc.defaultConfig = { ...sampleDefaults };
    toolsResult.textContent = `Config reset, defaults re-applied · ${describeState(rc)}`;
    refreshSdkStatus(rc);
    renderAllValues();
  } catch (error) {
    toolsResult.textContent = describeError(error);
  }
});

element<HTMLButtonElement>('refresh-values').addEventListener('click', renderAllValues);
