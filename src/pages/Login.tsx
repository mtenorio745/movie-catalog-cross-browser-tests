import React, { useState, useLayoutEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useScroll } from '../contexts/ScrollContext';
import { useApi } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { LogIn, User, Lock } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { resetScroll } = useScroll();
  const { loggedFetch } = useApi();
  const navigate = useNavigate();

  // Bloquear scroll apenas na página de login
  useLayoutEffect(() => {
    resetScroll();
  }, [resetScroll]);

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError('Email ou senha incorretos');
      }
    } catch (error) {
      setError('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 bg-gradient-to-br from-dark-bg via-dark-card to-dark-bg z-40">
      <BackButton className="absolute top-6 left-6" />
      
      <div className="w-full max-w-sm mx-auto">
        <div className="bg-dark-card/80 backdrop-blur-xl border border-dark-border/50 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-2xl bg-gradient-to-r from-accent-blue to-purple-600 mb-4">
              <LogIn className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Entrar
            </h2>
            <p className="text-sm text-gray-400">
              Acesse sua conta
            </p>
          </div>
          
          {/* Credenciais de teste */}
          <div className="bg-accent-blue/10 border border-accent-blue/20 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-medium text-accent-blue mb-2">Credenciais de Teste:</h3>
            <div className="space-y-1 text-xs text-gray-300">
              <p><span className="text-white font-medium">Admin:</span> admin@test.com / admin123</p>
              <p><span className="text-white font-medium">User:</span> user@test.com / user123</p>
            </div>
          </div>
          
          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit} data-testid="login-form">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-3 pl-10 bg-white/95 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-all duration-200 text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="email-input"
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-3 py-3 pl-10 bg-white/95 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-all duration-200 text-sm"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="password-input"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center p-3 rounded-xl" data-testid="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-accent-blue to-purple-600 hover:from-accent-blue-hover hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              data-testid="login-submit"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};