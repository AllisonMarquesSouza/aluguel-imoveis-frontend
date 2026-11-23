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
- Login (`POST /auth/login`) recebe `token` e `perfil`; o JWT é salvo no navegador, o perfil é mantido para a navegação após recarregar a página e a sessão termina ao expirar (2h)
- Visão geral com consultas selecionadas conforme o perfil autenticado
- Empresas: consulta, cadastro de imobiliária/autônoma, edição e ativação/desativação (administrador)
- Cadastros auxiliares: cidades e características (administrador)
- Corretores: cadastro com foto para gestor; lista de equipe e ações de status aguardam uma listagem privada por empresa na API
- Proprietários: busca por nome/documento e cadastro para corretor
- Usuários: `POST /auth/register` (administrador); lista, edição e status não estão disponíveis no contrato atual da API

## Pontos a conferir
- O JWT continua sem claim de perfil; o front-end usa o campo `perfil` retornado junto ao token no login e o guarda apenas para controlar a navegação. A API continua sendo a autoridade de autenticação e autorização em cada operação.
- Depois de atualizar a API, encerre uma sessão iniciada antes dessa mudança e entre novamente para receber o campo `perfil`.
- O `GET /corretor` da API é público e retorna perfis ativos sem limitar a empresa; o painel não o usa como lista de gestão da equipe.
- A API não documenta endpoints de contatos, atendimento, contratos, parcelas, pagamentos ou relatórios.
- A configuração base da API indica limite de 5 MB por arquivo e 50 MB por requisição, mas há um trecho antigo do README da API que ainda menciona 1 MB. Confirme configuração de implantação antes de validar uploads no cliente.
