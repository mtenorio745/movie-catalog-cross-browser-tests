import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useScroll } from '../contexts/ScrollContext';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../components/BackButton';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';

interface Movie {
  id: number;
  title: string;
  type: 'movie' | 'series';
  genre: string;
  releaseYear: number;
  watched: boolean;
  description: string;
}

export const AdminPanel: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { resetScroll } = useScroll();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'movie' as 'movie' | 'series',
    genre: '',
    releaseYear: new Date().getFullYear(),
    watched: false,
    description: '',
  });

  useLayoutEffect(() => {
    resetScroll();
  }, [resetScroll]);

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/');
      return;
    }
    fetchMovies();
  }, [user, isAdmin, navigate]);

  const fetchMovies = async () => {
    try {
      const response = await fetch('http://localhost:3001/movies');
      const data = await response.json();
      setMovies(data);
    } catch (error) {
      console.error('Erro ao carregar filmes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingMovie) {
        // Atualizar filme existente
        const response = await fetch(`http://localhost:3001/movies/${editingMovie.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...editingMovie,
            ...formData,
          }),
        });
        
        if (response.ok) {
          fetchMovies();
          resetForm();
        }
      } else {
        // Criar novo filme
        const response = await fetch('http://localhost:3001/movies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        if (response.ok) {
          fetchMovies();
          resetForm();
        }
      }
    } catch (error) {
      console.error('Erro ao salvar filme:', error);
    }
  };

  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      type: movie.type,
      genre: movie.genre,
      releaseYear: movie.releaseYear,
      watched: movie.watched,
      description: movie.description,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('⚠️ Tem certeza que deseja deletar este filme?\n\nEsta ação não pode ser desfeita.')) {
      try {
        await fetch(`http://localhost:3001/movies/${id}`, {
          method: 'DELETE',
        });
        fetchMovies();
      } catch (error) {
        console.error('Erro ao deletar filme:', error);
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingMovie(null);
    setFormData({
      title: '',
      type: 'movie',
      genre: '',
      releaseYear: new Date().getFullYear(),
      watched: false,
      description: '',
    });
  };

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div>
      <BackButton className="mb-6" />
      
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-white">Painel Administrativo</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            data-testid="add-movie-button"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar Filme/Série</span>
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">
              {editingMovie ? 'Editar' : 'Adicionar'} Filme/Série
            </h2>
            
            <form onSubmit={handleSubmit} data-testid="movie-form">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                  data-testid="movie-title-input"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as 'movie' | 'series'})}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  data-testid="movie-type-select"
                >
                  <option value="movie">Filme</option>
                  <option value="series">Série</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gênero
                </label>
                <input
                  type="text"
                  value={formData.genre}
                  onChange={(e) => setFormData({...formData, genre: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                  data-testid="movie-genre-input"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ano de Lançamento
                </label>
                <input
                  type="number"
                  value={formData.releaseYear}
                  onChange={(e) => setFormData({...formData, releaseYear: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required
                  data-testid="movie-year-input"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  rows={4}
                  required
                  data-testid="movie-description-input"
                />
              </div>

              <div className="flex items-center mb-6">
                <input
                  type="checkbox"
                  checked={formData.watched}
                  onChange={(e) => setFormData({...formData, watched: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  data-testid="movie-watched-checkbox"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Assistido
                </label>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-accent-blue to-purple-600 hover:from-accent-blue-hover hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                  data-testid="submit-movie-button"
                >
                  {editingMovie ? 'Atualizar' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                  data-testid="cancel-movie-button"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {movies.length === 0 ? (
          <div className="p-8">
            <LoadingSpinner text="Carregando filmes..." />
          </div>
        ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Título
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gênero
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ano
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {movies.map((movie) => (
              <tr key={movie.id} data-testid="movie-row">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{movie.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="capitalize text-sm text-gray-500">{movie.type}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-500">{movie.genre}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-500">{movie.releaseYear}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(movie)}
                    className="text-blue-600 hover:text-blue-900 mr-3 p-1 hover:bg-blue-50 rounded transition-colors"
                    data-testid="edit-movie-button"
                    title="Editar filme"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(movie.id)}
                    className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                    data-testid="delete-movie-button"
                    title="Deletar filme"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
};