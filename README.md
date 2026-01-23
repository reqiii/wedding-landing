# Premium Wedding Landing Website

A beautiful, cinematic wedding landing page with liquid glass UI effects, RSVP system, and admin dashboard.

## Features

- ✨ **Cinematic Hero Section** - Smooth transitions, parallax effects, and elegant typography
- 🔮 **Liquid Glass UI** - True refraction effects using SVG filters
- 📱 **Fully Responsive** - Mobile-first design that works on all devices
- 📝 **RSVP System** - Separate forms for attending and declining
- 🔒 **Admin Dashboard** - View, filter, and export RSVP submissions
- ♿ **Accessible** - WCAG AA compliant with keyboard navigation
- 🚀 **Performance** - Optimized for speed and SEO

## Tech Stack

- **Next.js 14** (App Router) - React framework with SSR
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Prisma + SQLite** - Database and ORM
- **React Hook Form + Zod** - Form handling and validation
- **SVG Filters** - Glass refraction effects

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set:
- `ADMIN_PASSWORD` - Choose a secure password for admin access
- `DATABASE_URL` - Already set to use SQLite (file:./wedding.db)

3. **Initialize the database:**

```bash
npx prisma generate
npx prisma db push
```

4. **Run the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
wedding-landing/
├── app/
│   ├── (main)/
│   │   └── page.tsx          # Home page
│   ├── admin/                # Admin pages
│   │   ├── login/           # Admin login
│   │   └── page.tsx         # Admin dashboard
│   ├── api/                  # API routes
│   │   ├── rsvp/            # RSVP submission
│   │   └── admin/           # Admin endpoints
│   └── layout.tsx           # Root layout
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── sections/            # Page sections
│   └── forms/               # RSVP forms
├── lib/                     # Utilities
│   ├── db.ts               # Prisma client
│   ├── auth.ts             # Authentication
│   ├── rate-limit.ts       # Rate limiting
│   └── validations.ts      # Zod schemas
└── prisma/
    └── schema.prisma       # Database schema
```

## Customization

### Content

Edit the content in:
- `components/sections/Hero.tsx` - Hero section text
- `components/sections/Details.tsx` - Venue, schedule, dress code
- `components/sections/Story.tsx` - Your story
- `components/sections/FAQ.tsx` - FAQ items

### Colors & Styling

Edit `tailwind.config.ts` to customize:
- Color palette (sunset pastels)
- Typography (fonts, sizes)
- Spacing and border radius

### Glass Effects

The glass refraction effect is implemented in:
- `components/ui/Glass.tsx` - Glass component with SVG filter
- `app/globals.css` - Base glass styles and variants

## Admin Access

1. Navigate to `/admin/login`
2. Enter the password set in `ADMIN_PASSWORD`
3. View, filter, and export RSVP submissions

## Security Features

- **Rate Limiting** - 5 submissions per IP per hour
- **Honeypot Field** - Bot detection
- **Input Validation** - Server-side validation with Zod
- **Session-based Auth** - HTTP-only cookies for admin

## Performance

- Automatic code splitting
- Image optimization (when images are added)
- Font optimization with `next/font`
- CSS purging in production
- Respects `prefers-reduced-motion`

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `ADMIN_PASSWORD`
   - `DATABASE_URL` (or use Vercel's database)
4. Deploy!

### Other Platforms

1. Build the project: `npm run build`
2. Start production server: `npm start`
3. Ensure SQLite database file is persisted (or migrate to PostgreSQL)

**Note:** For production, consider migrating from SQLite to PostgreSQL for better scalability.

## Database Management

- **View data:** `npx prisma studio`
- **Reset database:** Delete `wedding.db` and run `npx prisma db push`
- **Migrate to PostgreSQL:** Update `DATABASE_URL` and run migrations

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Glass effects degrade gracefully on older browsers
- Mobile responsive (iOS Safari, Chrome Mobile)

## License

MIT License - feel free to use for your wedding!

## Support

For issues or questions, please open an issue on GitHub.

---

Made with ❤️ for your special day
