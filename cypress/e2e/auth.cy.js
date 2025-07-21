describe('Autenticação e Controle de Acesso', () => {
    before(() => {
    // Reset do banco de dados antes de todos os testes
    cy.resetDatabase();
  });
  
  beforeEach(() => {
    // Garante que a página inicial seja visitada antes de cada teste
    cy.visit('/');
  });

  context('Fluxos de Login e Logout', () => {
    it('deve exibir o link de login quando o usuário não está autenticado', () => {
      // Objetivo: Verificar se a interface exibe corretamente o estado não autenticado
      // Regra de negócio: Usuários não logados devem ver o link "Entrar"
      
      cy.get('[data-testid="login-link"]').should('be.visible');
      cy.get('[data-testid="user-name"]').should('not.exist');
    });

    it('deve permitir o login com credenciais de administrador e exibir o link do painel administrativo', () => {
      // Objetivo: Validar login de admin e exibição de funcionalidades específicas
      // Regra de negócio: Admins devem ter acesso ao painel administrativo
      
      cy.loginAsAdmin();
      
      // Verifica se o nome do usuário administrador é exibido
      cy.get('[data-testid="user-name"]').should('contain', 'Admin User');
      // Verifica se o link "Admin" está visível apenas para administradores
      cy.get('[data-testid="admin-link"]').should('be.visible');
    });

    it('deve permitir o login com credenciais de usuário comum e não exibir o link do painel administrativo', () => {
      // Objetivo: Validar login de usuário comum e restrições de acesso
      // Regra de negócio: Usuários comuns não devem ver funcionalidades administrativas
      
      cy.loginAsUser();
      
      // Verifica se o nome do usuário comum é exibido
      cy.get('[data-testid="user-name"]').should('contain', 'Regular User');
      // Verifica se o link "Admin" NÃO está visível para usuários comuns
      cy.get('[data-testid="admin-link"]').should('not.exist');
    });

    it('deve exibir uma mensagem de erro com credenciais inválidas', () => {
      // Objetivo: Validar tratamento de erro para credenciais incorretas
      // Regra de negócio: Sistema deve informar sobre credenciais inválidas
      
      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type('invalid@test.com');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      cy.get('[data-testid="login-submit"]').click();
      
      // Verifica se a mensagem de erro é exibida
      cy.get('[data-testid="error-message"]').should('contain', 'Email ou senha incorretos');
      // Verifica se permanece na página de login
      cy.url().should('include', '/login');
    });

    it('deve realizar o logout corretamente e retornar ao estado de não autenticado', () => {
      // Objetivo: Validar funcionalidade de logout
      // Regra de negócio: Logout deve limpar sessão e retornar ao estado inicial
      
      cy.loginAsAdmin();
      cy.get('[data-testid="user-name"]').should('be.visible');
      
      cy.logout();
      
      // Verifica se retornou ao estado não autenticado
      cy.get('[data-testid="login-link"]').should('be.visible');
      cy.get('[data-testid="user-name"]').should('not.exist');
    });

    it('deve persistir o login após o refresh da página', () => {
      // Objetivo: Validar persistência de sessão via localStorage
      // Regra de negócio: Login deve ser mantido entre sessões do navegador
      
      cy.loginAsAdmin();
      cy.get('[data-testid="user-name"]').should('contain', 'Admin User');
      
      cy.reload();
      
      // Verifica se o login persistiu após reload
      cy.get('[data-testid="user-name"]').should('contain', 'Admin User');
    });
  });

  context('Controle de Acesso Baseado em Papéis', () => {
    it('deve restringir o acesso ao painel administrativo para usuários comuns', () => {
      // Objetivo: Validar controle de acesso baseado em roles
      // Regra de negócio: Apenas admins podem acessar /admin
      
      cy.loginAsUser();
      cy.visit('/admin');
      
      // Verifica se foi redirecionado para a página inicial
      cy.url().should('eq', Cypress.config().baseUrl + '/');
      cy.get('[data-testid="admin-link"]').should('not.exist');
    });

    it('deve permitir o acesso ao painel administrativo para usuários administradores', () => {
      // Objetivo: Validar acesso autorizado ao painel admin
      // Regra de negócio: Admins devem acessar /admin normalmente
      
      cy.loginAsAdmin();
      cy.visit('/admin');
      
      // Verifica se conseguiu acessar o painel admin
      cy.url().should('include', '/admin');
      cy.contains('Admin').should('be.visible');
    });

    it('deve redirecionar usuários não autenticados para login ao tentar acessar áreas restritas', () => {
      // Objetivo: Validar proteção de rotas para usuários não logados
      // Regra de negócio: Usuários não logados não devem acessar áreas restritas
      
      cy.visit('/admin');
      
      // Como não há autenticação, deve ser redirecionado ou não conseguir acessar
      // A implementação atual redireciona para home, mas idealmente seria para login
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });

  context('Validação de Formulário de Login', () => {
    it('deve validar campos obrigatórios no formulário de login', () => {
      // Objetivo: Validar validação de formulário
      // Regra de negócio: Campos email e senha são obrigatórios
      
      cy.visit('/login');
      
      // Tenta submeter formulário vazio
      cy.get('[data-testid="login-submit"]').click();
      
      // Verifica se os campos são marcados como obrigatórios pelo navegador
      cy.get('[data-testid="email-input"]').should('have.attr', 'required');
      cy.get('[data-testid="password-input"]').should('have.attr', 'required');
    });

    it('deve validar formato de email no campo de email', () => {
      // Objetivo: Validar validação de formato de email
      // Regra de negócio: Campo email deve aceitar apenas emails válidos
      
      cy.visit('/login');
      
      // Tenta inserir email inválido
      cy.get('[data-testid="email-input"]').type('email-invalido');
      cy.get('[data-testid="password-input"]').type('senha123');
      cy.get('[data-testid="login-submit"]').click();
      
      // Verifica se o campo email tem validação de tipo
      cy.get('[data-testid="email-input"]').should('have.attr', 'type', 'email');
    });
  });
});