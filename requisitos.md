# Requisitos do Front-end — Painel Administrativo

## 1. Visão geral

Este repositório contém o front-end web administrativo do projeto **Meu Imóvel**, responsável por oferecer uma interface para os usuários autorizados gerenciarem os dados e as operações disponibilizadas pela API.

O front-end consome a API existente. Ele não deve duplicar regras de negócio, calcular valores financeiros relevantes ou decidir situações que pertencem ao servidor.

### 1.1 Objetivo

Disponibilizar um painel web organizado, responsivo e seguro para que administradores, gestores de imobiliárias e corretores executem as atividades permitidas pelos seus perfis.

### 1.2 Escopo deste repositório

**Incluído no escopo inicial:**

- Autenticação e encerramento de sessão.
- Navegação e telas condicionadas ao perfil do usuário.
- Administração de empresas e usuários.
- Gestão de corretores.
- Gestão de proprietários.
- Consulta e gestão do acervo de imóveis.
- Cadastro e edição de imóveis e seus dados específicos.
- Fotos, documentos, características e publicação de imóveis.
- Gestão de contatos recebidos e acompanhamento dos retornos.
- Gestão de contratos, parcelas e pagamentos, conforme os recursos disponibilizados pela API.
- Consulta de relatórios e indicadores autorizados.
- Tratamento consistente de carregamento, erros, validações e estados vazios.

**Fora do escopo inicial:**

- Aplicativo mobile.
- Vitrine pública de imóveis para visitantes.
- Site institucional público de imobiliárias e perfis públicos de corretores.
- Implementação de regras de negócio ou persistência próprias do front-end.
- Acesso direto ao banco de dados.
- Criação de endpoints ou alterações no backend sem necessidade identificada e alinhamento com o contrato da API.

A vitrine pública poderá ser tratada em uma etapa ou aplicação própria. Não deve ser adicionada ao painel administrativo implicitamente.

## 2. Fontes de verdade e integração

A implementação deve considerar as seguintes fontes, nesta ordem:

1. **Este repositório:** requisitos e decisões específicas do front-end.
2. **Repositório da API:** contrato real dos endpoints, DTOs, enums, autenticação, permissões e regras de negócio implementadas.
3. **Histórias e tarefas do projeto:** contexto funcional e critérios de aceite fornecidos para cada funcionalidade.

Antes de implementar uma tela ou integração, o agente deve consultar o código e a documentação disponíveis na API. Não deve presumir nomes de endpoints, formatos de payload, enums ou permissões.

Se houver divergência entre este documento e o comportamento atual da API, o agente deve:
- identificar e explicar a divergência;
- não contornar a regra do servidor no front-end;
- propor a atualização deste documento ou uma alteração coordenada na API;
- aguardar decisão quando a divergência afetar regra de negócio ou contrato.

O front-end deve utilizar exclusivamente os endpoints HTTP disponibilizados pela API. Não deve acessar tabelas, migrations ou repositórios do backend diretamente.

## 3. Usuários e permissões

O projeto possui quatro perfis de usuário:

| Perfil | Responsabilidade no sistema | Escopo esperado no painel |
|---|---|---|
| `ADMINISTRADOR` | Mantém empresas e dados gerais do sistema | Administração global, sem vínculo com uma empresa |
| `GESTOR` | Administra a operação da imobiliária | Gestão dos dados e operações da própria empresa |
| `CORRETOR` | Mantém seu acervo e atende interessados | Gestão dos imóveis sob sua responsabilidade e dos contatos permitidos |
| `CLIENTE` | Acompanha informações relacionadas a contratos | Não faz parte do escopo prioritário deste painel; sua experiência principal é no aplicativo |

A interface deve apresentar somente as opções compatíveis com o perfil autenticado. Essa restrição visual melhora a experiência, mas **não substitui a autorização do backend**.

### 3.1 Isolamento por empresa

- Gestores e corretores devem operar somente sobre dados autorizados da própria empresa.
- O front-end não deve permitir selecionar ou informar livremente o identificador de outra empresa para acessar seus dados.
- Identificadores presentes em rotas, parâmetros ou formulários nunca devem ser considerados prova de autorização.
- Respostas `401` e `403` devem ser tratadas de forma adequada.
- A API é responsável por validar o acesso a cada recurso. O front-end não deve tentar reproduzir ou substituir essa validação.

### 3.2 Regras de navegação

