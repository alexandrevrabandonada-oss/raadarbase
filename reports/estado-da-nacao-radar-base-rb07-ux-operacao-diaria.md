# Estado da Nação RB07 - UX e Operação Diária

Data: 2026-05-07

## Objetivo Concluído

O fluxo do Radar de Base foi transformado em uma rotina simples e operacional para a equipe, focada em velocidade e clareza. O sistema agora guia o usuário desde a abertura do app até o encaminhamento final em poucos passos.

## Checklist de Usabilidade Implementado

### 1. Rotina em 10 Segundos
- **Dashboard "Rotina do Dia"**: Substituiu a lista genérica em `/pessoas`. Exibe as 10 pessoas prioritárias com a **Próxima Ação** em destaque visual.
- **Microcopy Operacional**: Removidos termos como "Lead" e "Conversão". Agora usamos "Pessoa", "Vínculo", "Encaminhamento" e "Ação Realizada".
- **Motivos Claros**: Cada card explica exatamente por que a pessoa é prioridade (ex: "Relato sobre saúde", "Respondeu Story").

### 2. Gestão de Riscos e Alertas
- **Alertas de Risco**: Banners coloridos em destaque para:
    - **Não abordar**: Respeito imediato ao pedido de privacidade.
    - **Falta Encaminhamento**: Alerta amarelo se a pessoa respondeu mas ninguém a direcionou para uma ação.
    - **Contato Recente**: Alerta azul se uma DM foi enviada há menos de 24h, evitando spam.

### 3. Execução Manual e Humana
- **Fluxo de Cópia**: Botões de "Copiar Mensagem" e "Abrir Instagram" são os caminhos primários. Nenhuma automação de envio foi implementada, preservando a linguagem humana.
- **Roteiro de Abordagem**: Atualizado em `/mensagens` com os passos exatos para a rotina diária.

### 4. Interface e Acessibilidade
- **Mobile-First**: Layouts de cards ajustados para telas menores, com alvos de toque maiores para botões de ação.
- **Estados Vazios**: Telas sem dados agora explicam o que o usuário deve fazer em seguida (ex: "Fila em dia, revise a lista completa").
- **Contraste**: Aumento do contraste em badges de status e textos de apoio.

## Verificação Realizada
- **Build & TypeScript**: 100% OK.
- **Testes de Unidade**: Atualizados para refletir a nova linguagem operacional.
- **Lint**: OK.
- **Segurança (RLS)**: Verificada.

## Próximos Passos Sugeridos
- Implementar o campo `responsible_id` na tabela `ig_people` para permitir o alerta de "Pessoa sem responsável" de forma dinâmica.
