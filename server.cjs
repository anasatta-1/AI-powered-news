const express = require('express');
const cors = require('cors');
const Parser = require('rss-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('./db.cjs');

const app = express();
const parser = new Parser();
const port = 3001;

// --- GEMINI AI ENGINE ---
const genAI = new GoogleGenerativeAI('AIzaSyAniqMMY38r4Gm4EBFS7-SPX6En8sptMkc');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

app.use(cors());
app.use(express.json());

// --- COUNTRY REFERENCE (for geocoding fallback) ---
const countryRef = {
  'USA': { lat: 37.09, lng: -95.71 }, 'CHN': { lat: 35.86, lng: 104.20 },
  'RUS': { lat: 61.52, lng: 105.32 }, 'UKR': { lat: 48.38, lng: 31.17 },
  'ISR': { lat: 31.05, lng: 34.85 }, 'IRN': { lat: 32.43, lng: 53.69 },
  'GBR': { lat: 55.38, lng: -3.44 }, 'FRA': { lat: 46.23, lng: 2.21 },
  'PHL': { lat: 14.60, lng: 120.98 }
};

// ========================
//  AI-POWERED ENDPOINTS
// ========================

// AI Geopolitical Briefing
app.get('/api/ai/briefing', async (req, res) => {
  try {
    const events = await db.getActiveEvents();
    if (events.length === 0) return res.json({ briefing: 'No active events to analyze.' });

    const eventSummary = events.map(e => `- ${e.title} (${e.event_type}, Severity: ${e.severity}/5): ${e.description || 'No details.'} Countries: ${e.involved_parties || 'Unknown'}`).join('\n');

    const prompt = `You are a senior geopolitical analyst for a global news agency. Based on the following active events, write a professional executive briefing (4-5 sentences). Be analytical, objective, and highlight interconnections between events. Use formal journalistic tone.

Active Events:
${eventSummary}

Write the briefing now. Do not use markdown formatting, bullet points, or headers. Write in flowing prose paragraphs only.`;

    const result = await model.generateContent(prompt);
    const briefing = result.response.text();
    res.json({ briefing, generatedAt: new Date().toISOString(), eventCount: events.length });
  } catch (err) {
    console.error('[AI Briefing Error]', err.message);
    res.status(500).json({ error: 'AI briefing generation failed', details: err.message });
  }
});

// AI Translation
app.post('/api/ai/translate', async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    const langName = targetLang === 'ar' ? 'Arabic' : 'English';
    const prompt = `Translate the following news headline into professional journalistic ${langName}. Return ONLY the translated text, nothing else.\n\n"${text}"`;
    const result = await model.generateContent(prompt);
    res.json({ translation: result.response.text().trim().replace(/^"|"$/g, '') });
  } catch (err) {
    res.status(500).json({ error: 'Translation failed' });
  }
});

// AI Smart Analysis for a single news item
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { title, description } = req.body;
    const prompt = `You are a geopolitical analyst. Analyze this news event and return a JSON object with these fields:
- "severity": number 1-5 (1=routine, 5=critical global impact)
- "category": one of "Conflict", "Treaty", "Sanction", "Election", "Diplomatic"
- "country_iso": the most relevant 3-letter ISO country code (e.g. "USA", "CHN")
- "summary": a 2-sentence professional analysis
- "arabic_title": Arabic translation of the title

News: "${title}"
${description ? `Details: "${description}"` : ''}

Return ONLY valid JSON, no markdown, no code blocks.`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    // Strip markdown code fences if present
    text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const analysis = JSON.parse(text);
    res.json(analysis);
  } catch (err) {
    console.error('[AI Analysis Error]', err.message);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// ========================
//  AUTO NEWS WORKER
// ========================
async function fetchAutomaticNews() {
  console.log('[Worker] Scanning BBC World for updates...');
  try {
    const feed = await parser.parseURL('http://feeds.bbci.co.uk/news/world/rss.xml');
    let added = 0;

    for (const item of feed.items.slice(0, 3)) {
      try {
        // Check for duplicates by title
        const [existing] = await db.pool.query('SELECT id FROM events WHERE title = ? LIMIT 1', [item.title]);
        if (existing.length > 0) { console.log(`[Worker] Skip (duplicate): ${item.title}`); continue; }

        // Rate limit: wait 2s between AI calls
        await new Promise(r => setTimeout(r, 2000));

        // Use Gemini to analyze the headline
        const prompt = `Analyze this news headline and return a JSON object:
- "country_iso": most relevant 3-letter ISO code (e.g. "USA", "CHN", "RUS", "UKR", "ISR", "IRN", "GBR", "FRA", "PHL"). If unsure, use "USA".
- "severity": 1-5 integer
- "category": "Conflict" or "Treaty" or "Sanction" or "Election" or "Diplomatic"
- "arabic_title": Arabic translation of the headline

Headline: "${item.title}"

Return ONLY valid JSON, no markdown.`;

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim().replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const analysis = JSON.parse(text);

        const coords = countryRef[analysis.country_iso] || countryRef['USA'];

        await db.addEvent({
          title: item.title,
          title_ar: analysis.arabic_title || null,
          description: item.contentSnippet || item.title,
          event_type: analysis.category || 'Diplomatic',
          severity: analysis.severity || 2,
          latitude: coords.lat,
          longitude: coords.lng,
          countries: [{ iso: analysis.country_iso || 'USA', role: 'Primary' }]
        });
        added++;
        console.log(`[Worker] + ${item.title} → ${analysis.country_iso} (${analysis.category})`);
      } catch (parseErr) {
        console.error(`[Worker] Skipped: ${item.title} - ${parseErr.message}`);
      }
    }
    console.log(`[Worker] Done. Added ${added} stories.`);
  } catch (error) {
    console.error('[Worker Error]', error.message);
  }
}

// Run worker every 10 minutes, and once on startup
setTimeout(fetchAutomaticNews, 3000);
setInterval(fetchAutomaticNews, 10 * 60 * 1000);

// ========================
//  DATA API ROUTES
// ========================
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const events = await db.getActiveEvents();
    const activeCountries = await db.getActiveCountries();
    const activeCount = events.length;
    const criticalCount = events.filter(e => e.severity >= 4).length;
    const tensionScore = Math.min(100, Math.round(40 + (criticalCount * 12) + (activeCount * 2)));

    res.json({
      activeEvents: activeCount,
      criticalAlerts: criticalCount,
      globalTensionIndex: tensionScore,
      rawStatus: tensionScore >= 80 ? 'CRITICAL' : tensionScore >= 60 ? 'ELEVATED' : 'STABLE',
      activeCountries
    });
  } catch (err) {
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const events = await db.getActiveEvents();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const eventId = await db.addEvent(req.body);
    res.status(201).json({ id: eventId, message: 'Story published' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to publish' });
  }
});

app.get('/api/countries/:iso', async (req, res) => {
  try {
    const profile = await db.getCountryProfile(req.params.iso);
    if (!profile) return res.status(404).json({ error: 'Country not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.listen(port, () => {
  console.log(`\n  ╔══════════════════════════════════════════╗`);
  console.log(`  ║  ATLAS — Global News Intelligence        ║`);
  console.log(`  ║  Backend: http://localhost:${port}            ║`);
  console.log(`  ║  AI Engine: Gemini 1.5 Flash             ║`);
  console.log(`  ║  News Worker: Active (10 min interval)   ║`);
  console.log(`  ╚══════════════════════════════════════════╝\n`);
});