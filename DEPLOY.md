# Deploying Command Center

Two things need to happen, in order: the database gets set up in Supabase, then the app gets
deployed to Vercel with the database's connection details.

## 1. Set up the database (Supabase)

You already have a Supabase project. In it:

1. Open the **SQL Editor** (left sidebar) → **New query**.
2. Open `supabase/schema.sql` from this project, copy its entire contents, paste into the
   query box, and click **Run**. This creates the tables.
3. New query again. Open `supabase/seed.sql`, copy its entire contents, paste in, and
   **Run**. This loads the demo data (four projects, five people, a realistic set of tasks).
4. Go to **Project Settings** → **API**. You'll need two values from this page in step 2 below:
   - **Project URL**
   - **anon public** key

## 2. Deploy the app (Vercel)

1. Push this project to a GitHub repository (if you're going through Claude, this may already
   be done for you).
2. In Vercel, **Add New... → Project**, and import that GitHub repository.
3. Before clicking Deploy, open **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL` = the Project URL from step 1.4
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the anon public key from step 1.4
   - `ALLOWED_EMAILS` = your email address (leave blank for now if you haven't decided; you
     can add it later and redeploy — see below)
4. Click **Deploy**.

## 3. Sign in

Once deployed, open the URL Vercel gives you, enter your email, and click the link Supabase
emails you. That's it — you're in.

## Locking sign-in to one address

If you left `ALLOWED_EMAILS` blank, anyone who has the app's URL and enters their email can
sign in (and see your data). Once you've decided which address this app is "you":

1. Vercel → your project → **Settings** → **Environment Variables**.
2. Set `ALLOWED_EMAILS` to that address (comma-separate more than one if needed).
3. **Deployments** tab → the latest deployment → **Redeploy**.

## Making changes later

Any time the app needs a change, the new code gets pushed to the same GitHub repository and
Vercel redeploys automatically. Database changes go through the Supabase SQL Editor the same
way as step 1.
