# TestAudit — POC

Aplicação web para **auxiliar na auditoria de qualidade de casos de teste de software**.

A aplicação **não executa os testes** e **não substitui o auditor**. Ela automatiza
atividades do processo de auditoria: aplicação de checklist, cálculo de aderência,
registro e acompanhamento de não conformidades (NCs), escalonamento e um dashboard.

---

## Stack

| Camada   | Tecnologia                         |
|----------|------------------------------------|
| Frontend | React.js + Vite + React Router     |
| Backend  | Node.js + Express (ES Modules)     |
| Banco    | MySQL 8                            |

Sem bibliotecas de auditoria prontas. Sem Excel.

---

## Como rodar

### 1. Banco (MySQL via Docker)

```bash
docker compose up -d
```

Isso sobe o MySQL na porta **3307** e aplica `backend/db/schema.sql` + `backend/db/seed.sql`
automaticamente na primeira execução.

> Já tem um MySQL local? Ajuste `backend/.env` e rode `npm run db:setup` dentro de `backend/`.

Recarregar os dados de exemplo a qualquer momento:

```bash
docker exec -i testaudit-mysql mysql -uroot -ptestaudit < backend/db/seed.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env    # ajuste se seu MySQL não for o do docker-compose
npm install
npm start              # http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

O Vite faz proxy de `/api` para `http://localhost:3001`.

---

## Fluxo principal (demonstração)

O objetivo da POC é demonstrar este fluxo ponta a ponta:

```
Caso de teste
  -> Iniciar auditoria
  -> Aplicar checklist (9 itens fixos)
  -> Registrar Conforme / Não conforme / N/A
  -> Calcular aderência  (conformes / aplicáveis x 100)
  -> Criar NC a partir de um item "Não conforme"
  -> Atribuir responsável e prazo
  -> Demonstrar NC atrasada  (botão "Verificar prazos")
  -> Escalonar NC  (marca "Atrasada" + registra escalonamento + notifica)
  -> Alterar para Resolvida
```

### Roteiro sugerido

1. **Casos de teste** → `Iniciar auditoria` no `CT-003` (caso propositalmente incompleto).
2. Marque os itens do checklist. A **aderência recalcula ao vivo** a cada resposta.
3. Marque o item *"Resultado esperado é verificável?"* como **Não conforme** → aparece o
   formulário de NC. Informe responsável e um **prazo no passado** (datas passadas são
   aceitas de propósito, para demonstrar o atraso).
4. `Finalizar auditoria` (exige todos os 9 itens respondidos).
5. **Não conformidades** → `Verificar prazos`. A NC vencida vira **Atrasada**,
   um escalonamento é registrado e duas notificações simuladas são geradas
   (responsável + líder).
6. Abra a NC → veja o histórico de escalonamento e as notificações → use os botões de
   transição de status até **Resolvida**.
7. **Dashboard** → contadores de auditorias, aderência média e NCs (abertas / atrasadas / resolvidas).

Os dados de `seed.sql` já trazem uma auditoria finalizada e uma NC vencida, para haver
material de demonstração logo no primeiro acesso.

---

## Padrões de projeto utilizados

Escolhidos pelo encaixe no contexto (não por quantidade). Mapa arquivo ↔ padrão:

