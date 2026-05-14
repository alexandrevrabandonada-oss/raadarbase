# Radar de Base - Piloto interno Engine v1

## Objetivo do piloto

Rodar o Radar com equipe pequena por uma semana para validar fluxo real de operação:

- missão por pessoa
- coordenação por ritmo
- campo com fechamento
- memória com revisão humana

Equipe sugerida:

- `2` a `3` operadores
- `1` coordenação
- `1` apoio eventual para campo/memória

## Como o operador usa Minha Jornada

Rota principal:

- `/minha-fila`

Rotina esperada:

1. abrir `Minha Jornada`
2. ler a `Próxima Missão`
3. seguir o `próximo passo` da missão
4. usar a ficha da pessoa para registrar resposta, pausa, cuidado ou encaminhamento
5. fechar a etapa e seguir para a próxima missão

Regras:

- uma missão por vez
- DM sempre manual
- copiar mensagem não marca envio
- confirmar envio só depois do envio real
- se houver `Não Abordar`, parar contato e registrar só revisão segura

## Como a coordenação usa Ritmo

Rota principal:

- `/ritmo`

Rotina esperada:

1. abrir `Central de Ritmo`
2. olhar `Próxima decisão`
3. resolver primeiro a trava mais crítica
4. redistribuir trabalho em blocos pequenos
5. evitar abrir novas frentes com cuidado pendente

O que a coordenação deve observar:

- missões sem responsável
- retornos pendentes
- encaminhamentos abertos
- cuidados urgentes
- campo sem fechamento
- memória pendente

O que a coordenação não deve fazer:

- comparar operadores por volume
- pressionar por DM em massa
- usar o ritmo como ranking

## Como Campo registra resultado

Rotas:

- `/campo`
- `/campo/[id]`
- `/campo/[id]/resultado`

Fluxo:

1. criar missão de campo
2. marcar como concluída quando a ação terminar
3. registrar resultado agregado
4. revisar próximos passos
5. abrir memória quando o CTA aparecer

Regra:

- registrar leitura coletiva
- nunca registrar nomes, @, telefone, endereço ou relato individual sem consentimento

## Como Memória fecha ciclo

Rotas:

- `/memoria`
- `/memoria/nova`

Fluxo esperado:

1. abrir sugestão da engine ou CTA vindo de Campo
2. revisar a síntese assistida
3. preencher:
   - o que aconteceu
   - o que aprendemos
   - como usar no próximo ciclo
   - cuidado ético
   - próximo passo sugerido
4. confirmar todo o checklist ético
5. salvar a memória só depois da revisão humana

Regra central:

- memória não é automática
- memória não é ficha de pessoa
- memória só guarda aprendizado operacional agregado

## O que reportar durante o piloto

Registrar diariamente:

- rota onde travou
- ação que não ficou clara
- texto ambíguo ou contraditório
- guardrail faltando
- overflow, corte ou botão inacessível
- passo que exigiu informação espalhada demais

Formato mínimo do reporte:

- tela
- ação tentada
- resultado esperado
- resultado real
- print, se houver

## O que não fazer

- não automatizar DM
- não usar dados do Instagram para voluntariado sem consentimento direto
- não registrar pessoa individual em memória estratégica
- não usar a ferramenta para inferir voto, ideologia, intenção política ou chance de voluntariado
- não usar território como mapa individual
- não insistir em contato quando houver `Não Abordar` ou pausa ética

## Critério prático de sucesso do piloto

Ao fim da semana, a equipe deve conseguir:

- trabalhar o dia pela `Minha Jornada`
- distribuir travas pela `Central de Ritmo`
- fechar campo com resultado agregado
- transformar pelo menos parte do campo em memória revisada
- operar sem recorrer a planilhas paralelas para o fluxo principal
