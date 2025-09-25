import React, { useState, useRef } from 'react'
import useReservationStore from '../../store/reservationStore'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { reservationTypes, menuTypes, fileToBase64, compressImage } from '../../lib/utils'
import { Upload, X } from 'lucide-react'

export function StepReservationType() {
  const {
    formData,
    updateFormData,
    nextStep,
    previousStep,
    setFotoPainel,
    clearFotoPainel,
  } = useReservationStore()

  const [imagePreview, setImagePreview] = useState(formData.fotoPainelPreview)
  const [imageError, setImageError] = useState('')
  const fileInputRef = useRef(null)

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

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate conditional fields
    if (formData.tipoReserva === 'aniversario' && formData.reservaPainel) {
      if (!formData.fotoPainel) {
        setImageError('Por favor, envie uma foto para o painel')
        return
      }
      if (!formData.orientacoesPainel) {
        return
      }
    }

    if (formData.tipoReserva === 'confraternizacao') {
      if (!formData.tipoCardapio || !formData.orientacoesCompra) {
        return
      }
    }

    nextStep()
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Tipo de Reserva</CardTitle>
        <CardDescription>
          Selecione o tipo de reserva que deseja fazer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
                  <div className="space-y-2">
                    <Label>Foto para o Painel *</Label>
                    <div className="border-2 border-dashed rounded-lg p-4">
                      {!imagePreview ? (
                        <div
                          className="flex flex-col items-center justify-center cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-10 w-10 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-300">
                            Clique para enviar uma foto
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
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
                      value={formData.orientacoesPainel}
                      onChange={(e) =>
                        updateFormData({ orientacoesPainel: e.target.value })
                      }
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-400">
                      {formData.orientacoesPainel.length}/500 caracteres
                    </p>
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

              <div className="space-y-2">
                <Label htmlFor="orientacoesCompra">
                  Orientações/Detalhes da Confraternização *
                </Label>
                <Textarea
                  id="orientacoesCompra"
                  placeholder="Descreva suas preferências e necessidades especiais"
                  value={formData.orientacoesCompra}
                  onChange={(e) =>
                    updateFormData({ orientacoesCompra: e.target.value })
                  }
                  maxLength={500}
                />
                <p className="text-xs text-gray-400">
                  {formData.orientacoesCompra.length}/500 caracteres
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={previousStep}>
              Voltar
            </Button>
            <Button type="submit" size="lg">
              Próximo
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}