import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'schema.prisma'),
  migrate: {
    async resolve({ datasourceUrl }) {
      // Use DIRECT_URL for migrations (bypasses pgbouncer)
      const directUrl = process.env.DIRECT_URL;
      return {
        url: directUrl || datasourceUrl || process.env.DATABASE_URL || '',
      };
    },
  },
});
