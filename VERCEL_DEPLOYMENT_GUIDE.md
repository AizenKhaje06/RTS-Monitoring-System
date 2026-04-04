# Vercel Deployment Guide - RTS Monitoring System

## 🚀 Complete Setup Guide for Vercel Deployment

### Step 1: Prepare Your Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### Step 2: Deploy to Vercel

#### Option A: Deploy via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

### Step 3: Configure Environment Variables in Vercel

#### 3.1 Via Vercel Dashboard

1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Environment Variables**
3. Add the following variables:

#### Required Environment Variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview, Development |
| `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` | Production, Preview, Development |
| `NEXTAUTH_URL` | Your Vercel deployment URL | Production, Preview, Development |

#### Legacy Variables (Optional - for Google Sheets migration):

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `GOOGLE_SHEETS_PRIVATE_KEY` | Your Google Service Account private key | Production |
| `GOOGLE_SHEETS_CLIENT_EMAIL` | Your Google Service Account email | Production |
| `GOOGLE_SHEET_ID` | Your Google Sheet ID | Production |

#### 3.2 Via Vercel CLI

```bash
# Add Supabase URL
vercel env add NEXT_PUBLIC_SUPABASE_URL

# Add Supabase Anon Key
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Add NextAuth Secret
vercel env add NEXTAUTH_SECRET

# Add NextAuth URL
vercel env add NEXTAUTH_URL
```

When prompted, select:
- **Environment**: Production, Preview, Development (select all)
- **Value**: Paste your actual value

### Step 4: Generate NextAuth Secret

```bash
# On Windows (PowerShell)
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# On Mac/Linux
openssl rand -base64 32

# Or use online generator
# https://generate-secret.vercel.app/32
```

### Step 5: Set NextAuth URL

For production:
```
NEXTAUTH_URL=https://your-app-name.vercel.app
```

For preview/development:
```
NEXTAUTH_URL=https://your-preview-url.vercel.app
```

### Step 6: Verify Environment Variables

After adding all variables:

1. Go to **Settings** → **Environment Variables**
2. Verify all variables are present
3. Check that they're enabled for the correct environments

### Step 7: Redeploy

After adding environment variables:

1. Go to **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Select **"Use existing Build Cache"** (optional)
5. Click **"Redeploy"**

Or via CLI:
```bash
vercel --prod
```

### Step 8: Test Your Deployment

1. Visit your Vercel URL
2. Check browser console for errors
3. Verify data loads from Supabase
4. Test all dashboard features

## 🔒 Security Best Practices

### 1. Supabase Row Level Security (RLS)

Make sure your Supabase `parcels` table has RLS enabled:

```sql
-- Enable RLS
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access
CREATE POLICY "Allow public read access" ON parcels
  FOR SELECT
  USING (true);

-- Create policy to allow authenticated insert
CREATE POLICY "Allow authenticated insert" ON parcels
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
```

### 2. Environment Variable Security

- ✅ **DO**: Use `NEXT_PUBLIC_` prefix for client-side variables
- ❌ **DON'T**: Expose sensitive keys in client-side code
- ✅ **DO**: Keep private keys server-side only
- ❌ **DON'T**: Commit `.env.local` to Git

### 3. API Route Protection

All API routes should validate requests:

```typescript
// Example: Protect API route
export async function GET(request: NextRequest) {
  // Add authentication check here
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Your API logic here
}
```

## 📊 Monitoring & Debugging

### Check Deployment Logs

1. Go to **Deployments** tab
2. Click on your deployment
3. View **Build Logs** and **Function Logs**

### Common Issues

#### Issue: "Supabase credentials not configured"

**Solution**: 
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Redeploy after adding variables

#### Issue: "Failed to fetch data from Supabase"

**Solution**:
- Check Supabase project is active
- Verify RLS policies allow read access
- Check network tab for CORS errors

#### Issue: "NextAuth configuration error"

**Solution**:
- Verify `NEXTAUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your deployment URL
- Redeploy after changes

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to GitHub:

1. **Production**: Pushes to `main` branch
2. **Preview**: Pushes to other branches or PRs

### Disable Auto-Deploy (Optional)

1. Go to **Settings** → **Git**
2. Configure **Production Branch**
3. Enable/disable **Preview Deployments**

## 📝 Environment Variables Checklist

Before deploying, ensure you have:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- [ ] `NEXTAUTH_SECRET` - Random 32-character string
- [ ] `NEXTAUTH_URL` - Your Vercel deployment URL
- [ ] All variables set for Production, Preview, Development
- [ ] Redeployed after adding variables
- [ ] Tested deployment in browser

## 🎯 Quick Setup Commands

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link project
vercel link

# 4. Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL

# 5. Deploy to production
vercel --prod
```

## 📞 Support

If you encounter issues:

1. Check [Vercel Documentation](https://vercel.com/docs)
2. Check [Supabase Documentation](https://supabase.com/docs)
3. Review deployment logs in Vercel Dashboard
4. Check browser console for client-side errors

## 🎉 Success!

Once deployed, your RTS Monitoring System will be live at:
```
https://your-app-name.vercel.app
```

All data will be fetched from Supabase in real-time! 🚀
