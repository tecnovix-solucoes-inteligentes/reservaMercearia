import React from 'react'
import useReservationStore from '../../store/reservationStore'
import { cn } from '../../lib/utils'
import { Check } from 'lucide-react'

const steps = [
  { number: 1, label: 'Dados Pessoais' },
  { number: 2, label: 'Tipo de Reserva' },
  { number: 3, label: 'Detalhes' },
  { number: 4, label: 'Confirmação' },
]

export function ProgressBar() {
  const currentStep = useReservationStore((state) => state.currentStep)

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const isCompleted = currentStep > step.number
            const isActive = currentStep === step.number

            return (
              <div
                key={step.number}
                className="flex flex-col items-center"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                    isCompleted
                      ? 'bg-primary text-white'
                      : isActive
                      ? 'bg-primary text-white ring-4 ring-primary/20'
                      : 'bg-gray-200 text-gray-600'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium text-center hidden sm:block',
                    isActive ? 'text-primary' : 'text-gray-500'
                  )}
                >
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile step label */}
      <div className="mt-4 text-center sm:hidden">
        <p className="text-sm font-medium text-primary">
          Passo {currentStep} de {steps.length}
        </p>
        <p className="text-xs text-gray-500">
          {steps[currentStep - 1].label}
        </p>
      </div>
    </div>
  )
}