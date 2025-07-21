import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-bg flex items-center justify-center px-4">
          <div className="bg-dark-card rounded-xl p-8 max-w-md w-full border border-dark-border text-center">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              Ops! Algo deu errado
            </h2>
            <p className="text-gray-400 mb-6">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-accent-blue to-purple-600 hover:from-accent-blue-hover hover:to-purple-700 px-6 py-2.5 rounded-xl text-white font-medium transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Recarregar Página</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}