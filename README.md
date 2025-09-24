# Sistema de Reservas - Mercearia

Sistema de reservas de mesa para restaurante, desenvolvido em React com integração ao N8N para processamento de dados.

## 🚀 Tecnologias

- React + Vite
- Tailwind CSS + Shadcn/ui
- React Hook Form + Zod
- Zustand (gerenciamento de estado)
- Axios (requisições HTTP)
- Docker (deployment)

## 📋 Funcionalidades

- ✅ Formulário multi-step para reservas
- ✅ Validação em tempo real
- ✅ Upload e compressão de imagens
- ✅ Verificação de disponibilidade de painel de aniversário
- ✅ Persistência de dados no localStorage
- ✅ Modo offline com fila de envio
- ✅ Interface responsiva

## 🛠️ Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com as URLs do seu N8N:
```env
VITE_N8N_API_URL=http://seu-n8n/api
VITE_N8N_WEBHOOK_URL=http://seu-n8n/webhook
```

## 💻 Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 🐳 Docker

### Build da imagem:
```bash
docker build -t reserva-mercearia -f docker/Dockerfile .
```

### Executar com docker-compose:
```bash
docker-compose -f docker/docker-compose.yml up -d
```

## 📝 Estrutura do Projeto

```
src/
├── components/
│   ├── FormSteps/       # Componentes dos steps do formulário
│   ├── Layout/          # Componentes de layout
│   └── ui/              # Componentes UI reutilizáveis
├── hooks/               # Custom React hooks
├── lib/                 # Utilitários e configurações
├── store/              # Gerenciamento de estado (Zustand)
└── App.jsx             # Componente principal
```

## 🔄 Fluxo do Formulário

1. **Dados Pessoais**: Nome, email, telefone, data de nascimento
2. **Tipo de Reserva**: Aniversário, Confraternização ou Reunião
3. **Detalhes**: Data, horário, quantidade de pessoas, local
4. **Confirmação**: Resumo e envio dos dados

## 🔗 Integração N8N

O sistema se comunica com o N8N em dois endpoints:

- **GET /check-panel-availability**: Verifica disponibilidade do painel de aniversário
- **POST /booking**: Envia os dados da reserva

## 📦 Build para Produção

O projeto está configurado para ser servido via nginx em um container Docker. O build de produção será otimizado e servido na porta 80.

## 📄 Licença

Propriedade privada - Todos os direitos reservados