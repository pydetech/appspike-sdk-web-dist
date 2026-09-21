interface AppSpikeOptions {
    apiKey: string;
    appVersion?: string;
    appBuild?: string;
}
interface SessionDeviceContext {
    appId: string | null;
    platform: string;
    appVersion: string | null;
    appBuild: string | null;
    country: string | null;
    language: string | null;
    deviceId: string | null;
}
interface RemoteConfigUrlResolution {
    remoteConfigUrl: string | null;
    serverTimeIso: string | null;
}
interface AppSpikeApp {
    readonly name: string;
    readonly options: AppSpikeOptions;
    ensureReady(): Promise<void>;
    resolveRemoteConfigUrl(): Promise<RemoteConfigUrlResolution>;
    deviceContext(): SessionDeviceContext;
}
export type { AppSpikeApp as A, RemoteConfigUrlResolution as R, SessionDeviceContext as S, AppSpikeOptions as a };
