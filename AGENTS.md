# Instruções para agentes — Front-end Meu Imóvel

## 1. Contexto do projeto

Este repositório contém o front-end web administrativo do projeto **Meu Imóvel**. Ele consome a API existente e oferece interfaces para os perfis autorizados gerenciarem empresas, equipe, proprietários, imóveis, contatos, contratos, parcelas, pagamentos e relatórios.

O documento `REQUISITOS.md` é a referência funcional deste repositório. O repositório da API é a referência técnica para endpoints, DTOs, enums, autenticação, permissões e regras de negócio.

O `README.md` contém as instruções operacionais do projeto. Não o substitua nem remova conteúdo existente sem necessidade.

## 2. Regra principal: investigar antes de implementar

Antes de alterar código:

1. Leia o `README.md` e `REQUISITOS.md`.
2. Inspecione a estrutura atual do front-end e identifique a stack e os padrões já adotados.
3. Consulte o repositório da API conectado como fonte secundária.
4. Verifique endpoints, DTOs, enums, autenticação, permissões e respostas de erro diretamente no código ou documentação da API.
5. Procure componentes, serviços e soluções existentes antes de criar novos.
6. Apresente um plano curto quando a tarefa envolver múltiplos arquivos, novos fluxos ou decisões arquiteturais.

Não invente contratos de API. Se uma operação necessária não existir ou não estiver clara, informe a lacuna e proponha a mudança coordenada, sem simular que o backend já oferece suporte.

## 3. Hierarquia das fontes

Em caso de dúvida, considere:

1. Requisitos e decisões explícitas deste repositório.
2. Contrato e comportamento implementado na API.
3. História/tarefa específica em execução.
4. Padrões já estabelecidos no código do front-end.
5. Convenções gerais da stack.

Se duas fontes entrarem em conflito, não escolha silenciosamente. Explique o conflito e peça decisão quando ele alterar regra de negócio, segurança ou contrato.

## 4. Limites de responsabilidade

- O front-end é uma camada de apresentação e interação.
- A API é a fonte de verdade dos dados e das regras de negócio.
- Nunca acessar o banco de dados diretamente.
- Nunca implementar autorização real apenas escondendo elementos da interface.
- Nunca calcular ou decidir no cliente valores financeiros, parcelas, saldo, atraso, disponibilidade ou transições de situação.
- Não duplicar validações complexas do backend. Validações simples no cliente podem ser usadas para melhorar a experiência.
- Não criar endpoints, campos, enums ou payloads por suposição.
- Não alterar o repositório da API como efeito colateral de uma tarefa do front-end. Quando uma mudança na API for necessária, descreva a necessidade separadamente.

## 5. Segurança e multi-tenancy

- Respeite os perfis `ADMINISTRADOR`, `GESTOR`, `CORRETOR` e `CLIENTE` conforme o contrato da API.
- Gestores e corretores devem operar somente no escopo autorizado da própria empresa.
- O administrador é um perfil global e não deve ser tratado como membro de uma empresa.
- Nunca considere um ID recebido pela URL como autorização.
- Trate `401` como ausência/expiração de autenticação e `403` como falta de permissão, conforme o padrão da API.
- Não exponha dados de outra empresa em listas, detalhes, mensagens de erro ou estado local.
- Não grave tokens, senhas ou documentos pessoais em logs.
- Não coloque credenciais ou segredos no código-fonte.

A API deve validar todas as permissões. A proteção de rotas no front-end existe para navegação e experiência, não como barreira de segurança suficiente.

## 6. Padrões de implementação

- Siga a stack, convenções, formatação e estrutura que já existirem no repositório.
- Prefira alterações pequenas e coerentes com o código existente.
- Reutilize componentes e serviços quando houver uma abstração adequada.
- Evite duplicação de lógica de integração HTTP.
- Centralize a configuração da URL base da API e o tratamento comum de respostas/erros.
- Mantenha tipos/interfaces alinhados aos DTOs reais da API.
- Evite `any` ou equivalentes sem justificativa.
- Não introduza bibliotecas ou abstrações grandes para resolver problemas simples.
- Não refatore áreas não relacionadas à tarefa.
- Não altere dependências ou versões sem necessidade explicada.
- Não crie uma arquitetura nova antes de entender a existente.

## 7. Interface e experiência

- Mantenha consistência visual entre páginas e componentes.
- Priorize clareza em tabelas, formulários, filtros, detalhes e ações administrativas.
- Toda operação assíncrona deve apresentar estados adequados de carregamento, sucesso, erro e ausência de dados.
- Mensagens de erro devem ser úteis e compreensíveis; não mostrar stack traces ou detalhes internos ao usuário.
- Formulários devem distinguir campos obrigatórios, opcionais e condicionais.
- Preserve dados preenchidos quando uma requisição falhar, sempre que seguro.
- Garanta foco visível, rótulos acessíveis e navegação por teclado nas ações principais.
- Não use apenas cor para comunicar status ou erro.
- Considere telas menores, mesmo que o uso principal seja desktop.

## 8. Integração com a API

- Consulte o endpoint real antes de implementar cada integração.
- Confira método HTTP, caminho, parâmetros, autenticação, payload, resposta e erros.
- Não assuma que o formato de criação é igual ao de atualização.
- Não envie propriedades que o DTO não aceita.
- Não transforme valores de enums em rótulos e depois envie o rótulo ao servidor; mantenha o valor contratual e faça a tradução apenas na apresentação.
- Trate paginação, filtros e ordenação de acordo com o que o endpoint realmente suporta.
- Não simule persistência local para funcionalidades que devem ser persistidas pela API.
- Não use dados mockados em produção. Mocks podem ser usados em desenvolvimento/testes, claramente isolados.

## 9. Testes e validação

Ao concluir uma tarefa:

1. Execute os testes relevantes já existentes.
2. Execute lint, typecheck e build, se esses scripts estiverem configurados.
3. Adicione ou atualize testes para fluxos críticos e comportamentos introduzidos.
4. Verifique cenários de sucesso, erro, ausência de dados e falta de permissão.
5. Informe claramente o que foi executado e o que não pôde ser validado.

Não declare uma tarefa concluída se o build ou os testes relevantes falharem sem explicar a falha.

## 10. Git e escopo das alterações

- Não faça commit, push, merge ou publicação sem solicitação explícita.
- Não sobrescreva alterações locais do usuário.
- Não remova arquivos ou configurações existentes sem justificar.
- Mantenha cada alteração relacionada à tarefa solicitada.
- Ao final, apresente um resumo dos arquivos alterados, decisões tomadas, validações executadas e pendências.

## 11. Documentação e evolução dos requisitos

- Atualize `REQUISITOS.md` quando uma decisão funcional for aprovada ou um requisito mudar.
- Não transforme automaticamente cada requisito em uma task.
- Tasks devem ser criadas separadamente, com escopo, dependências e critérios de aceite próprios.
- Não crie `STATUS.md`, arquitetura detalhada ou documentação duplicada sem necessidade concreta.
- Preserve o padrão de nomes e organização já utilizado pelo projeto.

## 12. Comportamento esperado do agente

O agente deve agir como um desenvolvedor cuidadoso que conhece o limite entre frontend e backend:

- questionar requisitos ambíguos que afetem regras ou segurança;
- apontar inconsistências entre o requisito e a API;
- preferir soluções simples e sustentáveis;
- explicar trade-offs relevantes sem transformar toda tarefa em uma discussão arquitetural;
- não implementar funcionalidades além do escopo pedido;
- não afirmar que algo funciona sem ter validado ou deixar claro o que não foi possível validar.
