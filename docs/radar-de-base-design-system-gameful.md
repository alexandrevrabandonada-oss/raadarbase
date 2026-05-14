# Radar de Base - Design System Gameful

Este documento define o design system visual do Radar de Base para uma estetica premium, moderna e gameful, com linguagem de **strategy game / command center / cooperative RPG**.

A direcao nao usa estetica gamer caricata, neon excessivo, ranking competitivo ou pontuacao individual. O objetivo e criar uma experiencia memoravel de operacao cooperativa: clara, densa, acessivel e orientada a proximo passo.

## 1. Linguagem visual

### Tese

O Radar deve parecer uma **Base de Operacoes de Mobilizacao**. Cada tela deve comunicar que existe uma operacao em andamento, com territorio, ritmo, missao, cuidado e fechamento de ciclo.

O visual deve ficar entre:
- sala de comando moderna;
- jogo de estrategia cooperativo;
- mapa tatico de campanha;
- painel de missoes de campo;
- biblioteca de memoria operacional.

Nao deve parecer:
- SaaS generico de cards brancos;
- CRM de funil comercial;
- jogo infantil;
- painel cyberpunk neon;
- app de produtividade baseado em placar individual.

### Principios visuais

- **Densidade legivel:** a interface pode ter bastante informacao, desde que esteja hierarquizada.
- **Proximo passo visivel:** toda superficie operacional deve mostrar a acao principal.
- **Mundo consistente:** fila, dashboard, territorio, campo e temas devem usar os mesmos estados, fases e linguagem.
- **Progresso cooperativo:** progresso existe para orientar a equipe, nao para comparar pessoas.
- **Cuidado como estado do sistema:** bem-estar, espera, bloqueio etico e fechamento sao parte da UI principal.
- **Premium sem excesso:** contraste forte, sombras controladas, bordas precisas, gradientes profundos e poucos efeitos.

## 2. Tokens visuais

Os tokens abaixo devem ser usados como referencia para Tailwind, CSS variables e classes utilitarias. O projeto ja usa `globals.css`, shadcn/ui e lucide; a recomendacao e evoluir sobre essa base.

### Cores primarias

| Token | Uso | Valor sugerido | Tailwind aproximado |
| --- | --- | --- | --- |
| `rb-ink` | Texto principal, fundos de comando | `#09090b` | `zinc-950` |
| `rb-graphite` | Paineis escuros, hero operacional | `#18181b` | `zinc-900` |
| `rb-steel` | Texto secundario escuro | `#3f3f46` | `zinc-700` |
| `rb-paper` | Fundo principal claro | `#f7f5ef` | custom |
| `rb-surface` | Cards e paineis claros | `#ffffff` | `white` |
| `rb-line` | Bordas padrao | `#e4e4e7` | `zinc-200` |
| `rb-command` | Acao primaria | `#4f46e5` | `indigo-600` |
| `rb-command-soft` | Fundo de acao primaria leve | `#eef2ff` | `indigo-50` |

Regra: `indigo` deve ser usado como cor de comando, nao como tema unico da aplicacao. Combine com amber, sky, emerald, rose e neutrals para evitar monotonia.

### Cores de fase

#### Jornada de vinculo

| Fase | Token | Cor | Uso |
| --- | --- | --- | --- |
| Preparar | `phase-prepare` | `sky-500` | Inicio, triagem, contexto |
| Conversar | `phase-talk` | `indigo-600` | Contato manual, abertura |
| Registrar | `phase-record` | `violet-600` | Registro de resposta, nota |
| Encaminhar | `phase-route` | `amber-500` | Destino, evento, voluntariado |
| Concluir | `phase-close` | `emerald-500` | Ciclo fechado, continuidade |

#### Territorio

| Fase | Token | Cor | Uso |
| --- | --- | --- | --- |
| Observacao | `territory-observe` | `zinc-400` | Sinais iniciais |
| Escuta | `territory-listen` | `sky-500` | Relatos recorrentes |
| Mobilizacao | `territory-mobilize` | `amber-500` | Pessoas e pautas prontas |
| Campo | `territory-field` | `indigo-600` | Acao presencial ativa |
| Continuidade | `territory-continuity` | `emerald-500` | Pos-acao e acompanhamento |

#### Campo

