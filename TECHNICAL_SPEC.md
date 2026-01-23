# Technical Specification: Premium Wedding Landing Website

## Technology Stack

### Frontend Framework
**Next.js 14+ (App Router)**
- **Rationale**: 
  - Server-side rendering for SEO
  - Built-in API routes for backend logic
  - Excellent performance with automatic code splitting
  - Image optimization built-in
  - TypeScript support out of the box

### Styling
**Tailwind CSS 3+**
- **Rationale**:
  - Utility-first for rapid development
  - Excellent responsive design support
  - Custom theme configuration for design tokens
  - PurgeCSS for minimal bundle size

**CSS Modules / Custom CSS**
- For glass refraction effects that require SVG filters
- Custom animations and complex backdrop-filter combinations

### Language
**TypeScript**
- Type safety for forms, API routes, and data models
- Better developer experience and fewer runtime errors

### Data Persistence
**SQLite + Prisma ORM**
- **Rationale**:
  - File-based database (no external service needed)
  - Perfect for small-to-medium wedding RSVP volumes
  - Prisma provides type-safe database access
  - Easy to backup (single file)
  - Can migrate to PostgreSQL later if needed

**Schema:**
```prisma
model RSVPSubmission {
  id          String   @id @default(cuid())
  name        String
  email       String?
  phone       String?
  attending   Boolean  // true = Yes, false = No
  guestCount  Int?     // null if declined
  dietaryPrefs String?
  message     String?
  submittedAt DateTime @default(now())
  ipAddress   String?  // for rate limiting
}
```

### Form Handling
**React Hook Form + Zod**
- **Rationale**:
  - React Hook Form: performant, minimal re-renders
  - Zod: runtime validation, type inference
  - Excellent error handling and accessibility

### Glass Refraction Implementation

**Primary Approach: SVG Filters**
- Use SVG `<filter>` with `feTurbulence` and `feDisplacementMap`
- Apply via CSS `filter: url(#glass-refraction)`
- Creates true distortion/refraction effect

**Fallback Approach:**
- Enhanced `backdrop-filter: blur()` with multiple layers
- Additional `brightness()` and `saturate()` filters
- CSS `mask-image` for edge effects

**Implementation Strategy:**
1. Create reusable `<Glass>` React component
2. Component accepts: `variant`, `children`, `className`
3. Inline SVG filter definition (or reference to global filter)
4. CSS classes for base glass styling
5. Responsive blur values (smaller on mobile)

### API Routes

**Next.js API Routes Structure:**
```
/api/rsvp
  POST /api/rsvp/submit
    - Body: { name, email?, phone?, attending, guestCount?, dietaryPrefs?, message? }
    - Returns: { success: boolean, id?: string, error?: string }
    - Rate limiting: 5 submissions per IP per hour

/api/admin
  GET /api/admin/submissions
    - Query: ?attending=true|false|all
    - Auth: Basic auth or session token
    - Returns: { submissions: RSVPSubmission[] }
  
  GET /api/admin/export
    - Query: ?format=csv|json&attending=true|false|all
    - Auth: Required
    - Returns: CSV/JSON file download
```

### Authentication (Admin)

**Simple Password-Based Auth**
- Environment variable: `ADMIN_PASSWORD`
- Session-based (NextAuth.js simple setup, or custom JWT)
- Alternative: HTTP Basic Auth for simplicity (acceptable for small-scale)

**Implementation:**
- Login page: `/admin/login`
- Session stored in HTTP-only cookie
- Middleware to protect `/admin/*` routes

### Security & Abuse Prevention

1. **Rate Limiting:**
   - 5 RSVP submissions per IP per hour
   - Store IP in database, check on submission
   - Return 429 if exceeded

2. **Honeypot Field:**
   - Hidden form field (CSS `display: none`)
   - If filled, reject as bot

3. **Input Validation:**
   - Server-side validation with Zod
   - Sanitize all inputs
   - Prevent XSS (React escapes by default)

4. **CSRF Protection:**
   - Next.js provides built-in CSRF protection for API routes

5. **SQL Injection:**
   - Prisma ORM prevents SQL injection (parameterized queries)

### Performance Strategy

**Optimization Techniques:**
1. **Code Splitting:**
   - Next.js automatic route-based splitting
   - Dynamic imports for heavy components (if any)

2. **Image Optimization:**
   - Next.js `<Image>` component
   - WebP format with fallbacks
   - Lazy loading

3. **Font Optimization:**
   - Next.js font optimization (`next/font`)
   - Preload critical fonts
   - Font-display: swap

4. **CSS Optimization:**
   - Tailwind purge for production
   - Critical CSS inlined
   - Defer non-critical CSS

