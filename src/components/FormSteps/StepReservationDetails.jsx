import React, { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { reservationDetailsSchema } from '../../lib/validations'
import {
  locationOptions,
  reservationTypes,
  menuTypes,
  isPanelAllowedLocation,
} from '../../lib/utils'
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
  const watchedQuantidadePessoas = watch('quantidadePessoas')
  const watchedLocalDesejado = watch('localDesejado')

  // Handle type change
  const handleTypeChange = (type) => {
    updateFormData({
      tipoReserva: type,
      // Reset conditional fields when changing type
      reservaPainel: false,
      tipoCardapio: '',
    })
  }


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
              const result = await checkPanelAvailability(watchedDate, watchedQuantidadePessoas, watchedLocalDesejado)
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
          const result = await checkPanelAvailability(watchedDate, watchedQuantidadePessoas, watchedLocalDesejado)
          if (result) {
            setPanelMessage(result.message || '')
          }
        }, 500)
        setDateDebounce(timeout)
        return () => clearTimeout(timeout)
      }
    }
  }, [watchedDate, watchedQuantidadePessoas, watchedLocalDesejado, availabilityConfig, formData.tipoReserva, formData.reservaPainel])

  const onSubmit = (data) => {
    // Validate reservation type
    if (!formData.tipoReserva) {
      return
    }

    // Validate conditional fields for anniversary
    if (formData.tipoReserva === 'aniversario' && formData.reservaPainel) {
      // If panel not available, prevent submission
      if (panelAvailable === false) {
        return
      }
      // Additional validation: panel requires minimum 10 people
      if (watchedQuantidadePessoas < 10) {
        return
      }
      // Additional validation: panel requires allowed location
      if (!isPanelAllowedLocation(watchedLocalDesejado)) {
        return
      }
    }

    // Validate conditional fields for party
    if (formData.tipoReserva === 'confraternizacao') {
      if (!formData.tipoCardapio) {
        return
      }
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
          Informe o tipo e os detalhes da sua reserva.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Reservation Type Section */}
          <div className="space-y-3">
            <Label>Tipo de Reserva *</Label>
            <div className="space-y-2">
              {reservationTypes.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={type.value}
                    name="tipoReserva"
                    value={type.value}
                    checked={formData.tipoReserva === type.value}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="h-4 w-4 border-gray-300 text-orange-custom-600 focus:ring-2 focus:ring-orange-custom-500"
                  />
                  <Label htmlFor={type.value} className="cursor-pointer">
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Conditional fields for Aniversário */}
          {formData.tipoReserva === 'aniversario' && (
            <div className="space-y-4 p-4 border border-custom rounded-lg bg-gray-800">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="reservaPainel"
                  checked={formData.reservaPainel || false}
                  onChange={(e) =>
                    updateFormData({ reservaPainel: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-orange-custom-600 focus:ring-2 focus:ring-orange-custom-500"
                />
                <Label htmlFor="reservaPainel" className="cursor-pointer">
                  Reservar Painel de Aniversário
                </Label>
              </div>

              {formData.reservaPainel && (
                <>
                  <div className="space-y-3">
                    <Label className="text-white font-semibold">Modelo do Painel</Label>
                    <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                      <div className="flex flex-col items-center space-y-3">
                        <img
                          src="/assets/painel.webp"
                          alt="Modelo do Painel de Aniversário"
                          className="max-h-64 mx-auto rounded-lg shadow-lg"
                        />
                        <p className="text-sm text-gray-300 text-center">
                          Este é o modelo do painel de aniversário que será disponibilizado gratuitamente
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-white font-semibold">
                      Orientações
                    </Label>
                    <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-orange-custom-600 font-semibold mb-2">
                            🎉 Orientações do Painel de Aniversário
                          </p>
                          <ul className="space-y-1 text-gray-200 ml-4">
                            <li>• Painel gratuito: inclui apenas a estrutura (não acompanha decoração).</li>
                            <li>• O painel só pode ser colocado na área externa.</li>
                            <li>• Válido para reservas a partir de 10 pessoas.</li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-orange-custom-600 font-semibold mb-2">
                            ✨ Arco de balões (opcional)
                          </p>
                          <ul className="space-y-1 text-gray-200 ml-4">
                            <li>• R$ 80 com balões inclusos (até 2 cores).</li>
                            <li>• R$ 40 caso o cliente traga os balões.</li>
                            <li>• Solicitação com mínimo de 2 dias de antecedência e pagamento via Pix.</li>
                            <li>• A solicitação deve ser confirmada previamente via WhatsApp.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Conditional fields for Confraternização */}
          {formData.tipoReserva === 'confraternizacao' && (
            <div className="space-y-4 p-4 border border-custom rounded-lg bg-gray-800">
              <div className="space-y-2">
                <Label>Tipo de Cardápio *</Label>
                <div className="space-y-2">
                  {menuTypes.map((menu) => (
                    <div key={menu.value} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={menu.value}
                        name="tipoCardapio"
                        value={menu.value}
                        checked={formData.tipoCardapio === menu.value}
                        onChange={(e) => updateFormData({ tipoCardapio: e.target.value })}
                        className="h-4 w-4 border-gray-300 text-orange-custom-600 focus:ring-2 focus:ring-orange-custom-500"
                      />
                      <Label htmlFor={menu.value} className="cursor-pointer">
                        {menu.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-orange-custom-600 font-semibold mb-2">
                        Orientações:
                      </p>
                      <ul className="space-y-2 text-gray-200">
                        <li>• Nosso site nós temos todas as orientações sobre a confraternização de empresas.</li>
                        <li>• Link: <span className="text-orange-custom-400">[Link será adicionado]</span></li>
                        <li>• Dúvidas mandar via WhatsApp.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                placeholder="DD/MM/AAAA"
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
                <div className="flex items-center gap-2 text-orange-custom-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{availabilityMessage}</span>
                </div>
              )}
            </div>
          </div>


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
                <p className="text-sm text-gray-400">
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

          {/* Panel availability status */}
          {formData.tipoReserva === 'aniversario' &&
            formData.reservaPainel &&
            watchedDate && (
              <div className="p-3 rounded-lg bg-gray-800 border border-custom">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-white">
                    Disponibilidade do Painel
                  </span>
                  {checkingPanelAvailability ? (
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Verificando...
                    </Badge>
                  ) : panelAvailable === true ? (
                    <Badge variant="success" className="flex items-center gap-1 w-fit">
                      <CheckCircle className="h-3 w-3" />
                      {panelMessage || `Disponível (${2 - panelSlotsUsed} vaga${2 - panelSlotsUsed !== 1 ? 's' : ''})`}
                    </Badge>
                  ) : panelAvailable === false ? (
                    <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                      <XCircle className="h-3 w-3" />
                      {panelMessage || 'Indisponível (Limite atingido)'}
                    </Badge>
                  ) : null}
                </div>
                {panelAvailable === false && (
                  <div className="mt-3 space-y-2">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => updateFormData({ reservaPainel: false })}
                      className="w-full"
                    >
                      Remover Reserva do Painel
                    </Button>
                    <p className="text-xs text-gray-400 text-center">
                      Remova a reserva do painel ou altere os itens solicitados para continuar com o agendamento
                    </p>
                  </div>
                )}
              </div>
            )}

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Alguma observação especial sobre sua reserva?"
              {...register('observacoes')}
              maxLength={1000}
            />
            <p className="text-xs text-gray-400">
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
                !formData.tipoReserva ||
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