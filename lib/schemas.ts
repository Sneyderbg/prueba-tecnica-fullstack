import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .email('Por favor, ingresa un correo electrónico válido')
    .min(1, 'El correo electrónico es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(1, 'El nombre es requerido')
      .min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z
      .email('Por favor, ingresa un correo electrónico válido')
      .min(1, 'El correo electrónico es requerido'),
    password: z
      .string()
      .min(1, 'La contraseña es requerida')
      .min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z
      .string()
      .min(1, 'La confirmación de contraseña es requerida'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export const transactionSchema = z.object({
  concepto: z
    .string()
    .min(1, 'El concepto es requerido')
    .min(3, 'El concepto debe tener al menos 3 caracteres')
    .max(100, 'El concepto no puede tener más de 100 caracteres'),
  monto: z.number().refine((val) => val !== 0, {
    message: 'El monto no puede ser cero',
  }),
  fecha: z
    .string()
    .min(1, 'La fecha es requerida')
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'La fecha debe ser válida',
    }),
});

export const userUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres'),
  role: z.enum(['admin', 'user']),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type TransactionFormData = z.infer<typeof transactionSchema>;
export type UserUpdateFormData = z.infer<typeof userUpdateSchema>;