- Após autenticação, a aplicação deve carregar o perfil e as informações necessárias do usuário.
- Menus, páginas e ações devem ser condicionados às permissões conhecidas.
- Acesso direto a uma rota não autorizada deve resultar em uma tela apropriada e não em exposição de dados.
- O estado de autenticação deve ser tratado de forma centralizada.

## 4. Requisitos funcionais

Os requisitos abaixo descrevem o comportamento esperado do painel. Eles não determinam nomes de endpoints; a integração deve seguir o contrato real da API.

### RF-01 — Autenticação

- Permitir que o usuário informe suas credenciais e entre no sistema.
- Exibir mensagens claras para credenciais inválidas, sessão expirada e falhas de comunicação.
- Permitir encerrar a sessão.
- Proteger as rotas administrativas.
- Não armazenar ou exibir senhas em texto puro.
- Seguir o mecanismo de autenticação e renovação de sessão efetivamente implementado pela API.

### RF-02 — Painel inicial

- Exibir uma página inicial compatível com o perfil autenticado.
- Apresentar atalhos para as funcionalidades permitidas.
- Exibir indicadores somente quando houver endpoint e dados disponíveis para sustentá-los.
- Não inventar métricas nem calcular indicadores de negócio que devam ser fornecidos pela API.

### RF-03 — Empresas

- Permitir ao `ADMINISTRADOR` consultar e cadastrar empresas.
- Exibir os dados cadastrais disponibilizados pela API, como nome, tipo, documento, CRECI, contatos, endereço, logomarca, descrição e cidades de atuação.
- Permitir editar, ativar/desativar e remover uma empresa quando essas operações estiverem disponíveis.
- Distinguir imobiliárias de corretores autônomos conforme os tipos definidos no backend.
- Não disponibilizar a gestão global de empresas para gestores e corretores.

### RF-04 — Usuários

- Permitir ao `ADMINISTRADOR` gerenciar os usuários conforme as operações da API.
- Permitir ao `GESTOR` administrar os usuários vinculados à própria empresa, respeitando as regras do backend.
- Exibir perfil e situação do usuário.
- Tratar os estados `ATIVO`, `INATIVO` e `BLOQUEADO` conforme os enums efetivos da API.
- Não permitir que a interface altere o próprio perfil ou vínculo empresarial fora das operações autorizadas.

### RF-05 — Corretores

- Permitir ao gestor consultar, cadastrar, editar, ativar e desativar corretores, conforme a API.
- Exibir nome, CRECI, foto, telefone, WhatsApp, e-mail e apresentação quando disponíveis.
- Permitir associar imóveis a um corretor responsável.
- Ao selecionar um responsável, apresentar somente corretores elegíveis retornados pela API.
- Não excluir ou ocultar do acervo os imóveis de um corretor apenas porque ele foi desativado; respeitar o comportamento definido pelo backend.

### RF-06 — Proprietários

- Permitir consultar, cadastrar e editar proprietários PF ou PJ, conforme a API.
- Exibir tipo de pessoa, nome/razão social, CPF/CNPJ e informações de contato autorizadas.
- Permitir pesquisar por nome ou documento quando suportado.
- Apresentar erros de documento inválido ou duplicado retornados pelo servidor.
- Não oferecer login ou acesso ao sistema para proprietários, pois eles são registros de referência do acervo.

### RF-07 — Dados auxiliares

- Disponibilizar as cidades e características cadastradas na API para seleção nos formulários.
- Exibir cidades de atuação da empresa conforme os dados do backend.
- Não manter cópias locais editáveis de listas que são administradas pelo servidor.
- Respeitar os valores e identificadores retornados pela API.

### RF-08 — Imóveis

- Permitir listar e consultar imóveis dentro do escopo autorizado do usuário.
- Permitir cadastrar e editar os dados comuns do imóvel, conforme os DTOs da API:
  - código e título;
  - finalidade;
  - corretor responsável;
  - proprietário;
  - descrição;
  - preços aplicáveis;
  - endereço;
  - características;
  - fotos.
- Permitir visualizar e editar os dados específicos de cada natureza suportada pela API: casa, terreno, apartamento e lote.
- Apresentar formulários específicos conforme a natureza selecionada, sem enviar campos incompatíveis.
- Permitir ordenar fotos e selecionar a foto de capa, se essas operações forem suportadas.
- Exibir a situação do imóvel e seu estado de publicação.
- Permitir publicar, despublicar ou alterar a situação somente pelas operações autorizadas da API.
- Não considerar um imóvel publicado apenas porque o usuário preencheu o formulário. A confirmação deve refletir a resposta do servidor.

### RF-09 — Loteamentos, quadras e lotes

