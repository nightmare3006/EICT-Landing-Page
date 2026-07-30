const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const SITE_URL = process.env.SITE_URL || 'https://eict.vercel.app';
const redirectUri = SITE_URL + '/api/auth';

// JSON.stringify escapes quotes but not "</script>", which would still close the
// inline <script> block early.
const jsLiteral = (value) => JSON.stringify(value).replace(/<\//g, '<\\/');

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

export default async (req, res) => {
  const { code } = req.query;

  if (!code) {
    const url = 'https://github.com/login/oauth/authorize?client_id=' + CLIENT_ID +
      '&redirect_uri=' + encodeURIComponent(redirectUri) +
      '&scope=repo,user&response_type=code';
    return res.redirect(302, url);
  }

  try {
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await r.json();

    if (data.access_token) {
      const provider = 'github';
      // Serialise rather than concatenate so a token containing a quote or
      // "</script>" can't break out of the inline script.
      const payload = jsLiteral(
        JSON.stringify({ token: data.access_token, provider })
      );
      const content = '<html><body><script>' +
        '(function(){' +
        'var baseUrl=' + jsLiteral(SITE_URL) + ';' +
        'var payload=' + payload + ';' +
        'var provider=' + jsLiteral(provider) + ';' +
        'function receiveMessage(e){' +
        'if(e.origin===baseUrl&&e.data==="authorizing:"+provider){' +
        'window.removeEventListener("message",receiveMessage,false);' +
        'window.opener.postMessage(' +
        '"authorization:"+provider+":success:"+payload,' +
        'baseUrl);' +
        'window.close();' +
        '}' +
        '}' +
        'window.addEventListener("message",receiveMessage,false);' +
        'window.opener.postMessage("authorizing:"+provider,baseUrl);' +
        '})();' +
        '</script></body></html>';
      res.status(200).send(content);
    } else {
      const errorContent = '<html><body>' +
        '<h2>Error de autenticaci\u00f3n</h2>' +
        '<p>' + escapeHtml(data.error_description || data.error || 'Error desconocido') + '</p>' +
        '<a href="/admin/">Volver e intentar de nuevo</a></body></html>';
      res.status(400).send(errorContent);
    }
  } catch (err) {
    res.status(500).send('<html><body><h2>Error del servidor</h2><p>' + escapeHtml(err.message) + '</p></body></html>');
  }
};