
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testRoute(path: string, method = 'GET', token?: string) {
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    console.log(`Testing ${method} ${path} ${token ? '(with token)' : '(no token)'}...`);
    const res = await fetch(`${BASE_URL}${path}`, { method, headers });
    console.log(`Result: ${res.status} ${res.statusText}`);
    try {
        const data = await res.json();
        console.log('Body:', JSON.stringify(data).slice(0, 100) + (JSON.stringify(data).length > 100 ? '...' : ''));
    } catch {
        console.log('No JSON body');
    }
    console.log('---');
}

async function runTests() {
    console.log('Starting API Security Tests...\n');

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

    // 6. Public Events (Should still work)
    await testRoute('/api/events');

    console.log('\nTests completed. Verification of 401/403 for protected routes is successful if status code matches.');
}

runTests().catch(console.error);
