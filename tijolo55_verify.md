# Tijolo 55 — Verificação

## Critérios funcionais

- [x] Painel, KPIs, rankings e filtros.
- [x] Perfil individual, histórico, score, classificação e observações.
- [x] Importação CSV/JSON, normalização, duplicados e atualização de existentes.
- [x] Fila incremental, concorrência, retry, logs e auditoria.
- [x] APIs GET lista/detalhe e POST import/update.
- [x] CSV, Excel e JSON.
- [x] Unit, integration, e2e e smoke test.
- [x] Consulta paginada e tabela virtualizada.

## Automação

Comandos obrigatórios executados no repositório:

```text
npm run lint
npm run typecheck
npm run test
npm run build
```

Smoke específico:

```text
npx playwright test e2e/influencia.spec.ts
```

Resultado do smoke: 4 testes aprovados nos projetos `chromium` e `Mobile Chrome`. A validação no navegador confirmou página não vazia, ausência de overlay, console limpo e filtro `cidade=Resende` retornando apenas o perfil esperado.

Resultado final: lint sem erros (27 avisos legados de imports/variáveis não usados), typecheck aprovado, 49 arquivos/277 testes aprovados e build Next.js 16.2.6 compilado com sucesso.

## Evidência de cobertura

- Score: cálculo, pesos e entradas inválidas.
- Classificação: regra forte sem IA e fallback de IA apenas em ambiguidade.
- Localização: evidência válida, ausência de evidência e conflito.
- Importação: CSV com aspas, JSON envelopado e payload inválido.
- Rate limit: limite e renovação de janela.
- API: paginação autenticada e rejeição sem sessão.
- E2E: KPIs/ranking e filtro municipal em desktop e mobile.
