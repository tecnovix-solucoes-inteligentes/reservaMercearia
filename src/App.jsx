import React, { useEffect } from 'react'
import useReservationStore from './store/reservationStore'
import { ProgressBar } from './components/Layout/ProgressBar'
import { StepPersonalData } from './components/FormSteps/StepPersonalData'
import { StepReservationType } from './components/FormSteps/StepReservationType'
import { StepReservationDetails } from './components/FormSteps/StepReservationDetails'
import { StepSummary } from './components/FormSteps/StepSummary'
import { useFormPersistence } from './hooks/useFormPersistence'

function App() {
  const currentStep = useReservationStore((state) => state.currentStep)

  // Initialize form persistence
  useFormPersistence()

  // Process offline queue when app loads
  useEffect(() => {
    const processOfflineReservations = async () => {
      if (navigator.onLine) {
        const offlineQueue = localStorage.getItem('offlineReservations')
        if (offlineQueue) {
          const { processOfflineQueue } = await import('./lib/api')
          processOfflineQueue()
        }
      }
    }

    processOfflineReservations()
  }, [])

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepPersonalData />
      case 2:
        return <StepReservationType />
      case 3:
        return <StepReservationDetails />
      case 4:
        return <StepSummary />
      default:
        return <StepPersonalData />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reserva de Mesa
          </h1>
          <p className="text-gray-600">
            Complete o formulário para fazer sua reserva
          </p>
        </div>

        {/* Progress Bar */}
        <ProgressBar />

        {/* Form Steps */}
        <div className="transition-all duration-300">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>© 2025 Mercearia. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}

export default App