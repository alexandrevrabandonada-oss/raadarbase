# Estado da Nação: Radar de Base (UX08) - Ranking Premium

**Data:** Maio de 2026  
**Ciclo:** UX08 (Visual e Operacional)  
**Módulo:** `/pessoas` (Pessoas Prioritárias)

## Resumo Executivo
Neste ciclo de atualizações, transformamos a rota genérica `/pessoas` no **Ranking Premium Operacional**, o verdadeiro coração do acompanhamento diário do Radar de Base. 

O foco foi entregar uma usabilidade refinada para dois perfis de operadores: os supervisores que acompanham os "Top 10" mais quentes do dia, e os operadores de base que lidam com despachos densos de até 50 pessoas por vez. Tudo isso mantendo 100% da obediência aos nossos *guardrails* operacionais (nenhuma automatização de DM, obediência irrestrita ao estado de "Não Abordar", zero inferência ideológica).

## O que foi implementado

### 1. Sistema Multi-Modo (Cards vs. Lista Densa)
Substituímos o antigo agrupamento confuso de "Top 10" vs "Base Operacional" por uma **visualização inteligente e única**, controlada por um *toggle*:
- **Modo Cards:** Um grid espaçoso que exibe os Top contatos, contendo `Rank Badge` explícito (ex: `#1`, `#2`), e blocos amigáveis para leitura rápida.
- **Modo Lista Densa:** Refizemos a tabela horizontal como um container contínuo. Nela, o operador consegue ver todos os atributos (score, temas, alertas, ações) de uma forma horizontal, lidando melhor com lotes de dezenas de contatos sem poluir a tela.
- **Persistência de Escolha:** O modo de visualização escolhido (`viewMode`) é persistido com segurança no `localStorage` do dispositivo do operador, garantindo zero fricção em visitas futuras.

### 2. Explicabilidade de Score ("Whitebox")
Introduzimos o componente `PersonScoreExplanation`, que transforma o *Priority Score* de um "número mágico" em uma decisão explicável.
- Ao clicar ou passar o mouse na badge do Score, um *Tooltip estendido* (devido a restrições do Base UI com Popovers interativos na atual infraestrutura) é aberto revelando as regras de ranqueamento.
- **Alertas de Risco:** Injetamos diretamente no contexto avisos se a pessoa está em *blocklist* ("Não Abordar"), se há penalização por *Contato Recente*, ou se há *Pendência de Encaminhamento*, agilizando o raciocínio humano por trás do disparo de contatos.

### 3. Painel de KPIs de Topo
Para fornecer contexto instantâneo aos gerentes de comunidade, implementamos um dashboard estático superior (cards métricos) que lê dinamicamente a base priorizada na memória para os dados:
- Pessoas Reais (Total de contatos válidos pós filtro)
- Top Quentes
- Sem Dono
- Esperando
- A Encaminhar
- Não Abordar

### 4. Filtros Avançados Claros
O componente `quickFilters` foi refatorado e centralizado num cabeçalho moderno que dispensa dropdowns escondidos. Com um clique, os operadores isolam pessoas sem responsável ("Sem Dono") ou filtram por funil ("A encaminhar", "Esperando").

### 5. Consistência Total de Ações 
Tanto no modo *Card* quanto no modo *Lista*, inserimos o conjunto consistente de ações:
- `Assumir` (Visível apenas quando a pessoa está sem dono e o status não é bloqueado)
- `Abrir Instagram` (Ícone de atalho validado, com restrição à abertura em nova aba)
- `Ver ficha` (O antigo `Gerenciar`, renomeado para maior coesão com a terminologia atual)

## Verificação e Saúde da Aplicação
- ✅ **TypeScript e Componentes:** Todos os bugs relacionados a `asChild` em componentes de botão restritos pela biblioteca *Base UI* foram resolvidos sem contornos ilegais, utilizando âncoras puras.
- ✅ **Build de Produção:** O comando `npm run build` executou e validou sem nenhuma falha de TS (`Exit Code 0`, `~16s`).
- ✅ **Segurança:** O estado "Não Abordar" aplica um bloqueio visual `grayscale`, destacando em vermelho `NÃO ABORDAR` em substituição à "Próxima Ação", protegendo o usuário de contatos acidentais. O sistema também não injetou nenhum "Score Político" nos objetos renderizados.

O **Radar de Base** passa a possuir uma *homepage* operacional infinitamente mais rica, amigável e segura. O código pode ser versionado para a ramificação principal.
