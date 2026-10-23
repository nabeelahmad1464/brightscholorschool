const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../server_database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const GLOBAL_CLOUD_ENDPOINT_1 = 'https://api.restful-api.dev/objects/ff808181a09d98f701a10b8b7b9a7c36';
const GLOBAL_CLOUD_ENDPOINT_2 = 'https://extendsclass.com/api/json-storage/bin/bbedaaf';

async function push() {
  console.log('Pushing 51 students to cloud endpoints...');
  try {
    const res1 = await fetch(GLOBAL_CLOUD_ENDPOINT_1, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'BSS_DATA',
        data: db
      })
    });
    console.log('Endpoint 1 status:', res1.status);
  } catch (e) {
    console.error('Endpoint 1 error:', e.message);
  }

  try {
    const res2 = await fetch(GLOBAL_CLOUD_ENDPOINT_2, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(db)
    });
    console.log('Endpoint 2 status:', res2.status);
  } catch (e) {
    console.error('Endpoint 2 error:', e.message);
  }

  console.log('Cloud sync complete!');
}

push();
