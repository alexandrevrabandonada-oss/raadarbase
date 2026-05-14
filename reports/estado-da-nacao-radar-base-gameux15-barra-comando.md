# Estado da Nacao - Radar Base - GAMEUX15 Barra de Comando

Data: 2026-05-14

## Objetivo

Reduzir dependencia de scroll nas telas de uso diario e manter a proxima acao sempre acessivel por meio de uma barra de comando operacional compartilhada.

## Escopo desta rodada

Rotas cobertas:

- `/minha-fila`
- `/pessoas`
- `/abordagem`
- `/dashboard`

Fora de escopo:

- regra de negocio
- banco
- fluxo operacional
- envio automatico de DM

## Componente criado

Novo componente compartilhado:

- `src/components/radar/operational-command-bar.tsx`

Responsabilidades:

- expor uma acao primaria clara;
- manter acoes secundarias acessiveis;
- mostrar status rapido da tela;
- oferecer um atalho de navegacao operacional;
- funcionar como barra fixa no mobile e sticky no desktop;
- respeitar `safe-area` no rodape;
- continuar navegavel por teclado via botoes e links reais.

## Aplicacao por rota

### /dashboard

Barra configurada com:

- `Iniciar Jornada`
- `Abrir Central de Ritmo`
- `Ver Mural de Missoes`

Status exibido:

- status geral da base
- detalhe resumido da leitura operacional

### /minha-fila

Barra configurada com:

- `Registrar Avanco` como primaria
- `Abrir Instagram`
- `Preparar Mensagem`
- `Proxima Missao`
- atalho para `Central de Ritmo`

Observacao:

- todas as acoes reaproveitam handlers existentes;
- nada foi automatizado;
- o preparo de mensagem continua manual e o envio continua fora do sistema.

### /pessoas

Barra configurada com:

- `Assumir Missoes`
- `Filtrar Sem Dono`
- atalho para `Minha Jornada`

Status exibido:

- quantidade de missoes sem dono
- orientacao curta para puxar a lista operacional

### /abordagem

Barra configurada com:

- `Dividir Trabalho`
- `Ver Travadas`
- `Ver Sem Dono`
- atalho para `Minha Jornada`

Status exibido:

- volume de travas e orfas no mural

## Ajustes de layout associados

- aumentei o `padding-bottom` das telas que receberam bottom bar mobile;
- mantive a barra dentro do visual gameful ja consolidado;
- preservei hierarquia de acao: primaria forte, secundarias menores, atalho separado.

## Guardrails preservados

- nenhum botao de envio automatico de DM foi adicionado;
- nenhuma pressao por volume ou throughput foi introduzida;
- a barra reforca operacao humana e revisada, nao automacao.

## Verificacao tecnica

- `npm run verify` passou.
- `lint` sem erros, com warnings antigos e adjacentes.
- `build` passou.
- `test` passou com `209` testes.
- `check:rls` passou.
- `check:health` passou.
- `e2e` local continuou pulado sem `E2E_RUN=true`.

## Arquivos principais alterados

- `src/components/radar/operational-command-bar.tsx`
- `src/app/dashboard/dashboard-client.tsx`
- `src/app/minha-fila/queue-client.tsx`
- `src/app/pessoas/people-client.tsx`
- `src/app/abordagem/kanban-client.tsx`

## Resultado

As quatro telas agora mantem a acao principal visivel mesmo quando o usuario desce a pagina. A operacao continua manual, mas com menos dependencia de reencontrar botoes dentro do fluxo.