5. **JavaScript:**
   - Tree shaking
   - Minification
   - Compression (gzip/brotli)

6. **Database:**
   - Index on `submittedAt` for admin queries
   - Connection pooling (Prisma handles this)

**Fallback Strategy:**
- **Reduced Motion**: Detect `prefers-reduced-motion`, disable parallax and complex animations
- **Low-End Devices**: 
  - Reduce glass blur (15px instead of 25px)
  - Disable SVG filters, use simpler backdrop-filter
  - Reduce animation complexity
  - Lazy load non-critical sections

**Performance Targets:**
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.5s
- Lighthouse Score: 90+ (Performance, Accessibility, Best Practices, SEO)

### SEO Strategy

1. **Metadata:**
   - Dynamic metadata per page (Next.js Metadata API)
   - Open Graph tags
   - Twitter Card tags
   - Structured data (JSON-LD) for event

2. **Semantic HTML:**
   - Proper heading hierarchy (h1 → h2 → h3)
   - Landmark elements (`<main>`, `<section>`, `<nav>`)
   - Alt text for images

3. **URLs:**
   - Clean, descriptive URLs
   - Sitemap generation

4. **Content:**
   - Descriptive, keyword-rich content
   - Fast loading (affects SEO)

### Project Structure

```
wedding-landing/
├── app/
│   ├── (main)/
│   │   ├── page.tsx              # Home page
│   │   └── layout.tsx            # Main layout
│   ├── admin/
│   │   ├── login/
│   │   │   └── page.tsx          # Admin login
│   │   ├── page.tsx              # Admin dashboard
│   │   └── layout.tsx           # Admin layout
│   ├── api/
│   │   ├── rsvp/
│   │   │   └── submit/
│   │   │       └── route.ts     # RSVP submission endpoint
│   │   └── admin/
│   │       ├── submissions/
│   │       │   └── route.ts     # Get submissions
│   │       └── export/
│   │           └── route.ts     # Export CSV/JSON
│   └── layout.tsx                # Root layout
├── components/
│   ├── ui/
│   │   ├── Glass.tsx            # Glass component
│   │   ├── Button.tsx           # Glass button
│   │   └── Input.tsx            # Form input
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── QuickCards.tsx
│   │   ├── Story.tsx
│   │   ├── Details.tsx
│   │   ├── RSVP.tsx
│   │   └── FAQ.tsx
│   └── forms/
│       ├── RSVPForm.tsx         # Yes form
│       └── DeclineForm.tsx      # No form
├── lib/
│   ├── db.ts                    # Prisma client
│   ├── rate-limit.ts            # Rate limiting utility
│   ├── auth.ts                  # Auth utilities
│   └── validations.ts           # Zod schemas
├── styles/
│   ├── globals.css              # Global styles, glass effects
│   └── animations.css           # Keyframe animations
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Auto-generated
├── public/                      # Static assets
├── .env.local                   # Environment variables
├── .env.example                 # Example env file
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

### Environment Variables

```env
# Database
DATABASE_URL="file:./wedding.db"

# Admin
ADMIN_PASSWORD="your-secure-password-here"

# Optional: Analytics, etc.
NEXT_PUBLIC_SITE_URL="https://your-wedding-site.com"
```

### Deployment Considerations

**Recommended Platforms:**
- **Vercel**: Native Next.js support, easy deployment
- **Netlify**: Good alternative
- **Self-hosted**: Node.js server with PM2

**Database:**
- SQLite file can be stored in persistent volume
- Or migrate to PostgreSQL for production (Prisma makes this easy)

**Environment:**
- Set `ADMIN_PASSWORD` in production environment
- Use secure, randomly generated password
- Enable HTTPS (automatic on Vercel/Netlify)

### Testing Strategy

**Manual Testing:**
- Test RSVP forms (Yes/No)
- Test admin login and export
- Test responsive design (mobile, tablet, desktop)
- Test accessibility (keyboard navigation, screen reader)
- Test with `prefers-reduced-motion` enabled

**Automated Testing (Optional):**
- Form validation tests
- API endpoint tests
- E2E tests for critical flows (Playwright/Cypress)

### Future Extensibility

**Easy to Add:**
- Photo gallery (Next.js Image optimization)
- Multi-language support (next-intl)
- Email notifications (Resend, SendGrid)
- Calendar integration (ICS file generation)
- Custom invitation codes
- Guest list management
- Seating chart

**Architecture Supports:**
- Component-based: easy to add new sections
- API routes: easy to add new endpoints
- Database: Prisma migrations for schema changes
- Styling: Tailwind makes theme changes simple
