# Tijolo 56 — Limitações conhecidas

- A migration foi preparada e validada por lint do schema remoto e `db push --dry-run`, mas não foi aplicada. O Docker local estava indisponível, portanto não houve reset/seed local do Supabase nesta máquina.
- `ConfiguredHttpProvider` é apenas um contrato seguro. Nenhuma fonte externa real foi inventada; sem allowlist e credencial server-side ele permanece desabilitado.
- Aprovar uma sugestão cria relação `same_as`, marca a entidade secundária como `merged` e preserva dados/histórico. Consolidação física destrutiva de linhas não faz parte deste tijolo.
- O worker da fila é acionado pela API/processamento server-side; agendamento distribuído contínuo deve ser conectado à infraestrutura escolhida antes de produção.
- O grafo inicial limita a apresentação a 24 nós e 60 arestas e a consulta a três níveis. Não calcula centralidade avançada.
- A meta de menos de 2 segundos foi sustentada por paginação/RPCs/índices, mas ainda requer benchmark com 100 mil entidades, 500 mil evidências e 300 mil relações no ambiente de produção.
- A IA opcional depende da qualidade e conformidade do endpoint configurado. Resultados inválidos retornam `unknown`; revisão humana continua necessária.
- Saúde de conector indica configuração e última execução, não garante disponibilidade permanente da fonte externa.
