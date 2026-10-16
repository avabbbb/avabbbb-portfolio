import React, { useState } from 'react';
import { Category, ContentSection, Language } from '../types';
import { X, Plus, ChevronUp, ChevronDown, Trash2, Copy, Check } from 'lucide-react';

// 编辑器使用的项目数据结构（双语）
export interface EditableProject {
  id: string;
  common: {
    category: string;
    image: string;
    bilibiliId?: string;
    youtubeId?: string;
    videoUrl?: string;
    videoLinkUrl?: string;
    figmaUrl?: string;
    websiteUrl?: string;
    githubUrl?: string;
    date?: string;
    notes?: string;
  };
  zh: {
    title: string;
    subtitle: string;
    description: string;
    role: string;
    tags: string[];
    awards: string[];
    sections: ContentSection[];
  };
  en: {
    title: string;
    subtitle: string;
    description: string;
    role: string;
    tags: string[];
    awards: string[];
    sections: ContentSection[];
  };
}

interface ProjectEditorProps {
  project: EditableProject;
  language: Language;
  onSave: (project: EditableProject) => void;
  onCancel: () => void;
  isNew?: boolean;
}

const CATEGORY_OPTIONS = [
  { value: 'Motion', labelZh: '动态影像', labelEn: 'Media' },
  { value: 'Development', labelZh: '应用开发', labelEn: 'Development' },
];

// 创建空白项目模板
export const createEmptyProject = (id: string): EditableProject => ({
  id,
  common: {
    category: 'Motion',
    image: '[封面图占位符]',
    date: new Date().toISOString().slice(0, 7),
  },
  zh: {
    title: '新作品标题',
    subtitle: '副标题',
    description: '作品描述...',
    role: '角色',
    tags: [],
    awards: [],
    sections: [],
  },
  en: {
    title: 'New Project Title',
    subtitle: 'Subtitle',
    description: 'Project description...',
    role: 'Role',
    tags: [],
    awards: [],
    sections: [],
  },
});

