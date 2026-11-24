# Status do front-end Meu Imóvel

**Atualizado em:** 24/11/2026

**Escopo:** situação de T-01 a T-14, incluindo as integrações que passaram a estar disponíveis na API. A camada de contratos continua fora do escopo desta implementação.

## Resumo

O front-end passou a usar as novas operações de consulta, atualização e gestão disponíveis na API para corretores, usuários, proprietários, imóveis, lotes, documentos, contexto da empresa e contatos. Administradores e gestores veem usuários dentro do próprio escopo; corretores e gestores consultam somente os imóveis e contatos autorizados pelo backend. Os fluxos de corretor autônomo, corretor da imobiliária e usuário geral continuam separados.

A troca de senha usa a operação autenticada da própria conta. A interface valida a confirmação e os limites de senha documentados, sem registrar os valores. O front não implementa a camada de contratos, nem módulos de parcelas, pagamentos ou relatórios porque esses domínios ainda não têm controladores na API.

## Tarefas

| Task | Estado | Progresso e limites |
| --- | --- | --- |
| T-01 — Identificação do usuário | **Implementada** | O login usa `{ token, perfil }`; o perfil persistido serve apenas à navegação. Perfil ausente ou desconhecido bloqueia o painel; respostas `401` encerram a sessão. A API continua validando autorização. |
| T-02 — Painel e chamadas por perfil | **Implementada** | Menus, rotas e consultas consideram os perfis conhecidos e apresentam erro/repetição quando uma fonte falha. |
| T-03 — Empresas e dados auxiliares | **Implementada** | Administrador consulta, cria, edita, ativa, desativa e remove empresas e gerencia catálogos e logomarcas. |
| T-04 — Equipe de corretores | **Implementada** | Gestor lista ativos/inativos da própria empresa, cadastra, edita dados profissionais e ativa/desativa corretores. Senha e foto usam operações próprias. |
| T-05 — Administração de usuários | **Implementada** | Administrador cria contas gerais e administrador/gestor consultam, editam nome/e-mail e alteram situação dos usuários autorizados. A troca de senha da própria conta está disponível para todos os perfis aceitos pela API. Corretores profissionais continuam em seus fluxos próprios. |
| T-06 — Proprietários | **Implementada** | Corretor pesquisa por nome/documento, cadastra e edita proprietários da empresa, usando `PUT /proprietario/{id}`. |
| T-07 — Prédios e acervo de imóveis | **Implementada** | Corretor mantém os fluxos de prédio e cadastro de imóvel. Corretor e gestor consultam/detalham e editam dados comuns do imóvel; o gestor também altera publicação/situação e consulta o histórico. Situação e publicação só mudam após a resposta da API. |
| T-08 — Loteamentos, quadras e lotes | **Implementada** | Corretor consulta e cadastra loteamentos/quadras e inicia cadastro de lote. Gestor consulta os lotes autorizados por quadra e solicita mudança de situação com observação. Contagens e estados vêm da API. |
| T-09 — Fotos, documentos e logomarca | **Implementada, sem remoção de documentos** | Corretor administra fotos de imóveis; administrador administra logomarcas; gestor consulta contexto da própria empresa e administra sua logomarca. Gestor lista, envia, substitui e baixa documentos de imóveis. A API não oferece remoção de documentos. |
| T-10 — Contatos e atendimento | **Implementada** | Corretor e gestor consultam a caixa autorizada e filtram por imóvel e período. Somente o corretor registra o retorno com os valores oficiais. |
| T-11 — Contratos | **Aguardando implementação da camada de contratos na API** | Mantida fora deste escopo conforme solicitado. |
| T-12 — Parcelas e pagamentos | **Aguardando contrato da API** | Não foram encontrados controladores ou DTOs financeiros na API consultada. |
| T-13 — Relatórios | **Aguardando contrato da API** | Não foi encontrado endpoint de relatórios na API consultada. |
| T-14 — Estados, acessibilidade, responsividade e testes | **Parcial** | Formulários novos mantêm rótulos, mensagens e estados de carregamento/erro; tabelas têm áreas acessíveis e modais controlam o foco. Os testes cobrem helpers e integrações HTTP. Ainda falta revisão manual completa por teclado/leitor de tela e testes de interação em navegador. |

## Decisões relevantes

- O formulário geral não cria perfil `CORRETOR`: o cadastro do corretor autônomo permanece junto da empresa autônoma, e o corretor vinculado à imobiliária é criado em Corretores.
- A API limita o gestor a usuários, corretores, imóveis, loteamentos, lotes, documentos e logomarca da empresa vinculada à sessão. O front não aceita um identificador arbitrário de empresa para esses fluxos.
- Durante a edição de imóvel, o responsável profissional, o proprietário e, para gestores, prédio e cidade existentes são mantidos quando a API não fornece um catálogo de opções autorizado para alterá-los. O restante do DTO segue `ImovelUpdateDto`.
- Os documentos têm um por tipo (`MATRICULA`, `CARNE_IPTU`, `AUTORIZACAO_PROPRIETARIO`) e aceitam PDF/JPEG/PNG/WebP até 5 MB. A interface não oferece remoção porque não há endpoint correspondente.
- A caixa de contatos mostra o retorno e canal vindos da API. O gestor consulta a empresa; só o corretor responsável pode alterar o retorno.
- A troca de senha envia senha atual, nova senha e confirmação. A tela aplica 12–255 caracteres e o limite de 72 bytes UTF-8 documentado pela API.

## Validação executada

- `npm test` — passou: 7 arquivos de teste, incluindo DTOs de criação/edição de imóvel, serialização dos filtros de contatos, validação da troca de senha, envio de JSON por `PATCH` e download autenticado.
- `npm run build` — passou com Vite 5.4.8.
- `git diff --check` — passou.
- Não há scripts configurados para lint ou typecheck.
- Não foi feita validação ponta a ponta contra uma instância da API. Os caminhos, DTOs, permissões e regras descritos foram conferidos nos controllers, serviços e documentação do checkout local da API, sem alterá-lo.

## Pendências conhecidas

1. A API oferece `GET /cidade` como catálogo geral, sem filtrar cidades pela área de atuação da empresa. O backend valida a cidade ao salvar; o formulário de criação de imóvel para corretor pode mostrar opções que a API recusará. É necessário um catálogo de cidades autorizado por empresa para eliminar essa tentativa inválida.
2. Confirmar na implantação os limites de upload: até 5 MB por arquivo e até 50 MB por requisição, conforme documentação atual da API.
3. Aguardar a camada de contratos para iniciar T-11. Parcelas/pagamentos (T-12) e relatórios (T-13) também seguem sem contratos disponíveis.
4. Completar revisão manual de navegação por teclado/leitor de tela e testes de interação visual em navegador para T-14.
