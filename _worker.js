// Cloudflare Pages (advanced mode) worker for fbr12.
// Serves the static site and handles the lead form -> Telegram.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/lead') {
      if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
      if (request.method === 'POST') return handleLead(request, env);
      return json({ ok: false, error: 'method' }, 405);
    }
    // everything else -> static assets
    return env.ASSETS.fetch(request);
  },
};

async function handleLead(request, env) {
  let d;
  try { d = await request.json(); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
  if (d && d.website) return json({ ok: true }); // honeypot
  const name = (d.Name || d.name || '').toString().slice(0, 200).trim();
  const phone = (d.Phone || d.phone || '').toString().slice(0, 100).trim();
  const email = (d.Email || d.email || '').toString().slice(0, 200).trim();
  if (!name && !phone && !email) return json({ ok: false, error: 'empty' }, 400);
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID)
    return json({ ok: false, error: 'not_configured' }, 500);
  const text = '🟢 Новая заявка с fbr12.com\nИмя: ' + (name || '—') +
    '\nТелефон: ' + (phone || '—') + '\nEmail: ' + (email || '—');
  try {
    const tg = await fetch('https://api.telegram.org/bot' + env.TELEGRAM_BOT_TOKEN + '/sendMessage', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
    });
    if (!tg.ok) return json({ ok: false, error: 'telegram' }, 502);
    return json({ ok: true });
  } catch { return json({ ok: false, error: 'network' }, 502); }
}
