import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AbortDeferredPromise } from '../src/AbortDeferredPromise';

describe('AbortDeferredPromise', () => {
  it('rejects when signal is aborted', async () => {
    const controller = new AbortController();
    const d = new AbortDeferredPromise<string>(controller.signal);
    controller.abort();
    await assert.rejects(d, { name: 'AbortError' });
  });

  it('rejects immediately if signal is already aborted', async () => {
    const d = new AbortDeferredPromise<string>(AbortSignal.abort());
    assert.equal(d.status, 'rejected');
    await assert.rejects(d, { name: 'AbortError' });
  });

  it('propagates signal.reason', async () => {
    const controller = new AbortController();
    const d = new AbortDeferredPromise<string>(controller.signal);
    controller.abort(new Error('custom reason'));
    await assert.rejects(d, /custom reason/);
  });

  it('resolve before abort prevents rejection', async () => {
    const controller = new AbortController();
    const d = new AbortDeferredPromise<string>(controller.signal);
    d.resolve('ok');
    controller.abort();
    assert.equal(d.status, 'fulfilled');
    assert.equal(await d, 'ok');
  });

  it('reject before abort does not double-reject', async () => {
    const controller = new AbortController();
    const d = new AbortDeferredPromise<string>(controller.signal);
    const err = new Error('manual');
    d.reject(err);
    controller.abort();
    await assert.rejects(d, err);
  });
});
