# Status do front-end Meu Imóvel

**Atualizado em:** 23/11/2026

**Escopo deste registro:** estado atual de T-01 a T-14; backlog do front-end revisado após a análise das tarefas administrativas.

## Resumo

O front-end cobre o acervo de imóveis e prédios, a hierarquia de loteamentos/quadras/lotes e as operações de imagem autorizadas para os perfis que conseguem identificar essas entidades com segurança. Os formulários enviam somente o bloco correspondente à natureza do imóvel, e os estados/contagens mostrados vêm das respostas da API.

Há uma lacuna de autorização/consulta para concluir os fluxos de gestor: `GET /imovel` e `GET /imovel/{id}` são restritos a `CORRETOR`, embora os endpoints de publicação, situação e documentos sejam restritos a `GESTOR`. Não existe uma lista de imóveis autorizada para o gestor selecionar registros. Por isso, o front-end não usa IDs digitados nem a vitrine pública como substituto. Também não há operação para editar os dados comuns de um imóvel, nem consulta de cidades autorizadas por empresa. Esses pontos permanecem dependentes da API.

Nos cadastros administrativos, empresa autônoma e corretor vinculado à imobiliária seguem fluxos próprios. A equipe agora consulta listas privadas de corretores ativos e inativos da empresa do gestor e permite alternar a situação conforme a API.

## Tarefas

| Task                                | Estado                                                                    | Progresso e pendências                                                                                                                                                                                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-01 — Identificação do usuário     | **Implementada no front-end; contrato presente no checkout local da API** | O login lê `{ token, perfil }`; o perfil fica salvo apenas para navegação e é removido no logout. Sessões antigas precisam ser encerradas e iniciadas novamente. Perfil ausente/desconhecido bloqueia o painel; chamadas `401` encerram a sessão. O JWT segue sem claim de perfil. |
| T-02 — Painel e chamadas por perfil | **Implementada no front-end**                                             | Administrador consulta empresas/cidades; corretor consulta imóveis; gestor não recebe contagens sem escopo privado. Erros são mostrados e podem ser repetidos. O perfil precisa estar disponível na resposta de login da instância usada.                                          |
| T-03 — Empresas e dados auxiliares  | **Implementada no front-end**                                             | Administrador consulta, cria, edita, ativa, desativa e remove empresas. A remoção usa `DELETE /empresa/{id}`, pede confirmação e apresenta erros da API. Cidades, características e logomarcas continuam nas telas administrativas.                                              |
| T-04 — Equipe e corretores          | **Parcial; edição depende da API**                                        | Gestor cadastra, consulta ativos e inativos pelos endpoints da própria empresa e pode ativar/desativar cada corretor. A edição dos dados profissionais continua sem operação de atualização na API.                                                                              |
| T-05 — Administração de usuários    | **Parcial; cadastro profissional separado**                               | O administrador cria contas gerais em `POST /auth/register`; a opção `CORRETOR` foi removida desse formulário porque a rota não cria o registro profissional. O corretor autônomo continua no cadastro de empresa autônoma e o corretor da imobiliária no fluxo do gestor. Consulta, edição e situação de usuários aguardam contrato da API. |
| T-06 — Proprietários                | **Parcial; edição depende da API**                                        | Adicionadas busca por nome/documento e criação usando os DTOs atuais. Edição não foi simulada porque não existe operação de atualização documentada.                                                                                                                               |
| T-07 — Prédios e acervo de imóveis   | **Parcial; telas de corretor implementadas**                               | Corretor consulta/lista/detalha e cadastra prédios e imóveis nas quatro naturezas. Falta a ação de editar prédio, embora `PUT /predio/{id}` exista. Publicação/situação para gestor aguardam lista e detalhe autorizados; edição dos dados comuns do imóvel não existe na API. |
| T-08 — Loteamentos, quadras e lotes  | **Parcial; fluxo de corretor implementado**                                | Corretor consulta loteamentos com quadras e contagens da API, cadastra loteamentos/quadras e abre o cadastro de lote na quadra selecionada. A API devolve imóveis do tipo lote, agrupados pelas quadras retornadas. O catálogo de cidades é global e a API valida o escopo da empresa no envio; não há lista de cidades autorizadas para o seletor. A alteração de situação de lotes pelo gestor aguarda lista/detalhe autorizado. |
| T-09 — Fotos e documentos            | **Parcial; fotos e logomarcas implementadas**                              | Administrador pode adicionar/substituir/remover logomarcas de empresas; corretor pode adicionar/substituir/remover fotos dos imóveis, mantendo ao menos uma. O gestor também tem permissão de imagem da própria empresa na API, mas falta uma consulta segura do ID da empresa para a tela. Arquivos de imagem aceitos: JPEG, PNG e WebP, até 5 MB, conforme `FotoValidator`. Documentos aguardam fluxo seguro para o gestor localizar imóveis; API limita documentos a PDF/JPEG/PNG/WebP de até 5 MB e não oferece remoção. |
| T-10 — Contatos e atendimento        | **Aguardando contrato da API**                                             | Ainda não há tela nem endpoints de contatos/atendimento disponíveis para integrar. A interface deve ser planejada quando o contrato existir.                                                                                                                                            |
| T-11 — Contratos                     | **Aguardando contrato da API**                                             | Ainda não há tela nem endpoints de contratos disponíveis para integrar. A interface deve ser planejada quando o contrato existir.                                                                                                                                                       |
| T-12 — Parcelas e pagamentos         | **Aguardando contrato da API**                                             | Ainda não há tela nem endpoints financeiros disponíveis para integrar. A interface deve apresentar valores e estados retornados pelo servidor quando houver contrato.                                                                                                                   |
| T-13 — Relatórios                    | **Aguardando contrato da API**                                             | Ainda não há tela nem endpoint de relatórios disponível para integrar.                                                                                                                                                                                                                   |
| T-14 — Qualidade das telas e testes  | **Parcial**                                                                 | Existem estilos responsivos, foco visível e testes unitários de sessão, permissões, consultas do painel, DTOs por natureza e multipart. Falta revisar acessibilidade/responsividade em todas as telas e ampliar testes de fluxo, formulário, vazio e falta de permissão.                     |

