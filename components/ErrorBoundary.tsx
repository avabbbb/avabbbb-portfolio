import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

/** 全局错误边界：组件运行期抛错时展示恢复页，避免白屏 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-cream text-primary flex items-center justify-center p-8">
          <div className="max-w-md w-full border-2 border-primary p-8 md:p-10 text-center">
            <p className="font-mono text-xs tracking-[0.25em] text-primary/70 mb-4">SOMETHING WENT WRONG</p>
            <h1 className="text-3xl font-black mb-4">页面加载出错了</h1>
            <p className="text-sm text-primary/70 leading-relaxed mb-6">
              请刷新页面重试；如果持续出现，可以截图反馈给作者。
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-11 inline-flex items-center justify-center bg-primary text-cream px-5 py-3 font-bold hover:bg-[#E63946] transition-colors cursor-pointer"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}