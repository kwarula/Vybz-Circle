
async function testRoute(path, method = 'GET', token) {
    const BASE_URL = 'http://127.0.0.1:5000';
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    console.log(`Testing ${method} ${path} ${token ? '(with token)' : '(no token)'}...`);
    try {
        const res = await fetch(`${BASE_URL}${path}`, { method, headers });
        console.log(`Result: ${res.status} ${res.statusText}`);
        const data = await res.json();
        console.log('Body:', JSON.stringify(data).slice(0, 100) + (JSON.stringify(data).length > 100 ? '...' : ''));
    } catch (error) {
        console.log('Error/Response check failed:', error.message);
    }
    console.log('---');
}

async function runTests() {
    console.log('Starting API Security Tests (JS Re-run)...\n');

    // 1. Admin Stats (Protected)
    await testRoute('/api/admin/stats');

    // 2. Admin Events (Protected)
    await testRoute('/api/admin/events');

    // 3. Scraper Run (Admin Protected)
    await testRoute('/api/scraper/run', 'POST');

    // 4. Scraper Status (Admin Protected)
    await testRoute('/api/scraper/status');

    // 5. User Tickets (Protected)
    await testRoute('/api/users/some-uuid/tickets');

    // 6. Spotify Recommendations (Protected)
    await testRoute('/api/spotify/recommendations?userId=some-uuid');

    // 7. Public Events (Should still work)
    await testRoute('/api/events');

    console.log('\nTesting CORS Preflight (OPTIONS)...');
    try {
        const res = await fetch('http://127.0.0.1:5000/api/events', {
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:8081',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Authorization'
            }
        });
        console.log(`Result: ${res.status} ${res.statusText}`);
        console.log(`Allow-Origin: ${res.headers.get('access-control-allow-origin')}`);
        console.log(`Allow-Headers: ${res.headers.get('access-control-allow-headers')}`);
    } catch (e) {
        console.log('CORS preflight check failed:', e.message);
    }

    console.log('\nTests completed.');
}

runTests().catch(console.error);
