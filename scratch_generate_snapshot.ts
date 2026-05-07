
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

import { getSupabaseAdminClient } from './src/lib/supabase/admin';


import { getTerritorialListeningWindowById } from './src/lib/data/territorial-listening-windows';
import { getActionPlanByReportId } from './src/lib/data/action-plans';
import { generateDailyTerritorialSnapshot } from './src/lib/data/territorial-listening-monitoring';
import { getTerritorialNewBatchConversionMetrics } from './src/lib/data/territorial-listening-outreach';

async function main() {
  const windowId = '116d07a6-c9c3-4443-ae21-52f4d6194cbd';
  console.log(`Processing window: ${windowId}`);

  try {
    const window = await getTerritorialListeningWindowById(windowId);
    if (!window) {
      console.error('Window not found');
      return;
    }
    console.log(`Source Report ID: ${window.sourceReportId}`);

    const snapshot = await generateDailyTerritorialSnapshot(windowId, null);
    console.log('Snapshot generated:', JSON.stringify(snapshot, null, 2));

    const newBatchMetrics = await getTerritorialNewBatchConversionMetrics(windowId);
    console.log('New Batch Metrics:', JSON.stringify(newBatchMetrics, null, 2));

    const plan = await getActionPlanByReportId(window.sourceReportId);
    const monitorItem = plan?.items?.find((item) => item.title.includes('Monitorar escuta por bairro por 7 dias'));
    
    if (monitorItem) {
        console.log('Monitor Item found:', monitorItem.id);
        console.log('Current Metadata:', JSON.stringify(monitorItem.metadata, null, 2));
    } else {
        console.warn('Monitor Item not found in plan');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
