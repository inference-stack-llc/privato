import { describe, expect, it, vi } from "vitest";
import { AiCircuitOpenError, AiRuntimeExecutionError, ResilientAiRuntime, safeAiErrorCategory } from "@/modules/ai/runtime";

describe("AI runtime controls", () => {
  it("enforces a hard timeout even when an operation ignores abort", async () => {
    const runtime = new ResilientAiRuntime();
    const result = runtime.execute(() => new Promise(() => undefined), { timeoutMs: 5, maxRetries: 0 });
    await expect(result).rejects.toBeInstanceOf(AiRuntimeExecutionError);
    await expect(result.catch((error: unknown) => safeAiErrorCategory(error))).resolves.toBe("timeout");
  });

  it("retries a transient upstream failure within the bounded budget", async () => {
    const runtime = new ResilientAiRuntime();
    const operation = vi.fn(async () => {
      if (operation.mock.calls.length === 1) throw Object.assign(new Error("rate limited"), { status: 429 });
      return "ok";
    });
    const result = await runtime.execute(operation, { timeoutMs: 100, maxRetries: 1 });
    expect(result.value).toBe("ok");
    expect(result.retryCount).toBe(1);
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("does not retry deterministic validation failures", async () => {
    const runtime = new ResilientAiRuntime();
    const operation = vi.fn(async () => { throw Object.assign(new Error("invalid"), { name: "ZodError" }); });
    await expect(runtime.execute(operation, { maxRetries: 2 })).rejects.toMatchObject({ name: "ZodError" });
    expect(operation).toHaveBeenCalledOnce();
    expect(runtime.currentCircuitState()).toBe("closed");
  });

  it("opens the circuit after repeated exhausted upstream failures", async () => {
    const runtime = new ResilientAiRuntime();
    const operation = vi.fn(async () => { throw Object.assign(new Error("upstream"), { status: 500 }); });
    for (let index = 0; index < 3; index += 1) {
      await expect(runtime.execute(operation, { maxRetries: 0 })).rejects.toBeInstanceOf(AiRuntimeExecutionError);
    }
    expect(runtime.currentCircuitState()).toBe("open");
    await expect(runtime.execute(operation, { maxRetries: 0 })).rejects.toBeInstanceOf(AiCircuitOpenError);
  });
});
