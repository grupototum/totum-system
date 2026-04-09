import fs from 'fs';

function getEnv() {
  const content = fs.readFileSync('.env', 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    if (line.trim() && !line.startsWith('#')) {
      const parts = line.split('=');
      const key = parts[0].trim();
      let val = parts.slice(1).join('=').trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const env = getEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function run() {
  console.log('Fetching financial entries...');
  try {
    const res = await fetch(`${url}/rest/v1/financial_entries?select=id`, {
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
    console.log(`Found ${data.length} entries.`);

    if (data.length > 0) {
      console.log('Deleting...');
      const delRes = await fetch(`${url}/rest/v1/financial_entries?id=not.is.null`, {
        method: 'DELETE',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      if (!delRes.ok) {
        console.error('Failed to delete:', await delRes.text());
      } else {
        console.log('Deleted all successfully.');
      }
    }
  } catch (error) {
    console.error('Network Error or Configuration Failure:', error.message);
  }
}

run();
