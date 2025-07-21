import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MovieCard } from '../components/MovieCard';
import { useAuth } from '../contexts/AuthContext';
import { useScroll } from '../contexts/ScrollContext';
import { useApi } from '../hooks/useApi';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Filter, Search } from 'lucide-react';

interface Movie {
  id: number;
  title: string;
  type: 'movie' | 'series';
  genre: string;
  releaseYear: number;
  watched: boolean;
  description: string;
  coverImage: string;
}

interface Favorite {
  id: number;
  userId: number;
  movieId: number;
}

export const Home: React.FC = () => {
  const { user } = useAuth();
  const { restoreScrollPosition } = useScroll();
  const location = useLocation();
  const { loggedFetch } = useApi();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    // Restaurar posição de rolagem quando voltar para o catálogo
    restoreScrollPosition();
  }, [restoreScrollPosition]);

  useEffect(() => {
    fetchMovies();
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  // Recarrega favoritos sempre que voltar para a página home
  useEffect(() => {
    if (location.pathname === '/' && user) {
      fetchFavorites();
    }
  }, [location.pathname, user]);

  // Novo useEffect para recarregar favoritos quando voltar para a página
  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [movies, favorites, searchTerm, typeFilter, genreFilter, yearFilter]);

  const fetchMovies = async () => {
    try {
      const response = await loggedFetch('http://localhost:3001/movies');
      const data = await response.json();
      setMovies(data);
    } catch (error) {
      console.error('Erro ao carregar filmes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;
    
    try {
      console.log(`🔄 Carregando favoritos para usuário ${user.id} (${user.name})...`);
      const response = await loggedFetch(`http://localhost:3001/favorites?userId=${user.id}`);
      const data = await response.json();
      console.log(`✅ Favoritos carregados para usuário ${user.id}:`, data);
      console.log(`📊 Total de favoritos: ${data.length}`);
      setFavorites(data);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    }
  };

  const applyFilters = () => {
    let filtered = movies;

    if (searchTerm) {
      filtered = filtered.filter(movie =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(movie => movie.type === typeFilter);
    }

    if (genreFilter !== 'all') {
      filtered = filtered.filter(movie => movie.genre === genreFilter);
    }

    if (yearFilter !== 'all') {
      filtered = filtered.filter(movie => movie.releaseYear.toString() === yearFilter);
    }

    setFilteredMovies(filtered);
  };

  const toggleFavorite = async (movieId: number) => {
    if (!user) return;

    console.log(`🎯 toggleFavorite chamado para filme ${movieId}`);
    const existingFavorite = favorites.find(f => f.movieId === movieId);
    console.log(`📋 Favorito existente:`, existingFavorite);

    try {
      if (existingFavorite) {
        console.log(`🗑️ Removendo favorito ${existingFavorite.id}...`);
        await loggedFetch(`http://localhost:3001/favorites/${existingFavorite.id}`, {
          method: 'DELETE',
        });
        const newFavorites = favorites.filter(f => f.id !== existingFavorite.id);
        console.log(`✅ Favoritos após remoção:`, newFavorites);
        setFavorites(newFavorites);
      } else {
        console.log(`➕ Adicionando novo favorito...`);
        const response = await loggedFetch('http://localhost:3001/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            movieId: movieId,
          }),
        });
        const newFavorite = await response.json();
        const newFavorites = [...favorites, newFavorite];
        console.log(`✅ Favoritos após adição:`, newFavorites);
        setFavorites(newFavorites);
      }
    } catch (error) {
      console.error('Erro ao alterar favorito:', error);
    }
  };

  const toggleWatched = async (movieId: number) => {
    try {
      const movie = movies.find(m => m.id === movieId);
      if (!movie) return;

      const response = await loggedFetch(`http://localhost:3001/movies/${movieId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...movie,
          watched: !movie.watched,
        }),
      });

      if (response.ok) {
        setMovies(movies.map(m => 
          m.id === movieId ? { ...m, watched: !m.watched } : m
        ));
      }
    } catch (error) {
      console.error('Erro ao alterar status assistido:', error);
    }
  };

  const genres = [...new Set(movies.map(movie => movie.genre))];
  const years = [...new Set(movies.map(movie => movie.releaseYear.toString()))].sort();

  if (loading) {
    return (
      <div className="h-64">
        <LoadingSpinner size="lg" text="Carregando catálogo..." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-accent-blue to-purple-600 bg-clip-text text-transparent">
            Catálogo de Filmes e Séries
          </h1>
          <p className="text-gray-400 text-lg">
            Descubra, avalie e organize seus filmes e séries favoritos
          </p>
        </div>
        
        {/* Filtros */}
        <div className="bg-dark-card rounded-2xl shadow-lg p-4 border border-dark-border/50 backdrop-blur-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center space-x-2 text-white font-medium">
              <div className="bg-gradient-to-r from-accent-blue to-purple-600 p-2 rounded-xl">
                <Filter className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm">Filtros</span>
            </div>
            
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar filmes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2.5 bg-white/95 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue text-gray-900 placeholder-gray-400 transition-all duration-200 text-sm"
                  data-testid="search-input"
                />
              </div>
            </div>
            
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2.5 bg-white/95 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue text-gray-900 transition-all duration-200 text-sm min-w-[120px]"
                data-testid="type-filter"
              >
                <option value="all">Todos</option>
                <option value="movie">Filmes</option>
                <option value="series">Séries</option>
              </select>
            </div>
            
            <div>
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="px-4 py-2.5 bg-white/95 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue text-gray-900 transition-all duration-200 text-sm min-w-[140px]"
                data-testid="genre-filter"
              >
                <option value="all">Todos</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
            
            <div>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="px-4 py-2.5 bg-white/95 border border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue text-gray-900 transition-all duration-200 text-sm min-w-[100px]"
                data-testid="year-filter"
              >
                <option value="all">Todos</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de filmes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredMovies.map(movie => (
          <MovieCard
            key={movie.id}
            movie={movie}
            isFavorite={user ? favorites.some(f => {
              const isMatch = f.movieId == movie.id && f.userId == user.id;
              if (isMatch) {
                console.log(`💖 Filme ${movie.title} (ID: ${movie.id}) está favoritado pelo usuário ${user.id}`);
              }
              return isMatch;
            }) : false}
            onToggleFavorite={toggleFavorite}
            onToggleWatched={toggleWatched}
          />
        ))}
      </div>

      {filteredMovies.length === 0 && (
        <EmptyState
          icon={Filter}
          title="Nenhum resultado encontrado"
          description="Tente ajustar os filtros ou termo de busca para encontrar mais conteúdo."
          action={{
            label: 'Limpar Filtros',
            onClick: () => {
              setSearchTerm('');
              setTypeFilter('all');
              setGenreFilter('all');
              setYearFilter('all');
            }
          }}
        />
      )}
    </div>
  );
};