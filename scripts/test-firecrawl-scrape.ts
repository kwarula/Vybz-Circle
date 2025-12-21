/**
 * Test Firecrawl Scrape (not extract) to see raw content
 */

import { config } from 'dotenv';
config();

const FIRECRAWL_API_URL = "https://api.firecrawl.dev/v1";
const apiKey = process.env.FIRECRAWL_API_KEY;

async function testScrape() {
    console.log('🧪 Testing Firecrawl Scrape API...');
    console.log(`🔑 API Key: ${apiKey?.substring(0, 10)}...`);

    const response = await fetch(`${FIRECRAWL_API_URL}/scrape`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            url: 'https://ticketsasa.com/events',
            formats: ['markdown', 'html']
        })
    });

    const data = await response.json();
    console.log('\n📊 Response Status:', response.status);
    console.log('📦 Response Keys:', Object.keys(data));

    if (data.success && data.data) {
        const markdown = data.data.markdown || '';
        const html = data.data.html || '';

        console.log('\n📝 Markdown length:', markdown.length);
        console.log('📝 HTML length:', html.length);
        console.log('\n🔍 First 500 chars of markdown:');
        console.log(markdown.substring(0, 500));

        // Look for event patterns
        const eventMatches = markdown.match(/\d{1,2}\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+\d{4}/gi);
        console.log('\n📅 Found date patterns:', eventMatches?.length || 0);
        if (eventMatches) {
            console.log('Sample dates:', eventMatches.slice(0, 5));
        }
    } else {
        console.log('\n❌ Error:', data);
    }
}

testScrape().catch(console.error);
