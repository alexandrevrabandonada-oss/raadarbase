# Tijolo 56 — Hub de Fontes e Motor de Enriquecimento

## Resultado

O Radar de Base agora possui uma camada de entidades acima do Radar de Influência. O Hub unifica pessoas, organizações, empresas, instituições, imprensa, sindicatos, comunidades, eventos e perfis digitais sem substituir nem quebrar o Tijolo 55.

Foram entregues:

- modelo relacional com entidades, identificadores, evidências, relações, jobs, fila, sugestões de merge, conectores, histórico e notas;
- normalizador universal para entrada manual, CSV, JSON e perfis Instagram já legitimamente armazenados;
- resolução conservadora de identidade, com vínculo por identificador exato e revisão humana para casos ambíguos;
- `TerritorialInfluenceScore` explicável, com alcance, relevância regional/institucional, rede, engajamento, qualidade e decaimento temporal;
- classificação determinística não sensível e IA opcional;
- APIs autenticadas, rate limit, auditoria e exportação CSV/Excel/JSON;
- painel, fontes, ficha de entidade e grafo responsivo;
- seed e fixtures exclusivamente fictícios;
- 309 testes automatizados, incluindo smoke desktop e mobile.

## Uso

1. Acesse `/dashboard/inteligencia` para consultar KPIs, rankings e filtros.
2. Em `/dashboard/inteligencia/fontes`, importe um CSV/JSON legítimo ou sincronize os registros já existentes do Tijolo 55.
3. Abra uma entidade para consultar score, origem dos campos, evidências, relações, notas e histórico.
4. Sugestões de equivalência só são aplicadas após ação explícita de admin/operador.
5. Use `/dashboard/inteligencia/grafo` para explorar relações em até três níveis.

## Interpretação do score

O total vai de 0 a 100. Ausência de dados não gera pontos. Evidência antiga sofre decaimento; conflito reduz qualidade. O JSON salvo em `influence_score_breakdown` apresenta cada componente e explicações legíveis. O score não estima opinião política, voto ou qualquer atributo sensível.

## Fontes configuráveis

`ConfiguredHttpProvider` só funciona para URLs listadas exatamente em `RADAR_ALLOWED_ENRICHMENT_ENDPOINTS`. A credencial opcional vem de `RADAR_ENRICHMENT_API_KEY`, apenas no servidor. A classificação por IA depende de `RADAR_AI_CLASSIFIER_URL` e `RADAR_AI_CLASSIFIER_KEY`; sem elas, as regras locais continuam funcionando.

## Deliberações de segurança

Não foram criados crawler aberto, scraping de redes sociais, login automatizado, bypass de CAPTCHA, acesso a perfis privados ou contorno de rate limit. Campos sensíveis conhecidos são rejeitados na normalização. Localização sem evidência permanece nula e conflitos são sinalizados para revisão.

Veja também `tijolo56_database.md`, `tijolo56_api.md`, `tijolo56_ui.md`, `tijolo56_security.md`, `tijolo56_verify.md` e `tijolo56_limitations.md`.
