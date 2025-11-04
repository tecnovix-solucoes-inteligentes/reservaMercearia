# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **frontend-only React application** for a restaurant table reservation system ("Reserva Mercearia"). The application is a multi-step booking form that integrates with N8N automation platform for backend processing.

## Technology Stack

- **Frontend Framework**: React with Vite (or Next.js for SSR)
- **UI Components**: Shadcn/ui with Tailwind CSS
- **Form Management**: React Hook Form + Zod validation
- **State Management**: Zustand
- **HTTP Client**: Axios or native Fetch API
- **Image Upload**: Base64 encoding for webhook transmission
- **Deployment**: Docker with nginx
- **Environment Variables**: Vite env vars

## Key Architecture Decisions

1. **No Backend Code**: This is a frontend-only application. All business logic, validations, and data persistence are handled by N8N workflows via API calls.

2. **N8N Integration Points**:
   - **GET** `${VITE_N8N_API_URL}/check-panel-availability?date=YYYY-MM-DD` - Real-time check for anniversary panel availability (max 2/day)
   - **POST** `${VITE_N8N_WEBHOOK_URL}/booking` - Submit complete reservation form data

3. **Multi-Step Form Flow**:
   - **Step 1**: Personal Data (Dados Pessoais)
   - **Step 2**: Reservation Type (Tipo de Reserva) with conditional fields
   - **Step 3**: Reservation Details (Detalhes da Reserva)
   - **Step 4**: Summary and Confirmation (Resumo)

4. **State Management**: Zustand store for form state across steps with localStorage persistence for form recovery.

5. **Image Handling**: Client-side conversion to base64, with compression if > 2MB, max file size 5MB.

## Detailed Form Structure

### Step 1: Personal Data (Dados Pessoais)
```javascript
{
  nome: string,              // Required
  email: string,             // Required, email validation
  telefone: string,          // Required, Brazilian mask (XX) XXXXX-XXXX
  dataNascimento: Date       // Required, date picker
}
```

### Step 2: Reservation Type (Tipo de Reserva)
Options:
- **Aniversário** (Birthday)
- **Confraternização** (Corporate/Group Event)
- **Reunião de Família ou Amigos** (Family/Friends Gathering)

#### Conditional Logic:

**If Aniversário:**
```javascript
{
  tipo: "aniversario",
  reservaPainel: boolean,        // Checkbox "Reservar Painel de Aniversário"
  // If reservaPainel = true:
  fotoPainel: string,            // Base64 image (jpg/png, max 5MB)
  orientacoesPainel: string      // Textarea for panel instructions
}
```
- Must check panel availability when date is selected in Step 3
- Show availability badge (✅ Available / ❌ Unavailable - Limit of 2 reached)

**If Confraternização:**
```javascript
{
  tipo: "confraternizacao",
  tipoCardapio: "normal" | "pacote_fechado",  // Radio options
  orientacoesCompra: string                    // Textarea for purchase instructions
}
```

**If Reunião de Família ou Amigos:**
```javascript
{
  tipo: "reuniao"
  // No additional fields, proceed to Step 3
}
```

### Step 3: Reservation Details (Detalhes da Reserva)
```javascript
{
  quantidadePessoas: number,    // Min: 4, Max: 50
  dataReserva: Date,            // Cannot be past date
  horarioDesejado: string,      // Select: 11:00 to 23:00
  localDesejado: string,        // Select options below
  observacoes: string           // Optional textarea
}
```

**Local Options:**
- "Próximo ao Palco" (proximo_palco)
- "Próximo ao Play" (proximo_play)
- "Área Externa" (area_externa)

**Special Behavior:**
- If tipo = "aniversario" AND reservaPainel = true:
  - Trigger panel availability check on date selection
  - Display real-time availability status

### Step 4: Summary (Resumo)
- Display all collected information
- Confirmation button to submit
- Back button to edit

## Complete Data Structure for N8N Webhook

```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "formId": "uuid-v4",
  "dadosPessoais": {
    "nome": "string",
    "email": "string",
    "telefone": "string",
    "dataNascimento": "YYYY-MM-DD"
  },
  "tipoReserva": {
    "tipo": "aniversario|confraternizacao|reuniao",
    "reservaPainel": boolean,
    "fotoPainel": "base64_string|null",
    "orientacoesPainel": "string|null",
    "tipoCardapio": "normal|pacote_fechado|null",
    "orientacoesCompra": "string|null"
  },
  "detalhesReserva": {
    "quantidadePessoas": number,
    "dataReserva": "YYYY-MM-DD",
    "horarioDesejado": "HH:MM",
    "localDesejado": "proximo_palco|proximo_play|area_externa",
    "observacoes": "string|null"
  }
}
```

