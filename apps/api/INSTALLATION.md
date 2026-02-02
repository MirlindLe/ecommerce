# Installation & Setup Instructions

## ✅ Fixed Issues

1. **Dependency Conflict** - Updated `@nestjs/config` to v4.0.0 (compatible with NestJS 11)
2. **Prisma Version** - Downgraded to Prisma 6.1.0 (more stable than v7)
3. **TypeScript Config** - Removed deprecated `baseUrl`, added `ignoreDeprecations`

---

## 🚀 Installation Steps

### Step 1: Install Dependencies

```powershell
cd apps/api
npm install
```

If you still get errors, try:

```powershell
npm install --legacy-peer-deps
```

### Step 2: Generate Prisma Client

```powershell
npx prisma generate
```

### Step 3: Create Database

Make sure MySQL is running, then create the database:

```sql
CREATE DATABASE ecommerce;
```

Or use MySQL Workbench/phpMyAdmin to create it.

### Step 4: Run Migrations

```powershell
npx prisma migrate dev --name init
```

This will:

- Create all tables from the schema
- Generate migration files
- Update Prisma Client

### Step 5: (Optional) Seed Database

Create a seed file later to add initial data (admin user, sample products, etc.)

### Step 6: Start Development Server

```powershell
npm run start:dev
```

The API should start on: `http://localhost:3001/api`

---

## 📝 What Was Changed

### package.json

- `@nestjs/config`: `^3.2.0` → `^4.0.0`
- `@prisma/client`: `^7.0.1` → `^6.1.0`
- `prisma`: `^7.0.1` → `^6.1.0`

### tsconfig.json

- Removed: `"baseUrl": "./"`
- Added: `"ignoreDeprecations": "6.0"`

### All other files

- ✅ No errors found
- ✅ All modules are properly configured
- ✅ Prisma schema is correct
- ✅ Guards, interceptors, and decorators are ready

---

## ⚙️ Verify Installation

After installation, check:

1. **Dependencies installed:**

   ```powershell
   npm list @nestjs/config @prisma/client
   ```

2. **Prisma Client generated:**

   ```powershell
   # Should exist: node_modules/.prisma/client
   ls node_modules/.prisma/client
   ```

3. **Database connection:**

   ```powershell
   npx prisma studio
   ```

   This should open Prisma Studio at `http://localhost:5555`

4. **API starts without errors:**
   ```powershell
   npm run start:dev
   ```

---

## 🔧 Troubleshooting

### Issue: npm install still fails

**Solution:**

```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -r node_modules
rm package-lock.json

# Install with legacy peer deps
npm install --legacy-peer-deps
```

### Issue: Prisma Client not found

**Solution:**

```powershell
npx prisma generate
```

### Issue: Database connection error

**Solution:**

- Check MySQL is running
- Verify `.env` has correct `DATABASE_URL`
- Ensure database `ecommerce` exists

### Issue: Port 3001 already in use

**Solution:**

```powershell
# Find process using port 3001
netstat -ano | findstr :3001

# Kill the process
taskkill /PID <PID> /F

# Or change port in .env
```

---

## 📦 Expected Dependencies

After installation, you should have:

**Production:**

- @nestjs/common, @nestjs/core, @nestjs/platform-express (v11)
- @nestjs/config (v4)
- @nestjs/jwt, @nestjs/passport (v10)
- @prisma/client (v6.1)
- bcrypt, passport, passport-jwt
- class-validator, class-transformer
- stripe, zod
- rxjs, reflect-metadata

**Development:**

- @nestjs/cli, @nestjs/testing (v11)
- prisma (v6.1)
- TypeScript, ts-node, ts-jest
- Jest, supertest
- ESLint, Prettier

---

## ✅ Next Steps After Installation

1. **Test the server starts:**

   ```powershell
   npm run start:dev
   ```

2. **Open Prisma Studio** to view database:

   ```powershell
   npx prisma studio
   ```

3. **Start implementing Auth module:**
   - Create DTOs (register, login)
   - Implement bcrypt password hashing
   - Add JWT token generation
   - Test endpoints with Postman/Thunder Client

4. **Follow the development plan** in `DEVELOPMENT_PLAN.md`

---

**All files have been checked and fixed. Ready to install! 🎉**
