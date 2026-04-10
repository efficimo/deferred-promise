import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TimeoutDeferredPromise } from '../src/TimeoutDeferredPromise';

describe('TimeoutDeferredPromise', () => {
  it('rejects after timeout', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const d = new TimeoutDeferredPromise<string>(1000);
    t.mock.timers.tick(1000);
    await assert.rejects(d, /timed out after 1000ms/);
  });

  it('does not reject if resolved before timeout', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const d = new TimeoutDeferredPromise<string>(1000);
    d.resolve('ok');
    t.mock.timers.tick(1000);
    assert.equal(await d, 'ok');
  });

  it('does not double-reject if rejected before timeout', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const d = new TimeoutDeferredPromise<string>(1000);
    const err = new Error('manual');
    d.reject(err);
    t.mock.timers.tick(1000);
    await assert.rejects(d, err);
  });

  it('uses a custom string message', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const d = new TimeoutDeferredPromise<string>(1000, 'custom timeout');
    t.mock.timers.tick(1000);
    await assert.rejects(d, /custom timeout/);
  });

  it('uses a custom function message', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const d = new TimeoutDeferredPromise<string>(1000, ms => `timeout after ${ms}`);
    t.mock.timers.tick(1000);
    await assert.rejects(d, /timeout after 1000/);
  });

  it('extendTimeout resets the timer', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const d = new TimeoutDeferredPromise<string>(1000);
    t.mock.timers.tick(999);
    d.extendTimeout();
    t.mock.timers.tick(999);
    assert.equal(d.isPending, true);
    t.mock.timers.tick(1);
    await assert.rejects(d, /timed out/);
  });

  it('extendTimeout with custom duration', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const d = new TimeoutDeferredPromise<string>(1000);
    d.extendTimeout(2000);
    t.mock.timers.tick(1999);
    assert.equal(d.isPending, true);
    t.mock.timers.tick(1);
    await assert.rejects(d, /timed out/);
  });

  it('extendTimeout after settlement is a no-op', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const d = new TimeoutDeferredPromise<string>(1000);
    d.resolve('ok');
    d.extendTimeout();
    assert.equal(d.status, 'fulfilled');
  });
});
