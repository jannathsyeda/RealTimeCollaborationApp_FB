
## ✨ Overview

Real-Time Collaborative Whiteboard is a modern web application that enables multiple users to draw, sketch, and collaborate together in real-time. Whether you're brainstorming with your team, teaching remotely, or creating art with friends, this whiteboard provides a smooth, intuitive experience with powerful collaboration features.

Built with React and Socket.IO, the app offers instant synchronization across all connected users, allowing you to see cursors, strokes, and changes as they happen. With flexible collaboration modes and comprehensive drawing tools, it's perfect for teams of any size.

---

## 🚀 Live Demo

https://realtimecollaborationapp-fb-1.onrender.com


## 🌟 Key Features

### 🎨 Drawing & Canvas

- **Versatile Drawing Tools**
  - Pencil/Draw tool for freehand sketching
  - Eraser tool for corrections
  - Adjustable brush size (1-30px) for precise control
  - Color picker with 8 preset colors
  - Custom color selection with hex input

- **Canvas Features**
  - 900x600 canvas optimized for collaboration
  - Clear canvas functionality
  - Real-time stroke rendering
  - Smooth touch support for mobile devices
  - Stroke counter to track activity

### 👥 Real-Time Collaboration

- **Live Synchronization**
  - WebSocket-powered instant updates via Socket.IO
  - See other users drawing in real-time
  - Live cursor tracking with user names
  - Online user counter
  - Visual indicators for active collaborators

- **Flexible Collaboration Modes**
  - **Invite Only**: Restrict editing to invited users only
  - **Open Access**: Anyone with the link can edit
  - **View Only**: Allow viewers without editing permissions

- **User Management**
  - User authentication with name and email
  - Unique user avatars with customizable colors
  - Login/logout system
  - Real-time presence indicators (online/offline)
  - User dropdown menu with quick actions

### 🔒 Access Control & Security

- **Layer Lock System**
  - Lock/unlock canvas to prevent unwanted edits
  - Visual "Layer Locked" warning badge
  - Owner-controlled locking mechanism

- **Collaboration Management**
  - Share board link with one-click copy
  - Invite users via email
  - Manage collaborators list
  - Remove collaborators (owner privilege)
  - Mode-based access restrictions

### ⚙️ Customization & Settings

- **User Profile**
  - Edit name and email
  - Choose from 8 preset avatar colors or create custom colors
  - View user ID and join date
  - Track last updated timestamp

- **App Settings**
  - Theme switcher (Light/Dark/Auto)
  - Sound effects toggle
  - Notifications control
  - Auto-save functionality

### 💾 Persistent Storage

- **Backend Integration**
  - MongoDB database for reliable data storage
  - Automatic board persistence (all strokes saved)
  - User data and preferences stored
  - Collaboration settings preserved
  - Layer lock state maintained
  - Auto-load board on page refresh

### 🎭 Modern UI/UX

- **Beautiful Interface**
  - Gradient backgrounds with glassmorphism effects
  - Full dark mode support
  - Responsive design for all devices
  - Mobile-friendly touch interactions
  - Smooth animated transitions
  - Status bar with real-time information

- **Visual Feedback**
  - "Drawing..." indicator during active strokes
  - Active tool highlighting
  - Hover effects and transitions
  - Modal dialogs for settings
  - Toast notifications for actions
  - Loading states for async operations

### 📊 Real-Time Status Monitoring

- Current tool and color display
- Brush size indicator
- Stroke count tracker
- Online users count
- Active collaborators list
- User cursors with name labels

---




## 🛠️ Technology Stack

### Frontend
- **React** - Modern UI framework
- **Socket.IO Client** - Real-time bidirectional communication
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling with dark mode
- **Lucide React** - Beautiful icon library
- **Context API + Reducers** - State management

### Backend
- **Express.js** - Web application framework
- **Socket.IO Server** - WebSocket server for real-time features
- **MongoDB** - NoSQL database for data persistence

---

## 🎯 Use Cases

- **Team Brainstorming**: Collaborate on ideas with your remote team
- **Remote Teaching**: Explain concepts visually to students
- **Design Workshops**: Create and iterate on designs together
- **Agile Planning**: Sketch user flows and wireframes
- **Creative Sessions**: Draw and create art with friends
- **Presentations**: Illustrate points during video calls

---

## 📱 Cross-Platform Support

- **Desktop**: Full-featured experience with mouse/trackpad
- **Tablet**: Touch-optimized drawing with stylus support
- **Mobile**: Responsive UI with touch gestures and adaptive layout

---

## 🔮 Future Enhancements

While the current version is feature-rich, here are potential additions for future releases:

- Export canvas as image (PNG/JPG)
- Multiple boards per user
- Drawing history with undo/redo
- Shape tools (rectangle, circle, line)
- Text tool for annotations
- Image upload and placement
- Board templates for quick start
- Drawing layers system
- Zoom and pan controls

---

## 🎨 Features Breakdown

| Category | Features |
|----------|----------|
| **Drawing** | Pencil, Eraser, Color picker, Brush size, Custom colors |
| **Collaboration** | Real-time sync, Cursors, User presence, 3 access modes |
| **Access Control** | Layer lock, Invite system, Collaborator management |
| **Persistence** | MongoDB storage, Auto-save, Board state preservation |
| **UI/UX** | Dark mode, Responsive, Touch support, Animations |
| **Profile** | Customizable avatar, Name/email edit, User settings |

---

## 👨‍💻 Getting Started

1. Visit the live demo link
2. Enter your name, email, and choose an avatar color
3. Start drawing or invite collaborators
4. Share the board link with your team
5. Choose your preferred collaboration mode
6. Enable layer lock when needed to prevent accidental edits


