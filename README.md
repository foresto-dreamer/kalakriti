# KisanSetu

KisanSetu is a digitized crop procurement scheduling and live queue tracking platform designed for Indian agriculture. It connects farmers directly with APMC Mandis (procurement centers), reducing yard waiting times from days to minutes through real-time telemetry, digital scheduling, and automated queue monitoring.

## Short Description
KisanSetu provides farmers with an online appointment scheduler, scannable digital gate passes for contactless APMC entry, real-time yard tractor-queue telemetry, and direct benefit transfer (DBT) payment verification. The platform features native multi-language support to ensure accessibility for regional farmers across India.

## Tech Stack
The application is built using modern web technologies:
- **Core Framework:** Next.js 15 (App Router with SSR & Client components)
- **Backend & Database:** Supabase (Database & Authentication services)
- **Programming Language:** TypeScript
- **Styling:** Tailwind CSS (premium custom dark/light modes)
- **State Management:** Custom React hooks (with LocalStorage synchronisation across operator/admin views)
- **Utilities:** QR Code generation (using the `qrcode` library)
- **Localization (i18n):** Custom translations hook supporting five languages: English, Hindi (हिन्दी), Punjabi (ਪੰਜਾਬੀ), Bengali (বাংলা), and Odia (ଓଡ଼ିଆ)

## How to Run Locally

### Prerequisites
- Node.js (v18.x or higher)
- npm (v10.x or higher)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rajatava06/kalakriti.git
   cd kalakriti
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Start the production server:**
   ```bash
   npm run start
   ```
