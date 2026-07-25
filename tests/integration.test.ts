import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createConversionIntent, planConversion } from "../src/lib/logic/conversion-plan";
import {
  createQueue,
  markRunning,
  markResult,
  markSkipped,
  summarizeQueue,
  resetFailed,
} from "../src/lib/logic/queue-state";

describe("integration", () => {
  test("full queue lifecycle: create → run → mark → summarize", () => {
    const intent = createConversionIntent({ format: "webp", outputDir: "/out" });
    const files = [
      { path: "/in/a.png", name: "a.png" },
      { path: "/in/b.png", name: "b.png" },
      { path: "/in/c.png", name: "c.png" },
    ];

    const queue = createQueue(files, intent, (file, _intent, index) => planConversion(file, intent, index), () => "job-x");

    assert.equal(queue.length, 3);
    assert.equal(queue.every((item) => item.status === "pending"), true);

    let summary = summarizeQueue(queue);
    assert.equal(summary.pending, 3);
    assert.equal(summary.progress, 0);

    markRunning(queue[0]);
    summary = summarizeQueue(queue);
    assert.equal(summary.running, 1);
    assert.equal(summary.progress, 0);

    markResult(queue[0], { ok: true }, false);
    summary = summarizeQueue(queue);
    assert.equal(summary.done, 1);
    assert.equal(summary.progress, 33);

    markRunning(queue[1]);
    markResult(queue[1], { ok: false, error: "boom" } as any, false);
    summary = summarizeQueue(queue);
    assert.equal(summary.failed, 1);
    assert.equal(summary.progress, 67);

    markSkipped(queue[2]);
    summary = summarizeQueue(queue);
    assert.equal(summary.skipped, 1);
    assert.equal(summary.progress, 100);

    resetFailed(queue);
    summary = summarizeQueue(queue);
    assert.equal(summary.pending, 1);
    assert.equal(summary.done, 1);
    assert.equal(summary.skipped, 1);
  });

  test("collision resolution during full lifecycle", () => {
    const intent = createConversionIntent({ format: "webp", outputDir: "/out" });
    const files = [
      { path: "/dir/photo.png", name: "photo.png" },
      { path: "/other/photo.png", name: "photo.png" },
    ];

    const queue = createQueue(files, intent, (file, _intent, index) => planConversion(file, intent, index), () => "job-y");

    assert.equal(queue[0].outputPath, "/out/photo.webp");
    assert.equal(queue[1].outputPath, "/out/photo-1.webp");
  });
});
