import type { PromiseStatus } from './DeferredPromise';

export class LazyPromise<T> extends Promise<T> {
  private _executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: unknown) => void) => void;
  private _resolve!: (value: T | PromiseLike<T>) => void;
  private _reject!: (reason?: unknown) => void;
  private _status: PromiseStatus = 'pending';
  private _started = false;

  // Prevent .then()/.catch()/.finally() from constructing subclass instances.
  // Without this, chaining calls `new SubClass(internalExecutor)` which breaks
  // subclasses that expect specific constructor arguments (e.g. timeoutMs, signal).
  static override get [Symbol.species]() { return Promise; }

  constructor(
    executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: unknown) => void) => void,
  ) {
    let _resolve!: (value: T | PromiseLike<T>) => void;
    let _reject!: (reason?: unknown) => void;

    // Pass an empty executor to super() — we only capture the resolve/reject handles.
    // The real executor is stored and deferred until the first then/await.
    super((resolve, reject) => {
      _resolve = resolve;
      _reject = reject;
    });

    this._resolve = _resolve;
    this._reject = _reject;
    this._executor = executor;
  }

  get status(): PromiseStatus { return this._status; }
  get isPending(): boolean { return this._status === 'pending'; }
  get isStarted(): boolean { return this._started; }

  // Overriding then is sufficient: catch and finally delegate to this.then()
  // via dynamic dispatch (ECMAScript Invoke), so they trigger _start() transitively.
  override then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined,
  ): Promise<TResult1 | TResult2> {
    this._start();
    return super.then(onfulfilled, onrejected);
  }

  private _start(): void {
    if (this._started) return;
    this._started = true;
    this._executor(
      (value) => {
        this._status = 'fulfilled';
        this._resolve(value);
      },
      (reason) => {
        this._status = 'rejected';
        this._reject(reason);
      },
    );
  }
}