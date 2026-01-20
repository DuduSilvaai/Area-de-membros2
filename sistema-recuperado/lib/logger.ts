/**
 * Logger estruturado simplificado
 * Compatível com Next.js e edge runtime
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
    [key: string]: unknown;
}

// Campos sensíveis que devem ser redactados
const SENSITIVE_FIELDS = [
    'password',
    'token',
    'email',
    'apiKey',
    'secret',
    'authorization',
    'cookie',
];

/**
 * Redacta campos sensíveis do contexto de log
 */
function redactSensitiveData(obj: LogContext): LogContext {
    const result: LogContext = {};

    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();

        // Verificar se é campo sensível
        if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
            result[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            result[key] = redactSensitiveData(value as LogContext);
        } else {
            result[key] = value;
        }
    }

    return result;
}

/**
 * Formata mensagem de log
 */
function formatLog(level: LogLevel, context: LogContext, message: string): string {
    const timestamp = new Date().toISOString();
    const safeContext = redactSensitiveData(context);

    if (isDevelopment) {
        return `[${timestamp}] ${level.toUpperCase()}: ${message} ${JSON.stringify(safeContext)}`;
    }

    // Em produção, output JSON estruturado
    return JSON.stringify({
        timestamp,
        level,
        message,
        ...safeContext,
    });
}

/**
 * Logger principal
 */
const logger = {
    debug: (context: LogContext, message: string) => {
        if (isDevelopment) {
            console.debug(formatLog('debug', context, message));
        }
    },

    info: (context: LogContext, message: string) => {
        console.info(formatLog('info', context, message));
    },

    warn: (context: LogContext, message: string) => {
        console.warn(formatLog('warn', context, message));
    },

    error: (context: LogContext, message: string) => {
        console.error(formatLog('error', context, message));
    },
};

// Export named para uso mais simples
export const log = logger;

export default logger;
