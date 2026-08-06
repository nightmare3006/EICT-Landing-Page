// Receives a visitor review and commits it to the repo as an UNAPPROVED
// markdown file. Nothing reaches the site until someone flips `aprobado: true`
// in /admin, which is the only gate against spam and abuse here.
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPO || 'nightmare3006/EICT-Landing-Page';
const BRANCH = process.env.GITHUB_BRANCH || 'main';

const LIMITS = {
  nombre: { min: 2, max: 80 },
  empresa: { max: 100 },
  cargo: { max: 100 },
  comentario: { min: 10, max: 1000 },
};

function clean(value) {
  if (typeof value !== 'string') return '';
  // Strip control characters; keep everything else and let YAML quoting handle it.
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
}

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN no está configurado');
    return res.status(500).json({ error: 'El formulario no está configurado. Escríbenos por correo.' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};

  // Honeypot: real people never fill a hidden field.
  if (clean(body.website)) {
    // Pretend it worked so bots don't learn to adapt.
    return res.status(200).json({ ok: true });
  }

  const nombre = clean(body.nombre);
  const empresa = clean(body.empresa);
  const cargo = clean(body.cargo);
  const comentario = clean(body.comentario);
  const valoracion = Number(body.valoracion);

  const errors = [];
  if (nombre.length < LIMITS.nombre.min || nombre.length > LIMITS.nombre.max) {
    errors.push('El nombre debe tener entre 2 y 80 caracteres.');
  }
  if (empresa.length > LIMITS.empresa.max) errors.push('La empresa es demasiado larga.');
  if (cargo.length > LIMITS.cargo.max) errors.push('El cargo es demasiado largo.');
  if (comentario.length < LIMITS.comentario.min || comentario.length > LIMITS.comentario.max) {
    errors.push('El comentario debe tener entre 10 y 1000 caracteres.');
  }
  if (!Number.isInteger(valoracion) || valoracion < 1 || valoracion > 5) {
    errors.push('La valoración debe ser un número entero de 1 a 5.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(' ') });
  }

  const now = new Date();
  const stamp = now.toISOString().slice(0, 10);
  const rand = Math.random().toString(36).slice(2, 7);
  const path = `src/content/comentarios/${stamp}-${slugify(nombre) || 'anonimo'}-${rand}.md`;

  // JSON.stringify produces a valid double-quoted YAML scalar, which keeps any
  // quotes, colons or newlines in visitor text from breaking the frontmatter.
  const frontmatter = [
    '---',
    `nombre: ${JSON.stringify(nombre)}`,
    empresa ? `empresa: ${JSON.stringify(empresa)}` : null,
    cargo ? `cargo: ${JSON.stringify(cargo)}` : null,
    `valoracion: ${valoracion}`,
    `comentario: ${JSON.stringify(comentario)}`,
    `fecha: ${now.toISOString()}`,
    'aprobado: false',
    'destacado: false',
    '---',
    '',
  ]
    .filter(line => line !== null)
    .join('\n');

  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'eict-landing',
      },
      body: JSON.stringify({
        message: `Comentario pendiente de ${nombre}`,
        content: Buffer.from(frontmatter, 'utf8').toString('base64'),
        branch: BRANCH,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error('GitHub API error', r.status, detail);
      return res.status(502).json({ error: 'No pudimos guardar tu comentario. Inténtalo más tarde.' });
    }

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Error al crear el comentario', err);
    return res.status(500).json({ error: 'Error del servidor. Inténtalo más tarde.' });
  }
};

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
