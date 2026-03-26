# Auth + NFT Certification Design

**Date:** 2026-03-26
**Project:** Hackaton — Plataforma de empleo/pasantía para estudiantes y empresas

---

## Context

La plataforma conecta empresas con estudiantes y recién graduados en busca de su primer empleo o pasantía. Se necesita un sistema de autenticación diferenciado por rol (estudiante / empresa) con login tradicional (email + contraseña), seguido de conexión de wallet Web3 (Beexo via WalletConnect). Los estudiantes pueden subir certificados académicos en PDF que la plataforma certifica como NFTs en Sepolia testnet. Las empresas pueden publicar ofertas y buscar estudiantes certificados.

---

## Stack

- **Auth + DB + Storage:** Supabase (Auth nativo, PostgreSQL, Storage)
- **NFT:** Contrato ERC-721 pre-desplegado en Sepolia testnet
- **Web3:** viem + wagmi + WalletConnect (ya configurados en el proyecto)
- **Framework:** Next.js 16 App Router, TypeScript, Tailwind CSS 4

---

## Roles

| Rol | Acceso |
|-----|--------|
| `student` | Dashboard personal, subir certificados PDF, obtener NFTs, ver ofertas |
| `company` | Dashboard empresa, publicar ofertas, buscar estudiantes certificados |

---

## Rutas

```
src/app/
├── auth/
│   ├── login/page.tsx            # Login compartido con selector de rol
│   └── register/page.tsx         # Registro con selector de rol
├── student/
│   ├── dashboard/page.tsx        # Panel del estudiante + conectar wallet
│   └── certificates/page.tsx    # Subir PDF + ver NFTs propios
├── company/
│   ├── dashboard/page.tsx        # Panel empresa + conectar wallet (opcional)
│   ├── jobs/page.tsx             # Publicar y gestionar ofertas
│   └── students/page.tsx         # Buscar estudiantes con NFT certificado
```

---

## Base de Datos (Supabase PostgreSQL)

```sql
-- Usuarios (extiende Supabase Auth)
users (
  id            uuid PRIMARY KEY references auth.users,
  email         text NOT NULL,
  role          text NOT NULL CHECK (role IN ('student', 'company')),
  wallet_address text,
  created_at    timestamptz DEFAULT now()
)

-- Perfil estudiante
students (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id),
  name        text NOT NULL,
  university  text,
  career      text,
  bio         text
)

-- Perfil empresa
companies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id),
  name        text NOT NULL,
  industry    text,
  description text
)

-- Certificados NFT
certificates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid REFERENCES students(id),
  pdf_url       text NOT NULL,
  nft_token_id  text,
  tx_hash       text,
  chain         text DEFAULT 'sepolia',
  created_at    timestamptz DEFAULT now()
)

-- Ofertas de trabajo/pasantía
job_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  uuid REFERENCES companies(id),
  title       text NOT NULL,
  description text,
  type        text CHECK (type IN ('job', 'internship')),
  created_at  timestamptz DEFAULT now()
)
```

---

## Flujo de Autenticación

### Registro
1. `/auth/register` — usuario elige rol (Estudiante / Empresa)
2. Completa formulario: email, contraseña + datos del perfil
3. Supabase Auth crea cuenta → se insertan filas en `users` + `students` o `companies`
4. Redirección según rol: `/student/dashboard` o `/company/dashboard`

### Login
1. `/auth/login` — usuario elige rol + email/contraseña
2. Supabase Auth valida sesión
3. Redirección según `role` en `users`

### Conexión de Wallet (post-login)
- Botón "Conectar Wallet Beexo" en dashboard via WalletConnect
- `wallet_address` se guarda en `users`
- Estudiante **debe** tener wallet conectada antes de subir certificado
- Empresa conecta wallet opcionalmente

### Protección de Rutas
- Middleware Next.js (`src/middleware.ts`) verifica sesión Supabase
- Verifica que `role` coincida con la ruta (`/student/*` solo para `student`, etc.)

---

## Flujo NFT de Certificación

1. Estudiante va a `/student/certificates` (requiere wallet conectada)
2. Sube PDF del certificado académico
3. PDF se guarda en **Supabase Storage** en el path `certificates/[student_id]/[filename].pdf`
4. La plataforma genera metadata del NFT:
   ```json
   {
     "name": "Certificado Académico - [nombre]",
     "description": "Universidad: X | Carrera: Y",
     "file_url": "[url pública del PDF]"
   }
   ```
5. API route `/api/certificates/mint` llama al contrato ERC-721 en Sepolia via viem → `safeMint(walletAddress, tokenURI)` donde `tokenURI` apunta a `/api/nft/metadata/[tokenId]` que sirve el JSON de metadata dinámicamente desde Supabase
6. Se guarda en `certificates`: `pdf_url`, `nft_token_id`, `tx_hash`
7. Estudiante ve sus certificados con link a Sepolia Etherscan

**Contrato ERC-721:** Pre-desplegado en Sepolia. Función `safeMint` con `onlyOwner` (solo el backend puede mintear). Dirección del contrato guardada en variable de entorno.

---

## Features de Empresa

### `/company/jobs`
- Formulario: título, descripción, tipo (empleo / pasantía), requisitos
- CRUD de ofertas propias en tabla `job_posts`

### `/company/students`
- Listado de estudiantes con al menos 1 NFT certificado
- Filtros: universidad, carrera
- Tarjeta: nombre, universidad, carrera, cantidad de certificados
- Perfil completo con certificados verificables en Sepolia Etherscan

---

## Variables de Entorno a Agregar

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=
NFT_MINTER_PRIVATE_KEY=
```

---

## Verificación

1. Registrar un estudiante → verificar fila en `users` + `students` en Supabase
2. Login → verificar redirección correcta según rol
3. Conectar wallet Beexo via WalletConnect → verificar `wallet_address` guardado
4. Subir PDF → verificar archivo en Supabase Storage
5. Mintear NFT → verificar `tx_hash` en Sepolia Etherscan + fila en `certificates`
6. Registrar empresa → publicar oferta → verificar en `job_posts`
7. Buscar estudiantes desde cuenta empresa → verificar que solo aparecen los certificados
