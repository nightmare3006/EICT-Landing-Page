const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const SITE_URL = process.env.SITE_URL || 'https://eict.vercel.app';
const redirectUri = SITE_URL + '/api/auth';

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
      const token = data.access_token;
      const scope = data.scope || '';
      const provider = 'github';
      const content = '<html><body><script>' +
        '(function(){' +
        'var baseUrl="' + SITE_URL + '";' +
        'var token="' + token + '";' +
        'var provider="' + provider + '";' +
        'function receiveMessage(e){' +
        'if(e.origin===baseUrl&&e.data==="authorizing:"+provider){' +
        'window.removeEventListener("message",receiveMessage,false);' +
        'window.opener.postMessage(' +
        '"authorization:"+provider+":success:"+JSON.stringify({token:token,provider:provider}),' +
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
        '<p>' + (data.error_description || data.error || 'Error desconocido') + '</p>' +
        '<a href="/admin/">Volver e intentar de nuevo</a></body></html>';
      res.status(400).send(errorContent);
    }
  } catch (err) {
    res.status(500).send('<html><body><h2>Error del servidor</h2><p>' + err.message + '</p></body></html>');
  }
};