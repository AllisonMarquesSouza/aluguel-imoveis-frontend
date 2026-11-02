# Meu Imóvel · Painel web

React + Vite, consumindo a Meu Imóvel API.

## Rodando
```bash
npm install
npm run dev        # http://localhost:5173
```
Em desenvolvimento, `/api/*` é repassado pelo Vite para `http://localhost:8080` (sem CORS).
Para outra API: `VITE_PROXY_TARGET=http://host:porta npm run dev`.

## Produção
Defina `VITE_API_URL` com a URL pública da API e **libere CORS** nela para o domínio do painel.
`npm run build` gera `dist/`.

## O que já tem
- Login (`POST /auth/login`), JWT salvo no navegador, logout automático ao expirar (2h)
- Visão geral com contadores
- Corretores: lista pública, busca, cadastro (gestor, com foto) e desativação
- Usuários: `POST /auth/register` (administrador), com seleção de imobiliária

## Pontos a conferir
- O perfil é lido do JWT (`perfil`, `role`, `roles` ou `authorities`) em `src/auth.jsx`. Se o seu token usar outro claim, ajuste `readSession`.
- A API limita uploads a 1 MB por arquivo (padrão do Spring), apesar do README citar 5 MB.
