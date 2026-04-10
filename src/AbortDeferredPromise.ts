import { DeferredPromise } from './DeferredPromise';

export class AbortDeferredPromise<T> extends DeferredPromise<T> {
  constructor(
    signal: AbortSignal,
    executor?: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: unknown) => void) => void,
  ) {
    super((resolve, reject) => {
      if (signal.aborted) {
        reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
        return;
      }

      const onAbort = () => reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      signal.addEventListener('abort', onAbort, { once: true });

      executor?.(
        value => { signal.removeEventListener('abort', onAbort); resolve(value); },
        reason => { signal.removeEventListener('abort', onAbort); reject(reason); },
      );
    });
  }
}
