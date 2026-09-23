const https = require('https');

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
            });
        }).on('error', reject);
    });
}

async function getBenchmarks() {
    try {
        const json = await fetchJson('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=5d');
        const r = json.chart.result[0];
        const meta = r.meta;
        const q = r.indicators.quote[0];
        const n = r.timestamp.length;

        // Current & Previous day bars
        const currentPrice = meta.regularMarketPrice;
        const yesterdayClose = meta.chartPreviousClose || meta.previousClose || q.close[n-2];
        const todayOpen = q.open[n-1] || yesterdayClose;
        const pdh = q.high[n-2]; // Previous Day High
        const pdl = q.low[n-2];  // Previous Day Low
        const pdMid = (pdh + pdl) / 2; // Previous Day Equilibrium

        console.log('=== BENCHMARK LEVELS ===');
        console.log('Current Gold Price:', currentPrice.toFixed(2));
        console.log('Yesterday NY Close:', yesterdayClose.toFixed(2));
        console.log('Today Open:', todayOpen.toFixed(2));
        console.log('Previous Day High (PDH / BSL):', pdh.toFixed(2));
        console.log('Previous Day Low (PDL / SSL):', pdl.toFixed(2));
        console.log('Previous Day Equilibrium (50%):', pdMid.toFixed(2));
        console.log('Distance from NY Close:', (currentPrice - yesterdayClose).toFixed(2), 'pts');
        console.log('Status vs Daily Open:', currentPrice >= todayOpen ? 'PREMIUM (Above Open)' : 'DISCOUNT (Below Open)');
    } catch(e) {
        console.error('Error:', e.message);
    }
}

getBenchmarks();
