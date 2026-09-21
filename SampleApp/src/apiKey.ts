/**
 * The one place this sample keeps its API key.
 *
 * Replace the placeholder with the `pk_live_…` key of your app from
 * https://console.appspike.dev. Real apps pass the key at build time — this sample does
 * the same, which is why there is no key field in the UI. While the placeholder is
 * unchanged the sample refuses to initialize and says so on screen.
 */
// Typed `string` rather than the inferred literal so that replacing the placeholder does
// not make the check below a comparison between non-overlapping literal types.
export const API_KEY: string = 'YOUR_API_KEY';

/** True while the placeholder above has not been replaced. */
export const API_KEY_IS_PLACEHOLDER = API_KEY === 'YOUR_API_KEY';
