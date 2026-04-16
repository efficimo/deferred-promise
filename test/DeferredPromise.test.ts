import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DeferredPromise } from "../src/DeferredPromise";

describe("DeferredPromise", () => {
  it("starts in pending state", () => {
    const d = new DeferredPromise<number>();
    assert.equal(d.status, "pending");
    assert.equal(d.isPending, true);
  });

  it("resolves with the correct value", async () => {
    const d = new DeferredPromise<number>();
    d.resolve(42);
    assert.equal(d.status, "fulfilled");
    assert.equal(d.isPending, false);
    assert.equal(await d, 42);
  });

  it("rejects with the correct reason", async () => {
    const d = new DeferredPromise<never>();
    const err = new Error("fail");
    d.reject(err);
    assert.equal(d.status, "rejected");
    await assert.rejects(d, err);
  });

  it("resolve after settlement is a no-op", async () => {
    const d = new DeferredPromise<number>();
    d.resolve(1);
    d.resolve(2);
    assert.equal(await d, 1);
  });

  it("reject after settlement is a no-op", async () => {
    const d = new DeferredPromise<number>();
    d.resolve(1);
    d.reject(new Error("too late"));
    assert.equal(await d, 1);
  });

  it("executor runs immediately", () => {
    let ran = false;
    new DeferredPromise<void>(() => {
      ran = true;
    });
    assert.equal(ran, true);
  });

  it("is directly awaitable", async () => {
    const d = new DeferredPromise<string>();
    setTimeout(() => d.resolve("hello"), 10);
    assert.equal(await d, "hello");
  });
});
