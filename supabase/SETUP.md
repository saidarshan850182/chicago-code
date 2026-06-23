# Supabase setup — Chicago Code

One-time setup that powers staff logins, roles, and live product data.
Takes about 10 minutes. You only do this once.

---

## 1. Create the project
1. Go to **https://supabase.com** → sign up (free).
2. Click **New project**.
3. Name it `chicago-code`, set a database password (save it somewhere), pick the closest region, and create it. Wait ~2 minutes for it to finish setting up.

## 2. Get your keys (you'll send these to me)
1. In the project, go to **Project Settings** (gear icon) → **API**.
2. Copy these two values:
   - **Project URL** (looks like `https://abcdxyz.supabase.co`)
   - **anon public** key (a long string under "Project API keys")
> The anon key is *meant* to be public and safe to put in the website. Security comes from the database rules, not from hiding this key. **Do NOT** send the `service_role` key — keep that secret.

## 3. Turn off email confirmation
Staff log in with a username (not a real email), so confirmation emails aren't used.
1. Go to **Authentication** → **Sign In / Providers** (or **Providers → Email**).
2. **Turn OFF** "Confirm email" (also called "Enable email confirmations").
3. Save.

## 4. Run the database script
1. Go to **SQL Editor** → **New query**.
2. Open `supabase/schema.sql` from this project, copy ALL of it, paste it in.
3. Click **Run**. You should see "Success". This creates the tables, security rules, image storage, and seeds the 12 starting products.

## 5. Create the Admin (owner) account
1. Go to **Authentication** → **Users** → **Add user** → **Create new user**.
2. Email: `chicagocodeadmin@chicagocode.local`
3. Password: `12345678`
4. Tick **Auto Confirm User** if shown, then create.
5. Go back to **SQL Editor** → **New query**, paste and **Run** this:

```sql
insert into public.profiles (id, username, role)
select id, 'ChicagoCodeAdmin', 'admin'
from auth.users
where email = 'chicagocodeadmin@chicagocode.local'
on conflict (id) do update set role = 'admin', username = 'ChicagoCodeAdmin';
```

## 6. Send me the keys
Paste your **Project URL** and **anon public key** back in the chat. I'll wire up the
storefront, the login page, and the admin panel, then push it live.

---

### How logins will work
- Staff type a **username + password**. Behind the scenes the username maps to
  `username@chicagocode.local` so Supabase Auth can handle it — staff never see that.
- The **Admin** (`ChicagoCodeAdmin` / `12345678`) can manage everything, including
  other managers, and change their own credentials.
- **Managers** can manage products + staff (employees/managers) but cannot touch the Admin.
- **Employees** can manage products only.
- These rules are enforced by the database, so they hold even if someone pokes at the page.
