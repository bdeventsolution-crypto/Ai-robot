const https = require('https');

function fetch(url, headers = {}) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                ...headers
            },
            timeout: 10000
        }, res => {
            let data = '';
            if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
                return fetch(res.headers.location, headers).then(resolve).catch(reject);
            }
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function studyYouTube(topic) {
    try {
        const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`;
        const html = await fetch(url, { 'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+478' });
        
        // Match video IDs, titles and descriptions from initial data
        const matches = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})".*?"title":{"runs":\[{"text":"(.*?)"}\]}.*?"ownerText":{"runs":\[{"text":"(.*?)"}\]}/g)];
        
        const videos = [];
        const seen = new Set();
        for (const m of matches) {
            const id = m[1], title = m[2], channel = m[3];
            if (!seen.has(id)) {
                seen.add(id);
                videos.push({ id, title, channel, url: `https://www.youtube.com/watch?v=${id}` });
            }
            if (videos.length >= 5) break;
        }
        return videos;
    } catch(e) {
        console.error('YouTube study error:', e.message);
        return [];
    }
}

async function studyFeeds() {
    const feeds = [
        { name: 'FXStreet Live', url: 'https://www.fxstreet.com/rss/news' },
        { name: 'Yahoo Gold RSS', url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=GC=F' },
        { name: 'Yahoo DXY RSS', url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=DX-Y.NYB' }
    ];
    const results = [];
    for (const f of feeds) {
        try {
            const xml = await fetch(f.url);
            const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
            for (const it of items.slice(0, 5)) {
                const titleMatch = it[1].match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
                const descMatch = it[1].match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/);
                const title = titleMatch ? (titleMatch[1] || titleMatch[2]).trim() : '';
                const desc = descMatch ? (descMatch[1] || descMatch[2]).replace(/<[^>]+>/g, '').trim() : '';
                if (title) results.push({ source: f.name, title, desc });
            }
        } catch(e) {}
    }
    return results;
}

async function run() {
    console.log('--- Testing YouTube Study ---');
    const vids = await studyYouTube('XAUUSD Gold SMC Liquidity Wyckoff strategy');
    console.log(`Found ${vids.length} YouTube videos:`);
    vids.forEach(v => console.log(`  🎥 [${v.channel}] ${v.title}`));

    console.log('\n--- Testing Web Feeds Study ---');
    const articles = await studyFeeds();
    console.log(`Found ${articles.length} Web articles:`);
    articles.slice(0, 4).forEach(a => console.log(`  📰 [${a.source}] ${a.title}`));
}

run();
