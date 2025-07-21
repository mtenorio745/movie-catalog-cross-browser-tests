describe('Testes de Componentes - Movie Catalog', () => {
  before(() => {
    cy.resetDatabase();
  });

  beforeEach(() => {
    cy.visit('/');
  });

  context('Componente Navbar', () => {
    it('deve exibir logo e título da aplicação', () => {
      // Objetivo: Validar elementos visuais principais da navbar
      // Regra de negócio: Identidade visual deve estar sempre presente
      
      cy.get('[data-testid="navbar"]').should('be.visible');
      cy.contains('Movie Catalog').should('be.visible');
      
      // Verifica se o ícone está presente
      cy.get('[data-testid="navbar"] svg').should('be.visible');
      
      // Verifica se é clicável e navega para home
      cy.contains('Movie Catalog').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });

    it('deve mostrar diferentes estados de autenticação', () => {
      // Objetivo: Validar mudança de estado da navbar baseada em autenticação
      // Regra de negócio: Interface deve refletir status de login
      
      // Estado não logado
      cy.get('[data-testid="login-link"]').should('be.visible');
      cy.get('[data-testid="user-name"]').should('not.exist');
      cy.get('[data-testid="favorites-link"]').should('not.exist');
      
      // Faz login
      cy.loginAsUser();
      cy.visit('/');
      
      // Estado logado
      cy.get('[data-testid="user-name"]').should('contain', 'Regular User');
      cy.get('[data-testid="favorites-link"]').should('be.visible');
      cy.get('[data-testid="logout-button"]').should('be.visible');
      cy.get('[data-testid="login-link"]').should('not.exist');
    });

    it('deve ser responsivo em diferentes tamanhos de tela', () => {
      // Objetivo: Validar responsividade da navbar
      // Regra de negócio: Interface deve funcionar em mobile e desktop
      
      cy.loginAsUser();
      cy.visit('/');
      
      // Desktop - textos visíveis
      cy.viewport(1280, 720);
      cy.get('[data-testid="favorites-link"]').should('contain', 'Favoritos');
      
      // Mobile - apenas ícones
      cy.viewport('iphone-6');
      cy.get('[data-testid="navbar"]').should('be.visible');
      cy.get('[data-testid="user-name"]').should('not.be.visible'); // hidden em mobile
      
      // Tablet - estado intermediário
      cy.viewport('ipad-2');
      cy.get('[data-testid="navbar"]').should('be.visible');
    });
  });

  context('Componente MovieCard', () => {
    it('deve exibir informações básicas do filme', () => {
      // Objetivo: Validar dados essenciais no card
      // Regra de negócio: Usuários precisam ver informações principais
      
      cy.get('[data-testid="movie-card"]').first().within(() => {
        // Elementos obrigatórios
        cy.get('[data-testid="movie-title"]').should('be.visible');
        cy.get('img').should('be.visible').and('have.attr', 'src');
        cy.get('[data-testid="movie-details-link"]').should('be.visible');
        
        // Informações de contexto
        cy.contains(/\d{4}/).should('be.visible'); // Ano
        cy.get('span').contains(/^(Filme|Série)$/).should('be.visible'); // Tipo
      });
    });

    it('deve mostrar controles apenas para usuários logados', () => {
      // Objetivo: Validar controle de acesso nos cards
      // Regra de negócio: Apenas usuários logados podem favoritar/marcar assistido
      
      // Usuário não logado - sem controles
      cy.get('[data-testid="movie-card"]').first().within(() => {
        cy.get('[data-testid="toggle-favorite-button"]').should('not.exist');
        cy.get('[data-testid="toggle-watched-button"]').should('not.exist');
      });
      
      // Usuário logado - com controles
      cy.loginAsUser();
      cy.visit('/');
      
      cy.get('[data-testid="movie-card"]').first().as('movieCard');
      cy.showCardButtons('@movieCard');
      
      cy.get('@movieCard').within(() => {
        cy.get('[data-testid="toggle-favorite-button"]').should('exist');
        cy.get('[data-testid="toggle-watched-button"]').should('exist');
      });
    });

    it('deve ter hover states funcionais', () => {
      // Objetivo: Validar interatividade visual
      // Regra de negócio: Feedback visual melhora UX
      
      cy.get('[data-testid="movie-card"]').first().as('card');
      
      // Estado normal
      cy.get('@card').should('have.class', 'hover:scale-105');
      
      // Hover - escala e sombra
      cy.get('@card').trigger('mouseover');
      cy.get('@card').should('be.visible'); // Card permanece visível
      
      // Imagem com zoom no hover
      cy.get('@card').find('img').should('have.class', 'group-hover:scale-110');
    });
  });

  context('Componente de Filtros', () => {
    it('deve ter todos os controles de filtro visíveis', () => {
      // Objetivo: Validar presença de todos os filtros
      // Regra de negócio: Usuários precisam poder filtrar conteúdo
      
      cy.get('[data-testid="search-input"]').should('be.visible')
        .and('have.attr', 'placeholder', 'Buscar filmes...');
      
      cy.get('[data-testid="type-filter"]').should('be.visible');
      cy.get('[data-testid="genre-filter"]').should('be.visible');
      cy.get('[data-testid="year-filter"]').should('be.visible');
      
      // Verifica opções padrão
      cy.get('[data-testid="type-filter"]').should('contain', 'Todos');
      cy.get('[data-testid="genre-filter"]').should('contain', 'Todos');
      cy.get('[data-testid="year-filter"]').should('contain', 'Todos');
    });

    it('deve aplicar filtros em tempo real', () => {
      // Objetivo: Validar reatividade dos filtros
      // Regra de negócio: Filtros devem funcionar instantaneamente
      
      // Contagem inicial
      cy.get('[data-testid="movie-card"]').should('have.length', 9);
      
      // Filtro por busca
      cy.get('[data-testid="search-input"]').type('Rei');
      cy.get('[data-testid="movie-card"]').should('have.length', 1);
      cy.get('[data-testid="movie-title"]').should('contain', 'O Rei Leão');
      
      // Limpa busca
      cy.get('[data-testid="search-input"]').clear();
      cy.get('[data-testid="movie-card"]').should('have.length', 9);
      
      // Filtro por tipo
      cy.get('[data-testid="type-filter"]').select('movie');
      cy.get('[data-testid="movie-card"]').should('have.length', 5);
    });

    it('deve ter estado vazio funcional', () => {
      // Objetivo: Validar tratamento de busca sem resultados
      // Regra de negócio: Sistema deve informar quando não há resultados
      
      cy.get('[data-testid="search-input"]').type('filme inexistente xyz');
      
      // Verifica estado vazio
      cy.contains('Nenhum resultado encontrado').should('be.visible');
      cy.get('[data-testid="movie-card"]').should('not.exist');
      
      // Botão de limpar filtros
      cy.contains('Limpar Filtros').should('be.visible').click();
      
      // Volta ao estado normal
      cy.get('[data-testid="search-input"]').should('have.value', '');
      cy.get('[data-testid="movie-card"]').should('have.length', 9);
    });
  });

  context('Componente BackButton', () => {
    it('deve navegar corretamente entre páginas', () => {
      // Objetivo: Validar navegação de volta
      // Regra de negócio: Usuários devem poder voltar facilmente
      
      // Vai para detalhes
      cy.get('[data-testid="movie-details-link"]').first().click();
      cy.url().should('include', '/movie/');
      
      // Botão voltar presente e funcional
      cy.contains('Voltar').should('be.visible').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
      
      // Verifica se voltou para o catálogo
      cy.get('[data-testid="movie-card"]').should('have.length', 9);
    });
  });

  context('Componente LoadingSpinner', () => {
    it('deve aparecer durante carregamentos', () => {
      // Objetivo: Validar feedback de loading
      // Regra de negócio: Usuários devem saber quando algo está carregando
      
      // Simula loading lento
      cy.intercept('GET', 'http://localhost:3001/movies', (req) => {
        req.reply((res) => {
          return new Promise((resolve) => {
            setTimeout(() => resolve({
              statusCode: 200,
              body: []
            }), 1000);
          });
        });
      }).as('slowMovies');
      
      cy.visit('/');
      
      // Loading deve aparecer
      cy.contains('Carregando').should('be.visible');
      cy.get('.animate-spin').should('be.visible');
      
      cy.wait('@slowMovies');
      
      // Loading deve desaparecer
      cy.contains('Carregando').should('not.exist');
    });
  });

  context('Acessibilidade dos Componentes', () => {
    it('deve ter elementos focáveis via teclado', () => {
      // Objetivo: Validar navegação por teclado
      // Regra de negócio: Interface deve ser acessível
      
      // Links e botões devem ser focáveis
      cy.get('[data-testid="login-link"]').focus().should('have.focus');
      cy.get('[data-testid="search-input"]').focus().should('have.focus');
      cy.get('[data-testid="type-filter"]').focus().should('have.focus');
      
      // Navegação com Tab
      cy.get('[data-testid="search-input"]').focus().tab();
      cy.focused().should('have.attr', 'data-testid', 'type-filter');
    });
  });

  context('Performance dos Componentes', () => {
    it('deve renderizar lista de filmes rapidamente', () => {
      // Objetivo: Validar performance de renderização
      // Regra de negócio: Interface deve ser responsiva
      
      const startTime = Date.now();
      
      cy.visit('/').then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // 3 segundos máximo
      });
      
      cy.get('[data-testid="movie-card"]').should('have.length', 9);
    });

    it('deve manter performance com filtros', () => {
      // Objetivo: Validar que filtros não degradam performance
      // Regra de negócio: Filtros devem ser instantâneos
      
      // Aplica múltiplos filtros rapidamente
      cy.get('[data-testid="search-input"]').type('a');
      cy.get('[data-testid="type-filter"]').select('movie');
      cy.get('[data-testid="genre-filter"]').select('Animação');
      
      // Resultado deve aparecer rapidamente
      cy.get('[data-testid="movie-card"]', { timeout: 1000 }).should('exist');
    });
  });
});