| Fase | Token | Cor | Uso |
| --- | --- | --- | --- |
| Planejar | `field-plan` | `zinc-500` | Estrutura da acao |
| Convidar | `field-invite` | `sky-500` | Convites iniciados |
| Confirmar | `field-confirm` | `amber-500` | Confirmacoes pendentes |
| Realizar | `field-run` | `indigo-600` | Missao acontecendo |
| Registrar | `field-register` | `violet-600` | Fechamento agregado |
| Follow-up | `field-followup` | `emerald-500` | Continuidade ativa |

### Cores de alerta

| Estado | Token | Fundo | Texto/Borda | Uso |
| --- | --- | --- | --- | --- |
| Informativo | `alert-info` | `sky-50` | `sky-700 / sky-100` | Orientacao leve |
| Atencao | `alert-warning` | `amber-50` | `amber-800 / amber-100` | Pendencia, espera |
| Critico | `alert-critical` | `rose-50` | `rose-700 / rose-100` | Parado, erro, risco |
| Etico | `alert-ethic` | `zinc-950` | `white / zinc-800` | Nao abordar, privacidade |
| Cuidado | `alert-care` | `blue-50` | `blue-700 / blue-100` | Bem-estar, pausa |

### Cores de conclusao

| Token | Uso | Cor |
| --- | --- | --- |
| `complete-bg` | Fundo de conclusao | `emerald-50` |
| `complete-border` | Borda de conclusao | `emerald-100` |
| `complete-text` | Texto de conclusao | `emerald-900` |
| `complete-icon` | Icone de conclusao | `emerald-600` |
| `complete-glow` | Sombra leve | `0 18px 45px rgba(16, 185, 129, 0.16)` |

### Fundos

| Token | Uso | Receita |
| --- | --- | --- |
| `bg-app` | Fundo global | `oklch(0.965 0.01 82)` ou `#f7f5ef` |
| `bg-command` | Heros e paineis de comando | `linear-gradient(145deg, #09090b 0%, #18181b 58%, #27272a 100%)` |
| `bg-command-map` | Territorios/campo | radial discreto + `bg-command` |
| `bg-panel` | Cards claros | `#ffffff` |
| `bg-panel-muted` | Paineis internos | `#f4f4f5` |
| `bg-band` | Secoes largas | `#fafafa` ou `#f4f4f5` |

Regra: gradientes devem funcionar como profundidade de command center. Evitar orbs decorativos soltos, bokeh, neon saturado e fundos puramente atmosfericos.

### Bordas

| Token | Uso | Valor |
| --- | --- | --- |
| `border-subtle` | Cards comuns | `1px solid zinc-200` |
| `border-panel` | Paineis premium | `1px solid rgb(24 24 27 / 0.10)` |
| `border-command` | Paineis escuros | `1px solid rgb(255 255 255 / 0.10)` |
| `border-active` | Item ativo | `1px solid indigo-200` |
| `border-complete` | Conclusao | `1px solid emerald-100` |
| `border-blocked` | Bloqueio | `1px solid rose-100` ou `zinc-800` em fundo escuro |

### Sombras

| Token | Uso | Valor |
| --- | --- | --- |
| `shadow-card` | Cards comuns | `0 8px 24px rgb(24 24 27 / 0.06)` |
| `shadow-panel` | Paineis importantes | `0 18px 45px rgb(24 24 27 / 0.10)` |
| `shadow-command` | Heros e comandos | `0 24px 70px rgb(24 24 27 / 0.18)` |
| `shadow-active` | CTA ou card ativo | `0 16px 40px rgb(79 70 229 / 0.18)` |
| `shadow-alert` | Alertas | `0 14px 32px rgb(245 158 11 / 0.12)` |

### Raios

O projeto ja tem cards grandes. A regra para o Radar:

| Token | Valor | Uso |
| --- | --- | --- |
| `radius-control` | `8px` | Inputs, botao pequeno, segmentados |
| `radius-card` | `16px` | Cards funcionais densos |
| `radius-panel` | `24px` | Paineis de missao |
| `radius-hero` | `28px` a `32px` | MissionHero, CommandHero |
| `radius-pill` | `999px` | Badges e filtros |

Nota: cards dentro de cards devem ser evitados. Quando necessario, usar blocos internos de `radius-card` com fundo mutado, sem parecer card independente.

### Gradientes

Gradientes permitidos:

