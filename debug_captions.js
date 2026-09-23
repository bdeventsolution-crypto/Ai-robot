const https = require('https');

async function debugCaptionUrl() {
    https.get('https://www.youtube.com/watch?v=7HD5ZG2MmeQ', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+478'
        }
    }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
            const match = d.match(/captionTracks":\[(.*?)\]/);
            if (match) {
                const tracks = JSON.parse(`[${match[1]}]`);
                const track = tracks[0];
                console.log('Track URL:', track.baseUrl);
                https.get(track.baseUrl, res2 => {
                    let xml = '';
                    res2.on('data', c => xml += c);
                    res2.on('end', () => {
                        console.log('Status code:', res2.statusCode);
                        console.log('XML Raw length:', xml.length);
                        console.log('XML Snippet:', xml.slice(0, 400));
                    });
                });
            }
        });
    });
}

debugCaptionUrl();
