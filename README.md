# TestAudit — POC

Aplicação web para **auxiliar na auditoria de qualidade de casos de teste de software**.

A aplicação **não executa os testes** e **não substitui o auditor**. Ela automatiza
atividades do processo de auditoria: aplicação de checklist, cálculo de aderência,
registro e acompanhamento de não conformidades (NCs), escalonamento e um dashboard.

---

## Stack

| Camada   | Tecnologia                     |
| -------- | ------------------------------ |
| Frontend | React.js + Vite + React Router |
| Backend  | Node.js + Express (ES Modules) |
| Banco    | MySQL 8                        |

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

---

## Fluxo principal (demonstração)

O objetivo da aplicação é demonstrar este fluxo ponta a ponta:

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

---

## API (resumo)

| Método | Rota                                      | Descrição                                      |
| ------ | ----------------------------------------- | ---------------------------------------------- |
| GET    | `/api/casos-teste`                        | lista casos de teste                           |
| POST   | `/api/casos-teste`                        | cria caso de teste                             |
| GET    | `/api/checklist`                          | itens fixos do checklist                       |
| POST   | `/api/auditorias`                         | inicia auditoria `{ casoTesteId, estrategia }` |
| GET    | `/api/auditorias/:id`                     | auditoria + itens + aderência calculada + NCs  |
| PATCH  | `/api/auditorias/:id/itens/:itemId`       | responde item `{ resposta, observacao }`       |
| POST   | `/api/auditorias/:id/finalizar`           | finaliza (exige todos respondidos)             |
| GET    | `/api/nao-conformidades`                  | lista NCs (`?status=`)                         |
| POST   | `/api/nao-conformidades`                  | cria NC a partir de item não conforme          |
| PATCH  | `/api/nao-conformidades/:id/status`       | transição validada pela máquina de estados     |
| POST   | `/api/nao-conformidades/verificar-prazos` | varredura de prazos (sob demanda)              |
| POST   | `/api/nao-conformidades/:id/escalonar`    | escalona uma NC vencida                        |
| GET    | `/api/dashboard`                          | agregados do dashboard                         |

---
