# Relatório de Diagnóstico e Qualidade da Base (Data01)

Este relatório apresenta o novo painel de Higiene e Qualidade da Base, projetado para garantir a integridade dos dados operacionais do Radar de Base.

## 1. Monitoramento de Higiene
- **Atribuição**: Identificação de pessoas sem responsável e tarefas órfãs.
- **Classificação**: Detecção de perfis sem temas ou com tags genéricas (N/A).
- **Higiene de Username**: Verificação de handles com caracteres inválidos ou espaços, que dificultam a busca manual no Instagram.

## 2. Detecção de Duplicatas
- **Heurística de Similaridade**: O sistema agora agrupa perfis com handles normalizados idênticos (ex: @joao.silva e @joaosilva).
- **Revisão Manual**: Seguindo os guardrails éticos, o sistema **não mescla** perfis automaticamente, apenas os lista para que a coordenação decida o perfil oficial.

## 3. Ações Sugeridas
- **Atribuição em Lote**: Recomendação de distribuir pessoas sem responsável entre a equipe ativa.
- **Revisão de Temas**: Focar na reclassificação de temas "Desconhecidos" para melhorar a precisão dos relatórios de pauta.
- **Gestão de Não Abordar**: Monitoramento da base de exclusão para garantir que pedidos de privacidade sejam respeitados transversalmente.

## 4. Status Técnico
- **Infraestrutura**: Implementado em `src/lib/data/data-quality.ts` sem necessidade de novas tabelas.
- **Performance**: Consultas otimizadas via Supabase Admin Client.
- **Segurança**: Validação de RLS e Auditoria garantidas (`audit.status_updated`).

---
**Conclusão**: O Radar de Base agora possui ferramentas nativas para evitar a degradação da base de contatos, garantindo que o crescimento da operação não resulte em perda de qualidade ou retrabalho.
