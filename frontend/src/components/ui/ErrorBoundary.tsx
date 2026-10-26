import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home, ChevronDown, ChevronUp, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[500px] flex items-center justify-center p-6 bg-[#fcfbfa]">
          <div className="max-w-xl w-full bg-white rounded-lg border border-[#e2ddd3] shadow-xl p-8 text-center font-bengali">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 shadow-inner">
              <AlertOctagon className="w-8 h-8 animate-pulse" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-[#1e2022] mb-2 font-bengali">
              {this.props.fallbackTitle || 'একটি অনাকাঙ্ক্ষিত সমস্যা দেখা দিয়েছে'}
            </h2>

            {/* Subtitle / Message */}
            <p className="text-gray-600 text-sm leading-relaxed mb-6 font-bengali max-w-md mx-auto">
              {this.props.fallbackMessage ||
                'পৃষ্ঠাটি রেন্ডার করার সময় ত্রুটি হয়েছে। আপনি আবার চেষ্টা করতে পারেন অথবা প্রচ্ছদে ফিরে যেতে পারেন।'}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#800020] hover:bg-[#66001a] text-white rounded-md text-xs font-semibold shadow-sm transition active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>আবার চেষ্টা করুন (Try Again)</span>
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-xs font-semibold transition"
              >
                <span>পৃষ্ঠা রিফ্রেশ (Refresh)</span>
              </button>

              <a
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md text-xs font-semibold transition"
              >
                <Home className="w-4 h-4" />
                <span>হোমপেজে যান</span>
              </a>
            </div>

            {/* Developer Details Accordion */}
            {this.state.error && (
              <div className="text-left border-t border-gray-100 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                  className="flex items-center justify-between w-full text-xs text-gray-500 hover:text-gray-800 font-sans transition"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <Bug className="w-3.5 h-3.5 text-rose-500" />
                    <span>Technical Details (Developer View)</span>
                  </span>
                  {this.state.showDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {this.state.showDetails && (
                  <div className="mt-3 p-3 bg-gray-900 text-rose-200 rounded text-[11px] font-mono overflow-auto max-h-56 leading-relaxed select-all">
                    <p className="font-bold text-white mb-1">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="text-[10px] text-gray-300 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div className="mt-2 pt-2 border-t border-gray-800 text-[10px] text-gray-400">
                        <span className="font-bold text-amber-300">Component Stack:</span>
                        <pre className="whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
