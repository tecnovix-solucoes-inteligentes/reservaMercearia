import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { reservationDetailsSchema } from '../../lib/validations'
import { locationOptions } from '../../lib/utils'
import useReservationStore from '../../store/reservationStore'
import { useN8N } from '../../hooks/useN8N'
import { getAvailabilityConfig } from '../../lib/api'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'

export function StepReservationDetails() {
  const {
    formData,
    updateFormData,
    nextStep,
    previousStep,
    checkingPanelAvailability,
    panelAvailable,
    panelSlotsUsed,
    panelAvailabilityError,
  } = useReservationStore()

  const { checkPanelAvailability } = useN8N()
  const [dateDebounce, setDateDebounce] = useState(null)
  const [panelMessage, setPanelMessage] = useState('')
  const [availableTimeSlots, setAvailableTimeSlots] = useState([])
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [dateAvailable, setDateAvailable] = useState(true)
  const [availabilityMessage, setAvailabilityMessage] = useState('')
  const [availabilityConfig, setAvailabilityConfig] = useState(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reservationDetailsSchema),
    defaultValues: {
      quantidadePessoas: formData.quantidadePessoas || 1,
      dataReserva: formData.dataReserva || '',
      horarioDesejado: formData.horarioDesejado || '',
      localDesejado: formData.localDesejado || '',
      observacoes: formData.observacoes || '',
    },
  })

  const watchedDate = watch('dataReserva')

  // Load availability configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getAvailabilityConfig()
        setAvailabilityConfig(config)
      } catch (error) {
        console.error('Error loading availability config:', error)
        // Use defaults if API fails
        setAvailabilityConfig({
          defaultTimeSlots: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
          blockedDates: [],
          exceptions: [],
          blockedWeekdays: [0],
          message: ''
        })
      }
    }
    loadConfig()
  }, [])

  // Check date availability based on configuration
  useEffect(() => {
    if (watchedDate && availabilityConfig) {
      const date = new Date(watchedDate + 'T00:00:00') // Ensure correct date parsing
      const now = new Date()
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Check if date is in the past
      if (date < today) {
        setDateAvailable(false)
        setAvailabilityMessage('Não é possível fazer reservas para datas passadas')
        setAvailableTimeSlots([])
        return
      }

      // Check if it's same day reservation after 12:00 PM
      if (date.getTime() === today.getTime() && now.getHours() >= 12) {
        setDateAvailable(false)
        setAvailabilityMessage('As reservas para hoje já foram encerradas')
        setAvailableTimeSlots([])
        return
      }

      const weekday = date.getDay()
      const dateStr = watchedDate

      // FIRST: Check for exceptions (exceptions override everything)
      const exception = availabilityConfig.exceptions.find(e => e.date === dateStr)
      if (exception) {
        if (exception.timeSlots && exception.timeSlots.length > 0) {
          // Exception date with special time slots (overrides weekday blocks)
          setDateAvailable(true)
          setAvailableTimeSlots(exception.timeSlots)
          setAvailabilityMessage(exception.message || '')

          // Still check panel availability for exceptions
          if (formData.tipoReserva === 'aniversario' && formData.reservaPainel) {
            clearTimeout(dateDebounce)
            const timeout = setTimeout(async () => {
              const result = await checkPanelAvailability(watchedDate)
              if (result) {
                setPanelMessage(result.message || '')
              }
            }, 500)
            setDateDebounce(timeout)
          }
        } else {
          // Exception with empty timeSlots means closed
          setDateAvailable(false)
          setAvailabilityMessage(exception.message || 'Data indisponível para reservas')
          setAvailableTimeSlots([])
        }
        return
      }

      // SECOND: Check if date is in blocked dates list
      if (availabilityConfig.blockedDates.includes(dateStr)) {
        setDateAvailable(false)
        setAvailabilityMessage('Data indisponível para reservas')
        setAvailableTimeSlots([])
        return
      }

      // THIRD: Check if weekday is blocked (only if no exception)
      if (availabilityConfig.blockedWeekdays.includes(weekday)) {
        setDateAvailable(false)
        setAvailabilityMessage(weekday === 0 ? 'Não atendemos aos domingos' : 'Dia não disponível')
        setAvailableTimeSlots([])
        return
      }

      // FINALLY: Use default time slots for normal days
      setDateAvailable(true)
      setAvailableTimeSlots(availabilityConfig.defaultTimeSlots)
      setAvailabilityMessage('')

      // Check panel availability if needed
      if (formData.tipoReserva === 'aniversario' && formData.reservaPainel) {
        clearTimeout(dateDebounce)
        const timeout = setTimeout(async () => {
          const result = await checkPanelAvailability(watchedDate)
          if (result) {
            setPanelMessage(result.message || '')
          }
        }, 500)
        setDateDebounce(timeout)
        return () => clearTimeout(timeout)
      }
    }
  }, [watchedDate, availabilityConfig, formData.tipoReserva, formData.reservaPainel])

  const onSubmit = (data) => {
    // If anniversary with panel and panel not available, prevent submission
    if (
      formData.tipoReserva === 'aniversario' &&
      formData.reservaPainel &&
      panelAvailable === false
    ) {
      return
    }

    updateFormData(data)
    nextStep()
  }

  // Get today's date for minimum date validation
  const today = new Date().toISOString().split('T')[0]

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Detalhes da Reserva</CardTitle>
        <CardDescription>
          Informe os detalhes da sua reserva.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidadePessoas">Quantidade de Pessoas *</Label>
              <Input
                id="quantidadePessoas"
                type="number"
                min="1"
                max="50"
                {...register('quantidadePessoas', { valueAsNumber: true })}
              />
              {errors.quantidadePessoas && (
                <p className="text-sm text-red-500">
                  {errors.quantidadePessoas.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataReserva">Data da Reserva *</Label>
              <Input
                id="dataReserva"
                type="date"
                min={today}
                {...register('dataReserva')}
              />
              {errors.dataReserva && (
                <p className="text-sm text-red-500">{errors.dataReserva.message}</p>
              )}
              {watchedDate && !dateAvailable && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{availabilityMessage || 'Data não disponível'}</span>
                </div>
              )}
              {watchedDate && dateAvailable && availabilityMessage && (
                <div className="flex items-center gap-2 text-blue-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{availabilityMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Panel availability status */}
          {formData.tipoReserva === 'aniversario' &&
            formData.reservaPainel &&
            watchedDate && (
              <div className="p-3 rounded-lg bg-gray-50 border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Disponibilidade do Painel
                  </span>
                  {checkingPanelAvailability ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Verificando...
                    </Badge>
                  ) : panelAvailable === true ? (
                    <Badge variant="success" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {panelMessage || `Disponível (${2 - panelSlotsUsed} vaga${2 - panelSlotsUsed !== 1 ? 's' : ''})`}
                    </Badge>
                  ) : panelAvailable === false ? (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      {panelMessage || 'Indisponível (Limite atingido)'}
                    </Badge>
                  ) : null}
                </div>
                {panelAvailable === false && panelMessage && (
                  <p className="text-xs text-red-600 mt-2">
                    {panelMessage}
                  </p>
                )}
              </div>
            )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="horarioDesejado">Horário Desejado *</Label>
              <Select
                id="horarioDesejado"
                {...register('horarioDesejado')}
                disabled={!watchedDate || !dateAvailable || availableTimeSlots.length === 0}
              >
                <option value="">
                  {!watchedDate
                    ? 'Selecione primeiro a data'
                    : !dateAvailable
                    ? 'Data indisponível'
                    : availableTimeSlots.length === 0
                    ? 'Carregando horários...'
                    : 'Selecione um horário'}
                </option>
                {availableTimeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </Select>
              {errors.horarioDesejado && (
                <p className="text-sm text-red-500">
                  {errors.horarioDesejado.message}
                </p>
              )}
              {!watchedDate && (
                <p className="text-sm text-gray-500">
                  Selecione a data para ver os horários disponíveis
                </p>
              )}
              {watchedDate && dateAvailable && availableTimeSlots.length === 0 && !availabilityConfig && (
                <p className="text-sm text-yellow-600">
                  Carregando horários disponíveis...
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="localDesejado">Local Desejado *</Label>
              <Select id="localDesejado" {...register('localDesejado')}>
                <option value="">Selecione um local</option>
                {locationOptions.map((location) => (
                  <option key={location.value} value={location.value}>
                    {location.label}
                  </option>
                ))}
              </Select>
              {errors.localDesejado && (
                <p className="text-sm text-red-500">{errors.localDesejado.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Alguma observação especial sobre sua reserva?"
              {...register('observacoes')}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500">
              {watch('observacoes')?.length || 0}/1000 caracteres
            </p>
            {errors.observacoes && (
              <p className="text-sm text-red-500">{errors.observacoes.message}</p>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={previousStep}>
              Voltar
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={
                !dateAvailable ||
                (formData.tipoReserva === 'aniversario' &&
                  formData.reservaPainel &&
                  panelAvailable === false)
              }
            >
              Próximo
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}