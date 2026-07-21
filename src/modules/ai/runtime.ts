import { randomInt } from "node:crypto";

export type CircuitState = "closed" | "open" | "half-open";

export interface AiRuntimeResult<T> {
  value: T;
  retryCount: number;
  circuitState: CircuitState;
}

export interface AiRuntimePort {
  execute<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    options?: { timeoutMs?: number; maxRetries?: number },
  ): Promise<AiRuntimeResult<T>>;
  currentCircuitState(now?: number): CircuitState;
}

interface Circuit {
  failures: number;
  openedAt?: number;
}

const FAILURE_THRESHOLD = 3;
const RESET_AFTER_MS = 30_000;

export class AiCircuitOpenError extends Error {
  constructor() {
    super("AI service is temporarily unavailable.");
    this.name = "AiCircuitOpenError";
  }
}

export class AiTimeoutError extends Error {
  constructor() {
    super("AI request timed out.");
    this.name = "AiTimeoutError";
  }
}

export class AiRuntimeExecutionError extends Error {
  constructor(
    public readonly originalError: unknown,
    public readonly retryCount: number,
    public readonly circuitState: CircuitState,
  ) {
    super("AI runtime controls exhausted the request budget.", { cause: originalError });
    this.name = "AiRuntimeExecutionError";
  }
}

export function isTransientAiError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const status = "status" in error && typeof error.status === "number" ? error.status : undefined;
  return status === 408
    || status === 409
    || status === 429
    || (status !== undefined && status >= 500)
    || error instanceof AiTimeoutError
    || error.name === "AbortError"
    || error.name === "APIConnectionError";
}

export function safeAiErrorCategory(error: unknown): string {
  if (error instanceof AiRuntimeExecutionError) return safeAiErrorCategory(error.originalError);
  if (error instanceof AiCircuitOpenError) return "circuit_open";
  if (error instanceof AiTimeoutError || (error instanceof Error && error.name === "AbortError")) return "timeout";
  if (isTransientAiError(error)) return "upstream_transient";
  if (error instanceof Error && (error.name === "ZodError" || error.name === "AiOutputValidationError")) return "invalid_output";
  return "upstream_unavailable";
}

export class ResilientAiRuntime implements AiRuntimePort {
  private readonly circuit: Circuit = { failures: 0 };

  currentCircuitState(now = Date.now()): CircuitState {
    if (!this.circuit.openedAt) return "closed";
    return now - this.circuit.openedAt >= RESET_AFTER_MS ? "half-open" : "open";
  }

  async execute<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    options: { timeoutMs?: number; maxRetries?: number } = {},
  ): Promise<AiRuntimeResult<T>> {
    if (this.currentCircuitState() === "open") throw new AiCircuitOpenError();
    const timeoutMs = options.timeoutMs ?? 18_000;
    const maxRetries = options.maxRetries ?? 2;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const controller = new AbortController();
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new AiTimeoutError());
        }, timeoutMs);
      });

      try {
        const value = await Promise.race([operation(controller.signal), timeout]);
        this.circuit.failures = 0;
        this.circuit.openedAt = undefined;
        return { value, retryCount: attempt, circuitState: "closed" };
      } catch (error) {
        if (!isTransientAiError(error)) throw error;
        if (attempt === maxRetries) {
          this.circuit.failures += 1;
          if (this.circuit.failures >= FAILURE_THRESHOLD) this.circuit.openedAt = Date.now();
          throw new AiRuntimeExecutionError(error, attempt, this.currentCircuitState());
        }
        await new Promise((resolve) => setTimeout(resolve, 150 * 2 ** attempt + randomInt(20, 90)));
      } finally {
        if (timer) clearTimeout(timer);
      }
    }

    throw new Error("AI retry budget exhausted.");
  }

  resetForTests(): void {
    this.circuit.failures = 0;
    this.circuit.openedAt = undefined;
  }
}

const defaultRuntime = new ResilientAiRuntime();

export function currentCircuitState(now = Date.now()): CircuitState {
  return defaultRuntime.currentCircuitState(now);
}

export function runWithAiControls<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: { timeoutMs?: number; maxRetries?: number } = {},
): Promise<AiRuntimeResult<T>> {
  return defaultRuntime.execute(operation, options);
}

export function resetAiCircuitForTests(): void {
  defaultRuntime.resetForTests();
}
