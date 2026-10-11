/**
 * ONE CALL TO ANTHROPIC'S MESSAGES API (unattended runs only; manual mode,
 * where Claude Code does the finding, never uses this).
 *
 * The key comes from the ANTHROPIC_API_KEY environment variable of the
 * process that runs the finder; it is never written to a file by this code.
 * One call, no automatic retries: a retry loop is how a $2 day becomes a
 * $200 day. The caller decides what to do.
 */
export interface ContentBlock {
  type: "text" | "tool_use" | "tool_result";
  text?: string;
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string;
}

export interface Message { role: "user" | "assistant"; content: string | ContentBlock[]; }

export interface ModelReply {
  content: ContentBlock[];
  stopReason: string;
  inputTokens: number;
  outputTokens: number;
  requestId: string;
}

export interface CallArgs {
  apiKey: string;
  model: string;
  system: string;
  messages: Message[];
  tools?: { name: string; description: string; input_schema: Record<string, unknown> }[];
  maxTokens?: number;
  fetchImpl?: typeof fetch;
}

export async function callModel(args: CallArgs): Promise<ModelReply> {
  if (!args.apiKey) throw new Error("ANTHROPIC_API_KEY is not set for this process.");
  const doFetch = args.fetchImpl ?? fetch;
  const res = await doFetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": args.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: args.model,
      max_tokens: args.maxTokens ?? 1500,
      system: args.system,
      messages: args.messages,
      ...(args.tools ? { tools: args.tools } : {}),
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    content?: ContentBlock[]; stop_reason?: string; id?: string;
    usage?: { input_tokens?: number; output_tokens?: number };
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(`Anthropic answered ${res.status}: ${data.error?.message ?? "no detail"}`);
  }
  // Without the token counts the call cannot be charged to the budget, so
  // the reply is refused rather than treated as free.
  const ok = (n: unknown) => typeof n === "number" && Number.isFinite(n) && n >= 0;
  if (!ok(data.usage?.input_tokens) || !ok(data.usage?.output_tokens)) {
    throw new Error("Anthropic's reply had no token counts, so its cost is unknown. Stopped.");
  }
  return {
    content: data.content ?? [],
    stopReason: data.stop_reason ?? "",
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
    requestId: data.id ?? `no-id-${Date.now()}-${Math.random()}`,
  };
}