- Disponibilizar as operações de consulta e gestão de loteamentos, quadras e lotes existentes na API.
- Representar visualmente a relação entre loteamento, quadras e lotes.
- Exibir a situação dos lotes conforme os valores retornados pelo backend.
- Não inferir disponibilidade ou efetuar transições de situação no cliente.

### RF-10 — Fotos e documentos

- Permitir enviar e visualizar arquivos conforme os endpoints e limites aceitos pela API.
- Exibir progresso ou estado de envio quando possível.
- Permitir excluir, ordenar ou substituir arquivos somente quando a API oferecer essas operações.
- Diferenciar fotos de imóveis de documentos administrativos e contratuais.
- Tratar erros de formato, tamanho e envio sem perder desnecessariamente os dados já preenchidos no formulário.

### RF-11 — Contatos e atendimento

- Disponibilizar ao corretor a consulta dos contatos que ele está autorizado a visualizar.
- Disponibilizar ao gestor a consulta dos contatos permitidos dentro da própria empresa.
- Permitir filtrar por imóvel e período quando suportado.
- Exibir canal, data, imóvel e informações do atendimento retornadas pela API.
- Permitir registrar o retorno do atendimento usando os estados definidos pelo backend, como `FALEI`, `VISITA_AGENDADA`, `SEM_RESPOSTA` e `DESCARTADO`, caso esses valores façam parte do contrato vigente.
- Não permitir consultar contatos de outras empresas.

### RF-12 — Contratos

- Permitir consultar, cadastrar e visualizar contratos conforme as operações da API.
- Apresentar os vínculos entre imóvel, cliente, corretor e empresa.
- Exibir finalidade, valores, entrada, quantidade de parcelas, vencimentos, duração e documentos quando disponíveis.
- Validar campos obrigatórios para orientar o usuário, mantendo a validação definitiva no servidor.
- Exibir claramente o resultado de uma operação de criação ou atualização.
- Não gerar contratos ou cronogramas financeiros localmente como fonte de verdade.

### RF-13 — Parcelas e pagamentos

- Permitir consultar parcelas relacionadas aos contratos autorizados.
- Exibir vencimento, valor, situação e saldo conforme calculados ou retornados pela API.
- Permitir registrar uma baixa/pagamento quando autorizado.
- Exibir data, valor, forma de pagamento e comprovante.
- Tratar parcelas pagas, em aberto e em atraso conforme a situação calculada pelo servidor.
- Não calcular juros, atraso, saldo ou situação financeira no front-end como regra de negócio.

### RF-14 — Relatórios

- Disponibilizar os relatórios oferecidos pela API, respeitando o perfil do usuário.
- Permitir filtros por período, corretor, situação ou natureza quando suportados.
- Exibir os dados recebidos sem alterar seu significado.
- Exibir estados vazios e erros de geração/consulta.
- Não produzir relatórios globais para perfis que não tenham autorização.

## 5. Requisitos de interface e experiência

### RNF-01 — Responsividade

O painel deve funcionar em desktop, tablet e telas menores. As telas administrativas podem priorizar desktop, mas não devem quebrar em dispositivos móveis.

### RNF-02 — Consistência visual

- Manter padrões consistentes de cores, tipografia, espaçamento, botões, formulários, tabelas, modais e mensagens.
- Reutilizar componentes compartilhados quando isso reduzir duplicação.
- Evitar criar componentes genéricos excessivamente complexos para casos isolados.

### RNF-03 — Acessibilidade

- Campos devem possuir rótulos claros.
- Ações devem ser identificáveis por texto ou nome acessível.
- Deve existir indicação visual de foco e navegação por teclado nas interações principais.
- Não utilizar apenas cor para comunicar erros ou situações.

### RNF-04 — Estados de interface

Toda operação assíncrona relevante deve considerar:
- carregamento;
- sucesso;
- erro;
- ausência de resultados;
- ausência de permissão;
- sessão expirada, quando aplicável.

Evitar telas em branco e falhas silenciosas.

### RNF-05 — Formulários

- Validar no cliente somente para melhorar a experiência.
- Exibir erros retornados pela API próximos aos campos correspondentes, quando possível.
- Preservar os dados preenchidos quando uma operação falhar, sempre que seguro.
- Diferenciar campos obrigatórios, opcionais e condicionais.
- Não duplicar regras complexas de validação do backend.

### RNF-06 — Segurança

