# Estado da Nação - Radar de Base
## Relatório de Inteligência Territorial (geo01)

**Data**: 09 de Maio de 2026
**Módulo**: Painel Territorial (/relatorios/territorios)
**Status**: Operacional - Beta Territorial

---

### 1. Visão Geral
O Módulo Territorial (geo01) foi implementado para suprir a necessidade de uma leitura espacial da base de dados, permitindo que a coordenação identifique bairros prioritários para ações de campo sem comprometer a privacidade individual dos monitorados.

### 2. Guardrails Éticos e Operacionais
Conforme as diretrizes do Radar de Base, o painel segue as seguintes restrições:
- **Não Vigilância**: Não existem mapas de pontos individuais. A menor unidade geográfica é o **Bairro**.
- **Dados Declarados**: Utilizamos apenas o bairro informado voluntariamente em relatos (`bairro_escuta`) ou cadastros de voluntários.
- **Anonimização Agregada**: O dashboard exibe apenas contagens e tendências. Não é possível acessar o perfil individual de uma pessoa diretamente a partir das métricas agregadas do bairro.

### 3. Lógica de Priorização (Territory Score)
O ranking de bairros é calculado dinamicamente com base em quatro vetores:
1. **Volume de Sinais (Sinais)**: Quantidade de relatos e escutas registradas no bairro.
2. **Capacidade Local (Voluntários)**: Número de voluntários ativos e consentidos no território.
3. **Pendências de Escuta**: Volume de tarefas de abordagem em aberto para pessoas daquele bairro.
4. **Recência de Campo**: Penalização para bairros que não recebem uma ação física (`Banca de Escuta`, `Caminhada`) há mais de 15 dias.

### 4. Integração com Agenda de Campo
O painel sugere automaticamente a próxima ação (ex: "Banca de Escuta Temática" se houver muitas pautas pendentes). O botão "Planejar Agora" leva o operador diretamente para o formulário da Agenda de Campo com o bairro já pré-selecionado, fechando o ciclo **Dado -> Decisão -> Ação**.

### 5. Próximos Passos
- [ ] Implementar mapa de calor (Heatmap) por bairro para visualização rápida da cidade.
- [ ] Integrar dados de conversão de divulgação territorial (outreach logs).
- [ ] Expandir o "Suggested Action" com IA para identificar temas específicos mais urgentes.

---
**Radar de Base** - *Inteligência Territorial Responsável*
