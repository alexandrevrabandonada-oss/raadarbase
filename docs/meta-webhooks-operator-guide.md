# Guia do Operador - Webhooks Meta/Instagram

## O que é Webhook?

Webhook é uma forma de receber notificações automáticas do Instagram quando algo acontece na conta (comentários, menções, etc.). Ao invés de precisar consultar manualmente, o Instagram nos avisa em tempo real.

## O que Aparece em Quarentena?

Na página `/integracoes/meta/webhooks`, você verá eventos em quarentena. Cada evento mostra:

- **Tipo**: Comentário, Menção, etc.
- **Data/Hora**: Quando ocorreu
- **Status**: Em quarentena, Processado, Ignorado
- **Payload redigido**: Dados do evento (sem emails, telefones ou dados sensíveis)

### Eventos Permitidos
- ✅ **Comentários**: Interações públicas em posts
- ✅ **Menções**: Quando alguém menciona @radardebase

### Eventos Proibidos (ignorados automaticamente)
- ❌ **DMs/Mensagens diretas**: Sempre ignoradas
- ❌ **Seguidores**: Nunca coletamos em massa
- ❌ **Dados de perfil**: Sem consentimento explícito

## Quando Processar?

**Processe quando:**
- O comentário é público e relevante para o projeto
- A menção é de uma conta pública
- Há potencial de engajamento político construtivo

**Exemplos de processamento:**
- Comentário em post pedindo informações
- Menção de apoiador sugerindo pauta
- Comentário com dúvida sobre proposta

## Quando Ignorar?

**Ignore quando:**
- É spam ou conteúdo ofensivo
- Não tem relevância política
- É de conta privada/fake
- É conteúdo automatizado/bot

**Exemplos de ignorar:**
- Promoção comercial
- Comentário de bot
- Conteúdo ofensivo

## Como Identificar Evento Suspeito?

Sinais de alerta:
1. **Payload incompleto**: Faltam campos essenciais
2. **Assinatura inválida**: Evento não autenticado pelo Instagram
3. **Objeto não-Instagram**: Tentativa de envio de outra plataforma
4. **Muitos eventos iguais**: Possível ataque de flood

**Se suspeito:**
- Não processe
- Marque para revisão
- Reporte ao administrador

## O que NUNCA Fazer?

### 🚫 PROIBIDO - Violam governança

1. **Nunca envie DM automática**
   - Toda resposta deve ser humana e manual
   - Nunca use webhooks para iniciar conversa privada

2. **Nunca crie perfil político individual**
   - Não classifique como "apoiador"/"opositor"
   - Não infira voto, ideologia, religião
   - Não calcule "persuadibilidade"

3. **Nunca exporte dados sem autorização**
   - Emails, telefones, CPFs são sensíveis
   - Apenas username público é coletado

4. **Nunca processe sem revisão**
   - Quarentena é obrigatória
   - Nenhum evento processa automaticamente

## O que Significa Assinatura Inválida?

A assinatura (`X-Hub-Signature-256`) garante que o evento veio mesmo do Instagram.

- **Válida**: Evento autêntico do Instagram
- **Inválida**: Possível tentativa de spoofing/ataque

**Se aparecer evento com assinatura inválida:**
- É criado automaticamente um incidente
- Não processe o evento
- Notifique administrador imediatamente

## Por que DM Automática é Proibida?

### Riscos:
1. **LGPD**: Mensagem não solicitada viola privacidade
2. **Spam**: Reputação negativa para o projeto
3. **Segurança**: Conta pode ser banida pelo Instagram
4. **Ética**: Abordagem deve ser consentida e contextual

### Alternativa permitida:
- Responder publicamente nos comentários
- Usar abordagem manual quando apropriado
- Respeitar flag "não abordar"

## Como Reportar Incidente?

Se encontrar:
- Tentativa de bypass de segurança
- Evento suspeito
- Comportamento anômalo

**Ações:**
1. Marque evento como "para revisão"
2. Documente no campo de notas
3. Acesse `/incidentes` e crie incidente:
   - Tipo: `meta.webhook_suspicious`
   - Severidade: `medium` ou `high`
   - Descrição detalhada

## Checklist Diário de Revisão

Todo operador deve revisar quarentena diariamente:

- [ ] Acessar `/integracoes/meta/webhooks`
- [ ] Verificar eventos em quarentena
- [ ] Revisar payload de cada evento
- [ ] Processar eventos relevantes
- [ ] Ignorar eventos irrelevantes
- [ ] Marcar suspeitos para revisão
- [ ] Verificar se há incidentes novos

## Fluxo de Decisão

```
Evento em Quarentena
       ↓
  É permitido?
   /       \
  Não      Sim
   ↓        ↓
 Ignore  É relevante?
           /      \
          Não     Sim
           ↓       ↓
        Ignore  Processa
```

## Dúvidas?

Consulte:
- Documentação técnica: `docs/meta-webhooks-readiness.md`
- Staging checklist: `docs/meta-webhooks-staging-checklist.md`
- Relatório #016: `reports/estado-da-nacao-016.md`
