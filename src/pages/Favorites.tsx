import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useScroll } from '../contexts/ScrollContext';
import { MovieCard } from '../components/MovieCard';
import { BackButton } from '../components/BackButton';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Heart } from 'lucide-react';

interface Movie {
  id: number;
  title: string;
  type: 'movie' | 'series';
  genre: string;
  releaseYear: number;
  watched: boolean;
  description: string;
}

interface Favorite {
  id: number;
  userId: number;
  movieId: number;
}

export const Favorites: React.FC = () => {
  const { user } = useAuth();
  const { resetScroll } = useScroll();
  const [favoriteMovies, setFavoriteMovies] = useState<Movie[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    resetScroll();
  }, [resetScroll]);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const favoritesResponse = await fetch(`http://localhost:3001/favorites?userId=${user.id}`);
      const favoritesData = await favoritesResponse.json();
      setFavorites(favoritesData);

      if (favoritesData.length > 0) {
        const movieIds = favoritesData.map((f: Favorite) => f.movieId);
        const moviesPromises = movieIds.map((id: number) => 
          fetch(`http://localhost:3001/movies/${id}`).then(res => res.json())
        );
        const movies = await Promise.all(moviesPromises);
        setFavoriteMovies(movies);
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (movieId: number) => {
    if (!user) return;

    const existingFavorite = favorites.find(f => f.movieId === movieId);

    try {
      if (existingFavorite) {
        await fetch(`http://localhost:3001/favorites/${existingFavorite.id}`, {
          method: 'DELETE',
        });
        setFavorites(favorites.filter(f => f.id !== existingFavorite.id));
        setFavoriteMovies(favoriteMovies.filter(m => m.id !== movieId));
      }
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
    }
  };

  const toggleWatched = async (movieId: number) => {
    try {
      const movie = favoriteMovies.find(m => m.id === movieId);
      if (!movie) return;

      const response = await fetch(`http://localhost:3001/movies/${movieId}`, {
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
        setFavoriteMovies(favoriteMovies.map(m => 
          m.id === movieId ? { ...m, watched: !m.watched } : m
        ));
      }
    } catch (error) {
      console.error('Erro ao alterar status assistido:', error);
    }
  };

  if (!user) {
    return (
      <div>
        <BackButton className="mb-6" />
        <EmptyState
          icon={Heart}
          title="Login necessário"
          description="Você precisa estar logado para ver seus favoritos."
          action={{
            label: 'Fazer Login',
            onClick: () => window.location.href = '/login'
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <BackButton className="mb-6" />
        <div className="h-64">
          <LoadingSpinner size="lg" text="Carregando seus favoritos..." />
        </div>
      </div>
    );
  }

  return (
    <div>
      <BackButton className="mb-6" />
      
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Heart className="h-8 w-8 text-red-600 fill-current" />
          <h1 className="text-3xl font-bold text-white">Meus Favoritos</h1>
        </div>
        <p className="text-gray-400">
          Seus filmes e séries favoritos em um só lugar.
        </p>
      </div>

      {favoriteMovies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteMovies.map(movie => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isFavorite={true}
              onToggleFavorite={toggleFavorite}
              onToggleWatched={toggleWatched}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title="Nenhum favorito ainda"
          description="Você ainda não tem filmes ou séries favoritos. Explore o catálogo e adicione seus títulos favoritos!"
          action={{
            label: 'Explorar Catálogo',
            onClick: () => window.location.href = '/'
          }}
        />
      )}
    </div>
  );
};