import { defineCollection, z } from 'astro:content';

const serviciosCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string().optional(),
    price: z.string().optional(),
    category: z.enum(['consultoria', 'cientifico', 'eventos', 'proyectos', 'internacional']),
    icon: z.string().optional(),
    order: z.number().default(0),
    // Shown inside the service detail modal, below the markdown body.
    gallery: z
      .array(
        z.object({
          image: z.string(),
          caption: z.string().optional(),
        })
      )
      .optional(),
  }),
});

const productosCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string().optional(),
    price: z.string().optional(),
    available: z.boolean().default(true),
    category: z.enum(['intangible', 'tecnologia', 'servicio', 'otro']).optional(),
    // Shown inside the product detail modal, below the markdown body.
    gallery: z
      .array(
        z.object({
          image: z.string(),
          caption: z.string().optional(),
        })
      )
      .optional(),
  }),
});

const contactosCollection = defineCollection({
  type: 'content',
  schema: z.object({
    // Free-form so new areas can be added from the CMS without a code change;
    // it only drives the icon/colour lookup, which falls back gracefully.
    area: z.string().default('otro'),
    // Optional: while a person's name is unknown the card falls back to the position.
    name: z.string().optional(),
    position: z.string(),
    email: z.string().email(),
    phone: z.string(),
    schedule: z.string().optional(),
    photo: z.string().optional(),
    order: z.number().default(0),
  }),
});

const empresaCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().optional(),
    mision: z.string().optional(),
    vision: z.string().optional(),
    objeto: z.string().optional(),
    direccion: z.string().optional(),
    email_general: z.string().email().optional(),
    telefono_1: z.string().optional(),
    telefono_2: z.string().optional(),
    whatsapp: z.string().optional(),
    // Open list so a new network (Instagram, X, Threads…) can be switched on from
    // the CMS alone. The URL is validated by a pattern in the admin config rather
    // than by Zod here, so a typo can never take the whole build down.
    redes: z
      .array(
        z.object({
          plataforma: z.string(),
          url: z.string(),
        })
      )
      .optional(),
  }),
});

const comentariosCollection = defineCollection({
  type: 'content',
  schema: z.object({
    nombre: z.string(),
    empresa: z.string().optional(),
    cargo: z.string().optional(),
    valoracion: z.number().min(1).max(5),
    // Kept in the frontmatter (not the markdown body) so it renders as plain
    // escaped text — a visitor-submitted body could otherwise inject raw HTML.
    comentario: z.string(),
    fecha: z.coerce.date(),
    // Nothing reaches the site until someone flips this in the CMS.
    aprobado: z.boolean().default(false),
    destacado: z.boolean().default(false),
  }),
});

export const collections = {
  servicios: serviciosCollection,
  productos: productosCollection,
  contactos: contactosCollection,
  empresa: empresaCollection,
  comentarios: comentariosCollection,
};