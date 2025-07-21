import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Film, Heart, Settings, LogOut, User, Grid3X3 } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-dark-bg/95 backdrop-blur-xl border-b border-dark-border/50 shadow-2xl sticky top-0 z-50" data-testid="navbar">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-3 font-bold text-xl text-white hover:text-accent-blue transition-colors">
            <div className="bg-gradient-to-r from-accent-blue to-purple-600 p-3 rounded-2xl shadow-lg">
              <Film className="h-6 w-6" />
            </div>
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Movie Catalog</span>
          </Link>
          
          <div className="flex items-center space-x-2">
            <Link
              to="/"
              className="flex items-center space-x-2 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              data-testid="catalog-link"
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">Catálogo</span>
            </Link>
            
            {user ? (
              <>
                <Link
                  to="/favorites"
                  className="flex items-center space-x-2 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                  data-testid="favorites-link"
                >
                  <Heart className="h-4 w-4" />
                  <span className="hidden sm:inline">Favoritos</span>
                </Link>
                
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-2 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                    data-testid="admin-link"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
                
                <div className="flex items-center space-x-3">
                  <div className="bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl flex items-center space-x-2 border border-white/20">
                    <User className="h-4 w-4 text-accent-blue" />
                    <span className="text-sm text-white font-medium hidden md:inline" data-testid="user-name">{user.name}</span>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2.5 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200"
                    data-testid="logout-button"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Sair</span>
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-gradient-to-r from-accent-blue to-purple-600 hover:from-accent-blue-hover hover:to-purple-700 px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                data-testid="login-link"
              >
                <User className="h-4 w-4" />
                <span>Entrar</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};