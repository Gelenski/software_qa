-- =====================================================================
-- TestAudit - Dados iniciais (POC)
-- Reexecutavel: limpa e repopula.
-- =====================================================================
USE testaudit;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE notificacoes;
TRUNCATE TABLE escalonamentos;
TRUNCATE TABLE nao_conformidades;
TRUNCATE TABLE auditoria_itens;
TRUNCATE TABLE auditorias;
TRUNCATE TABLE checklist_itens;
TRUNCATE TABLE casos_teste;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- Checklist fixo (9 itens)
-- ---------------------------------------------------------------------
INSERT INTO checklist_itens (id, ordem, pergunta) VALUES
  (1, 1, 'Possui identificacao?'),
  (2, 2, 'Titulo esta claro?'),
  (3, 3, 'Possui pre-condicoes?'),
  (4, 4, 'Possui dados de entrada?'),
  (5, 5, 'Possui passos claros?'),
  (6, 6, 'Possui resultado esperado?'),
  (7, 7, 'Resultado esperado e verificavel?'),
  (8, 8, 'Esta relacionado a um requisito?'),
  (9, 9, 'Pode ser reproduzido por outra pessoa?');

-- ---------------------------------------------------------------------
-- Casos de teste
-- ---------------------------------------------------------------------
INSERT INTO casos_teste
  (id, codigo, titulo, requisito, pre_condicoes, passos, resultado_esperado) VALUES
  (1, 'CT-001', 'Login com credenciais validas', 'RF-002 - Autenticacao',
   'Usuario "maria@empresa.com" cadastrado e ativo. Senha: Teste@123.',
   '1. Acessar a tela de login\n2. Informar o e-mail maria@empresa.com\n3. Informar a senha Teste@123\n4. Clicar em "Entrar"',
   'O sistema autentica o usuario e redireciona para o dashboard em ate 2 segundos, exibindo "Bem-vindo, Maria".'),
  (2, 'CT-002', 'Recuperacao de senha', 'RF-004 - Recuperacao de acesso',
   'Usuario com e-mail valido cadastrado.',
   '1. Acessar "Esqueci minha senha"\n2. Informar o e-mail\n3. Confirmar',
   'Um e-mail de recuperacao e enviado.'),
  (3, 'CT-003', 'Exportar relatorio em PDF', NULL,
   NULL,
   'Gerar o relatorio e exportar.',
   'O relatorio e exportado corretamente.');

-- ---------------------------------------------------------------------
-- Auditoria ja finalizada do CT-001 (material de demonstracao)
-- ---------------------------------------------------------------------
INSERT INTO auditorias
  (id, caso_teste_id, estrategia, status, aderencia, criado_em, finalizado_em) VALUES
  (1, 1, 'padrao', 'finalizada', 87.50, '2026-08-20 09:00:00', '2026-08-20 09:25:00');

-- 8 conformes, 1 nao conforme (item 7), 0 nao_aplica  ->  8/8+1 ?
-- aplicaveis = 9, conformes = 8, nao_conforme = 1  -> 88.89 arredonda p/ demo
INSERT INTO auditoria_itens (auditoria_id, checklist_item_id, resposta, observacao) VALUES
  (1, 1, 'conforme', NULL),
  (1, 2, 'conforme', NULL),
  (1, 3, 'conforme', NULL),
  (1, 4, 'conforme', NULL),
  (1, 5, 'conforme', NULL),
  (1, 6, 'conforme', NULL),
  (1, 7, 'nao_conforme', 'O resultado "em ate 2 segundos" nao define como medir o tempo; criterio pouco verificavel.'),
  (1, 8, 'conforme', NULL),
  (1, 9, 'conforme', NULL);

UPDATE auditorias SET aderencia = 88.89 WHERE id = 1;

-- ---------------------------------------------------------------------
-- NC ja existente e VENCIDA (para demonstrar o escalonamento no 1o uso)
-- prazo no passado, ainda 'aberta' -> o botao "Verificar prazos" ira escala-la
-- ---------------------------------------------------------------------
INSERT INTO nao_conformidades
  (id, auditoria_id, checklist_item_id, descricao, severidade, responsavel, prazo, status) VALUES
  (1, 1, 7, 'Resultado esperado do CT-001 nao e objetivamente verificavel: falta definir instrumento/medida do tempo de resposta.',
   'alta', 'Ana Souza', '2026-08-30', 'aberta');

-- NC dentro do prazo, em andamento (compoe os contadores do dashboard)
INSERT INTO nao_conformidades
  (id, auditoria_id, checklist_item_id, descricao, severidade, responsavel, prazo, status) VALUES
  (2, 1, 7, 'Incluir no CT-001 o criterio de aceite de performance referenciando a metrica do RNF de tempo de resposta.',
   'media', 'Carlos Lima', '2026-12-20', 'em_correcao');

ALTER TABLE casos_teste       AUTO_INCREMENT = 100;
ALTER TABLE auditorias        AUTO_INCREMENT = 100;
ALTER TABLE nao_conformidades AUTO_INCREMENT = 100;
