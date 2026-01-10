<div align="center">

# 📋 Freeform Digital Board

### A modern, infinite canvas workspace for organizing your ideas

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.18-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat)](LICENSE)

[Features](#-features) • [Screenshots](#-screenshots) • [Getting Started](#-getting-started) • [Tech Stack](#-tech-stack) • [API Documentation](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 About

**Freeform Digital Board** is a canvas-first web application that lets you create, organize, and manage content on an infinite board. Drop notes, lists, and images anywhere, organize them with tags and categories, zoom/pan around your workspace, and save snapshots for version control.

Perfect for brainstorming, project planning, mood boards, visual note-taking, and creative workflows.

---

## ✨ Features

### 🎨 **Canvas Workspace**
- **Infinite Canvas** - Unlimited space to arrange your content
- **Multiple Pin Types** - Notes, lists, and images with drag-and-drop support
- **Zoom & Pan** - Smooth navigation (Ctrl/⌘ + scroll to zoom, Shift or middle-click to pan)
- **Flexible Resizing** - Resize pins with corner handles (images respect natural dimensions)

### 🏷️ **Organization**
- **Tags & Categories** - Organize pins with custom tags and grouping
- **Smart Filtering** - Filter content by tags for quick access
- **Label Management** - Create and manage custom labels

### 💾 **Data Management**
- **Auto-save** - Changes persist automatically between sessions
- **Undo/Redo** - Full history support for local actions
- **Snapshots** - Save named versions and restore them anytime
- **Version Control** - Track and manage board states over time

### 🔐 **Authentication & Sync**
- **Clerk Authentication** - Secure user authentication and management
- **User Profiles** - Personalized workspace for each user
- **Data Persistence** - PostgreSQL database with Prisma ORM

### 🎯 **User Experience**
- **Responsive Design** - Works seamlessly across devices
- **Dark Mode Support** - Eye-friendly interface options
- **Context Menus** - Right-click actions for quick operations
- **Keyboard Shortcuts** - Efficient workflow with hotkeys

---

## 📸 Screenshots
<img width="1895" height="862" alt="image" src="https://github.com/user-attachments/assets/f457ac2d-9539-4ca0-af00-7c856cea13f7" />
<img width="1901" height="867" alt="image" src="https://github.com/user-attachments/assets/58f750e6-e1d1-4c65-b70a-bc02a987a0ef" />
<img width="1919" height="865" alt="image" src="https://github.com/user-attachments/assets/28e115b2-3def-46fa-a536-278c088d1354" />
<img width="1917" height="864" alt="image" src="https://github.com/user-attachments/assets/14382300-f6ff-4c3d-85b8-8d349bc2c6dd" />
<img width="1919" height="871" alt="image" src="https://github.com/user-attachments/assets/b7e7b9ba-07bc-4e7f-a533-d7968a9adc9d" />

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **pnpm** (package manager)
- **Docker** (for PostgreSQL database)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/NeerajCodz/Digital-Circuit-Simulator.git
   cd Digital-Circuit-Simulator
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up PostgreSQL with Docker**
   ```bash
   docker run --name freeform-board-db \
     -e POSTGRES_USER=board_user \
     -e POSTGRES_PASSWORD=board_pass \
     -e POSTGRES_DB=board_db \
     -p 5432:5432 \
     -d postgres:16
   ```

4. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://board_user:board_pass@localhost:5432/board_db"
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   
   # Optional: Clerk Webhook Secret (for user sync)
   CLERK_WEBHOOK_SECRET=your_webhook_secret
   ```
   
   > Get your Clerk credentials from [Clerk Dashboard](https://clerk.com/)

5. **Run database migrations**
   ```bash
   pnpm prisma migrate dev --name init
   pnpm prisma generate
   ```

6. **Start the development server**
   ```bash
   pnpm dev
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[TailwindCSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[React Flow](https://reactflow.dev/)** - Node-based UI library
- **[Lucide React](https://lucide.dev/)** - Icon library
- **[React Hot Toast](https://react-hot-toast.com/)** - Toast notifications

### Backend
- **[Prisma](https://www.prisma.io/)** - Next-generation ORM
- **[PostgreSQL](https://www.postgresql.org/)** - Relational database
- **[Clerk](https://clerk.com/)** - Authentication and user management

### Development Tools
- **[ESLint](https://eslint.org/)** - Code linting
- **[pnpm](https://pnpm.io/)** - Fast, disk space efficient package manager

---

## 🏗️ Project Structure

```
freeform-digital-board/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── boards/          # Board management
│   │   ├── categories/      # Category management
│   │   ├── labels/          # Label management
│   │   └── tags/            # Tag management
│   ├── board/[id]/          # Board detail page
│   ├── dashboard/           # Dashboard page
│   └── [[...rest]]/         # Landing page
├── components/              # React components
│   ├── landing-page/       # Landing page components
│   └── *.tsx               # Shared components
├── lib/                     # Utility libraries
│   ├── auth.ts             # Auth helpers
│   ├── prisma.ts           # Prisma client
│   └── board-state.ts      # Board state management
├── prisma/                  # Database schema and migrations
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Migration files
├── types/                   # TypeScript type definitions
└── public/                  # Static assets
```

---

## 📚 How It Works

### Data Model
- **Boards** - Store the complete board state as JSON (pins, tags, groups, viewport)
- **Snapshots** - Named, restorable versions of board states
- **Categories** - Organize boards into categories
- **Labels** - Custom labels for board organization

### State Management
- **Client-side History** - Maintains past/present/future states for undo/redo
- **Debounced Persistence** - Auto-saves changes to the database
- **Separation of Concerns** - History and persistence are independent

### Key Interactions
- **Double-click** empty canvas to create a note
- **Drag** pins to reposition them
- **Resize** using corner handles (images honor minimum natural size)
- **Pan** with Shift + drag or middle-click
- **Zoom** with Ctrl/⌘ + scroll
- **Undo/Redo** via toolbar buttons
- **Snapshots** can be created, listed, restored, or deleted

---

## 🔌 API Documentation

### Boards
```
GET    /api/boards/primary              # Get or create user's primary board
GET    /api/boards                      # List all user boards
POST   /api/boards                      # Create a new board
GET    /api/boards/:id                  # Get board by ID
PATCH  /api/boards/:id                  # Update board (title, description, state)
DELETE /api/boards/:id                  # Delete board
```

### Snapshots
```
GET    /api/boards/:id/snapshots        # List snapshots for a board
POST   /api/boards/:id/snapshots        # Create a new snapshot
GET    /api/boards/:id/snapshots/:sid   # Get snapshot by ID
DELETE /api/boards/:id/snapshots/:sid   # Delete snapshot
POST   /api/boards/:id/snapshots/:sid/restore  # Restore board to snapshot state
```

### Categories
```
GET    /api/categories                  # List all categories
POST   /api/categories                  # Create a new category
GET    /api/categories/:id              # Get category by ID
PATCH  /api/categories/:id              # Update category
DELETE /api/categories/:id              # Delete category
```

### Board Categories (Linking)
```
GET    /api/board-categories            # List board-category associations
POST   /api/board-categories            # Link board to category
DELETE /api/board-categories/:id        # Unlink board from category
```

### Labels
```
GET    /api/labels                      # List all labels
POST   /api/labels                      # Create a new label
```

### Tags
```
GET    /api/tags                        # List all tags
POST   /api/tags                        # Create a new tag
```

### User
```
GET    /api/user/profile                # Get user profile
PATCH  /api/user/profile                # Update user profile
POST   /api/user/sync                   # Sync user data
```

---

## 🚢 Deployment

### Environment Setup
Ensure all environment variables are configured in your hosting platform:
```env
DATABASE_URL=your_production_database_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

### Database Migration
Run migrations in your production environment:
```bash
pnpm prisma migrate deploy
pnpm prisma generate
```

### Build and Start
```bash
pnpm build
pnpm start
```

### Deployment Platforms

#### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

#### Docker
```dockerfile
# Example Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install -g pnpm
RUN pnpm install
COPY . .
RUN pnpm prisma generate
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Contribution Guidelines
- Keep changes scoped and readable
- Favor clear state updates over ad-hoc mutations
- Board state is JSON-first to keep API payloads compact
- Extend the `BoardState` type if adding new pin capabilities
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 📝 Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm prisma studio # Open Prisma Studio (DB GUI)
```

---

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL container is running: `docker ps`
- Check database credentials in `.env.local`
- Restart the database container: `docker restart freeform-board-db`

### Authentication Issues
- Verify Clerk keys are correct
- Check that Clerk app is configured properly
- Ensure allowed origins include `localhost:3000` in Clerk dashboard

### Build Errors
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && pnpm install`
- Regenerate Prisma client: `pnpm prisma generate`

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Neeraj Sathish Kumar**

- GitHub: [@NeerajCodz](https://github.com/NeerajCodz)
- Project: [Freeform Digital Board](https://github.com/NeerajCodz/Digital-Circuit-Simulator)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) team for the amazing framework
- [Clerk](https://clerk.com/) for authentication infrastructure
- [Prisma](https://www.prisma.io/) for the excellent ORM
- All contributors who help improve this project

---

## 📮 Support

If you have questions or need help, please:
- Open an [issue](https://github.com/NeerajCodz/Digital-Circuit-Simulator/issues)
- Check existing issues for solutions
- Review the documentation above

---

## 👤 Author
<div align="center">

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/neerajcodz">
        <img src="https://github.com/neerajcodz.png" width="100" height="100" style="border: 3px solid #4CAF50; border-radius: 50%;">
        <br>
        <sub><b>Neeraj Sathish Kumar</b></sub>
      </a>
    </td>
  </tr>
</table>

</div>
---