- Não incluir segredos, tokens fixos ou credenciais no código-fonte.
- Não registrar tokens, senhas ou documentos pessoais em logs do navegador.
- Seguir as recomendações de armazenamento e envio de credenciais da API.
- Tratar conteúdo recebido da API como dado, nunca como código confiável.
- Não confiar em esconder botões ou menus como mecanismo de autorização.

### RNF-07 — Manutenibilidade

- Separar apresentação, componentes, páginas, integração HTTP e modelos/tipos.
- Centralizar configuração da API e tratamento comum de erros.
- Evitar chamadas HTTP espalhadas diretamente por componentes de interface.
- Manter nomes e organização consistentes.
- Não adicionar dependências sem necessidade justificada.

### RNF-08 — Testabilidade

- Testar componentes e fluxos críticos.
- Cobrir autenticação, proteção de rotas, formulários principais e tratamento de erros.
- Testar a exibição condicional por perfil.
- Não considerar testes de interface como substitutos dos testes de autorização da API.

## 6. Regras de negócio que o front-end deve respeitar

As regras abaixo são responsabilidade do backend. O front-end deve apenas orientar o usuário e refletir as respostas da API:

1. O administrador não pertence a uma empresa; os demais perfis pertencem a uma empresa.
2. Uma imobiliária ou um corretor autônomo é representado por uma empresa.
3. Um corretor autônomo também exerce o papel de corretor.
4. Cada empresa só pode acessar os próprios dados.
5. Um corretor desativado não deve aparecer como responsável elegível para novas operações públicas, conforme a regra da API; seus imóveis permanecem no acervo e podem ser atribuídos a outro corretor.
6. Um proprietário não é usuário do sistema.
7. A cidade é relevante para o endereço e para a organização da vitrine.
8. Imóveis possuem naturezas diferentes e dados específicos de cada natureza.
9. Regras de publicação e disponibilidade são decididas pela API.
10. Valores financeiros, geração de parcelas, pagamentos e situação de atraso são decididos pela API.
11. O front-end nunca deve permitir que a troca de um ID na URL conceda acesso a dados de outra empresa.

## 7. Organização funcional sugerida

A organização abaixo é uma referência por domínio funcional, não uma exigência de estrutura de pastas. Deve ser adaptada à stack escolhida:

- **Autenticação:** login, sessão e proteção de rotas.
- **Início:** painel inicial e atalhos.
- **Administração:** empresas, usuários e dados auxiliares.
- **Equipe:** corretores.
- **Relacionamentos:** proprietários e contatos.
- **Acervo:** imóveis, naturezas, loteamentos, quadras, lotes, fotos e documentos.
- **Comercial:** contratos, parcelas e pagamentos.
- **Relatórios:** consultas e indicadores autorizados.
- **Compartilhado:** componentes, layouts, serviços HTTP, tratamento de erros e tipos.

## 8. Critérios gerais de aceite

Uma funcionalidade só deve ser considerada concluída quando:

- atende ao requisito funcional correspondente;
- utiliza o contrato real da API;
- respeita o perfil e o escopo empresarial do usuário;
- contempla carregamento, sucesso, erro e estado vazio;
- apresenta validações e mensagens compreensíveis;
- funciona em resoluções de tela relevantes;
- possui testes proporcionais ao risco da funcionalidade;
- não implementa regras financeiras, de autorização ou de negócio exclusivamente no cliente;
- está documentada quando introduz uma decisão técnica ou comportamento relevante.

## 9. Decisões técnicas e funcionais

### 9.1 Definidas no estado atual

- A stack existente é React 18, JavaScript, React Router 6 e Vite 5.
- A interface usa CSS próprio e componentes locais; não há biblioteca de componentes instalada.
- Os formulários atuais usam controles nativos do navegador.
- A vitrine pública não faz parte deste painel. O painel pode consultar endpoints públicos da API quando isso atender a um fluxo administrativo autorizado.
- A área do perfil `CLIENTE` não está priorizada neste painel; sua experiência principal permanece no aplicativo até que uma decisão funcional mude este escopo.

### 9.2 Pendências que dependem de decisão ou alinhamento com a API

