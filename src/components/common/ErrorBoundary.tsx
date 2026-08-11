import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Terminal, Home, LifeBuoy } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('BUP-CMS ErrorBoundary caught an exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearCacheAndReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Unable to clear storage:', e);
    }
    this.handleReset();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060910] text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-xl w-full glass-panel rounded-3xl p-8 border border-rose-500/30 relative z-10 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-2xl border border-rose-500/30">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                  Crash Prevention Shield Active
                </span>
                <h1 className="text-xl font-extrabold text-white mt-1">
                  {this.props.fallbackTitle || 'Interface Protected from Crash'}
                </h1>
                <p className="text-xs text-slate-400">
                  An edge-case rendering error was intercepted safely. Your data is secure.
                </p>
              </div>
            </div>

            {/* Error Diagnostics Box */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/5 font-mono text-[11px] text-slate-300 space-y-2 max-h-40 overflow-y-auto">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <Terminal className="w-3.5 h-3.5" />
                <span>Exception: {this.state.error?.name || 'Runtime Exception'}</span>
              </div>
              <p className="text-slate-400 leading-relaxed break-all">
                {this.state.error?.message || 'Unexpected state received in React component tree.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Safe Mode
              </button>
              <button
                onClick={this.handleClearCacheAndReset}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs py-3 px-4 rounded-xl border border-white/10 transition-all"
              >
                <LifeBuoy className="w-4 h-4 text-emerald-400" />
                Reset Cache & Restore
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
