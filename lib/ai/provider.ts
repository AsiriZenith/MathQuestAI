export interface AiGenerateRequest {
  prompt: string;
  responseJsonSchema: Record<string, unknown>;
}

export type AiGenerateResult =
  | { ok: true; rawText: string }
  | { ok: false; error: string };

export interface AiProvider {
  generate(request: AiGenerateRequest): Promise<AiGenerateResult>;
}
