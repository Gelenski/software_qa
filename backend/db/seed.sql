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
TRUNCATE TABLE checklist_templates;
TRUNCATE TABLE casos_teste;
TRUNCATE TABLE responsaveis;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- Responsaveis (nome + e-mail, para notificacoes reais por e-mail)
-- ---------------------------------------------------------------------
INSERT INTO responsaveis (nome, email) VALUES
  ('Ana Souza', 'ana.souza@empresa.com');

-- ---------------------------------------------------------------------
-- Checklist templates
-- ---------------------------------------------------------------------
INSERT INTO checklist_templates (id, nome) VALUES
  (1, 'Checklist padrao de caso de teste');

-- ---------------------------------------------------------------------
-- Checklist fixo (9 itens do template padrao)
-- ---------------------------------------------------------------------
INSERT INTO checklist_itens (id, template_id, ordem, pergunta) VALUES
  (1, 1, 1, 'Possui identificacao?'),
  (2, 1, 2, 'Titulo esta claro?'),
  (3, 1, 3, 'Possui pre-condicoes?'),
  (4, 1, 4, 'Possui dados de entrada?'),
  (5, 1, 5, 'Possui passos claros?'),
  (6, 1, 6, 'Possui resultado esperado?'),
  (7, 1, 7, 'Resultado esperado e verificavel?'),
  (8, 1, 8, 'Esta relacionado a um requisito?'),
  (9, 1, 9, 'Pode ser reproduzido por outra pessoa?');

-- ---------------------------------------------------------------------
-- Casos de teste
-- ---------------------------------------------------------------------
INSERT INTO casos_teste
  (id, codigo, titulo, requisito, pre_condicoes, passos, resultado_esperado) VALUES
  (1, 'CT-001', 'Login com credenciais validas', 'RF-002 - Autenticacao',
   'Usuario "maria@empresa.com" cadastrado e ativo. Senha: Teste@123.',
   '1. Acessar a tela de login\n2. Informar o e-mail maria@empresa.com\n3. Informar a senha Teste@123\n4. Clicar em "Entrar"',
   'O sistema autentica o usuario e redireciona para o dashboard, exibindo "Bem-vindo, Maria".');

ALTER TABLE casos_teste       AUTO_INCREMENT = 100;
ALTER TABLE checklist_templates AUTO_INCREMENT = 100;
ALTER TABLE auditorias        AUTO_INCREMENT = 100;
ALTER TABLE nao_conformidades AUTO_INCREMENT = 100;