```css
--rb-gradient-command: radial-gradient(circle at top left, rgba(99,102,241,.18), transparent 30%),
  radial-gradient(circle at top right, rgba(16,185,129,.16), transparent 24%),
  linear-gradient(145deg, #09090b 0%, #18181b 58%, #27272a 100%);

--rb-gradient-territory: radial-gradient(circle at top left, rgba(245,158,11,.16), transparent 30%),
  radial-gradient(circle at top right, rgba(59,130,246,.18), transparent 24%),
  linear-gradient(145deg, #09090b 0%, #18181b 58%, #27272a 100%);

--rb-gradient-complete: linear-gradient(135deg, #ecfdf5 0%, #ffffff 70%);
```

Uso:
- `rb-gradient-command`: dashboard, minha fila, comando.
- `rb-gradient-territory`: mapa, campo, temas.
- `rb-gradient-complete`: fechamento de ciclo e completion moments.

## 3. Componentes prioritarios

### MissionHero

Uso: topo de uma tela operacional. Deve mostrar o que esta acontecendo agora.

Anatomia:
- eyebrow: modo ou area (`Base de Operacoes`, `Jornada do Operador`, `Mapa da Mobilizacao`);
- titulo forte;
- subtitulo claro;
- fase atual ou estado do ciclo;
- 3 a 4 metricas compactas;
- CTA primaria;
- CTA secundaria.

Regras:
- usar fundo `bg-command`;
- texto branco com contraste forte;
- metricas em paineis transludidos;
- nunca virar hero de marketing;
- deixar a proxima secao aparecer na primeira dobra quando possivel.

### MissionCard

Uso: qualquer unidade de trabalho: pessoa, tarefa, missao de revisao, fechamento.

Anatomia:
- faixa de fase;
- titulo;
- motivo;
- proximo passo;
- progresso ou etapa atual;
- bloqueio/espera/cuidado;
- CTA primaria (`Iniciar etapa`, `Registrar`, `Encaminhar`, `Fechar ciclo`).

Estados:
- `ativo`: borda `indigo-200`, CTA indigo, sombra ativa leve.
- `pendente`: fundo branco, indicador `amber`.
- `bloqueado`: fundo `rose-50` ou comando escuro para bloqueio etico.
- `em espera`: badge `amber`, copy sem pressao.
- `concluido`: fundo `emerald-50`, icone `CheckCircle2`.
- `cuidado`: fundo `blue-50`, icone `Heart` ou `ShieldCheck`.

### JourneyBar

Uso: trilha de progresso para vinculo, territorio ou campo.

Anatomia:
- segmentos discretos;
- fase atual destacada;
- fases completas em verde;
- bloqueio com icone de trava;
- microcopy do proximo passo.

Regras:
- nunca mostrar porcentagem isolada sem etapa;
- deve funcionar em modo compacto;
- deve ter labels acessiveis e nao depender apenas de cor.

### AlertBeacon

Uso: sinal operacional que exige atencao.

Anatomia:
- icone;
- titulo curto;
- descricao objetiva;
- gravidade;
- CTA quando houver proximo passo.

Tons:
- `info`: sinal de leitura;
- `warning`: pendencia;
- `critical`: travado;
- `ethic`: privacidade, nao abordar, consentimento;
- `care`: bem-estar.

Motion:
- entrada `fade + slide 4px`;
- pulso apenas em alertas criticos e com duracao limitada;
- sem blinking continuo.

### TerritoryNode

Uso: card/no de bairro no Mapa da Mobilizacao.

Anatomia:
- nome do bairro;
- fase territorial;
- calor;
- temas principais;
- sinais agregados;
- capacidade local;
- acao recomendada.

Regras:
- bairro e unidade de leitura, nunca pessoa;
- calor e intensidade operacional, nao score social;
- tema deve aparecer como contexto de mobilizacao;
- CTA abre detalhe territorial.

### RhythmPanel

Uso: Central de Ritmo, dashboard e coordenacao.

Anatomia:
- estado do ciclo;
- gargalos;
- carga da equipe;
- cuidado/bem-estar;
- progresso coletivo;
- fechamento pendente.

Regras:
- evitar linguagem de produtividade individual;
- usar `cuidado` como estado de primeira classe;
- priorizar leitura em ate 2 minutos.

### CompletionToast

Uso: fechamento de etapa, resposta registrada, encaminhamento feito, campo fechado.

Anatomia:
- icone de conclusao;
- titulo de fechamento;
- descricao com efeito real no sistema;
- CTA para proxima missao quando fizer sentido.

