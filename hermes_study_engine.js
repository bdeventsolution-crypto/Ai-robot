// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║   HERMES AI — AUTONOMOUS YOUTUBE & WEB SELF-STUDY ENGINE v5.0              ║
// ║   Commander: Omar Sharif Shuvo | Co-Pilot: Arham                           ║
// ║   Live YouTube Crawler + FXStreet + Yahoo RSS + Investing.com              ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const BRAIN_FILE  = path.join(__dirname, 'hermes_learned_brain.json');
const STUDY_INTERVAL_MS = 15 * 60 * 1000; // Auto-runs every 15 minutes

// ──────────────────────────────────────────────────────────────────────────────
// ROBUST HTTP/HTTPS FETCHER
// ──────────────────────────────────────────────────────────────────────────────
function fetch(urlStr, headers = {}) {
    return new Promise((resolve, reject) => {
        const lib = urlStr.startsWith('https') ? https : http;
        const defaultHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9'
        };
        const req = lib.get(urlStr, { headers: { ...defaultHeaders, ...headers }, timeout: 12000 }, res => {
            let data = '';
            if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
                return fetch(res.headers.location, headers).then(resolve).catch(reject);
            }
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Fetch timeout')); });
    });
}

// ──────────────────────────────────────────────────────────────────────────────
// 1. YOUTUBE CRAWLER & STUDY ENGINE
// ──────────────────────────────────────────────────────────────────────────────
const YOUTUBE_SEARCH_TOPICS = [
    'Gold XAUUSD SMC Liquidity Wyckoff Trading',
    'Gold Price Analysis Today Forecast 2026',
    'XAUUSD Order Flow CVD Fair Value Gap Strategy',
    'DXY Dollar Index Gold Correlation Setup',
    'Gold Scalping Strategy M15 Liquidity Sweep',
    'Smart Money Concepts Gold Supply Demand'
];

