export async function scrapeEmailFromUrl(url: string, timeoutMs = 15000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Basic URL validation and formatting
    let fetchUrl = url.trim();
    if (!fetchUrl.startsWith('http://') && !fetchUrl.startsWith('https://')) {
      fetchUrl = 'https://' + fetchUrl;
    }

    // Attempt to fetch the URL content
    const response = await fetch(fetchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Failed to fetch ${fetchUrl}: ${response.status} ${response.statusText}`);
      return null;
    }

    const text = await response.text();
    
    // Extract emails using a robust regex
    const emails = scrapeEmailsFromText(text);
    
    // Filter out common false positives and image extensions
    const validEmails = emails.filter(e => {
      const lower = e.toLowerCase();
      return (
        !lower.endsWith('.png') && 
        !lower.endsWith('.jpg') && 
        !lower.endsWith('.jpeg') && 
        !lower.endsWith('.gif') &&
        !lower.endsWith('.svg') &&
        !lower.endsWith('.webp') &&
        !lower.endsWith('sentry.io') &&
        !lower.includes('example.com') &&
        !lower.includes('w3.org')
      );
    });

    return validEmails.length > 0 ? validEmails[0] : null;

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn(`Scraping timed out for URL: ${url}`);
    } else {
      console.error(`Error scraping URL ${url}:`, error.message || error);
    }
    return null;
  }
}

export function scrapeEmailsFromText(text: string): string[] {
  if (!text) return [];
  // Advanced regex for email extraction including obfuscated forms
  // e.g., name@domain.com, name [at] domain [dot] com, name(at)domain.com
  const emailRegex = /\b([a-zA-Z0-9._%+-]+(?:\s*(?:\[at\]|\(at\)|@)\s*)[a-zA-Z0-9.-]+(?:\s*(?:\[dot\]|\(dot\)|\.)\s*)[a-zA-Z]{2,6})\b/gi;
  const matches = text.match(emailRegex);
  if (!matches) return [];
  
  // Clean up obfuscated emails
  const cleaned = matches.map(m => {
    return m
      .replace(/\s*(?:\[at\]|\(at\))\s*/gi, '@')
      .replace(/\s*(?:\[dot\]|\(dot\))\s*/gi, '.')
      .replace(/\s+/g, '');
  });
  
  // Deduplicate and return
  return Array.from(new Set(cleaned));
}
