import { DeferredPromise } from './DeferredPromise';

function resolveMessage(
  message: string | ((ms: number) => string) | undefined,
  ms: number,
): string {
  return typeof message === 'function'
    ? message(ms)
    : (message ?? `Deferred timed out after ${ms}ms`);
}

export class TimeoutDeferredPromise<T> extends DeferredPromise<T> {
  private _timer: ReturnType<typeof setTimeout>;
  private _timeoutMs: number;
  private _message: string | ((ms: number) => string) | undefined;

  constructor(
    timeoutMs: number,
    message?: string | ((timeoutMs: number) => string),
    executor?: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: unknown) => void) => void,
  ) {
    super(executor);

    this._timeoutMs = timeoutMs;
    this._message = message;
    this._timer = setTimeout(
      () => this.reject(new Error(resolveMessage(message, timeoutMs))),
      timeoutMs,
    );
  }

  extendTimeout(timeoutMs = this._timeoutMs): void {
    if (!this.isPending) return;
    clearTimeout(this._timer);
    this._timer = setTimeout(
      () => this.reject(new Error(resolveMessage(this._message, timeoutMs))),
      timeoutMs,
    );
  }

  override resolve(value: T | PromiseLike<T>): void {
    clearTimeout(this._timer);
    super.resolve(value);
  }

  override reject(reason?: unknown): void {
    clearTimeout(this._timer);
    super.reject(reason);
  }
}
