import React from 'react'
import useReservationStore from '../../store/reservationStore'
import { cn } from '../../lib/utils'
import { Check } from 'lucide-react'

const steps = [
  { number: 1, label: 'Dados Pessoais' },
  { number: 2, label: 'Detalhes da Reserva' },
  { number: 3, label: 'Confirmação' },
]

export function ProgressBar() {
  const currentStep = useReservationStore((state) => state.currentStep)

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="relative">
        {/* Progress line - positioned between first and last step */}
        <div className="absolute top-5 left-5 right-5 h-1 bg-gray-200 rounded-full">
          <div
            className="h-full bg-orange-custom-600 rounded-full transition-all duration-500 ease-out"
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
                    'rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 shadow-sm',
                    isCompleted
                      ? 'w-12 h-12 bg-green-500 text-white shadow-green-200'
                      : isActive
                      ? 'w-10 h-10 bg-orange-custom-600 text-white ring-4 ring-orange-custom-200 shadow-orange-custom-200'
                      : 'w-10 h-10 bg-white border-2 border-gray-300 text-gray-400'
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
                    isActive ? 'text-orange-custom-600 font-semibold' : isCompleted ? 'text-green-600' : 'text-white'
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
        <p className="text-sm font-semibold text-orange-custom-600">
          Passo {currentStep} de {steps.length}
        </p>
        <p className="text-xs text-gray-300">
          {steps[currentStep - 1].label}
        </p>
      </div>
    </div>
  )
}