- O front-end persiste o JWT em `localStorage`, mas a estratégia de armazenamento deve ser reavaliada junto ao mecanismo de autenticação do backend antes de ampliar a sessão para produção.
- O JWT emitido pela API contém emissor, assunto (`sub`, o e-mail) e expiração; não contém o perfil. No checkout local da API consultado em 23/11/2026, `POST /auth/login` retorna `{ token, perfil }`, sendo `perfil` um dos valores de `UsuarioPerfil`. O front-end persiste esse perfil junto ao token somente para navegação; a API continua responsável por validar permissões em cada operação. Uma alteração de perfil pode exigir novo login para atualizar a navegação local.
- A política de edição de imóveis, proprietários e usuários depende de operações de atualização que não estão presentes no contrato atual da API.
- O requisito de gestão de contatos, contratos, parcelas, pagamentos e relatórios depende de esses domínios e suas regras serem definidos e disponibilizados pela API.
- Para o front-end, validar cada imagem/documento em até 5 MB e aceitar somente os formatos definidos para cada fluxo. A configuração da API consultada permite até 50 MB por requisição; manter os limites da interface alinhados aos validadores reais e revisar esta nota se o contrato mudar.
- A área de mapas permanece opcional e sem decisão de biblioteca; não deve bloquear os formulários sem requisito específico.

Decisões pendentes que alterem regra de negócio, autorização ou contrato devem ser coordenadas com a API antes da implementação correspondente.

## 10. Estado da implementação

Este quadro registra o levantamento feito em 19/11/2026, antes da implementação de T-01 a T-06. Ele é histórico e não representa o estado atual do painel. Para saber o que já foi entregue, o que está parcial e quais são as pendências atuais, consulte `docs/STATUS.md`.

Situações usadas neste quadro:

- **Parcial:** existe um fluxo no front-end, mas ele ainda não atende todo o requisito ou depende de ajuste de contrato/permissão.
- **Pendente, API disponível:** o front-end ainda não tem a funcionalidade, mas há operações documentadas na API para implementá-la.
- **Dependência da API:** falta contrato ou operação necessária na API; não implementar por suposição.

### 10.1 Requisitos funcionais

- **RF-01 — Autenticação: Parcial.** Há tela de login, envio para `POST /auth/login`, guarda/remoção do token, proteção de rotas e encerramento por expiração. O token atual da API não informa o perfil. Como a função de permissão considera autorizado quem não tem perfil reconhecido, menus e ações por perfil não ficam corretos até existir um contrato de perfil e o front-end passar a negar acesso visual por padrão quando ele faltar.
- **RF-02 — Painel inicial: Parcial.** Há uma página com contagens calculadas pelo tamanho das listas retornadas e atalhos para corretores e criação de usuário. Ela consulta todas as fontes para qualquer perfil, inclusive rotas restritas, e omite silenciosamente as fontes que falham. Não há indicadores específicos fornecidos por um endpoint da API.
- **RF-03 — Empresas: Pendente, API disponível.** Não há tela de empresas. A API documenta lista, consulta, cadastro de imobiliária ou empresa autônoma, atualização e ativação/desativação/exclusão administrativa.
- **RF-04 — Usuários: Parcial e dependência da API.** Há cadastro administrativo por `POST /auth/register`. Não há lista/consulta, edição ou mudança de situação de usuários no front-end; o contrato da API documenta registro, mas não essas demais operações. O cadastro e a gestão pelo `GESTOR` também precisam respeitar o escopo efetivamente autorizado pelo backend.
- **RF-05 — Corretores: Parcial.** O front-end lista, pesquisa, cadastra e desativa corretores. A API também oferece ativação, mas o front-end não a implementa. A tela usa `GET /corretor`, que é uma lista pública de corretores ativos, e não uma lista de equipe limitada à empresa do gestor; ela não deve ser tratada como fonte de gestão multiempresa. A API não documenta edição de corretor nem listagem privada da equipe do gestor.
- **RF-06 — Proprietários: Pendente, parcialmente suportado pela API.** Não há tela. A API permite pesquisar por nome ou documento e cadastrar; não há operação de atualização documentada.
- **RF-07 — Dados auxiliares: Parcial.** A API fornece cidades e características e oferece algumas operações administrativas. O front-end só consulta cidades como uma contagem no painel; faltam seletores e telas de consulta/gestão dos catálogos.
- **RF-08 — Imóveis: Pendente, parcialmente suportado pela API.** Não há tela de acervo ou formulário. A API suporta cadastro, lista e detalhe, as quatro naturezas (`CASA`, `TERRENO`, `APARTAMENTO`, `LOTE`), prédios, publicação, situação e documentos. O controlador atual não documenta atualização dos dados comuns de um imóvel; o requisito de editar imóvel depende dessa operação.
- **RF-09 — Loteamentos, quadras e lotes: Pendente, API disponível.** Não há interface. A API oferece consulta de loteamentos e detalhe com quadras, cadastro de loteamento/quadra, cadastro de lote através de `POST /imovel` e alteração de situação do lote.
- **RF-10 — Fotos e documentos: Parcial.** O cadastro de corretor envia uma foto e a tela exibe a foto pública retornada. Faltam as interfaces de gestão de imagens de empresas/imóveis e de documentos de imóveis. A API documenta operações de consulta, inclusão, substituição e remoção de imagens, além de inclusão/listagem/substituição/download de documentos de imóvel, cada uma com permissões próprias.
- **RF-11 — Contatos e atendimento: Dependência da API.** Não há controlador, DTO ou endpoint de contatos/atendimento identificado no contrato e na árvore atual do backend.
- **RF-12 — Contratos: Dependência da API.** Não há controlador, DTO ou endpoint de contratos identificado na API atual.
- **RF-13 — Parcelas e pagamentos: Dependência da API.** Não há controlador, DTO ou endpoint financeiro de parcelas/pagamentos identificado na API atual.
- **RF-14 — Relatórios: Dependência da API.** Não há endpoint ou contrato de relatórios identificado na API atual.