Regras:
- texto deve reforcar ciclo fechado, nao "ponto ganho";
- animacao curta;
- respeitar `prefers-reduced-motion`.

### FieldQuestCard

Uso: missao de campo em `/campo`.

Anatomia:
- fase da acao;
- territorio;
- data/janela;
- jornada da acao;
- convites;
- confirmacoes;
- presenca;
- follow-up;
- CTA para abrir missao.

Regras:
- campo deve parecer campanha em andamento;
- resultado agregado e follow-up devem aparecer tao importantes quanto convites.

### QuestColumn

Uso: mural de missoes e kanbans operacionais.

Anatomia:
- titulo da etapa;
- descricao curta;
- contador;
- alertas da coluna;
- lista de MissionCards.

Regras:
- colunas devem representar jornada, nao funil comercial;
- evitar labels de CRM;
- cards devem manter altura e spacing previsiveis.

### WellbeingMeter

Uso: minha fila, ritmo, dashboard.

Anatomia:
- nivel (`estavel`, `ajustar cadencia`, `reduzir pressao`);
- recomendacao;
- carga atual;
- sugestao de pausa ou redistribuicao.

Regras:
- nao culpar operador;
- nao comparar pessoas;
- o cuidado deve gerar acao operacional: pausar, redistribuir, fechar ciclo.

## 4. Estados

### Ativo

Uso: missao atual, fase atual, territorio em foco.

Visual:
- borda `indigo-200`;
- CTA `indigo-600`;
- sombra `shadow-active`;
- badge `bg-indigo-50 text-indigo-700`.

Microcopy:
- "Voce esta aqui"
- "Proximo passo"
- "Missao em andamento"

### Pendente

Uso: algo precisa ser iniciado ou respondido.

Visual:
- badge `amber`;
- fundo branco;
- borda neutra;
- icone `Clock` ou `ListChecks`.

Microcopy:
- "Aguardando definicao"
- "Pendente de registro"
- "Precisa de responsavel"

### Bloqueado

Uso: trava tecnica, etica ou operacional.

Visual:
- fundo `rose-50` para bloqueio operacional;
- fundo `zinc-950` para bloqueio etico sensivel;
- icone `ShieldAlert` ou `Lock`;
- CTA secundaria, nunca primaria agressiva.

Microcopy:
- "Nao abordar"
- "Respeitar restricao"
- "Aguardar janela etica"

### Em espera

Uso: resposta aguardada, janela de contato, follow-up futuro.

Visual:
- `amber-50`;
- borda `amber-100`;
- icone `Clock`;
- texto sem urgencia artificial.

Microcopy:
- "Em espera saudavel"
- "Aguardar retorno"
- "Revisar depois"

### Concluido

Uso: etapa finalizada, ciclo fechado, resultado registrado.

Visual:
- `emerald-50`;
- icone `CheckCircle2`;
- sombra leve;
- CTA para proxima missao.

Microcopy:
- "Ciclo fechado"
- "Etapa registrada"
- "Continuidade ativa"

### Cuidado

Uso: bem-estar, carga alta, operacao sensivel.

Visual:
- `blue-50` ou `amber-50` dependendo da intensidade;
- icone `Heart`, `Coffee`, `ShieldCheck`;
- recomendacao clara.

Microcopy:
- "Ajustar cadencia"
- "Considere pausa"
- "Redistribuir antes de seguir"

## 5. Tipografia

O projeto usa Geist. Manter Geist como fonte principal, mas aplicar hierarquia mais forte.

### Escala

| Nivel | Classe sugerida | Uso |
| --- | --- | --- |
| Display | `text-4xl font-black tracking-tight` | MissionHero, CommandHero |
| Page title | `text-3xl font-black tracking-tight` | Titulo de pagina |
| Section title | `text-2xl font-black tracking-tight` | Blocos principais |
| Panel title | `text-lg font-black` | Cards grandes |
| Card title | `text-base font-black` | MissionCard |
| Body | `text-sm font-medium leading-relaxed` | Texto normal |
| Microcopy | `text-xs font-medium leading-relaxed` | Ajuda contextual |
| Badge | `text-[10px] font-black uppercase tracking-[0.18em]` | Estados e fases |

Regras:
- usar `font-black` para titulos e badges operacionais;
- evitar letter spacing negativo;
- microcopy deve ser curta e concreta;
- badges devem caber em mobile; se necessario quebrar linha ou reduzir conteudo.

### Vocabulário

