import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DeferredMap } from '../src/DeferredMap';

describe('DeferredMap', () => {
  it('get creates an entry if absent', () => {
    const map = new DeferredMap<string, number>();
    map.get('key');
    assert.equal(map.size, 1);
    assert.equal(map.has('key'), true);
  });

  it('get returns the same instance on repeated calls', () => {
    const map = new DeferredMap<string, number>();
    assert.equal(map.get('key'), map.get('key'));
  });

  it('resolve settles the deferred and removes the entry', async () => {
    const map = new DeferredMap<string, number>();
    const d = map.get('key');
    map.resolve('key', 42);
    assert.equal(map.has('key'), false);
    assert.equal(map.size, 0);
    assert.equal(await d, 42);
  });

  it('reject rejects the deferred and removes the entry', async () => {
    const map = new DeferredMap<string, number>();
    const d = map.get('key');
    const err = new Error('fail');
    map.reject('key', err);
    assert.equal(map.has('key'), false);
    await assert.rejects(d, err);
  });

  it('delete rejects with a dedicated error and removes the entry', async () => {
    const map = new DeferredMap<string, number>();
    const d = map.get('key');
    map.delete('key');
    assert.equal(map.has('key'), false);
    await assert.rejects(d, /deleted/);
  });

  it('clear rejects all pending entries', async () => {
    const map = new DeferredMap<string, number>();
    const d1 = map.get('a');
    const d2 = map.get('b');
    map.clear();
    assert.equal(map.size, 0);
    await assert.rejects(d1, /cleared/);
    await assert.rejects(d2, /cleared/);
  });

  it('resolve on unknown key is a no-op', () => {
    const map = new DeferredMap<string, number>();
    assert.doesNotThrow(() => map.resolve('unknown', 42));
  });
});
