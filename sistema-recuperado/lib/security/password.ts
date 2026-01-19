/**
 * Secure password generation utilities
 */

import crypto from 'crypto';

/**
 * Generates a cryptographically secure random password
 * @param length - Length of the password (default: 16)
 * @returns Secure random password string
 */
export function generateSecurePassword(length: number = 16): string {
    // Use URL-safe base64 encoding for easy copying
    const bytes = Math.ceil((length * 3) / 4);
    return crypto.randomBytes(bytes).toString('base64url').slice(0, length);
}

/**
 * Validates password strength
 * @param password - Password to validate
 * @returns Object with isValid and errors array
 */
export function validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Senha deve ter no mínimo 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Senha deve conter pelo menos uma letra maiúscula');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Senha deve conter pelo menos uma letra minúscula');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Senha deve conter pelo menos um número');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push('Senha deve conter pelo menos um caractere especial');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Common weak passwords to reject
 */
const COMMON_PASSWORDS = [
    'password', 'Password', 'Password1', 'Password123',
    '12345678', '123456789', 'qwerty123', 'admin123',
    'Mudar123', 'Mudar123!', 'Test1234', 'Welcome1',
];

/**
 * Checks if password is in the common passwords list
 */
export function isCommonPassword(password: string): boolean {
    return COMMON_PASSWORDS.some(common =>
        password.toLowerCase() === common.toLowerCase()
    );
}
