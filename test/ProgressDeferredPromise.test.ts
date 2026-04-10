import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ProgressDeferredPromise } from '../src/ProgressDeferredPromise';

describe('ProgressDeferredPromise', () => {
  it('notifies progress listeners', () => {
    const d = new ProgressDeferredPromise<string, number>();
    const values: number[] = [];
    d.onProgress(v => values.push(v));
    d.progress(10);
    d.progress(50);
    d.progress(100);
    assert.deepEqual(values, [10, 50, 100]);
  });

  it('notifies multiple listeners in order', () => {
    const d = new ProgressDeferredPromise<string, number>();
    const log: string[] = [];
    d.onProgress(() => log.push('a'));
    d.onProgress(() => log.push('b'));
    d.progress(1);
    assert.deepEqual(log, ['a', 'b']);
  });

  it('progress after settlement is a no-op', async () => {
    const d = new ProgressDeferredPromise<string, number>();
    const values: number[] = [];
    d.onProgress(v => values.push(v));
    d.resolve('done');
    d.progress(99);
    assert.deepEqual(values, []);
  });

  it('onProgress is chainable', () => {
    const d = new ProgressDeferredPromise<string, number>();
    const result = d.onProgress(() => {});
    assert.equal(result, d);
  });
});
