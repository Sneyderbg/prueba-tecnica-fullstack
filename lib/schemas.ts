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

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
