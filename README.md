# Almedina Market Website

A modern, responsive e-commerce web application for Almedina Market, built to provide a seamless shopping experience for customers and a robust management dashboard for administrators.

## 🌟 Overview

Almedina Market provides a unified platform where customers can browse products, manage their cart, and securely check out with delivery or pickup options. Administrators can manage the store's inventory, track orders in real-time, and manage settings through a protected dashboard.

## ✨ Features

### Customer Experience
*   **Unified Sign-In:** Secure, seamless login flow combining email/password and Google Authentication.
*   **Storefront:** Browse products by category with real-time stock availability.
*   **Shopping Cart & Checkout:** Intuitive cart management with integrated Chapa payment processing.
*   **Delivery & Pickup:** Integrated Google Maps for precise delivery location selection.
*   **Order Tracking:** Track the status of active orders.

### Admin Experience
*   **Secure Access:** Protected by email, password, and a mandatory 2FA security code.
*   **Dashboard Overview:** Real-time analytics and order status summaries.
*   **Product Management:** Add, edit, or remove inventory items.
*   **Order Management:** Process incoming orders, update delivery statuses, and handle customer communication.

## 🛠 Tech Stack

*   **Frontend:** React 19, TypeScript, Vite
*   **Styling:** Tailwind CSS v4, Framer Motion (Animations), Lucide React (Icons)
*   **Backend / Server:** Node.js, Express, tsx (for local dev)
*   **Database:** Supabase (PostgreSQL)
*   **Authentication:** Firebase Authentication
*   **Payments:** Chapa Payment Gateway
*   **Maps & Location:** Google Maps Platform (`@vis.gl/react-google-maps`)
*   **Email Services:** Nodemailer

## 📋 Requirements

*   **Node.js**: v18 or higher recommended
*   **npm**: v9 or higher

## ⚙️ Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/almedina-market-website.git
    cd almedina-market-website
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Copy the sample environment file and fill in your keys.
    ```bash
    cp .env.example .env
    ```

4.  **Database Setup:**
    If you need to seed a fresh database, execute the SQL scripts found in the `sql/` directory against your Supabase PostgreSQL instance:
    *   `0001_foundation.sql` (Creates tables, triggers, and RLS policies)
    *   `0002_seed_data.sql` (Inserts initial sample data)

## 🔑 Environment Variables

The `.env` file requires the following configurations (refer to `.env.example` for exact variable names):

*   **Firebase Config:** API Key, Auth Domain, Project ID, Storage Bucket, Messaging Sender ID, App ID, Measurement ID
*   **Supabase Config:** URL, Service Role Key / Anon Key
*   **Chapa API:** Secret Key for processing payments
*   **Google Maps:** Platform API Key
*   **Nodemailer:** SMTP settings (Host, Port, User, Password)

## 🚀 Usage

### Development Server
Start both the Vite frontend and the Express backend locally:
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000` (or `http://localhost:5173` depending on configuration).

### Production Build
Create an optimized production bundle:
```bash
npm run build
```
This generates the frontend assets into `dist/` and compiles the backend into `dist/server.cjs`.

Run the production server:
```bash
npm run start
```

## 📁 Project Structure

```text
almedina-market-websitenew/
├── src/
│   ├── assets/       # Static assets (images, logos)
│   ├── components/   # Reusable UI components (admin, common, storefront)
│   ├── constants/    # Brand constants and configuration
│   ├── context/      # Global state (AppContext for Auth & UI state)
│   ├── App.tsx       # Main application routing and entry
│   └── index.css     # Global styles and Tailwind imports
├── server/           # Backend Express route handlers (if applicable)
├── sql/              # Supabase database initialization and seed scripts
├── server.ts         # Backend Express server entry point
└── package.json      # Dependencies and scripts
```

## 🧪 Testing

*To be implemented.* Run standard linting via:
```bash
npm run lint
```

## 🤝 Contributing

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ✍️ Author

Developed for Almedina Market.
