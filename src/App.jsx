import { useState, useEffect, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from "react-simple-maps";
import { Globe, Activity, PlusCircle, Moon, Sun, Languages, Flame, FileText, ShieldAlert, Users, MessageCircle, Send, Sparkles, Radio, ChevronRight } from 'lucide-react';
import './App.css';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";
const API = 'http://localhost:3001';

const translations = {
  en: {
    title: "Atlas", subtitle: "GLOBAL INTELLIGENCE", map: "World Map", feed: "Live Feed",
    admin: "Publish", activeEvents: "Active Stories", criticalAlerts: "Breaking",
    globalTension: "Tension Index", statusStable: "STABLE", statusElevated: "ELEVATED",
    statusCritical: "CRITICAL", liveUpdates: "Live Updates", lvl: "LVL",
    lightMode: "Light", darkMode: "Dark", langBtn: "العربية",
    filters: "Layers", typeConflict: "Conflict", typeTreaty: "Treaty",
    typeSanction: "Sanction", typeElection: "Election", typeDiplomatic: "Diplomatic",
    publish: "Publish Story", formTitle: "Headline", formType: "Category",
    formSeverity: "Priority", formLat: "Lat", formLng: "Lng", formCountry: "Country Code",
    aiBriefing: "AI Intelligence Briefing", aiLoading: "Generating briefing...",
    aiAssist: "AI Assist", aiAnalyze: "Auto-Analyze with AI", powered: "Gemini 1.5 Flash"
  },
  ar: {
    title: "أطلس", subtitle: "الاستخبارات العالمية", map: "خريطة العالم", feed: "البث المباشر",
    admin: "نشر", activeEvents: "قصص نشطة", criticalAlerts: "عاجل",
    globalTension: "مؤشر التوتر", statusStable: "مستقر", statusElevated: "مرتفع",
    statusCritical: "حرج", liveUpdates: "تحديثات مباشرة", lvl: "مستوى",
    lightMode: "فاتح", darkMode: "داكن", langBtn: "English",
    filters: "الطبقات", typeConflict: "صراع", typeTreaty: "معاهدة",
    typeSanction: "عقوبات", typeElection: "انتخابات", typeDiplomatic: "دبلوماسي",
    publish: "نشر القصة", formTitle: "العنوان", formType: "الفئة",
    formSeverity: "الأولوية", formLat: "خط العرض", formLng: "خط الطول", formCountry: "رمز الدولة",
    aiBriefing: "تقرير الذكاء الاصطناعي", aiLoading: "جارٍ إنشاء التقرير...",
    aiAssist: "مساعد ذكي", aiAnalyze: "تحليل تلقائي بالذكاء", powered: "Gemini 1.5 Flash"
  }
};

const eventColors = {
  Conflict: 'var(--status-danger)', Treaty: 'var(--status-info)',
  Sanction: 'var(--status-warning)', Election: 'var(--status-success)',
  Diplomatic: 'var(--text-muted)'
};

function App() {
  const [tab, setTab] = useState('map');
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ activeEvents: 0, criticalAlerts: 0, globalTensionIndex: 0, rawStatus: 'STABLE', activeCountries: [] });
  const [visible, setVisible] = useState(['Conflict', 'Treaty', 'Sanction', 'Election', 'Diplomatic']);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(true);
  const [form, setForm] = useState({ title: '', event_type: 'Conflict', severity: 3, latitude: 0, longitude: 0, country: '' });
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    isDark ? document.body.classList.add('dark') : document.body.classList.remove('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    localStorage.setItem('lang', lang);
  }, [lang]);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, eventsRes] = await Promise.all([
        fetch(`${API}/api/dashboard/stats`), fetch(`${API}/api/events`)
      ]);
      const statsData = await statsRes.json();
      setStats(statsData);
      const eventsData = await eventsRes.json();
      setEvents(eventsData.map(e => ({
        ...e,
        title: lang === 'ar' && e.title_ar ? e.title_ar : e.title,
        location: e.involved_parties || 'Global',
        date: e.date_occurred || e.date
      })));
    } catch (err) { console.error('API Error:', err); }
  }, [lang]);

  // Auto-refresh every 30s
  useEffect(() => { fetchData(); const i = setInterval(fetchData, 30000); return () => clearInterval(i); }, [fetchData]);

  // AI Briefing
  useEffect(() => {
    setBriefingLoading(true);
    fetch(`${API}/api/ai/briefing`)
      .then(r => r.json())
      .then(d => { setBriefing(d.briefing); setBriefingLoading(false); })
      .catch(() => setBriefingLoading(false));
  }, []);

  const handleAiAnalyze = async () => {
    if (!form.title) return;
    setAiAnalyzing(true);
    try {
      const res = await fetch(`${API}/api/ai/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title })
      });
      const data = await res.json();
      setForm(prev => ({
        ...prev,
        event_type: data.category || prev.event_type,
        severity: data.severity || prev.severity,
        country: data.country_iso || prev.country
      }));
    } catch (err) { console.error('AI Analysis failed'); }
    setAiAnalyzing(false);
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API}/api/events`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, countries: [{ iso: form.country, role: 'Primary' }] })
      });
      setForm({ title: '', event_type: 'Conflict', severity: 3, latitude: 0, longitude: 0, country: '' });
      fetchData();
    } catch (err) { console.error('Publish failed'); }
  };

  const statusClass = stats.rawStatus?.toLowerCase() || 'stable';
  const statusLabel = t[`status${stats.rawStatus?.charAt(0) + stats.rawStatus?.slice(1).toLowerCase()}`] || stats.rawStatus;

  const getIcon = (type) => {
    const p = { size: 10, x: 3, y: 3 };
    return { Conflict: <Flame {...p} color="var(--status-danger)" />, Treaty: <FileText {...p} color="var(--status-info)" />, Sanction: <ShieldAlert {...p} color="var(--status-warning)" />, Election: <Users {...p} color="var(--status-success)" /> }[type] || <MessageCircle {...p} color="var(--text-muted)" />;
  };

  return (
    <div className="app-container">
      {/* ─── Sidebar ─── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo"><Globe size={20} /></div>
          <div>
            <h1 className="heading-xl" style={{ margin: 0, lineHeight: 1 }}>{t.title}</h1>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.1em' }}>{t.subtitle}</span>
          </div>
        </div>

        <nav className="nav-menu">
          <button className={`nav-item ${tab === 'map' ? 'active' : ''}`} onClick={() => setTab('map')}><Globe size={17} /> {t.map}</button>
          <button className={`nav-item ${tab === 'feed' ? 'active' : ''}`} onClick={() => setTab('feed')}><Activity size={17} /> {t.feed}</button>
          <button className={`nav-item ${tab === 'admin' ? 'active' : ''}`} onClick={() => setTab('admin')}><PlusCircle size={17} /> {t.admin}</button>
        </nav>

        <div className="sidebar-section">
          <span className="section-label">{t.filters}</span>
          <div className="sidebar-legend">
            {['Conflict', 'Treaty', 'Sanction', 'Election', 'Diplomatic'].map(type => (
              <div key={type} className={`legend-chip ${!visible.includes(type) ? 'inactive' : ''}`}
                onClick={() => setVisible(p => p.includes(type) ? p.filter(t => t !== type) : [...p, type])}>
                <div className="legend-dot" style={{ background: eventColors[type] }} />
                <span>{t[`type${type}`]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}><Languages size={16} /> {t.langBtn}</button>
          <button className="nav-item" onClick={() => setIsDark(!isDark)}>{isDark ? <Sun size={16} /> : <Moon size={16} />} {isDark ? t.lightMode : t.darkMode}</button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="main-content">
        <div className="top-bar">
          <div className="stat-group">
            <div className="stat-box">
              <span className="stat-label">{t.activeEvents}</span>
              <span className="stat-value">{stats.activeEvents}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">{t.criticalAlerts}</span>
              <span className="stat-value danger">{stats.criticalAlerts}</span>
            </div>
          </div>
          <div className="stat-box" style={{ alignItems: lang === 'ar' ? 'flex-start' : 'flex-end' }}>
            <span className="stat-label">{t.globalTension}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="stat-value">{stats.globalTensionIndex}%</span>
              <span className={`status-pill ${statusClass}`}><span className="status-dot animate-pulse" /> {statusLabel}</span>
            </div>
          </div>
        </div>

        {/* ─── Map View ─── */}
        {tab === 'map' && (
          <div className="map-container animate-fade-in">
            <ComposableMap projectionConfig={{ scale: 150 }} style={{ width: "100%", height: "100%" }}>
              <ZoomableGroup center={[0, 20]} maxZoom={5}>
                <Geographies geography={geoUrl}>
                  {({ geographies }) => geographies.map(geo => (
                    <Geography key={geo.rsmKey} geography={geo}
                      fill={stats.activeCountries?.includes(geo.properties.name) ? "rgba(220, 38, 38, 0.25)" : "var(--border-subtle)"}
                      stroke="var(--bg-base)" strokeWidth={0.5}
                      style={{ hover: { fill: "var(--border-strong)", outline: "none" }, pressed: { outline: "none" } }} />
                  ))}
                </Geographies>
                {events.filter(e => visible.includes(e.event_type)).map(ev => (
                  ev.longitude && ev.latitude ? (
                    <Marker key={`m-${ev.id}`} coordinates={[parseFloat(ev.longitude), parseFloat(ev.latitude)]}>
                      <g transform="translate(-8,-16)">
                        <circle cx="8" cy="8" r="8" fill="var(--bg-surface)" stroke={eventColors[ev.event_type] || 'var(--text-muted)'} strokeWidth="1.5" opacity="0.95" />
                        {getIcon(ev.event_type)}
                      </g>
                      <text textAnchor="middle" y={2} style={{ fontFamily: "var(--font-sans)", fontSize: "4.5px", fill: "var(--text-primary)", fontWeight: 600, opacity: 0.85 }}>{ev.title}</text>
                    </Marker>
                  ) : null
                ))}
              </ZoomableGroup>
            </ComposableMap>
          </div>
        )}

        {/* ─── Feed View ─── */}
        {tab === 'feed' && (
          <div className="panel-content animate-fade-in" style={{ padding: '1.5rem', maxWidth: '700px', margin: '0 auto' }}>
            <div className="ai-briefing-card">
              <div className="ai-briefing-header"><Sparkles size={14} /> {t.aiBriefing} <span className="ai-badge">{t.powered}</span></div>
              {briefingLoading ? <div className="ai-loading" /> : <p className="ai-briefing-text">{briefing}</p>}
            </div>
            {events.map(ev => (
              <div key={ev.id} className="elegant-panel event-card">
                <div className="event-header">
                  <span className="event-title">{ev.title}</span>
                  <span className={`badge severity-${ev.severity}`}>{t.lvl} {ev.severity}</span>
                </div>
                {ev.description && <p className="event-desc">{ev.description}</p>}
                <div className="event-footer">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Globe size={11} /> {ev.location}</span>
                  <span dir="ltr">{new Date(ev.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Admin View ─── */}
        {tab === 'admin' && (
          <div className="admin-container animate-fade-in">
            <div className="admin-form-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <div className="sidebar-logo"><Send size={18} /></div>
                <div>
                  <h2 className="heading-lg" style={{ margin: 0 }}>{t.publish}</h2>
                  <span className="ai-badge" style={{ marginTop: '0.25rem' }}><Sparkles size={10} /> {t.aiAssist}</span>
                </div>
              </div>
              <form onSubmit={handlePublish} className="admin-form">
                <div className="form-group">
                  <label className="section-label">{t.formTitle}</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input className="form-input" style={{ flex: 1 }} placeholder="e.g. Security Council Emergency Meeting" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                    <button type="button" onClick={handleAiAnalyze} disabled={aiAnalyzing || !form.title}
                      className="publish-btn" style={{ padding: '0.75rem 1rem', marginTop: 0, opacity: !form.title ? 0.4 : 1 }}>
                      <Sparkles size={14} /> {aiAnalyzing ? '...' : 'AI'}
                    </button>
                  </div>
                </div>
                <div className="form-row form-row-2">
                  <div className="form-group">
                    <label className="section-label">{t.formType}</label>
                    <select className="form-input" value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}>
                      {['Conflict', 'Treaty', 'Sanction', 'Election', 'Diplomatic'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="section-label">{t.formSeverity}</label>
                    <input type="number" min="1" max="5" className="form-input" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} required />
                  </div>
                </div>
                <div className="form-row form-row-3">
                  <div className="form-group">
                    <label className="section-label">{t.formLat}</label>
                    <input type="number" className="form-input" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} step="any" required />
                  </div>
                  <div className="form-group">
                    <label className="section-label">{t.formLng}</label>
                    <input type="number" className="form-input" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} step="any" required />
                  </div>
                  <div className="form-group">
                    <label className="section-label">{t.formCountry}</label>
                    <input className="form-input" placeholder="USA" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} required />
                  </div>
                </div>
                <button type="submit" className="publish-btn"><Send size={16} /> {t.publish}</button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ─── Right Panel (Live Feed) ─── */}
      <aside className="intel-panel">
        <div className="panel-header">
          <h2 className="heading-md" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Radio size={18} color="var(--status-danger)" className="animate-pulse" /> {t.liveUpdates}
          </h2>
          <span className="heading-sm">{events.length} stories</span>
        </div>
        <div className="panel-content">
          {events.slice(0, 15).map(ev => (
            <div key={ev.id} className="elegant-panel event-card">
              <div className="event-header">
                <span className="event-title">{ev.title}</span>
                <span className={`badge severity-${ev.severity}`}>{ev.severity}</span>
              </div>
              <div className="event-footer">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Globe size={11} /> {ev.location}</span>
                <span dir="ltr">{new Date(ev.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

export default App;