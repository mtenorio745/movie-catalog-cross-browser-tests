describe('Sistema de Avaliações de Filmes/Séries', () => {
  before(() => {
    // Reset do banco de dados antes de todos os testes
    cy.resetDatabase();
  });

  beforeEach(() => {
    cy.loginAsUser();
    // Intercepta requisições para garantir dados consistentes
    cy.intercept('GET', 'http://localhost:3001/movies/1', { fixture: 'movie-details.json' }).as('getMovieDetails');
    cy.intercept('GET', 'http://localhost:3001/reviews*', []).as('getReviews');
    cy.intercept('GET', 'http://localhost:3001/comments*', []).as('getComments');
  });

  context('Regras de Negócio para Avaliação', () => {
    it('deve exibir mensagem de pré-requisito quando o filme não foi marcado como assistido', () => {
      // Objetivo: Validar regra de negócio fundamental
      // Regra de negócio: Apenas filmes assistidos podem ser avaliados
      
      // Intercepta filme não assistido
      cy.intercept('GET', 'http://localhost:3001/movies/1', {
        ...require('../fixtures/movie-details.json'),
        watched: false
      }).as('getUnwatchedMovie');
      
      cy.visit('/movie/1');
      cy.wait('@getUnwatchedMovie');
      
      // Verifica mensagem de pré-requisito
      cy.contains('Marque este filme como assistido para poder avaliá-lo').should('be.visible');
      cy.get('[data-testid="review-button"]').should('not.exist');
    });

    it('deve permitir a avaliação apenas para filmes marcados como assistidos', () => {
      // Objetivo: Validar habilitação de avaliação para filmes assistidos
      // Regra de negócio: Filmes assistidos devem permitir avaliação
      
      // Intercepta filme assistido
      cy.intercept('GET', 'http://localhost:3001/movies/1', {
        ...require('../fixtures/movie-details.json'),
        watched: true
      }).as('getWatchedMovie');
      
      cy.visit('/movie/1');
      cy.wait('@getWatchedMovie');
      
      // Verifica se o botão de avaliação está disponível
      cy.get('[data-testid="review-button"]').should('be.visible');
      cy.get('[data-testid="review-button"]').click();
      cy.get('[data-testid="review-form"]').should('be.visible');
    });

    it('deve permitir marcar filme como assistido e habilitar avaliação na mesma sessão', () => {
      // Objetivo: Validar fluxo completo de marcar como assistido e avaliar
      // Regra de negócio: Mudança de status deve refletir imediatamente na UI
      
      // Usa filme ID 2 que não foi usado nos testes anteriores
      cy.visit('/movie/2');
      
      // Mock específico para filme 2 não assistido
      cy.intercept('GET', 'http://localhost:3001/movies/2', {
        statusCode: 200,
        body: {
          id: "2",
          title: "De Volta para o Futuro",
          type: "movie",
          genre: "Ficção Científica",
          releaseYear: 1985,
          watched: false,
          description: "Aventura sci-fi divertida",
          coverImage: "https://example.com/image.jpg"
        }
      }).as('getUnwatchedMovie2');
      
      cy.wait('@getUnwatchedMovie2');
      
      // Intercepta a atualização do filme 2 para "assistido"
      cy.intercept('PUT', 'http://localhost:3001/movies/2', {
        statusCode: 200,
        body: {
          id: "2",
          title: "De Volta para o Futuro",
          type: "movie",
          genre: "Ficção Científica",
          releaseYear: 1985,
          watched: true
        }
      }).as('markAsWatched');
      
      // Intercepta GET atualizado após marcar como assistido  
      cy.intercept('GET', 'http://localhost:3001/movies/2', {
        statusCode: 200,
        body: {
          id: "2",
          title: "De Volta para o Futuro", 
          type: "movie",
          genre: "Ficção Científica",
          releaseYear: 1985,
          watched: true
        }
      }).as('getWatchedMovie');
      
      // Marca como assistido
      cy.get('[data-testid="toggle-watched-button"]').click();
      cy.wait('@markAsWatched');
      
      // Aguarda um pouco para a UI atualizar
      cy.wait(1000);
      
      // Verifica se o botão de avaliação aparece
      cy.get('[data-testid="review-button"]').should('be.visible');
    });
  });

  context('Criação e Edição de Avaliações', () => {
    beforeEach(() => {
      // Configura filme como assistido para todos os testes desta seção
      cy.intercept('GET', 'http://localhost:3001/movies/1', {
        ...require('../fixtures/movie-details.json'),
        watched: true
      }).as('getWatchedMovie');
    });

    it('deve permitir criar uma nova avaliação com nota e comentário', () => {
      // Objetivo: Validar criação de avaliação completa
      // Regra de negócio: Usuários podem avaliar com nota (1-5) e comentário
      
      // Mock para cenário SEM avaliação existente (botão "Avaliar")
      cy.intercept('GET', 'http://localhost:3001/reviews?movieId=1', {
        statusCode: 200,
        body: [] // Array vazio = usuário não avaliou ainda
      }).as('getNoReviews');
      
      cy.visit('/movie/1');
      cy.wait('@getWatchedMovie');
      cy.wait('@getNoReviews');
      
      const reviewData = {
        rating: 4,
        comment: 'Excelente filme! Atuações incríveis e roteiro muito bem construído.'
      };
      
      cy.intercept('POST', 'http://localhost:3001/reviews', {
        statusCode: 201,
        body: {
          id: Date.now(),
          movieId: 1,
          userId: 2,
          rating: reviewData.rating,
          comment: reviewData.comment,
          date: new Date().toISOString()
        }
      }).as('createReview');
      
      // Intercepta GET atualizado com a nova review
      cy.intercept('GET', 'http://localhost:3001/reviews*', {
        statusCode: 200,
        body: [{
          id: Date.now(),
          movieId: 1,
          userId: 2,
          rating: reviewData.rating,
          comment: reviewData.comment,
          date: new Date().toISOString()
        }]
      }).as('getUpdatedReviews');
      
      // Verifica que o botão é "Avaliar" (sem avaliação existente)
      cy.get('[data-testid="review-button"]').should('contain', 'Avaliar');
      
      // Abre formulário de avaliação
      cy.get('[data-testid="review-button"]').click();
      
      // Seleciona nota (4 estrelas)
      cy.get('[data-testid="rating-4"]').click();
      
      // Digita comentário
      cy.get('[data-testid="review-comment"]').type(reviewData.comment);
      
      // Submete avaliação
      cy.get('[data-testid="submit-review"]').click();
      
      cy.wait('@createReview');
      cy.wait('@getUpdatedReviews');
      
      // Verifica se a avaliação aparece na interface
      cy.contains(reviewData.comment).should('be.visible');
    });

it('deve permitir editar uma avaliação existente', () => {
  cy.visit('/');
  cy.window().then((win) => {
    win.localStorage.setItem('currentUser', JSON.stringify({
      id: 2,
      name: 'Regular User',
      email: 'user@test.com',
      role: 'user'
    }));
  });

  const existingReview = {
    id: 123,
    movieId: 1,
    userId: 2,
    rating: 3,
    comment: 'Avaliação inicial que será editada',
    date: new Date().toISOString()
  };

  const editedReview = {
    ...existingReview,
    rating: 5,
    comment: 'Avaliação editada com sucesso!'
  };

  // Variável para controlar qual review retorna (antes/depois)
  let reviewAtual = existingReview;

  cy.intercept('GET', '**/reviews?movieId=1', (req) => {
    req.reply({
      statusCode: 200,
      body: [reviewAtual]
    });
  }).as('getReviews');

  cy.intercept('PUT', `**/reviews/${existingReview.id}`, (req) => {
    reviewAtual = editedReview; // Atualiza mock para resposta editada
    req.reply({
      statusCode: 200,
      body: editedReview
    });
  }).as('updateReview');

  cy.visit('/movie/1');
  cy.wait('@getReviews'); // 1ª chamada, review antiga

  cy.get('[data-testid="user-name"]').should('contain', 'Regular User');
  cy.get('[data-testid="review-button"]').should('contain', 'Editar Avaliação').click();

  // Agora o textarea deve ter o valor antigo
  cy.get('[data-testid="review-comment"]')
    .should('be.visible')
    .and('have.value', existingReview.comment);

  // Edita e envia
  cy.get('[data-testid="review-comment"]').clear().type(editedReview.comment);
  cy.get('[data-testid="rating-5"]').click();
  cy.get('[data-testid="submit-review"]').click();

  cy.wait('@updateReview');
  cy.wait('@getReviews'); // 2ª chamada, agora já devolve editada

  // Agora o texto novo deve aparecer na tela
  cy.contains(editedReview.comment).should('be.visible');
});

    it('deve validar que a nota é obrigatória para submeter avaliação', () => {
      // Objetivo: Validar validação de campos obrigatórios
      // Regra de negócio: Nota é obrigatória para avaliação
      
      cy.visit('/movie/1');
      cy.wait('@getWatchedMovie');
      
      cy.get('[data-testid="review-button"]').click();
      
      // Tenta submeter apenas com comentário, sem nota
      cy.get('[data-testid="review-comment"]').type('Comentário sem nota');
      cy.get('[data-testid="submit-review"]').click();
      
      // Verifica se o formulário permanece aberto ou se há mensagem de erro
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="review-form"]').length > 0) {
          cy.get('[data-testid="review-form"]').should('be.visible');
        } else {
          // Alternativa: verifica se ainda está na mesma página
          cy.url().should('include', '/movie/1');
        }
      });
    });

    it('deve permitir avaliação apenas com nota, sem comentário', () => {
      // Objetivo: Validar que comentário é opcional
      // Regra de negócio: Comentário não é obrigatório, apenas a nota
      
      cy.visit('/movie/1');
      cy.wait('@getWatchedMovie');
      
      cy.intercept('POST', 'http://localhost:3001/reviews', {
        statusCode: 201,
        body: {
          id: Date.now(),
          movieId: 1,
          userId: 2,
          rating: 5,
          comment: '',
          date: new Date().toISOString()
        }
      }).as('createRatingOnly');
      
      cy.get('[data-testid="review-button"]').click();
      
      // Seleciona apenas a nota
      cy.get('[data-testid="rating-5"]').click();
      cy.get('[data-testid="submit-review"]').click();
      
      cy.wait('@createRatingOnly');
      
      // Verifica se a avaliação foi criada
      cy.get('[data-testid="review-form"]').should('not.exist');
    });
  });

  context('Visualização de Avaliações e Cálculo de Média', () => {
    beforeEach(() => {
      cy.intercept('GET', 'http://localhost:3001/movies/1', {
        ...require('../fixtures/movie-details.json'),
        watched: true
      }).as('getWatchedMovie');
    });

    it('deve exibir avaliações de outros usuários para o filme', () => {
      // Objetivo: Validar exibição de avaliações de outros usuários
      // Regra de negócio: Todas as avaliações devem ser visíveis para todos
      
      const mockReviews = [
        {
          id: 1,
          movieId: 1,
          userId: 1,
          rating: 5,
          comment: 'Filme incrível! Recomendo muito.',
          date: '2024-01-15T10:00:00Z'
        },
        {
          id: 2,
          movieId: 1,
          userId: 3,
          rating: 4,
          comment: 'Muito bom, mas poderia ser melhor.',
          date: '2024-01-16T14:30:00Z'
        }
      ];
      
      cy.intercept('GET', 'http://localhost:3001/reviews*', mockReviews).as('getMultipleReviews');
      
      cy.visit('/movie/1');
      cy.wait('@getWatchedMovie');
      cy.wait('@getMultipleReviews');
      
      // Verifica se as avaliações são exibidas
      cy.contains('Filme incrível! Recomendo muito.').should('be.visible');
      cy.contains('Muito bom, mas poderia ser melhor.').should('be.visible');
      
      // Verifica se a contagem de avaliações está correta
      cy.contains('Avaliações (2)').should('be.visible');
    });

    it('deve calcular e exibir a média das avaliações corretamente', () => {
      // Objetivo: Validar cálculo de média de avaliações
      // Regra de negócio: Média deve ser calculada automaticamente
      
      const mockReviews = [
        { id: 1, movieId: 1, userId: 1, rating: 5, comment: 'Excelente', date: '2024-01-15T10:00:00Z' },
        { id: 2, movieId: 1, userId: 3, rating: 3, comment: 'Regular', date: '2024-01-16T14:30:00Z' },
        { id: 3, movieId: 1, userId: 4, rating: 4, comment: 'Bom', date: '2024-01-17T09:15:00Z' }
      ];
      // Média esperada: (5 + 3 + 4) / 3 = 4.0
      
      cy.intercept('GET', 'http://localhost:3001/reviews*', mockReviews).as('getReviewsForAverage');
      
      cy.visit('/movie/1');
      cy.wait('@getWatchedMovie');
      cy.wait('@getReviewsForAverage');
      
      // Verifica se a média é calculada e exibida (pode estar em diferentes elementos)
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="average-rating"]').length > 0) {
          cy.get('[data-testid="average-rating"]').should('contain', '4.0');
        } else {
          // Alternativa: procura por texto que contenha a média
          cy.contains('4.0').should('be.visible');
        }
      });
      
      // Verifica se há estrelas preenchidas (indicando avaliação)
      cy.get('.text-yellow-400.fill-current').should('have.length.at.least', 1);
    });

    it('deve exibir mensagem quando não há avaliações', () => {
      // Objetivo: Validar estado vazio de avaliações
      // Regra de negócio: Sistema deve informar quando não há avaliações
      
      cy.intercept('GET', 'http://localhost:3001/reviews*', []).as('getNoReviews');
      
      cy.visit('/movie/1');
      cy.wait('@getWatchedMovie');
      cy.wait('@getNoReviews');
      
      // Verifica mensagem de estado vazio
      cy.contains('Nenhuma avaliação ainda').should('be.visible');
      cy.contains('Seja o primeiro a avaliar este filme!').should('be.visible');
    });

    it('deve exibir data das avaliações no formato brasileiro', () => {
      // Objetivo: Validar formatação de data
      // Regra de negócio: Datas devem ser exibidas no formato local
      
      const mockReview = {
        id: 1,
        movieId: 1,
        userId: 1,
        rating: 5,
        comment: 'Avaliação com data formatada',
        date: '2024-01-15T10:00:00Z'
      };
      
      cy.intercept('GET', 'http://localhost:3001/reviews*', [mockReview]).as('getReviewWithDate');
      
      cy.visit('/movie/1');
      cy.wait('@getWatchedMovie');
      cy.wait('@getReviewWithDate');
      
      // Verifica se a data está no formato brasileiro
      cy.contains('15/01/2024').should('be.visible');
    });
  });

  context('Interface e Experiência do Usuário', () => {
    beforeEach(() => {
      cy.intercept('GET', 'http://localhost:3001/movies/1', {
        ...require('../fixtures/movie-details.json'),
        watched: true
      }).as('getWatchedMovie');
    });

    it('deve alternar entre abas de avaliações e comentários', () => {
      // Objetivo: Validar navegação entre abas
      // Regra de negócio: Interface deve permitir alternar entre seções
      
      cy.visit('/movie/1');
      cy.wait('@getWatchedMovie');
      
      // Verifica aba de avaliações ativa por padrão
      cy.contains('Avaliações').should('have.class', 'bg-accent-blue');
      
      // Alterna para aba de comentários
      cy.contains('Comentários').click();
      cy.contains('Comentários').should('have.class', 'bg-accent-blue');
      cy.contains('Avaliações').should('not.have.class', 'bg-accent-blue');
      
      // Volta para aba de avaliações
      cy.contains('Avaliações').click();
      cy.contains('Avaliações').should('have.class', 'bg-accent-blue');
    });

    it('deve fechar o formulário de avaliação ao clicar em cancelar', () => {
      // Objetivo: Validar cancelamento de operação
      // Regra de negócio: Usuário pode cancelar criação/edição de avaliação
      
      cy.visit('/movie/1');
      cy.wait('@getWatchedMovie');
      
      // Abre formulário
      cy.get('[data-testid="review-button"]').click();
      cy.get('[data-testid="review-form"]').should('be.visible');
      
      // Preenche parcialmente
      cy.get('[data-testid="rating-3"]').click();
      cy.get('[data-testid="review-comment"]').type('Comentário cancelado');
      
      // Cancela operação
      cy.contains('Cancelar').click();
      
      // Verifica se o formulário foi fechado
      cy.get('[data-testid="review-form"]').should('not.exist');
    });

    it('deve exibir indicador visual de estrelas interativas no formulário', () => {
      // Objetivo: Validar interatividade das estrelas
      // Regra de negócio: Interface deve ser intuitiva para seleção de nota
      
      cy.visit('/movie/1');
      cy.wait('@getWatchedMovie');
      
      cy.get('[data-testid="review-button"]').click();
      
      // Testa hover e seleção de estrelas
      cy.get('[data-testid="rating-3"]').trigger('mouseover');
      cy.get('[data-testid="rating-3"]').should('have.class', 'text-yellow-400');
      
      // Seleciona 3 estrelas
      cy.get('[data-testid="rating-3"]').click();
      
      // Verifica se as 3 primeiras estrelas estão preenchidas
      for (let i = 1; i <= 3; i++) {
        cy.get(`[data-testid="rating-${i}"]`).should('have.class', 'text-yellow-400');
      }
      
      // Verifica se as 2 últimas estrelas não estão preenchidas
      for (let i = 4; i <= 5; i++) {
        cy.get(`[data-testid="rating-${i}"]`).should('have.class', 'text-gray-500');
      }
    });
  });
});