### 10.2 Requisitos não funcionais

- **RNF-01 — Responsividade: Parcial.** Há estilos responsivos básicos para telas menores, mas as telas existentes e as futuras ainda precisam de validação em diferentes larguras.
- **RNF-02 — Consistência visual: Parcial.** Há estilos e componentes locais compartilhados, mas somente um conjunto pequeno de telas foi implementado.
- **RNF-03 — Acessibilidade: Parcial.** Há rótulos de formulário e foco visível; ainda é necessário revisar navegação por teclado, foco e uso de modal, nomes acessíveis e comunicação de estados em todas as telas.
- **RNF-04 — Estados de interface: Parcial.** Algumas páginas mostram carregamento ou erro. O painel inicial não comunica erros de carregamento e ainda faltam estados consistentes de carregamento, sucesso, vazio, falta de permissão e sessão expirada.
- **RNF-05 — Formulários: Parcial.** Há campos obrigatórios e validações nativas simples. Falta apresentar erros de validação retornados pela API junto aos campos e conferir os limites de upload após resolver a divergência documentada.
- **RNF-06 — Segurança: Parcial.** O token é enviado como Bearer e a API continua responsável pela autorização. A identificação de perfil é incompatível com o JWT atual; o front-end precisa de comportamento fechado por padrão para ações condicionadas a perfil. O armazenamento em `localStorage` requer a decisão descrita na seção 9.
- **RNF-07 — Manutenibilidade: Parcial.** A configuração HTTP é centralizada em `src/api.js`, mas as chamadas e regras de apresentação ainda estão concentradas nas páginas. Modelos/tipos ainda não são formalizados.
- **RNF-08 — Testabilidade: Pendente.** O `package.json` não configura testes nem lint/typecheck; não há testes de interface/fluxo no repositório atual.

### 10.3 O que já existe no front-end

O estado atual oferece uma base visual navegável e estes fluxos parciais: login/logout, painel com contagens simples, lista e busca pública de corretores, cadastro/desativação de corretores e criação de usuários por administrador. Isso não significa que os RFs correspondentes estejam aceitos por completo; permanecem as limitações e dependências registradas acima.

## 11. Contratos e lacunas confirmados na API

O inventário abaixo evita transformar requisitos de negócio em endpoints presumidos:

- **Sessão:** `JWTService` emite `sub` (e-mail), emissor e expiração de duas horas, sem claim de perfil. No checkout local consultado, `TokenDto` e `POST /auth/login` retornam `token` e `perfil`; o serviço preenche o perfil com `usuario.getPerfil()`. O front-end usa o campo para navegação, enquanto a API revalida permissões no backend.
- **Usuários:** `POST /auth/register` exige administrador. Não foi identificada API de listagem/consulta, edição ou alteração de status, nem gestão de usuários da própria empresa pelo gestor.
- **Empresas:** os endpoints necessários às operações de empresa previstas em RF-03 estão documentados para administrador.
- **Corretores:** `GET /corretor/empresa/ativos` e `GET /corretor/empresa/inativos` listam os registros da empresa do gestor autenticado por situação; cadastro e ativação/desativação também são limitados à empresa do gestor. Não foi identificado endpoint de edição dos dados profissionais do corretor.
- **Tipos de cadastro de corretor:** `POST /empresa/autonoma` cadastra uma empresa autônoma junto com o corretor proprietário; `POST /corretor` cadastra um corretor vinculado à imobiliária do gestor. `POST /auth/register` aceita o perfil `CORRETOR`, mas cria somente um usuário, sem o registro profissional necessário às operações do acervo.
- **Proprietários:** busca por nome/documento e cadastro para corretor ativo da empresa. Não foi identificada atualização.
- **Cidades e características:** existem consultas; há operações administrativas documentadas para criar/remover cidades e criar características.
- **Prédios e imóveis:** existem cadastro e consulta de prédios e imóveis, incluindo dados específicos de casa, terreno, apartamento e lote. A gestão de imóvel cobre publicação, situação e documentos; o controlador de imóvel não expõe edição do cadastro comum.
- **Loteamentos:** existem listagem/detalhe, criação de loteamento e quadra, vínculo de lote por cadastro de imóvel e mudança de situação.
- **Imagens e documentos:** há endpoints de gestão com autorização. A interface deve usar as permissões, partes multipart e limites efetivos definidos pelo backend.
- **Contatos, atendimento, contratos, parcelas, pagamentos e relatórios:** não foram encontrados controladores, DTOs ou contratos desses domínios na árvore atual da API. O backend precisa definir esses recursos antes do desenvolvimento das telas.

