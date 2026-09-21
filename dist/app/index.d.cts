import { A as AppSpikeApp, a as AppSpikeOptions } from '../types-V6KV62Tp.cjs';
export { R as RemoteConfigUrlResolution, S as SessionDeviceContext } from '../types-V6KV62Tp.cjs';
declare function initializeApp(options: AppSpikeOptions): AppSpikeApp;
declare function getApp(): AppSpikeApp;
declare function _resetAppsForTesting(): void;
export { AppSpikeApp, AppSpikeOptions, _resetAppsForTesting, getApp, initializeApp };
