import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useScroll } from '../contexts/ScrollContext';
import { useLocation } from 'react-router-dom';
import { Heart, Calendar, Tag, Eye, EyeOff } from 'lucide-react';

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

interface MovieCardProps {
  movie: Movie;
  isFavorite: boolean;
  onToggleFavorite: (movieId: number) => void;
  onToggleWatched: (movieId: number) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  isFavorite,
  onToggleFavorite,
  onToggleWatched
}) => {
  const { user } = useAuth();
  const { saveScrollPosition } = useScroll();
  const location = useLocation();

  const handleDetailsClick = () => {
    // Salvar posição de rolagem antes de navegar para detalhes
    saveScrollPosition();
  };

  // Debug detalhado do estado de favorito
  React.useEffect(() => {
    console.log(`🎬 MovieCard "${movie.title}" (ID: ${movie.id}):`, {
      isFavorite,
      movieId: movie.id,
      userId: user?.id,
      timestamp: new Date().toLocaleTimeString(),
      buttonShouldBeRed: isFavorite ? 'SIM' : 'NÃO'
    });
  }, [isFavorite, movie.title, movie.id, user?.id]);

  return (
    <div className="bg-dark-card rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group" data-testid="movie-card">
      <div className="relative">
        <img
          src={movie.coverImage}
          alt={movie.title}
          className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        
        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            movie.type === 'movie' 
              ? 'bg-accent-blue text-white' 
              : 'bg-purple-600 text-white'
          }`}>
            {movie.type === 'movie' ? 'Filme' : 'Série'}
          </span>
        </div>
        
        {/* Action buttons overlay */}
        {user && (
          <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleWatched(movie.id);
              }}
              className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                movie.watched 
                  ? 'bg-green-600/80 text-white' 
                  : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80'
              }`}
              data-testid="toggle-watched-button"
              title={movie.watched ? 'Marcar como não assistido' : 'Marcar como assistido'}
            >
              {movie.watched ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`❤️ Clicando favorito para ${movie.title}:`, {
                  currentState: isFavorite,
                  movieId: movie.id,
                  userId: user?.id,
                  willBecome: !isFavorite
                });
                onToggleFavorite(movie.id);
              }}
              className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                isFavorite 
                  ? 'bg-red-600/80 text-white' 
                  : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80'
              }`}
              data-testid="toggle-favorite-button"
              title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        )}
        
        {/* Title and year overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg font-bold text-white mb-1 line-clamp-2" data-testid="movie-title">
            {movie.title}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-sm text-gray-300">
              <span className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{movie.releaseYear}</span>
              </span>
              <span className="px-2 py-1 bg-dark-bg/60 backdrop-blur-sm rounded-full text-xs">
                {movie.genre}
              </span>
            </div>
            {movie.watched && (
              <div className="bg-green-600/80 backdrop-blur-sm px-2 py-1 rounded-full">
                <Eye className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <Link
          to={`/movie/${movie.id}`}
          onClick={handleDetailsClick}
          className="block w-full bg-gradient-to-r from-accent-blue to-purple-600 hover:from-accent-blue-hover hover:to-purple-700 text-white text-center px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:scale-105"
          data-testid="movie-details-link"
        >
          Ver Detalhes
        </Link>
      </div>
    </div>
  );
};