import React from 'react';
import { Mail, Briefcase } from 'lucide-react';
import { Language } from '../../types';

interface ProfileWidgetProps {
  language: Language;
  onCopyEmail?: () => void;
}

export const ProfileWidget: React.FC<ProfileWidgetProps> = ({ language, onCopyEmail }) => {
  const content = {
    zh: {
      title: '个人名片',
      name: 'avabbbb',
      status: 'AIGC产研工程师',
      education: '华南师范大学 · 软件工程',
      email: '邮箱',
      copyBtn: '复制',
    },
    en: {
      title: 'Profile Card',
      name: 'avabbbb',
      status: 'AIGC R&D Engineer',
      education: 'SCNU · Software Engineering',
      email: 'Email',
      copyBtn: 'Copy',
    },
  };

  const t = content[language];

  return (
    <div className="border-2 border-primary bg-cream my-2 animate-fade-in">
      {/* Header */}
      <div className="px-3 py-2 border-b-2 border-primary bg-primary/5 flex items-center justify-between">
        <span className="text-[10px] font-mono text-primary/80 uppercase tracking-wider">{t.title}</span>
        <div className="w-4 h-4 bg-[#E63946]" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name & Status */}
        <div>
          <h3 className="text-lg font-black text-primary mb-1">{t.name}</h3>
          <div className="flex items-center gap-2">
            <Briefcase size={12} className="text-primary/40" />
            <span className="text-xs text-primary/80">{t.status}</span>
          </div>
        </div>

        {/* Education */}
        <div className="text-xs text-primary/80 font-mono">
          {t.education}
        </div>

        {/* Email */}
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between border border-primary/20 bg-primary/5 px-3 py-2 text-left transition-colors hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary group"
          onClick={onCopyEmail}
          aria-label={`${t.copyBtn} 921693422@qq.com`}
        >
          <div className="flex items-center gap-2">
            <Mail size={12} className="text-primary/40 group-hover:text-primary" />
            <span className="text-xs text-primary/80 group-hover:text-primary font-mono">921693422@qq.com</span>
          </div>
          <span className="text-[10px] text-primary/80 group-hover:text-primary uppercase">{t.copyBtn}</span>
        </button>
      </div>
    </div>
  );
};