Preferir:
- Base de Operacoes;
- Missao;
- Jornada;
- Mapa;
- Campo;
- Ritmo;
- Continuidade;
- Fechamento;
- Cuidado.

Evitar:
- lead;
- funil;
- conversao como objetivo isolado;
- score de pessoa;
- disparo;
- ranking;
- produtividade individual.

## 6. Motion

Motion deve dar sensacao de sistema vivo sem distrair.

### Entrada de painel

Uso: drawer, sheet, detalhe territorial, painel de missao.

Padrao:
- `fade-in`;
- `slide-in-from-bottom-2` ou `slide-in-from-right-2`;
- duracao `200ms` a `300ms`;
- easing suave.

### Avanco de fase

Uso: JourneyBar, FieldQuestCard, TerritoryNode.

Padrao:
- barra anima largura em `300ms` a `500ms`;
- etapa atual faz `scale 1.05` maximo;
- cor muda suavemente;
- sem pulso infinito.

### Conclusao

Uso: CompletionToast, bloco de ciclo fechado.

Padrao:
- `zoom-in-95` + `fade-in`;
- duracao `250ms`;
- icone aparece junto, sem confete;
- CTA para proxima missao entra no mesmo bloco.

### Alertas

Uso: AlertBeacon.

Padrao:
- alertas novos entram com `fade + slide 4px`;
- alerta critico pode ter ring leve por `1.5s`;
- alerta etico nao deve piscar; deve ser firme e estavel.

### Acessibilidade de motion

Toda animacao deve respeitar:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## 7. Acessibilidade

Regras obrigatorias:
- contraste minimo AA para texto;
- estados nunca dependem apenas de cor;
- icones decorativos devem ter contexto textual;
- botoes icon-only precisam de `title` ou label acessivel;
- foco visivel deve permanecer em todos os controles;
- badges precisam ser legiveis em mobile;
- tabelas/listas densas precisam de labels claros;
- mensagens sugeridas devem deixar explicito que envio e manual.

## 8. Aplicacao por rota

### `/dashboard`

Usar:
- MissionHero;
- AlertBeacon;
- MissionCard;
- TerritoryNode compacto;
- RhythmPanel;
- WellbeingMeter.

### `/minha-fila`

Usar:
- MissionHero;
- MissionCard em destaque;
- JourneyBar;
- CompletionToast;
- WellbeingMeter.

### `/pessoas`

Usar:
- MissionCard;
- QuestColumn quando houver agrupamento;
- AlertBeacon para bloqueios;
- JourneyBar compacto.

### `/abordagem`

Usar:
- QuestColumn;
- MissionCard;
- JourneyBar compacto;
- AlertBeacon;
- CompletionToast.

### `/territorios`

Usar:
- MissionHero territorial;
- TerritoryNode;
- AlertBeacon;
- RhythmPanel territorial;
- FieldQuestCard compacto quando houver evento.

### `/campo`

Usar:
- MissionHero;
- FieldQuestCard;
- JourneyBar de campo;
- CompletionToast;
- AlertBeacon para resultado pendente.

### `/temas`

Usar:
- TerritoryNode compacto;
- RhythmPanel tematico;
- FieldQuestCard compacto;
- badges de tema consistentes.

## 9. Checklist de implementacao

Antes de finalizar uma tela:

- A tela mostra proximo passo em ate 5 segundos?
- A fase atual aparece acima da dobra?
- O estado bloqueado/espera/concluido tem texto alem de cor?
- O CTA primario corresponde ao proximo passo real?
- A tela evita ranking individual e volume bruto?
- A tela respeita envio manual e consentimento?
- O visual parece parte da Base de Operacoes?
- Mobile nao quebra texto dentro de botoes, badges ou cards?
- Motion e sutil e respeita `prefers-reduced-motion`?

## 10. Criterio de sucesso

O design system esta funcionando quando:
- qualquer nova tela parece pertencer ao mesmo mundo visual;
- operadores reconhecem fase, missao e proximo passo sem treinamento extra;
- coordenacao entende gargalo, ritmo e cuidado rapidamente;
- territorio e campo parecem partes da mesma campanha cooperativa;
- conclusoes geram continuidade, nao apenas "feito";
- etica e acessibilidade continuam visiveis na interface.

## 11. Kit de componentes implementado

Na rodada GAMEUX10, os principais padroes visuais deixaram de existir apenas como trechos soltos de Tailwind e passaram a existir como componentes reais reutilizaveis em `src/components/radar/`.

