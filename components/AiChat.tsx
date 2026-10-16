import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Bot, Check, Send, Settings2, Sparkles, User, Wrench, X } from 'lucide-react';
import { PROJECTS } from '../constants';
import { AgentAudience, AgentTraceStep, runPortfolioAgent } from '../src/agent/portfolioAgent';
import { Language } from '../types';
import { ContactWidget } from './widgets/ContactWidget';
import { ProfileWidget } from './widgets/ProfileWidget';
import { ProjectDetailWidget } from './widgets/ProjectDetailWidget';
import { ProjectsWidget } from './widgets/ProjectsWidget';
import { SkillsWidget } from './widgets/SkillsWidget';
import { detectProjectDetail, detectWidget, shouldShowWidget, WidgetType } from './widgets/widgetDetector';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  widget?: WidgetType;
  projectId?: string;
  trace?: AgentTraceStep[];
  mode?: 'local' | 'model';
}

interface AiChatProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onNavigateToPortfolio?: () => void;
  onNavigateToProject?: (projectId: string) => void;
}

type VisitorAudience = Exclude<AgentAudience, 'auto'>;

const API_KEY_SESSION_KEY = 'avabbbb:deepseek-api-key:v1';

const QUICK_QUESTIONS: Record<Language, Record<VisitorAudience, string[]>> = {
  zh: {
    artist: ['我是创作小白，从哪里开始？', '推荐一个 AI 视频案例', '你擅长什么？'],
    developer: ['看 Agent / MCP 工程案例', '推荐一个 React 项目', '怎么联系你？'],
  },
  en: {
    artist: ['I am a creative beginner. Where do I start?', 'Recommend an AI video case', 'What are your skills?'],
    developer: ['Show an Agent / MCP case', 'Recommend a React project', 'How can I contact you?'],
  },
};

