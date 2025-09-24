import { useState, useCallback } from 'react'
import { checkPanelAvailability, submitReservation } from '../lib/api'
import useReservationStore from '../store/reservationStore'

export function useN8N() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const {
    setCheckingPanelAvailability,
    setPanelAvailability,
    setPanelAvailabilityError,
    setSubmitting,
    setSubmitError,
    setSubmitSuccess,
  } = useReservationStore()

  const checkPanelAvailabilityHandler = useCallback(async (date) => {
    setCheckingPanelAvailability(true)
    setPanelAvailabilityError(null)

    try {
      const result = await checkPanelAvailability(date)
      setPanelAvailability(result)
      return result
    } catch (err) {
      const errorMessage = err.message || 'Erro ao verificar disponibilidade'
      setPanelAvailabilityError(errorMessage)
      return null
    } finally {
      setCheckingPanelAvailability(false)
    }
  }, [setCheckingPanelAvailability, setPanelAvailability, setPanelAvailabilityError])

  const submitReservationHandler = useCallback(async (data) => {
    setSubmitting(true)
    setSubmitError(null)
    setError(null)

    try {
      const result = await submitReservation(data)

      if (result.success) {
        setSubmitSuccess()
        return result
      }

      throw new Error('Erro ao processar reserva')
    } catch (err) {
      const errorMessage = err.message || 'Erro ao enviar reserva'
      setSubmitError(errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [setSubmitting, setSubmitError, setSubmitSuccess])

  return {
    loading,
    error,
    checkPanelAvailability: checkPanelAvailabilityHandler,
    submitReservation: submitReservationHandler,
  }
}