import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// ---------------------------------------------------------------------------
// Sections: die einzige Stelle, an der neue Section-Typen registriert werden.
// Jede Section hat genau einen Typ, typisierte Props und eine Komponente in
// src/components/sections/. Der Agent darf Seiten nur aus diesen Typen bauen.
// ---------------------------------------------------------------------------
const link = z.object({ label: z.string().min(1), href: z.string().min(1) });

const image = z.object({
  src: z.url().describe('Absolute URL im zentralen Medienspeicher'),
  alt: z.string().min(1).describe('Pflicht. Leerer Alt-Text nur für Dekoration, dann alt: ""'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const sectionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('hero'),
    headline: z.string().min(1),
    text: z.string().optional(),
    image: image.optional(),
    cta: link.optional(),
    secondary: link.optional(),
  }),
  z.object({
    type: z.literal('textMedia'),
    headline: z.string().min(1),
    body: z.string().min(1).describe('Markdown erlaubt'),
    image: image.optional(),
    mediaSide: z.enum(['left', 'right']).default('right'),
  }),
  z.object({
    type: z.literal('faq'),
    headline: z.string().optional(),
    tags: z.array(z.string()).optional().describe('Nur FAQ-Einträge mit einem dieser Tags'),
    limit: z.number().int().positive().optional(),
  }),
  z.object({
    type: z.literal('cta'),
    headline: z.string().min(1),
    text: z.string().optional(),
    button: link,
  }),
  z.object({
    type: z.literal('postList'),
    headline: z.string().optional(),
    limit: z.number().int().positive().default(3),
  }),
  z.object({
    type: z.literal('projectGrid'),
    headline: z.string().optional(),
    limit: z.number().int().positive().default(6),
  }),
  z.object({
    type: z.literal('contactForm'),
    headline: z.string().min(1),
    text: z.string().optional(),
  }),
]);

export type Section = z.infer<typeof sectionSchema>;

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------
const pages = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/pages' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(50).max(160),
    noindex: z.boolean().default(false),
    sections: z.array(sectionSchema).min(1),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(50).max(160),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    cover: image.optional(),
    draft: z.boolean().default(false),
    // Herkunft für Nachvollziehbarkeit: Issue-Nummer des Intake, falls vorhanden.
    sourceIssue: z.number().int().positive().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().min(1),
    client: z.string().optional(),
    date: z.coerce.date(),
    location: z.string().optional(),
    summary: z.string().min(30).max(200),
    cover: image.optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    sourceIssue: z.number().int().positive().optional(),
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faq' }),
  schema: z.object({
    question: z.string().min(5),
    tags: z.array(z.string()).default([]),
    order: z.number().int().default(100),
    draft: z.boolean().default(false),
    sourceIssue: z.number().int().positive().optional(),
  }),
});

export const collections = { pages, posts, projects, faq };
