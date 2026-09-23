const https = require('https');

async function testTranscript(videoId) {
    return new Promise((resolve) => {
        https.get(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+478'
            }
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const match = data.match(/captionTracks":\[(.*?)\]/);
                if (!match) {
                    console.log(`[${videoId}] No captionTracks found directly.`);
                    resolve(null);
                    return;
                }
                const tracks = JSON.parse(`[${match[1]}]`);
                console.log(`[${videoId}] Found ${tracks.length} caption track(s):`, tracks.map(t => t.languageCode));
                const track = tracks.find(t => t.languageCode === 'en') || tracks[0];
                if (track && track.baseUrl) {
                    https.get(track.baseUrl, res2 => {
                        let xml = '';
                        res2.on('data', c => xml += c);
                        res2.on('end', () => {
                            const texts = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map(m => m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#39;/g, "'"));
                            const full = texts.join(' ');
                            console.log(`[${videoId}] Transcript length: ${full.length} chars!`);
                            console.log(`Sample: ${full.slice(0, 200)}...`);
                            resolve(full);
                        });
                    }).on('error', () => resolve(null));
                } else {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

testTranscript('7HD5ZG2MmeQ');
