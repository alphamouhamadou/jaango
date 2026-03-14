import { z } from 'zod';

export const registerSchema = z.object({
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  telephone: z.string().regex(/^(\+221|0)?[0-9]{9}$/, 'Numéro de téléphone invalide'),
  adresse: z.string().min(5, 'L\'adresse doit contenir au moins 5 caractères'),
  numeroCNI: z.string().min(10, 'Numéro CNI invalide'),
  dateNaissance: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 18;
  }, 'Vous devez avoir au moins 18 ans'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export const loginSchema = z.object({
  telephone: z.string().min(9, 'Numéro de téléphone invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export const membreSchema = z.object({
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  dateNaissance: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 18;
  }, 'Le membre doit avoir au moins 18 ans'),
  numeroCNI: z.string().min(10, 'Numéro CNI invalide'),
  telephone: z.string().regex(/^(\+221|0)?[0-9]{9}$/, 'Numéro de téléphone invalide'),
  adresse: z.string().min(5, 'L\'adresse doit contenir au moins 5 caractères'),
});

export const demandePretSchema = z.object({
  typePret: z.enum(['SILVER', 'GOLD']),
  montant: z.number().positive('Le montant doit être positif'),
  membres: z.array(membreSchema).length(10, 'Vous devez ajouter exactement 10 membres'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MembreInput = z.infer<typeof membreSchema>;
export type DemandePretInput = z.infer<typeof demandePretSchema>;
