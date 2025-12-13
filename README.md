# Hapien - The Happy Sapien Network 🌟

A private, hyperlocal social network that nurtures friendships and creates new connections within built communities through recurring hangouts.

## 🎯 Overview

Hapien is designed to bring people together in meaningful ways through:
- **Hyperlocal Communities** - Connect with neighbors in your society, campus, or office
- **Hangouts** - The killer feature that lets you organize and join real-world activities
- **Privacy-First** - Content is shared only with friends and community members
- **India-First** - Built with phone OTP authentication and +91 country support

## ✨ Features

### Authentication
- 📱 Phone OTP-based login (India-first with +91)
- 🔐 Secure verification flow via Supabase Auth
- 🎨 Beautiful onboarding with interest selection

### User Profiles
- 👤 Personal profiles with avatar, bio, and interests
- 📝 Wall posting - Share text, images, and videos
- 👥 Post on friends' walls
- 📊 Stats: Friends count, communities, posts
- ✏️ Edit profile with avatar upload

### Friend System
- 🤝 Send, accept, decline friend requests
- 👋 Discover friends from your communities
- 🔍 Search users by name
- 👥 View mutual friends on profiles

### Communities
- 🏠 **Residential Societies** - Connect with neighbors
- 🎓 **College Campuses** - Stay connected with classmates
- 🏢 **Office Complexes** - Network with colleagues
- 🔒 Membership approval by admins
- 👨‍💼 Admin panel for managing members

### Hangouts (Killer Feature)
- 🎉 Create hangouts with customizable details
- 📂 5 Categories: Sports 🏃, Food 🍕, Shopping 🛍️, Learning 📚, Chill 😎
- 📍 Location and time settings
- 👥 Max participants limit
- ✋ RSVP: Going / Interested
- 💬 Comments on hangouts
- 🔒 Visibility: Friends only, Community, or Public

### Feed
- 📰 Home feed with posts from friends and communities
- 🏠 Upcoming hangouts "This Week" section
- 🔖 Filter tabs: All, Friends, Communities
- ❤️ Reactions: Like, Love, Celebrate

### Notifications
- 🔔 Real-time notifications
- 📌 Types: Friend requests, hangout invites, RSVPs, comments, reactions
- ✅ Mark as read / Mark all as read
- 🔢 Unread count badge in header

### Search
- 🔍 Global search across:
  - People (users)
  - Communities
  - Hangouts
- 🏷️ Tab-based filtering

### Settings
- ⚙️ Account management
- 🚪 Sign out functionality

## 🛠️ Tech Stack

- **Framework**: Next.js 14.2.5 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 🎨 Design System

### Colors
- **Primary**: Purple/Violet (#a855f7 → #3b0764)
- **Secondary**: Amber/Yellow (#fbbf24 → #451a03)
- **Tertiary**: Soft Rose (#fb7185 → #4c0519)
- **Neutrals**: Stone palette for text and backgrounds

### Typography
- **Display Font**: Outfit
- **Body Font**: DM Sans

### Components
- Avatar, Badge, Button, Card
- Input, Textarea, Modal
- Tabs, EmptyState, Loading states
- AppShell, Header, BottomNav, FloatingActionButton

## 📁 Project Structure

```
hapien/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/               # Login & verification
│   │   ├── communities/        # Community browse, create, detail, admin
│   │   ├── feed/               # Main feed
│   │   ├── friends/            # Friends management
│   │   ├── hangouts/           # Hangouts browse, create, detail, edit
│   │   ├── notifications/      # Notifications center
│   │   ├── onboarding/         # New user onboarding
│   │   ├── post/               # Post detail & edit
│   │   ├── profile/            # Own profile, other users, edit
│   │   ├── search/             # Global search
│   │   └── settings/           # User settings
│   ├── components/
│   │   ├── feed/               # PostCard, CreatePost, WallPost
│   │   ├── hangouts/           # HangoutCard, CreateHangout
│   │   ├── layout/             # AppShell, Header, BottomNav, FAB
│   │   └── ui/                 # Reusable UI components
│   ├── hooks/                  # Custom React hooks (useAuth, useNotifications)
│   ├── lib/                    # Supabase client setup
│   ├── store/                  # Zustand stores
│   ├── types/                  # TypeScript types
│   └── utils/                  # Helper functions
├── supabase/
│   └── schema.sql              # Database schema & RLS policies
└── public/                     # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd hapien
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql` in the SQL Editor
   - Enable Phone Auth in Authentication settings
   - Create storage buckets: `avatars`, `posts`, `hangouts`, `communities` (all public)

4. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open** http://localhost:3000

## 📊 Database Schema

### Tables
- **users** - User profiles with phone, name, bio, avatar, interests
- **friendships** - Friend connections with status (pending/accepted/rejected)
- **communities** - Community details with type, location, admin
- **community_memberships** - User-community relationships with roles
- **posts** - User posts with content, media, visibility
- **hangouts** - Event details with category, location, date
- **hangout_rsvps** - RSVP responses (going/interested)
- **comments** - Comments on posts and hangouts
- **reactions** - Reactions on posts (like/love/celebrate)
- **notifications** - User notifications

### Row Level Security (RLS)
All tables have RLS policies ensuring users can only access appropriate data:
- Users see their own data and friends' public content
- Community content restricted to members
- Admins have elevated permissions in their communities

## 🔧 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📱 Mobile-First Design

The app is designed mobile-first with:
- Responsive layouts that work on all screen sizes
- Bottom navigation for easy thumb access
- Touch-friendly button sizes and spacing
- Optimized for PWA installation

## 🔐 Privacy & Security

- Phone OTP ensures secure authentication
- Default visibility is friends-only
- Community content requires membership
- RLS policies enforce access control at database level

## 📄 License

Private project for Hapien.com

---

Built with ❤️ for creating meaningful connections in local communities.
