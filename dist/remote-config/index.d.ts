import { A as AppSpikeApp } from '../types-V6KV62Tp.js';
type ValueSource = 'static' | 'default' | 'remote';
type FetchStatus = 'no-fetch-yet' | 'success' | 'failure' | 'throttle';
type RemoteConfigLogLevel = 'debug' | 'error' | 'silent';
type LogLevel = RemoteConfigLogLevel;
interface RemoteConfigSettings {
    minimumFetchIntervalMillis: number;
    fetchTimeoutMillis: number;
}
interface Value {
    asBoolean(): boolean;
    asNumber(): number;
    asString(): string;
    getSource(): ValueSource;
}
interface CustomSignals {
    [key: string]: string | number | null;
}
interface DefaultConfig {
    [key: string]: string | number | boolean;
}
interface RemoteConfig {
    readonly app: AppSpikeApp;
    settings: RemoteConfigSettings;
    defaultConfig: DefaultConfig;
    readonly fetchTimeMillis: number;
    readonly lastFetchStatus: FetchStatus;
}
interface ConfigUpdate {
    getUpdatedKeys(): Set<string>;
}
interface ConfigUpdateObserver {
    next: (configUpdate: ConfigUpdate) => void;
    error: (error: Error) => void;
    complete: () => void;
}
type Unsubscribe = () => void;
type ConfigUpdateListener = (updatedKeys: Set<string>) => void;
interface ConfigUpdateListenerRegistration {
    remove(): void;
}
declare function getRemoteConfig(app?: AppSpikeApp): RemoteConfig;
declare function fetchConfig(remoteConfig: RemoteConfig, minimumFetchIntervalSeconds?: number): Promise<void>;
declare function activate(remoteConfig: RemoteConfig): Promise<boolean>;
declare function fetchAndActivate(remoteConfig: RemoteConfig): Promise<boolean>;
declare function ensureInitialized(remoteConfig: RemoteConfig): Promise<void>;
declare function getValue(remoteConfig: RemoteConfig, key: string): Value;
declare function getAll(remoteConfig: RemoteConfig): Record<string, Value>;
declare function getString(remoteConfig: RemoteConfig, key: string): string;
declare function getBoolean(remoteConfig: RemoteConfig, key: string): boolean;
declare function getNumber(remoteConfig: RemoteConfig, key: string): number;
declare function getKeysByPrefix(remoteConfig: RemoteConfig, prefix?: string): Set<string>;
declare function setCustomSignals(remoteConfig: RemoteConfig, customSignals: CustomSignals): Promise<void>;
declare function setLogLevel(remoteConfig: RemoteConfig, logLevel: RemoteConfigLogLevel): void;
declare function isSupported(): Promise<boolean>;
declare function onConfigUpdate(remoteConfig: RemoteConfig, observer: ConfigUpdateObserver): Unsubscribe;
declare function addOnConfigUpdateListener(remoteConfig: RemoteConfig, listener: ConfigUpdateListener): ConfigUpdateListenerRegistration;
declare function reset(remoteConfig: RemoteConfig): void;
declare class RemoteConfigFetchError extends Error {
    readonly cause?: unknown;
    constructor(message: string, cause?: unknown);
}
declare class RemoteConfigThrottledError extends RemoteConfigFetchError {
    readonly throttleEndTimeMillis: number;
    constructor(message: string, 
    throttleEndTimeMillis: number);
}
declare class RemoteConfigHttpError extends RemoteConfigFetchError {
    readonly statusCode: number;
    readonly retryAfterSeconds: number | null;
    constructor(statusCode: number, retryAfterSeconds: number | null, message: string);
}
export { type ConfigUpdate, type ConfigUpdateListener, type ConfigUpdateListenerRegistration, type ConfigUpdateObserver, type CustomSignals, type DefaultConfig, type FetchStatus, type LogLevel, type RemoteConfig, RemoteConfigFetchError, RemoteConfigHttpError, type RemoteConfigLogLevel, type RemoteConfigSettings, RemoteConfigThrottledError, type Unsubscribe, type Value, type ValueSource, activate, addOnConfigUpdateListener, ensureInitialized, fetchAndActivate, fetchConfig, getAll, getBoolean, getKeysByPrefix, getNumber, getRemoteConfig, getString, getValue, isSupported, onConfigUpdate, reset, setCustomSignals, setLogLevel };
