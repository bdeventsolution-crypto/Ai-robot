const https = require('https');

// Test YouTube search via Google Videos / YouTube video search
async function testYouTubeSearch() {
    const query = 'XAUUSD Gold SMC liquidity trading 2026';
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    
    return new Promise((resolve) => {
        https.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+478'
            }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                // Find all video IDs
                const ids = [...data.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map(m => m[1]);
                const uniqueIds = [...new Set(ids)];
                console.log(`YouTube Search returned ${uniqueIds.length} video IDs:`, uniqueIds.slice(0, 5));
                
                // Also find titles
                const titleMatches = [...data.matchAll(/"title":{"runs":\[{"text":"(.*?)"}\]/g)].map(m => m[1]);
                console.log('Sample Titles:', titleMatches.slice(0, 5));
                resolve(uniqueIds);
            });
        }).on('error', e => {
            console.error('Error:', e.message);
            resolve([]);
        });
    });
}

testYouTubeSearch();
