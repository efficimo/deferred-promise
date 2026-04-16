import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LazyPromise } from "../src/LazyPromise";

describe("LazyPromise", () => {
  it("should not run the executor before the first then/await", () => {
    let executed = false;
    new LazyPromise(() => {
      executed = true;
    });
    assert.equal(executed, false);
  });

  it("should run the executor on first then", async () => {
    let executed = false;
    const lp = new LazyPromise<number>((resolve) => {
      executed = true;
      resolve(42);
    });
    assert.equal(executed, false);
    assert.equal(await lp.then((v) => v), 42);
    assert.equal(executed, true);
  });

  it("should run the executor on first await", async () => {
    let executed = false;
    const lp = new LazyPromise<number>((resolve) => {
      executed = true;
      resolve(42);
    });
    assert.equal(executed, false);
    assert.equal(await lp, 42);
    assert.equal(executed, true);
  });

  it("should run the executor only once across multiple then calls", async () => {
    let count = 0;
    const lp = new LazyPromise<number>((resolve) => {
      count++;
      resolve(1);
    });
    await Promise.all([lp.then((v) => v), lp.then((v) => v)]);
    assert.equal(count, 1);
  });

  it("should track isStarted correctly", () => {
    const lp = new LazyPromise<number>((resolve) => resolve(1));
    assert.equal(lp.isStarted, false);
    lp.then(() => {});
    assert.equal(lp.isStarted, true);
  });

  it("should have pending status before any then/await", () => {
    const lp = new LazyPromise<number>(() => {});
    assert.equal(lp.status, "pending");
    assert.equal(lp.isPending, true);
  });

  it("should have fulfilled status after resolution", async () => {
    const lp = new LazyPromise<number>((resolve) => resolve(42));
    await lp;
    assert.equal(lp.status, "fulfilled");
    assert.equal(lp.isPending, false);
  });

  it("should have rejected status after rejection", async () => {
    const lp = new LazyPromise<number>((_, reject) => reject(new Error("fail")));
    await lp.catch(() => {});
    assert.equal(lp.status, "rejected");
    assert.equal(lp.isPending, false);
  });

  it("should propagate rejection", async () => {
    const error = new Error("lazy error");
    const lp = new LazyPromise<number>((_, reject) => reject(error));
    await assert.rejects(lp, error);
  });

  it("should trigger the executor via catch", async () => {
    let executed = false;
    const lp = new LazyPromise<number>((_, reject) => {
      executed = true;
      reject(new Error("oops"));
    });
    assert.equal(executed, false);
    await lp.catch(() => {});
    assert.equal(executed, true);
  });
});
