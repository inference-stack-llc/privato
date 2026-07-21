import type { AiGatewayPort } from "@/modules/ai/ports";
import { DemoAiGateway } from "@/modules/ai/demo-gateway";
import { OpenAiGateway } from "@/modules/ai/openai-gateway";

export function createAiGateway(): AiGatewayPort {
  return process.env.OPENAI_API_KEY
    ? new OpenAiGateway(process.env.OPENAI_API_KEY)
    : new DemoAiGateway();
}

/** Ask Privato never fabricates an answer when the live provider is unavailable. */
export function createAskAiGateway(): AiGatewayPort | undefined {
  return process.env.OPENAI_API_KEY
    ? new OpenAiGateway(process.env.OPENAI_API_KEY)
    : undefined;
}
