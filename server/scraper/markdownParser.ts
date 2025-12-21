/**
 * Simple Markdown Parser for TicketSasa Events
 * Parses Firecrawl markdown output to extract events
 */

export interface ParsedEvent {
    title: string;
    date?: string;
    time?: string;
    venue?: string;
    price?: string;
    ticketUrl?: string;
    imageUrl?: string;
}

/**
 * Parse TicketSasa markdown to extract events
 */
export function parseTicketSasaMarkdown(markdown: string, baseUrl: string): ParsedEvent[] {
    const events: ParsedEvent[] = [];

    // Split by date patterns (e.g., "SUN 21 DEC 2025 11:00 AM")
    const datePattern = /([A-Z]{3}\s+\d{1,2}\s+[A-Z]{3}\s+\d{4}\s+\d{1,2}:\d{2}\s+[AP]M)/g;
    const sections = markdown.split(datePattern);

    // Process sections in pairs (date, content)
    for (let i = 1; i < sections.length; i += 2) {
        const dateTime = sections[i];
        const content = sections[i + 1] || '';

        // Extract title from markdown link [Title](url)
        const titleMatch = content.match(/\[([^\]]+)\]\(([^)]+)\s*"[^"]*"\)/);
        if (!titleMatch) continue;

        const title = titleMatch[1];
        const relativeUrl = titleMatch[2];
        const ticketUrl = relativeUrl.startsWith('http') ? relativeUrl : `${baseUrl}${relativeUrl}`;

        // Extract venue (text after the closing paren ")" of the title link, before price)
        const venueMatch = content.match(/\)\s+([^\n]+?)(?:\s+Starting|\s+FREE|$)/);
        const venue = venueMatch ? venueMatch[1].trim() : undefined;

        // Extract price
        const priceMatch = content.match(/(Starting\s+KES\s+[\d,]+|FREE)/i);
        const price = priceMatch ? priceMatch[0] : undefined;

        // Extract image URL
        const imageMatch = content.match(/!\[\]\(([^)]+)\)/);
        const imageUrl = imageMatch ? imageMatch[1] : undefined;

        // Parse date and time
        const dateMatch = dateTime.match(/([A-Z]{3}\s+\d{1,2}\s+[A-Z]{3}\s+\d{4})/);
        const timeMatch = dateTime.match(/(\d{1,2}:\d{2}\s+[AP]M)/);

        events.push({
            title,
            date: dateMatch ? dateMatch[1] : undefined,
            time: timeMatch ? timeMatch[1] : undefined,
            venue,
            price,
            ticketUrl,
            imageUrl: imageUrl?.startsWith('http') ? imageUrl : imageUrl ? `${baseUrl}${imageUrl}` : undefined
        });
    }

    return events;
}
