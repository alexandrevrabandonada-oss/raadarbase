# Estado da Nacao - Ritmo 04 - Jornada da Acao de Campo

## Objetivo
Aplicar uma Jornada da Acao de Campo com estado claro e proximo passo visivel para cada evento em /campo.

Fases implementadas:
- Planejar
- Convidar
- Confirmar
- Realizar
- Registrar
- Fazer follow-up

## Entregas realizadas

### 1) Jornada de Campo (logica)
Arquivo: src/lib/data/field-agenda-journey.ts

- Criado mapeamento de fase atual por evento com base em:
  - status rascunho/planejado -> Planejar
  - pessoas convidadas -> Convidar
  - confirmacoes registradas -> Confirmar
  - data atual/passada (ou evento concluido) -> Realizar
  - resultado registrado -> Registrar
  - tarefas pos-evento criadas -> Fazer follow-up
- Adicionados:
  - progresso percentual da jornada
  - proximo passo
  - checklist da fase atual
  - bloqueios
  - acoes recomendadas
  - sinalizacao de alerta de fechamento pendente

### 2) Resultados em lote para pagina /campo
Arquivo: src/lib/data/field-agenda.ts

- Adicionada funcao listFieldAgendaEventResultsByEventIds(eventIds).
- Permite montar a jornada de cada evento na listagem sem N+1 no front.

### 3) JourneyProgress em cada evento de /campo
Arquivo: src/app/campo/page.tsx

- Integrado componente compacto de progresso em:
  - Proximos Eventos
  - Historico de Impacto
- Cada item da lista agora exibe:
  - fase atual
  - barra/progresso
  - proximo passo

### 4) Jornada completa no evento especifico
Arquivo: src/app/campo/[id]/page.tsx

- Adicionado painel "Jornada da Acao de Campo" contendo:
  - fase atual
  - proximo passo
  - checklist da fase
  - bloqueios
  - acoes recomendadas

### 5) Alerta pos-evento sem resultado
Arquivo: src/app/campo/[id]/page.tsx

- Regra aplicada:
  - Se evento ja passou (ou foi marcado concluido) e nao ha resultado registrado,
  - Exibir alerta:
    "Esta acao precisa ser fechada para virar memoria e aprendizado."

### 6) Componentes visuais da jornada
Arquivo: src/components/radar/field-agenda/field-journey-progress.tsx

- FieldJourneyProgressCompact: usado na listagem de eventos.
- FieldJourneyPanel: usado no detalhe do evento.

## Criterio de aceite

"Toda acao de campo deve ter estado claro e proximo passo visivel."

Status: ATENDIDO
- Listagem /campo: todos os eventos exibidos com fase e proximo passo.
- Detalhe /campo/[id]: fase atual, checklist, bloqueios e acoes recomendadas visiveis.
- Pos-evento sem fechamento: alerta obrigatorio exibido.

## Validacao tecnica
- Build validado com sucesso apos mudancas.
- Lint dos arquivos alterados sem erros.
- Validacao completa via npm run verify executada na etapa final deste ritmo.
