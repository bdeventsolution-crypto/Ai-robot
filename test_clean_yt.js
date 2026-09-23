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

async function getCleanYouTubeVideos(query) {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const html = await fetch(url, { 'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+478' });
    
    // Extract ytInitialData
    const match = html.match(/var ytInitialData = ({.+?});<\/script>/s);
    if (!match) return [];
    
    const data = JSON.parse(match[1]);
    const items = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
    
    const videos = [];
    for (const item of items) {
        const vr = item.videoRenderer;
        if (!vr) continue;
        const id = vr.videoId;
        const title = vr.title?.runs?.map(r => r.text).join('') || '';
        const channel = vr.ownerText?.runs?.map(r => r.text).join('') || '';
        const desc = vr.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map(r => r.text).join('') || '';
        if (title && id) {
            videos.push({ id, title, channel, desc, url: `https://www.youtube.com/watch?v=${id}` });
        }
    }
    return videos;
}

getCleanYouTubeVideos('Gold XAUUSD SMC Liquidity Trading').then(v => {
    console.log(`Extracted ${v.length} YouTube videos cleanly:`);
    v.slice(0, 5).forEach((item, i) => {
        console.log(`\n${i+1}. [${item.channel}] ${item.title}`);
        if (item.desc) console.log(`   Desc: ${item.desc}`);
    });
});
