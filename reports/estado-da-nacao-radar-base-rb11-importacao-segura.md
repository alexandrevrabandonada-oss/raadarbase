# Estado da Nação - Radar de Base - RB11: Importação Segura

**Data**: 07/05/2026
**Fase**: Ciclo RB11 (Importação Segura)
**Status**: Concluído e Validado 🟢

## 📋 Resumo Executivo
O Ciclo RB11 introduziu a ferramenta de **Importação Segura** (`/pessoas/importar`), permitindo que a equipe alimente o banco de dados do Radar de Base com contatos prioritários (vistos no Instagram) de forma manual ou em lote (via planilha).

Essa funcionalidade foca na transição e carga inicial para a operação real sem depender totalmente da Meta API webhooks (que só capta interações *a partir* da ativação). Todo o processo foi construído com fortes guardrails éticos, deduplicação em tempo real e prevenção de violações de privacidade.

## ✅ Entregas Concluídas

1. **Rota e UI de Importação (`/pessoas/importar`)**
   * Criada uma página dedicada acessível via botão na lista de rotina (`/pessoas`).
   * Formulário com duas modalidades: Cadastro Rápido (um contato por vez) e Importação em Lote (colando linhas do Excel/Google Sheets).
   * Adicionados alertas permanentes orientando a equipe a não realizar web scraping e não importar dados sensíveis.

2. **Deduplicação e Tratamento de Dados (`src/lib/data/import.ts`)**
   * Lógica robusta de normalização: converte links complexos do Instagram (`instagram.com/usuario?ref=...`) e formatos com `@` em um `username` limpo e minúsculo.
   * Sistema de pré-visualização que checa o banco (Supabase) **antes** de salvar.
   * Identifica duplicatas e propõe uma **atualização** (enrichment) ao invés de inserção dupla.

3. **Respeito à Privacidade e "Não Abordar"**
   * Se um username importado já possuir o status `nao_abordar` ou tiver um `do_not_contact_reason` preenchido no banco, o sistema **bloqueia** a atualização na pré-visualização, garantindo que o direito ao esquecimento não seja acidentalmente sobreposto.

4. **Automação Segura de Tarefas (`executePersonImportBatch`)**
   * Pessoas importadas com status `"para_abordar"` ou temperatura `"quente"` geram automaticamente uma tarefa no Kanban de Abordagem, já caindo no radar da equipe para o dia.
   * Nova ação registrada nos audit logs: `contact.imported`.

## 🛡️ Estabilidade Técnica
* Código fortemente tipado (`PersonImportPreview`, `PersonImportRow`).
* O Supabase Client administrativo é chamado na validação em batch com `in("username")` garantindo performance em arrays (evitando o N+1).
* Comando `npm run verify` passando limpo, atestando que Lint, TypeScript e Testes continuam blindados.

## 🚀 Próximos Passos
Com o banco populável via importação limpa, a equipe de base pode trazer o "backlog" orgânico para dentro do sistema agora mesmo.
As próximas frentes poderiam focar em aprofundar os Dashboards analíticos ou concluir a ativação dos webhooks do Meta App em ambiente produtivo.
