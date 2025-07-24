# Sistema de Gerenciamento de Laboratórios - Alocaí (Frontend)
## :octocat: Integrantes
[Gison Vilaça](https://github.com/gison-vilaca) | [Lucas Victor](https://github.com/lucasvictoor) | [Ricardo Martins](https://github.com/RickyM7) | [Sara Abreu](https://github.com/ynjisng)
## :page_with_curl: Sobre o Projeto
Este repositório contém a interface frontend do sistema **Alocaí**, uma aplicação web para gerenciamento e agendamento de uso de laboratórios, desenvolvida com **Vue.js 3** e **Nuxt 3**. O projeto está sendo realizado para a disciplina de **Projeto de Desenvolvimento** do curso de **Bacharelado em Ciência da Computação** da **UFAPE**, sob orientação do professor [Rodrigo Gusmão de Carvalho Rocha](https://github.com/rgcrochaa), como parte da **2ª Verificação de Aprendizagem**.

O Alocaí é um sistema que simula uma plataforma institucional para solicitação de uso de laboratórios por parte de servidores (docentes ou técnicos), com funcionalidades como:

- Autenticação via e-mail institucional
- Cadastro de laboratórios e configurações
- Solicitação e agendamento de uso
- Controle de permissões e acessos
- Visualização dos agendamentos em calendário

O frontend se comunica com um backend em Django, disponível [neste repositório](https://github.com/Projeto-Des-SW/alocai-backend.git).

## :round_pushpin: Objetivos do Sistema
- Permitir que servidores da instituição solicitem horários em laboratórios de forma digital, segura e centralizada.
- Automatizar o fluxo antes realizado manualmente via planilhas e e-mail.
- Oferecer diferentes visões conforme o tipo de usuário (ex: coordenador, secretaria, etc).
- Permitir especificações como:
  - Capacidade mínima de alunos
  - Softwares específicos desejados
  - Tipo de laboratório (comum ou especializado)

## :hammer_and_wrench: Tecnologias Usadas
 ### [Vue.js 3](https://vuejs.org/)
 ### [Nuxt 3](https://nuxt.com/)

## :construction: Status do Projeto
Em desenvolvimento  
Entrega parcial referente à 2ª VA (Gerência de Configuração)

## 📂 Organização

Este repositório está organizado com:
- `pages/` – Arquivos `.vue` de cada tela (ex: login.vue)
- `components/` – Componentes reutilizáveis
- `assets/` – Estilos, imagens e variáveis SCSS
- `public/` – Arquivos estáticos
- `app.vue` – Layout principal
- `nuxt.config.ts` – Configurações do projeto

## 🚀 Instruções para rodar localmente

1. **Clonar o repositório:**

git clone https://github.com/Projeto-Des-SW/alocai-frontend.git

cd alocai-frontend

2. **Instalar as dependências:**
   
npm install

Outras opções: pnpm install // yarn install // bun install

3. **Executar em ambiente de desenvolvimento:**

npm run dev

Outras opções: pnpm dev // yarn dev // bun run dev

O sistema estará disponível em: http://localhost:3000

## 📡 Produção

1. **Build da aplicação para produção:**

npm run build

Outras opções: pnpm build // yarn build // bun run build

2. **Pré-visualização da build:**

npm run preview

Outras opções: pnpm preview // yarn preview // bun run preview

## 🔐 Acesso
Usuários reais ainda não foram cadastrados. A tela de login e rotas protegidas estão sendo integradas ao backend.

## 📎 Links relacionados
🔙 [Backend do Alocaí (Django)](https://github.com/Projeto-Des-SW/alocai-backend)

## 👨‍🏫 Professor Responsável
[Rodrigo Gusmão de Carvalho Rocha](https://github.com/rgcrochaa)

Disciplina: Projeto de Desenvolvimento – UFAPE

Período: 2025.1

