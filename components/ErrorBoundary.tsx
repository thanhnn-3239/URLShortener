"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught error", { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <p className="text-red-600">Something went wrong.</p>;
    }

    return this.props.children;
  }
}