As conclusões sobre ausência de endpoints referem-se ao código/documentação disponíveis no repositório da API no levantamento acima. Revalidar esse inventário antes de iniciar cada integração, pois o backend pode evoluir.

## 12. Plano de trabalho do front-end

Esta lista separa o que já existe no painel do que ainda falta fazer. O andamento detalhado e as validações ficam em `docs/STATUS.md`. Quando uma tela depende de uma consulta ou operação que a API ainda não oferece, o bloqueio é indicado: o front não deve substituir isso por dados globais, IDs digitados ou regras simuladas.

### Prioridade 0 — Sessão e navegação

#### T-01 — Identificação e sessão do usuário — **Concluída**

- **Já feito:** o login lê `{ token, perfil }` de `POST /auth/login`; a sessão restaura o perfil para a navegação e termina no logout ou após a expiração.
- **Resultado esperado:** perfil ausente ou desconhecido não libera páginas protegidas; a API continua autorizando cada operação.

#### T-02 — Painel inicial e acesso por perfil — **Concluída**

- **Já feito:** menus, rotas e consultas consideram o perfil. Erros de carregamento podem ser vistos e repetidos.
- **Resultado esperado:** o painel chama apenas rotas compatíveis com o perfil e não apresenta listas como indicadores de negócio sem contrato que as sustente.

### Prioridade 1 — Administração e operação disponíveis

#### T-03 — Empresas e cadastros auxiliares — **Concluída no front-end**

- **Já feito:** administrador consulta, cria, edita, ativa, desativa e remove empresas; também gerencia logomarcas e os cadastros auxiliares disponíveis.
- **Resultado esperado:** somente o administrador acessa essas operações; remoções dependem da confirmação da pessoa e do resultado da API.

#### T-04 — Equipe de corretores — **Parcial; edição depende da API**

- **Já feito:** gestor cadastra, consulta e ativa/desativa corretores da própria empresa. As listas usam `GET /corretor/empresa/ativos` e `GET /corretor/empresa/inativos`.
- **Bloqueio:** a RF-05 também prevê editar os dados profissionais do corretor, mas a API não oferece operação de atualização. Não reutilizar o cadastro nem alterar dados localmente para contornar essa ausência.
- **Resultado esperado:** somente corretores da empresa do gestor aparecem; as mudanças de situação usam IDs das listas autorizadas e refletem respostas da API.

#### T-05 — Cadastro e administração de usuários — **Parcial; cadastros de corretor separados**

- **Já feito:** administrador cria contas gerais pelos perfis compatíveis com `POST /auth/register`. O formulário não oferece `CORRETOR`, pois essa rota cria somente um usuário, sem o registro profissional.
- **Já feito em fluxos próprios:** administrador cadastra o corretor autônomo junto com a empresa em Empresas; gestor cadastra corretores vinculados à imobiliária em Corretores. São operações distintas e permanecem disponíveis.
- **Falta depois:** consulta, edição e alteração de situação de usuários quando a API oferecer essas operações. A gestão pelo gestor só deve ser incluída dentro do escopo autorizado.
- **Resultado esperado:** contas gerais e cadastros profissionais são apresentados em fluxos separados, de acordo com seus contratos e permissões.

#### T-06 — Consulta e cadastro de proprietários — **Parcial; edição depende de operação disponível**

