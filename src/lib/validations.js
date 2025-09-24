import { z } from 'zod'

// Step 1: Personal Data Schema
export const personalDataSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().regex(
    /^\(\d{2}\) \d{5}-\d{4}$/,
    'Telefone deve estar no formato (XX) XXXXX-XXXX'
  ),
  dataNascimento: z.string().refine((date) => {
    const birthDate = new Date(date)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    return age >= 18 && age <= 120
  }, 'Idade deve estar entre 18 e 120 anos'),
})

// Step 2: Reservation Type Schema
export const reservationTypeSchema = z.discriminatedUnion('tipoReserva', [
  z.object({
    tipoReserva: z.literal('aniversario'),
    reservaPainel: z.boolean(),
    fotoPainel: z.string().nullable(),
    orientacoesPainel: z.string().max(500, 'Máximo de 500 caracteres'),
  }),
  z.object({
    tipoReserva: z.literal('confraternizacao'),
    tipoCardapio: z.enum(['normal', 'pacote_fechado']),
    orientacoesCompra: z.string().max(500, 'Máximo de 500 caracteres'),
  }),
  z.object({
    tipoReserva: z.literal('reuniao'),
  }),
])

// Step 3: Reservation Details Schema
export const reservationDetailsSchema = z.object({
  quantidadePessoas: z.number()
    .min(1, 'Mínimo 1 pessoa')
    .max(50, 'Máximo 50 pessoas'),
  dataReserva: z.string().refine((date) => {
    const reservationDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return reservationDate >= today
  }, 'Data não pode ser no passado'),
  horarioDesejado: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
  localDesejado: z.enum(['', 'proximo_palco', 'proximo_play', 'area_externa'], {
    errorMap: () => ({ message: 'Por favor, selecione um local válido' }),
  }).refine((val) => val !== '', {
    message: 'Por favor, selecione um local válido'
  }),
  observacoes: z.string().max(1000, 'Máximo de 1000 caracteres').optional(),
})

// Complete form schema
export const completeFormSchema = z.object({
  ...personalDataSchema.shape,
  ...reservationDetailsSchema.shape,
  tipoReserva: z.string(),
  reservaPainel: z.boolean().optional(),
  fotoPainel: z.string().nullable().optional(),
  orientacoesPainel: z.string().optional(),
  tipoCardapio: z.string().optional(),
  orientacoesCompra: z.string().optional(),
})