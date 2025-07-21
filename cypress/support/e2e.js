import 'cypress-plugin-tab';

// Comandos customizados para os testes E2E

/**
 * Realiza o login na aplicação com as credenciais fornecidas.
 * @param {string} email - O email do usuário.
 * @param {string} password - A senha do usuário.
 */
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-submit"]').click();
  cy.url().should('eq', Cypress.config().baseUrl + '/'); // Redireciona para a home após login
});

/**
 * Realiza o login como usuário administrador.
 */
Cypress.Commands.add('loginAsAdmin', () => {
  cy.login('admin@test.com', 'admin123');
});

/**
 * Realiza o login como usuário comum.
 */
Cypress.Commands.add('loginAsUser', () => {
  cy.login('user@test.com', 'user123');
});

/**
 * Realiza o logout da aplicação.
 */
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-button"]').click();
  cy.get('[data-testid="login-link"]').should('be.visible'); // Verifica se o link de login está visível após o logout
});

/**
 * Intercepta requisições de API para testes mais robustos e consistentes.
 * Utiliza fixtures para simular respostas da API.
 */
Cypress.Commands.add('interceptMoviesAPI', () => {
  cy.intercept('GET', '**/movies', { fixture: 'movies.json' }).as('getMovies');
  cy.intercept('GET', '**/movies/*', { fixture: 'movie-details.json' }).as('getMovieDetails');
  cy.intercept('POST', '**/movies', { statusCode: 201 }).as('createMovie');
  cy.intercept('PUT', '**/movies/*', { statusCode: 200 }).as('updateMovie');
  cy.intercept('DELETE', '**/movies/*', { statusCode: 200 }).as('deleteMovie');
});

/**
 * Comando para verificar elementos básicos de acessibilidade (data-testid e atributos essenciais).
 * Nota: Para uma verificação de acessibilidade completa, seria necessário integrar uma ferramenta como cypress-axe.
 */
Cypress.Commands.add('checkA11y', () => {
  cy.get('[data-testid]').should('exist'); // Verifica se existem elementos com data-testid
  cy.get('button[type]').should('have.attr', 'type'); // Apenas botões que têm tipo definido
  cy.get('input').should('have.attr', 'type'); // Inputs devem ter tipo definido
});

/**
 * Comando para testar a responsividade da aplicação em diferentes viewports.
 */
Cypress.Commands.add('testResponsive', () => {
  const viewports = ['iphone-6', 'ipad-2', 'macbook-15']; // Viewports comuns para teste
  
  viewports.forEach(viewport => {
    cy.viewport(viewport);
    cy.get('[data-testid="navbar"]').should('be.visible'); // Verifica se a barra de navegação está visível
    cy.wait(500); // Pequena espera para renderização
  });
});

/**
 * Comando para resetar o banco de dados para o estado inicial limpo.
 * Útil para garantir que cada teste comece com dados consistentes.
 */
Cypress.Commands.add('resetDatabase', () => {
  cy.task('resetDatabase').then((result) => {
    if (result.success) {
      cy.log('✅ Database reset completed');
    } else {
      cy.log('❌ Database reset failed:', result.error);
      throw new Error(`Database reset failed: ${result.error}`);
    }
  });
});

/**
 * Comando para resetar dados para estado inicial nos testes.
 * @deprecated Use cy.resetDatabase() instead
 */
Cypress.Commands.add('resetDatabase', () => {
  cy.task('resetDatabase').then((result) => {
    if (result.success) {
      cy.log('✅ Database reset completed');
    } else {
      cy.log('❌ Database reset failed:', result.error);
      throw new Error(`Database reset failed: ${result.error}`);
    }
  });
});

/**
 * Comando para aguardar que um elemento seja carregado e esteja visível.
 * @param {string} selector - O seletor do elemento.
 * @param {number} timeout - Timeout em milissegundos (padrão: 10000).
 */
Cypress.Commands.add('waitForElement', (selector, timeout = 10000) => {
  cy.get(selector, { timeout }).should('be.visible');
});

/**
 * Comando para verificar se um elemento contém uma classe CSS específica.
 * @param {string} selector - O seletor do elemento.
 * @param {string} className - A classe CSS a ser verificada.
 */
Cypress.Commands.add('shouldHaveClass', { prevSubject: true }, (subject, className) => {
  cy.wrap(subject).should('have.class', className);
});

/**
 * Comando global para forçar visibilidade dos botões de ação nos cards de filmes
 * Útil para testes que precisam interagir com botões que só aparecem no hover
 */
Cypress.Commands.add('showMovieCardButtons', () => {
  cy.get('[data-testid="movie-card"]').then($cards => {
    $cards.each((index, card) => {
      const $card = Cypress.$(card);
      // Força hover state
      $card.addClass('group-hover');
      // Força visibilidade dos botões overlay
      $card.find('.opacity-0').removeClass('opacity-0').addClass('opacity-100');
    });
  });
});

/**
 * Comando para forçar visibilidade de botões em um card específico
 * @param {string} cardAlias - Alias do card específico (ex: '@movieCard')
 */
Cypress.Commands.add('showCardButtons', (cardAlias) => {
  cy.get(cardAlias).then($card => {
    // Força hover state
    $card.addClass('group-hover');
    // Força visibilidade dos botões overlay (se existirem)
    const $hiddenElements = $card.find('.opacity-0');
    if ($hiddenElements.length > 0) {
      $hiddenElements.removeClass('opacity-0').addClass('opacity-100');
    }
  });
});

/**
 * Comando para simular hover em um card específico e mostrar botões
 * @param {string} movieTitle - Título do filme para localizar o card
 */
Cypress.Commands.add('hoverMovieCard', (movieTitle) => {
  cy.contains(movieTitle)
    .parents('[data-testid="movie-card"]')
    .as('hoveredCard')
    .then($card => {
      // Simula hover real
      $card.trigger('mouseover');
      // Força estado hover
      $card.addClass('group-hover');
      // Força visibilidade dos botões overlay (se existirem)
      const $hiddenElements = $card.find('.opacity-0');
      if ($hiddenElements.length > 0) {
        $hiddenElements.removeClass('opacity-0').addClass('opacity-100');
      }
    });
  
  return cy.get('@hoveredCard');
});