import fs from 'fs';

function getEnv() {
  const content = fs.readFileSync('.env', 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    if (line.trim() && !line.startsWith('#')) {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].replace('export ', '').trim();
        let val = parts.slice(1).join('=').trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        env[key] = val;
      }
    }
  }
  return env;
}

const env = getEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function run() {
  console.log('Checking for entries with value 0...');
  try {
    const res = await fetch(`${url}/rest/v1/financial_entries?select=id,value&value=eq.0`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });

    if (!res.ok) {
        console.error('Failed to fetch:', await res.text());
        return;
    }

    const data = await res.json();
    console.log(`Found ${data.length} entries with value 0.`);
    
    if (data.length > 0) {
        console.log('Deleting...');
        const delRes = await fetch(`${url}/rest/v1/financial_entries?value=eq.0`, {
            method: 'DELETE',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Prefer': 'return=representation'
            }
        });
        const deleted = await delRes.json();
        console.log(`Deleted ${deleted.length} entries.`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

run();
