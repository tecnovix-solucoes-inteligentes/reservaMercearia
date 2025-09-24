import React, { useEffect } from 'react'
import useReservationStore from './store/reservationStore'
import { ProgressBar } from './components/Layout/ProgressBar'
import { StepPersonalData } from './components/FormSteps/StepPersonalData'
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
        return <StepReservationDetails />
      case 3:
        return <StepSummary />
      default:
        return <StepPersonalData />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Reserva de Mesa
          </h1>
          <p className="text-gray-600 text-lg">
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