import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    desc: z.string(),
    lead: z.string(),
    tags: z.array(z.string()).default([]),
    readTime: z.string(),
    fresh: z.boolean().default(false),
  }),
});

export const collections = { blog };
