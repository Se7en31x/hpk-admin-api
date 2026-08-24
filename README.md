# 🏥 HPK Admin Central — Backend API

> RESTful API สำหรับระบบบริหารจัดการผู้ใช้งาน (User Administration) ของโรงพยาบาลวัดห้วยปลากั้งเพื่อสังคม  
> เป็นส่วน Backend ของโปรเจกต์ **HPK Hospital Management System (HPK-HMS)**

![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?logo=prisma&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Auth-3FCF8E?logo=supabase&logoColor=white)
![Azure](https://img.shields.io/badge/Deploy-Azure%20App%20Service-0078D4?logo=microsoftazure&logoColor=white)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white)

---

## 📋 สารบัญ

- [ภาพรวมโปรเจกต์](#-ภาพรวมโปรเจกต์)
- [สถาปัตยกรรมระบบ](#-สถาปัตยกรรมระบบ)
- [Tech Stack](#-tech-stack)
- [โครงสร้างโปรเจกต์](#-โครงสร้างโปรเจกต์)
- [API Endpoints](#-api-endpoints)
- [การติดตั้งและรัน](#-การติดตั้งและรัน)
- [Environment Variables](#-environment-variables)
- [CI/CD Pipeline](#-cicd-pipeline)
- [Related Repositories](#-related-repositories)

---

## 🎯 ภาพรวมโปรเจกต์

**HPK-HMS (Hospital Management System)** คือระบบสารสนเทศแบบ Microservice สำหรับโรงพยาบาลวัดห้วยปลากั้ง ประกอบด้วยหลายโมดูลย่อย เช่น คลังยา, จ่ายยา, ชีวาภิบาล, ทันตกรรม และ OPD

**Repository นี้** รับผิดชอบเฉพาะ **ส่วนบริหารจัดการผู้ใช้งาน (Admin Module)** ซึ่งเป็นหัวใจสำคัญของระบบ:

- 👤 **จัดการผู้ใช้งาน** — สร้างบัญชี, กำหนดสิทธิ์, รีเซ็ตรหัสผ่าน
- 📝 **จัดการโปรไฟล์** — CRUD ข้อมูลส่วนตัว, ที่อยู่, อาชีพ, สิทธิ์การรักษา
- 🔍 **Lookup Data** — ดึงข้อมูลอ้างอิง (คำนำหน้า, อาชีพ, สิทธิ์ประกัน ฯลฯ)
- 🔐 **Authentication** — ใช้ Supabase Auth + Service Role Key สำหรับ Admin operations

---

## 🏗 สถาปัตยกรรมระบบ

```
┌────────────────────────────────────────────────────────────────┐
│                        HPK-HMS Platform                        │
├─────────────┬──────────────┬───────────────┬──────────────────┤
│  Admin Web  │ Warehouse Web│  Dispense Web │  Palliative Web  │
│  (Next.js)  │  (Next.js)   │   (Next.js)   │    (Next.js)     │
├─────────────┼──────────────┼───────────────┼──────────────────┤
│  Admin API  │Warehouse API │  Dispense API │  Palliative API  │
│  ◀ THIS ▶   │  (Express)   │   (Express)   │    (Express)     │
├─────────────┴──────────────┴───────────────┴──────────────────┤
│              Supabase (PostgreSQL + Auth + RLS)                │
└────────────────────────────────────────────────────────────────┘
```

### API Architecture (Layered Pattern)

```
Request → Routes → Controller → Service → Prisma ORM → PostgreSQL
                                    ↓
                             Supabase Admin SDK
```

| Layer | หน้าที่ |
|---|---|
| **Routes** | กำหนด HTTP method + path, route แต่ละ resource |
| **Controllers** | รับ request/response, validation เบื้องต้น |
| **Services** | Business logic, ประสานงานระหว่าง Prisma กับ Supabase Auth |
| **Config** | Environment variables, Prisma client instance |
| **Middlewares** | Error handling, CORS |

---

## 🛠 Tech Stack

| ด้าน | เทคโนโลยี |
|---|---|
| **Runtime** | Node.js 22.x |
| **Framework** | Express.js 5.x |
| **ORM** | Prisma 6.x (Multi-schema: `auth` + `public`) |
| **Database** | PostgreSQL (Supabase) |
| **Authentication** | Supabase Auth (Admin SDK — Service Role) |
| **Deployment** | Azure App Service |
| **CI/CD** | GitHub Actions (auto-deploy on push to `main`) |
| **Dev Tools** | Nodemon (hot-reload) |

---

## 📁 โครงสร้างโปรเจกต์

```
hpk-admin-api/
├── .github/
│   └── workflows/
│       └── main_admin-central-api.yml   # CI/CD: GitHub Actions → Azure
├── prisma/
│   └── schema.prisma                    # Database schema (multi-schema)
├── src/
│   ├── config/
│   │   ├── env.js                       # Environment variable loader
│   │   └── prisma.js                    # Prisma client singleton
│   ├── controllers/
│   │   ├── user.controller.js           # User account operations
│   │   ├── profile.controller.js        # Profile CRUD
│   │   └── lookup.controller.js         # Reference data queries
│   ├── middlewares/
│   │   └── error-handler.js             # Global error handler
│   ├── routes/
│   │   ├── index.js                     # Route aggregator + health check
│   │   ├── user.routes.js               # /api/users/*
│   │   ├── profile.routes.js            # /api/profiles/*
│   │   └── lookup.routes.js             # /api/lookups/*
│   ├── services/
│   │   ├── user.service.js              # User business logic + Supabase Auth
│   │   ├── profile.service.js           # Profile CRUD + validation
│   │   └── lookup.service.js            # Lookup data queries
│   ├── app.js                           # Express app setup (CORS, routes)
│   └── server.js                        # Server entry point
├── .gitignore
├── package.json
└── README.md
```

---

## 📡 API Endpoints

Base URL: `/api`

### Health Check

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | ตรวจสอบสถานะ API |

### Users (`/api/users`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | ดึงรายชื่อผู้ใช้งานทั้งหมด |
| `GET` | `/api/users/:id` | ดึงข้อมูลผู้ใช้ตาม ID |
| `POST` | `/api/users/create` | สร้างบัญชีผู้ใช้ใหม่ (Supabase Auth + Profile) |
| `POST` | `/api/users/reset-password` | Admin รีเซ็ตรหัสผ่านผู้ใช้ |

### Profiles (`/api/profiles`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/profiles` | ดึงรายการโปรไฟล์ทั้งหมด |
| `GET` | `/api/profiles/:id` | ดึงโปรไฟล์ตาม ID |
| `POST` | `/api/profiles` | สร้างโปรไฟล์ใหม่ |
| `PATCH` | `/api/profiles/:id` | อัปเดตข้อมูลโปรไฟล์ |
| `DELETE` | `/api/profiles/:id` | ลบโปรไฟล์ |

### Lookups (`/api/lookups`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/lookups/profile-form` | ดึงข้อมูลอ้างอิงสำหรับฟอร์มโปรไฟล์ |

---

## 🚀 การติดตั้งและรัน

### Prerequisites

- Node.js ≥ 22.x
- npm ≥ 10.x
- PostgreSQL database (หรือ Supabase project)

### Installation

```bash
# Clone repository
git clone https://github.com/Se7en31x/hpk-admin-api.git
cd hpk-admin-api

# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run development server (with hot-reload)
npm run dev
```

### Available Scripts

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `nodemon src/server.js` | Development server (hot-reload) |
| `npm start` | `prisma generate && node src/server.js` | Production server |
| `npm run prisma:generate` | `prisma generate` | Generate Prisma client |
| `npm run prisma:push` | `prisma db push` | Push schema to database |
| `npm run prisma:migrate` | `prisma migrate dev` | Run database migrations |
| `npm run prisma:studio` | `prisma studio` | Open Prisma Studio GUI |

---

## 🔐 Environment Variables

สร้างไฟล์ `.env` ที่ root ของโปรเจกต์:

```env
# Server
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:3000

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Supabase Auth (Service Role — ใช้สำหรับ Admin operations)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

> ⚠️ **ห้ามเปิดเผย `SUPABASE_SERVICE_ROLE_KEY` เด็ดขาด** — ไฟล์ `.env` ถูก gitignore แล้ว

---

## ⚙️ CI/CD Pipeline

ใช้ **GitHub Actions** สำหรับ auto-deploy ไปยัง **Azure App Service**:

```
Push to main → Build (npm install + prisma generate) → Deploy to Azure
```

- **Trigger**: Push to `main` branch หรือ manual dispatch
- **Build**: Node.js 22.x, npm install, Prisma generate
- **Deploy**: Azure Web App (`admin-central-api`) via OIDC authentication
- **Secrets**: Database URL, Azure credentials ถูกเก็บใน GitHub Secrets

---

## 🔗 Related Repositories

| Repository | Description | Tech |
|---|---|---|
| [hpk-admin-central](https://github.com/Se7en31x/hpk-admin-central) | 🖥️ Admin Frontend — Portal หน้าหลัก + User Management UI | Next.js 16, TypeScript, TailwindCSS |
| hpk-warehouse-api | 📦 Warehouse Backend API | Express, Prisma |
| hpk-warehouse-web | 📦 Warehouse Frontend | Next.js, TypeScript |

---

## 👤 ผู้พัฒนา

พัฒนาภายใต้โปรเจกต์ **Final Project** — ระบบสารสนเทศโรงพยาบาลวัดห้วยปลากั้งเพื่อสังคม

---

<p align="center">
  <sub>Built with ❤️ using Express.js + Prisma + Supabase</sub>
</p>
