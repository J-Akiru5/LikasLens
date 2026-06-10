# 🔧 Authentication & Configuration Fix

## ✅ Issues Fixed:

1. **Metadata Console Error** - Fixed the `themeColor` placement (moved from metadata to viewport export)
2. **Form Submission** - Added `name` attributes to all form inputs so login/signup properly submit data

## ⚠️ Critical: Get Your Real Supabase Anon Key

The "Invalid API key" error happens because the test key needs to be replaced with your **real Supabase anon key**.

### Steps to Get Your Anon Key:

1. Go to your Supabase Project Dashboard
   - URL: https://app.supabase.com/projects
   
2. Select your project: `sfklmmtimelotqvrldni`

3. Go to **Settings** → **API**

4. Copy the **anon (public)** key

5. Update `apps/frontend/.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_COPIED_KEY_HERE
   ```

6. Refresh the browser (http://localhost:3000/login)

## 🔐 What Gets Sent:

**Sign Up:**
- ✅ Name (collected but server only uses email/password for Supabase)
- ✅ Email 
- ✅ Password
- ✅ Newsletter checkbox (collected)

**Login:**
- ✅ Email
- ✅ Password

## 📋 Form Configuration:

Both forms now properly submit via Next.js Server Actions with:
- Email field (`name="email"`)
- Password field (`name="password"`)
- Form data correctly paired with `formAction={signIn}` or `formAction={signUp}`

Once you add the real Supabase anon key, login and signup will function immediately!
