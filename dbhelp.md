# Local DB Setup & Sync Guide (Postgres + Prisma)

This is for every teammate, on their own machine. You each run your own local Postgres database. We are NOT sharing one live database during development, we only sync the **schema** (table structure) through git + Prisma migrations. Your actual data rows stay local to you.

---

## 1. One-Time Setup (do this once per machine)

### Install Docker Desktop
Download from https://www.docker.com/products/docker-desktop and install it if you don't have it.

### Start your local Postgres container
```bash
docker run --name dealflow-db -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=dealflow -p 5432:5432 -d postgres
```
This creates a Postgres server running on your machine at `localhost:5432`, with a database called `dealflow`.

You only run this command **once ever** per machine. After that, you just start/stop the existing container (see Section 5).

### Set your `.env` file
In the project root, create/edit `.env`:
```
DATABASE_URL="postgresql://postgres:pass@localhost:5432/dealflow"
```
This should be the same for everyone since everyone is pointing at their own `localhost`, not a shared server.

### Install dependencies and generate Prisma client
```bash
npm install
npx prisma generate
```

### Apply existing migrations
```bash
npx prisma migrate dev
```
This creates all the tables based on whatever schema already exists in the repo.

---

## 2. Daily Workflow: Pulling Teammates' Schema Changes

Whenever you `git pull` and see anything changed inside `prisma/migrations/` or `prisma/schema.prisma`, run:

```bash
npx prisma migrate dev
```

Prisma detects any new migration files and applies them to your local database automatically. Your existing data rows are kept, only the structure updates (new columns/tables get added).

**Do this every time after pulling**, treat it like `npm install` after a `package.json` change, it's routine, not optional.

---

## 3. Making Your Own Schema Changes

If YOU are the one changing `prisma/schema.prisma` (adding a field, a new model, changing a relation, etc.):

1. Edit `schema.prisma` with your change.
2. Run:
```bash
npx prisma migrate dev --name short_description_of_change
```
Example:
```bash
npx prisma migrate dev --name add_discount_field_to_orderline
```
3. This does two things: applies the change to your local DB, and creates a new folder inside `prisma/migrations/` containing the SQL for that change.
4. Commit and push **both** `schema.prisma` and the new migration folder:
```bash
git add prisma/
git commit -m "add discount field to order line"
git push
```

**Important:** Never edit files inside `prisma/migrations/` by hand, and never delete old migration folders. They are a chronological history, Prisma reads them in order.

---

## 4. Seeding Sample Data

To avoid everyone manually clicking through screens to create test customers/products, we keep a seed script at `prisma/seed.ts`.

Run it anytime you want to reset to clean sample data:
```bash
npx prisma db seed
```

If you want a completely fresh database (wipes everything, reapplies all migrations, then reseeds):
```bash
npx prisma migrate reset
```
This will ask for confirmation since it deletes all data, that's expected and safe for local dev.

---

## 5. Starting/Stopping Your Local DB

Your Postgres container keeps running in the background once started. Common commands:

Check if it's running:
```bash
docker ps
```

Stop it:
```bash
docker stop dealflow-db
```

Start it again later:
```bash
docker start dealflow-db
```

You do NOT need to run `docker run` again after the first time, that command creates a new container. `docker start`/`docker stop` reuse the one you already made.

---

## 6. Common Problems

**"Can't reach database server at localhost:5432"**
Your container isn't running. Run `docker start dealflow-db`.

**"Migration X failed to apply / drift detected"**
Someone's local DB structure has diverged from what the migrations expect (usually from manually editing tables, or from an old broken migration). Fix: run `npx prisma migrate reset`, this wipes your local DB and rebuilds it cleanly from all migrations plus the seed script. Since your data is only local test data anyway, this is safe to do freely.

**"I changed schema.prisma but Prisma isn't picking it up"**
You edited the schema file but didn't run `npx prisma migrate dev --name ...` yet. Editing the file alone does nothing, the migrate command is what actually applies it and generates the migration history.

**Two people changed the schema at the same time and now there's a merge conflict in `prisma/schema.prisma`**
Resolve the schema file conflict manually like any other code conflict (keep both people's model changes), then delete your local migration folder that hasn't been pushed yet if it conflicts, and run `npx prisma migrate dev --name merged_changes` again to generate one clean migration from the final merged schema. Don't try to merge two raw migration SQL files by hand.

---

## 7. What NOT to worry about

- You will never see your teammates' actual data rows on your machine, and that's fine, expected, not a bug.
- You never need to manually copy a database file between machines.
- Nobody needs to be "online" or connected to anyone else's database at any point during development. Every command in this guide runs entirely against your own local `localhost:5432`.

---

## 8. Demo Day (different from all of the above)

On presentation day, only ONE laptop runs the whole demo, in multiple browser tabs (Rep view, Manager view, Customer Portal), all hitting that one laptop's local database. No syncing between machines is needed at that point, since there's only one machine involved. See the separate demo-day checklist for that setup.