// Cloudflare Pages Functions 最小类型定义
// 真实类型来自 @cloudflare/workers-types,这里仅声明用到的几个全局接口

declare global {
  interface R2Object {
    body: ReadableStream;
    etag?: string;
    httpEtag?: string;
    writeHttpMetadata(headers: Headers): void;
    size: number;
    uploaded: Date;
    range?: { offset: number; length: number };
  }

  interface R2Bucket {
    head(key: string): Promise<Omit<R2Object, 'body'> | null>;
    get(
      key: string,
      options?: { range?: { offset: number; length?: number } | { offset?: number; length: number } | { suffix: number } },
    ): Promise<R2Object | null>;
  }

  interface EventContext<Env = Record<string, unknown>, P = string, Data = unknown> {
    request: Request;
    env: Env;
    params: Record<P, string>;
    data: Data;
    waitUntil(promise: Promise<unknown>): void;
    next(): Promise<Response>;
  }

  interface PagesFunction<Env = Record<string, unknown>> {
    (context: EventContext<Env>): Response | Promise<Response>;
  }

  }

export {};
