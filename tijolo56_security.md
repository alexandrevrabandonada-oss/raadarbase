# Tijolo 56 — Segurança e privacidade

## Controles implementados

- autenticação interna em todas as APIs e páginas;
- autorização admin/operador para importação, enriquecimento, relações, notas, sync e merges;
- RLS em todas as tabelas, sem acesso `anon` e sem escrita direta para `authenticated`;
- validação de UUIDs, enums, números, limites de campo e formatos;
- sanitização de HTML/texto e URLs;
- recusa recursiva de chaves associadas a raça/etnia, religião, sexualidade, saúde, opinião política e intenção de voto;
- rate limit por usuário/IP e por endpoint;
- auditoria de importação, exportação, enriquecimento, sync, merge, relação e nota;
- allowlist exata, HTTPS, timeout e redirects bloqueados no provider HTTP;
- segredos apenas em variáveis server-side;
- escaping de fórmula em CSV;
- evidência mínima com hash, origem, data e confiança.

## Identidade e localização

Somente identificador exato na mesma fonte pode vincular automaticamente. Domínio ou nome+cidade geram sugestão. Pessoas nunca são fundidas só por nome. Localização sem evidência permanece nula. Se cidade explícita divergir do texto fornecido, o registro recebe `location-conflict`, confiança reduzida e evidência de conflito.

## Limites de coleta

Não há scraping, crawler genérico, automação de login, CAPTCHA, perfil privado, bypass de segurança ou evasão de rate limit. `ExistingInstagramProvider` lê exclusivamente os dados já existentes e legitimamente importados no Tijolo 55.

## Banco

As migrations foram aplicadas ao projeto vinculado. A consulta posterior confirmou RLS habilitado e uma policy em cada uma das dez tabelas `radar_*`. Os advisors mantêm avisos anteriores do projeto, sem novo alerta específico para as tabelas do Hub.
