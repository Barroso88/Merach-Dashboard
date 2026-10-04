import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('RouteErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-8 rounded-3xl bg-slate-950/80 border border-rose-500/30 backdrop-blur-xl flex flex-col items-center justify-center text-center gap-4 my-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="max-w-md">
            <h3 className="text-white font-bold text-base mb-1">Erro ao Apresentar Percurso Real</h3>
            <p className="text-slate-400 text-xs mb-3">
              {this.state.error?.message || 'Ocorreu uma falha temporária ao carregar a visualização.'}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 hover:opacity-95 transition-all cursor-pointer shadow-lg"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tentar Novamente</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
