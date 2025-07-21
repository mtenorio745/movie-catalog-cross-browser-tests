describe('Sistema de Comentários de Filmes/Séries', () => {
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
    cy.visit('/movie/1');
    cy.wait('@getMovieDetails');
  });

  context('Visualização e Interface de Comentários', () => {
    it('deve exibir a seção de comentários e o formulário para adicionar comentário', () => {
      // Objetivo: Validar interface básica de comentários
      // Regra de negócio: Todos os usuários logados podem comentar
      
      // Navega para a aba de comentários
      cy.contains('Comentários').click();
      
      // Verifica se a aba está ativa
      cy.contains('Comentários').should('have.class', 'bg-accent-blue');
      
      // Verifica se o formulário está visível
      cy.contains('Adicionar Comentário').should('be.visible');
      cy.get('[data-testid="comment-form"]').should('be.visible');
      cy.get('[data-testid="comment-input"]').should('be.visible');
      cy.get('[data-testid="submit-comment"]').should('be.visible');
    });

    it('deve alternar corretamente entre abas de avaliações e comentários', () => {
      // Objetivo: Validar navegação entre abas
      // Regra de negócio: Interface deve permitir alternar entre seções
      
      // Verifica aba de avaliações ativa por padrão
      cy.contains('Avaliações').should('have.class', 'bg-accent-blue');
      
      // Alterna para comentários
      cy.contains('Comentários').click();
      cy.contains('Comentários').should('have.class', 'bg-accent-blue');
      cy.contains('Avaliações').should('not.have.class', 'bg-accent-blue');
      
      // Volta para avaliações
      cy.contains('Avaliações').click();
      cy.contains('Avaliações').should('have.class', 'bg-accent-blue');
      cy.contains('Comentários').should('not.have.class', 'bg-accent-blue');
    });

    it('deve exibir contador de comentários na aba', () => {
      // Objetivo: Validar contador de comentários
      // Regra de negócio: Interface deve mostrar quantidade de comentários
      
      const mockComments = [
        {
          id: '1',
          movieId: 1,
          userId: 2,
          comment: 'Primeiro comentário',
          date: new Date().toISOString()
        },
        {
          id: '2',
          movieId: 1,
          userId: 1,
          comment: 'Segundo comentário',
          date: new Date().toISOString()
        }
      ];
      
      cy.intercept('GET', 'http://localhost:3001/comments*', {
        statusCode: 200,
        body: mockComments,
        delay: 100
      }).as('getMultipleComments');
      
      cy.reload();
      cy.wait('@getMovieDetails');
      cy.wait('@getMultipleComments');
      
      // Verifica se o contador está correto
      cy.contains('Comentários (2)').should('be.visible');
    });
  });

  context('Criação e Adição de Comentários', () => {
    beforeEach(() => {
      cy.contains('Comentários').click();
    });

    it('deve permitir adicionar um novo comentário e exibi-lo na lista', () => {
      // Objetivo: Validar criação de comentário
      // Regra de negócio: Usuários logados podem criar comentários
      
      const commentText = 'Este é um comentário de teste muito interessante adicionado via Cypress!';
      const newCommentId = Date.now().toString();
      const newComment = {
        id: newCommentId,
        movieId: 1,
        userId: 2,
        comment: commentText,
        date: new Date().toISOString()
      };
      
      cy.intercept('POST', 'http://localhost:3001/comments', {
        statusCode: 201,
        body: newComment,
        delay: 100
      }).as('createComment');
      
      // Intercepta GET atualizado para incluir o novo comentário
      cy.intercept('GET', 'http://localhost:3001/comments*', {
        statusCode: 200,
        body: [newComment],
        delay: 100
      }).as('getUpdatedComments');
      
      // Digita o comentário
      cy.get('[data-testid="comment-input"]').type(commentText);
      
      // Submete o comentário
      cy.get('[data-testid="submit-comment"]').click();
      
      cy.wait('@createComment');
      cy.wait('@getUpdatedComments');
      
      // Verifica se o comentário aparece na lista
      cy.contains(commentText).should('be.visible');
    });

    it('deve limpar o campo de comentário após envio bem-sucedido', () => {
      // Objetivo: Validar limpeza de formulário após envio
      // Regra de negócio: Campo deve ser limpo para facilitar novos comentários
      
      const commentText = 'Comentário para verificar limpeza do campo.';
      
      cy.intercept('POST', 'http://localhost:3001/comments', {
        statusCode: 201,
        body: {
          id: Date.now().toString(),
          movieId: 1,
          userId: 2,
          comment: commentText,
          date: new Date().toISOString()
        },
        delay: 100
      }).as('createCommentClean');
      
      // Digita e submete comentário
      cy.get('[data-testid="comment-input"]').type(commentText);
      cy.get('[data-testid="submit-comment"]').click();
      
      cy.wait('@createCommentClean');
      
      // Verifica se o campo foi limpo
      cy.get('[data-testid="comment-input"]').should('have.value', '');
    });

    it('deve exibir a data do comentário no formato brasileiro', () => {
      // Objetivo: Validar formatação de data
      // Regra de negócio: Datas devem ser exibidas no formato local
      
      const today = new Date();
      const commentText = 'Comentário com data de hoje.';
      const newComment = {
        id: Date.now().toString(),
        movieId: 1,
        userId: 2,
        comment: commentText,
        date: today.toISOString()
      };
      
      cy.intercept('POST', 'http://localhost:3001/comments', {
        statusCode: 201,
        body: newComment,
        delay: 100
      }).as('createCommentDate');
      
      cy.intercept('GET', 'http://localhost:3001/comments*', {
        statusCode: 200,
        body: [newComment],
        delay: 100
      }).as('getCommentWithDate');
      
      // Adiciona comentário
      cy.get('[data-testid="comment-input"]').type(commentText);
      cy.get('[data-testid="submit-comment"]').click();
      
      cy.wait('@createCommentDate');
      cy.wait('@getCommentWithDate');
      
      // Verifica se a data está no formato brasileiro
      const expectedDate = today.toLocaleDateString('pt-BR');
      cy.contains(commentText).parents('.bg-dark-card').contains(expectedDate).should('be.visible');
    });
  });

  context('Visualização de Comentários Existentes', () => {
    it('deve exibir comentários existentes para o filme', () => {
      // Objetivo: Validar exibição de comentários existentes
      // Regra de negócio: Todos os comentários devem ser visíveis para todos
      
      const mockComments = [
        {
          id: '1',
          movieId: 1,
          userId: 1,
          comment: 'Preciso assistir esse filme!',
          date: '2024-01-17T09:15:00Z'
        },
        {
          id: '2',
          movieId: 1,
          userId: 3,
          comment: 'Filme incrível, recomendo muito!',
          date: '2024-01-18T14:30:00Z'
        }
      ];
      
      cy.intercept('GET', 'http://localhost:3001/comments*', {
        statusCode: 200,
        body: mockComments,
        delay: 100
      }).as('getExistingComments');
      
      cy.reload();
      cy.wait('@getMovieDetails');
      cy.wait('@getExistingComments');
      
      cy.contains('Comentários').click();
      
      // Verifica se os comentários são exibidos
      cy.contains('Preciso assistir esse filme!').should('be.visible');
      cy.contains('Filme incrível, recomendo muito!').should('be.visible');
    });

    it('deve exibir mensagem quando não há comentários', () => {
      // Objetivo: Validar estado vazio de comentários
      // Regra de negócio: Sistema deve informar quando não há comentários
      
      cy.intercept('GET', 'http://localhost:3001/comments*', {
        statusCode: 200,
        body: [],
        delay: 100
      }).as('getNoComments');
      
      cy.reload();
      cy.wait('@getMovieDetails');
      cy.wait('@getNoComments');
      
      cy.contains('Comentários').click();
      
      // Verifica mensagem de estado vazio
      cy.contains('Nenhum comentário ainda').should('be.visible');
      cy.contains('Seja o primeiro a comentar!').should('be.visible');
    });

    it('deve exibir ícone de usuário para cada comentário', () => {
      // Objetivo: Validar elementos visuais dos comentários
      // Regra de negócio: Comentários devem ter identificação visual do autor
      
      const mockComment = {
        id: '1',
        movieId: 1,
        userId: 2,
        comment: 'Comentário com ícone de usuário',
        date: new Date().toISOString()
      };
      
      cy.intercept('GET', 'http://localhost:3001/comments*', {
        statusCode: 200,
        body: [mockComment],
        delay: 100
      }).as('getCommentWithIcon');
      
      cy.reload();
      cy.wait('@getMovieDetails');
      cy.wait('@getCommentWithIcon');
      
      cy.contains('Comentários').click();
      
      // Verifica se há ícone de usuário no comentário
      cy.contains('Comentário com ícone de usuário')
        .parents('.bg-dark-card')
        .find('svg.lucide-user')
        .should('be.visible');
    });
  });

  context('Gerenciamento de Comentários (Edição e Exclusão)', () => {
      // Objetivo: Validar exclusão de comentário próprio
      // Regra de negócio: Usuários podem deletar apenas seus próprios comentários
      
      // 1. Mock do localStorage com usuário logado ANTES de qualquer ação
    it('deve permitir deletar um comentário que pertence ao usuário logado', () => {
      const commentText = 'Comentário para deletar via Cypress';
      const commentId = '12345';
      const userComment = {
        id: commentId,
        movieId: 1,
        userId: 2,
        comment: commentText,
        date: new Date().toISOString()
      };

      // Intercepta GET /comments
      let getCommentsHitCount = 0;
      cy.intercept('GET', 'http://localhost:3001/comments*', (req) => {
        if (getCommentsHitCount === 0) {
          req.reply({ statusCode: 200, body: [userComment], delay: 100 });
        } else {
          req.reply({ statusCode: 200, body: [], delay: 100 });
        }
        getCommentsHitCount++;
      }).as('getCommentsDynamic');

      // Intercepta DELETE
      cy.intercept('DELETE', `http://localhost:3001/comments/${commentId}`, {
        statusCode: 200,
      }).as('deleteComment');

      // Mock localStorage
      cy.window().then((win) => {
        win.localStorage.setItem('currentUser', JSON.stringify({
          id: 2,
          name: 'Regular User',
          email: 'user@test.com',
          role: 'user'
        }));
      });

      cy.reload();
      cy.wait('@getMovieDetails');
      cy.get('[data-testid="user-name"]').should('contain', 'Regular User');

      cy.contains('Comentários').click();

      // Espera o carregamento e só depois age
      cy.wait('@getCommentsDynamic').then(() => {
        cy.contains(commentText).should('be.visible');

        cy.get('[data-testid="delete-comment"]')
          .should('have.length.at.least', 1)
          .first()
          .as('deleteBtn')
          .should('exist')
          .should('be.visible')
          .should('not.be.disabled')
          .then(($btn) => {
            $btn[0].scrollIntoView({ block: 'center' });
            setTimeout(() => {}, 50);
            cy.wrap($btn).click({ force: true });
          });

        cy.wait('@deleteComment').its('response.statusCode').should('eq', 200);
        cy.wait('@getCommentsDynamic');
        cy.contains(commentText).should('not.exist');
      });
    });

      it('não deve exibir o botão de deletar para comentários de outros usuários', () => {
        // Objetivo: Validar restrições de exclusão
        // Regra de negócio: Usuários não podem deletar comentários de outros
        
        // 1. Mock do localStorage com usuário logado
        cy.window().then((win) => {
          win.localStorage.setItem('currentUser', JSON.stringify({
            id: 2,
            name: 'Regular User',
            email: 'user@test.com',
            role: 'user'
          }));
        });
        
        const otherUserComment = {
          id: '999',
          movieId: 1,
          userId: 1, // ID diferente do usuário logado
          comment: 'Comentário de outro usuário - não deve ter botão deletar',
          date: new Date().toISOString()
        };
        
        // 2. Intercepta comentários de outro usuário ANTES de qualquer ação
        cy.intercept('GET', 'http://localhost:3001/comments*', {
          statusCode: 200,
          body: [otherUserComment],
          delay: 100,
          forceNetworkError: false
        }).as('getOtherUserComments');
        
        // 3. Recarrega para aplicar localStorage e mocks
        cy.reload();
        cy.wait('@getMovieDetails');
        
        // 4. Verifica que o usuário está logado
        cy.get('[data-testid="user-name"]').should('contain', 'Regular User');
        
        // 5. Navega para comentários
        cy.contains('Comentários').click();
        cy.wait('@getOtherUserComments');
        
        // 6. Aguarda o comentário carregar
        cy.contains('Comentário de outro usuário').should('be.visible');
        
        // 7. Verifica que NÃO há botão de deletar
        cy.get('[data-testid="delete-comment"]').should('not.exist');
      });

      it('deve exibir botão de deletar apenas para comentários próprios em lista mista', () => {
        // Objetivo: Validar controle de acesso em lista mista
        // Regra de negócio: Controle deve ser aplicado individualmente por comentário
        
        // 1. Mock do localStorage com usuário logado
        cy.window().then((win) => {
          win.localStorage.setItem('currentUser', JSON.stringify({
            id: 2,
            name: 'Regular User',
            email: 'user@test.com',
            role: 'user'
          }));
        });
        
        const mixedComments = [
          {
            id: '100',
            movieId: 1,
            userId: 2, // Usuário logado - DEVE ter botão deletar
            comment: 'Meu comentário próprio',
            date: new Date().toISOString()
          },
          {
            id: '200',
            movieId: 1,
            userId: 1, // Outro usuário - NÃO deve ter botão deletar
            comment: 'Comentário de outro usuário',
            date: new Date().toISOString()
          }
        ];
        
        // 2. Intercepta lista mista ANTES de qualquer ação
        cy.intercept('GET', 'http://localhost:3001/comments*', {
          statusCode: 200,
          body: mixedComments,
          delay: 100,
          forceNetworkError: false
        }).as('getMixedComments');
        
        // 3. Recarrega para aplicar localStorage e mocks
        cy.reload();
        cy.wait('@getMovieDetails');
        
        // 4. Verifica que o usuário está logado
        cy.get('[data-testid="user-name"]').should('contain', 'Regular User');
        
        // 5. Navega para comentários
        cy.contains('Comentários').click();
        cy.wait('@getMixedComments');
        
        // 6. Aguarda ambos os comentários carregarem
        cy.contains('Meu comentário próprio').should('be.visible');
        cy.contains('Comentário de outro usuário').should('be.visible');
        
        // 7. Verifica que há exatamente 1 botão de deletar
        cy.get('[data-testid="delete-comment"]').should('have.length', 1);
        
        // 8. Verifica que o botão está no comentário correto
        cy.contains('Meu comentário próprio')
          .parents('.bg-dark-card')
          .find('[data-testid="delete-comment"]')
          .should('be.visible');
        
        // 9. Verifica que o comentário de outro usuário NÃO tem botão
        cy.contains('Comentário de outro usuário')
          .parents('.bg-dark-card')
          .find('[data-testid="delete-comment"]')
          .should('not.exist');
      });
    });

  context('Validação de Formulário de Comentário', () => {
    beforeEach(() => {
      cy.contains('Comentários').click();
    });

    it('deve validar que o campo de comentário não pode ser vazio', () => {
      // Objetivo: Validar validação de campo obrigatório
      // Regra de negócio: Comentários não podem ser vazios
      
      // Tenta submeter formulário com campo vazio
      cy.get('[data-testid="comment-input"]').clear();
      cy.get('[data-testid="submit-comment"]').click();
      
      // Verifica se o campo permanece vazio (validação impediu envio)
      cy.get('[data-testid="comment-input"]').should('have.value', '');
      
      // Verifica se o formulário ainda está visível (não foi enviado)
      cy.get('[data-testid="comment-form"]').should('be.visible');
    });

    it('deve validar comentários com apenas espaços em branco', () => {
      // Objetivo: Validar validação de conteúdo significativo
      // Regra de negócio: Comentários devem ter conteúdo real
      
      // Tenta submeter comentário com apenas espaços
      cy.get('[data-testid="comment-input"]').type('   ');
      cy.get('[data-testid="submit-comment"]').click();
      
      // Verifica se o campo mantém os espaços (validação impediu envio)
      cy.get('[data-testid="comment-input"]').should('have.value', '   ');
      
      // Verifica se o formulário ainda está visível
      cy.get('[data-testid="comment-form"]').should('be.visible');
    });

    it('deve aceitar comentários com conteúdo válido', () => {
      // Objetivo: Validar aceitação de comentários válidos
      // Regra de negócio: Comentários com conteúdo devem ser aceitos
      
      const validComment = 'Este é um comentário válido com conteúdo significativo.';
      
      cy.intercept('POST', 'http://localhost:3001/comments', {
        statusCode: 201,
        body: {
          id: Date.now().toString(),
          movieId: 1,
          userId: 2,
          comment: validComment,
          date: new Date().toISOString()
        },
        delay: 100
      }).as('createValidComment');
      
      cy.get('[data-testid="comment-input"]').type(validComment);
      cy.get('[data-testid="submit-comment"]').click();
      
      cy.wait('@createValidComment');
      
      // Verifica se o campo foi limpo (indicando sucesso)
      cy.get('[data-testid="comment-input"]').should('have.value', '');
    });
  });

  context('Tratamento de Erros e Estados de Loading', () => {
    beforeEach(() => {
      cy.contains('Comentários').click();
    });

    it('deve tratar erro ao tentar criar comentário com falha de rede', () => {
      // Objetivo: Validar tratamento de erros de rede
      // Regra de negócio: Sistema deve ser resiliente a falhas
      
      cy.intercept('POST', 'http://localhost:3001/comments', {
        statusCode: 500,
        body: { error: 'Erro interno do servidor' }
      }).as('createCommentError');
      
      const commentText = 'Comentário que falhará';
      cy.get('[data-testid="comment-input"]').type(commentText);
      cy.get('[data-testid="submit-comment"]').click();
      
      cy.wait('@createCommentError');
      
      // Verifica se o comentário não foi adicionado à lista
      cy.get('.space-y-4').within(() => {
        cy.contains(commentText).should('not.exist');
      });
      
      // Verifica se o campo mantém o conteúdo para nova tentativa
      cy.get('[data-testid="comment-input"]').should('have.value', commentText);
    });

    it('deve exibir feedback durante operações de comentário', () => {
      // Objetivo: Validar feedback visual durante operações
      // Regra de negócio: Usuários devem receber feedback sobre ações
      
      // Simula resposta lenta
      cy.intercept('POST', 'http://localhost:3001/comments', (req) => {
        req.reply((res) => {
          return new Promise((resolve) => {
            setTimeout(() => resolve({
              statusCode: 201,
              body: {
                id: Date.now().toString(),
                movieId: 1,
                userId: 2,
                comment: req.body.comment,
                date: new Date().toISOString()
              }
            }), 1000);
          });
        });
      }).as('slowCreateComment');
      
      cy.get('[data-testid="comment-input"]').type('Comentário com loading');
      cy.get('[data-testid="submit-comment"]').click();
      
      // Durante o loading, o botão pode estar desabilitado
      cy.get('[data-testid="submit-comment"]').should('be.visible');
      
      cy.wait('@slowCreateComment');
      
      // Verifica se a operação foi concluída
      cy.get('[data-testid="comment-input"]').should('have.value', '');
    });
  });

  context('Acessibilidade e Usabilidade', () => {
    beforeEach(() => {
      cy.contains('Comentários').click();
    });

    it('deve ter formulário acessível com labels apropriados', () => {
      // Objetivo: Validar acessibilidade do formulário
      // Regra de negócio: Interface deve ser acessível para todos
      
      // Verifica se o textarea tem placeholder descritivo
      cy.get('[data-testid="comment-input"]')
        .should('have.attr', 'placeholder')
        .and('contain', 'Escreva seu comentário');
      
      // Verifica se o botão tem texto descritivo
      cy.get('[data-testid="submit-comment"]').should('contain', 'Comentar');
    });

    it('deve permitir navegação por teclado no formulário', () => {
      // Objetivo: Validar navegação por teclado
      // Regra de negócio: Todos os controles devem ser acessíveis via teclado
      
      // Navega para o campo de comentário
      cy.get('[data-testid="comment-input"]').focus();
      cy.get('[data-testid="comment-input"]').should('have.focus');
      
      // Digita comentário
      cy.get('[data-testid="comment-input"]').type('Comentário via teclado');
      
      // Navega para o botão usando Tab
      cy.get('[data-testid="comment-input"]').tab();
      cy.get('[data-testid="submit-comment"]').should('have.focus');
      
      // Pode ativar o botão com Enter
      cy.intercept('POST', 'http://localhost:3001/comments', {
        statusCode: 201,
        body: {
          id: Date.now().toString(),
          movieId: 1,
          userId: 2,
          comment: 'Comentário via teclado',
          date: new Date().toISOString()
        },
        delay: 100
      }).as('createCommentKeyboard');
      
      cy.get('[data-testid="submit-comment"]').type('{enter}');
      cy.wait('@createCommentKeyboard');
      
      // Verifica se a ação foi executada
      cy.get('[data-testid="comment-input"]').should('have.value', '');
    });
  });
});