import { PROJECTS } from '../../constants';
import { Category, Language, Project } from '../../types';

export type AgentAudience = 'artist' | 'developer' | 'auto';
export type AgentToolName = 'find_projects' | 'get_project' | 'get_profile' | 'get_contact';

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentTraceStep {
  id: string;
  name: AgentToolName | 'unsupported_tool';
  status: 'completed' | 'failed';
  summary: string;
}

export interface PortfolioAgentResult {
  mode: 'local' | 'model';
  content: string;
  projectIds: string[];
  trace: AgentTraceStep[];
}

export interface RunPortfolioAgentInput {
  messages: AgentMessage[];
  language: Language;
  audience?: AgentAudience;
  apiKey?: string;
  signal?: AbortSignal;
}

interface ModelToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface ModelAssistantMessage {
  role: 'assistant';
  content: string | null;
  tool_calls?: ModelToolCall[];
}

type ModelRequestMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ModelToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string };

interface ToolExecution {
  output: Record<string, unknown>;
  projectIds: string[];
  trace: AgentTraceStep;
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const MAX_TOOL_ROUNDS = 3;
const MAX_HISTORY_MESSAGES = 10;
const MAX_QUERY_LENGTH = 240;

const ARTIST_TERMS = ['艺术', '文科', '创作', '视频', '设计', '小白', '入门', 'artist', 'creative', 'video', 'design', 'beginner'];
const DEVELOPER_TERMS = ['开发', '工程', '代码', '架构', 'agent', 'mcp', 'cli', 'react', 'github', 'developer', 'engineering', 'code'];
const CONTACT_TERMS = ['联系', '邮箱', '邮件', 'contact', 'email', 'reach'];
const PROFILE_TERMS = ['你是谁', '介绍自己', '个人信息', '背景', 'who are you', 'profile', 'background'];
const SKILL_TERMS = ['擅长', '技能', '能力', '会什么', 'skill', 'capability', 'good at'];

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'find_projects',
      description: 'Search the public portfolio and rank real projects for the visitor goal. Use this before recommending work.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The concrete visitor goal or technologies to search for.' },
          audience: { type: 'string', enum: ['artist', 'developer', 'auto'], description: 'The visitor knowledge path.' },
        },
        required: ['query'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_project',
      description: 'Read the public, localized facts for one portfolio project by its exact id.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'A project id returned by find_projects.' },
        },
        required: ['id'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_profile',
      description: 'Read the public, de-sensitized profile and capability summary.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_contact',
      description: 'Read the public contact channels shown on the portfolio.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    },
  },
] as const;

function inferAudience(query: string, requested: AgentAudience = 'auto'): Exclude<AgentAudience, 'auto'> {
  if (requested !== 'auto') return requested;
  const normalized = query.toLowerCase();
  const artistScore = ARTIST_TERMS.filter((term) => normalized.includes(term)).length;
  const developerScore = DEVELOPER_TERMS.filter((term) => normalized.includes(term)).length;
  return developerScore > artistScore ? 'developer' : 'artist';
}

function scoreProject(project: Project, query: string, audience: Exclude<AgentAudience, 'auto'>): number {
  const normalized = query.toLowerCase();
  const searchable = [project.title, project.subtitle, project.description, ...project.tags].join(' ').toLowerCase();
  const queryTerms = normalized.split(/[\s，。！？、,.!?/]+/).filter((term) => term.length > 1);
  let score = queryTerms.reduce((total, term) => total + (searchable.includes(term) ? 3 : 0), 0);

  if (audience === 'artist') {
    if (project.category === Category.VIDEO) score += 5;
    score += ARTIST_TERMS.filter((term) => normalized.includes(term) && searchable.includes(term)).length * 2;
  } else {
    if (project.category === Category.DEV) score += 5;
    score += DEVELOPER_TERMS.filter((term) => normalized.includes(term) && searchable.includes(term)).length * 2;
  }

  return score;
}

