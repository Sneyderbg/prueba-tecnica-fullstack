import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});

type ErrorTypes = Partial<
  Record<
    keyof typeof authClient.$ERROR_CODES,
    {
      en: string;
      es: string;
    }
  >
>;

const errorCodes = {
  USER_ALREADY_EXISTS: {
    en: 'User already registered',
    es: 'Usuario ya registrado',
  },
  INVALID_EMAIL: {
    en: 'Invalid email',
    es: 'Correo electrónico inválido',
  },
  INVALID_PASSWORD: {
    en: 'Invalid password',
    es: 'Contraseña inválida',
  },
  USER_NOT_FOUND: {
    en: 'User not found',
    es: 'Usuario no encontrado',
  },
  FAILED_TO_CREATE_USER: {
    en: 'Failed to create user',
    es: 'Error al crear usuario',
  },
  FAILED_TO_CREATE_SESSION: {
    en: 'Failed to create session',
    es: 'Error al crear sesión',
  },
  FAILED_TO_UPDATE_USER: {
    en: 'Failed to update user',
    es: 'Error al actualizar usuario',
  },
  FAILED_TO_GET_SESSION: {
    en: 'Failed to get session',
    es: 'Error al obtener sesión',
  },
  USER_ALREADY_HAS_PASSWORD: {
    en: 'User already has password',
    es: 'El usuario ya tiene contraseña',
  },
  INVALID_EMAIL_OR_PASSWORD: {
    en: 'Invalid email or password',
    es: 'Correo electrónico o contraseña inválidos',
  },
  ACCOUNT_NOT_FOUND: {
    en: 'Account not found',
    es: 'Cuenta no encontrada',
  },
  CREDENTIAL_ACCOUNT_NOT_FOUND: {
    en: 'Credential account not found',
    es: 'Cuenta de credenciales no encontrada',
  },
  EMAIL_CAN_NOT_BE_UPDATED: {
    en: 'Email can not be updated',
    es: 'El correo electrónico no puede ser actualizado',
  },
  EMAIL_NOT_VERIFIED: {
    en: 'Email not verified',
    es: 'Correo electrónico no verificado',
  },
  FAILED_TO_GET_USER_INFO: {
    en: 'Failed to get user info',
    es: 'Error al obtener información del usuario',
  },
  FAILED_TO_UNLINK_LAST_ACCOUNT: {
    en: 'Failed to unlink last account',
    es: 'Error al desvincular la última cuenta',
  },
  ID_TOKEN_NOT_SUPPORTED: {
    en: 'Id token not supported',
    es: 'Token de ID no soportado',
  },
  INVALID_TOKEN: {
    en: 'Invalid token',
    es: 'Token inválido',
  },
  PASSWORD_TOO_LONG: {
    en: 'Password too long',
    es: 'Contraseña demasiado larga',
  },
  PASSWORD_TOO_SHORT: {
    en: 'Password too short',
    es: 'Contraseña demasiado corta',
  },
  PROVIDER_NOT_FOUND: {
    en: 'Provider not found',
    es: 'Proveedor no encontrado',
  },
  SESSION_EXPIRED: {
    en: 'Session expired',
    es: 'Sesión expirada',
  },
  SOCIAL_ACCOUNT_ALREADY_LINKED: {
    en: 'Social account already linked',
    es: 'Cuenta social ya vinculada',
  },
  USER_EMAIL_NOT_FOUND: {
    en: 'User email not found',
    es: 'Correo electrónico del usuario no encontrado',
  },
} satisfies ErrorTypes;

export function getErrorMessage(code: string, lang: 'en' | 'es') {
  if (code in errorCodes) {
    return errorCodes[code as keyof typeof errorCodes][lang];
  }
  return '';
}
