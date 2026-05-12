# Estado da Nacao - Radar de Base - Ritmo 07
## Alertas Inteligentes de Ciclo

Data: 12/05/2026
Status: Implementado

## Objetivo do ritmo
Concentrar alertas operacionais em uma leitura orientada a ciclo para que a coordenação veja rapidamente o que está travado e qual próximo passo tomar.

## Entregas principais
Implementacoes realizadas:
- src/lib/data/operational-cycle-alerts.ts
- src/components/radar/cycle-alert-list.tsx
- src/app/ritmo/page.tsx
- src/app/ritmo/ritmo-client.tsx
- src/app/dashboard/page.tsx
- src/app/dashboard/dashboard-client.tsx
- src/app/relatorios/page.tsx

## O que foi implementado
1. Helper central de alertas
- Novo helper getOperationalCycleAlerts.
- Consolida regras de travamento por jornada e retorna alertas padronizados com:
  - tipo do alerta
  - mensagem de cuidado
  - proximo passo
  - contagem
  - link de acao
  - severidade

2. Alertas cobertos
- Vinculo travado:
  - Condicao: pendencias em Registrar/Encaminhar por mais de X dias (padrao X=5).
  - Mensagem: "Este vínculo precisa de fechamento ou pausa."
- Campo travado:
  - Condicao: evento passado sem resultado registrado.
  - Mensagem: "Esta ação precisa virar memória e aprendizado."
- Territorio travado:
  - Condicao: bairro em Mobilizacao sem acao de campo planejada.
  - Mensagem: "O bairro tem sinais suficientes. Planeje uma escuta ou ação."
- Operador sobrecarregado:
  - Condicao: fila individual acima do limite saudavel.
  - Mensagem: "Redistribua ou trabalhe em blocos menores."
- Dados pedindo revisao:
  - Condicao: registros inativos +180 dias e/ou notas sensiveis pendentes.
  - Mensagem: "Há dados que precisam de cuidado."

3. Componente de interface
- Novo componente CycleAlertList.
- Exibe alertas em formato unico com:
  - mensagem principal
  - contagem
  - proximo passo recomendado
  - botao de navegacao para acao
- Quando nao ha travas, mostra estado positivo sem linguagem competitiva.

4. Integracoes
- /ritmo:
  - Alertas aparecem na abertura da Central de Ritmo.
- /dashboard:
  - Alertas aparecem logo apos o banner de status do piloto.
- /relatorios:
  - Alertas aparecem no topo da pagina, antes das abas.

## Guardrails aplicados
- Sem alerta humilhante.
- Sem ranking de operadores.
- Sem exposicao nominal de pessoas cidadas.
- Linguagem de cuidado com orientacao de proximo passo.

## Verificacao tecnica
Comando executado:
- npm run verify

Resultado:
- Verificacao concluida com sucesso (status verde).
- Pipeline completo executado: lint, build, testes, check:rls, check:health e e2e.

## Conclusao
O Ritmo 07 transforma alertas dispersos em uma leitura unica de ciclo, ajudando a coordenação a identificar travas de vinculo, campo, territorio, carga da equipe e cuidado de dados com direcionamento objetivo para acao.
