import https from 'https';

const projectRef = process.env.SUPABASE_PROJECT_ID ?? 'blimjnitngthldhazvwh';
const pat = process.env.SUPABASE_ACCESS_TOKEN;

if (!pat) {
  console.error('SUPABASE_ACCESS_TOKEN is required to audit the remote schema.');
  process.exit(1);
}

const apiUrl = 'https://api.supabase.com/v1/projects/' + projectRef + '/database/query';

const reqHeaders = {
  'Authorization': 'Bearer ' + pat,
  'Content-Type': 'application/json'
};

function runQuery(sql) {
  const body = JSON.stringify({ query: sql });
  const urlObj = new URL(apiUrl);
  return new Promise(function(resolve, reject) {
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: Object.assign({}, reqHeaders, { 'Content-Length': Buffer.byteLength(body) })
    }, function(res) {
      let data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(data)); } catch(_e) { resolve(data); }
        } else {
          reject(new Error('HTTP ' + res.statusCode + ': ' + data));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  // 1. All tables with column details
  console.log('=== SCHEMA COMPLETO ===\n');
  const cols = await runQuery(`
    SELECT
      t.table_name,
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.column_default
    FROM information_schema.tables t
    JOIN information_schema.columns c
      ON c.table_name = t.table_name AND c.table_schema = t.table_schema
    WHERE t.table_schema = 'public'
    ORDER BY t.table_name, c.ordinal_position
  `);

  let currentTable = '';
  for (const row of cols) {
    if (row.table_name !== currentTable) {
      currentTable = row.table_name;
      console.log('\nTABELA: ' + currentTable);
      console.log('  ' + ['column_name','data_type','nullable','default'].join('\t'));
    }
    console.log('  ' + [row.column_name, row.data_type, row.is_nullable, row.column_default || ''].join('\t'));
  }

  // 2. Check RLS on each table
  console.log('\n\n=== RLS STATUS ===\n');
  const rls = await runQuery(`
    SELECT relname as table_name, relrowsecurity as rls_enabled
    FROM pg_class
    WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND relkind = 'r'
    ORDER BY relname
  `);
  for (const r of rls) {
    console.log('  ' + r.table_name + ': RLS=' + r.rls_enabled);
  }

  // 3. Current internal_users
  console.log('\n\n=== INTERNAL USERS ===\n');
  const users = await runQuery(`SELECT id, email, role, status FROM public.internal_users ORDER BY created_at`);
  for (const u of users) {
    console.log('  ' + u.email + ' | ' + u.role + ' | ' + u.status);
  }
}

main().catch(function(err) { console.error(err); process.exit(1); });
