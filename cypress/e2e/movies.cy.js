describe('Gerenciamento e Visualização de Filmes/Séries - Sistema Real', () => {
  before(() => {
    // Reset do banco de dados antes de todos os testes
    cy.resetDatabase();
  });

  beforeEach(() => {
    cy.visit('/');
  });

  context('Visualização e Navegação do Catálogo (Todos os Usuários)', () => {
    it('deve exibir o catálogo completo com 9 filmes/séries na página inicial', () => {
      // Objetivo: Validar carregamento completo do catálogo real
      // Regra de negócio: Todos os usuários podem visualizar o catálogo completo
      
      cy.get('[data-testid="movie-card"]').should('have.length', 9);
      
      // Verifica títulos específicos do banco atual
      cy.contains('O Rei Leão').should('be.visible');
      cy.contains('De Volta para o Futuro').should('be.visible');
      cy.contains('Friends').should('be.visible');
      cy.contains('Stranger Things').should('be.visible');
      
      // Verifica informações básicas nos cards
      cy.get('[data-testid="movie-card"]').each(($card) => {
        cy.wrap($card).within(() => {
          cy.get('[data-testid="movie-title"]').should('be.visible');
          cy.get('img').should('be.visible').and('have.attr', 'src');
          cy.contains(/\d{4}/).should('be.visible'); // Ano de lançamento
          cy.get('[data-testid="movie-details-link"]').should('be.visible');
        });
      });
    });

    it('deve navegar corretamente para detalhes de filmes específicos do banco', () => {
      // Objetivo: Validar navegação para detalhes usando dados reais
      // Regra de negócio: Usuários podem acessar detalhes de qualquer filme
      
      // Testa navegação para "O Rei Leão" (ID: 1)
      cy.contains('O Rei Leão').parents('[data-testid="movie-card"]')
        .find('[data-testid="movie-details-link"]').click();
      
      cy.url().should('include', '/movie/1');
      cy.get('[data-testid="movie-title"]').should('contain', 'O Rei Leão');
      cy.get('[data-testid="movie-description"]').should('contain', 'Animação Disney');
      
      // Volta para o catálogo
      cy.get('button').contains('Voltar').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });

    it('deve distinguir visualmente filmes e séries com badges corretos', () => {
      // Objetivo: Validar diferenciação entre tipos de mídia
      // Regra de negócio: Filmes e séries devem ser visualmente distinguíveis
      
      // Verifica filmes (5 no total)
      const filmes = ['O Rei Leão', 'De Volta para o Futuro', 'E.T. – O Extraterrestre', 'Os Goonies', 'Forrest Gump'];
      filmes.forEach(filme => {
        cy.contains(filme).parents('[data-testid="movie-card"]')
          .find('span').contains('Filme').should('be.visible');
      });
      
      // Verifica séries (4 no total)
      const series = ['Friends', 'Chaves', 'Stranger Things', 'Anne with an E'];
      series.forEach(serie => {
        cy.contains(serie).parents('[data-testid="movie-card"]')
          .find('span').contains('Série').should('be.visible');
      });
    });

    it('deve exibir status "assistido" para filmes marcados como watched', () => {
      // Objetivo: Validar indicação visual de filmes assistidos
      // Regra de negócio: Filmes assistidos devem ter indicação visual
      
      // Verifica se há filmes marcados como assistidos no banco
      // Nota: O banco seed atual tem todos os filmes como watched: false
      
      // Primeiro, marca um filme como assistido para testar
      cy.loginAsUser();
      cy.visit('/');
      cy.get('[data-testid="movie-card"]').should('have.length', 9);
      
      // Força visibilidade dos botões
      cy.showMovieCardButtons();
      
      // Marca "O Rei Leão" como assistido
      cy.contains('O Rei Leão').parents('[data-testid="movie-card"]').as('movieToWatch');
      cy.get('@movieToWatch').find('[data-testid="toggle-watched-button"]').click();
      
      // Aguarda a atualização
      cy.wait(1000);
      
      // Força visibilidade novamente
      cy.showMovieCardButtons();
      
      // Verifica se o botão está no estado "assistido" (verde)
      cy.get('@movieToWatch').find('[data-testid="toggle-watched-button"]')
        .should('have.class', 'bg-green-600/80');
      
      // Verifica se há ícone de "assistido" visível
      cy.get('@movieToWatch').within(() => {
        cy.get('svg.lucide-eye').should('exist'); // Ícone de olho para assistido
      });
    });
  });

  context('Sistema de Filtros e Busca com Dados Reais', () => {
    it('deve filtrar corretamente por tipo (5 filmes vs 4 séries)', () => {
      // Objetivo: Validar filtro por tipo com contagem real
      // Regra de negócio: Filtros devem refletir dados reais do banco
      
      // Filtra por filmes (deve mostrar 5)
      cy.get('[data-testid="type-filter"]').select('movie');
      cy.get('[data-testid="movie-card"]').should('have.length', 5);
      
      // Verifica se todos são filmes
      cy.get('[data-testid="movie-card"]').each(($card) => {
        cy.wrap($card).find('span').contains('Filme').should('be.visible');
      });
      
      // Filtra por séries (deve mostrar 4)
      cy.get('[data-testid="type-filter"]').select('series');
      cy.get('[data-testid="movie-card"]').should('have.length', 4);
      
      // Verifica se todos são séries
      cy.get('[data-testid="movie-card"]').each(($card) => {
        cy.wrap($card).find('span').contains('Série').should('be.visible');
      });
      
      // Volta para todos
      cy.get('[data-testid="type-filter"]').select('all');
      cy.get('[data-testid="movie-card"]').should('have.length', 9);
    });

    it('deve filtrar por gêneros específicos do banco atual', () => {
      // Objetivo: Validar filtros por gêneros reais
      // Regra de negócio: Filtros devem usar gêneros existentes no banco
      
      // Testa gênero "Comédia" (Friends + Chaves = 2 resultados)
      cy.get('[data-testid="genre-filter"]').select('Comédia');
      cy.get('[data-testid="movie-card"]').should('have.length', 2);
      cy.contains('Friends').should('be.visible');
      cy.contains('Chaves').should('be.visible');
      
      // Testa gênero "Ficção Científica" (3 resultados)
      cy.get('[data-testid="genre-filter"]').select('Ficção Científica');
      cy.get('[data-testid="movie-card"]').should('have.length', 3);
      cy.contains('De Volta para o Futuro').should('be.visible');
      cy.contains('E.T. – O Extraterrestre').should('be.visible');
      cy.contains('Stranger Things').should('be.visible');
      
      // Testa gênero "Família" (2 resultados)
      cy.get('[data-testid="genre-filter"]').select('Família');
      cy.get('[data-testid="movie-card"]').should('have.length', 2);
      cy.contains('Os Goonies').should('be.visible');
      cy.contains('Anne with an E').should('be.visible');
    });

    it('deve filtrar por anos específicos do banco (1994, 1985, etc.)', () => {
      // Objetivo: Validar filtro por anos reais do banco
      // Regra de negócio: Anos devem corresponder aos dados reais
      
      // Testa ano 1994 (3 resultados: Rei Leão, Forrest Gump, Friends)
      cy.get('[data-testid="year-filter"]').select('1994');
      cy.get('[data-testid="movie-card"]').should('have.length', 3);
      cy.contains('O Rei Leão').should('be.visible');
      cy.contains('Forrest Gump').should('be.visible');
      cy.contains('Friends').should('be.visible');
      
      // Testa ano 1985 (2 resultados: De Volta para o Futuro, Os Goonies)
      cy.get('[data-testid="year-filter"]').select('1985');
      cy.get('[data-testid="movie-card"]').should('have.length', 2);
      cy.contains('De Volta para o Futuro').should('be.visible');
      cy.contains('Os Goonies').should('be.visible');
    });

    it('deve buscar por títulos específicos do banco atual', () => {
      // Objetivo: Validar busca por títulos reais
      // Regra de negócio: Busca deve encontrar títulos exatos do banco
      
      // Busca por "Stranger Things"
      cy.get('[data-testid="search-input"]').type('Stranger Things');
      cy.get('[data-testid="movie-card"]').should('have.length', 1);
      cy.get('[data-testid="movie-title"]').should('contain', 'Stranger Things');
      
      // Limpa e busca por "Rei"
      cy.get('[data-testid="search-input"]').clear().type('Rei');
      cy.get('[data-testid="movie-card"]').should('have.length', 1);
      cy.get('[data-testid="movie-title"]').should('contain', 'O Rei Leão');
      
      // Busca por termo que aparece em descrição
      cy.get('[data-testid="search-input"]').clear().type('Disney');
      cy.get('[data-testid="movie-card"]').should('have.length', 1);
      cy.get('[data-testid="movie-title"]').should('contain', 'O Rei Leão');
    });

    it('deve combinar filtros múltiplos com dados reais', () => {
      // Objetivo: Validar combinação de filtros
      // Regra de negócio: Filtros devem funcionar em conjunto
      
      // Filtra por tipo "series" + gênero "Comédia"
      cy.get('[data-testid="type-filter"]').select('series');
      cy.get('[data-testid="genre-filter"]').select('Comédia');
      cy.get('[data-testid="movie-card"]').should('have.length', 2);
      cy.contains('Friends').should('be.visible');
      cy.contains('Chaves').should('be.visible');
      
      // Adiciona filtro de ano 1994 (deve sobrar apenas Friends)
      cy.get('[data-testid="year-filter"]').select('1994');
      cy.get('[data-testid="movie-card"]').should('have.length', 1);
      cy.contains('Friends').should('be.visible');
    });

    it('deve exibir estado vazio para buscas sem resultado', () => {
      // Objetivo: Validar tratamento de busca sem resultados
      // Regra de negócio: Sistema deve informar quando não há resultados
      
      cy.get('[data-testid="search-input"]').type('filme inexistente xyz');
      
      cy.contains('Nenhum resultado encontrado').should('be.visible');
      cy.get('[data-testid="movie-card"]').should('not.exist');
      
      // Testa botão de limpar filtros
      cy.contains('Limpar Filtros').click();
      cy.get('[data-testid="search-input"]').should('have.value', '');
      cy.get('[data-testid="movie-card"]').should('have.length', 9);
    });
  });

  context('Funcionalidades de Usuário Logado com Dados Reais', () => {
    beforeEach(() => {
      cy.loginAsUser();
      cy.visit('/');
    });

    it('deve permitir marcar filmes como assistido e refletir mudança visual', () => {
      // Objetivo: Validar funcionalidade "assistido" com dados reais
      // Regra de negócio: Usuários logados podem marcar filmes como assistidos
      
      // Testa com "E.T." que não está assistido
      cy.contains('E.T. – O Extraterrestre').parents('[data-testid="movie-card"]').as('etCard');
      
      // Força visibilidade do botão
      cy.get('@etCard').trigger('mouseover');
      cy.get('@etCard').find('[data-testid="toggle-watched-button"]').click();
      
      // Verifica mudança visual
      cy.get('@etCard').trigger('mouseover'); // Reaplica hover
      cy.get('@etCard').find('[data-testid="toggle-watched-button"]')
        .should('have.class', 'bg-green-600/80'); // Classe correta com opacidade
    });

    it('deve permitir adicionar filmes aos favoritos', () => {
      // Objetivo: Validar funcionalidade de favoritos
      // Regra de negócio: Usuários logados podem favoritar filmes
      
      cy.contains('Os Goonies').parents('[data-testid="movie-card"]').as('gooniesCard');
      
      // Força visibilidade e adiciona aos favoritos
      cy.get('@gooniesCard').trigger('mouseover');
      cy.get('@gooniesCard').find('[data-testid="toggle-favorite-button"]').click();
      
      // Aguarda a requisição ser processada
      cy.wait(1000);
      
      // Verifica mudança visual após processamento
      cy.get('@gooniesCard').trigger('mouseover'); // Reaplica hover
      cy.get('@gooniesCard').find('[data-testid="toggle-favorite-button"]')
        .should('have.class', 'bg-red-600/80');
    });

    it('deve navegar para página de favoritos e mostrar filmes favoritados', () => {
      // Objetivo: Validar navegação e funcionalidade de favoritos
      // Regra de negócio: Usuários podem gerenciar favoritos
      
      // Adiciona um filme aos favoritos primeiro
      cy.contains('Forrest Gump').parents('[data-testid="movie-card"]').as('forrestCard');
      cy.get('@forrestCard').trigger('mouseover');
      cy.get('@forrestCard').find('[data-testid="toggle-favorite-button"]').click();
      
      // Navega para favoritos
      cy.get('[data-testid="favorites-link"]').click();
      cy.url().should('include', '/favorites');
      cy.contains('Meus Favoritos').should('be.visible');
    });
  });

  context('Operações CRUD de Filmes (Administrador) com Dados Reais', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      // Verifica se tem acesso ao link Admin primeiro
      cy.get('[data-testid="admin-link"]').should('be.visible').click();
      cy.url().should('include', '/admin');
    });

    it('deve exibir todos os 9 filmes/séries na tabela administrativa', () => {
      // Objetivo: Validar painel admin com dados reais
      // Regra de negócio: Admins veem todos os filmes para gerenciamento
      
      cy.get('[data-testid="movie-row"]').should('have.length', 9);
      
      // Verifica se títulos específicos estão na tabela
      cy.contains('O Rei Leão').should('be.visible');
      cy.contains('Friends').should('be.visible');
      cy.contains('Stranger Things').should('be.visible');
    });

    it('deve permitir criar novo filme com dados válidos', () => {
      // Objetivo: Validar criação de filme
      // Regra de negócio: Admins podem adicionar novos filmes
      
      const novoFilme = {
        title: 'Teste Cypress - Novo Filme 2024',
        type: 'movie',
        genre: 'Ação',
        year: '2024',
        description: 'Filme de teste criado via Cypress para validação do sistema CRUD.'
      };
      
      cy.get('[data-testid="add-movie-button"]').click();
      
      // Preenche formulário
      cy.get('[data-testid="movie-title-input"]').type(novoFilme.title);
      cy.get('[data-testid="movie-type-select"]').select(novoFilme.type);
      cy.get('[data-testid="movie-genre-input"]').type(novoFilme.genre);
      cy.get('[data-testid="movie-year-input"]').clear().type(novoFilme.year);
      cy.get('[data-testid="movie-description-input"]').type(novoFilme.description);
      
      cy.get('[data-testid="submit-movie-button"]').click();
      
      // Verifica se foi adicionado
      cy.get('[data-testid="movie-form"]').should('not.exist');
      cy.contains(novoFilme.title).should('be.visible');
      cy.get('[data-testid="movie-row"]').should('have.length', 10); // 9 + 1 novo
    });

    it('deve permitir editar filme existente do banco', () => {
      // Objetivo: Validar edição de filme real
      // Regra de negócio: Admins podem modificar filmes existentes
      
      const tituloOriginal = 'Teste Cypress - Novo Filme 2024';
      const tituloEditado = 'Teste Cypress - Filme Editado 2024';
      
      // Encontra e edita o filme criado no teste anterior
      cy.contains(tituloOriginal).parents('[data-testid="movie-row"]')
        .find('[data-testid="edit-movie-button"]').click();
      
      // Verifica se formulário foi preenchido
      cy.get('[data-testid="movie-title-input"]').should('have.value', tituloOriginal);
      
      // Edita o título
      cy.get('[data-testid="movie-title-input"]').clear().type(tituloEditado);
      cy.get('[data-testid="submit-movie-button"]').click();
      
      // Verifica edição
      cy.get('[data-testid="movie-form"]').should('not.exist');
      cy.contains(tituloEditado).should('be.visible');
      
      // Verifica que o título original não existe mais na tabela
      cy.get('[data-testid="movie-row"]').should('not.contain', tituloOriginal);
    });

    it('deve permitir deletar filme com confirmação', () => {
      // Objetivo: Validar exclusão de filme
      // Regra de negócio: Admins podem remover filmes com confirmação
      
      const filmeParaDeletar = 'Teste Cypress - Filme Editado 2024';
      
      // Mock do confirm dialog
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
      });
      
      // Deleta o filme
      cy.contains(filmeParaDeletar).parents('[data-testid="movie-row"]')
        .find('[data-testid="delete-movie-button"]').click();
      
      // Verifica se foi removido
      cy.contains(filmeParaDeletar).should('not.exist');
      cy.get('[data-testid="movie-row"]').should('have.length', 9); // Volta para 9 (criou 1 + deletou 1)
    });

    it('deve cancelar exclusão quando usuário cancela confirmação', () => {
      cy.get('[data-testid="movie-row"]').should('have.length', 9); // Volta para 9 originais
      // Objetivo: Validar cancelamento de exclusão
      // Regra de negócio: Usuário pode cancelar exclusão
      const filmeParaManter = 'Stranger Things';
            
      // Mock do confirm dialog retornando false
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(false);
      });
      
      cy.contains(filmeParaManter).parents('[data-testid="movie-row"]')
        .find('[data-testid="delete-movie-button"]').click();
      
      // Verifica se filme ainda existe
      cy.contains(filmeParaManter).should('be.visible');
      cy.get('[data-testid="movie-row"]').should('have.length', 9); // Mantém 9 filmes
    });

    it('deve validar campos obrigatórios no formulário', () => {
      // Objetivo: Validar validação de formulário
      // Regra de negócio: Campos essenciais são obrigatórios
      
      cy.get('[data-testid="add-movie-button"]').click();
      
      // Verifica atributos required
      cy.get('[data-testid="movie-title-input"]').should('have.attr', 'required');
      cy.get('[data-testid="movie-genre-input"]').should('have.attr', 'required');
      cy.get('[data-testid="movie-description-input"]').should('have.attr', 'required');
      
      // Tenta submeter formulário vazio
      cy.get('[data-testid="submit-movie-button"]').click();
      
      // Formulário deve permanecer aberto (validação impediu envio)
      cy.get('[data-testid="movie-form"]').should('be.visible');
    });
  });

  context('Controle de Acesso e Permissões', () => {
    it('não deve exibir controles administrativos para usuários comuns', () => {
      // Objetivo: Validar restrições de interface
      // Regra de negócio: Apenas admins veem controles CRUD
      
      cy.loginAsUser();
      cy.visit('/');
      
      // Verifica ausência de controles admin
      cy.get('[data-testid="admin-link"]').should('not.exist');
      
      // Tenta acessar admin diretamente
      cy.visit('/admin');
      cy.url().should('eq', Cypress.config().baseUrl + '/'); // Redirecionado
    });

    it('deve permitir acesso completo ao painel admin para administradores', () => {
      // Objetivo: Validar acesso autorizado
      // Regra de negócio: Admins têm acesso total
      
      cy.loginAsAdmin();
      cy.get('[data-testid="admin-link"]').should('be.visible').click();
      
      cy.url().should('include', '/admin');
      cy.contains('Painel Administrativo').should('be.visible');
      cy.get('[data-testid="add-movie-button"]').should('be.visible');
      cy.get('[data-testid="edit-movie-button"]').should('exist');
      cy.get('[data-testid="delete-movie-button"]').should('exist');
    });
  });

  context('Integração e Fluxos Completos', () => {
    it('deve manter consistência entre catálogo público e painel admin', () => {
      // Objetivo: Validar sincronização entre interfaces
      // Regra de negócio: Dados devem ser consistentes em todas as interfaces
      
      // Verifica catálogo público
      cy.visit('/');
      cy.get('[data-testid="movie-card"]').should('have.length.at.least', 9);
      
      // Verifica painel admin
      cy.loginAsAdmin();
      cy.get('[data-testid="admin-link"]').click();
      
      // Verifica que ambas as interfaces têm a mesma quantidade
      cy.get('[data-testid="movie-row"]').then(($adminRows) => {
        const adminCount = $adminRows.length;
        cy.visit('/');
        cy.get('[data-testid="movie-card"]').should('have.length', adminCount);
      });
      
      // Títulos devem ser os mesmos
      const titulos = ['O Rei Leão', 'Friends', 'Stranger Things'];
      titulos.forEach(titulo => {
        cy.contains(titulo).should('be.visible');
      });
    });

    it('deve manter estado de favoritos e assistidos entre navegações', () => {
      // Objetivo: Validar persistência de estado
      // Regra de negócio: Estado deve persistir durante sessão
      
      cy.loginAsUser();
      cy.visit('/');
      
      // Marca filme como assistido
      cy.contains('Os Goonies').parents('[data-testid="movie-card"]').as('movieCard');
      cy.get('@movieCard').trigger('mouseover');
      cy.get('@movieCard').find('[data-testid="toggle-watched-button"]').click();
      
      // Navega para detalhes e volta
      cy.get('@movieCard').find('[data-testid="movie-details-link"]').click();
      cy.get('button').contains('Voltar').click();
      
      // Verifica se estado persistiu
      cy.get('@movieCard').trigger('mouseover');
      cy.get('@movieCard').find('[data-testid="toggle-watched-button"]')
        .should('have.class', 'bg-green-600/80'); // Classe correta com opacidade
    });
  });
});