function findProjects(query: string, language: Language, audience: Exclude<AgentAudience, 'auto'>): Project[] {
  return PROJECTS[language]
    .map((project) => ({ project, score: scoreProject(project, query, audience) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ project }) => project);
}

function toPublicProject(project: Project): Record<string, unknown> {
  return {
    id: project.id,
    title: project.title,
    subtitle: project.subtitle,
    category: project.category,
    description: project.description,
    role: project.role,
    tags: project.tags,
    date: project.date,
    websiteUrl: project.websiteUrl,
    githubUrl: project.githubUrl,
    videoLinkUrl: project.videoLinkUrl,
  };
}

function buildLocalAnswer(
  projects: Project[],
  audience: Exclude<AgentAudience, 'auto'>,
  language: Language,
): string {
  const lead = projects[0];
  if (!lead) {
    return language === 'zh'
      ? '暂时没有匹配的作品。你可以换一个目标，例如“AI 视频入门”或“Agent 工程案例”。'
      : 'No matching work was found. Try a goal such as “AI video beginner” or “Agent engineering case”.';
  }

  if (language === 'zh') {
    const nextStep = audience === 'artist'
      ? '先看它的创作结果和制作步骤，不需要先理解代码。'
      : '先看技术栈、架构取舍与可运行链接，再深入实现细节。';
    return `建议从「${lead.title}」开始：${lead.subtitle}。${nextStep}`;
  }

  const nextStep = audience === 'artist'
    ? 'Start with the creative outcome and process; no coding knowledge is required.'
    : 'Start with the stack, architecture decisions, and working links before implementation details.';
  return `Start with “${lead.title}”: ${lead.subtitle}. ${nextStep}`;
}

function createLocalResult(
  query: string,
  language: Language,
  audience: Exclude<AgentAudience, 'auto'>,
): PortfolioAgentResult {
  const normalized = query.toLowerCase();
  const includesAny = (terms: string[]) => terms.some((term) => normalized.includes(term));

  if (includesAny(CONTACT_TERMS)) {
    return {
      mode: 'local',
      content: language === 'zh'
        ? '可以发邮件到 921693422@qq.com，或通过 GitHub @avabbbb 联系。'
        : 'Email 921693422@qq.com or reach out on GitHub at @avabbbb.',
      projectIds: [],
      trace: [{
        id: 'local-get-contact',
        name: 'get_contact',
        status: 'completed',
        summary: language === 'zh' ? '读取公开联系渠道' : 'Read public contact channels',
      }],
    };
  }

  if (includesAny(SKILL_TERMS)) {
    return {
      mode: 'local',
      content: language === 'zh'
        ? '他聚焦 AI-Native 产品、Agent/MCP 工程和 AI 视频生产工作流；开发侧以 React、TypeScript 为主，创作侧使用 ComfyUI、After Effects 等工具。'
        : 'He focuses on AI-native products, Agent/MCP engineering, and AI video workflows, using React and TypeScript for development and tools such as ComfyUI and After Effects for creation.',
      projectIds: [],
      trace: [{
        id: 'local-get-profile-skills',
        name: 'get_profile',
        status: 'completed',
        summary: language === 'zh' ? '读取公开能力资料' : 'Read public capability details',
      }],
    };
  }

  if (includesAny(PROFILE_TERMS)) {
    return {
      mode: 'local',
      content: language === 'zh'
        ? '这是 avabbbb 的作品导览 Agent。他是软件工程本科毕业生，现从事 AIGC 产研，公开作品覆盖 AI-Native 应用与创作视频合作。'
        : 'This is avabbbb’s portfolio guide. He is a Software Engineering graduate working in AIGC product engineering, with public work spanning AI-native applications and creative video collaboration.',
      projectIds: [],
      trace: [{
        id: 'local-get-profile',
        name: 'get_profile',
        status: 'completed',
        summary: language === 'zh' ? '读取公开且已脱敏的个人资料' : 'Read the public de-identified profile',
      }],
    };
  }

  const projects = findProjects(query, language, audience);
  return {
    mode: 'local',
    content: buildLocalAnswer(projects, audience, language),
    projectIds: projects.map((project) => project.id),
    trace: [{
      id: 'local-find-projects',
      name: 'find_projects',
      status: 'completed',
      summary: language === 'zh'
        ? `按${audience === 'artist' ? '创作小白' : 'AI 开发者'}视角匹配 ${projects.length} 个真实项目`
        : `Matched ${projects.length} real projects for the ${audience} path`,
    }],
  };
}

