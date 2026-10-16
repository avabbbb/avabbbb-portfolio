import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, X, Loader2 } from 'lucide-react';
import { Language } from '../types';
import { requestUnlock } from '../src/utils/unlock';

interface UnlockModalProps {
  isOpen: boolean;
  language: Language;
  onClose: () => void;
  onSubmit: (input: string) => Promise<boolean>;
}

export const UnlockModal: React.FC<UnlockModalProps> = ({ isOpen, language, onClose, onSubmit }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isZh = language === 'zh';

  useEffect(() => {
    if (isOpen) {
      setValue('');
      setError(false);
      setSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || submitting) return;
    setSubmitting(true);
    setError(false);
    const ok = await onSubmit(value);
    if (!ok) {
      setError(true);
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* 遮罩 */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 卡片 */}
          <motion.div
            className="relative w-full max-w-md bg-cream border-2 border-primary rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 16, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* 顶部色带 */}
            <div className="h-2 bg-primary" />

            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 text-primary/40 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
              aria-label={isZh ? '关闭' : 'Close'}
            >
              <X size={18} />
            </button>

            <div className="px-6 pt-7 pb-6">
              {/* 图标 */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center justify-center w-11 h-11 bg-primary/10 rounded-xl">
                  <Lock size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-primary leading-tight">
                    {isZh ? '内容已加密' : 'Content is locked'}
                  </h2>
                  <p className="text-xs text-primary/70 mt-0.5">
                    {isZh ? '验证身份以查看加密内容' : 'Verify identity to view locked content'}
                  </p>
                </div>
              </div>

              {/* 说明 */}
              <p className="text-sm text-primary/70 leading-relaxed mb-4">
                {isZh
                  ? '为保护合作方隐私,本页涉及的真实公司、客户、项目内容已加密。请输入你已获取的解锁凭据以查看。'
                  : 'To protect partner privacy, real employer, client, and project content is encrypted. Enter the credential you were given to unlock.'}
              </p>

              {/* 输入框 */}
              <form onSubmit={handleSubmit}>
                <label className="block text-xs font-bold text-primary/70 mb-2 tracking-wide">
                  {isZh ? '解锁凭据' : 'Unlock credential'}
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  value={value}
                  onChange={(e) => { setValue(e.target.value); setError(false); }}
                  placeholder={isZh ? '请输入解锁凭据' : 'Enter your credential'}
                  className={`w-full px-4 py-3 bg-white border-2 rounded-lg text-sm text-primary placeholder:text-primary/70 outline-none transition-colors ${
                    error ? 'border-[#E63946] bg-[#E63946]/5' : 'border-primary/15 focus:border-primary'
                  }`}
                  disabled={submitting}
                  autoComplete="off"
                  spellCheck={false}
                />

                <AnimatePresence>
                  {error && (
                    <motion.p
                      className="mt-2 text-xs text-[#E63946] flex items-center gap-1"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {isZh ? '✕ 凭据不正确,请重试' : '✕ Incorrect credential, try again'}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={submitting || !value.trim()}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-primary text-cream font-bold text-sm rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {isZh ? '验证中…' : 'Verifying…'}
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      {isZh ? '解锁内容' : 'Unlock'}
                    </>
                  )}
                </button>
              </form>

              <p className="mt-4 text-[11px] text-primary/40 leading-relaxed">
                {isZh
                  ? '验证凭据由作者线下提供,无需重复输入(浏览器有效期内)。'
                  : 'Credential is provided by the author offline. Valid in this browser for a limited time.'}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};