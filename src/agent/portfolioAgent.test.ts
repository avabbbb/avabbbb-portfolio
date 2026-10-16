import { afterEach, describe, expect, it, vi } from 'vitest';
import { runPortfolioAgent } from './portfolioAgent';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('portfolio agent', () => {
  it('guides an art beginner to a relevant project without requiring an API key', async () => {
    const result = await runPortfolioAgent({
      language: 'zh',
      audience: 'artist',
      messages: [{ role: 'user', content: '我是纯文科艺术生，想从 AI 视频入门' }],
    });

    expect(result.mode).toBe('local');
    expect(result.content).not.toMatch(/请先.*API Key/i);
    expect(result.content).toMatch(/米哈游|二创视频|AIGC|AI 视频/);
    expect(result.projectIds.length).toBeGreaterThan(0);
    expect(result.trace.some((step) => step.name === 'find_projects' && step.status === 'completed')).toBe(true);
  });

  it('routes an AI developer to engineering evidence instead of the beginner path', async () => {
    const result = await runPortfolioAgent({
      language: 'zh',
      audience: 'developer',
      messages: [{ role: 'user', content: '我想看 Agent、MCP 和 React 的工程实现' }],
    });

    expect(result.mode).toBe('local');
    expect(result.projectIds[0]).toBe('dev1');
    expect(result.content).toMatch(/技术栈|架构|实现/);
  });

  it('answers a contact question locally instead of recommending an unrelated project', async () => {
    const result = await runPortfolioAgent({
      language: 'zh',
      messages: [{ role: 'user', content: '怎么联系你？' }],
    });

    expect(result.mode).toBe('local');
    expect(result.content).toContain('921693422@qq.com');
    expect(result.projectIds).toEqual([]);
    expect(result.trace).toEqual([
      expect.objectContaining({ name: 'get_contact', status: 'completed' }),
    ]);
  });

  it('executes a model-selected tool and returns its result to the model', async () => {
    const requestBodies: Array<Record<string, unknown>> = [];
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      requestBodies.push(body);
      const responseBody = requestBodies.length === 1
        ? {
            choices: [{
              message: {
                role: 'assistant',
                content: null,
                tool_calls: [{
                  id: 'call_find',
                  type: 'function',
                  function: {
                    name: 'find_projects',
                    arguments: JSON.stringify({ query: 'AI video', audience: 'artist' }),
                  },
                }],
              },
            }],
          }
        : { choices: [{ message: { role: 'assistant', content: '先看二创视频案例，再按步骤复刻。' } }] };
      return new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await runPortfolioAgent({
      language: 'zh',
      audience: 'artist',
      apiKey: 'test-key',
      messages: [{ role: 'user', content: '推荐一个 AI 视频入门项目' }],
    });

    expect(result.mode).toBe('model');
    expect(result.content).toContain('二创视频案例');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(requestBodies[0].tools).toEqual(expect.arrayContaining([
      expect.objectContaining({ function: expect.objectContaining({ name: 'find_projects' }) }),
    ]));
    expect(requestBodies[1].messages).toEqual(expect.arrayContaining([
      expect.objectContaining({ role: 'tool', tool_call_id: 'call_find' }),
    ]));
    expect(result.trace).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'find_projects', status: 'completed' }),
    ]));
  });

  it('falls back to grounded local guidance when the model request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('unavailable', { status: 503 })));

    const result = await runPortfolioAgent({
      language: 'zh',
      audience: 'artist',
      apiKey: 'test-key',
      messages: [{ role: 'user', content: '推荐 AI 视频入门案例' }],
    });

    expect(result.mode).toBe('local');
    expect(result.content).toMatch(/建议从「.*」开始/);
    expect(result.trace).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'find_projects', status: 'completed' }),
    ]));
  });

  it('stops a model that keeps calling tools instead of looping forever', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      choices: [{
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [{
            id: `call_${fetchMock.mock.calls.length}`,
            type: 'function',
            function: { name: 'get_profile', arguments: '{}' },
          }],
        },
      }],
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await runPortfolioAgent({
      language: 'zh',
      apiKey: 'test-key',
      messages: [{ role: 'user', content: '介绍一下你自己' }],
    });

    expect(result.mode).toBe('local');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
