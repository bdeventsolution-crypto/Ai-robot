const https = require('https');

async function testFeeds() {
    const feeds = [
        { name: 'FXStreet Gold News', url: 'https://www.fxstreet.com/rss/news' },
        { name: 'Investing.com News', url: 'https://www.investing.com/rss/news_1.rss' },
        { name: 'Yahoo Gold RSS', url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=GC=F' },
        { name: 'Yahoo DXY RSS', url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=DX-Y.NYB' }
    ];

    for (const f of feeds) {
        try {
            const data = await new Promise((resolve, reject) => {
                https.get(f.url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
                    let d = '';
                    res.on('data', c => d += c);
                    res.on('end', () => resolve(d));
                }).on('error', reject);
            });
            const items = [...data.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
            console.log(`[${f.name}] Found ${items.length} news items`);
            for (const item of items.slice(0, 2)) {
                const titleMatch = item[1].match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
                const descMatch = item[1].match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/);
                const title = titleMatch ? (titleMatch[1] || titleMatch[2]) : '';
                const desc = descMatch ? (descMatch[1] || descMatch[2]) : '';
                console.log(`  • ${title.trim().slice(0, 80)}`);
                if (desc) console.log(`    ${desc.replace(/<[^>]+>/g, '').trim().slice(0, 100)}...`);
            }
        } catch(e) {
            console.error(`[${f.name}] Error:`, e.message);
        }
    }
}

testFeeds();