## Alterações realizadas

- Extraída a leitura do JWT e a checagem de perfil para funções testáveis; `can()` agora nega acesso quando não existe perfil reconhecido. O login também usa o `perfil` retornado pela API e persiste essa informação junto ao token para restaurar a navegação após recarga.
- Adicionado tratamento comum de `401` em chamadas autenticadas. Credenciais inválidas no login continuam sendo mostradas no formulário sem encerrar outra sessão por engano.
- Atualizada a proteção de rotas e a navegação para administrador, gestor e corretor. Perfil ausente ou `CLIENTE` recebe uma tela de acesso indisponível com opção de logout.
- Ajustado o painel para consultar apenas rotas autorizadas para o perfil e exibir erros/repetição.
- Adicionadas páginas de empresas, cidades/características e proprietários.
- Criados os fluxos de consulta, detalhe e cadastro de imóveis e prédios para corretor, com formulário por natureza e DTO sem blocos de natureza concorrentes.
- Criada a consulta hierárquica de loteamentos, quadras e lotes, além dos formulários de loteamento/quadra e do atalho para cadastrar lote na quadra escolhida.
- Adicionada gestão de fotos de imóveis para corretor e de logomarcas de empresas para administrador, respeitando permissões, partes multipart, tipos, tamanho e regra de manter uma foto por imóvel.
- O helper multipart agora repete cada parte de arquivo para listas como `fotos`.
- A página de corretores usa `GET /corretor/empresa/ativos` e `GET /corretor/empresa/inativos` para carregar a equipe da empresa do gestor e permite ativar/desativar os corretores. A listagem pública global não é usada para gestão.
- A página de empresas permite remover registros pela API, após confirmação.
- O formulário genérico de usuários deixou de oferecer o perfil `CORRETOR`. Os fluxos de corretor autônomo e de corretor vinculado à imobiliária permanecem separados em Empresas e Corretores, respectivamente.
- Adicionado script `npm test` com testes nativos de Node para sessão/perfis, fontes do painel e comportamento `401`.
- README e requisitos atualizados para refletir as telas e dependências atuais.

## Validação executada

- `npm test` — passou: 3 arquivos de teste, incluindo montagem dos quatro DTOs por natureza e partes multipart repetidas.
- `npm run build` — passou com Vite 5.4.8.
- `git diff --check` — passou.
- Não há script de lint ou typecheck configurado.
- Não foi feita validação ponta a ponta contra uma instância da API; compatibilidade foi conferida nos controllers, serviços, DTOs e validadores do checkout local do backend. O JWT não fornece perfil, então uma instância sem o campo `perfil` na resposta do login mantém o painel bloqueado.

## Dependências abertas

1. **API / sessão:** disponibilizar o contrato `{ token, perfil }` na instância da API usada pelo front-end; o checkout local consultado já implementa esse retorno.
2. **API / corretores:** adicionar uma operação escopada de atualização dos dados profissionais se a edição prevista em RF-05 continuar no requisito.
3. **API / usuários:** definir operações de consulta, edição e situação, além de esclarecer permissões do gestor.
4. **API / proprietários:** adicionar atualização se edição continuar no requisito.
5. **Arquivos:** confirmar na implantação que a configuração de upload da API mantém o limite atual de 5 MB por arquivo e 50 MB por requisição.
6. **API / imóveis do gestor:** disponibilizar listagem e detalhe de imóveis com escopo da empresa para o gestor; os endpoints de publicação, situação, histórico e documentos já existentes dependem de IDs autorizados.
7. **API / cidade por empresa:** disponibilizar cidades de atuação para o corretor/gestor (ou incluí-las em uma resposta autorizada de sessão/empresa) para evitar seleção de cidade fora do escopo e erro posterior.
8. **API / imóvel:** definir atualização de dados comuns caso a edição permaneça no requisito; o contrato consultado só oferece criação e consulta.
9. **Documentos:** depois da listagem/detalhe segura para gestor, implementar listagem, upload, substituição e download. Não há endpoint de remoção no contrato atual.
10. **Front / prédios:** oferecer edição usando `PUT /predio/{id}`.
