import React, { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { reservationDetailsSchema } from '../../lib/validations'
import {
  locationOptions,
  reservationTypes,
  menuTypes,
  fileToBase64,
  compressImage
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
import { CheckCircle, XCircle, Loader2, AlertCircle, Upload, X } from 'lucide-react'

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
    setFotoPainel,
    clearFotoPainel,
  } = useReservationStore()

  const { checkPanelAvailability } = useN8N()
  const [dateDebounce, setDateDebounce] = useState(null)
  const [panelMessage, setPanelMessage] = useState('')
  const [availableTimeSlots, setAvailableTimeSlots] = useState([])
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [dateAvailable, setDateAvailable] = useState(true)
  const [availabilityMessage, setAvailabilityMessage] = useState('')
  const [availabilityConfig, setAvailabilityConfig] = useState(null)

  // Image upload states
  const [imagePreview, setImagePreview] = useState(formData.fotoPainelPreview)
  const [imageError, setImageError] = useState('')
  const fileInputRef = useRef(null)

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

  // Handle type change
  const handleTypeChange = (type) => {
    updateFormData({
      tipoReserva: type,
      // Reset conditional fields when changing type
      reservaPainel: false,
      fotoPainel: null,
      fotoPainelPreview: null,
      orientacoesPainel: '',
      tipoCardapio: '',
      orientacoesCompra: '',
    })
    setImagePreview(null)
    setImageError('')
  }

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImageError('')

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setImageError('Por favor, envie apenas imagens JPG ou PNG')
      return
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setImageError('A imagem deve ter no máximo 5MB')
      return
    }

    try {
      // Compress if needed
      const processedFile = await compressImage(file, 2)

      // Convert to base64
      const base64 = await fileToBase64(processedFile)

      // Create preview
      const preview = URL.createObjectURL(processedFile)
      setImagePreview(preview)
      setFotoPainel(base64, preview)
    } catch (error) {
      setImageError('Erro ao processar imagem. Tente novamente.')
      console.error('Error processing image:', error)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    clearFotoPainel()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
    // Validate reservation type
    if (!formData.tipoReserva) {
      return
    }

    // Validate conditional fields for anniversary
    if (formData.tipoReserva === 'aniversario' && formData.reservaPainel) {
      // Image is now optional, only validate if orientation is missing
      if (!formData.orientacoesPainel) {
        return
      }
      // If panel not available, prevent submission
      if (panelAvailable === false) {
        return
      }
    }

    // Validate conditional fields for party
    if (formData.tipoReserva === 'confraternizacao') {
      if (!formData.tipoCardapio || !formData.orientacoesCompra) {
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
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
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
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="reservaPainel"
                  checked={formData.reservaPainel || false}
                  onChange={(e) =>
                    updateFormData({ reservaPainel: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <Label htmlFor="reservaPainel" className="cursor-pointer">
                  Reservar Painel de Aniversário
                </Label>
              </div>

              {formData.reservaPainel && (
                <>
                  <div className="space-y-2">
                    <Label>Foto para o Painel (opcional)</Label>
                    <div className="border-2 border-dashed rounded-lg p-4">
                      {!imagePreview ? (
                        <div
                          className="flex flex-col items-center justify-center cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-10 w-10 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            Clique para enviar uma foto
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            JPG ou PNG, máx. 5MB
                          </p>
                        </div>
                      ) : (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-h-48 mx-auto rounded"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                    {imageError && (
                      <p className="text-sm text-red-500">{imageError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orientacoesPainel">
                      Orientações sobre o Painel *
                    </Label>
                    <Textarea
                      id="orientacoesPainel"
                      placeholder="Ex: Nome a ser escrito, mensagem especial, etc."
                      value={formData.orientacoesPainel || ''}
                      onChange={(e) =>
                        updateFormData({ orientacoesPainel: e.target.value })
                      }
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500">
                      {(formData.orientacoesPainel || '').length}/500 caracteres
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Conditional fields for Confraternização */}
          {formData.tipoReserva === 'confraternizacao' && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
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
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <Label htmlFor={menu.value} className="cursor-pointer">
                        {menu.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orientacoesCompra">
                  Orientações/Detalhes da Confraternização *
                </Label>
                <Textarea
                  id="orientacoesCompra"
                  placeholder="Descreva suas preferências e necessidades especiais"
                  value={formData.orientacoesCompra || ''}
                  onChange={(e) =>
                    updateFormData({ orientacoesCompra: e.target.value })
                  }
                  maxLength={500}
                />
                <p className="text-xs text-gray-500">
                  {(formData.orientacoesCompra || '').length}/500 caracteres
                </p>
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
                {panelAvailable === false && (
                  <div className="mt-3 space-y-2">
                    {panelMessage && (
                      <p className="text-xs text-red-600">
                        {panelMessage}
                      </p>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => updateFormData({ reservaPainel: false })}
                      className="w-full"
                    >
                      Remover Reserva do Painel
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      Remova a reserva do painel para continuar com o agendamento
                    </p>
                  </div>
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