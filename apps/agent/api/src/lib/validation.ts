import { z } from 'zod'

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  full_name: z.string().min(2, 'Le nom complet doit contenir au moins 2 caractères'),
  tenant_slug: z.string()
    .min(3, 'Le slug doit contenir au moins 3 caractères')
    .max(50, 'Le slug ne peut pas dépasser 50 caractères')
    .regex(/^[a-z0-9\-]+$/, 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets'),
  tenant_name: z.string().min(2, 'Le nom de l\'organisation doit contenir au moins 2 caractères')
})

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis')
})
