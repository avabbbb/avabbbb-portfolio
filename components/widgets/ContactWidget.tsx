import React from 'react';
import { Mail, Github, ExternalLink } from 'lucide-react';
import { Language } from '../../types';

interface ContactWidgetProps {
  language: Language;
  onCopyEmail?: () => void;
}

export const ContactWidget: React.FC<ContactWidgetProps> = ({ language, onCopyEmail }) => {
  const content = {
    zh: {
      title: '联系方式',
      email: '邮箱',
      github: 'GitHub',
      redbook: '小红书',
      netease: '网易云音乐',
    },
    en: {
      title: 'Contact Info',
      email: 'Email',
      github: 'GitHub',
      redbook: 'RedNote',
      netease: 'NetEase Music',
    },
  };

  const t = content[language];

  const contacts = [
    {
      icon: <Mail size={14} />,
      label: t.email,
      value: '921693422@qq.com',
      action: onCopyEmail,
      color: 'text-primary',
    },
    {
      icon: <Github size={14} />,
      label: t.github,
      value: '@avabbbb',
      action: () => window.open('https://github.com/avabbbb', '_blank'),
      color: 'text-primary',
    },
    {
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm-2-8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
        </svg>
      ),
      label: t.redbook,
      value: '@avabbbb',
      action: () => window.open('https://www.xiaohongshu.com/user/profile/5ef7232b00000000010069bf', '_blank'),
      color: 'text-[#EC4048]',
    },
  ];

  return (
    <div className="border-2 border-primary bg-cream my-2 animate-fade-in">
      {/* Header */}
      <div className="px-3 py-2 border-b-2 border-primary bg-primary/5 flex items-center justify-between">
        <span className="text-[10px] font-mono text-primary/80 uppercase tracking-wider">{t.title}</span>
        <div className="w-4 h-4 bg-[#FFD700]" />
      </div>

      {/* Contact List */}
      <div className="divide-y divide-primary/10">
        {contacts.map((contact, index) => (
          <button
            type="button"
            key={index}
            className="flex min-h-11 w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary group"
            onClick={contact.action}
            aria-label={`${contact.label}: ${contact.value}`}
          >
            <div className="flex items-center gap-2">
              <div className={`${contact.color} opacity-40 group-hover:opacity-100 transition-opacity`}>
                {contact.icon}
              </div>
              <div>
                <div className="text-xs font-bold text-primary group-hover:text-[#E63946] transition-colors">
                  {contact.label}
                </div>
                <div className="text-[10px] text-primary/80 font-mono">
                  {contact.value}
                </div>
              </div>
            </div>
            <ExternalLink size={10} className="text-primary/20 group-hover:text-[#E63946] transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};
