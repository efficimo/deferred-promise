export type PromiseStatus = 'pending' | 'fulfilled' | 'rejected';

export class DeferredPromise<T> extends Promise<T> {
  private _resolve!: (value: T | PromiseLike<T>) => void;
  private _reject!: (reason?: unknown) => void;
  private _status: PromiseStatus = 'pending';

  // Prevent .then()/.catch()/.finally() from constructing subclass instances.
  // Without this, chaining calls `new SubClass(internalExecutor)` which breaks
  // subclasses that expect specific constructor arguments (e.g. timeoutMs, signal).
  static override get [Symbol.species]() { return Promise; }

  constructor(
    executor?: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: unknown) => void) => void,
  ) {
    let _resolve!: (value: T | PromiseLike<T>) => void;
    let _reject!: (reason?: unknown) => void;

    super((resolve, reject) => {
      _resolve = resolve;
      _reject = reject;
      executor?.(resolve, reject);
    });

    this._resolve = _resolve;
    this._reject = _reject;
  }

  get status(): PromiseStatus { return this._status; }
  get isPending(): boolean { return this._status === 'pending'; }

  resolve(value: T | PromiseLike<T>): void {
    if (!this.isPending) return;
    this._status = 'fulfilled';
    this._resolve(value);
  }

  reject(reason?: unknown): void {
    if (!this.isPending) return;
    this._status = 'rejected';
    this._reject(reason);
  }
}
