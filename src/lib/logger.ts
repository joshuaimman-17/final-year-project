/**
 * Centralized logger for Dr.Plant
 * Standardizes log formatting and provides easy toggling for production/dev
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const IS_DEV = process.env.NODE_ENV === 'development';

class Logger {
    private prefix: string;

    constructor(prefix: string = 'Dr.Plant') {
        this.prefix = prefix;
    }

    private formatMessage(level: LogLevel, message: string): string {
        const timestamp = new Date().toLocaleTimeString();
        return `[${timestamp}] [${this.prefix}] [${level.toUpperCase()}]: ${message}`;
    }

    info(message: string, ...args: any[]) {
        console.log(`%c ${this.formatMessage('info', message)}`, 'color: #2E7D32; font-weight: bold', ...args);
    }

    warn(message: string, ...args: any[]) {
        console.warn(`%c ${this.formatMessage('warn', message)}`, 'color: #FFA000; font-weight: bold', ...args);
    }

    error(message: string, error?: any, ...args: any[]) {
        console.error(`%c ${this.formatMessage('error', message)}`, 'color: #D32F2F; font-weight: bold', error, ...args);
    }

    debug(message: string, ...args: any[]) {
        if (IS_DEV) {
            console.log(`%c ${this.formatMessage('debug', message)}`, 'color: #7B1FA2; font-weight: italic', ...args);
        }
    }

    // Helper for tracking async operations
    async track<T>(label: string, promise: Promise<T>): Promise<T> {
        const start = performance.now();
        this.debug(`Starting: ${label}`);
        try {
            const result = await promise;
            const duration = (performance.now() - start).toFixed(2);
            this.debug(`Completed: ${label} (${duration}ms)`);
            return result;
        } catch (err) {
            const duration = (performance.now() - start).toFixed(2);
            this.error(`Failed: ${label} (${duration}ms)`, err);
            throw err;
        }
    }
}

export const logger = new Logger();
export default logger;
