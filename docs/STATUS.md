# Status do front-end Meu Imóvel

**Atualizado em:** 23/11/2026

**Escopo desta atualização:** T-01 a T-06 de `requisitos.md`.

## Resumo

Foram implementadas as partes de front-end que já têm contrato suficiente na API: navegação e consultas do painel por perfil, administração de empresas e catálogos, e busca/cadastro de proprietários. O acesso agora falha fechado quando o perfil não é reconhecido e uma resposta `401` de uma chamada autenticada encerra a sessão.

O checkout local do backend consultado retorna `perfil` junto ao `token` em `POST /auth/login`. O front-end consome esse campo, mantém o perfil junto ao token para sobreviver a recargas e continua bloqueando perfis ausentes ou desconhecidos. O JWT em si não contém o perfil, e esse valor salvo no navegador serve apenas para a navegação: a API continua validando autorização em cada chamada. Não foi feita validação ponta a ponta contra uma instância da API. A API também não oferece lista de equipe privada por empresa nem operações completas para consulta/edição/status de usuários; essas partes de T-04 e T-05 seguem pendentes. T-06 cobre busca e cadastro; a edição depende de uma operação que não existe no contrato atual.

## Tarefas

| Task                                | Estado                                                                    | Progresso e pendências                                                                                                                                                                                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-01 — Identificação do usuário     | **Implementada no front-end; contrato presente no checkout local da API** | O login lê `{ token, perfil }`; o perfil fica salvo apenas para navegação e é removido no logout. Sessões antigas precisam ser encerradas e iniciadas novamente. Perfil ausente/desconhecido bloqueia o painel; chamadas `401` encerram a sessão. O JWT segue sem claim de perfil. |
| T-02 — Painel e chamadas por perfil | **Implementada no front-end**                                             | Administrador consulta empresas/cidades; corretor consulta imóveis; gestor não recebe contagens sem escopo privado. Erros são mostrados e podem ser repetidos. O perfil precisa estar disponível na resposta de login da instância usada.                                          |
| T-03 — Empresas e dados auxiliares  | **Implementada no front-end; não validada ponta a ponta**                 | Administração de empresas (consulta, imobiliária/autônoma, edição, ativação/desativação) e gestão de cidades/características usam os endpoints documentados.                                                                                                                       |
| T-04 — Equipe e corretores          | **Parcial; depende da API**                                               | Cadastro de corretor segue disponível para gestor. A tela deixou de tratar `GET /corretor` público como lista da equipe. Listagem escopada e ações seguras de ativação/desativação aguardam endpoint privado da empresa.                                                           |
| T-05 — Administração de usuários    | **Parcial; depende da API**                                               | O cadastro existente por `POST /auth/register` foi mantido e permanece restrito a administrador conhecido. Consulta, edição, situação e gestão pelo gestor não têm contrato na API atual.                                                                                          |
| T-06 — Proprietários                | **Parcial; edição depende da API**                                        | Adicionadas busca por nome/documento e criação usando os DTOs atuais. Edição não foi simulada porque não existe operação de atualização documentada.                                                                                                                               |

## Alterações realizadas

- Extraída a leitura do JWT e a checagem de perfil para funções testáveis; `can()` agora nega acesso quando não existe perfil reconhecido. O login também usa o `perfil` retornado pela API e persiste essa informação junto ao token para restaurar a navegação após recarga.
- Adicionado tratamento comum de `401` em chamadas autenticadas. Credenciais inválidas no login continuam sendo mostradas no formulário sem encerrar outra sessão por engano.
- Atualizada a proteção de rotas e a navegação para administrador, gestor e corretor. Perfil ausente ou `CLIENTE` recebe uma tela de acesso indisponível com opção de logout.
- Ajustado o painel para consultar apenas rotas autorizadas para o perfil e exibir erros/repetição.
- Adicionadas páginas de empresas, cidades/características e proprietários.
- Removida da página de corretores a listagem pública global como se fosse equipe da imobiliária. O cadastro permanece; a gestão completa aguarda uma rota escopada.
- Adicionado script `npm test` com testes nativos de Node para sessão/perfis, fontes do painel e comportamento `401`.
- README e requisitos atualizados para refletir as telas e dependências atuais.

## Validação executada

- `npm test` — passou: os dois arquivos de teste.
- `npm run build` — passou com Vite 5.4.8.
- Não há script de lint ou typecheck configurado.
- Não foi feita validação ponta a ponta contra uma instância da API; a compatibilidade foi conferida no código do checkout local do backend. O JWT não fornece perfil, então uma instância sem o campo `perfil` na resposta do login mantém o painel bloqueado.

## Dependências abertas

1. **API / sessão:** disponibilizar o contrato `{ token, perfil }` na instância da API usada pelo front-end; o checkout local consultado já implementa esse retorno.
2. **API / corretores:** fornecer listagem de equipe limitada à empresa autenticada; adicionar atualização se edição continuar no requisito.
3. **API / usuários:** definir operações de consulta, edição e situação, além de esclarecer permissões do gestor.
4. **API / proprietários:** adicionar atualização se edição continuar no requisito.
5. **Arquivos:** reconciliar o limite descrito no README da API com a configuração de upload antes de fixar validações no cliente.