## Panel Availability Check Implementation

```javascript
async function checkPanelAvailability(date) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_N8N_API_URL}/check-panel-availability?date=${date}`
    );
    const data = await response.json();
    // Expected response:
    // {
    //   available: boolean,
    //   count: number,
    //   message: string
    // }
    return data;
  } catch (error) {
    // Error handling with user-friendly message
  }
}
```

## Required Application States

```javascript
const states = {
  // Panel availability states
  checkingPanelAvailability: false,
  panelAvailabilityError: null,
  panelAvailable: null,
  panelSlotsUsed: 0,  // How many of 2 slots are used

  // Form submission states
  submitting: false,
  submitError: null,
  submitSuccess: false
}
```

## UI/UX Requirements

1. **Responsive Design**: Mobile-first approach
2. **Real-time Validation**: Immediate feedback on form fields
3. **Progress Indicator**: Visual stepper showing current/completed/pending steps
4. **Navigation**: Back/Next buttons with proper state management
5. **Local Persistence**: Save form data to localStorage on each change
6. **Loading States**:
   - Skeleton loader when checking panel availability
   - Spinner when submitting form
7. **Visual Feedback**:
   - Toast notifications for success/error
   - Real-time panel availability indicator
8. **Image Upload Features**:
   - Preview before upload
   - Client-side compression if > 2MB
   - Format validation (jpg/png only)

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Docker commands
docker build -t reserva-mercearia -f docker/Dockerfile .
docker-compose up -d
```

## Environment Variables (.env)

```env
VITE_N8N_API_URL=http://n8n-instance/api
VITE_N8N_WEBHOOK_URL=http://n8n-instance/webhook
VITE_MAX_FILE_SIZE=5242880
VITE_APP_NAME="Reservas Restaurant"
```

## Project Structure

```
/
├── docker/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── docker-compose.yml
├── public/
│   └── assets/
├── src/
│   ├── components/
│   │   ├── FormSteps/
│   │   │   ├── StepPersonalData.jsx
│   │   │   ├── StepReservationType.jsx
│   │   │   ├── StepReservationDetails.jsx
│   │   │   └── StepSummary.jsx
│   │   ├── ui/              # Shadcn components
│   │   └── Layout/
│   ├── hooks/
│   │   ├── useN8N.js
│   │   └── useFormPersistence.js
│   ├── lib/
│   │   ├── api.js
│   │   ├── validations.js
│   │   └── utils.js
│   ├── store/
│   │   └── reservationStore.js
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Special Features Implementation

### 1. Dynamic Panel Availability Check
- 500ms debounce when selecting date (only when panel is marked)
- Always real-time query to N8N (no caching)
- Clear visual indicator: ✅ Panel Available / ❌ Panel Unavailable

### 2. Optimized Image Upload
- Show preview before sending
- Client-side compression if > 2MB
- Convert to base64
- Validate format and size

### 3. Input Masks and Formatting
- Brazilian phone: (XX) XXXXX-XXXX
- Date format: DD/MM/YYYY display (store as YYYY-MM-DD)
- Time format: HH:MM

### 4. Error Handling
- Automatic retry (3 attempts) for webhook
- Offline mode fallback with local queue
- User-friendly error messages in Portuguese

## Docker Configuration

### Dockerfile
```dockerfile
# Build stage
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "3000:80"
    environment:
      - VITE_N8N_API_URL=${N8N_API_URL}
      - VITE_N8N_WEBHOOK_URL=${N8N_WEBHOOK_URL}
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
```

## Implementation Priorities

1. **Core Functionality First**:
   - Basic form structure and navigation
   - Field validations
   - N8N integration

2. **Enhanced Features**:
   - Panel availability checking
   - Image upload and compression
   - Local storage persistence

3. **Polish**:
   - Loading states and animations
   - Error handling and retries
   - Mobile optimization

## Current Status

**Note**: This project is currently in the specification phase. The codebase needs to be initialized with React + Vite setup and all components created according to this specification.