import { DeferredPromise } from "./DeferredPromise";

export class ProgressDeferredPromise<T, P> extends DeferredPromise<T> {
  private _listeners: ((progress: P) => void)[] = [];

  onProgress(listener: (progress: P) => void): this {
    this._listeners.push(listener);
    return this;
  }

  progress(value: P): void {
    if (!this.isPending) return;
    for (const listener of this._listeners) {
      listener(value);
    }
  }
}
