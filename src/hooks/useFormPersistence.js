import { useEffect } from 'react'
import useReservationStore from '../store/reservationStore'

export function useFormPersistence() {
  const formData = useReservationStore((state) => state.formData)
  const updateFormData = useReservationStore((state) => state.updateFormData)

  // Auto-save form data to localStorage
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem('reservationFormBackup', JSON.stringify(formData))
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [formData])

  // Restore form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('reservationFormBackup')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        updateFormData(parsed)
        localStorage.removeItem('reservationFormBackup')
      } catch (error) {
        console.error('Error restoring form data:', error)
      }
    }
  }, [])

  return {
    formData,
    updateFormData,
  }
}