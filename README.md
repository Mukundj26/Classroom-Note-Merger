# ClassSync Lite

ClassSync Lite is a Next.js application that intelligently merges notes from multiple sources into a single, comprehensive document. It leverages AI to handle both typed and handwritten notes, making it the perfect tool for students and collaborators.

## Getting Started

To get the application up and running on your local machine, follow these steps.

### 1. Install Dependencies

First, install the necessary npm packages:

```bash
npm install
```

### 2. Set Up Environment Variables

This project uses Google's Generative AI for its core features. You'll need an API key to use the service.

1.  Create a new file named `.env` in the root of the project.
2.  Add your Google AI API key to the file:

    ```
    GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```

    You can obtain a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 3. Run the Development Server

Now, you can start the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) in your browser to see the running application.

## Features

- **Typed Note Merging**: Combine multiple text-based notes seamlessly.
- **Handwriting Recognition**: Upload images of handwritten notes and automatically convert them to digital text.
- **AI-Powered Merging**: An intelligent backend removes duplicate information and organizes the content into a clean, logical format.
- **Download & Copy**: Easily download your merged notes as a text file or copy them to your clipboard.

## Tech Stack

- [Next.js](https://nextjs.org/) - React Framework
- [React](https://react.dev/) - JavaScript Library
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [ShadCN/UI](https://ui.shadcn.com/) - Component Library
- [Genkit (Google AI)](https://firebase.google.com/docs/genkit) - AI Toolkit
