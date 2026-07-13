# CasaFlow

Sistema financeiro familiar — Next.js (App Router) + TypeScript + Tailwind + Supabase.

## Como colocar para rodar

### 1. Criar o projeto no Supabase

Crie um projeto em [supabase.com](https://supabase.com) (se ainda não tiver um).

### 2. Aplicar o schema

Abra o **SQL Editor** do seu projeto Supabase e rode o conteúdo de
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) (tabelas, funções, RLS e índices).

### 3. Configurar variáveis de ambiente

Copie os valores de **Project Settings → API** para `.env.local` (já criado na raiz, ignorado pelo git):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

A `SUPABASE_SERVICE_ROLE_KEY` nunca é exposta ao navegador — é usada apenas em Server Actions
(criação do primeiro admin e criação de novos usuários pelo admin).

### 4. Instalar dependências e rodar

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) — como ainda não existe nenhum admin, você
será direcionado para `/setup` para criar o primeiro acesso (isso cria o household, seu perfil de
administrador e as categorias padrão automaticamente).

Depois do primeiro admin criado, o cadastro público fica bloqueado: novos usuários (ex.: sua
esposa) só entram através de **Usuários** (`/usuarios`), onde o admin gera uma senha temporária
exibida uma única vez para repassar à pessoa.

## Estrutura

- `app/` — rotas (App Router). Grupo `(auth)` para login/setup, grupo `(app)` para as telas logadas.
- `actions/` — Server Actions (mutações no Supabase).
- `lib/` — clients Supabase (`lib/supabase`), cálculos financeiros (`lib/finance-calculations.ts`),
  formatação (`lib/format.ts`), geração de parcelas (`lib/installments.ts`) e guards de auth
  (`lib/auth-guards.ts`).
- `components/` — componentes reutilizáveis (`ui`, `layout`, `transactions`, `charts`, `cards`,
  `accounts`, `goals`).
- `types/database.ts` — tipos das tabelas.
- `supabase/migrations/` — schema SQL.

## Scripts

```bash
npm run dev     # ambiente de desenvolvimento
npm run build   # build de produção (checa tipos)
npm run start   # servir o build de produção
npm run lint    # eslint
```


