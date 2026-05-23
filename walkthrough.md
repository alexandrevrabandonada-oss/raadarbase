# Walkthrough: Identidade Visual "Concreto Zen"

Esta seção descreve as melhorias implementadas para aplicar a identidade visual "Concreto Zen" no Radar de Base, combinando brutalismo industrial, estética popular e organização estruturada.

---

## 🎨 O Que Mudou (Concreto Zen)

### 1. Paleta de Cores e Fundo Texturizado
*   **Arquivo Modificado**: [globals.css](file:///c:/Projetos/Radar%20de%20Base/src/app/globals.css).
*   **O que muda**: 
    *   Mapeamento das variáveis base do Tailwind v4 para cores brutas (Preto carvão `#0B0B0B`, Cinza concreto `#1C1C1A`, Cinza cimento `#4A4943`, Branco sujo/off-white `#E7E0D2`, Amarelo queimado `#F2A900`, e Ferrugem `#9B3F1F`).
    *   Textura áspera de cimento, poeira e fuligem desenhada no fundo (`body`) usando múltiplos gradientes cruzados em CSS de alta performance.
    *   Criação de classes utilitárias de painéis cimento escuro e claro (`.radar-paper`, `.radar-panel-dark`, `.radar-panel-light`).
    *   Introdução do elemento gráfico **"Círculo Imperfeito Zen"** (`.zen-circle-element`) com deformação irregular simulando pincel stencil e animação sutil.

### 2. Botões Brutalistas e Placas Stencil
*   **Arquivo Modificado**: [button.tsx](file:///c:/Projetos/Radar%20de%20Base/src/components/ui/button.tsx).
*   **O que muda**:
    *   Botão principal redefinido com fundo amarelo queimado, borda preta sólida espessa e sombra deslocada de bloco rígido.
    *   Efeito interativo brutalista clássico: os botões deslocam-se fisicamente no hover e click acompanhando a projeção de suas sombras rígidas.
    *   Fontes redefinidas com caixa alta (`uppercase`), peso preto (`font-black`) e espaçamento de placa industrial (`tracking-wider`).

### 3. Cards com Bordas Firmes e Sombra de Cimento
*   **Arquivo Modificado**: [card.tsx](file:///c:/Projetos/Radar%20de%20Base/src/components/ui/card.tsx).
*   **O que muda**:
    *   Afastamento de cantos excessivamente arredondados: alterados os cantos para `rounded-[6px]` (cantos brutalistas mais retos).
    *   Remoção do anel de brilho padrão substituído por borda firme cinza cimento de 2px e sombra rígida.
    *   Redefinição dos títulos com peso preto em caixa alta e subtítulos industriais discretos para melhor legibilidade.

### 4. Badges/Carimbos e Alertas
*   **Arquivos Modificados**: [badge.tsx](file:///c:/Projetos/Radar%20de%20Base/src/components/ui/badge.tsx) e [alert.tsx](file:///c:/Projetos/Radar%20de%20Base/src/components/ui/alert.tsx).
*   **O que muda**:
    *   Badges transformados em carimbos estilo lambe-lambe táticos com bordas sólidas, caixa alta e cantos vivos.
    *   Alertas redesenhados como placas industriais de concreto e ferrugem com sombras discretas de alta legibilidade.

### 5. Cabeçalho e Menu Lateral (App Shell & Sidebar)
*   **Arquivos Modificados**: [sidebar.tsx](file:///c:/Projetos/Radar%20de%20Base/src/components/sidebar.tsx) e [app-shell.tsx](file:///c:/Projetos/Radar%20de%20Base/src/components/app-shell.tsx).
*   **O que muda**:
    *   Navegação da barra lateral repaginada com contornos pretos firmes nos grupos de links, divisores cinzas e blocos de link ativo com relevo amarelo queimado e sombras brutas.
    *   Cabeçalho mobile adaptado com a mesma linguagem visual (cantos vivos, alto contraste e logo carimbado).

### 6. Logomarca Concreto Zen Oficial
*   **Arquivo Novo/Modificados**: [logo.png](file:///c:/Projetos/Radar%20de%20Base/public/logo.png), [sidebar.tsx](file:///c:/Projetos/Radar%20de%20Base/src/components/sidebar.tsx), [app-shell.tsx](file:///c:/Projetos/Radar%20de%20Base/src/components/app-shell.tsx) e [login-form.tsx](file:///c:/Projetos/Radar%20de%20Base/src/app/login/login-form.tsx).
*   **O que muda**:
    *   Criação e inserção da logomarca oficial minimalista que funde um bloco de concreto brutalista com um círculo imperfeito de pincelada zen (Ensō).
    *   Posicionamento no cabeçalho do menu lateral desktop, no cabeçalho mobile do App Shell e centralizado na tela de login/cadastro com sombras rígidas e contraste industrial.

---

### 7. Tela de Vitória Gamificada na Minha Jornada
*   **Arquivo Modificado**: [queue-client.tsx](file:///c:/Projetos/Radar%20de%20Base/src/app/minha-fila/queue-client.tsx).
*   **O que muda**:
    *   Exibição de uma tela de comemoração brutalista (estilo *Concreto Zen*) quando a fila diária de DMs do operador é completamente processada.
    *   Exibição de estatísticas em tempo real da sessão: contatos totais finalizados hoje, combo de dias ativos com indicador de chamas (`Flame`) e ações do dia.
    *   Integração com a Web Audio API via `playSynthSuccess()` para acionar um arpejo comemorativo automático na conclusão e permitir re-execução manual através do botão dedicado "🔊 Tocar Comemoração".

### 8. Otimização de Banco de Dados: Índices na Tabela `ig_people`
*   **Arquivos Criados**: [039_ig_people_priority_indices.sql](file:///c:/Projetos/Radar%20de%20Base/supabase/migrations/039_ig_people_priority_indices.sql) e [apply_migration_039.mjs](file:///c:/Projetos/Radar%20de%20Base/scripts/apply_migration_039.mjs).
*   **O que muda**:
    *   Criação de índices compostos em `(status, responsible_id)` e `(responsible_id, status)` na tabela `public.ig_people`.
    *   Otimiza a leitura da fila de contatos prioritários (evitando scans completos) e acelera o processamento de painéis operacionais, equipe e estatísticas.
    *   Migração aplicada com sucesso no banco de dados remoto Supabase via API de gerenciamento seguro.

### 9. Resiliência Local: Migração da Fila Offline para IndexedDB
*   **Arquivos Modificados**: [offline-queue.ts](file:///c:/Projetos/Radar%20de%20Base/src/lib/offline-queue.ts) e [connection-indicator.tsx](file:///c:/Projetos/Radar%20de%20Base/src/components/connection-indicator.tsx).
*   **O que muda**:
    *   Substituição completa do `localStorage` (síncrono e limitado a 5MB) pela API assíncrona do `IndexedDB` nativa (`radar_offline_db` e object store `tasks`).
    *   Tratamento seguro para Server-Side Rendering (SSR) e ambientes Node.js/JSDOM de testes (sem travamento caso `window.indexedDB` não exista).
    *   Atualização assíncrona dos gatilhos no `ConnectionIndicator` para sincronização em background quando online.

### 10. Otimização de Performance de Consultas: Migração 040
*   **Arquivos Criados**: [040_performance_indices_tuning.sql](file:///c:/Projetos/Radar%20de%20Base/supabase/migrations/040_performance_indices_tuning.sql) e [apply_migration_040.mjs](file:///c:/Projetos/Radar%20de%20Base/scripts/apply_migration_040.mjs).
*   **O que muda**:
    *   Adicionados índices de performance para otimizar queries recorrentes na rua e em produção:
        *   `outreach_tasks(completed_at, created_at desc)` e `outreach_tasks(person_id)` para acelerar a busca e cruzamentos de tarefas ativas da equipe.
        *   `ig_interactions(occurred_at desc)` para busca instantânea de interações recentes limitadas a janelas temporais de cutoff.
        *   `audit_logs(entity_type, entity_id, created_at desc)` para alimentar o feed de logs de auditoria de cada pessoa sem fazer full table scans.
        *   `audit_logs(action, created_at desc)` e `audit_logs(created_at desc)` para carregar painéis globais e telemetria de atividade.
    *   Migração aplicada com sucesso no banco de dados remoto Supabase via API de gerenciamento.

---

## 🧪 Validação Operacional

*   **Verificação de Linting**: `npm run lint` concluído com sucesso (0 erros).
*   **Testes Automatizados**: `npx vitest run` finalizado com sucesso com todos os **256 testes passando** (256/256).
*   **Build de Produção**: `npm run build` compilado com sucesso, gerando todas as rotas e assets estáticos perfeitamente integrados com o Turbopack no Next.js 16.
