# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

Create a `.env.local` file in the root directory:

```env
DATABASE_URL="file:./wedding.db"
ADMIN_PASSWORD="your-secure-password-here"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

**Important:** Change `ADMIN_PASSWORD` to a secure password of your choice!

## Step 3: Initialize Database

```bash
npx prisma generate
npx prisma db push
```

This will:
- Generate the Prisma client
- Create the SQLite database file (`wedding.db`)
- Set up the RSVP submissions table

## Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: Test the Application

1. **Home Page**: Visit the homepage to see all sections
2. **RSVP Forms**: Test both "Yes" and "No" forms
3. **Admin Dashboard**: 
   - Go to `/admin/login`
   - Enter your `ADMIN_PASSWORD`
   - View, filter, and export submissions

## Troubleshooting

### Database Issues

If you see Prisma errors:
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database (WARNING: deletes all data)
rm wedding.db
npx prisma db push
```

### Port Already in Use

If port 3000 is taken:
```bash
# Use a different port
npm run dev -- -p 3001
```

### Build Errors

If you encounter build errors:
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## Next Steps

1. **Customize Content**: Edit the sections in `components/sections/`
2. **Update Colors**: Modify `tailwind.config.ts`
3. **Add Images**: Use Next.js `<Image>` component for optimized images
4. **Deploy**: Follow the deployment instructions in `README.md`

## Production Deployment

Before deploying:

1. Set strong `ADMIN_PASSWORD` in production environment
2. Consider migrating to PostgreSQL for better scalability
3. Enable HTTPS
4. Set up database backups
5. Test all functionality in production environment
