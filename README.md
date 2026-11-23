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
- Empresas: consulta, cadastro de imobiliária/autônoma, edição, ativação/desativação e remoção (administrador)
- Cadastros auxiliares: cidades e características (administrador)
- Corretores: cadastro com foto, consulta de ativos e inativos da própria imobiliária e ativação/desativação pelo gestor; edição dos dados profissionais aguarda uma operação na API
- Proprietários: busca por nome/documento e cadastro para corretor
- Acervo para corretor: consulta/detalhe de imóveis, cadastro por natureza, prédios e gestão das fotos autorizadas pela API
- Loteamentos para corretor: consulta hierárquica, cadastro de loteamentos/quadras e acesso ao cadastro de lotes pelo acervo
- Logomarcas de empresas: inclusão, substituição e remoção por administrador
- Usuários: criação de contas gerais por `POST /auth/register` (administrador); consulta, edição e status não estão disponíveis no contrato atual da API. Cadastros profissionais de corretor seguem os fluxos separados de empresa autônoma e equipe da imobiliária.

## Pontos a conferir
- O JWT continua sem claim de perfil; o front-end usa o campo `perfil` retornado junto ao token no login e o guarda apenas para controlar a navegação. A API continua sendo a autoridade de autenticação e autorização em cada operação.
- Depois de atualizar a API, encerre uma sessão iniciada antes dessa mudança e entre novamente para receber o campo `perfil`.
- O `GET /corretor` da API é público e retorna perfis ativos sem limitar a empresa; o painel não o usa como lista de gestão da equipe.
- `GET /corretor/empresa/ativos` e `GET /corretor/empresa/inativos` retornam listas limitadas à empresa do gestor autenticado; o painel usa essas rotas para oferecer ativação e desativação.
- A API ainda não oferece uma operação para editar os dados profissionais de um corretor.
- O `POST /auth/register` aceita `CORRETOR`, mas cria apenas um usuário. O formulário geral não oferece esse perfil: corretor autônomo é criado com a empresa por `POST /empresa/autonoma`, e corretor de imobiliária pelo gestor em `POST /corretor`.
- A API não documenta endpoints de contatos, atendimento, contratos, parcelas, pagamentos ou relatórios.
- Os validadores atuais da API aceitam imagens JPEG, PNG e WebP de até 5 MB; documentos aceitam PDF, JPEG, PNG e WebP de até 5 MB. A configuração de implantação precisa permitir esses limites.
- As ações de publicação/situação e documentos são do gestor, mas os endpoints `GET /imovel` e `GET /imovel/{id}` exigem corretor. As telas aguardam uma consulta de imóveis com escopo de gestor antes de expor essas ações.
- O endpoint `GET /cidade` retorna o catálogo geral. O servidor valida se a cidade pertence à área de atuação da empresa; a API ainda não fornece uma lista de cidades autorizadas para popular o seletor.