### Componentes-base

- `gameful-hero.tsx`
  - Hero compartilhado para Base, Jornada, Territorio e Campo.
  - Props centrais: `eyebrow`, `title`, `description`, `badges`, `actions`, `metrics`, `aside`, `variant`.
- `gameful-metric-card.tsx`
  - Cartao unico para metricas pequenas e medias.
  - Tons: `light`, `dark`, `indigo`, `amber`, `emerald`.
- `gameful-portal-card.tsx`
  - Card de navegacao de mundos com `status`, `nextStep` e CTA.
- `gameful-empty-state.tsx`
  - Biblioteca de estados vazios por frente: `base`, `journey`, `territory`, `field`, `rhythm`, `memory`, `ethics`.
- `alert-beacon.tsx`
  - Beacon compartilhado para sinais operacionais com `tone`, `detail`, `value`, `href` e micro-CTA curto.

### Componentes de missao e jornada

- `mission-card.tsx`
  - Card padrao de missao para pessoa, com fase atual, motivo, proxima acao, bloqueio/espera, trilha e CTA principal.
- `journey-bar.tsx`
  - Trilha compartilhada de fases com versoes `compact` e `completa`.
  - `journey-progress.tsx` virou wrapper fino para preservar compatibilidade com chamadas antigas.

### Componentes de ritmo, territorio e campo

- `rhythm-panel.tsx`
  - Painel escuro unificado para cuidado, ritmo e saude operacional.
- `territory-node-card.tsx`
  - No territorial padrao para bairro, com fase, calor, temas e leitura resumida.
- `field-mission-card.tsx`
  - Card padrao para missao de campo ativa ou concluida, com metricas e proximo passo.

### Componente etico

- `ethical-guardrail-banner.tsx`
  - Banner curto para reforcar leitura agregada, cuidado com consentimento e operacao humana.

### Regras de uso

- novas telas gameful devem compor a partir desses componentes antes de criar novas variacoes locais;
- variacao visual deve acontecer primeiro por prop (`tone`, `variant`, `compact`, `footer`, `aside`), nao por copia de classes;
- se um layout novo exigir mais de 8 a 10 classes repetidas em duas rotas, o padrao deve voltar para o kit;
- componentes locais antigos ainda podem existir por compatibilidade, mas o alvo daqui para frente e convergir para este kit.

## 12. Convergencia por rota

### `/dashboard`

- `GamefulHero` para o topo principal.
- `AlertBeacon` para `Alertas do Sistema`.
- `GamefulMetricCard` tambem nos mini-resumos do hero e do `Mapa Rapido`.
- `MissionCard` para `Proximas Missoes`.

### `/minha-fila`

- `JourneyBar` compartilhado na trilha das proximas missoes e no card principal.
- `EthicalGuardrailBanner` para janelas eticas e sinais sensiveis.
- `QueueCard` e `QueueList` devem atuar como composicoes do kit, nao como sistema visual paralelo.

### `/pessoas`

- `PersonPriorityCard` em modo card deve preferir `MissionCard`.
- `JourneyBar` e guardrails eticos devem seguir a mesma leitura da fila e do dashboard.

### `/abordagem`

- Cards do mural devem ser tratados como variacao operacional de `MissionCard`.
- O que muda e o bloco de auditoria, responsavel, movimento entre colunas e resposta rapida; o shell visual deve continuar o mesmo mundo.

### `PersonQuickSheet`

- Trilha principal com `JourneyBar`.
- Sinais eticos com `EthicalGuardrailBanner`.
- Vazios de memoria e encaminhamento com `GamefulEmptyState`.

## 13. Quando usar cada componente

- `MissionCard`
  - Quando a unidade principal for uma pessoa/missao com fase, motivo, proximo passo e CTA.
- `AlertBeacon`
  - Quando a unidade principal for um sinal operacional resumido com link para destravar.
- `GamefulMetricCard`
  - Quando o conteudo for numerico ou resumido e o card nao precisar carregar narrativa longa.
- `JourneyBar`
  - Sempre que a leitura principal for etapa atual e caminho restante.
- `EthicalGuardrailBanner`
  - Sempre que a interface precisar reforcar cuidado, consentimento, janela etica ou leitura agregada.
- `GamefulEmptyState`
  - Sempre que o vazio precisar responder o que falta, por que falta e o que fazer agora.
