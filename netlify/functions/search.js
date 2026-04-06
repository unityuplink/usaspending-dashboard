const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  return new Promise((resolve) => {
    const body = event.body || JSON.stringify({
      filters: { time_period: [{ start_date: '2024-10-01', end_date: '2025-09-30' }] },
      fields: ['Award ID', 'Recipient Name', 'Award Amount', 'Awarding Agency', 'Award Type', 'Description', 'Start Date'],
      sort: 'Award Amount', order: 'desc', limit: 25, page: 1
    });

    const options = {
      hostname: 'api.usaspending.gov',
      path: '/api/v2/search/spending_by_award/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        console.log('RESPONSE PREVIEW:', data.slice(0, 500));
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(parsed)
          });
        } catch(e) {
          resolve({
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Parse error', raw: data.slice(0, 500) })
          });
        }
      });
    });

    req.on('error', (e) => {
      console.log('REQUEST ERROR:', e.message);
      resolve({
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: e.message })
      });
    });

    req.write(body);
    req.end();
  });
};
