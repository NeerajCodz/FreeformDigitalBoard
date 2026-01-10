import { StickyNote, Grid, Camera } from "lucide-react"

export const faqs = [
    {
        id: 1,
        question: "What is a Freeform Digital Board?",
        answer:
            "A freeform digital board is an infinite canvas where you can create, organize, and visualize your ideas. Add notes, lists, and images anywhere, then organize them with tags, categories, and visual grouping.",
    },
    {
        id: 2,
        question: "How do I start creating?",
        answer:
            "Simply click 'Start Creating' to access your board. Click the toolbar to add notes, lists, or upload images. Drag pins around the canvas, resize them, and organize with tags and categories. Your work auto-saves as you create.",
    },
    {
        id: 3,
        question: "What can I create on the board?",
        answer:
            "You can create text notes for ideas and thoughts, checklists for tasks and projects, upload images for visual inspiration, and organize everything with custom tags, categories, and groups. It's perfect for brainstorming, project planning, and visual thinking.",
    },
    {
        id: 4,
        question: "Is the platform free to use?",
        answer:
            "Yes! Our freeform digital board is completely free to use. Create an account with Clerk authentication and start building your boards immediately. No hidden fees or limitations.",
    },
    {
        id: 5,
        question: "Can I save and share my boards?",
        answer:
            "Your boards auto-save to our secure database. You can create unlimited boards and save snapshots to preserve specific versions. Future updates will include board sharing and collaboration features.",
    },
    {
        id: 6,
        question: "What are snapshots?",
        answer:
            "Snapshots are saved versions of your board at a specific point in time. You can create snapshots to preserve your work, then restore them later if needed. It's like version control for your ideas!",
    },
]

export const services = [
    {
        id: 1,
        title: "Flexible Notes & Lists",
        description: "Create text notes and checklists anywhere on your infinite canvas. Drag, resize, and organize freely.",
        icon: StickyNote,
        color: "bg-emerald-500",
    },
    {
        id: 2,
        title: "Visual Organization",
        description: "Use tags, categories, labels, and groups to organize your content. Search and filter instantly.",
        icon: Grid,
        color: "bg-emerald-500",
    },
    {
        id: 3,
        title: "Rich Media Support",
        description: "Upload images to your board for visual inspiration. Everything is draggable and resizable.",
        icon: Camera,
        color: "bg-emerald-500",
    },
]