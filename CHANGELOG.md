<div align="center">

# 📋 Changelog

### Version History for Freeform Digital Board

</div>

---

## [1.1.0] - 2026-01-11

### ✨ Added
- **Pin Metadata Section** - New dedicated sidebar section for creating labels and groups
- **Category Name Display** - Board header now shows the actual category name instead of count
- **Enhanced Search** - Collapsible search bar that starts as an icon and expands horizontally

### 🔄 Changed
- **Label & Group Creation** - Moved "Create New Label" and "Create New Group" buttons from context menu to left sidebar for better accessibility
- **Board Categories** - Changed from multi-select to single-select dropdown in Board Settings modal for cleaner organization
- **UI Organization** - Streamlined context menu by removing creation buttons, keeping only assignment and management options

### 🐛 Fixed
- **Group Creation API** - Verified and ensured proper functionality of group creation endpoint
- **TypeScript Errors** - Resolved JSX structure and compilation issues
- **Database Integration** - Fixed category loading and display in board editor

### 📝 Technical Details
- Updated `BoardSettingsModal.tsx` to use single category dropdown instead of multi-select buttons
- Modified `page.tsx` to fetch and display user categories
- Improved state management for single category selection (`selectedCategory` vs `selectedCategories`)
- Enhanced board header to dynamically show category name from API data

---

## [1.0.0] - Initial Release

### 🎨 Canvas Workspace
- **Infinite Canvas** - Unlimited space to arrange your content
- **Multiple Pin Types** - Support for notes, lists, images, links, and attachments
- **Drag & Drop** - Intuitive drag-and-drop interface for all pin types
- **Zoom & Pan** - Smooth navigation with Ctrl/⌘ + scroll to zoom, Shift or middle-click to pan
- **Flexible Resizing** - Resize pins with corner handles (images respect natural dimensions)
- **Wire Connections** - Connect pins with curved Bézier lines for visual relationships
- **Marquee Selection** - Multi-select pins using Ctrl + drag

### 🏷️ Organization
- **Board-Level Metadata**
  - Tags - Multi-select tagging system for boards
  - Categories - Single-category assignment for board organization
- **Pin-Level Metadata**
  - Labels - Board-scoped, multi-select labels for pins
  - Groups - Board-scoped, single-select grouping for pins
- **Smart Filtering** - Filter pins by labels and groups in real-time
- **Search Functionality** - Search pins by title and content with collapsible UI

### 💾 Data Management
- **Auto-save** - Changes persist automatically with 650ms debounce
- **Non-Destructive History** - Full undo/redo support that preserves navigation history
- **Smart History** - Only tracks meaningful pin actions (create, delete, move, resize, edit)
- **History Navigation** - Browse past states without losing future states
- **Snapshots** - Save named versions with notes and restore them anytime
- **Version Control** - Track and manage board states over time (50 state limit)

### 🔐 Authentication & Security
- **Clerk Authentication** - Secure user authentication and session management
- **User Profiles** - Personalized workspace for each user
- **User Sync** - Automatic user data synchronization
- **Data Persistence** - PostgreSQL database with Prisma ORM
- **Board Ownership** - User-scoped board access and management

### 🎯 User Experience
- **Context Menus** - Right-click actions for quick operations
  - Copy, duplicate, delete pins
  - Assign labels and groups
  - Manage wire connections
  - Lock/unlock pins
- **Keyboard Shortcuts**
  - `Ctrl/⌘ + C` - Copy pin
  - `Ctrl/⌘ + V` - Paste pin
  - `Delete/Backspace` - Delete selected pin
  - `Ctrl/⌘ + Z` - Undo
  - `Ctrl/⌘ + Shift + Z` - Redo
- **Dark Mode UI** - Eye-friendly dark interface with custom scrollbars
- **Responsive Design** - Works seamlessly across devices
- **Toast Notifications** - Real-time feedback for user actions
- **Loading States** - Smooth loading indicators for async operations

### 🎨 Pin Types
1. **Note Pins** - Rich text notes with title and content
2. **List Pins** - Bullet-point lists with auto-formatting
3. **Image Pins** - Image uploads with automatic resizing (720px max, 8MB limit)
4. **Link Pins** - URL previews with metadata
5. **Attachment Pins** - File attachments up to 1MB

### 🛠️ Board Tools
- **Wire Tool** - Create curved connections between pins (Photoshop pen tool style)
- **Selection Tool** - Single and multi-pin selection
- **Pan Tool** - Canvas navigation (Shift + drag or middle-click)
- **Zoom Controls** - Dedicated zoom in/out buttons with percentage display

### 📊 Dashboard Features
- **Board Management** - Create, edit, and delete boards
- **Board Settings Modal** - Configure title, description, tags, and category
- **Board Preview** - Mini-map showing all pins in bottom-right corner
- **Primary Board** - Automatic primary board creation for new users

### 🔌 API Architecture
- **RESTful API** - Complete REST API for all operations
- **Board Endpoints** - CRUD operations for boards
- **Snapshot Endpoints** - Version control operations
- **Label/Group Endpoints** - Board-scoped metadata management
- **Tag/Category Endpoints** - User-scoped organization
- **User Endpoints** - Profile and sync operations

### 🏗️ Technical Stack
- **Frontend**
  - Next.js 16.1 with App Router
  - React 19.2
  - TypeScript 5.x
  - TailwindCSS with custom utilities
  - Framer Motion for animations
  - Lucide React icons
  - React Hot Toast notifications
  
- **Backend**
  - Prisma 6.18 ORM
  - PostgreSQL database
  - Clerk authentication
  - JSON state serialization

### 📦 Infrastructure
- **Docker Support** - PostgreSQL containerization
- **Migration System** - Prisma migration management
- **Environment Configuration** - Secure environment variable handling
- **Auto-deployment** - Vercel-ready deployment configuration

### 🎨 UI/UX Highlights
- **Collapsible Sidebar** - Toggle sidebar visibility for maximum canvas space
- **Floating Search** - Non-intrusive search with expand/collapse animation
- **History Panel** - Dedicated history viewer with "Current" and "Latest" badges
- **Smart Scrolling** - Custom scrollbar styling with hover effects
- **Animated Transitions** - Smooth page transitions and modal animations
- **Loading Indicators** - Context-aware loading states throughout the app

---

<div align="center">

### Legend

`Added` - New features and functionality  
`Changed` - Changes to existing features  
`Fixed` - Bug fixes  
`Removed` - Removed features  
`Security` - Security improvements

---

[1.1.0]: https://github.com/NeerajCodz/Digital-Circuit-Simulator/releases/tag/v1.1.0  
[1.0.0]: https://github.com/NeerajCodz/Digital-Circuit-Simulator/releases/tag/v1.0.0

</div>
