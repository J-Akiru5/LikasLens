# Supabase — provisioning and secrets policy

## Passwords are never in this repository

This repository is **public**. Nothing in `supabase/` may contain a password, a
password hash, a JWT signing secret, a service-role key, a database connection
string, or any other credential.

`seed-demo.sql` previously violated this: it set fixed, known passwords for
three demo accounts, in plaintext, via `crypt('<password>', gen_salt('bf'))`.
Those accounts were confirmed live and one held the `super_admin` role, so
anyone reading the repository could sign in to the admin portal as a
super-admin. The passwords have been rotated and the block has been removed.

## Provisioning demo accounts

Create accounts out of band, one of:

- **Supabase dashboard** → Authentication → Users → *Add user*, with
  *Auto Confirm User* enabled.
- **Admin API**:
  `POST {SUPABASE_URL}/auth/v1/admin/users` with `{"email": "...",
  "password": "<generated>", "email_confirm": true,
  "user_metadata": {"role": "analyst"}}` and the service-role key in the
  `Authorization` and `apikey` headers.

Generate the password with a password manager. Do not reuse one across
accounts, and do not put it in a file that git can see.

### Roles

Authorisation reads `app_metadata.role`. Supabase lets a signed-in user write
their own `user_metadata` — the mobile register page does exactly that — so
`user_metadata.role` is **client-controlled and must never be trusted for an
access decision**. `app_metadata` can only be written with the service role.

The admin portal writes **both** claims when it creates an account or changes a
role: `app_metadata` is authoritative, and `user_metadata` is kept in step
because the user-provisioning trigger copies it into `public.users`.

Allowed values: `analyst`, `admin`, `super_admin`, `lgu`, `lgu_officer`.
Anything else — including `citizen`, `ghost` and a missing role — is rejected at
sign-in, again in the proxy, and again in every admin API handler.

`public.users.role` is a third copy, and it is the one the database policies read
(`is_admin()`). It is populated by the provisioning trigger and changed through
the admin portal, so it should agree with `app_metadata.role`; if the two ever
disagree, the database follows `public.users.role` and the app follows
`app_metadata`.

`super_admin` is the highest privilege. Grant it to as few accounts as
possible, and never to an account whose credentials are shared for demos.

## What is in this folder

| File | Purpose | Safe to commit |
| --- | --- | --- |
| `seed-demo.sql` | Reference data and role/confirmation fixes for demo accounts. Contains **no** credentials. | yes |
| `seed-makati-pitch.sql` | Pitch fixture data | yes |
| `fix-*.sql` | Ad-hoc patches applied to the live project | yes — review before applying |

## Known gap: no migration baseline

There is no `supabase/migrations/` directory and no `supabase/config.toml`. The
schema exists only as a sequence of ad-hoc `fix-*.sql` patches plus two Alembic
revisions under `apps/ai-service/db/migrations/`. A clean environment cannot be
rebuilt from this repository.

This is a known, accepted risk for now; reconstructing a baseline is tracked
separately and is deliberately **not** part of the security remediation.

## Applying changes to production

Production schema and access-control changes are the owner's call. Review each
patch, apply it in the dashboard SQL editor, and record what was applied and
when. Do not run an unreviewed script against production.

## Verification without logging in

To check whether an account exists or what role it holds, use the admin API
read-only:

```
GET {SUPABASE_URL}/auth/v1/admin/users?per_page=200
```

Never verify a credential by signing in with it.
