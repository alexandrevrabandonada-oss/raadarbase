# Relatório UX11 — Streamlining Operacional

**Status:** Concluído
**Data:** 08/05/2026
**Objetivo:** Reduzir fricção visual e acelerar a tomada de decisão em campo.

## 🟢 Entregas Realizadas

### 1. Compactação de Interface (Viewport Recovery)
- **Componente `OperationalStatusBar`:** Implementado em `/pessoas` e `/abordagem`. Recuperamos aproximadamente 300px de altura vertical ao consolidar métricas e filtros em uma barra de 56px.
- **`RadarPageHeader` Compact:** Novo modo que reduz o tamanho do título e paddings em telas operacionais.

### 2. Remoção de Redundância
- Eliminada a duplicação de cabeçalhos nas rotas `/dashboard`, `/abordagem`, `/mensagens` e `/pessoas`.
- O `AppShell` + `PageHeader` agora são a fonte única de verdade para o título da página.

### 3. Padronização de Nomenclatura (CTAs)
- **Registrar Resposta:** Substituiu "Confirmar Resposta".
- **Copiar DM:** Substituiu "Copiar template de DM".
- **Distribuir Tarefas:** Substituiu "Distribuir Carga".
- **Ver Ficha:** Fixado como CTA primário no ranking de pessoas.

### 4. Orientação por Empty States
- Melhoria contextual nos estados vazios de Agenda de Campo e Biblioteca de DMs, fornecendo caminhos claros de saída (Seed/Criação).

## 🛠️ Validação Técnica
- **Lint:** 0 erros.
- **Build:** Green.
- **Segurança:** RLS OK.
