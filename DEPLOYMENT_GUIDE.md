# 🚀 EmojiLang Deployment & Local Setup Guide

Follow these steps to get EmojiLang running on your local machine after downloading it from GitHub.

---

## 📋 Prerequisites

EmojiLang is a client-side application that uses **ES Modules**. For security reasons, modern browsers (Chrome, Firefox, Edge) block ES Modules when files are opened directly via `file://` protocols.

**You must serve the files via a local web server.**

---

## 🏃 Step-By-Step Setup

### 1. Download the Code
If you haven't already, clone the repository or download the ZIP from GitHub and extract it.
```bash
git clone https://github.com/your-username/emoji-programming.git
cd emoji-programming
```

### 2. Launch a Local Server
Choose **one** of the following methods based on what you have installed:

#### Option A: Using Node.js (Recommended)
If you have Node.js installed, use the `serve` package:
```bash
# Run without installing
npx serve .
```
*The app will be available at `http://localhost:3000`.*

#### Option B: Using VS Code (Easiest)
1. Open the project folder in **Visual Studio Code**.
2. Install the **"Live Server"** extension (by Ritwick Dey).
3. Click the **"Go Live"** button in the bottom-right corner of VS Code.
*The app will automatically open in your default browser.*

#### Option C: Using Python
If you have Python installed:
```bash
# For Python 3.x
python -m http.server 8000
```
*The app will be available at `http://localhost:8000`.*

---

## 🧪 Verifying the Installation

1. Once the server is running, open your browser to the provided URL (e.g., `http://localhost:3000`).
2. You should see the **EmojiLang IDE** with the code editor and emoji keyboard.
3. Click the **"Load Example..."** dropdown and select `👋 Hello World`.
4. Click the **▶️ Run** button.
5. Check the **Output Console** at the bottom—it should display `Hello World!`.

---

## 🛠️ Troubleshooting

- **CORS Errors**: If you see errors about "Cross-Origin Request Blocked," it means you are opening `index.html` directly from your file system. Ensure you are using one of the server methods above.
- **Emoji Rendering**: If emojis appear as boxes, ensure your Operating System and Browser are up to date. EmojiLang requires a system font that supports Unicode 13.0+.
- **Console Logs**: Open your browser's Developer Tools (`F12`) to see detailed compiler logs and performance metrics.
