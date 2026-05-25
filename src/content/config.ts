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
  }),
});

const contactosCollection = defineCollection({
  type: 'content',
  schema: z.object({
    area: z.enum(['director', 'juridica', 'rrhh', 'economia']),
    name: z.string(),
    position: z.string(),
    email: z.string().email(),
    phone: z.string(),
    schedule: z.string().optional(),
    photo: z.string().optional(),
  }),
});

const empresaCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().optional(),
    mision: z.string().optional(),
    vision: z.string().optional(),
    objeto: z.string().optional(),
  }),
});

export const collections = {
  servicios: serviciosCollection,
  productos: productosCollection,
  contactos: contactosCollection,
  empresa: empresaCollection,
};