import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: '**/index.{md,mdx}',
    generateId: ({ entry, data }) => `${entry.split('/')[0]}/${data.slug}`,
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        date: z.coerce.date(),
        slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        desc: z.string(),
        lead: z.string(),
        tags: z.array(z.string()).default([]),
        readTime: z.string(),
        fresh: z.boolean().default(false),
        cover: image().optional(),
        coverAlt: z.string().min(1).optional(),
      })
      .superRefine((data, ctx) => {
        if (Boolean(data.cover) !== Boolean(data.coverAlt)) {
          ctx.addIssue({
            code: 'custom',
            message: 'cover and coverAlt must be provided together',
            path: data.cover ? ['coverAlt'] : ['cover'],
          });
        }
      }),
});

export const collections = { blog };
