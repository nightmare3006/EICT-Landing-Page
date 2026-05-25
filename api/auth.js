const CLIENT_ID = process.env.OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET;
const SITE_URL = process.env.SITE_URL || 'https://eict-landing.vercel.app';

export default async (req, res) => {
  const { code } = req.query;

  if (code) {
    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
        }),
      });

      const data = await response.json();

      if (data.access_token) {
        const content = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Auth callback</title></head>
<body>
<script>
(function() {
  function receiveMessage(message) {
    window.opener.postMessage(
      'authorization:github:${data.access_token}:${data.scope || ''}',
      message.origin
    );
    window.removeEventListener('message', receiveMessage, false);
  }
  window.addEventListener('message', receiveMessage, false);
  window.opener.postMessage('authorizing:github', '*');
})();
\u003c/script>
</body>
</html>`;
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(content);
      } else {
        res.status(400).send('Error: ' + JSON.stringify(data));
      }
    } catch (error) {
      res.status(500).send('Server error: ' + error.message);
    }
  } else {
    const redirectUri = SITE_URL + '/api/auth';
    const githubAuthUrl =
      'https://github.com/login/oauth/authorize?client_id=' + CLIENT_ID +
      '&redirect_uri=' + encodeURIComponent(redirectUri) +
      '&scope=repo,user&response_type=code';
    res.redirect(301, githubAuthUrl);
  }
};