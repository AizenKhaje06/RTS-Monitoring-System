# 🚀 Vercel Environment Variables Setup - Step by Step

## Quick Visual Guide

### Step 1: Access Environment Variables Settings

```
Vercel Dashboard
  └── Your Project
      └── Settings (tab)
          └── Environment Variables (sidebar)
              └── Add New (button)
```

### Step 2: Add Each Variable

For each variable below, click **"Add New"** and fill in:

---

#### Variable 1: Supabase URL

```
┌─────────────────────────────────────────────┐
│ Key:   NEXT_PUBLIC_SUPABASE_URL            │
│ Value: https://xxxxx.supabase.co           │
│ Environments: ☑ Production                 │
│               ☑ Preview                     │
│               ☑ Development                 │
└─────────────────────────────────────────────┘
```

**Where to get it:**
1. Go to https://app.supabase.com
2. Select your project
3. Settings → API
4. Copy "Project URL"

---

#### Variable 2: Supabase Anon Key

```
┌─────────────────────────────────────────────┐
│ Key:   NEXT_PUBLIC_SUPABASE_ANON_KEY       │
│ Value: eyJhbGciOiJIUzI1NiIsInR5cCI6...    │
│ Environments: ☑ Production                 │
│               ☑ Preview                     │
│               ☑ Development                 │
└─────────────────────────────────────────────┘
```

**Where to get it:**
1. Same page as above (Settings → API)
2. Copy "anon" / "public" key
3. It's a long string starting with "eyJ..."

---

#### Variable 3: NextAuth Secret

```
┌─────────────────────────────────────────────┐
│ Key:   NEXTAUTH_SECRET                     │
│ Value: [random 32-character string]        │
│ Environments: ☑ Production                 │
│               ☑ Preview                     │
│               ☑ Development                 │
└─────────────────────────────────────────────┘
```

**How to generate:**

**Windows PowerShell:**
```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

**Mac/Linux:**
```bash
openssl rand -base64 32
```

**Online Generator:**
https://generate-secret.vercel.app/32

---

#### Variable 4: NextAuth URL

```
┌─────────────────────────────────────────────┐
│ Key:   NEXTAUTH_URL                        │
│ Value: https://your-app.vercel.app         │
│ Environments: ☑ Production                 │
│               ☐ Preview (use preview URL)   │
│               ☐ Development (use localhost) │
└─────────────────────────────────────────────┘
```

**Values for each environment:**
- **Production**: `https://your-app-name.vercel.app`
- **Preview**: `https://your-app-name-git-branch.vercel.app`
- **Development**: `http://localhost:3000`

**Tip:** You can add different values for each environment!

---

## 📋 Complete Checklist

Before deploying, verify:

- [ ] Added `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Added `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Added `NEXTAUTH_SECRET`
- [ ] Added `NEXTAUTH_URL`
- [ ] All variables have correct environments selected
- [ ] Clicked "Save" for each variable
- [ ] Redeployed the application

## 🔄 After Adding Variables

### Method 1: Redeploy via Dashboard

1. Go to **Deployments** tab
2. Find latest deployment
3. Click **"..."** menu
4. Click **"Redeploy"**
5. Confirm

### Method 2: Redeploy via Git

```bash
# Make a small change and push
git commit --allow-empty -m "Trigger redeploy"
git push
```

### Method 3: Redeploy via CLI

```bash
vercel --prod
```

## 🎯 Verification

After deployment, check:

1. **Visit your app**: `https://your-app.vercel.app`
2. **Open browser console** (F12)
3. **Check for errors**:
   - ✅ No "Supabase credentials not configured" errors
   - ✅ Data loads successfully
   - ✅ No authentication errors

## 🐛 Troubleshooting

### Error: "Supabase credentials not configured"

**Fix:**
1. Verify variables are added in Vercel
2. Check variable names are EXACTLY correct (case-sensitive!)
3. Redeploy after adding variables

### Error: "Failed to fetch data"

**Fix:**
1. Check Supabase project is active
2. Verify RLS policies in Supabase
3. Check Supabase URL is correct

### Error: "NextAuth configuration error"

**Fix:**
1. Verify `NEXTAUTH_SECRET` is set
2. Verify `NEXTAUTH_URL` matches deployment URL
3. Redeploy

## 📸 Screenshot Guide

### Where to find Vercel Environment Variables:

```
1. Login to Vercel → https://vercel.com/dashboard
2. Select your project
3. Click "Settings" tab (top navigation)
4. Click "Environment Variables" (left sidebar)
5. Click "Add New" button
6. Fill in Key, Value, and select Environments
7. Click "Save"
8. Repeat for all variables
9. Go to "Deployments" tab
10. Redeploy latest deployment
```

## 🎉 Success!

Once all variables are set and redeployed:
- ✅ Your app will connect to Supabase
- ✅ Data will load in real-time
- ✅ Authentication will work
- ✅ All features will be functional

Your RTS Monitoring System is now live! 🚀
