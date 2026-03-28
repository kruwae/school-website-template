# School Website Template (โรงเรียนห้องสื่อครูคอมวิทยาคม)

A modern, responsive, and customizable school website template built with React, Vite, Tailwind CSS, and Supabase.

![School Website Preview](./public/og-image.png) <!-- Ensure an image exists or remove this line -->

## 🌟 Features
- **Modern UI/UX**: Responsive design suitable for all devices.
- **News & Activities**: Dynamic news management system.
- **Gallery**: Photo albums and activities showcase.
- **Admin Dashboard**: Comprehensive backend for managing content.
- **Database Integrated**: Powered by Supabase for real-time data.

## 🚀 Getting Started

If you are a developer or have some technical background, here is the quick start:

1.  **Clone the repo**
    ```bash
    git clone https://github.com/your-username/school-website-template.git
    cd school-website-template
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    - Copy `.env.example` to `.env`
    - Fill in your Supabase credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

4.  **Database Setup**
    - Create a new Supabase project.
    - Run the SQL migrations found in `supabase/migrations/` in order.

5.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 📚 Detailed Installation Guide (ภาษาไทย)

สำหรับโรงเรียนที่ต้องการนำไปใช้งาน เรามีคู่มือสอนการติดตั้งแบบละเอียดทุกขั้นตอน (Step-by-Step) ตั้งแต่เริ่มสมัครจนถึงขึ้นระบบ

👉 **[อ่านคู่มือการติดตั้งฉบับสมบูรณ์ (คลิกที่นี่)](./DEPLOYMENT_GUIDE.md)**

## 🛠 Tech Stack
- **Framework**: [Vite](https://vitejs.dev/) + [React](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Backend/DB**: [Supabase](https://supabase.com/)

## 📄 License
MIT License. Free to use for educational purposes.
