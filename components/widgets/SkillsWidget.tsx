import React from 'react';
import { Language } from '../../types';

interface SkillsWidgetProps {
  language: Language;
}

export const SkillsWidget: React.FC<SkillsWidgetProps> = ({ language }) => {
  const content = {
    zh: {
      title: '技能专长',
      design: '设计工具',
      dev: '开发工具',
      modeling: '3D 建模',
    },
    en: {
      title: 'Skills',
      design: 'Design',
      dev: 'Development',
      modeling: '3D Modeling',
    },
  };

  const t = content[language];

  const skills = {
    design: ['After Effects', 'Photoshop', 'Figma', 'ComfyUI', 'TouchDesigner'],
    modeling: ['Cinema 4D', 'Blender'],
    dev: ['React', 'TypeScript', 'Unity', 'C#', 'N8N'],
  };

  const categories = [
    { key: 'design', label: t.design, color: 'bg-[#E63946]' },
    { key: 'modeling', label: t.modeling, color: 'bg-[#1E40AF]' },
    { key: 'dev', label: t.dev, color: 'bg-[#FFD700]' },
  ];

  return (
    <div className="border-2 border-primary bg-cream my-2 animate-fade-in">
      {/* Header */}
      <div className="px-3 py-2 border-b-2 border-primary bg-primary/5 flex items-center justify-between">
        <span className="text-[10px] font-mono text-primary/80 uppercase tracking-wider">{t.title}</span>
        <div className="w-4 h-4 bg-[#07C160]" />
      </div>

      {/* Skills Grid */}
      <div className="p-3 space-y-3">
        {categories.map((category) => (
          <div key={category.key}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 ${category.color}`} />
              <span className="text-[10px] font-bold text-primary/80 uppercase tracking-wide">
                {category.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skills[category.key as keyof typeof skills].map((skill, index) => (
                <span
                  key={index}
                  className="text-[10px] px-2 py-1 border border-primary/20 text-primary/80 hover:border-primary hover:text-primary hover:bg-primary/5 transition-[border-color,background-color,color] font-mono"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
