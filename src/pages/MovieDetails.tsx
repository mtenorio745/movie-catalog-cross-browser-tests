import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useScroll } from '../contexts/ScrollContext';
import { BackButton } from '../components/BackButton';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Star, Heart, Calendar, Tag, Eye, EyeOff, MessageCircle, User } from 'lucide-react';

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

interface Review {
  id: number;
  movieId: number;
  userId: number;
  rating: number;
  comment: string;
  date: string;
}

interface Comment {
  id: number;
  movieId: number;
  userId: number;
  comment: string;
  date: string;
}

export const MovieDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { resetScroll } = useScroll();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviews' | 'comments'>('reviews');

  useLayoutEffect(() => {
    // Sempre começar no topo da página de detalhes
    resetScroll();
  }, [resetScroll]);

  useEffect(() => {
    if (id) {
      fetchMovieDetails();
      fetchReviews();
      fetchComments();
      if (user) {
        checkIfFavorite();
      }
    }
  }, [id, user]);

  const fetchMovieDetails = async () => {
    try {
      const response = await fetch(`http://localhost:3001/movies/${id}`);
      const data = await response.json();
      setMovie(data);
    } catch (error) {
      console.error('Erro ao carregar detalhes do filme:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`http://localhost:3001/reviews?movieId=${id}`);
      const data = await response.json();
      setReviews(data);
      
      if (user) {
        const userReviewFound = data.find((r: Review) => r.userId === user.id);
        setUserReview(userReviewFound || null);
      }
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`http://localhost:3001/comments?movieId=${id}`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
    }
  };

  const checkIfFavorite = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`http://localhost:3001/favorites?userId=${user.id}&movieId=${id}`);
      const data = await response.json();
      setIsFavorite(data.length > 0);
    } catch (error) {
      console.error('Erro ao verificar favorito:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) return;

    const movieIdNum = Number(id!);
    console.log(`🎬 MovieDetails toggleFavorite para "${movie?.title}":`, {
      movieId: movieIdNum,
      userId: user.id,
      userName: user.name,
      currentState: isFavorite ? 'FAVORITADO' : 'NÃO FAVORITADO',
      action: isFavorite ? 'REMOVER' : 'ADICIONAR'
    });
    
    try {
      if (isFavorite) {
        console.log(`🔍 Buscando favorito existente para remover...`);
        const response = await fetch(`http://localhost:3001/favorites?userId=${user.id}&movieId=${movieIdNum}`);
        const favorites = await response.json();
        console.log(`📋 Favoritos encontrados para remoção:`, favorites);
        
        if (favorites.length > 0) {
          console.log(`🗑️ Removendo favorito ID ${favorites[0].id}...`);
          await fetch(`http://localhost:3001/favorites/${favorites[0].id}`, {
            method: 'DELETE',
          });
          console.log(`✅ Favorito removido com sucesso!`);
          setIsFavorite(false);
        }
      } else {
        console.log(`➕ Adicionando "${movie?.title}" aos favoritos...`);
        const response = await fetch('http://localhost:3001/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            movieId: movieIdNum,
          }),
        });
        
        if (response.ok) {
          const newFavorite = await response.json();
          console.log(`✅ Favorito adicionado com sucesso:`, newFavorite);
          setIsFavorite(true);
        } else {
          console.error(`❌ Erro ao adicionar favorito: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Erro ao alterar favorito:', error);
    }
  };

  const toggleWatched = async () => {
    if (!movie) return;

    try {
      const response = await fetch(`http://localhost:3001/movies/${id}`, {
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
        setMovie({ ...movie, watched: !movie.watched });
      }
    } catch (error) {
      console.error('Erro ao alterar status assistido:', error);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !movie?.watched) return;

    try {
      if (userReview) {
        // Atualizar avaliação existente
        const response = await fetch(`http://localhost:3001/reviews/${userReview.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...userReview,
            rating: reviewRating,
            comment: reviewComment,
          }),
        });
        
        if (response.ok) {
          fetchReviews();
          setShowReviewForm(false);
        }
      } else {
        // Criar nova avaliação
        const response = await fetch('http://localhost:3001/reviews', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            movieId: parseInt(id!),
            userId: user.id,
            rating: reviewRating,
            comment: reviewComment,
            date: new Date().toISOString(),
          }),
        });
        
        if (response.ok) {
          fetchReviews();
          setShowReviewForm(false);
          setReviewComment('');
        }
      }
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
    }
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    try {
      const response = await fetch('http://localhost:3001/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movieId: parseInt(id!),
          userId: user.id,
          comment: newComment,
          date: new Date().toISOString(),
        }),
      });
      
      if (response.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
    }
  };

  const deleteComment = async (commentId: number) => {
    try {
      await fetch(`http://localhost:3001/comments/${commentId}`, {
        method: 'DELETE',
      });
      fetchComments();
    } catch (error) {
      console.error('Erro ao deletar comentário:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <BackButton className="absolute top-6 left-6 z-10" />
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" text="Carregando detalhes do filme..." />
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <BackButton className="mb-6" />
        <div className="p-8">
          <EmptyState
            icon={MessageCircle}
            title="Filme não encontrado"
            description="O filme que você está procurando não existe ou foi removido."
            action={{
              label: 'Voltar ao Catálogo',
              onClick: () => navigate('/')
            }}
          />
        </div>
      </div>
    );
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="min-h-screen bg-dark-bg" data-testid="movie-details">
      <div className="p-6">
        <BackButton />
      </div>
      
      {/* Coluna Esquerda - Informações do Filme */}
      <div className="flex w-full">
        <div className="w-1/3 p-8 bg-dark-card border-r border-dark-border">
          <div className="space-y-6">
            {/* Imagem do poster como miniatura de DVD */}
            <div className="flex justify-center">
              <div className="relative w-64 h-96 rounded-xl overflow-hidden shadow-2xl group">
                <img
                  src={movie.coverImage}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Badge do tipo sobre a imagem */}
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    movie.type === 'movie' 
                      ? 'bg-accent-blue text-white' 
                      : 'bg-purple-600 text-white'
                  }`}>
                    {movie.type === 'movie' ? 'Filme' : 'Série'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Informações do filme */}
            <div className="space-y-6">
              {/* Título */}
              <h1 className="text-3xl font-bold leading-tight text-white text-center" data-testid="movie-title">
                {movie.title}
              </h1>

              {/* Informações básicas */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-center">
                <div className="flex items-center space-x-2 text-gray-300">
                  <Calendar className="h-4 w-4" />
                  <span>{movie.releaseYear}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <Tag className="h-4 w-4" />
                  <span>{movie.genre}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {movie.watched ? (
                    <>
                      <Eye className="h-4 w-4 text-green-400" />
                      <span className="text-green-400">Assistido</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-400">Não assistido</span>
                    </>
                  )}
                </div>
              </div>

              {/* Avaliação média */}
              {reviews.length > 0 && (
                <div className="flex items-center justify-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.round(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-500'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-gray-400">({reviews.length} avaliações)</span>
                </div>
              )}

              {/* Descrição */}
              <p className="text-gray-300 leading-relaxed text-center" data-testid="movie-description">
                {movie.description}
              </p>

              {/* Botões de ação */}
              {user && (
                <div className="flex flex-col space-y-3">
                  <button
                    onClick={toggleWatched}
                    className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-200 w-full ${
                      movie.watched 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                    data-testid="toggle-watched-button"
                  >
                    {movie.watched ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    <span>{movie.watched ? 'Assistido' : 'Marcar como assistido'}</span>
                  </button>
                  
                  <button
                    onClick={toggleFavorite}
                    className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-200 w-full ${
                      isFavorite 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                    data-testid="toggle-favorite-button"
                  >
                    <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                    <span>{isFavorite ? 'Favorito' : 'Favoritar'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coluna Direita - Avaliações e Comentários */}
        <div className="w-2/3 p-8 space-y-8 overflow-y-auto">
          {/* Tabs */}
          <div className="flex space-x-1 bg-dark-card rounded-xl p-1">
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'reviews'
                  ? 'bg-accent-blue text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Avaliações ({reviews.length})
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'comments'
                  ? 'bg-accent-blue text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              Comentários ({comments.length})
            </button>
          </div>

          {/* Conteúdo das Tabs */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Formulário de Avaliação */}
              {user && (
                <div className="bg-dark-card rounded-xl p-6 border border-dark-border">
                  {!movie.watched ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
                      <Eye className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                      <p className="text-yellow-400 font-medium">
                        Marque este filme como assistido para poder avaliá-lo
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">
                          {userReview ? 'Sua Avaliação' : 'Avaliar'}
                        </h3>
                        <button
                          onClick={() => {
                            setShowReviewForm(!showReviewForm);
                            if (userReview) {
                              setReviewRating(userReview.rating);
                              setReviewComment(userReview.comment);
                            }
                          }}
                          className="bg-gradient-to-r from-accent-blue to-purple-600 hover:from-accent-blue-hover hover:to-purple-700 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200"
                          data-testid="review-button"
                        >
                          {userReview ? 'Editar Avaliação' : 'Avaliar'}
                        </button>
                      </div>

                      {showReviewForm && (
                        <form onSubmit={submitReview} className="space-y-4" data-testid="review-form">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Sua nota
                            </label>
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  key={rating}
                                  type="button"
                                  onClick={() => setReviewRating(rating)}
                                  className={`p-1 transition-colors ${
                                    rating <= reviewRating ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-300'
                                  }`}
                                  data-testid={`rating-${rating}`}
                                >
                                  <Star className="h-6 w-6 fill-current" />
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Seu comentário
                            </label>
                            <textarea
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-all duration-200"
                              rows={3}
                              placeholder="Escreva sua avaliação..."
                              data-testid="review-comment"
                            />
                          </div>
                          
                          <div className="flex space-x-3">
                            <button
                              type="submit"
                              className="bg-gradient-to-r from-accent-blue to-purple-600 hover:from-accent-blue-hover hover:to-purple-700 px-6 py-2.5 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                              data-testid="submit-review"
                            >
                              {userReview ? 'Atualizar' : 'Enviar'} Avaliação
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowReviewForm(false)}
                              className="bg-gray-700 hover:bg-gray-600 px-6 py-2.5 rounded-xl text-gray-300 font-medium transition-all duration-200"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Lista de Avaliações */}
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-dark-card rounded-xl p-6 border border-dark-border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-accent-blue to-purple-600 p-2 rounded-full">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-500'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(review.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{review.comment}</p>
                  </div>
                ))}

                {reviews.length === 0 && (
                  <div className="text-center py-12">
                    <Star className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Nenhuma avaliação ainda</h3>
                    <p className="text-gray-400">Seja o primeiro a avaliar este filme!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              {/* Formulário de Comentário */}
              {user && (
                <div className="bg-dark-card rounded-xl p-6 border border-dark-border">
                  <h3 className="text-lg font-semibold text-white mb-4">Adicionar Comentário</h3>
                  <form onSubmit={addComment} data-testid="comment-form">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-all duration-200 mb-4"
                      rows={3}
                      placeholder="Escreva seu comentário..."
                      data-testid="comment-input"
                    />
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-accent-blue to-purple-600 hover:from-accent-blue-hover hover:to-purple-700 px-6 py-2.5 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                      data-testid="submit-comment"
                    >
                      Comentar
                    </button>
                  </form>
                </div>
              )}

              {/* Lista de Comentários */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-dark-card rounded-xl p-6 border border-dark-border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gradient-to-r from-accent-blue to-purple-600 p-2 rounded-full">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">
                            {new Date(comment.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      {user && user.id === comment.userId && (
                        <button
                          onClick={() => deleteComment(comment.id)}
                          className="text-red-400 hover:text-red-300 text-sm transition-colors"
                          data-testid="delete-comment"
                        >
                          Deletar
                        </button>
                      )}
                    </div>
                    <p className="text-gray-300 leading-relaxed">{comment.comment}</p>
                  </div>
                ))}

                {comments.length === 0 && (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Nenhum comentário ainda</h3>
                    <p className="text-gray-400">Seja o primeiro a comentar!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};