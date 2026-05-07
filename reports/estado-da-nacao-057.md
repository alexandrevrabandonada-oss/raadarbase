# Estado da Nacao 057

Data: 2026-05-05

## Resumo executivo

Foi executado um pacote para reduzir atrito da escuta territorial: formulario com modo rapido, pauta pre-selecionavel por link seguro e novo kit de chamada no admin. Em staging, foram registrados dois novos outreach logs como planejados (sem marcar shared automaticamente), o terceiro snapshot foi criado e o plano foi atualizado mantendo monitoramento em doing.

## Melhorias no formulario (/escuta/bairro)

- Titulo e explicacao simplificados para envio em poucos segundos.
- Modo inicial: "Responder em 30 segundos".
- Fluxo minimo no modo rapido: bairro + pauta + relato curto + consentimento basico.
- Campo de pauta com opcoes rapidas: saude, transporte, poluicao/CSN e outro.
- Campo de relato curto com contador visivel (0/320) para reduzir texto excessivo.
- Contato opcional permanece oculto ate marcar "Quero deixar contato para retorno".
- Aviso de privacidade em linguagem curta, sem coleta de dados desnecessarios.
- Botao principal maior e mais claro para envio rapido.
- Tela de sucesso com texto compartilhavel e acao de copiar.

## Modo relato rapido

Implementado no componente do formulario com alternancia entre:

- modo rapido (padrao)
- modo completo

No modo rapido, contato fica fora do fluxo principal e aparece apenas por opcao explicita posterior.

## Links com pauta pre-selecionada

Foram habilitados links seguros que apenas pre-selecionam pauta:

- /escuta/bairro?pauta=saude
- /escuta/bairro?pauta=transporte
- /escuta/bairro?pauta=poluicao
- /escuta/bairro?pauta=csn

Os links nao criam perfil individual e nao registram origem pessoal.

## Novo kit de chamada publica (/escuta/bairro/admin)

Secao "Reforcar chamada" atualizada com:

- Story: "30 segundos: conte seu bairro e uma pauta urgente"
- WhatsApp: "Estamos organizando uma escuta por bairro. Nao precisa mandar telefone. Basta dizer bairro + pauta + relato curto no formulario."
- Card: "Qual problema do seu bairro precisa virar acao?"

Kit inclui links para:

- escuta geral
- escuta saude
- escuta transporte
- escuta poluicao/CSN

## Outreach logs planejados (novo lote)

Criados em staging como planned:

- instagram_story: 13598ecb-b5de-4163-8eed-674b2366cf22
- whatsapp: 19a8a53c-db98-4592-9b7c-ff3599820d72

Observacao: nenhum log foi marcado como shared automaticamente.

## Terceiro snapshot diario

Snapshot novo criado:

- id: ed369887-8278-4beb-9719-de423616c49b
- data: 2026-05-07
- status: attention
- total_reports: 0
- notes: "Chamada reforcada com fluxo de relato rapido; aguardar nova divulgacao manual."

Historico atual da janela 116d07a6-c9c3-4443-ae21-52f4d6194cbd:

- 2026-05-05: 9b43575e-b33d-47bb-ac4a-836a64cd4e8c
- 2026-05-06: 0af46add-9f9d-4736-b8d5-d1d1b1401cea
- 2026-05-07: ed369887-8278-4beb-9719-de423616c49b

## Plano atualizado

Action plan: b8c2f738-5cb2-456c-b013-6d21d3bd7e4d

- Reduzir atrito do formulario de escuta: done (id 06aa330e-7c64-4c10-8084-cf609a1fe7ad)
- Publicar nova chamada de 30 segundos: todo (id af7ebe44-60df-43bc-80e6-85a67f330dad)
- Monitorar escuta por bairro por 7 dias: doing (id 22407956-48eb-4481-a0df-1e0de2aec0c2)

## Guardrails preservados

- Sem DM automatica.
- Sem resposta automatica.
- Sem criacao automatica de contato.
- Sem score politico individual.
- Sem microtargeting.
- Sem exposicao de nome/username/telefone/email por padrao.
- Sem relato bruto em snapshot diario.
- Contato permanece opcional e consentido.

## Produção

- Produção permanece bloqueada.
- Fluxo segue em staging/internal.

## Proximo tijolo recomendado

Executar a nova rodada de divulgacao manual usando o kit de 30 segundos e, apos entrada de novos relatos, gerar o snapshot seguinte para verificar ganho real de participacao por bairro e pauta (sempre em agregado).