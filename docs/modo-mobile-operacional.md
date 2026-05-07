# Modo Mobile Operacional

## Conceito

O modo mobile operacional do SEMEAR Territorios foi desenhado para uso real em campo. A ideia nao e encolher o desktop, e sim reorganizar a interface para poucas acoes por vez, leitura rapida e digitacao confortavel em telas pequenas.

## Principais rotas

- `/dashboard`
- `/acoes`
- `/acoes/novo`
- `/escutas`
- `/escutas/lote`
- `/territorios`
- `/mapa`
- `/pos-banca`
- `/ajuda`
- `/transparencia/snapshots`

## Desktop x mobile

- Desktop:
  usa sidebar fixa, mais densidade de informacao e tabelas quando fazem sentido.

- Mobile:
  usa topbar compacta, drawer, bottom nav e cards empilhados.

- Tablet:
  fica no meio do caminho, mantendo cards e navegacao compacta sem perder respiracao visual.

## Fluxo recomendado em campo

1. Abrir `Digitar`.
2. Selecionar a acao da sessao.
3. Confirmar o entrevistador.
4. Registrar bairro, pauta e relato curto.
5. Salvar a ficha.
6. Seguir para a proxima ficha.
7. Revisar depois em `/escutas` ou no admin territorial.

## Como digitar fichas no celular

- Use `/escutas/lote`.
- Escolha a acao recente no topo da sessao.
- Defina o entrevistador antes de iniciar a rodada.
- Preencha apenas o necessario:
  bairro, pauta e sintese curta.
- Use `Salvar rascunho` quando precisar pausar.
- Use `Salvar e digitar proxima` para seguir na mesma sessao.

## Privacidade e seguranca

- Nao registrar CPF, telefone, endereco ou dado sensivel.
- Contato so deve ser preenchido se houver consentimento explicito.
- O rascunho local do modo mobile fica apenas no aparelho e serve para continuidade da sessao.
- O envio continua usando a base atual de escuta territorial, sem schema novo e sem afrouxar RLS.

## Limitacoes atuais

- O contexto de sessao de `/escutas/lote` ajuda a operacao, mas nem todos os campos auxiliares entram no schema atual.
- Nao ha modo offline ou PWA neste tijolo.
- Relatorios mais extensos continuam mais confortaveis no desktop.

## Proximos passos

1. Extrair componentes mobile de filtros com bottom sheet real.
2. Conectar mais campos operacionais da sessao a estruturas persistentes ja existentes, se houver espaco no dominio.
3. Criar testes visuais versionados para operacao de campo.
4. Avaliar modo offline somente depois de consolidar o fluxo online.
