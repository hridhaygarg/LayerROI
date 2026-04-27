import type { LayeroiConfig, WrapOptions, TaskContext } from './types.js';
import { Transport } from './transport.js';
import { wrapOpenAI } from './wrap-openai.js';
import { wrapAnthropic, isAnthropicClient } from './wrap-anthropic.js';
import { runWithTask } from './context.js';

const DEFAULT_ENDPOINT = 'https://api.layeroi.com';

export class LayeroiClient {
  private config: LayeroiConfig | null = null;
  private transport: Transport | null = null;

  init(config: LayeroiConfig): void {
    this.config = {
      ...config,
      endpoint: config.endpoint || DEFAULT_ENDPOINT,
    };
    this.transport = new Transport(
      this.config.endpoint!,
      this.config.apiKey,
      this.config.debug,
    );
  }

  wrap<T extends object>(client: T, options: WrapOptions): T {
    if (!this.transport) {
      throw new Error('layeroi.init() must be called before wrap()');
    }
    if (isAnthropicClient(client)) {
      return wrapAnthropic(client, options, this.transport);
    }
    return wrapOpenAI(client, options, this.transport);
  }

  async task<T>(
    taskId: string,
    metadata: Record<string, unknown> | null,
    fn: () => T | Promise<T>,
  ): Promise<T> {
    const ctx: TaskContext = { taskId, metadata: metadata ?? undefined };
    return runWithTask(ctx, fn) as Promise<T>;
  }

  flush(): void {
    this.transport?.flush();
  }

  destroy(): void {
    this.transport?.destroy();
  }
}
