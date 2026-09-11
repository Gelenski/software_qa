-- =====================================================================
-- TestAudit - Schema (POC)
-- Auditoria de qualidade de casos de teste de software
-- =====================================================================

CREATE DATABASE IF NOT EXISTS testaudit
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE testaudit;

-- Recria as tabelas em ordem segura para reexecucao
DROP TABLE IF EXISTS notificacoes;
DROP TABLE IF EXISTS escalonamentos;
DROP TABLE IF EXISTS nao_conformidades;
DROP TABLE IF EXISTS auditoria_itens;
DROP TABLE IF EXISTS auditorias;
DROP TABLE IF EXISTS checklist_itens;
DROP TABLE IF EXISTS casos_teste;

-- ---------------------------------------------------------------------
-- 1. Casos de teste
-- ---------------------------------------------------------------------
CREATE TABLE casos_teste (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  codigo             VARCHAR(30)  NOT NULL UNIQUE,
  titulo             VARCHAR(200) NOT NULL,
  requisito          VARCHAR(120) NULL,
  pre_condicoes      TEXT         NULL,
  passos             TEXT         NULL,
  resultado_esperado TEXT         NULL,
  criado_em          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. Checklist fixo (armazenado como dados, nao como codigo)
-- ---------------------------------------------------------------------
CREATE TABLE checklist_itens (
  id      INT AUTO_INCREMENT PRIMARY KEY,
  ordem   INT          NOT NULL,
  pergunta VARCHAR(200) NOT NULL,
  ativo   TINYINT(1)   NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. Auditorias
-- ---------------------------------------------------------------------
CREATE TABLE auditorias (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  caso_teste_id INT NOT NULL,
  estrategia    VARCHAR(20) NOT NULL DEFAULT 'padrao',   -- padrao | estrita
  status        ENUM('em_andamento','finalizada') NOT NULL DEFAULT 'em_andamento',
  aderencia     DECIMAL(5,2) NULL,                        -- snapshot ao finalizar
  criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finalizado_em DATETIME NULL,
  CONSTRAINT fk_auditoria_caso FOREIGN KEY (caso_teste_id)
    REFERENCES casos_teste(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. Respostas do checklist por auditoria
--    resposta NULL = "nao respondido" (4o estado interno)
-- ---------------------------------------------------------------------
CREATE TABLE auditoria_itens (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  auditoria_id      INT NOT NULL,
  checklist_item_id INT NOT NULL,
  resposta          ENUM('conforme','nao_conforme','nao_aplica') NULL,
  observacao        TEXT NULL,
  UNIQUE KEY uq_auditoria_item (auditoria_id, checklist_item_id),
  CONSTRAINT fk_item_auditoria FOREIGN KEY (auditoria_id)
    REFERENCES auditorias(id) ON DELETE CASCADE,
  CONSTRAINT fk_item_checklist FOREIGN KEY (checklist_item_id)
    REFERENCES checklist_itens(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. Nao conformidades
--    'atrasada' e ortogonal ao fluxo: status_anterior guarda de onde veio
-- ---------------------------------------------------------------------
CREATE TABLE nao_conformidades (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  auditoria_id      INT NOT NULL,
  checklist_item_id INT NULL,
  descricao         TEXT NOT NULL,
  severidade        ENUM('baixa','media','alta','critica') NOT NULL DEFAULT 'media',
  responsavel       VARCHAR(120) NOT NULL,
  prazo             DATE NOT NULL,
  status            ENUM('aberta','em_correcao','aguardando_validacao','resolvida','atrasada')
                      NOT NULL DEFAULT 'aberta',
  status_anterior   VARCHAR(25) NULL,
  escalado_em       DATETIME NULL,
  criado_em         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_nc_auditoria FOREIGN KEY (auditoria_id)
    REFERENCES auditorias(id) ON DELETE CASCADE,
  CONSTRAINT fk_nc_checklist FOREIGN KEY (checklist_item_id)
    REFERENCES checklist_itens(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. Escalonamentos (registro do escalonamento)
-- ---------------------------------------------------------------------
CREATE TABLE escalonamentos (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  nc_id          INT NOT NULL,
  motivo         VARCHAR(200) NOT NULL,
  prazo_original DATE NOT NULL,
  dias_atraso    INT NOT NULL,
  criado_em      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_esc_nc FOREIGN KEY (nc_id)
    REFERENCES nao_conformidades(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. Notificacoes (simuladas - sem envio real de e-mail)
-- ---------------------------------------------------------------------
CREATE TABLE notificacoes (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nc_id        INT NOT NULL,
  destinatario VARCHAR(120) NOT NULL,
  canal        VARCHAR(20)  NOT NULL DEFAULT 'simulado',
  assunto      VARCHAR(200) NOT NULL,
  mensagem     TEXT NOT NULL,
  lida         TINYINT(1) NOT NULL DEFAULT 0,
  criado_em    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_nc FOREIGN KEY (nc_id)
    REFERENCES nao_conformidades(id) ON DELETE CASCADE
) ENGINE=InnoDB;
