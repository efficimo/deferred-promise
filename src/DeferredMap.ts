import { DeferredPromise } from './DeferredPromise';

export class DeferredMap<K, T> {
  private readonly _map = new Map<K, DeferredPromise<T>>();

  get size(): number {
    return this._map.size;
  }

  has(key: K): boolean {
    return this._map.has(key);
  }

  get(key: K): DeferredPromise<T> {
    let deferred = this._map.get(key);

    if (deferred == null) {
      deferred = new DeferredPromise<T>();
      this._map.set(key, deferred);
    }

    return deferred;
  }

  resolve(key: K, value: T | PromiseLike<T>): void {
    this._map.get(key)?.resolve(value);
    this._map.delete(key);
  }

  reject(key: K, reason?: unknown): void {
    this._map.get(key)?.reject(reason);
    this._map.delete(key);
  }

  delete(key: K): void {
    this._map.get(key)?.reject(new Error(`DeferredMap: entry "${String(key)}" deleted`));
    this._map.delete(key);
  }

  clear(): void {
    for (const deferred of this._map.values()) {
      deferred.reject(new Error('DeferredMap: cleared'));
    }
    this._map.clear();
  }
}
