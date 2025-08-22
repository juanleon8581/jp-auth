/**
 * Expresiones regulares para validaciones de datos
 */

/**
 * Validación para nombres y apellidos
 * Permite letras (incluye acentos), espacios y caracteres especiales del español
 */
export const NAME_LASTNAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

/**
 * Validación para contraseñas seguras
 * Requiere al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial
 */
export const SECURE_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]+$/;

/**
 * Validación para emails (básica)
 * Nota: Zod ya maneja la validación completa de email
 */
export const EMAIL_BASIC_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validación para números de teléfono (formato internacional)
 */
export const PHONE_INTERNATIONAL_REGEX = /^\+[1-9]\d{2,14}$/;

/**
 * Validación para códigos postales (formato general)
 */
export const POSTAL_CODE_REGEX = /^[0-9]{4,10}$/;

/**
 * Validación para URLs
 */
export const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/=]*)?$/;