function getSessionApiKey(): string {
  try {
    return sessionStorage.getItem(API_KEY_SESSION_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveSessionApiKey(key: string): void {
  try {
    if (key.trim()) sessionStorage.setItem(API_KEY_SESSION_KEY, key.trim());
    else sessionStorage.removeItem(API_KEY_SESSION_KEY);
  } catch {
    // The agent still works locally when storage is unavailable.
  }
}

function messageId(role: Message['role']): string {
  return `${role}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const AiChat: React.FC<AiChatProps> = ({
  isOpen,
  onClose,
  language,
  onNavigateToPortfolio,
  onNavigateToProject,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [audience, setAudience] = useState<VisitorAudience>('artist');
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [apiKey, setApiKey] = useState(getSessionApiKey);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    messagesEndRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'end' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isOpen) return undefined;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      if (window.innerWidth >= 768) inputRef.current?.focus();
      else dialogRef.current?.focus();
    }, 80);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], summary, [tabindex]:not([tabindex="-1"])',
      )].filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      requestRef.current?.abort();
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  const sendMessage = async (content: string) => {
    const question = content.trim();
    if (!question || inFlightRef.current) return;

    inFlightRef.current = true;
    setIsLoading(true);
    setInput('');

    const projects = PROJECTS[language];
    const detectedProjectId = detectProjectDetail(question, projects);
    const detectedWidget = detectWidget(question, language);
    const recentWidgets = messages.map((message) => message.widget ?? null);
    const widget = shouldShowWidget(detectedWidget, recentWidgets) ? detectedWidget : null;
    const userMessage: Message = {
      id: messageId('user'),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    try {
      const result = await runPortfolioAgent({
        language,
        audience,
        apiKey: apiKey.trim() || undefined,
        signal: controller.signal,
        messages: nextMessages
          .filter((message) => message.role === 'user' || message.role === 'assistant')
          .slice(-10)
          .map((message) => ({ role: message.role, content: message.content })),
      });
      const projectId = detectedProjectId ?? result.projectIds[0];
      setMessages((current) => [...current, {
        id: messageId('assistant'),
        role: 'assistant',
        content: result.content,
        timestamp: new Date(),
        widget: projectId ? null : (widget ?? undefined),
        projectId,
        trace: result.trace,
        mode: result.mode,
      }]);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setMessages((current) => [...current, {
          id: messageId('assistant'),
          role: 'assistant',
          content: language === 'zh'
            ? '这次请求被中断了。你可以重试，或直接使用上方快捷问题。'
            : 'The request was interrupted. Try again or use a quick question above.',
          timestamp: new Date(),
        }]);
      }
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      inFlightRef.current = false;
      setIsLoading(false);
      if (window.innerWidth >= 768) window.setTimeout(() => inputRef.current?.focus(), 80);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('921693422@qq.com');
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = '921693422@qq.com';
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
    setCopySuccess(true);
    window.setTimeout(() => setCopySuccess(false), 2_000);
  };

  const renderWidget = (widgetType: WidgetType, projectId?: string) => {
    const projects = PROJECTS[language];
    if (projectId) {
      const project = projects.find((candidate) => candidate.id === projectId);
      if (project) {
        return (
          <ProjectDetailWidget
            language={language}
            project={project}
            onViewProject={() => {
              onNavigateToProject?.(projectId);
              onClose();
            }}
          />
        );
      }
    }

    if (!widgetType) return null;
    switch (widgetType) {
      case 'profile':
        return <ProfileWidget language={language} onCopyEmail={() => void handleCopyEmail()} />;
      case 'projects':
        return (
          <ProjectsWidget
            language={language}
            projects={projects.slice(0, 3)}
            onProjectClick={(id) => {
              onNavigateToProject?.(id);
              onClose();
            }}
            onViewAll={() => {
              onNavigateToPortfolio?.();
              onClose();
            }}
          />
        );
      case 'contact':
        return <ContactWidget language={language} onCopyEmail={() => void handleCopyEmail()} />;
      case 'skills':
        return <SkillsWidget language={language} />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const t = language === 'zh'
    ? {
        title: 'AI 作品导览',
        description: '选择你的身份，Agent 会调用站内工具找到有依据的答案。',
        artist: '创作小白',
        developer: 'AI 开发者',
        localReady: '本地工具已就绪 · Key 可选',
        modelReady: '模型决策 + 站内工具',
        settings: '模型设置',
        close: '关闭 AI 导览',
        apiLabel: 'DeepSeek API Key',
        apiPlaceholder: '输入 DeepSeek API Key',
        save: '应用',
        remove: '清除',
        keyNote: 'Key 仅保留到本标签页关闭；模型模式会直接发送给 DeepSeek，不经过本站服务器。',
        welcome: '你想从哪条路径了解？',
        artistHelp: '我会用创作结果、步骤和工具解释，不要求编程基础。',
        developerHelp: '我会优先展示架构、技术栈、源码和工程取舍。',
        trace: '查看 Agent 执行轨迹',
        local: '本地',
        model: '模型',
        loading: 'Agent 正在检索站内资料',
        input: '告诉我你的目标…',
        inputLabel: '向 AI 作品导览提问',
        send: '发送问题',
        notice: '回答仅基于公开站内资料；敏感信息不会由 Agent 披露。',
      }
    : {
        title: 'AI Portfolio Guide',
        description: 'Choose your path. The agent uses portfolio tools to find grounded answers.',
        artist: 'Creative beginner',
        developer: 'AI developer',
        localReady: 'Local tools ready · key optional',
        modelReady: 'Model decisions + portfolio tools',
        settings: 'Model settings',
        close: 'Close AI guide',
        apiLabel: 'DeepSeek API Key',
        apiPlaceholder: 'Enter a DeepSeek API Key',
        save: 'Apply',
        remove: 'Clear',
        keyNote: 'The key lasts only for this tab. Model mode sends it directly to DeepSeek, not to this site’s server.',
        welcome: 'Which path should we explore?',
        artistHelp: 'I explain outcomes, steps, and tools without assuming coding knowledge.',
        developerHelp: 'I prioritize architecture, stack, source code, and engineering trade-offs.',
        trace: 'View agent trace',
        local: 'Local',
        model: 'Model',
        loading: 'Agent is searching portfolio evidence',
        input: 'Tell me your goal…',
        inputLabel: 'Ask the AI portfolio guide',
        send: 'Send question',
        notice: 'Answers use public portfolio data only; the agent will not disclose sensitive information.',
      };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-8">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-primary/70 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onMouseDown={onClose}
      />

      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-guide-title"
        aria-describedby="ai-guide-description"
        tabIndex={-1}
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30, mass: 0.8 }}
        className="relative flex h-[min(760px,calc(100dvh-24px))] w-full max-w-2xl flex-col overflow-hidden border-2 border-primary bg-cream shadow-[12px_12px_0_rgba(0,0,0,0.3)] focus:outline-none"
      >
        <header className="flex items-center justify-between gap-3 border-b-2 border-primary px-4 py-3 md:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-primary text-cream" aria-hidden="true">
              <Bot size={20} />
            </div>
            <div className="min-w-0">
              <h2 id="ai-guide-title" className="truncate text-sm font-black uppercase tracking-wide text-primary">{t.title}</h2>
              <p className="truncate font-mono text-[10px] text-primary/85">
                {apiKey.trim() ? t.modelReady : t.localReady}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              aria-label={t.settings}
              aria-expanded={showApiKeyInput}
              onClick={() => setShowApiKeyInput((visible) => !visible)}
              className="flex h-11 w-11 items-center justify-center text-primary/70 transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary"
            >
              <Settings2 size={18} />
            </button>
            <button
              type="button"
              aria-label={t.close}
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center text-primary/70 transition-colors hover:bg-primary hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {showApiKeyInput && (
          <section className="border-b border-primary/20 bg-primary/[0.04] px-4 py-3 md:px-5" aria-label={t.settings}>
            <label htmlFor="deepseek-api-key" className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-wide text-primary/85">
              {t.apiLabel}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="deepseek-api-key"
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={t.apiPlaceholder}
                autoComplete="off"
                spellCheck={false}
                className="min-h-11 flex-1 border border-primary/30 bg-cream px-3 font-mono text-xs text-primary outline-none transition-colors placeholder:text-primary/35 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    saveSessionApiKey(apiKey);
                    setShowApiKeyInput(false);
                  }}
                  className="min-h-11 flex-1 bg-primary px-4 text-xs font-bold text-cream transition-colors hover:bg-[#E63946] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:flex-none"
                >
                  {t.save}
                </button>
                {apiKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setApiKey('');
                      saveSessionApiKey('');
                    }}
                    className="min-h-11 flex-1 border border-primary/30 px-4 text-xs font-bold text-primary transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:flex-none"
                  >
                    {t.remove}
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-primary/85">{t.keyNote}</p>
          </section>
        )}

        <section className="border-b border-primary/15 px-4 py-3 md:px-5" aria-label={language === 'zh' ? '访客路径' : 'Visitor path'}>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label={language === 'zh' ? '选择访客路径' : 'Choose visitor path'}>
            {(['artist', 'developer'] as const).map((option) => {
              const selected = audience === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setAudience(option)}
                  className={`min-h-11 border px-3 text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selected ? 'border-primary bg-primary text-cream' : 'border-primary/25 text-primary hover:border-primary hover:bg-primary/5'}`}
                >
                  {option === 'artist' ? t.artist : t.developer}
                </button>
              );
            })}
          </div>
        </section>

        <div
          className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4 md:p-5"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-busy={isLoading}
        >
          {messages.length === 0 && (
            <div className="mx-auto flex max-w-lg flex-col items-center py-5 text-center md:py-8">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10" aria-hidden="true">
                <Sparkles size={25} className="text-primary/85" />
              </div>
              <h3 className="mb-2 text-base font-black text-primary">{t.welcome}</h3>
              <p id="ai-guide-description" className="mb-5 max-w-md text-xs leading-relaxed text-primary/85">
                {t.description}<br />{audience === 'artist' ? t.artistHelp : t.developerHelp}
              </p>
              <div className="grid w-full gap-2 sm:grid-cols-3">
                {QUICK_QUESTIONS[language][audience].map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => void sendMessage(question)}
                    className="min-h-11 border border-primary/25 px-3 py-2 text-xs leading-snug text-primary transition-[border-color,background-color,color,transform] hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <article key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center ${message.role === 'user' ? 'bg-[#C62838]' : 'bg-primary'}`} aria-hidden="true">
                {message.role === 'user' ? <User size={14} className="text-cream" /> : <Bot size={14} className="text-cream" />}
              </div>
              <div className={`max-w-[calc(100%-44px)] md:max-w-[82%] ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block px-4 py-2.5 text-left text-sm leading-relaxed whitespace-pre-wrap ${message.role === 'user' ? 'bg-[#C62838] text-cream' : 'bg-primary/10 text-primary'}`}>
                  {message.content}
                </div>

                {message.role === 'assistant' && message.trace && message.trace.length > 0 && (
                  <details className="mt-2 border border-primary/15 bg-cream text-left">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 font-mono text-[10px] font-bold uppercase tracking-wide text-primary transition-colors hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary">
                      <Wrench size={12} aria-hidden="true" />
                      <span>{t.trace} · {message.mode === 'model' ? t.model : t.local}</span>
                    </summary>
                    <ol className="space-y-2 border-t border-primary/10 px-3 py-2.5">
                      {message.trace.map((step) => (
                        <li key={step.id} className="flex items-start gap-2 text-[11px] leading-relaxed text-primary/80">
                          {step.status === 'completed'
                            ? <Check size={12} className="mt-0.5 shrink-0 text-[#07883f]" aria-hidden="true" />
                            : <X size={12} className="mt-0.5 shrink-0 text-[#E63946]" aria-hidden="true" />}
                          <span>{step.summary}</span>
                        </li>
                      ))}
                    </ol>
                  </details>
                )}

                {message.role === 'assistant' && (message.widget || message.projectId) && (
                  <div className="mt-2 text-left">{renderWidget(message.widget ?? null, message.projectId)}</div>
                )}

                <time className="mt-1 block font-mono text-[10px] text-primary/85">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
            </article>
          ))}

          {isLoading && (
            <div className="flex gap-3" aria-label={t.loading}>
              <div className="flex h-8 w-8 items-center justify-center bg-primary" aria-hidden="true"><Bot size={14} className="text-cream" /></div>
              <div className="flex min-h-11 items-center gap-2 bg-primary/10 px-4 text-xs text-primary/85">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary/70" />
                </span>
                {t.loading}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t-2 border-primary p-3 md:p-4">
          <label htmlFor="ai-guide-input" className="sr-only">{t.inputLabel}</label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              id="ai-guide-input"
              name="portfolio-question"
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={500}
              autoComplete="off"
              placeholder={t.input}
              className="min-h-12 min-w-0 flex-1 border-2 border-transparent bg-primary/5 px-4 text-sm text-primary outline-none transition-colors placeholder:text-primary/70 focus:border-primary"
            />
            <button
              type="submit"
              aria-label={t.send}
              disabled={!input.trim() || isLoading}
              className="flex h-12 w-12 shrink-0 items-center justify-center bg-primary text-cream transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[#E63946] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="mt-2 text-center font-mono text-[9px] leading-relaxed text-primary/85">{t.notice}</p>
          <span className="sr-only" aria-live="polite">{copySuccess ? (language === 'zh' ? '邮箱已复制' : 'Email copied') : ''}</span>
        </form>
      </motion.div>
    </div>,
    document.body,
  );
};