async function studyYouTubeTopic(topic) {
    try {
        const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(topic)}`;
        const html = await fetch(url, { 'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+478' });
        
        const match = html.match(/var ytInitialData = ({.+?});<\/script>/s);
        if (!match) return [];
        
        const data = JSON.parse(match[1]);
        const items = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];
        
        const videos = [];
        for (const item of items) {
            const vr = item.videoRenderer;
            if (!vr || !vr.videoId) continue;
            const id = vr.videoId;
            const title = vr.title?.runs?.map(r => r.text).join('') || '';
            const channel = vr.ownerText?.runs?.map(r => r.text).join('') || '';
            const desc = vr.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map(r => r.text).join('') || '';
            if (title && id) {
                videos.push({
                    id,
                    title,
                    channel,
                    desc,
                    url: `https://www.youtube.com/watch?v=${id}`,
                    source: `YouTube: ${channel}`,
                    topic
                });
            }
            if (videos.length >= 8) break;
        }
        return videos;
    } catch(e) {
        console.error(`[STUDY 📺] YouTube search error on "${topic}":`, e.message);
        return [];
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. FINANCIAL WEB NEWS & RSS STUDY ENGINE
// ──────────────────────────────────────────────────────────────────────────────
const RSS_FEEDS = [
    { name: 'FXStreet Live Gold & FX', url: 'https://www.fxstreet.com/rss/news' },
    { name: 'Yahoo Finance Gold (GC=F)', url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=GC=F' },
    { name: 'Yahoo Finance DXY (DX-Y.NYB)', url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=DX-Y.NYB' },
    { name: 'Investing.com Global Markets', url: 'https://www.investing.com/rss/news_1.rss' }
];

async function studyWebFeeds() {
    const articles = [];
    for (const feed of RSS_FEEDS) {
        try {
            const xml = await fetch(feed.url);
            const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
            for (const it of items.slice(0, 10)) {
                const titleMatch = it[1].match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
                const descMatch = it[1].match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/);
                const pubDateMatch = it[1].match(/<pubDate>(.*?)<\/pubDate>/);

                const title = titleMatch ? (titleMatch[1] || titleMatch[2]).trim() : '';
                const desc = descMatch ? (descMatch[1] || descMatch[2]).replace(/<[^>]+>/g, '').trim() : '';
                const date = pubDateMatch ? pubDateMatch[1] : new Date().toISOString();

                if (title && (title.toLowerCase().includes('gold') || 
                              title.toLowerCase().includes('dollar') || 
                              title.toLowerCase().includes('fed') || 
                              title.toLowerCase().includes('xau') ||
                              title.toLowerCase().includes('pmi') ||
                              title.toLowerCase().includes('rate'))) {
                    articles.push({
                        title,
                        desc,
                        date,
                        source: feed.name
                    });
                }
            }
        } catch(e) {
            console.error(`[STUDY 🌐] Error fetching ${feed.name}:`, e.message);
        }
    }
    return articles;
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. INSIGHT EXTRACTION & SYNTHESIS
// ──────────────────────────────────────────────────────────────────────────────
function extractTradingInsights(items) {
    const insights = [];
    const keywords = ['gold', 'xau', 'dollar', 'dxy', 'fed', 'rate', 'support', 'resistance', 'liquidity', 'smc', 'wyckoff', 'sweep', 'bullish', 'bearish', 'pmi', 'inflation'];
    
    for (const item of items) {
        const text = `${item.title}. ${item.desc || ''}`;
        const lower = text.toLowerCase();
        const matched = keywords.filter(k => lower.includes(k));
        
        if (matched.length >= 2) {
            insights.push({
                text: item.title,
                details: item.desc ? item.desc.slice(0, 200) : '',
                source: item.source || item.channel || 'Web Intelligence',
                url: item.url || '',
                keywords: matched,
                timestamp: new Date().toISOString()
            });
        }
    }
    return insights;
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. PERSISTENT BRAIN MEMORY MANAGEMENT
// ──────────────────────────────────────────────────────────────────────────────
function loadBrain() {
    try {
        if (fs.existsSync(BRAIN_FILE)) {
            const parsed = JSON.parse(fs.readFileSync(BRAIN_FILE, 'utf8'));
            return {
                learnedInsights: parsed.learnedInsights || parsed.learned || [],
                studiedVideos: parsed.studiedVideos || [],
                studiedArticles: parsed.studiedArticles || [],
                studyCycles: parsed.studyCycles || 0,
                lastStudyTime: parsed.lastStudyTime || parsed.lastStudy || null
            };
        }
    } catch(e) {}
    return {
        learnedInsights: [],
        studiedVideos: [],
        studiedArticles: [],
        studyCycles: 0,
        lastStudyTime: null
    };
}

function saveBrain(brain) {
    try {
        fs.writeFileSync(BRAIN_FILE, JSON.stringify(brain, null, 2), 'utf8');
    } catch(e) {
        console.error('[STUDY] Save error:', e.message);
    }
}

let brainData = loadBrain();

// ──────────────────────────────────────────────────────────────────────────────
// 5. MASTER STUDY RUNNER
// ──────────────────────────────────────────────────────────────────────────────
let isRunning = false;

async function runMasterStudyCycle() {
    if (isRunning) return { status: 'already_running' };
    isRunning = true;
    const startTime = new Date();
    console.log(`\n🎓 [HERMES STUDY ENGINE] Cycle #${(brainData.studyCycles || 0) + 1} initiated at ${startTime.toISOString()}`);

    try {
        if (!brainData.learnedInsights) brainData.learnedInsights = [];
        if (!brainData.studiedVideos) brainData.studiedVideos = [];
        if (!brainData.studiedArticles) brainData.studiedArticles = [];

        // Step 1: Study YouTube
        const ytTopic = YOUTUBE_SEARCH_TOPICS[Math.floor(Math.random() * YOUTUBE_SEARCH_TOPICS.length)];
        console.log(`[STUDY 📺] Scraping YouTube for: "${ytTopic}"...`);
        const ytVideos = await studyYouTubeTopic(ytTopic);
        console.log(`[STUDY 📺] Found ${ytVideos.length} trading videos from YouTube.`);

        // Step 2: Study Web RSS
        console.log(`[STUDY 🌐] Scraping FXStreet, Yahoo Finance & Investing.com RSS...`);
        const webArticles = await studyWebFeeds();
        console.log(`[STUDY 🌐] Found ${webArticles.length} relevant Gold & Macro news articles.`);

        // Step 3: Extract insights
        const ytInsights = extractTradingInsights(ytVideos);
        const webInsights = extractTradingInsights(webArticles);
        const allNewInsights = [...ytInsights, ...webInsights];

        // Deduplicate insights
        const existingTexts = new Set(brainData.learnedInsights.map(i => (i.text || '').toLowerCase()));
        let addedCount = 0;
        for (const ins of allNewInsights) {
            if (!existingTexts.has((ins.text || '').toLowerCase())) {
                existingTexts.add((ins.text || '').toLowerCase());
                brainData.learnedInsights.unshift(ins);
                addedCount++;
            }
        }

        // Keep maximum 400 top insights in memory
        if (brainData.learnedInsights.length > 400) {
            brainData.learnedInsights = brainData.learnedInsights.slice(0, 400);
        }

        // Store latest studied videos & articles
        brainData.studiedVideos = ytVideos.slice(0, 8);
        brainData.studiedArticles = webArticles.slice(0, 10);
        brainData.studyCycles++;
        brainData.lastStudyTime = startTime.toISOString();

        saveBrain(brainData);
        console.log(`🎓 [HERMES STUDY ✅] Completed! Added ${addedCount} new insights. Total in Brain: ${brainData.learnedInsights.length}\n`);

        isRunning = false;
        return {
            status: 'success',
            addedInsights: addedCount,
            totalInsights: brainData.learnedInsights.length,
            youtubeVideos: ytVideos.length,
            webArticles: webArticles.length,
            studyCycles: brainData.studyCycles
        };
    } catch(err) {
        console.error('[STUDY ❌] Master cycle failed:', err.message);
        isRunning = false;
        return { status: 'error', message: err.message };
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. SEARCH RELEVANT KNOWLEDGE FOR USER QUERIES
// ──────────────────────────────────────────────────────────────────────────────
function searchBrainKnowledge(query, limit = 4) {
    const q = (query || '').toLowerCase();
    const insights = brainData.learnedInsights || [];
    const scored = insights.map(item => {
        let score = 0;
        const text = (item.text + ' ' + (item.details || '')).toLowerCase();
        q.split(/\s+/).forEach(word => {
            if (word.length > 3 && text.includes(word)) score += 2;
        });
        (item.keywords || []).forEach(kw => {
            if (q.includes(kw)) score += 3;
        });
        return { ...item, score };
    }).filter(i => i.score > 0);

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
}

module.exports = {
    startStudyDaemon: () => {
        console.log(`\n🎓 [HERMES STUDY ENGINE] Auto-Study Daemon Armed (Every 15 mins)`);
        console.log(`📚 Sources: YouTube Search + FXStreet Live + Yahoo Finance Gold/DXY + Investing.com`);
        setTimeout(runMasterStudyCycle, 3000);
        setInterval(runMasterStudyCycle, STUDY_INTERVAL_MS);
    },
    runStudyNow: runMasterStudyCycle,
    getStudyStatus: () => ({
        isStudying: isRunning,
        lastStudyTime: brainData.lastStudyTime,
        totalInsights: (brainData.learnedInsights || []).length,
        studyCycles: brainData.studyCycles || 0,
        recentVideos: (brainData.studiedVideos || []).slice(0, 4),
        recentArticles: (brainData.studiedArticles || []).slice(0, 4),
        recentInsights: (brainData.learnedInsights || []).slice(0, 6)
    }),
    getAllInsights: () => (brainData.learnedInsights || []),
    searchBrainKnowledge
};
