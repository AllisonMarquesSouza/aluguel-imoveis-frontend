# Meu Imóvel · Painel web

React + Vite, consumindo a Meu Imóvel API.

## Rodando
```bash
npm install
npm run dev        # http://localhost:5174
```
O endereço da API é configurado em `VITE_API_BASE_URL` no arquivo `.env`.
Para outra API, altere essa variável; a API deve permitir CORS para a origem do painel.

## Produção
Defina `VITE_API_BASE_URL` com a URL pública da API e **libere CORS** nela para o domínio do painel.
`npm run build` gera `dist/`.

## O que já tem
- Login (`POST /auth/login`) recebe `token` e `perfil`; o JWT é salvo no navegador, o perfil é mantido para a navegação após recarregar a página e a sessão termina ao expirar (2h)
- Visão geral com consultas selecionadas conforme o perfil autenticado
- Empresas: consulta, cadastro de imobiliária/autônoma, edição, ativação/desativação e remoção (administrador)
- Cadastros auxiliares: cidades e características (administrador)
- Corretores: cadastro com foto, consulta de ativos/inativos, edição dos dados profissionais e ativação/desativação pelo gestor da empresa
- Usuários: criação de contas gerais pelo administrador; consulta, edição de nome/e-mail e alteração de situação por administrador/gestor no escopo autorizado
- Senha: qualquer perfil autenticado aceito pela API pode alterar a própria senha confirmando a senha atual
- Proprietários: busca por nome/documento, cadastro e edição para corretor
- Acervo de imóveis: corretor cadastra imóveis por natureza e mantém prédios/fotos; corretor e gestor consultam e editam imóveis autorizados, e o gestor administra publicação, situação, histórico e documentos
- Loteamentos: corretor cadastra loteamentos/quadras e lotes; gestor consulta os lotes da empresa e solicita mudança de situação
- Logomarcas: administrador gerencia as empresas; gestor gerencia somente a empresa vinculada à sessão
- Contatos: corretor e gestor consultam a caixa autorizada com filtros por imóvel/período; somente o corretor responsável registra o retorno
- Cadastros profissionais de corretor seguem os fluxos separados de empresa autônoma e equipe da imobiliária.

## Pontos a conferir
- O front-end usa o campo `perfil` retornado junto ao token no login e o guarda apenas para controlar a navegação. A API continua sendo a autoridade de autenticação e autorização em cada operação.
- Depois de atualizar a API, encerre uma sessão iniciada antes dessa mudança e entre novamente para receber o campo `perfil`.
- O `GET /corretor` da API é público e retorna perfis ativos sem limitar a empresa; o painel não o usa como lista de gestão da equipe.
- `GET /corretor/empresa/ativos` e `GET /corretor/empresa/inativos` retornam listas limitadas à empresa do gestor autenticado; o painel usa essas rotas para oferecer ativação e desativação.
- O `POST /auth/register` aceita `CORRETOR`, mas cria apenas um usuário. O formulário geral não oferece esse perfil: corretor autônomo é criado com a empresa por `POST /empresa/autonoma`, e corretor de imobiliária pelo gestor em `POST /corretor`.
- Os validadores atuais da API aceitam imagens JPEG, PNG e WebP de até 5 MB; documentos aceitam PDF, JPEG, PNG e WebP de até 5 MB. A configuração de implantação precisa permitir esses limites.
- `GET /cidade` continua sendo o catálogo geral, usado nas telas administrativas. Os formulários de imóveis e loteamentos usam `GET /cidade/empresa`, que retorna as cidades da empresa do usuário autenticado para gestores e corretores.
- A camada de contratos permanece fora desta implementação. A API consultada também não oferece endpoints de parcelas/pagamentos ou relatórios.
