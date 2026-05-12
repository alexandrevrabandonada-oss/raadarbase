# Estado da Nacao - Radar de Base - Ritmo 08
## Gerador de Fechamento Semanal

Data: 12/05/2026
Status: Implementado

## Objetivo do ritmo
Criar um gerador de narrativa semanal em Markdown para coordenação encerrar a semana com visão coletiva pronta, sem exposição de dados individuais.

## Entregas principais
Implementacoes realizadas:
- src/components/radar/reports/weekly-closure-markdown-generator.tsx
- src/app/ritmo/ritmo-client.tsx
- src/app/ritmo/page.tsx

## O que foi implementado
1. Botão de geração
- Botão "Gerar fechamento da semana" adicionado na tela /ritmo.

2. Narrativa Markdown (conteúdo obrigatório)
- Resumo da semana.
- Fase da semana.
- Vínculos preparados.
- Conversas registradas.
- Encaminhamentos.
- Ações de campo.
- Territórios em mobilização.
- Cuidado da base.
- Pendências principais.
- Aprendizados qualitativos.
- Próximos passos.

3. Privacidade
- Sanitização aplicada ao markdown gerado para bloquear:
  - @identificadores.
  - emails.
  - telefones.
- Narrativa sem nomes de cidadãos.
- Sem ranking de operadores.

4. Tom narrativo
- Coletivo.
- Calmo.
- Analítico.
- Sem euforia.
- Sem cobrança individual.

5. Export
- Copiar conteúdo (clipboard).
- Baixar arquivo .md com nome datado.

## Integracao
- Implementado em /ritmo, conforme solicitado (alternativa válida a /relatorios).
- Usa métricas coletivas já calculadas no servidor para evitar duplicação de consultas.

## Verificacao tecnica
Comando executado:
- npm run verify

Resultado:
- Verificacao concluida com sucesso (status verde).
- Pipeline completo executado: lint, build, testes, check:rls, check:health e e2e.

## Conclusao
A coordenação passa a ter um fechamento semanal coletivo pronto em Markdown com um clique, em formato comunicável internamente, com proteção de privacidade e foco em aprendizado operacional.