function getSystemPrompt(language: Language, audience: Exclude<AgentAudience, 'auto'>): string {
  const audienceRule = audience === 'artist'
    ? 'Explain outcomes and next actions in plain language. Do not assume coding knowledge.'
    : 'Prioritize architecture, stack, source links, constraints, and implementation evidence.';
  const localeRule = language === 'zh' ? 'Reply in concise Simplified Chinese.' : 'Reply in concise English.';

  return [
    'You are the AI-native guide for the avabbbb public portfolio.',
    'Use the supplied tools for every portfolio, profile, or contact fact. Never invent projects, metrics, links, employers, clients, or private details.',
    'Call find_projects before recommending work, then use get_project when detail is useful.',
    'If a tool reports an error or lacks a fact, say that the public portfolio does not provide it.',
    'Keep the final answer practical and short, mention exact project titles, and end with one useful next action.',
    audienceRule,
    localeRule,
  ].join(' ');
}

function parseArguments(raw: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(raw || '{}');
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Tool arguments must be an object.');
  }
  return parsed as Record<string, unknown>;
}

function assertShortString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} must be a non-empty string.`);
  return value.trim().slice(0, MAX_QUERY_LENGTH);
}

function executeTool(
  call: ModelToolCall,
  language: Language,
  fallbackAudience: Exclude<AgentAudience, 'auto'>,
): ToolExecution {
  const fail = (summary: string): ToolExecution => ({
    output: { ok: false, error: summary },
    projectIds: [],
    trace: { id: call.id, name: 'unsupported_tool', status: 'failed', summary },
  });

  try {
    const args = parseArguments(call.function.arguments);
    if (call.function.name === 'find_projects') {
      const query = assertShortString(args.query, 'query');
      const requestedAudience = args.audience;
      const audience = requestedAudience === 'artist' || requestedAudience === 'developer'
        ? requestedAudience
        : fallbackAudience;
      const projects = findProjects(query, language, audience);
      return {
        output: { ok: true, projects: projects.map(toPublicProject) },
        projectIds: projects.map((project) => project.id),
        trace: {
          id: call.id,
          name: 'find_projects',
          status: 'completed',
          summary: language === 'zh' ? `检索到 ${projects.length} 个站内项目` : `Found ${projects.length} portfolio projects`,
        },
      };
    }

    if (call.function.name === 'get_project') {
      const id = assertShortString(args.id, 'id');
      const project = PROJECTS[language].find((candidate) => candidate.id === id);
      if (!project) throw new Error(`Unknown project id: ${id}`);
      return {
        output: { ok: true, project: toPublicProject(project) },
        projectIds: [project.id],
        trace: {
          id: call.id,
          name: 'get_project',
          status: 'completed',
          summary: language === 'zh' ? `读取「${project.title}」公开资料` : `Read public details for “${project.title}”`,
        },
      };
    }

    if (call.function.name === 'get_profile') {
      const profile = language === 'zh'
        ? {
            identity: 'AIGC 产研工程师、软件工程本科毕业生、珠三角央企 AI 技术产品研发工程师',
            focus: ['AI-Native 产品', 'Agent 与 MCP 工程', 'AI 视频生产工作流'],
            privacy: '具体雇主、客户和内部项目名称不在公开资料中披露',
          }
        : {
            identity: 'AIGC product engineer, Software Engineering graduate, and AI product engineer at a Pearl River Delta state-owned enterprise',
            focus: ['AI-native products', 'Agent and MCP engineering', 'AI video production workflows'],
            privacy: 'Specific employer, client, and internal project names are not disclosed publicly',
          };
      return {
        output: { ok: true, profile },
        projectIds: [],
        trace: {
          id: call.id,
          name: 'get_profile',
          status: 'completed',
          summary: language === 'zh' ? '读取公开且已脱敏的个人资料' : 'Read the public de-identified profile',
        },
      };
    }

    if (call.function.name === 'get_contact') {
      return {
        output: {
          ok: true,
          contact: {
            email: '921693422@qq.com',
            github: 'https://github.com/avabbbb',
            bilibili: 'https://space.bilibili.com/1314275776',
          },
        },
        projectIds: [],
        trace: {
          id: call.id,
          name: 'get_contact',
          status: 'completed',
          summary: language === 'zh' ? '读取公开联系渠道' : 'Read public contact channels',
        },
      };
    }

    return fail(language === 'zh' ? `已拒绝未知工具：${call.function.name}` : `Rejected unknown tool: ${call.function.name}`);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Invalid tool arguments.';
    const knownName = TOOL_DEFINITIONS.some((tool) => tool.function.name === call.function.name)
      ? call.function.name as AgentToolName
      : 'unsupported_tool';
    return {
      output: { ok: false, error: detail },
      projectIds: [],
      trace: { id: call.id, name: knownName, status: 'failed', summary: detail },
    };
  }
}

function readAssistantMessage(data: unknown): ModelAssistantMessage {
  if (!data || typeof data !== 'object') throw new Error('Invalid model response.');
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== 'object') {
    throw new Error('Model response has no choices.');
  }
  const message = (choices[0] as { message?: unknown }).message;
  if (!message || typeof message !== 'object') throw new Error('Model response has no message.');
  return message as ModelAssistantMessage;
}

async function runModelAgent(
  input: RunPortfolioAgentInput,
  audience: Exclude<AgentAudience, 'auto'>,
): Promise<PortfolioAgentResult> {
  const messages: ModelRequestMessage[] = [
    { role: 'system', content: getSystemPrompt(input.language, audience) },
    ...input.messages.slice(-MAX_HISTORY_MESSAGES).map((message) => ({
      role: message.role,
      content: message.content.slice(0, 2_000),
    })),
  ];
  const trace: AgentTraceStep[] = [];
  const projectIds = new Set<string>();
  let toolRounds = 0;

  while (toolRounds <= MAX_TOOL_ROUNDS) {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        tools: TOOL_DEFINITIONS,
        tool_choice: 'auto',
        max_tokens: 600,
        temperature: 0.2,
      }),
      signal: input.signal,
    });

    if (!response.ok) throw new Error(`Model request failed with status ${response.status}.`);
    const assistant = readAssistantMessage(await response.json());
    const content = typeof assistant.content === 'string' ? assistant.content.trim() : '';
    const toolCalls = Array.isArray(assistant.tool_calls) ? assistant.tool_calls : [];

    if (content && toolCalls.length === 0) {
      return { mode: 'model', content, projectIds: [...projectIds], trace };
    }
    if (toolCalls.length === 0 || toolRounds === MAX_TOOL_ROUNDS) break;

    messages.push({ role: 'assistant', content: assistant.content ?? null, tool_calls: toolCalls });
    for (const call of toolCalls) {
      const execution = executeTool(call, input.language, audience);
      execution.projectIds.forEach((id) => projectIds.add(id));
      trace.push(execution.trace);
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(execution.output) });
    }
    toolRounds += 1;
  }

  throw new Error('The model did not finish within the tool-call limit.');
}

export async function runPortfolioAgent(input: RunPortfolioAgentInput): Promise<PortfolioAgentResult> {
  const query = [...input.messages].reverse().find((message) => message.role === 'user')?.content.trim() ?? '';
  const audience = inferAudience(query, input.audience);
  const localResult = createLocalResult(query, input.language, audience);
  const apiKey = input.apiKey?.trim();

  if (!apiKey) return localResult;

  try {
    return await runModelAgent({ ...input, apiKey }, audience);
  } catch (error) {
    if (input.signal?.aborted) throw error;
    return localResult;
  }
}
