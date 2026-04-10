# @efficimo/deferred-promise

[![npm version](https://img.shields.io/npm/v/@efficimo/deferred-promise)](https://www.npmjs.com/package/@efficimo/deferred-promise)
[![license](https://img.shields.io/npm/l/@efficimo/deferred-promise)](./LICENSE)
[![types](https://img.shields.io/npm/types/@efficimo/deferred-promise)](https://www.npmjs.com/package/@efficimo/deferred-promise)

> Extend native Promises with external resolve/reject, status tracking, timeout, abort signal, progress reporting, lazy execution and deferred maps. Fully typed. Directly awaitable.

## Why

The native `Promise` constructor forces you to resolve or reject from inside the executor. This is inconvenient for patterns like RPC, event correlation, or any case where the resolution happens in a completely different part of your code.

`@efficimo/deferred-promise` solves this by extending the native `Promise` class — so every deferred is **directly awaitable** with no wrappers — and adding lifecycle controls: external resolve/reject, status tracking, timeout management, abort signal integration, progress reporting, and a deferred map for key-based correlation.

## Installation

```bash
npm install @efficimo/deferred-promise
```

## Quick start

```typescript
import { DeferredPromise } from '@efficimo/deferred-promise';

const deferred = new DeferredPromise<string>();

// resolve from anywhere
deferred.resolve('hello');

// directly awaitable
const result = await deferred; // 'hello'
```

---

## API

### `DeferredPromise<T>`

Base class. Extends native `Promise<T>`.

```typescript
new DeferredPromise<T>(executor?)
```

| Member | Type | Description |
|---|---|---|
| `status` | `'pending' \| 'fulfilled' \| 'rejected'` | Current lifecycle state |
| `isPending` | `boolean` | Shorthand for `status === 'pending'` |
| `resolve(value)` | `void` | Resolves the promise. No-op if already settled. |
| `reject(reason?)` | `void` | Rejects the promise. No-op if already settled. |

```typescript
const deferred = new DeferredPromise<number>();

console.log(deferred.status);   // 'pending'
console.log(deferred.isPending); // true

deferred.resolve(42);

console.log(deferred.status);   // 'fulfilled'
console.log(deferred.isPending); // false

// calling resolve/reject after settlement is a no-op
deferred.reject(new Error('too late')); // ignored

const value = await deferred; // 42
```

The optional `executor` runs immediately, just like a native `Promise`:

```typescript
const deferred = new DeferredPromise<number>((resolve) => {
  someEmitter.once('data', resolve);
});
```

---

### `TimeoutDeferredPromise<T>`

Extends `DeferredPromise<T>`. Automatically rejects after a given delay. The timer is cleared when the promise is resolved or rejected before it fires.

```typescript
new TimeoutDeferredPromise<T>(timeoutMs, message?, executor?)
```

| Parameter | Type | Description |
|---|---|---|
| `timeoutMs` | `number` | Delay in milliseconds before auto-rejection |
| `message` | `string \| (ms: number) => string` | Custom error message or factory |
| `executor` | `function` | Optional executor, runs alongside the timer |

| Member | Description |
|---|---|
| `extendTimeout(timeoutMs?)` | Resets the timer. Uses original `timeoutMs` if omitted. No-op if already settled. |

```typescript
import { TimeoutDeferredPromise } from '@efficimo/deferred-promise';

// default message
const deferred = new TimeoutDeferredPromise<string>(5000);

// custom static message
const deferred = new TimeoutDeferredPromise<string>(5000, 'Request timed out');

// dynamic message
const deferred = new TimeoutDeferredPromise<string>(5000, ms => `Timed out after ${ms}ms`);

// extend the timer (e.g. on activity)
deferred.extendTimeout();        // reset to original 5000ms
deferred.extendTimeout(10_000);  // reset to a new duration

// resolve before timeout — timer is cleared automatically
deferred.resolve('ok');
```

---

### `AbortDeferredPromise<T>`

Extends `DeferredPromise<T>`. Automatically rejects when an `AbortSignal` is triggered. Cleans up the event listener when resolved or rejected before the signal fires.

```typescript
new AbortDeferredPromise<T>(signal, executor?)
```

| Parameter | Type | Description |
|---|---|---|
| `signal` | `AbortSignal` | Signal that triggers automatic rejection |
| `executor` | `function` | Optional executor |

```typescript
import { AbortDeferredPromise } from '@efficimo/deferred-promise';

const controller = new AbortController();

const deferred = new AbortDeferredPromise<string>(controller.signal);

// abort from anywhere
controller.abort(); // deferred rejects with signal.reason or DOMException('Aborted', 'AbortError')

// already-aborted signal rejects immediately
const aborted = new AbortDeferredPromise<string>(AbortSignal.abort());
```

---

### `DeferredMap<K, T>`

A `Map`-like structure of `DeferredPromise` instances, auto-created on first access by key. Designed for request/response correlation patterns (RPC, WebSocket, message queues).

```typescript
new DeferredMap<K, T>()
```

| Member | Description |
|---|---|
| `size` | Number of pending entries |
| `has(key)` | Returns `true` if an entry exists for this key |
| `get(key)` | Returns the deferred for this key, creating it if absent |
| `resolve(key, value)` | Resolves the entry and removes it from the map |
| `reject(key, reason?)` | Rejects the entry and removes it from the map |
| `delete(key)` | Rejects the entry with a deletion error and removes it |
| `clear()` | Rejects all pending entries and empties the map |

```typescript
import { DeferredMap } from '@efficimo/deferred-promise';

const pending = new DeferredMap<string, ApiResponse>();

// caller side — get or create a deferred and await it
const response = await pending.get(callId);

// responder side — resolve by key
pending.resolve(callId, data);   // auto-removes the entry

// error handling
pending.reject(callId, new Error('not found'));

// teardown (e.g. on disconnect)
pending.clear(); // rejects all pending entries
```

---

### `ProgressDeferredPromise<T, P>`

Extends `DeferredPromise<T>`. Adds progress notifications before final resolution. The second type parameter `P` defines the shape of progress updates.

```typescript
new ProgressDeferredPromise<T, P>(executor?)
```

| Member | Description |
|---|---|
| `onProgress(listener)` | Registers a progress listener. Returns `this` for chaining. |
| `progress(value)` | Notifies all listeners. No-op if already settled. |

```typescript
import { ProgressDeferredPromise } from '@efficimo/deferred-promise';

const deferred = new ProgressDeferredPromise<string, { percent: number }>();

// register one or more listeners (chainable)
deferred
  .onProgress(p => updateProgressBar(p.percent))
  .onProgress(p => console.log(`${p.percent}%`));

// notify from anywhere
deferred.progress({ percent: 25 });
deferred.progress({ percent: 75 });

deferred.resolve('done');

// progress after settlement is a no-op
deferred.progress({ percent: 99 }); // ignored

const result = await deferred; // 'done'
```

---

### `LazyPromise<T>`

Extends `Promise<T>`. Defers execution of the executor until the first `then`, `catch`, `finally`, or `await`. Useful when the side effect (network request, file read, heavy computation) should only start when a consumer is actually ready.

```typescript
new LazyPromise<T>(executor)
```

| Member | Type | Description |
|---|---|---|
| `status` | `'pending' \| 'fulfilled' \| 'rejected'` | Current lifecycle state |
| `isPending` | `boolean` | Shorthand for `status === 'pending'` |
| `isStarted` | `boolean` | `true` once the executor has been triggered |

```typescript
import { LazyPromise } from '@efficimo/deferred-promise';

const lazy = new LazyPromise<string>((resolve) => {
  console.log('executor running');
  resolve('hello');
});

// nothing has run yet — executor is still dormant
console.log(lazy.isStarted); // false
console.log(lazy.status);    // 'pending'

// first await triggers the executor
const result = await lazy;
// logs: 'executor running'

console.log(result);         // 'hello'
console.log(lazy.isStarted); // true
console.log(lazy.status);    // 'fulfilled'
```

Multiple `then`/`await` calls are safe — the executor runs exactly once:

```typescript
const lazy = new LazyPromise<number>((resolve) => resolve(42));

const [a, b] = await Promise.all([lazy, lazy]);
// executor ran once, both consumers receive 42
```

---

## Real-world example: RPC over WebSocket

```typescript
import { DeferredMap, TimeoutDeferredPromise } from '@efficimo/deferred-promise';

type RpcResponse = { result: unknown };

const pending = new DeferredMap<string, RpcResponse>();
let callCounter = 0;

function call(method: string, params: unknown): Promise<RpcResponse> {
  const callId = `${method}-${++callCounter}`;
  const deferred = new TimeoutDeferredPromise<RpcResponse>(10_000, `RPC "${method}" timed out`);

  pending.get(callId); // register the key
  socket.send(JSON.stringify({ callId, method, params }));

  return deferred;
}

socket.on('message', (raw: string) => {
  const { callId, result, error } = JSON.parse(raw);
  error ? pending.reject(callId, error) : pending.resolve(callId, { result });
});

socket.on('close', () => pending.clear());

// usage
const { result } = await call('getUser', { id: 42 });
```

---

## Contributing

Issues and PRs are welcome at [github.com/efficimo/@efficimo/deferred-promise](https://github.com/efficimo/@efficimo/deferred-promise).

## License

MIT
