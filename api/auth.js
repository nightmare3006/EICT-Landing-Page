module.exports = async (req, res) => {
  const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
  const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
  const SITE_URL = process.env.SITE_URL || 'https://eict.vercel.app';
  const redirectUri = SITE_URL + '/api/auth';
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
      res.status(200).send(
        '<html><body><script>' +
        'window.opener.postMessage("authorization:github:' + data.access_token + ':' + (data.scope || '') + '","*");' +
        'window.close();' +
        '</script></body></html>'
      );
    } else {
      res.status(400).send(
        '<html><body><p>Error: ' + data.error + '</p><p>' + data.error_description + '</p>' +
        '<a href="/admin/">Volver e intentar de nuevo</a></body></html>'
      );
    }
  } catch (err) {
    res.status(500).send('<html><body><p>Server error: ' + err.message + '</p></body></html>');
  }
};