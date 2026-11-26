// hardal-ready.ts
// The Hardal tracker has no pre-load queue: a call made before tracker.js has run is lost.
// This helper buffers calls until window.hrd is ready, then runs them in order.
// Copy it into the project (for example src/lib/hardal.ts). It uses only the documented
// browser API: track, pageview, identify, consent, consentStatus.

type HardalResult = Promise<unknown>;

export interface Hardal {
  track(eventName: string, data?: Record<string, unknown>): HardalResult;
  pageview(url?: string, data?: Record<string, unknown>): HardalResult;
  identify(userId: string | Record<string, unknown>, traits?: Record<string, unknown>): HardalResult;
  consent(state: "granted" | "denied"): HardalResult;
  consentStatus(): { success: boolean; data: { consent: "unknown" | "granted" | "denied" } };
}

declare global {
  interface Window {
    hrd?: Partial<Hardal>;
  }
}

const pending: Array<(hrd: Hardal) => void> = [];
let polling = false;

function ready(): Hardal | null {
  if (typeof window === "undefined") return null; // server-side render: do nothing
  const h = window.hrd;
  return h && typeof h.track === "function" && typeof h.consent === "function" ? (h as Hardal) : null;
}

function flush() {
  const h = ready();
  if (!h) return false;
  while (pending.length) {
    try {
      pending.shift()!(h);
    } catch (err) {
      console.warn("Hardal call failed", err);
    }
  }
  return true;
}

/** Run fn as soon as the Hardal tracker is available. Gives up after timeoutMs. */
export function whenHardalReady(fn: (hrd: Hardal) => void, timeoutMs = 15000): void {
  if (typeof window === "undefined") return;
  pending.push(fn);
  if (flush() || polling) return;
  polling = true;
  const started = Date.now();
  const timer = window.setInterval(() => {
    if (flush() || Date.now() - started > timeoutMs) {
      window.clearInterval(timer);
      polling = false;
      if (pending.length) {
        console.warn(`Hardal tracker not ready after ${timeoutMs} ms; ${pending.length} call(s) dropped`);
        pending.length = 0;
      }
    }
  }, 100);
}

/** Convenience wrapper: track an event once the tracker is ready. */
export function hardalTrack(eventName: string, data?: Record<string, unknown>): void {
  whenHardalReady((hrd) => {
    void hrd.track(eventName, data);
  });
}

/** Identify only when consent is granted. The tracker refuses identify otherwise. */
export function hardalIdentify(userId: string, traits?: Record<string, unknown>): void {
  whenHardalReady((hrd) => {
    if (hrd.consentStatus().data.consent === "granted") void hrd.identify(userId, traits);
  });
}

/** Map a boolean analytics choice from your consent banner to Hardal. */
export function hardalConsent(analyticsAllowed: boolean): void {
  whenHardalReady((hrd) => {
    void hrd.consent(analyticsAllowed ? "granted" : "denied");
  });
}
