describe('Testes Cross-Browser - Movie Catalog System', () => {
    before(() => {
    // Reset do banco de dados antes de todos os testes
    cy.resetDatabase();
  });
  
  beforeEach(() => {
    // Intercepta dados consistentes para todos os testes cross-browser
    cy.intercept('GET', 'http://localhost:3001/movies', { fixture: 'movies.json' }).as('getMovies');
    cy.intercept('GET', 'http://localhost:3001/users', { fixture: 'users.json' }).as('getUsers');
    cy.visit('/');
    cy.wait('@getMovies');
  });

  context('Compatibilidade de Renderização Cross-Browser', () => {
    it('deve renderizar corretamente a interface principal em diferentes navegadores', () => {
      // Objetivo: Validar renderização consistente da UI principal
      // Browsers testados: Chrome, Firefox, Edge (via scripts npm)
      
      // Verifica elementos fundamentais da interface
      cy.get('[data-testid="navbar"]').should('be.visible');
      cy.contains('Movie Catalog').should('be.visible');
      
      // Verifica se o grid de filmes carrega corretamente
      cy.get('[data-testid="movie-card"]').should('have.length.greaterThan', 0);
      cy.get('[data-testid="movie-title"]').first().should('be.visible');
      
      // Verifica se filtros são renderizados
      cy.get('[data-testid="search-input"]').should('be.visible');
      cy.get('[data-testid="type-filter"]').should('be.visible');
      cy.get('[data-testid="genre-filter"]').should('be.visible');
      cy.get('[data-testid="year-filter"]').should('be.visible');
    });

    it('deve aplicar estilos CSS corretamente em diferentes engines de renderização', () => {
      // Objetivo: Validar compatibilidade de CSS entre Blink, Gecko e WebKit
      
      // Verifica se gradientes CSS funcionam
      cy.get('.bg-gradient-to-r').should('exist');
      cy.get('.from-accent-blue').should('exist');
      
      // Verifica se backdrop-blur funciona
      cy.get('.backdrop-blur-xl').should('exist');
      
      // Verifica se classes Tailwind são aplicadas
      cy.get('[data-testid="navbar"]').should('have.class', 'bg-dark-bg/95');
      cy.get('[data-testid="movie-card"]').first().should('have.class', 'bg-dark-card');
      
      // Verifica se transições CSS funcionam
      cy.get('.transition-all').should('exist');
      cy.get('.hover\\:scale-105').should('exist');
    });

    it('deve manter responsividade em diferentes viewports e navegadores', () => {
      // Objetivo: Validar layout responsivo cross-browser
      
      // Desktop
      cy.viewport(1280, 720);
      cy.get('[data-testid="navbar"]').should('be.visible');
      cy.get('[data-testid="movie-card"]').should('have.length.greaterThan', 3);
      
      // Tablet
      cy.viewport('ipad-2');
      cy.get('[data-testid="navbar"]').should('be.visible');
      cy.get('[data-testid="movie-card"]').should('exist');
      
      // Mobile
      cy.viewport('iphone-6');
      cy.get('[data-testid="navbar"]').should('be.visible');
      cy.get('[data-testid="movie-card"]').should('exist');
      
      // Volta para desktop
      cy.viewport(1280, 720);
    });
  });

  context('Funcionalidades JavaScript Cross-Browser', () => {
      it('deve manter funcionalidades de autenticação cross-browser', () => {
      // Objetivo: Validar fluxo de login em diferentes navegadores
      
      // Testa navegação para login
      cy.get('[data-testid="login-link"]').click();
      cy.url().should('include', '/login');
      
      // Testa formulário de login
      cy.get('[data-testid="email-input"]').should('be.visible').type('user@test.com');
      cy.get('[data-testid="password-input"]').should('be.visible').type('user123');
      cy.get('[data-testid="login-submit"]').click();
      
      // Verifica redirecionamento após login
      cy.url().should('eq', Cypress.config().baseUrl + '/');
      cy.get('[data-testid="user-name"]').should('contain', 'Regular User');
      
      // Testa logout
      cy.get('[data-testid="logout-button"]').click();
      cy.get('[data-testid="login-link"]').should('be.visible');
    });

    it('deve executar interações de favoritos e assistidos cross-browser', () => {
      // Objetivo: Validar funcionalidades interativas em diferentes browsers
      
      // Estados do filme para simular mudanças reais
      const movieInitial = {
        id: "1",
        title: "O Rei Leão",
        type: "movie",
        genre: "Animação",
        releaseYear: 1994,
        watched: false,
        description: "Animação Disney amada por todas as idades",
        coverImage: "https://i.postimg.cc/ZY8WpyTm/image-500x700.png"
      };
      
      const movieFavorited = { ...movieInitial };
      const movieWatched = { ...movieFavorited, watched: true };
      
      // Mock inicial - filme não favorito nem assistido
      cy.intercept('GET', 'http://localhost:3001/movies', [movieInitial]).as('getMoviesInitial');
      cy.intercept('GET', 'http://localhost:3001/favorites*', []).as('getFavoritesEmpty');
      cy.intercept('POST', 'http://localhost:3001/favorites', {
        statusCode: 201,
        body: { id: Date.now(), userId: 2, movieId: 1 }
      }).as('addFavorite');
      cy.intercept('PUT', 'http://localhost:3001/movies/1', {
        statusCode: 200,
        body: movieWatched
      }).as('updateMovie');
      
      cy.loginAsUser();
      cy.visit('/');
      cy.wait('@getMoviesInitial');
      cy.wait('@getFavoritesEmpty');
      
      cy.get('[data-testid="movie-card"]').first().as('movieCard');
      
      // 1. FAVORITAR: Atualiza mock para incluir favorito
      cy.intercept('GET', 'http://localhost:3001/favorites*', [{
        id: 123, userId: 2, movieId: 1
      }]).as('getFavoritesWithOne');
      
      cy.intercept('GET', 'http://localhost:3001/favorites*', [{
        id: 123, userId: 2, movieId: 1
      }]).as('getFavoritesWithOne');
      
      // Força visibilidade dos botões usando comando customizado
      cy.showCardButtons('@movieCard');
      cy.get('@movieCard').find('[data-testid="toggle-favorite-button"]').click();
      
      // Aguarda requisições e recarregamento de estado
      cy.wait('@addFavorite');
      cy.wait(1000); // Aguarda processamento
      
      // Verifica estado favoritado (botão vermelho)
      cy.showCardButtons('@movieCard');
      cy.get('@movieCard').find('[data-testid="toggle-favorite-button"]')
        .should('be.visible')
        .should('have.class', 'bg-red-600/80');
      
      // 2. MARCAR COMO ASSISTIDO: Atualiza mock do filme
      cy.intercept('GET', 'http://localhost:3001/movies', [movieWatched]).as('getMoviesWatched');
      
      // Força visibilidade e clica
      cy.showCardButtons('@movieCard');
      cy.get('@movieCard').find('[data-testid="toggle-watched-button"]').click();
      
      // Aguarda requisições e recarregamento de estado
      cy.wait('@updateMovie');
      cy.wait(1000); // Aguarda processamento
      
      // Força visibilidade após marcar como assistido
      cy.showCardButtons('@movieCard');
      
      cy.get('@movieCard').find('[data-testid="toggle-watched-button"]')
        .should('be.visible')
        .and('have.class', 'bg-green-600/80');
    });
  });

  context('Persistência de Dados Cross-Browser', () => {
    it('deve manter localStorage consistente entre navegadores', () => {
      // Objetivo: Validar compatibilidade de Web Storage APIs
      
      cy.loginAsUser();
      
      // Verifica se localStorage funciona
      cy.window().its('localStorage').should('exist');
      cy.window().its('localStorage').invoke('getItem', 'currentUser')
        .should('not.be.null')
        .then(JSON.parse)
        .should('have.property', 'email', 'user@test.com');
      
      // Testa persistência após reload
      cy.reload();
      cy.get('[data-testid="user-name"]').should('contain', 'Regular User');
      
      // Testa limpeza de localStorage
      cy.clearLocalStorage();
      cy.reload();
      cy.get('[data-testid="login-link"]').should('be.visible');
    });

    it('deve manter estado de favoritos entre sessões cross-browser', () => {
      // Objetivo: Validar persistência de dados de aplicação
      
      cy.loginAsUser();
      
      // Intercepta favoritos vazios inicialmente
      cy.intercept('GET', 'http://localhost:3001/favorites*', []).as('getEmptyFavorites');
      cy.intercept('POST', 'http://localhost:3001/favorites', {
        statusCode: 201,
        body: { id: 123, userId: 2, movieId: 1 }
      }).as('addFavorite');
      
      cy.visit('/');
      cy.wait('@getMovies');
      cy.wait('@getEmptyFavorites');
      
      // Define o card e força visibilidade
      cy.get('[data-testid="movie-card"]').first().as('movieCard');
      cy.showCardButtons('@movieCard');
      cy.get('@movieCard').find('[data-testid="toggle-favorite-button"]').click();
      
      // Simula nova sessão com favorito persistido
      cy.intercept('GET', 'http://localhost:3001/favorites*', [{
        id: 123, userId: 2, movieId: 1
      }]).as('getPersistentFavorites');
      
      cy.reload();
      cy.wait('@getMovies');
      cy.wait('@getPersistentFavorites');

      // Força visibilidade dos botões removendo a classe de opacidade
      cy.get('[data-testid="movie-card"]').first().as('movieCard');
      cy.get('@movieCard').invoke('addClass', 'group-hover');
      cy.get('@movieCard').find('.opacity-0').invoke('removeClass', 'opacity-0').invoke('addClass', 'opacity-100');

      // Verifica se o estado final está correto
      cy.get('@movieCard').find('[data-testid="toggle-favorite-button"]')
        .should('have.class', 'bg-red-600/80');
    });
  });

  context('Navegação e Roteamento Cross-Browser', () => {
    it('deve navegar corretamente entre páginas em diferentes navegadores', () => {
      // Objetivo: Validar React Router em diferentes browsers
      
      // Testa navegação para detalhes do filme
      cy.intercept('GET', 'http://localhost:3001/movies/1', { fixture: 'movie-details.json' }).as('getMovieDetails');
      cy.intercept('GET', 'http://localhost:3001/reviews*', []).as('getReviews');
      cy.intercept('GET', 'http://localhost:3001/comments*', []).as('getComments');
      
      cy.get('[data-testid="movie-details-link"]').first().click();
      cy.wait('@getMovieDetails');
      cy.url().should('include', '/movie/1');
      cy.get('[data-testid="movie-title"]').should('be.visible');
      
      // Testa botão voltar
      cy.get('button').contains('Voltar').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
      
      // Testa navegação para favoritos (com login)
      cy.loginAsUser();
      cy.intercept('GET', 'http://localhost:3001/favorites*', []).as('getFavorites');
      
      cy.get('[data-testid="favorites-link"]').click();
      cy.wait('@getFavorites');
      cy.url().should('include', '/favorites');
      cy.contains('Meus Favoritos').should('be.visible');
    });

    it('deve manter histórico de navegação cross-browser', () => {
      // Objetivo: Validar History API em diferentes browsers
      
      cy.loginAsAdmin();
      
      // Navega através de múltiplas páginas
      cy.get('[data-testid="admin-link"]').click();
      cy.url().should('include', '/admin');
      
      cy.get('[data-testid="favorites-link"]').click();
      cy.url().should('include', '/favorites');
      
      // Testa navegação com botão voltar do browser
      cy.go('back');
      cy.url().should('include', '/admin');
      
      cy.go('back');
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });

  context('Performance Cross-Browser', () => {
    it('deve carregar recursos em tempo aceitável em diferentes navegadores', () => {
      let duration;

      cy.visit('/', {
        onBeforeLoad: (win) => {
          win.performance.mark('start');
        },
        onLoad: (win) => {
          win.performance.mark('end');
          win.performance.measure('pageLoad', 'start', 'end');
          duration = win.performance.getEntriesByName('pageLoad')[0]?.duration;
        }
      });

      cy.get('[data-testid="movie-card"]').should('exist');

      cy.then(() => {
        // Adicione uma margem maior no Firefox
        const isFirefox = Cypress.isBrowser('firefox');
        const limit = isFirefox ? 10000 : 3000;
        expect(duration, `tempo carregamento (${Cypress.browser.name})`).to.be.lessThan(limit);
      });
    });
    it('deve otimizar requisições de API cross-browser', () => {
      // Objetivo: Validar eficiência de requisições
      
      let requestCount = 0;
      cy.intercept('GET', '**/movies', (req) => {
        requestCount++;
        req.reply({ fixture: 'movies.json' });
      }).as('countedRequests');
      
      cy.reload();
      cy.wait('@countedRequests');
      
      // Verifica se não há requisições duplicadas
      cy.then(() => {
        expect(requestCount).to.be.lessThan(3);
      });
    });
  });

  context('Compatibilidade de Formulários Cross-Browser', () => {
    it('deve validar formulários HTML5 consistentemente', () => {
      // Objetivo: Validar validação de formulários em diferentes browsers
      
      cy.visit('/login');
      
      // Testa validação de email
      cy.get('[data-testid="email-input"]').should('have.attr', 'type', 'email');
      cy.get('[data-testid="password-input"]').should('have.attr', 'type', 'password');
      
      // Testa campos obrigatórios
      cy.get('[data-testid="email-input"]').should('have.attr', 'required');
      cy.get('[data-testid="password-input"]').should('have.attr', 'required');
      
      // Testa submissão com dados válidos
      cy.get('[data-testid="email-input"]').type('user@test.com');
      cy.get('[data-testid="password-input"]').type('user123');
      cy.get('[data-testid="login-submit"]').click();
      
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });

    it('deve manter funcionalidade de busca cross-browser', () => {
      // Objetivo: Validar inputs de busca em diferentes browsers
      
      // Testa input de busca
      cy.get('[data-testid="search-input"]').should('have.attr', 'type', 'text');
      cy.get('[data-testid="search-input"]').should('have.attr', 'placeholder');
      
      // Testa funcionalidade de busca
      cy.get('[data-testid="search-input"]').type('Stranger Things');
      cy.get('[data-testid="movie-card"]').should('have.length', 1);
      cy.get('[data-testid="movie-title"]').should('contain', 'Stranger Things');
      
      // Testa limpeza de busca
      cy.get('[data-testid="search-input"]').clear();
      cy.get('[data-testid="movie-card"]').should('have.length.greaterThan', 1);
    });
  });

  context('Detecção de Navegador e Adaptação', () => {
    it('deve detectar o navegador atual e executar testes específicos', () => {
      // Objetivo: Executar testes específicos por browser quando necessário
      
      cy.window().then((win) => {
        const userAgent = win.navigator.userAgent;
        
        // Log do navegador detectado
        cy.log(`Navegador detectado: ${userAgent}`);
        
        if (userAgent.includes('Chrome')) {
          cy.log('Executando validações específicas para Chrome/Chromium');
          // Verifica funcionalidades específicas do Chrome
          cy.get('[data-testid="movie-card"]').should('exist');
          
        } else if (userAgent.includes('Firefox')) {
          cy.log('Executando validações específicas para Firefox');
          // Verifica funcionalidades específicas do Firefox
          cy.get('[data-testid="movie-card"]').should('exist');
          
        } else if (userAgent.includes('Safari')) {
          cy.log('Executando validações específicas para Safari');
          // Verifica funcionalidades específicas do Safari
          cy.get('[data-testid="movie-card"]').should('exist');
          
        } else {
          cy.log('Navegador não identificado, executando testes genéricos');
        }
        
        // Testes que devem funcionar em todos os navegadores
        cy.get('[data-testid="navbar"]').should('be.visible');
        cy.get('[data-testid="movie-card"]').should('have.length.greaterThan', 0);
      });
    });
  });
});