- **Já feito:** corretor pesquisa por nome ou documento e cadastra proprietários pessoa física ou jurídica.
- **Falta no front:** oferecer edição quando houver uma operação de atualização disponível; não simular a alteração localmente.
- **Resultado esperado:** dados e mensagens vêm da API; se uma gravação falhar, os demais campos preenchidos continuam disponíveis.

#### T-07 — Prédios e acervo de imóveis — **Parcial**

- **Já feito:** corretor consulta e detalha imóveis e prédios; cadastra prédios e imóveis das quatro naturezas usando os respectivos campos, proprietário, características, fotos e endereço.
- **Falta no front agora:** oferecer edição de prédio usando `PUT /predio/{id}`.
- **Falta depois:** apresentar ao gestor as ações de publicação, situação e histórico a partir de uma lista e de detalhes autorizados. A edição de dados comuns do imóvel não tem operação de atualização na API atual.
- **Resultado esperado:** cada natureza envia somente seu bloco de DTO; situação e publicação mudam na tela somente após confirmação da API.

#### T-08 — Loteamentos, quadras e lotes — **Parcial**

- **Já feito:** corretor consulta a hierarquia e as contagens retornadas, cadastra loteamentos e quadras e inicia o cadastro de um lote na quadra escolhida.
- **Falta no front depois:** oferecer ao gestor a consulta e a alteração de situação de lotes quando houver uma lista/detalhe autorizado para esse perfil.
- **Resultado esperado:** situações e contagens são apresentadas como retornadas pela API; o front não calcula disponibilidade nem simula transições.

#### T-09 — Fotos e documentos — **Parcial**

- **Já feito:** administrador adiciona, substitui e remove logomarcas; corretor adiciona, substitui e remove fotos de imóveis, mantendo ao menos uma foto.
- **Falta no front depois:** criar a área de documentos do imóvel para o gestor — listar, enviar, substituir e baixar — quando ele puder selecionar um imóvel autorizado. Incluir a logomarca da própria empresa na tela do gestor quando a sessão fornecer o contexto da empresa.
- **Resultado esperado:** partes multipart, tipos, limites e operações seguem os contratos. Erros de envio não apagam dados já preenchidos. Não oferecer reordenação ou troca posterior de capa sem operação correspondente.

### Prioridade 2 — Funcionalidades que aguardam contrato

As tarefas abaixo descrevem somente a parte futura do front. Não criar endpoints simulados nem dados falsos para concluí-las; iniciar cada interface quando houver contrato real para ela.

#### T-10 — Contatos e atendimento — **Aguardando contrato**

- **Falta no front quando disponível:** consultar contatos autorizados, filtrar pelos campos aceitos e registrar atendimentos usando os estados oficiais.
- **Resultado esperado:** gestor e corretor veem apenas os dados permitidos; a tela cobre carregamento, vazio, erro e sucesso.

#### T-11 — Contratos — **Aguardando contrato**

- **Falta no front quando disponível:** consultar, cadastrar e detalhar contratos com os vínculos e documentos retornados pela API.
- **Resultado esperado:** imóvel, cliente, corretor e empresa refletem os dados do servidor; o front não gera contratos nem cronogramas financeiros.

#### T-12 — Parcelas e pagamentos — **Aguardando contrato**

- **Falta no front quando disponível:** consultar parcelas e registrar pagamentos autorizados, apresentando valores, vencimentos, formas de pagamento e comprovantes retornados.
- **Resultado esperado:** saldo, juros, atraso e situação são apresentados conforme calculados pela API.

#### T-13 — Relatórios — **Aguardando contrato**

- **Falta no front quando disponível:** apresentar os relatórios e filtros autorizados para cada perfil.
- **Resultado esperado:** dados e totais vêm da API; nenhum perfil recebe relatório fora do seu escopo.

### Prioridade 3 — Qualidade das telas existentes

#### T-14 — Estados, acessibilidade, responsividade e testes — **Parcial**

- **Já feito:** há estilos responsivos, foco visível e estados de carregamento/erro em várias páginas. `npm test` cobre sessão, permissões, consultas do painel, DTOs de imóvel e multipart repetido.
- **Falta no front:** revisar todas as telas por teclado e leitor de tela; conferir foco e modais em telas menores; uniformizar carregamento, vazio, sucesso, erro e falta de permissão; ampliar testes para formulários, rotas protegidas e respostas vazias.
- **Resultado esperado:** ações principais funcionam por teclado; mensagens não dependem só de cor; formulários preservam dados após falha; os testes cobrem os fluxos críticos sem reproduzir regras de negócio da API.
