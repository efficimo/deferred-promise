import { DeferredPromise } from "./DeferredPromise";

export class AbortDeferredPromise<T> extends DeferredPromise<T> {
  private _onAbort: (() => void) | null = null;
  private _signal: AbortSignal | null = null;

  constructor(
    signal: AbortSignal,
    executor?: (
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason?: unknown) => void,
    ) => void,
  ) {
    super(executor);

    if (signal.aborted) {
      this.reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      return;
    }

    const onAbort = () => this.reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
    this._onAbort = onAbort;
    this._signal = signal;
    signal.addEventListener("abort", onAbort, { once: true });
  }

  override resolve(value: T | PromiseLike<T>): void {
    this._cleanup();
    super.resolve(value);
  }

  override reject(reason?: unknown): void {
    this._cleanup();
    super.reject(reason);
  }

  private _cleanup(): void {
    if (this._onAbort !== null && this._signal !== null) {
      this._signal.removeEventListener("abort", this._onAbort);
      this._onAbort = null;
    }
  }
}
