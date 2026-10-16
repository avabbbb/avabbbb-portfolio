import React from 'react';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { Language, Project } from '../../types';
import { toJsDelivr } from '../../src/utils/cdn';

interface ProjectsWidgetProps {
  language: Language;
  projects: Project[];
  onProjectClick?: (projectId: string) => void;
  onViewAll?: () => void;
}

export const ProjectsWidget: React.FC<ProjectsWidgetProps> = ({ 
  language, 
  projects, 
  onProjectClick,
  onViewAll 
}) => {
  const content = {
    zh: {
      title: '精选作品',
      viewAll: '查看全部作品',
    },
    en: {
      title: 'Featured Projects',
      viewAll: 'View All Projects',
    },
  };

  const t = content[language];

  return (
    <div className="border-2 border-primary bg-cream my-2 animate-fade-in">
      {/* Header */}
      <div className="px-3 py-2 border-b-2 border-primary bg-primary/5 flex items-center justify-between">
        <span className="text-[10px] font-mono text-primary/80 uppercase tracking-wider">{t.title}</span>
        <div className="w-4 h-4 bg-[#1E40AF]" />
      </div>

      {/* Projects List */}
      <div className="divide-y divide-primary/10">
        {projects.slice(0, 3).map((project, index) => (
          <button
            type="button"
            key={project.id}
            className="w-full p-3 text-left transition-colors hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary group"
            onClick={() => onProjectClick?.(project.id)}
          >
            <div className="flex gap-3">
              {/* Thumbnail */}
              {project.image && (
                <div className="w-16 h-16 flex-shrink-0 bg-primary/10 border border-primary/20 overflow-hidden">
                  <img 
                    src={toJsDelivr(project.image)} 
                    alt={project.title}
                    width="64"
                    height="64"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-bold text-primary group-hover:text-[#E63946] transition-colors line-clamp-1">
                    {project.title}
                  </h4>
                  <ExternalLink size={12} className="text-primary/30 group-hover:text-[#E63946] flex-shrink-0 mt-0.5" />
                </div>
                <p className="text-[10px] text-primary/80 line-clamp-2 mb-1">
                  {project.subtitle}
                </p>
                <div className="flex flex-wrap gap-1">
                  {project.tags.slice(0, 2).map((tag, i) => (
                    <span 
                      key={i}
                    className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary/75 font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer - View All */}
      {onViewAll && (
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between border-t-2 border-primary bg-primary px-3 py-2 text-cream transition-colors hover:bg-[#E63946] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-cream group"
          onClick={onViewAll}
        >
          <span className="text-xs font-bold uppercase tracking-wide">{t.viewAll}</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      )}
    </div>
  );
};
