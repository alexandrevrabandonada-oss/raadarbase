# Estado da Nação - Radar de Base
## OPS03 - Telemetria Operacional Agregada

**Data:** 2026-05-08
**Status:** ✅ Operacional

### 1. Resumo da Implementação
Foi implementado um sistema de telemetria operacional leve para monitorar o comportamento da equipe durante o piloto de 7 dias. O objetivo é identificar gargalos de usabilidade e garantir que o fluxo de atendimento (Minha Fila -> IG -> Resposta) esteja funcionando conforme o esperado.

### 2. Eventos Rastreados (Agregados)
A telemetria registra os seguintes pontos de interação na tabela `audit_logs` (entity_type: `operational_telemetry`):
- **Abertura de Contexto:** `dashboard_viewed`, `kanban_viewed`, `quick_sheet_opened`.
- **Ações de Atendimento:** `dm_copied` (com localização), `instagram_opened`.
- **Decisões Operacionais:** `task_assumed`, `note_saved`, `person_skipped`, `response_recorded`.
- **Encaminhamentos:** `person_referred` (com alvo estratégico).

### 3. Painel de Monitoramento
Disponível em `/relatorios > Telemetria de Uso`, o painel apresenta:
- **Funil de Conversão:** Visualização clara das perdas entre abrir a ficha, copiar a DM, abrir o IG e registrar a resposta.
- **Eficiência DM:** Percentual de pessoas atendidas em relação às fichas abertas.
- **Distribuição Diária:** Volume agregado de eventos por dia.
- **Top Eventos:** Identificação das ações mais frequentes.

### 4. Guardrails de Privacidade
- **Sem PII:** Nenhum conteúdo de mensagem, nome de usuário ou dado sensível é registrado na telemetria.
- **Agregação:** Os dados são visualizados de forma coletiva, evitando micro-vigilância ou rankings punitivos de operadores.
- **Transparência:** Aviso de privacidade inserido no painel de telemetria.

### 5. Próximos Passos
- Monitorar a taxa de abandono entre "Abriu Instagram" e "Registrou Resposta". Se for alta, pode indicar que o link externo está falhando ou que o registro é muito burocrático.
- Validar se o evento `person_skipped` ocorre com frequência excessiva em determinados temas.

---
*Gerado automaticamente pelo Antigravity em conformidade com as diretrizes de governança do Radar de Base.*
