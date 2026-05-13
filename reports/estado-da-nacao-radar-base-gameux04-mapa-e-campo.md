# Estado da Nacao - Radar Base GameUX04

## Escopo

Transformacao das rotas `/territorios`, `/campo` e da leitura de `/temas` para um mesmo universo visual de campanha cooperativa: mapa territorial, missoes de campo e conexao entre pauta, bairro e continuidade.

## Entregas

- `/territorios` refeito como `Mapa da Mobilizacao`, com hero territorial, leitura de fases e bairros como nos/cartas de campanha.
- Cada bairro agora abre detalhe com fase atual, motivo da fase, proximas acoes, pessoas agregadas, eventos relacionados e memoria recente.
- `/campo` refeito como `Missoes de Campo`, com foco em jornada da acao, progresso, convites, confirmacoes, presenca e follow-up.
- `/temas` passou a mostrar conexoes com bairros, geracao de campo e continuidade territorial.
- Mapper territorial alinhado ao fluxo atual de `campo`.

## Arquivos principais

- `src/app/relatorios/territorios/page.tsx`
- `src/app/relatorios/territorios/territories-client.tsx`
- `src/components/radar/reports/territorial-card.tsx`
- `src/lib/data/territories.ts`
- `src/lib/data/territory-mapper.ts`
- `src/app/campo/page.tsx`
- `src/app/temas/page.tsx`
- `src/lib/types.ts`

## Direcao aplicada

- Territorio aparece como mapa vivo de mobilizacao, nao como tabela analitica.
- Campo aparece como trilha de missoes presenciais, nao como agenda administrativa.
- Temas viram eixos que puxam bairros, geram presenca e sustentam continuidade.
- Guardrails eticos permanecem explicitos: leitura agregada por bairro, sem exposicao de pessoas como unidade geografica.

## Risco residual

- O detalhe territorial ainda depende de agregacoes leves disponiveis hoje; uma rodada futura pode aprofundar ligacoes entre bairro, memoria estrategica e referrals para enriquecer ainda mais a leitura.
