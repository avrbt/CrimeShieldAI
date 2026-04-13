# 🛡️ CrimeShield AI

> An AI-powered crime analysis and safety intelligence platform built with React, TypeScript, and Supabase.

---

## 📌 Overview

CrimeShield AI leverages artificial intelligence to help users analyze crime patterns, assess safety risks, and gain actionable insights for safer decision-making. The platform combines a modern React frontend with a robust Supabase backend and Python-powered AI/data processing pipelines.

---

## ✨ Features

- 🔍 **AI-Powered Crime Analysis** — Intelligent analysis of crime data using machine learning
- 📊 **Interactive Dashboards** — Visualize crime trends and statistics with Recharts
- 🗺️ **Location-based Insights** — Assess safety levels for specific areas
- 🔔 **Real-time Alerts** — Stay informed with live updates powered by Supabase
- 🌗 **Dark / Light Mode** — Seamless theme switching with `next-themes`
- 📱 **Responsive Design** — Fully responsive UI built with Tailwind CSS and Radix UI

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript |
| Styling | Tailwind CSS v4, Radix UI, shadcn/ui |
| Charts | Recharts |
| Backend / DB | Supabase (PostgreSQL + Auth + Realtime) |
| API Layer | Hono |
| AI / Data | Python |
| Build Tool | Vite 6 |
| Animations | Motion |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) v9 or higher
- A [Supabase](https://supabase.com/) project (for backend features)

### Installation

```bash
# Clone the repository
git clone https://github.com/avrbt/CrimeShieldAI.git
cd CrimeShieldAI

# Install dependencies
npm i
```

### Environment Setup

Create a `.env` file in the root directory and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Building for Production

```bash
npm run build
```

---

## 📁 Project Structure

```
CrimeShieldAI/
├── src/                  # Frontend source (React + TypeScript)
├── index.html            # App entry point
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
└── .npmrc                # npm configuration
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and not yet licensed for public distribution.

---

## 👤 Author
AVIRAL BAJPAI
**avrbt** — [GitHub](https://github.com/avrbt)

---

> *Built to make communities safer through the power of AI.*
