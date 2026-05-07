# Estado da Nação - Tijolo 066
**Data**: 05 de Maio de 2026
**Módulo**: Card Visual do Recibo da Escuta

## O que foi construído

1. **Geração Dinâmica de Imagens**: O endpoint `/api/recibo/escuta/card` foi criado usando `next/og` (ImageResponse). Ele gera em tempo real um PNG seguro focado na identidade "Missão ÉLuta", bloqueando qualquer dado PII ou username.
2. **Formatos**: O endpoint suporta a flag `?format=1x1` (para Feed e postagens em grade) e `?format=3x4` (para Stories e status verticais).
3. **Página Atualizada**: A rota `/recibo/escuta` agora possui os botões "Baixar card 1:1" e "Baixar card 3:4", estimulando a propagação orgânica.
4. **Legendas e Contexto**: Uma nova caixa "Copiar legenda (Instagram/Facebook)" foi adicionada. A legenda instrui claramente sobre o anonimato da agregação e conduz diretamente ao formulário oficial (`/escuta/bairro`), sem solicitar dados nos comentários.
5. **Testes**: Adicionado o arquivo de E2E específico que testa a resposta das imagens em buffer, confirmando headers corretos e tamanho da resposta.
6. **Integração Visual**: O card visual utiliza as cores marcantes (preto/concreto #1a1a1a, amarelo #facc15, ferrugem #b91c1c), garantindo a leitura agressiva/urbana solicitada no guardrail.

## Guardrails Preservados

- **Zero Microtargeting**: A imagem é o retrato exato de uma visão macro da cidade. Nenhuma versão com filtro de sub-segmento geográfico ou pessoal é permitida.
- **Transparência**: Continua informando na interface gráfica e nas cópias "Recibo público agregado. Não contém dados pessoais".
- **Sem Automação Ilegal**: A distribuição segue restrita ao clique orgânico ("Copiar legenda", "Baixar card") pelo administrador, respeitando a trava contra `noAutoContact` e DMs automatizadas.
- **Isolamento de Produção**: Todo fluxo validado sem remover o `GO_STAGING`.

## Próximo Passo Sugerido

Recomendamos o teste visual final com o coordenador local utilizando o `staging` (testar download via celular do operador logado na página pública). O próximo grande tijolo foca possivelmente na inserção massiva das ações da base.
