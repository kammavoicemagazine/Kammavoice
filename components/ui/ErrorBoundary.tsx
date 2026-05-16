"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-surface border border-border-subtle rounded-xl max-w-lg mx-auto my-12 shadow-2xl">
          <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-danger" />
          </div>
          <h2 className="text-xl font-bold font-[family-name:var(--font-playfair)] mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-muted mb-6">
            {this.state.error?.message || "An unexpected rendering error occurred."}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-6 py-2.5 bg-gold text-[#0A0A0A] font-semibold rounded-lg hover:bg-gold-light transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
