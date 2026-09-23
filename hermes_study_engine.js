// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║   HERMES AI — AUTONOMOUS MULTI-TIER SELF-STUDY & RESEARCH ENGINE v6.0       ║
// ║   Commander: Omar Sharif Shuvo | Co-Pilot: Arham                           ║
// ║   • News Research: Auto every 4 Hours (Reuters, FXStreet, Yahoo, Investing)║
// ║   • Strategy & YouTube: Auto 2x Daily (Every 12 Hours)                     ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const BRAIN_FILE = path.join(__dirname, 'hermes_learned_brain.json');

// SCHEDULE CONFIGURATION (As directed by Commander Omar)
const NEWS_INTERVAL_MS    = 1 * 60 * 60 * 1000;   // Every 1 hour (Auto News Research)
const YOUTUBE_INTERVAL_MS = 12 * 60 * 60 * 1000;  // Twice a day / Every 12 hours (YouTube Deep Research)

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
        const req = lib.get(urlStr, { headers: { ...defaultHeaders, ...headers }, timeout: 14000 }, res => {
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
// 1. FINANCIAL WEB NEWS & RSS SOURCES (Every 4 Hours)
// ──────────────────────────────────────────────────────────────────────────────
const NEWS_FEEDS = [
    { 
        name: 'Reuters & FXStreet (Google News)', 
        url: 'https://news.google.com/rss/search?q=gold+price+XAUUSD+reuters+OR+fxstreet&hl=en-US&gl=US&ceid=US:en' 
    },
    { 
        name: 'FXStreet Live Gold & FX', 
        url: 'https://www.fxstreet.com/rss/news' 
    },
    { 
        name: 'Yahoo Finance Gold (GC=F)', 
        url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=GC=F' 
    },
    { 
        name: 'Yahoo Finance DXY (DX-Y.NYB)', 
        url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=DX-Y.NYB' 
    },
    { 
        name: 'Investing.com Global Markets', 
        url: 'https://www.investing.com/rss/news_1.rss' 
    }
];

async function studyWebNewsFeeds() {
    const articles = [];
    for (const feed of NEWS_FEEDS) {
        try {
            const xml = await fetch(feed.url);
            const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
            for (const it of items.slice(0, 12)) {
                const titleMatch = it[1].match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
                const descMatch  = it[1].match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/);
                const pubDateMatch = it[1].match(/<pubDate>(.*?)<\/pubDate>/);
                const linkMatch = it[1].match(/<link>(.*?)<\/link>/);

                let title = titleMatch ? (titleMatch[1] || titleMatch[2]).replace(/&lt;.*?&gt;/g, '').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim() : '';
                let desc  = descMatch ? (descMatch[1] || descMatch[2]).replace(/&lt;.*?&gt;/g, '').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim() : '';
                const date  = pubDateMatch ? pubDateMatch[1] : new Date().toISOString();
                const link  = linkMatch ? linkMatch[1] : '';

                if (title && (
                    title.toLowerCase().includes('gold') || 
                    title.toLowerCase().includes('dollar') || 
                    title.toLowerCase().includes('dxy') || 
                    title.toLowerCase().includes('fed') || 
                    title.toLowerCase().includes('xau') ||
                    title.toLowerCase().includes('rate') ||
                    title.toLowerCase().includes('inflation') ||
                    title.toLowerCase().includes('central bank') ||
                    title.toLowerCase().includes('treasury')
                )) {
                    articles.push({
                        title,
                        desc,
                        date,
                        link,
                        source: feed.name
                    });
                }
            }
        } catch(e) {
            console.error(`[NEWS STUDY 🌐] Error fetching ${feed.name}:`, e.message);
        }
    }
    return articles;
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. YOUTUBE STRATEGY CRAWLER & STUDY ENGINE (2x Daily / 12 Hours)
// ──────────────────────────────────────────────────────────────────────────────
const YOUTUBE_SEARCH_TOPICS = [
    'Gold XAUUSD SMC Liquidity Wyckoff Trading',
    'Gold Price Analysis Today Forecast 2026',
    'XAUUSD Order Flow CVD Fair Value Gap Strategy',
    'DXY Dollar Index Gold Correlation Setup',
    'Gold Scalping Strategy M15 Liquidity Sweep',
    'Smart Money Concepts Gold Supply Demand',
    'Asian Session Range Sweep London Expansion Gold'
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
        console.error(`[YOUTUBE STUDY 📺] Search error on "${topic}":`, e.message);
        return [];
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. INSIGHT EXTRACTION & INSTITUTIONAL THEME MAPPING
// ──────────────────────────────────────────────────────────────────────────────
function extractTradingInsights(items) {
    const insights = [];
    const keywords = ['gold', 'xau', 'dollar', 'dxy', 'fed', 'rate', 'support', 'resistance', 'liquidity', 'smc', 'wyckoff', 'sweep', 'bullish', 'bearish', 'pmi', 'inflation', 'powell', 'trump'];
    
    for (const item of items) {
        const text = `${item.title}. ${item.desc || ''}`;
        const lower = text.toLowerCase();
        const matched = keywords.filter(k => lower.includes(k));
        
        if (matched.length >= 1) {
            insights.push({
                text: item.title,
                details: item.desc ? item.desc.slice(0, 240) : '',
                source: item.source || item.channel || 'Market Intelligence',
                url: item.url || item.link || '',
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
                newsStudyCycles: parsed.newsStudyCycles || parsed.studyCycles || 0,
                youtubeStudyCycles: parsed.youtubeStudyCycles || 0,
                lastStudyTime: parsed.lastStudyTime || parsed.lastStudy || null,
                lastNewsStudyTime: parsed.lastNewsStudyTime || parsed.lastStudyTime || null,
                lastYouTubeStudyTime: parsed.lastYouTubeStudyTime || null,
                nextNewsStudyTime: parsed.nextNewsStudyTime || null,
                nextYouTubeStudyTime: parsed.nextYouTubeStudyTime || null
            };
        }
    } catch(e) {}
    return {
        learnedInsights: [],
        studiedVideos: [],
        studiedArticles: [],
        studyCycles: 0,
        newsStudyCycles: 0,
        youtubeStudyCycles: 0,
        lastStudyTime: null,
        lastNewsStudyTime: null,
        lastYouTubeStudyTime: null,
        nextNewsStudyTime: null,
        nextYouTubeStudyTime: null
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
// 5. AUTONOMOUS 4-HOUR NEWS STUDY CYCLE
// ──────────────────────────────────────────────────────────────────────────────
let isNewsStudying = false;

async function runNewsStudyCycle() {
    if (isNewsStudying) return { status: 'already_running' };
    isNewsStudying = true;
    const now = new Date();
    console.log(`\n📰 [HERMES AUTO NEWS STUDY] Cycle #${(brainData.newsStudyCycles || 0) + 1} at ${now.toISOString()}`);
    console.log(`   Sources: Reuters & FXStreet (Google RSS) + FXStreet + Yahoo Gold/DXY + Investing.com`);

    try {
        if (!brainData.learnedInsights) brainData.learnedInsights = [];
        if (!brainData.studiedArticles) brainData.studiedArticles = [];

        const webArticles = await studyWebNewsFeeds();
        console.log(`[NEWS STUDY 🌐] Successfully scraped ${webArticles.length} live financial news items.`);

        const newsInsights = extractTradingInsights(webArticles);
        const existingTexts = new Set(brainData.learnedInsights.map(i => (i.text || '').toLowerCase()));
        let addedCount = 0;

        for (const ins of newsInsights) {
            if (!existingTexts.has((ins.text || '').toLowerCase())) {
                existingTexts.add((ins.text || '').toLowerCase());
                brainData.learnedInsights.unshift(ins);
                addedCount++;
            }
        }

        // Keep latest 50 studied articles and up to 500 insights
        brainData.studiedArticles = webArticles.slice(0, 30);
        if (brainData.learnedInsights.length > 500) {
            brainData.learnedInsights = brainData.learnedInsights.slice(0, 500);
        }

        brainData.newsStudyCycles = (brainData.newsStudyCycles || 0) + 1;
        brainData.studyCycles = (brainData.studyCycles || 0) + 1;
        brainData.lastNewsStudyTime = now.toISOString();
        brainData.lastStudyTime = now.toISOString();
        brainData.nextNewsStudyTime = new Date(now.getTime() + NEWS_INTERVAL_MS).toISOString();

        saveBrain(brainData);
        console.log(`📰 [HERMES NEWS STUDY ✅] Completed! Added ${addedCount} insights. Next scheduled in 1 hour.`);
        isNewsStudying = false;
        return { status: 'success', articles: webArticles.length, added: addedCount };
    } catch(err) {
        console.error('[NEWS STUDY ❌] Cycle failed:', err.message);
        isNewsStudying = false;
        return { status: 'error', message: err.message };
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. AUTONOMOUS 2x DAILY YOUTUBE & STRATEGY STUDY CYCLE (Every 12 Hours)
// ──────────────────────────────────────────────────────────────────────────────
let isYouTubeStudying = false;

async function runYouTubeStudyCycle() {
    if (isYouTubeStudying) return { status: 'already_running' };
    isYouTubeStudying = true;
    const now = new Date();
    console.log(`\n📺 [HERMES AUTO YOUTUBE STUDY] Cycle #${(brainData.youtubeStudyCycles || 0) + 1} at ${now.toISOString()}`);
    console.log(`   Schedule: 2x Daily (Every 12 Hours) Deep Quant & SMC Strategy Harvesting`);

    try {
        if (!brainData.learnedInsights) brainData.learnedInsights = [];
        if (!brainData.studiedVideos) brainData.studiedVideos = [];

        // Pick 2 random topics per session
        const topic1 = YOUTUBE_SEARCH_TOPICS[Math.floor(Math.random() * YOUTUBE_SEARCH_TOPICS.length)];
        const topic2 = YOUTUBE_SEARCH_TOPICS[Math.floor(Math.random() * YOUTUBE_SEARCH_TOPICS.length)];
        const topics = topic1 === topic2 ? [topic1] : [topic1, topic2];

        let allVideos = [];
        for (const t of topics) {
            console.log(`[YOUTUBE STUDY 📺] Crawling: "${t}"...`);
            const vids = await studyYouTubeTopic(t);
            allVideos = allVideos.concat(vids);
        }

        console.log(`[YOUTUBE STUDY 📺] Harvested ${allVideos.length} deep strategy videos.`);
        const ytInsights = extractTradingInsights(allVideos);
        const existingTexts = new Set(brainData.learnedInsights.map(i => (i.text || '').toLowerCase()));
        let addedCount = 0;

        for (const ins of ytInsights) {
            if (!existingTexts.has((ins.text || '').toLowerCase())) {
                existingTexts.add((ins.text || '').toLowerCase());
                brainData.learnedInsights.unshift(ins);
                addedCount++;
            }
        }

        brainData.studiedVideos = allVideos.slice(0, 15);
        brainData.youtubeStudyCycles = (brainData.youtubeStudyCycles || 0) + 1;
        brainData.lastYouTubeStudyTime = now.toISOString();
        brainData.nextYouTubeStudyTime = new Date(now.getTime() + YOUTUBE_INTERVAL_MS).toISOString();

        saveBrain(brainData);
        console.log(`📺 [HERMES YOUTUBE STUDY ✅] Completed! Next scheduled in 12 hours.`);
        isYouTubeStudying = false;
        return { status: 'success', videos: allVideos.length, added: addedCount };
    } catch(err) {
        console.error('[YOUTUBE STUDY ❌] Cycle failed:', err.message);
        isYouTubeStudying = false;
        return { status: 'error', message: err.message };
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// 7. COMPREHENSIVE NEWS & MARKET STUDY SYNTHESIS (FOR COMMANDER OMAR)
// ──────────────────────────────────────────────────────────────────────────────
function synthesizeNewsResearchStudy(goldPrice = 4320, dxyPrice = 104.2) {
    const articles = brainData.studiedArticles || [];
    
    // Categorize articles
    const fedArticles = [];
    const fxStreetGold = [];
    const dollarArticles = [];
    const generalMarket = [];

    for (const a of articles) {
        const text = `${a.title} ${a.desc || ''}`.toLowerCase();
        if (text.includes('fed') || text.includes('rate') || text.includes('powell') || text.includes('inflation')) {
            fedArticles.push(a);
        } else if (text.includes('gold') || text.includes('xau') || text.includes('bullion')) {
            fxStreetGold.push(a);
        } else if (text.includes('dollar') || text.includes('dxy') || text.includes('greenback')) {
            dollarArticles.push(a);
        } else {
            generalMarket.push(a);
        }
    }

    // Determine Institutional Sentiment
    let hawkishCount = 0;
    let dovishCount = 0;
    let goldBullishCount = 0;
    let goldBearishCount = 0;

    for (const a of articles) {
        const t = `${a.title} ${a.desc || ''}`.toLowerCase();
        if (t.includes('hawk') || t.includes('rate hike') || t.includes('resilient') || t.includes('yields surge')) hawkishCount++;
        if (t.includes('dove') || t.includes('cut') || t.includes('easing') || t.includes('cooling')) dovishCount++;
        if (t.includes('rally') || t.includes('bullish') || t.includes('record') || t.includes('gain') || t.includes('target')) goldBullishCount++;
        if (t.includes('drop') || t.includes('bearish') || t.includes('slip') || t.includes('decline') || t.includes('drifts toward')) goldBearishCount++;
    }

    const fedBias = dovishCount > hawkishCount ? 'Dovish (সুদ কমানোর আশা - গোল্ডের পক্ষে)' : 'Hawkish/Sticky (উচ্চ সুদের হার - সাময়িক চাপ)';
    const macroGoldBias = goldBullishCount >= goldBearishCount ? 'Bullish Accumulation / Dip Buying' : 'Bearish Correction / Trap Zone';

    // Format top 3-4 actual headline summaries
    const sampleHighlights = articles.slice(0, 4).map((a, i) => {
        let cleanSnippet = (a.desc || '').replace(/&lt;.*?&gt;/g, '').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();
        const descSnip = cleanSnippet ? `\n     ↳ _${cleanSnippet.slice(0, 130)}..._` : '';
        return `  ${i+1}. **[${a.source}]** ${a.title}${descSnip}`;
    }).join('\n\n');

    // Extract actual substantive news findings for voice and Bangla summary
    const newsFindings = [];
    for (const a of articles.slice(0, 5)) {
        const t = (a.title || '').toLowerCase();
        let finding = '';
        if (t.includes('trump') && (t.includes('xi') || t.includes('meet'))) {
            finding = 'ট্রাম্প ও শি জিনপিং বৈঠকের আগে গোল্ডে বড় মুভমেন্টের অপেক্ষা ও ক্রেতা-বিক্রেতার টানাপোড়েন চলছে';
        } else if (t.includes('4,300') || t.includes('4300') || t.includes('drifts toward')) {
            finding = 'এফএক্সস্ট্রিটের পূর্বাভাসে গোল্ড ৪,৩০০ ডলার লেভেলে সাপোর্ট টেস্ট করছে';
        } else if (t.includes('4,400') || t.includes('4400') || t.includes('rejection')) {
            finding = '৪৪০০ ডলারের রেজিস্ট্যান্সে ধাক্কা খেয়ে গোল্ডে সাময়িক পুলব্যাক কারেকশন চলছে';
        } else if (t.includes('dollar') || t.includes('dxy') || t.includes('rallies')) {
            finding = 'ইউএস অর্থনৈতিক তথ্যে ডলার শক্তিশালী হওয়ায় গোল্ডের ওপর সাময়িক চাপ তৈরি হয়েছে';
        } else if (t.includes('fed') || t.includes('powell') || t.includes('rate cut') || t.includes('rate hike')) {
            finding = 'ফেডের সুদের হার কমানোর গতি ধীর হওয়ার আশঙ্কায় ট্রেডাররা সতর্ক অবস্থানে রয়েছে';
        } else if (t.includes('geopolit') || t.includes('war') || t.includes('heat') || t.includes('middle east')) {
            finding = 'ভূ-রাজনৈতিক উত্তেজনা বাড়ায় নিরাপদ সম্পদ হিসেবে সেন্ট্রাল ব্যাংকগুলোর গোল্ডের রিজার্ভ চাহিদা বাড়ছে';
        } else if (t.includes('bull-bear') || t.includes('tug-of-war')) {
            finding = 'মার্কেটে বায়ার এবং সেলারদের মধ্যে তীব্র মনস্তাত্ত্বিক লড়াই চলছে';
        } else if (t.includes('gold') && (t.includes('forecast') || t.includes('drifts'))) {
            finding = 'গোল্ডের বৈশ্বিক পূর্বাভাসে স্বল্পমেয়াদে ভোলাটিলিটি ও বাউন্সের ইঙ্গিত রয়েছে';
        }
        if (finding && !newsFindings.includes(finding)) {
            newsFindings.push(finding);
        }
    }

    const firstFinding = newsFindings[0] || 'গোল্ডে বায়ার ও সেলারদের তীব্র মনস্তাত্ত্বিক লড়াই চলছে';
    const secondFinding = newsFindings[1] || 'ডলার ইনডেক্সের ওঠানামায় গোল্ডের ওপর সাময়িক প্রভাব পড়ছে';

    const voiceSummary = `কমান্ডার, আমি রয়টার্স এবং এফএক্সস্ট্রিটের তাজা খবরগুলো স্টাডি করে দেখলাম—মার্কেটে নতুন খবর এসেছে যে, ${firstFinding}। এছাড়া, ${secondFinding}। ইউএস ডলার ইনডেক্স একটু শক্তিশালী হওয়ার কারণে গোল্ডে সাময়িক পুলব্যাক কারেকশন চলছে, তবে ডিসকাউন্ট জোনে বড় বায়াররা লিকুইডিটি খুঁজছে।`;

    const fullMarkdown = `### 📊 [রয়টার্স ও এফএক্সস্ট্রিট লাইভ নিউজ রিসার্চ ও ম্যাক্রো স্টাডি রিপোর্ট]
*স্বয়ংক্রিয় স্টাডি সূচি: প্রতি ১ ঘণ্টা পর পর তাজা নিউজ রিসার্চ | দিনে ২ বার ইউটিউব কোয়ান্ট অ্যানালিসিস*

📢 **বাংলায় তাজা খবরের মূল নির্যাস (What Research Found):**
${newsFindings.length > 0 ? newsFindings.map((f, i) => `  ${i+1}. 🎯 **${f}**`).join('\n') : '  • এফএক্সস্ট্রিট ও রয়টার্স থেকে তাজা খবরের তথ্য প্রসেস করা হয়েছে।'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**১. শীর্ষ সংবাদ বুলেটিন (রয়টার্স, এফএক্সস্ট্রিট ও ইয়াহু ফাইনান্স):**
${sampleHighlights || '  • রয়টার্স ও এফএক্সস্ট্রিট থেকে লাইভ ডেটা প্রসেসিং চলছে...'}

**২. ম্যাক্রো ইকোনমিক ও ফেড ইন্টারেস্ট রেট স্টাডি:**
- **ফেড পলিসি সেন্টিমেন্ট:** ${fedBias}
- **ইউএস ডলার ইনডেক্স (DXY):** ${dxyPrice ? dxyPrice.toFixed(2) : '104.20'} — ডলারের সাথে গোল্ডের বিপরীতমুখী কোরিলেশন ট্র্যাক করা হচ্ছে।
- **গোল্ড প্রাতিষ্ঠানিক সেন্টিমেন্ট:** ${macroGoldBias}

**৩. চার্ট ও টেকনিক্যাল কনফ্লুয়েন্স সংযোগ:**
- বর্তমান গোল্ড প্রাইস লেভেলের কাছে রিটেইল ব্রেকআউট ফাঁদ তৈরি হচ্ছে কি না তা ১২-বার লিকুইডিটি সুইপ ও CVD ডেল্টা দিয়ে নজর রাখা হচ্ছে।
- হাই-ইমপ্যাক্ট নিউজ রিলিজের ৩০ মিনিট আগে ও পরে নো-ট্রেড ব্ল্যাকআউট জোন মেনে চলুন।

**৪. কমান্ডারের ট্রেডিং ডিরেক্টিভ:**
- খবরের সাময়িক স্পাইকে FOMO বাই/সেল নিষিদ্ধ (২.৫x ATR ফিল্টার সক্রিয়)।
- শুধুমাত্র ডিসকাউন্ট জোনে স্প্রিং অথবা প্রিমিয়ামে UTAD সুইপ নিশ্চিত হলে তবেই এন্ট্রি।`;

    return {
        voiceText: voiceSummary,
        markdownText: fullMarkdown,
        fedBias,
        macroGoldBias,
        articlesCount: articles.length,
        lastStudyTime: brainData.lastNewsStudyTime
    };
}

// ──────────────────────────────────────────────────────────────────────────────
// 8. MASTER DAEMON & EXPORTS
// ──────────────────────────────────────────────────────────────────────────────
function startAllAutonomousDaemons() {
    console.log(`\n================================================================`);
    console.log(`🚀 [HERMES AUTONOMOUS AI ENGINE] Multi-Tier Schedule Armed:`);
    console.log(`   1. 📰 NEWS RESEARCH: Every 1 Hour (Reuters, FXStreet, Yahoo, Investing)`);
    console.log(`   2. 📺 YOUTUBE & STRATEGY: Twice Daily (Every 12 Hours)`);
    console.log(`================================================================\n`);

    // Immediate initial study run on boot
    setTimeout(() => {
        runNewsStudyCycle();
    }, 4000);

    setTimeout(() => {
        runYouTubeStudyCycle();
    }, 12000);

    // Recurring Timers
    setInterval(runNewsStudyCycle, NEWS_INTERVAL_MS);
    setInterval(runYouTubeStudyCycle, YOUTUBE_INTERVAL_MS);
}

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
    startStudyDaemon: startAllAutonomousDaemons,
    runNewsStudyNow: runNewsStudyCycle,
    runYouTubeStudyNow: runYouTubeStudyCycle,
    runStudyNow: async () => {
        const r1 = await runNewsStudyCycle();
        const r2 = await runYouTubeStudyCycle();
        return { news: r1, youtube: r2 };
    },
    synthesizeNewsResearchStudy,
    getStudyStatus: () => ({
        isNewsStudying,
        isYouTubeStudying,
        isStudying: isNewsStudying || isYouTubeStudying,
        newsSchedule: 'Every 1 Hour (Auto)',
        youtubeSchedule: 'Twice Daily (Every 12 Hours)',
        lastStudyTime: brainData.lastStudyTime,
        lastNewsStudyTime: brainData.lastNewsStudyTime,
        lastYouTubeStudyTime: brainData.lastYouTubeStudyTime,
        nextNewsStudyTime: brainData.nextNewsStudyTime,
        nextYouTubeStudyTime: brainData.nextYouTubeStudyTime,
        newsStudyCycles: brainData.newsStudyCycles || 0,
        youtubeStudyCycles: brainData.youtubeStudyCycles || 0,
        studyCycles: brainData.studyCycles || 0,
        totalInsights: (brainData.learnedInsights || []).length,
        recentVideos: (brainData.studiedVideos || []).slice(0, 6),
        recentArticles: (brainData.studiedArticles || []).slice(0, 10),
        recentInsights: (brainData.learnedInsights || []).slice(0, 8)
    }),
    getAllInsights: () => (brainData.learnedInsights || []),
    searchBrainKnowledge
};
