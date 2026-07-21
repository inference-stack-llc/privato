import type { AiRunRepositoryPort, AuditEventPort } from "@/modules/assistant/types";
import { recordDemoAiRun, recordDemoAudit } from "@/modules/demo/demo-store";

export class DemoAiRunRepository implements AiRunRepositoryPort {
  async record(run: Parameters<AiRunRepositoryPort["record"]>[0]): Promise<void> {
    recordDemoAiRun(run);
  }
}

export class DemoAuditEventAdapter implements AuditEventPort {
  async record(event: Parameters<AuditEventPort["record"]>[0]): Promise<void> {
    recordDemoAudit(event);
  }
}
