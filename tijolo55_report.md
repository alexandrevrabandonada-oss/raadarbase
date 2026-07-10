# Tijolo 55 — Radar de Influência Instagram

## Resultado

Módulo integrado ao Radar de Base em `/dashboard/influencia`, com página individual em `/dashboard/influencia/[id]` e APIs sob `/api/influencia`.

## Entregas

- CRM com dados de perfil, score explicável, classificação, localização com confiança, histórico e observações.
- Rankings gerais, municipais, regionais e por categoria.
- Busca por texto e filtros de categoria, cidade, estado, score e seguidores.
- Importação CSV/JSON de listas legitimamente obtidas, com normalização, deduplicação e upsert.
- Atualização incremental de perfis desatualizados com fila, concorrência, retry exponencial e logs.
- Exportações CSV, SpreadsheetML compatível com Excel (`.xls`) e JSON.
- Distribuições automáticas por categoria, cidade e faixa de seguidores.
- Interface dark-mode-ready, filtros rápidos, paginação e janela de renderização virtualizada.
- Migration, RLS, policies, grants explícitos, índices e seed demonstrativo fictício.

## Guardrails Instagram

O módulo não autentica no Instagram, não contorna CAPTCHA ou mecanismos de segurança, não raspa páginas privadas e não inclui coletor por scraping. Entradas aceitas são arquivo legítimo, API oficial/permitida ou entrada manual. A atualização HTTP só é habilitada quando uma fonte permitida é configurada explicitamente.

## Configuração opcional

- `INFLUENCE_AI_CLASSIFIER_URL`: classificador externo usado apenas quando regras fortes não resolvem.
- `INFLUENCE_AI_CLASSIFIER_KEY`: credencial server-side opcional do classificador.
- `INFLUENCE_PROFILE_UPDATE_ENDPOINT`: fonte permitida de atualização incremental.
- `INFLUENCE_PROFILE_UPDATE_KEY`: credencial server-side opcional da fonte.

## Observação de implantação

A migration foi criada e versionada, mas não foi aplicada automaticamente a um banco remoto para evitar alterar um ambiente Supabase não identificado. Aplique-a no ambiente de destino pelo fluxo de migrations do projeto.

