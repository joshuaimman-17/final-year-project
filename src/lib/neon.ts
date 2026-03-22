import { neon } from '@neondatabase/serverless';

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || '';
const sanitizedUrl = connectionString.trim().replace(/^['"]|['"]$/g, '');
const sql = neon(sanitizedUrl);

export default sql;
