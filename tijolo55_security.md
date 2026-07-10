# Tijolo 55 — Segurança e conformidade

## Modelo de acesso

- Todas as tabelas públicas novas têm RLS habilitado.
- Leitura exige usuário interno ativo.
- Escritas operacionais passam por Route Handlers autenticados e cliente server-side `service_role` lazy; a chave nunca chega ao navegador.
- Observações escritas diretamente pelo papel autenticado exigem `created_by = auth.uid()`; atualização é restrita ao autor ou admin.
- Grants explícitos foram incluídos por causa da política atual do Data API do Supabase.

## Entrada e saída

- Username validado por allowlist e normalizado em minúsculas.
- Texto remove tags HTML, caracteres de controle, espaços excedentes e aplica limites.
- URLs aceitam apenas HTTP/HTTPS.
- Contadores são inteiros seguros e não negativos.
- Arquivos limitados a 10 MB e 25.000 linhas por requisição.
- Exportação CSV escapa fórmulas como texto entre aspas e inclui BOM; XML do Excel escapa entidades.

## Proteções de API

- Sessão interna é validada em cada endpoint; middleware não é a única barreira.
- Import/update exigem papel admin ou operador.
- Rate limit por usuário e IP para leitura e mutações.
- IDs dinâmicos exigem UUID válido.
- Mensagens internas de erro não são expostas como stack trace ao cliente.
- Importações, exportações, filas, processamento e notas geram auditoria.

## Instagram

- Não há scraping, login automatizado, bypass de CAPTCHA ou acesso a perfil privado.
- Campo `privada` apenas preserva informação fornecida pela fonte legítima; não dispara coleta.
- Localização é nula quando não há evidência e também quando há conflito equivalente.
- IA não recebe tarefa para inferir atributo sensível e só é chamada quando regras explícitas não resolvem.

## Riscos residuais

- O rate limit em memória é adequado como proteção local inicial; em múltiplas instâncias deve ser migrado para armazenamento distribuído.
- Endpoints externos opcionais de IA/atualização precisam de contrato, retenção e fornecedor aprovados pela organização.
- A migration deve passar pelos advisors do projeto Supabase de destino após ser aplicada.

