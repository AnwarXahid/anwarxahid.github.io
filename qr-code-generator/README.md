# Standalone Static QR Code Generator (React + TypeScript + Tailwind)

A modern, standalone, static QR code generator built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**. It renders QR codes 100% on the client side with zero server roundtrips, supports instant PNG canvas export, and is designed to drop cleanly into an **Astro** project as an interactive React Island (`client:load`).

---

## ⚡ Quick Start (Standalone Vite Development)

To run or recreate this standalone Vite project locally:

### 1. Initialize & Install Dependencies

```bash
# Initialize a new Vite + React + TS project (or use the current folder)
npm create vite@latest qr-code-generator -- --template react-ts --no-interactive
cd qr-code-generator

# Install core dependencies
npm install
npm install qrcode.react

# Install Tailwind CSS and PostCSS
npm install -D tailwindcss@^3.4.17 postcss autoprefixer
npx tailwindcss init -p
```

### 2. Configure Tailwind CSS

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Add Tailwind directives to `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3. Run Development Server or Build

```bash
# Start local development server with Hot Module Replacement (HMR)
npm run dev

# Typecheck and compile production bundle
npm run build
```

---

## 🚀 Astro Project Integration (React Island)

This component is packaged in a single, portable file: `src/components/QRCodeGenerator.tsx`. It relies strictly on standard client-side React hooks (`useState`, `useRef`, `useCallback`) and DOM operations guarded inside event handlers, making it completely safe for Server-Side Rendering (SSR) and client hydration.

### Step 1: Add React & Tailwind to Astro (if not already enabled)

```bash
# In your Astro project root:
npx astro add react
npx astro add tailwind
npm install qrcode.react
```

### Step 2: Copy the Component

Copy `src/components/QRCodeGenerator.tsx` into your Astro project's component directory:

```bash
cp path/to/QRCodeGenerator.tsx your-astro-project/src/components/QRCodeGenerator.tsx
```

### Step 3: Create the Astro Page

Create the file `src/pages/get-your-free-qr-code.astro`:

```astro
---
// src/pages/get-your-free-qr-code.astro
import Layout from '../layouts/Layout.astro';
import { QRCodeGenerator } from '../components/QRCodeGenerator';
---

<Layout title="Free QR Code Generator | Instant Download">
  <main class="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
    <!-- Hydrated React Island -->
    <QRCodeGenerator client:load />
  </main>
</Layout>
```

When visitors navigate to `/get-your-free-qr-code`, Astro serves static HTML for the layout while hydrating only the `<QRCodeGenerator />` island on the client.

---

## 🛠️ Component Features

- **Dynamic Real-Time Rendering**: Uses `QRCodeCanvas` from `qrcode.react` to generate codes instantly as the user types.
- **Client-Side "Download PNG"**: Captures the canvas using `HTMLCanvasElement.toDataURL("image/png")` and initiates an instant file download with a clean, descriptive filename.
- **Customization Controls**:
  - Size slider (160px – 400px)
  - Color palettes and native color pickers for Foreground and Background
  - Error correction levels: `L` (7%), `M` (15%), `Q` (25%), `H` (30%)
  - Quiet zone margin toggle
- **Preset Shortcuts**: Fast one-click presets for Website URL, Wi-Fi credentials, Email, and Phone number.
- **Privacy & Security**: Zero analytics, zero cookies, zero external server API calls. Everything runs locally in the browser.
