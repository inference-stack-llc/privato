import { randomInt } from "node:crypto";

type CircuitState = "closed" | "open" | "half-open";

interface Circuit {
  failures: number;
  openedAt?: number;
}

const circuit: Circuit = { failures: 0 };
const FAILURE_THRESHOLD = 3;
const RESET_AFTER_MS = 30_000;

export class AiCircuitOpenError extends Error {
  constructor() {
    super("AI service is temporarily unavailable.");
    this.name = "AiCircuitOpenError";
  }
}

export function currentCircuitState(now = Date.now()): CircuitState {
  if (!circuit.openedAt) return "closed";
  return now - circuit.openedAt >= RESET_AFTER_MS ? "half-open" : "open";
}

function transient(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const status = "status" in error && typeof error.status === "number" ? error.status : undefined;
  return status === 408 || status === 409 || status === 429 || (status !== undefined && status >= 500) || error.name === "AbortError" || error.name === "APIConnectionError";
}

export async function runWithAiControls<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: { timeoutMs?: number; maxRetries?: number } = {},
): Promise<{ value: T; retryCount: number; circuitState: CircuitState }> {
  if (currentCircuitState() === "open") throw new AiCircuitOpenError();
  const timeoutMs = options.timeoutMs ?? 18_000;
  const maxRetries = options.maxRetries ?? 2;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const value = await operation(controller.signal);
      circuit.failures = 0;
      circuit.openedAt = undefined;
      return { value, retryCount: attempt, circuitState: "closed" };
    } catch (error) {
      if (!transient(error) || attempt === maxRetries) {
        circuit.failures += 1;
        if (circuit.failures >= FAILURE_THRESHOLD) circuit.openedAt = Date.now();
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 150 * 2 ** attempt + randomInt(20, 90)));
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error("AI retry budget exhausted.");
}
