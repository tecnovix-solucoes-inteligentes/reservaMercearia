import React, { useState } from 'react'
import useReservationStore from '../../store/reservationStore'
import { useN8N } from '../../hooks/useN8N'
import {
  formatDateBR,
  getReservationTypeLabel,
  getLocationLabel,
  getMenuTypeLabel,
} from '../../lib/utils'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export function StepSummary() {
  const {
    formData,
    previousStep,
    getSubmissionData,
    clearFormData,
    submitSuccess,
    submitError,
    submitting,
  } = useReservationStore()

  const { submitReservation } = useN8N()
  const [localSubmitError, setLocalSubmitError] = useState(null)

  const handleSubmit = async () => {
    setLocalSubmitError(null)

    try {
      const submissionData = getSubmissionData()
      const result = await submitReservation(submissionData)

      if (result.success) {
        // Clear form data after successful submission
        setTimeout(() => {
          clearFormData()
        }, 3000)
      }
    } catch (error) {
      setLocalSubmitError(error.message || 'Erro ao enviar reserva')
    }
  }

  if (submitSuccess) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h2 className="text-2xl font-bold text-center">
              Reserva Enviada com Sucesso!
            </h2>
            <p className="text-center text-gray-600">
              Sua reserva foi recebida e você receberá uma confirmação por e-mail.
            </p>
            <Button
              onClick={() => clearFormData()}
              variant="outline"
              className="mt-4"
            >
              Fazer Nova Reserva
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const displayError = localSubmitError || submitError

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Resumo da Reserva</CardTitle>
        <CardDescription>
          Revise os detalhes da sua reserva antes de enviar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Data Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Dados Pessoais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
            <div>
              <span className="text-sm text-gray-600">Nome:</span>
              <p className="font-medium">{formData.nome}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">E-mail:</span>
              <p className="font-medium">{formData.email}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Telefone:</span>
              <p className="font-medium">{formData.telefone}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Data de Nascimento:</span>
              <p className="font-medium">{formatDateBR(formData.dataNascimento)}</p>
            </div>
          </div>
        </div>

        {/* Reservation Type Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Tipo de Reserva</h3>
          <div className="pl-4 space-y-2">
            <div>
              <span className="text-sm text-gray-600">Tipo:</span>
              <p className="font-medium">
                {getReservationTypeLabel(formData.tipoReserva)}
              </p>
            </div>

            {formData.tipoReserva === 'aniversario' && formData.reservaPainel && (
              <>
                <div>
                  <Badge variant="secondary">Painel de Aniversário Reservado</Badge>
                </div>
                {formData.fotoPainelPreview && (
                  <div>
                    <span className="text-sm text-gray-600">Foto do Painel:</span>
                    <img
                      src={formData.fotoPainelPreview}
                      alt="Foto do Painel"
                      className="mt-2 max-h-32 rounded"
                    />
                  </div>
                )}
                {formData.orientacoesPainel && (
                  <div>
                    <span className="text-sm text-gray-600">
                      Orientações do Painel:
                    </span>
                    <p className="font-medium">{formData.orientacoesPainel}</p>
                  </div>
                )}
              </>
            )}

            {formData.tipoReserva === 'confraternizacao' && (
              <>
                <div>
                  <span className="text-sm text-gray-600">Tipo de Cardápio:</span>
                  <p className="font-medium">
                    {getMenuTypeLabel(formData.tipoCardapio)}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Orientações/Detalhes da Confraternização:</span>
                  <p className="font-medium">{formData.orientacoesCompra}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Reservation Details Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Detalhes da Reserva</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
            <div>
              <span className="text-sm text-gray-600">Data:</span>
              <p className="font-medium">{formatDateBR(formData.dataReserva)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Horário:</span>
              <p className="font-medium">{formData.horarioDesejado}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Quantidade de Pessoas:</span>
              <p className="font-medium">{formData.quantidadePessoas}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Local:</span>
              <p className="font-medium">
                {getLocationLabel(formData.localDesejado)}
              </p>
            </div>
          </div>
          {formData.observacoes && (
            <div className="pl-4">
              <span className="text-sm text-gray-600">Observações:</span>
              <p className="font-medium">{formData.observacoes}</p>
            </div>
          )}
        </div>

        {/* Error message */}
        {displayError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">
                Erro ao enviar reserva
              </p>
              <p className="text-sm text-red-600 mt-1">{displayError}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={previousStep}
            disabled={submitting}
          >
            Voltar
          </Button>
          <Button
            onClick={handleSubmit}
            size="lg"
            disabled={submitting}
            className="min-w-[120px]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Confirmar Reserva'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}