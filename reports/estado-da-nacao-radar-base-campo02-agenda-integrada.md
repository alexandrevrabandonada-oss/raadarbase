# Estado da Nação: Agenda de Campo Integrada (campo02)
**Status: Prontidão Operacional**
**Data: 09/05/2026**

## 1. Síntese da Implementação
A Agenda de Campo foi transformada de um simples calendário em um hub operacional de engajamento territorial. A integração com o sistema de encaminhamentos permite rastrear o ciclo de vida do interesse de uma pessoa, desde o contato inicial no Instagram até a participação efetiva em uma roda de escuta ou mutirão.

### 1.1 Funil de Conversão Digital-Territorial
Implementamos um funil de 4 estágios visível em cada evento:
1. **Interessados/Convidados**: Capturados via Ficha Rápida no Kanban.
2. **Confirmados**: Pessoas que deram OK para a ida (gestão de expectativa).
3. **Presentes**: Marcação manual pós-evento para validar alcance.
4. **Colaboradores (Ajudaram)**: Identificação de pessoas com perfil de liderança ou ajuda ativa.

## 2. Guardrails Éticos em Vigor
- **Zero Automação**: Toda marcação de presença e convite é fruto de interação humana.
- **Conversão por Consentimento**: A transformação de "Interessado" em "Voluntário da Campanha" exige a existência de um registro de consentimento prévio na tabela `contacts`. Caso contrário, a ação é bloqueada pelo sistema.
- **Privacidade Coletiva**: Métricas agregadas são priorizadas em dashboards, evitando a exposição desnecessária de usernames em visões de alto nível.

## 3. Infraestrutura de Dados
- **Novas Métricas**: Agregação em tempo real via `ig_person_referrals` filtrada por `target_type: 'evento_campo'`.
- **Rastreabilidade**: Cada encaminhamento gera uma tarefa de follow-up automática na coluna "Esperando Resposta", garantindo que nenhum interessado seja esquecido.

## 4. Próximos Passos Sugeridos
1. **Piloto de Campo**: Realizar a primeira ação de campo usando a marcação de presença via tablet/celular em tempo real.
2. **Dashboard de Bairros**: Expandir o relatório de engajamento para uma visão de mapa (Heatmap) baseada em densidade de interessados por CEP/Bairro.
3. **Ciclo de Feedback**: Automatizar a criação de temas sugeridos a partir do "Resultado da Ação" registrado no pós-evento.

---
*Radar de Base: Inteligência Territorial com Responsabilidade.*