| Padrão | Onde | Por quê |
|---|---|---|
| **Repository** | [`backend/src/repositories/`](backend/src/repositories/) | Isola todo o acesso a dados (SQL/MySQL). Nenhuma outra camada conhece tabelas/colunas. Troca de persistência não afeta regra de negócio. |
| **Service Layer** | [`backend/src/services/`](backend/src/services/) | Concentra as regras de negócio (aderência, ciclo de vida da NC, escalonamento). Os controllers ficam finos, só traduzindo HTTP. |
| **State** | [`backend/src/domain/ncStatusMachine.js`](backend/src/domain/ncStatusMachine.js) | O ciclo de vida da NC é uma máquina de estados. Cada estado é uma classe que declara suas transições válidas. Impede transições inválidas (ex.: `atrasada → aberta`) e garante que `"atrasada"` só é atingido via escalonamento automático, nunca manualmente. |
| **Strategy** | [`backend/src/domain/adherenceStrategy.js`](backend/src/domain/adherenceStrategy.js) | O cálculo de aderência tem critérios intercambiáveis: `padrao` (não respondidos ficam fora do denominador) e `estrita` (não respondido conta como não conforme). A auditoria guarda qual estratégia usa. |
| **Observer (Pub/Sub)** | [`backend/src/domain/eventBus.js`](backend/src/domain/eventBus.js) + [`escalationService.js`](backend/src/services/escalationService.js) (publisher) + [`notificationService.js`](backend/src/services/notificationService.js) (subscriber) | O escalonamento publica o evento `nc.escalada`; o serviço de notificação reage gravando as notificações — sem que a regra de escalonamento conheça notificação. Fácil plugar novos efeitos (e-mail real, webhook, log). |
| **Factory Method** (auxiliar) | `getAderenciaStrategy()` em [`adherenceStrategy.js`](backend/src/domain/adherenceStrategy.js) | Resolve a instância de `Strategy` a partir do nome persistido. |

---

## Modelo de dados

`casos_teste` · `checklist_itens` (checklist fixo como **dados**, não código) ·
`auditorias` · `auditoria_itens` · `nao_conformidades` · `escalonamentos` · `notificacoes`

Decisões relevantes:

- **`auditoria_itens.resposta` começa `NULL`** = "não respondido" (4º estado interno).
  A aderência de uma auditoria recém-criada é `null`, não `0%`.
- **Aderência com denominador zero** (todos os itens `N/A`) retorna `null` e a UI mostra
  "sem itens aplicáveis" — nunca `0%` nem `NaN`.
- **`nao_conformidades.status_anterior` e `escalado_em`**: `"atrasada"` é ortogonal ao
  fluxo de trabalho. Ao escalar, guardamos de qual status a NC veio, para que a volta
  ao fluxo (e o "Resolvida" final) faça sentido.
- Prazos **no passado são permitidos** — necessário para demonstrar o atraso sem esperar.

---

## API (resumo)

| Método | Rota | Descrição |
|---|---|---|
| GET  | `/api/casos-teste` | lista casos de teste |
| POST | `/api/casos-teste` | cria caso de teste |
| GET  | `/api/checklist` | itens fixos do checklist |
| POST | `/api/auditorias` | inicia auditoria `{ casoTesteId, estrategia }` |
| GET  | `/api/auditorias/:id` | auditoria + itens + aderência calculada + NCs |
| PATCH| `/api/auditorias/:id/itens/:itemId` | responde item `{ resposta, observacao }` |
| POST | `/api/auditorias/:id/finalizar` | finaliza (exige todos respondidos) |
| GET  | `/api/nao-conformidades` | lista NCs (`?status=`) |
| POST | `/api/nao-conformidades` | cria NC a partir de item não conforme |
| PATCH| `/api/nao-conformidades/:id/status` | transição validada pela máquina de estados |
| POST | `/api/nao-conformidades/verificar-prazos` | varredura de prazos (sob demanda) |
| POST | `/api/nao-conformidades/:id/escalonar` | escalona uma NC vencida |
| GET  | `/api/dashboard` | agregados do dashboard |

---

## Estrutura

```
backend/
  db/            schema.sql, seed.sql
  src/
    config/      db.js (pool MySQL)
    domain/      adherenceStrategy.js (Strategy), ncStatusMachine.js (State),
                 eventBus.js (Observer), errors.js
    repositories/  acesso a dados (Repository)
    services/      regras de negócio (Service Layer)
    controllers/   tradução HTTP
    routes/        index.js
    middlewares/   errorHandler.js
    scripts/       setupDb.js
frontend/
  src/
    api/client.js
    components/ui.jsx
    pages/       DashboardPage, TestCasesPage, AuditListPage,
                 AuditRunPage, NcListPage, NcDetailPage
```
