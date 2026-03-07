# Alocaí — Frontend

Interface web do sistema **Alocaí**, uma plataforma para gerenciamento e agendamento de uso de laboratórios em instituições de ensino.

Desenvolvido com **Nuxt 3**, **Vue 3** e **TypeScript**.

## :octocat: Integrantes

[Gison Vilaça](https://github.com/gison-vilaca) | [Lucas Victor](https://github.com/lucasvictoor) | [Ricardo Martins](https://github.com/RickyM7) | [Sara Abreu](https://github.com/ynjisng)

## :page_with_curl: Sobre o Projeto

Projeto da disciplina de **Projeto de Desenvolvimento** do curso de **Bacharelado em Ciência da Computação** da **UFAPE**, orientado pelo professor [Rodrigo Gusmão de Carvalho Rocha](https://github.com/rgcrochaa).

O Alocaí permite que servidores solicitem uso de laboratórios de forma digital e centralizada, substituindo fluxos manuais com planilhas e e-mails. O backend correspondente está em [alocai-backend](https://github.com/Projeto-Des-SW/alocai-backend).

### Funcionalidades

- Login com conta Google (OAuth 2.0) e login admin com e-mail/senha
- Fluxo completo de agendamento (selecionar recurso → datas → horários → confirmação)
- Agendamentos por datas específicas ou período recorrente
- Uso imediato de recursos com timer e auto-finalização
- Painel admin: gerenciar solicitações, recursos e usuários
- Notificações em tempo real com sino no header
- Dashboard com calendário de disponibilidade
- Página "Explorar" com visão consolidada de todos os recursos
- Middleware de autenticação e autorização por perfil

## :hammer_and_wrench: Tecnologias

- [Nuxt 3](https://nuxt.com/)
- [Vue 3](https://vuejs.org/) (Composition API + `<script setup>`)
- [TypeScript](https://www.typescriptlang.org/)
- [Pinia](https://pinia.vuejs.org/) (gerenciamento de estado)
- [Nuxt UI](https://ui.nuxt.com/) (componentes e ícones)
- [Vitest](https://vitest.dev/) (testes unitários)

## 📂 Estrutura

```
pages/           → Páginas da aplicação (.vue)
components/      → Componentes reutilizáveis (admin/, dashboard/, user/)
stores/          → Stores Pinia em TypeScript (agendamento, user, admin, notificacao)
utils/           → Utilitários (api.ts com refresh automático, formatters.ts)
types/           → Definições de tipos TypeScript
middleware/      → Guards de rota (auth.ts, admin-auth.ts)
layouts/         → Layouts da aplicação (default, admin, dashboard)
assets/css/      → Estilos globais (main.css, flow-layout.css)
tests/           → Testes unitários com Vitest
```

## 🚀 Configuração local

### 1. Clonar e instalar

```bash
git clone https://github.com/Projeto-Des-SW/alocai-frontend.git
cd alocai-frontend
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha os valores:

```bash
cp .env.example .env
```

| Variável | Descrição |
|---|---|
| `NUXT_PUBLIC_API_URL` | URL do backend (ex: `http://localhost:8000`) |
| `NUXT_PUBLIC_GOOGLE_CLIENT_ID` | Client ID do Google OAuth |

### 3. Executar em desenvolvimento

```bash
npm run dev
```

O frontend estará disponível em `http://localhost:3000`.

### Produção

```bash
npm run build
npm run preview
```

## 🧪 Testes

```bash
npm run test
```

O projeto possui **109 testes** cobrindo stores (agendamento, user, admin, notificação) e utilitários (formatters).

## 📄 Páginas

| Página | Rota | Descrição |
|---|---|---|
| Home | `/` | Dashboard admin ou ações do usuário |
| Login | `/login` | Login com Google ou admin |
| Onboarding | `/onboarding` | Primeiro acesso após login Google |
| Perfil | `/profile` | Editar perfil e vincular Google |
| Selecionar Recurso | `/agendamentoSelectRecurso` | Passo 1 do agendamento |
| Datas e Horários | `/agendamentoData` | Passo 2 do agendamento |
| Informações | `/agendamentoInfo` | Passo 3 do agendamento |
| Conclusão | `/agendamentoConclusao` | Confirmação do agendamento |
| Minhas Reservas | `/minhasReservas` | Listar reservas do usuário |
| Uso Imediato | `/usoImediato` | Usar recurso com timer |
| Explorar | `/explorar` | Calendário de todos os recursos |

## 👨‍🏫 Professor Responsável

[Rodrigo Gusmão de Carvalho Rocha](https://github.com/rgcrochaa)

Disciplina: Projeto de Desenvolvimento — UFAPE · 2025.1
