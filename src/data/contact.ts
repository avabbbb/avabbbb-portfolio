import { Language } from '../../types';

export interface SocialLinks {
  wechat: string;
  xiaohongshu: string;
  bilibili: string;
  px500: string;
  liblib: string;
}

export interface ContactContent {
  baseLabel: string;
  locationValue: string;
  contactLabel: string;
  emailMeLabel: string;
  email: string;
  hello: string;
  intro: string;
  socials: SocialLinks;
  tooltip?: string;
  githubLabel: string;
  footerDesign: string;
}

export const CONTACT_DATA: Record<Language, ContactContent> = {
  zh: {
    baseLabel: "BASE",
    locationValue: "广东，深圳",
    contactLabel: "取得联系",
    emailMeLabel: "邮箱",
    email: "921693422@qq.com",
    hello: "你好 ;-)",
    intro: "欢迎探讨与合作。",
    socials: {
      wechat: "avabbbb",
      xiaohongshu: "avabbbb",
      bilibili: "avabbbb",
      px500: "",
      liblib: ""
    },
    githubLabel: "GitHub",
    footerDesign: "Powered by avabbbb"
  },
  en: {
    baseLabel: "BASE",
    locationValue: "Shenzhen, Guangdong",
    contactLabel: "Get in touch",
    emailMeLabel: "Email Me",
    email: "921693422@qq.com",
    hello: "Hello ;-)",
    intro: "Welcome to discuss & cooperate.",
    socials: {
      wechat: "avabbbb",
      xiaohongshu: "avabbbb",
      bilibili: "avabbbb",
      px500: "",
      liblib: ""
    },
    githubLabel: "GitHub",
    footerDesign: "Powered by avabbbb"
  }
};
