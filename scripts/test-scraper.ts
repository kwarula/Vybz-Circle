
import { config } from "dotenv";
import path from "path";

// Load env vars FIRST
config({ path: path.resolve(__dirname, "../.env") });

import { extractPlatformEvents } from "../server/scraper/firecrawl";
import { PLATFORM_CONFIGS } from "../shared/scraperSchema";

async function main() {
    console.log("🧪 Testing Scraper for TicketSasa...");
    console.log("🔑 API Key configured:", !!process.env.FIRECRAWL_API_KEY);

    try {
        const platform = PLATFORM_CONFIGS.ticketsasa;
        console.log(`🎯 Target URL: ${platform.baseUrl}${platform.eventsPath}`);

        const result = await extractPlatformEvents(platform);

        console.log("\n📊 Result:");
        console.log(JSON.stringify(result, null, 2));

    } catch (error) {
        console.error("\n❌ Error:", error);
    }
}

main();
