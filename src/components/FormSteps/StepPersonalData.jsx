import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IMaskInput } from 'react-imask'
import { personalDataSchema } from '../../lib/validations'
import useReservationStore from '../../store/reservationStore'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'

export function StepPersonalData() {
  const { formData, updateFormData, nextStep } = useReservationStore()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(personalDataSchema),
    defaultValues: {
      nome: formData.nome || '',
      email: formData.email || '',
      telefone: formData.telefone || '',
      dataNascimento: formData.dataNascimento || '',
    },
  })

  const onSubmit = (data) => {
    updateFormData(data)
    nextStep()
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Dados Pessoais</CardTitle>
        <CardDescription>
          Por favor, preencha seus dados pessoais para continuar com a reserva.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              type="text"
              placeholder="Digite seu nome completo"
              {...register('nome')}
            />
            {errors.nome && (
              <p className="text-sm text-red-500">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone *</Label>
            <IMaskInput
              mask="(00) 00000-0000"
              value={formData.telefone}
              unmask={false}
              onAccept={(value) => {
                setValue('telefone', value)
                updateFormData({ telefone: value })
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="(11) 98765-4321"
            />
            {errors.telefone && (
              <p className="text-sm text-red-500">{errors.telefone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
            <Input
              id="dataNascimento"
              type="date"
              {...register('dataNascimento')}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.dataNascimento && (
              <p className="text-sm text-red-500">{errors.dataNascimento.message}</p>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg">
              Próximo
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}