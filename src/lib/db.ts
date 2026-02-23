import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;

const sql = (): NeonQueryFunction<false, false> => {
    if (!_sql) {
        if (!process.env.DATABASE_URL) {
            throw new Error('DATABASE_URL is not defined in environment variables');
        }
        _sql = neon(process.env.DATABASE_URL);
    }
    return _sql;
};

export default sql;
