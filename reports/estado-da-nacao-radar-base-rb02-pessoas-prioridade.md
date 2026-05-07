# Estado da Nacao RB02 - Pessoas Prioridade

Data: 2026-05-07

## Arquivos Alterados

- `src/app/pessoas/page.tsx`
- `src/app/pessoas/people-client.tsx`
- `src/lib/data/people-priority.ts`
- `src/lib/data/people-priority.test.ts`
- `src/lib/types.ts`

## Lógica De Prioridade Criada

O bloco novo de `/pessoas` agora responde de forma prática a pergunta "quem abordar hoje?" sem criar rota nova e sem automação de contato.

### Dados usados

- `ig_people`
- `ig_interactions`
- `outreach_tasks`
- `message_templates`
- `contacts`

### Critérios aplicados

- exclui da prioridade padrão quem está em `nao_abordar` ou tem `do_not_contact_reason`;
- valoriza interação recente;
- valoriza comentário e resposta de story;
- valoriza relato textual, não só curtida;
- valoriza tarefa de abordagem pendente;
- valoriza ausência de encaminhamento registrado;
- considera resposta anterior e consentimento confirmado como sinais operacionais;
- não usa score político, não usa inferência sensível e não usa automação.

### Entregas na UI

No topo de `/pessoas` agora existe o bloco:
- `Quem abordar hoje`
- até 10 pessoas prioritárias
- temperatura `Quente / Morno / Frio`
- status de abordagem
- pauta principal
- última interação
- motivo da prioridade em linguagem humana
- próxima ação sugerida
- responsável, se existir
- `Ver pessoa`
- `Abrir Instagram`
- `Copiar mensagem sugerida`

Também foram adicionados filtros rápidos:
- `Todos`
- `Quentes`
- `Sem responsável`
- `Pendente de resposta`
- `Sem encaminhamento`
- `Não abordar`
- filtro por tema/pauta

### Geração de motivo humano

O helper novo gera frases curtas com base em sinais observáveis, por exemplo:
- comentário recorrente recente;
- resposta de story sem encaminhamento;
- relato sobre tema principal;
- interesse demonstrado sem próximo passo registrado;
- interação recente sem abordagem registrada.

### Mensagem sugerida

O botão só copia texto. Não envia nada.

A seleção do template tenta casar:
- tema principal da pessoa;
- etapa de abordagem;
- fallback para `escuta` ou `grupo`.

## Limitações Atuais

1. `outreach_tasks` ainda não tem responsável estruturado. A tela mostra `Sem responsável` quando esse campo não existe.
2. O conceito de encaminhamento ainda é inferido por status/tarefa. Ainda não existe vínculo explícito pessoa -> evento/grupo/missão.
3. A prioridade ainda é calculada em leitura. Não existe persistência de score nem histórico de decisão.
4. A compatibilidade de template ainda é heurística. Não há mapeamento formal template <-> etapa <-> tema.
5. O quadro `/abordagem` continua sendo o próximo gargalo estrutural do fluxo, porque a persistência das mudanças de coluna ainda precisa ser tratada em um tijolo próprio.

## Próximos Passos

### RB03

Atuar em `/pessoas/[id]` para:
- mostrar explicação detalhada da prioridade;
- sugerir template com mais contexto;
- registrar encaminhamento manual.

### RB04

Atuar em `/abordagem` para:
- persistir mudança de coluna;
- registrar SLA e próximo passo;
- auditar movimentações.

### RB05

Atuar em `/campo` e `/voluntarios` para:
- registrar encaminhamento explícito;
- fechar a trilha pessoa -> ação coletiva / voluntariado.
