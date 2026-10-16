import { Language, Category } from '../../types';

export interface HeroItem {
  text: string;
  annotation: string;
  category: Category | null;
}

export interface HomeContent {
  heroItems: HeroItem[];
  intro: string;
  selectedWorks: string;
  years: string;
}

export const HOME_DATA: Record<Language, HomeContent> = {
  zh: {
    heroItems: [
      { text: "0→1 AIGC 项目负责人", annotation: "（需求 · 交付 · SOP 沉淀）", category: Category.DEV },
      { text: "52K Star 开源项目贡献者", annotation: "（CLIProxyAPI · v7.3.5）", category: Category.DEV },
      { text: "米哈游官方约稿创作者", annotation: "（绝区零 · 二创视频）", category: Category.VIDEO }
    ],
    intro: "AIGC 产研工程师 | 华南师范大学软件工程本科毕业 | 珠三角央企 · AI技术产品 研发",
    selectedWorks: "精选作品",
    years: "[ 2025 — NOW ]"
  },
  en: {
    heroItems: [
      { text: "0→1 AIGC Project Lead", annotation: "(Requirements · Delivery · SOP)", category: Category.DEV },
      { text: "52K-Star OSS Contributor", annotation: "(CLIProxyAPI · v7.3.5)", category: Category.DEV },
      { text: "MiHoYo Commissioned Creator", annotation: "(ZZZ · Fan-made video)", category: Category.VIDEO }
    ],
    intro: "AIGC Engineer | SCNU Software Engineering B.Eng. | AI product engineer at a Pearl River Delta state-owned enterprise",
    selectedWorks: "Selected Works",
    years: "[ 2025 — NOW ]"
  }
};