export const ProjectEditor: React.FC<ProjectEditorProps> = ({
  project: initialProject,
  language,
  onSave,
  onCancel,
  isNew = false,
}) => {
  const [project, setProject] = useState<EditableProject>(initialProject);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'zh' | 'en'>('zh');

  const currentLang = project[activeTab];

  // 更新通用字段
  const updateCommon = (field: string, value: string) => {
    setProject(prev => ({
      ...prev,
      common: { ...prev.common, [field]: value }
    }));
  };

  // 更新语言特定字段
  const updateLang = (lang: 'zh' | 'en', field: string, value: string | string[]) => {
    setProject(prev => ({
      ...prev,
      [lang]: { ...prev[lang], [field]: value }
    }));
  };

  // 添加标签
  const addTag = (lang: 'zh' | 'en') => {
    const newTag = lang === 'zh' ? '新标签' : 'New Tag';
    updateLang(lang, 'tags', [...project[lang].tags, newTag]);
  };

  // 删除标签
  const removeTag = (lang: 'zh' | 'en', index: number) => {
    updateLang(lang, 'tags', project[lang].tags.filter((_, i) => i !== index));
  };

  // 更新标签
  const updateTag = (lang: 'zh' | 'en', index: number, value: string) => {
    const newTags = [...project[lang].tags];
    newTags[index] = value;
    updateLang(lang, 'tags', newTags);
  };

  // 添加奖项
  const addAward = (lang: 'zh' | 'en') => {
    const newAward = lang === 'zh' ? '新奖项' : 'New Award';
    updateLang(lang, 'awards', [...project[lang].awards, newAward]);
  };

  // 删除奖项
  const removeAward = (lang: 'zh' | 'en', index: number) => {
    updateLang(lang, 'awards', project[lang].awards.filter((_, i) => i !== index));
  };

  // 更新奖项
  const updateAward = (lang: 'zh' | 'en', index: number, value: string) => {
    const newAwards = [...project[lang].awards];
    newAwards[index] = value;
    updateLang(lang, 'awards', newAwards);
  };

  // 添加内容块
  const addSection = (lang: 'zh' | 'en', type: 'text' | 'gallery' | 'video') => {
    const newSection: ContentSection = type === 'text'
      ? { type: 'text', title: lang === 'zh' ? '新段落' : 'New Section', content: '' }
      : type === 'gallery'
      ? { type: 'gallery', title: lang === 'zh' ? '图片展示' : 'Gallery', images: ['[图片占位符]'], layout: 'full' }
      : { type: 'video', title: lang === 'zh' ? '视频' : 'Video', bilibiliId: '' };
    
    updateLang(lang, 'sections', [...project[lang].sections, newSection] as unknown as string[]);
  };

  // 删除内容块
  const removeSection = (lang: 'zh' | 'en', index: number) => {
    updateLang(lang, 'sections', project[lang].sections.filter((_, i) => i !== index) as unknown as string[]);
  };

  // 移动内容块
  const moveSection = (lang: 'zh' | 'en', index: number, direction: 'up' | 'down') => {
    const sections = [...project[lang].sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
    updateLang(lang, 'sections', sections as unknown as string[]);
  };

  // 更新内容块
  const updateSection = (lang: 'zh' | 'en', index: number, updates: Partial<ContentSection>) => {
    const sections = [...project[lang].sections];
    sections[index] = { ...sections[index], ...updates } as ContentSection;
    updateLang(lang, 'sections', sections as unknown as string[]);
  };

  // 导出 JSON
  const exportJSON = () => {
    const json = JSON.stringify(project, null, 2);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 删除作品（导出删除指令）
  const handleDelete = () => {
    const confirmMsg = language === 'zh' 
      ? `确定要删除作品「${project.zh.title}」吗？\n\n删除指令将复制到剪贴板，请发给开发者处理。`
      : `Are you sure you want to delete "${project.en.title}"?\n\nDelete instruction will be copied to clipboard.`;
    
    if (confirm(confirmMsg)) {
      const deleteInstruction = `【删除作品请求】\nID: ${project.id}\n中文标题: ${project.zh.title}\n英文标题: ${project.en.title}\n分类: ${project.common.category}`;
      navigator.clipboard.writeText(deleteInstruction);
      alert(language === 'zh' ? '删除指令已复制，请发给开发者处理！' : 'Delete instruction copied! Please send to developer.');
      onCancel();
    }
  };

  return (
    <div className="bg-cream">
      {/* 顶部工具栏 */}
      <div className="sticky top-0 z-10 bg-cream border-b border-primary/20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-primary">
            {isNew ? (language === 'zh' ? '新建作品' : 'New Project') : (language === 'zh' ? '编辑作品' : 'Edit Project')}
          </span>
          <span className="text-xs text-primary/70">ID: {project.id}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* 删除按钮 - 只在编辑现有作品时显示 */}
          {!isNew && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
              {language === 'zh' ? '删除' : 'Delete'}
            </button>
          )}
          <button
            onClick={exportJSON}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? (language === 'zh' ? '已复制' : 'Copied') : (language === 'zh' ? '导出JSON' : 'Export JSON')}
          </button>
          <button
            onClick={() => onSave(project)}
            className="px-3 py-1.5 text-sm bg-primary text-cream hover:bg-primary/90 transition-colors"
          >
            {language === 'zh' ? '保存' : 'Save'}
          </button>
          <button
            onClick={onCancel}
            className="p-1.5 text-primary/70 hover:text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 通用信息 */}
        <div className="bg-white border border-primary/10 p-4">
          <h3 className="font-bold text-primary mb-4">{language === 'zh' ? '通用信息' : 'Common Info'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-primary/70 mb-1">{language === 'zh' ? '分类' : 'Category'}</label>
              <select
                value={project.common.category}
                onChange={(e) => updateCommon('category', e.target.value)}
                className="w-full px-3 py-2 border border-primary/20 bg-cream text-sm"
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {language === 'zh' ? opt.labelZh : opt.labelEn}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-primary/70 mb-1">{language === 'zh' ? '日期' : 'Date'}</label>
              <input
                type="text"
                value={project.common.date || ''}
                onChange={(e) => updateCommon('date', e.target.value)}
                placeholder="2024-06"
                className="w-full px-3 py-2 border border-primary/20 bg-cream text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-primary/70 mb-1">{language === 'zh' ? '封面图URL' : 'Cover Image URL'}</label>
              <input
                type="text"
                value={project.common.image}
                onChange={(e) => updateCommon('image', e.target.value)}
                className="w-full px-3 py-2 border border-primary/20 bg-cream text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-primary/70 mb-1">{language === 'zh' ? '视频直链 (mp4)' : 'Video URL (mp4)'}</label>
              <input
                type="text"
                value={project.common.videoUrl || ''}
                onChange={(e) => updateCommon('videoUrl', e.target.value)}
                placeholder="https://cdn.jsdelivr.net/gh/xxx/video.mp4"
                className="w-full px-3 py-2 border border-primary/20 bg-cream text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-primary/70 mb-1">{language === 'zh' ? 'B站视频ID (备用)' : 'Bilibili ID (fallback)'}</label>
              <input
                type="text"
                value={project.common.bilibiliId || ''}
                onChange={(e) => updateCommon('bilibiliId', e.target.value)}
                placeholder="BV1xxxxx"
                className="w-full px-3 py-2 border border-primary/20 bg-cream text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-primary/70 mb-1">YouTube ID</label>
              <input
                type="text"
                value={project.common.youtubeId || ''}
                onChange={(e) => updateCommon('youtubeId', e.target.value)}
                placeholder="JWq0vW7Y26Y"
                className="w-full px-3 py-2 border border-primary/20 bg-cream text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-primary/70 mb-1">Figma URL</label>
              <input
                type="text"
                value={project.common.figmaUrl || ''}
                onChange={(e) => updateCommon('figmaUrl', e.target.value)}
                className="w-full px-3 py-2 border border-primary/20 bg-cream text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-primary/70 mb-1">Website URL</label>
              <input
                type="text"
                value={project.common.websiteUrl || ''}
                onChange={(e) => updateCommon('websiteUrl', e.target.value)}
                className="w-full px-3 py-2 border border-primary/20 bg-cream text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-primary/70 mb-1">GitHub URL</label>
              <input
                type="text"
                value={project.common.githubUrl || ''}
                onChange={(e) => updateCommon('githubUrl', e.target.value)}
                className="w-full px-3 py-2 border border-primary/20 bg-cream text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-primary/70 mb-1">{language === 'zh' ? '视频链接' : 'Video Link'}</label>
              <input
                type="text"
                value={project.common.videoLinkUrl || ''}
                onChange={(e) => updateCommon('videoLinkUrl', e.target.value)}
                placeholder="https://youtu.be/xxx or https://bilibili.com/xxx"
                className="w-full px-3 py-2 border border-primary/20 bg-cream text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-primary/70 mb-1">{language === 'zh' ? '批注' : 'Notes'}</label>
              <textarea
                value={project.common.notes || ''}
                onChange={(e) => updateCommon('notes', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-primary/20 bg-cream text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* 语言切换标签 */}
        <div className="flex border-b border-primary/20">
          <button
            onClick={() => setActiveTab('zh')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'zh' ? 'text-primary border-b-2 border-primary' : 'text-primary/70'}`}
          >
            中文
          </button>
          <button
            onClick={() => setActiveTab('en')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'en' ? 'text-primary border-b-2 border-primary' : 'text-primary/70'}`}
          >
            English
          </button>
        </div>

        {/* 语言特定内容 */}
        <div className="bg-white border border-primary/10 p-4">
          <h3 className="font-bold text-primary mb-4">{activeTab === 'zh' ? '中文内容' : 'English Content'}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-primary/70 mb-1">{language === 'zh' ? '标题' : 'Title'}</label>
              <input
                type="text"
                value={currentLang.title}
                onChange={(e) => updateLang(activeTab, 'title', e.target.value)}
                className="w-full px-3 py-2 border border-primary/20 bg-cream text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-primary/70 mb-1">{language === 'zh' ? '副标题' : 'Subtitle'}</label>
              <input
                type="text"
                value={currentLang.subtitle}
                onChange={(e) => updateLang(activeTab, 'subtitle', e.target.value)}
                className="w-full px-3 py-2 border border-primary/20 bg-cream text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-primary/70 mb-1">{language === 'zh' ? '描述' : 'Description'}</label>
              <textarea
                value={currentLang.description}
                onChange={(e) => updateLang(activeTab, 'description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-primary/20 bg-cream text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-primary/70 mb-1">{language === 'zh' ? '角色' : 'Role'}</label>
              <input
                type="text"
                value={currentLang.role}
                onChange={(e) => updateLang(activeTab, 'role', e.target.value)}
                className="w-full px-3 py-2 border border-primary/20 bg-cream text-sm"
              />
            </div>

            {/* 标签 */}
            <div>
              <label className="block text-xs text-primary/70 mb-1">{language === 'zh' ? '标签' : 'Tags'}</label>
              <div className="flex flex-wrap gap-2">
                {currentLang.tags.map((tag, i) => (
                  <div key={i} className="flex items-center gap-1 bg-primary/5 px-2 py-1">
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => updateTag(activeTab, i, e.target.value)}
                      className="bg-transparent text-sm w-20 outline-none"
                    />
                    <button onClick={() => removeTag(activeTab, i)} className="text-primary/70 hover:text-red-500">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <button onClick={() => addTag(activeTab)} className="px-2 py-1 text-xs text-primary/70 border border-dashed border-primary/30 hover:border-primary">
                  <Plus size={12} />
                </button>
              </div>
            </div>

            {/* 奖项 */}
            <div>
              <label className="block text-xs text-primary/70 mb-1">{language === 'zh' ? '奖项' : 'Awards'}</label>
              <div className="space-y-2">
                {currentLang.awards.map((award, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={award}
                      onChange={(e) => updateAward(activeTab, i, e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-primary/20 bg-cream text-sm"
                    />
                    <button onClick={() => removeAward(activeTab, i)} className="text-primary/70 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={() => addAward(activeTab)} className="text-xs text-primary/70 hover:text-primary">
                  + {language === 'zh' ? '添加奖项' : 'Add Award'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 自定义内容块 */}
        <div className="bg-white border border-primary/10 p-4">
          <h3 className="font-bold text-primary mb-4">{language === 'zh' ? '内容块' : 'Content Sections'}</h3>
          <div className="space-y-4">
            {currentLang.sections.map((section, i) => (
              <div key={i} className="border border-primary/10 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-primary/70">#{i + 1}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary">
                      {section.type === 'text' ? '文字' : section.type === 'gallery' ? '图库' : '视频'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveSection(activeTab, i, 'up')} disabled={i === 0} className="p-1 text-primary/70 hover:text-primary disabled:opacity-30">
                      <ChevronUp size={14} />
                    </button>
                    <button onClick={() => moveSection(activeTab, i, 'down')} disabled={i === currentLang.sections.length - 1} className="p-1 text-primary/70 hover:text-primary disabled:opacity-30">
                      <ChevronDown size={14} />
                    </button>
                    <button onClick={() => removeSection(activeTab, i)} className="p-1 text-primary/70 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(activeTab, i, { title: e.target.value })}
                  placeholder={language === 'zh' ? '标题' : 'Title'}
                  className="w-full px-2 py-1 border border-primary/20 bg-cream text-sm mb-2"
                />
                {section.type === 'text' && (
                  <textarea
                    value={section.content}
                    onChange={(e) => updateSection(activeTab, i, { content: e.target.value })}
                    placeholder={language === 'zh' ? '内容...' : 'Content...'}
                    rows={3}
                    className="w-full px-2 py-1 border border-primary/20 bg-cream text-sm resize-none"
                  />
                )}
                {section.type === 'gallery' && (
                  <div className="space-y-2">
                    {/* 布局选择 */}
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-xs text-primary/70">{language === 'zh' ? '布局' : 'Layout'}:</label>
                      <select
                        value={section.layout || 'grid-4'}
                        onChange={(e) => updateSection(activeTab, i, { layout: e.target.value as 'grid-5' | 'grid-4' | 'grid-3' | 'grid-2' | 'full' })}
                        className="px-2 py-1 border border-primary/20 bg-cream text-xs"
                      >
                        <option value="grid-5">{language === 'zh' ? '5列网格' : '5 Columns'}</option>
                        <option value="grid-4">{language === 'zh' ? '4列网格' : '4 Columns'}</option>
                        <option value="grid-3">{language === 'zh' ? '3列网格' : '3 Columns'}</option>
                        <option value="grid-2">{language === 'zh' ? '2列网格' : '2 Columns'}</option>
                        <option value="full">{language === 'zh' ? '单张填满' : 'Full Width'}</option>
                      </select>
                    </div>
                    {section.images.map((img, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={img}
                          onChange={(e) => {
                            const newImages = [...section.images];
                            newImages[j] = e.target.value;
                            updateSection(activeTab, i, { images: newImages });
                          }}
                          placeholder="图片URL"
                          className="flex-1 px-2 py-1 border border-primary/20 bg-cream text-sm"
                        />
                        <button
                          onClick={() => {
                            const newImages = section.images.filter((_, k) => k !== j);
                            updateSection(activeTab, i, { images: newImages });
                          }}
                          className="text-primary/70 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => updateSection(activeTab, i, { images: [...section.images, '[图片占位符]'] })}
                      className="text-xs text-primary/70 hover:text-primary"
                    >
                      + {language === 'zh' ? '添加图片' : 'Add Image'}
                    </button>
                  </div>
                )}
                {section.type === 'video' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={section.videoUrl || ''}
                      onChange={(e) => updateSection(activeTab, i, { videoUrl: e.target.value })}
                      placeholder={language === 'zh' ? '视频直链 (mp4)' : 'Video URL (mp4)'}
                      className="w-full px-2 py-1 border border-primary/20 bg-cream text-sm"
                    />
                    <input
                      type="text"
                      value={(section as any).youtubeId || ''}
                      onChange={(e) => updateSection(activeTab, i, { youtubeId: e.target.value })}
                      placeholder="YouTube ID (e.g. JWq0vW7Y26Y)"
                      className="w-full px-2 py-1 border border-primary/20 bg-cream text-sm"
                    />
                    <input
                      type="text"
                      value={section.bilibiliId || ''}
                      onChange={(e) => updateSection(activeTab, i, { bilibiliId: e.target.value })}
                      placeholder={language === 'zh' ? 'B站视频ID (备用)' : 'Bilibili ID (fallback)'}
                      className="w-full px-2 py-1 border border-primary/20 bg-cream text-sm"
                    />
                  </div>
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={() => addSection(activeTab, 'text')} className="px-3 py-1.5 text-xs border border-dashed border-primary/30 text-primary/70 hover:border-primary hover:text-primary">
                + {language === 'zh' ? '文字块' : 'Text'}
              </button>
              <button onClick={() => addSection(activeTab, 'gallery')} className="px-3 py-1.5 text-xs border border-dashed border-primary/30 text-primary/70 hover:border-primary hover:text-primary">
                + {language === 'zh' ? '图库' : 'Gallery'}
              </button>
              <button onClick={() => addSection(activeTab, 'video')} className="px-3 py-1.5 text-xs border border-dashed border-primary/30 text-primary/70 hover:border-primary hover:text-primary">
                + {language === 'zh' ? '视频' : 'Video'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
