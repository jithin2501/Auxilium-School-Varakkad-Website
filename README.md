# Auxilium School Varakkad — Full-Stack Web Application

> ICSE Affiliated School | Kasaragod, Kerala

A production-ready full-stack web application for Auxilium School Varakkad, featuring a fully responsive public-facing website, a secure admin dashboard, RESTful API, MongoDB database integration, Cloudinary media storage, and automated email notifications.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Frontend — Public Website](#frontend--public-website)
- [Admin Panel](#admin-panel)
- [API Reference](#api-reference)
- [Database Models](#database-models)
- [Deployment](#deployment)
- [Email Notifications](#email-notifications)

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js (ESM) | Server-side JavaScript execution |
| Framework | Express.js | HTTP routing and middleware pipeline |
| Database | MongoDB + Mongoose | Persistent data storage with ODM |
| Auth | Passport.js (Local Strategy) | Session-based admin authentication |
| Sessions | connect-mongodb-session | Persistent sessions stored in MongoDB |
| Media Storage | Cloudinary | Image, video, and PDF hosting |
| File Uploads | Multer (memory storage) | In-memory file buffering before cloud upload |
| Email | Resend API | Transactional email notifications |
| Templating | EJS | Server-rendered admin login/dashboard views |
| Frontend | HTML, CSS, Vanilla JS | Single-Page Application (SPA) client |
| Deployment | Render | Production hosting with env variable support |

---

## Project Structure

```
AUXILIUM-SCHOOL-VARAKKAD/
├── config/
│   ├── db.js                  # MongoDB connection via Mongoose
│   └── nodemailer.js          # Resend API email service wrapper
├── controllers/
│   ├── adminController.js     # Business logic for all admin operations
│   └── publicController.js   # Business logic for all public-facing API endpoints
├── middleware/
│   ├── authMiddleware.js      # noCache, isAdmin, isSuperAdmin middleware
│   ├── logMiddleware.js       # logActivity helper — writes to ActivityLog collection
│   └── uploadMiddleware.js   # Multer config, Cloudinary SDK, upload/delete helpers
├── models/
│   ├── Achievement.js
│   ├── ActivityLog.js
│   ├── Alumnus.js
│   ├── Announcement.js
│   ├── Application.js
│   ├── ContactMessage.js
│   ├── DisclosureDocument.js
│   ├── Faculty.js
│   ├── GalleryItem.js
│   ├── PrincipalMessage.js
│   ├── Result.js
│   └── User.js
├── public/                    # Static assets served directly
│   ├── css/
│   │   ├── base/
│   │   ├── layouts/
│   │   └── modules/
│   ├── images/
│   ├── js/
│   │   ├── admin.js
│   │   └── script.js
│   ├── index.html             # SPA entry point
│   ├── print-admission.html
│   ├── robots.txt
│   ├── sitemap.xml
│   └── site.webmanifest
├── routes/
│   ├── adminRoutes.js         # Protected admin endpoints
│   └── publicRoutes.js       # Public API endpoints
├── views/
│   ├── dashboard.ejs          # Admin panel view
│   └── login.ejs              # Admin login view
├── createAdmin.js             # One-time superadmin setup script
├── server.js                  # Application entry point
├── package.json
└── render.yaml
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB instance)
- Cloudinary account
- Resend account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/auxilium-school-varakkad.git
cd auxilium-school-varakkad

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env
# Then fill in your values in .env
```

### Running Locally

```bash
# Development
npm run dev

# Production
npm start
```

The server starts on `http://localhost:3000` by default (or the `PORT` env variable).

### Creating the Superadmin Account

Run this **once** before first use. It reads credentials from your environment variables and registers the superadmin with a hashed password. Safe to run multiple times — exits gracefully if the user already exists.

```bash
node createAdmin.js
```

---

## Environment Variables

All sensitive credentials are stored as environment variables — never in the codebase.

| Variable | Purpose |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `SESSION_SECRET` | Secret key for signing express-session cookies |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RESEND_API_KEY` | Resend email service API key |
| `SUPERADMIN_USERNAME` | Used only by `createAdmin.js` setup script |
| `SUPERADMIN_PASSWORD` | Used only by `createAdmin.js` setup script |
| `PORT` | Server port — defaults to `3000` if not set |

---

## Scripts

| Command | Description |
|---|---|
| `npm start` | Start the production server |
| `npm run dev` | Start with nodemon for development |
| `node createAdmin.js` | Create the initial superadmin account |

---

## Frontend — Public Website

The public site is built as a **Single-Page Application (SPA)** using HTML, CSS, and Vanilla JavaScript. All navigation is handled client-side with no full page reloads. It is fully responsive across desktop, tablet, and mobile.

### Pages & Sections

| Page | Features |
|---|---|
| Home | Hero banner, About Us, Stats cards, Academics overview, Facilities, Activity scroller |
| Know Us | School history with alternating image-text grid layout |
| Mission & Vision | School mission statement and philosophy |
| School Timing | Weekly schedule table and school year info |
| Groups & Clubs | Four House system with colours and mottos; seven school clubs |
| Rules & Regulations | Accordion-style: General, Library, Leave, Admission/Withdrawal, Homework |
| Faculty & Staff | Dynamically loaded from API — profile cards with photo, qualification, designation |
| Alumni Network | Dynamically loaded alumni profiles with name, graduation year, and achievement |
| Subjects Offered | Curriculum listing by level: KG, LP (I–V), UP (VI–VIII), High School (IX–X) |
| Achievements | Dynamically loaded achievement cards with title, description, and photo |
| Administration | Principal's Message, Mandatory Disclosures, ICSE & ISC Results |
| Photo & Video Gallery | Paginated gallery loaded from Cloudinary via API |
| Admission | Multi-step form (3 steps): Personal details, Document uploads (6 file types), Declaration |
| Contact | Contact form, Google Maps embed, General Inquiries section |

### Key Frontend Features

- Single-Page Application — no full page reloads
- Fully responsive using CSS Grid and Flexbox
- Announcement popup system — pulls active admission poster from backend on load
- Multi-step admission form with step navigation, file upload previews, and validation
- Paginated gallery with separate photo and video sections
- SEO optimized — `robots.txt`, `sitemap.xml`, canonical tags, Open Graph and Twitter meta tags, JSON-LD structured data
- Google Maps embed on contact page
- Activity scroller with CSS animation for school events

---

## Admin Panel

Accessible at `/admin`. Uses EJS templates. All admin endpoints are protected by Passport.js session-based authentication with role-based access control.

### Roles

| Role | Access |
|---|---|
| `admin` | All content management modules |
| `superadmin` | All admin access + user management |

### Authentication & Security

- Session-based authentication via Passport.js Local Strategy
- Passwords hashed and salted by `passport-local-mongoose` — never stored in plaintext
- Persistent sessions stored in MongoDB via `connect-mongodb-session`
- `noCache` middleware prevents authenticated pages from being cached by the browser
- Protected routes return `401`/`403` for API requests and redirect for browser requests
- Activity logging on all significant admin actions (login, logout, create, update, delete)

### Management Modules

| Module | Access | Capabilities |
|---|---|---|
| Applications & Messages | Admin | View all admission applications and contact messages; view full details with documents; delete with Cloudinary cleanup |
| Gallery Management | Admin | Upload photos/videos; edit title/description; delete with Cloudinary asset removal |
| Alumni Management | Admin | Add/edit/delete alumni profiles with face-cropped photo (400×400) |
| Faculty & Staff | Admin | Add/edit/delete faculty profiles; optional photo replacement (old photo auto-deleted) |
| Principal's Message | Admin | Create/update/delete; only one active at a time — previous entries auto-deleted |
| Achievements | Admin | Upload/edit/delete achievement entries with photo |
| ICSE & ISC Results | Admin | Add/edit/delete student result entries with photo |
| Public Disclosures | Admin | Upload/delete mandatory disclosure documents (PDF or image) by type |
| Admission Poster | Admin | Upload poster; toggle visibility; set auto-expiry date |
| User Management | Superadmin only | Create/view/delete admin accounts; cannot delete superadmin or own account |

---

## API Reference

All public API endpoints are prefixed with `/api` (no authentication required). All admin endpoints are prefixed with `/admin` and require an active session.

### Public Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/contact` | Submit a contact form message |
| `POST` | `/api/submitapplication` | Submit admission application with multi-file upload |
| `GET` | `/api/gallery` | Fetch all gallery items sorted by upload date |
| `GET` | `/api/alumni` | Fetch all alumni profiles sorted by upload date |
| `GET` | `/api/faculty` | Fetch all faculty profiles sorted alphabetically |
| `GET` | `/api/principalmessage` | Fetch the latest principal's message |
| `GET` | `/api/achievements` | Fetch all achievement entries |
| `GET` | `/api/results` | Fetch all ICSE/ISC results sorted by type and percentage |
| `GET` | `/api/disclosure` | Fetch all public disclosure documents |
| `GET` | `/api/announcement` | Fetch active announcement poster; returns `null` if expired or inactive |

### Admin Endpoints

<details>
<summary>Authentication</summary>

| Method | Route | Description |
|---|---|---|
| `GET` | `/admin` | Render login page or dashboard |
| `POST` | `/admin/login` | Authenticate admin; redirect to dashboard |
| `GET` | `/admin/logout` | Log out admin; activity logged |

</details>

<details>
<summary>Applications & Messages</summary>

| Method | Route | Description |
|---|---|---|
| `GET` | `/admin/applications` | Fetch all applications and contact messages |
| `GET` | `/admin/applications/:id` | Fetch full details of a single application |
| `DELETE` | `/admin/applications/:id` | Delete application and Cloudinary assets |

</details>

<details>
<summary>Gallery</summary>

| Method | Route | Description |
|---|---|---|
| `POST` | `/admin/gallery/upload` | Upload photo or video (up to 100 MB) |
| `PUT` | `/admin/gallery/:id` | Update title and description |
| `DELETE` | `/admin/gallery/:id` | Delete gallery item and Cloudinary asset |

</details>

<details>
<summary>Alumni, Faculty, Principal, Achievements, Results, Disclosures, Announcement, Users</summary>

Each resource follows standard CRUD patterns: `POST` to create, `GET` to list, `PUT /:id` to update, `DELETE /:id` to delete — with Cloudinary cleanup on all deletes. See the full project report for complete endpoint tables.

</details>

---

## Database Models

The application uses 12 Mongoose schemas with ES Module named exports:

| Model | Description |
|---|---|
| `User` | Admin/superadmin accounts via `passport-local-mongoose` |
| `Application` | Admission form submissions with uploaded document metadata |
| `ContactMessage` | Contact form submissions |
| `GalleryItem` | Photo and video gallery items |
| `Alumnus` | Alumni profiles |
| `Faculty` | Faculty and staff profiles |
| `PrincipalMessage` | Principal's message (single active entry) |
| `Achievement` | School achievement entries |
| `Result` | ICSE/ISC student result entries |
| `DisclosureDocument` | Mandatory public disclosure documents |
| `Announcement` | Admission poster with visibility toggle and auto-expiry |
| `ActivityLog` | Audit trail of all admin actions |

### File Upload Configuration

| Configuration | Size Limit | Used For |
|---|---|---|
| `admissionUpload` | 25 MB | Admission application documents |
| `galleryUpload` | 100 MB | Photo and video gallery uploads |
| `alumniUpload` | 10 MB | Profile photos (alumni, faculty, principal, etc.) |

Uploads are piped directly to Cloudinary using a streaming approach (no disk writes, no base64 conversion). PDFs are uploaded as `resource_type: 'raw'`. Bulk deletion is handled via `cloudinary.api.delete_resources()`.

---

## Deployment

The application is deployed on **Render** with the following configuration:

- HTTPS/TLS termination handled by Render
- `www` → non-www redirect configured at the Render Custom Domains level
- All environment variables stored securely on the Render dashboard
- **MongoDB Atlas** as the managed cloud database
- **Cloudinary** as the managed media storage platform

### SEO Configuration

- `robots.txt` and `sitemap.xml` registered **before** static middleware to ensure priority routing
- Canonical URL tags in `index.html`
- Open Graph and Twitter Card meta tags
- JSON-LD structured data (`WebSite` and `EducationalOrganization` schemas)

---

## Email Notifications

Powered by the **Resend API**. Two automated emails are sent on user-initiated events:

### Contact Form Submission
Sent to `auxiliumvarakkad@gmail.com` containing sender name, email, mobile, subject, message text, and submission timestamp.

### Admission Application Submission
Sent to the school containing pupil name, class applied for, father's mobile, date of birth, and clickable Cloudinary links to each uploaded document.

> Email delivery failures are logged but do not prevent data from being saved — the database write always completes first.

---

## License

This project was developed for Auxilium School Varakkad. All rights reserved.
