# DocuAI - Fully Local Chat Over Documents

DocuAI allows you to chat with your PDF documents locally using a modern, intuitive interface. It leverages local Large Language Models (LLMs) to ensure your data remains private and secure, processed entirely within your browser or local machine.

## Key Features

### AI and Language Model Capabilities

*   **Multi-Model Support:**
    *   **Ollama Integration:** 
        - Runs Mistral-7B locally with high performance
        - Supports context-aware document analysis
        - Optimized for both technical and general content
        - Real-time response generation
    *   **WebLLM In-Browser Processing:**
        - Phi-3.5 model running entirely in your browser
        - Zero data leaves your device
        - Efficient WebAssembly-based execution
        - Progressive model loading with caching
    *   **Chrome AI Integration:**
        - Experimental Gemini Nano model support
        - Native browser optimization
        - Low-latency responses

*   **Advanced Document Processing:**
    *   **Smart Text Extraction:** Accurately extracts and preserves document structure from PDFs
    *   **Contextual Understanding:** Maintains document context across multiple chat turns
    *   **Semantic Search:** Uses embeddings to find relevant document sections
    *   **Dynamic Response Generation:** Combines document context with model knowledge

*   **Privacy-First Architecture:**
    *   **100% Local Processing:** All document processing and AI operations run locally
    *   **No Cloud Dependencies:** Functions fully offline after initial setup
    *   **Secure Document Handling:** PDFs never leave your device
    *   **Private Chat History:** All conversations stored locally

*   **Technical Features:**
    *   **Vector Embeddings:** Creates and stores document embeddings for efficient retrieval
    *   **Chunking Optimization:** Smart document splitting for optimal context windows
    *   **Background Processing:** Web Workers handle intensive tasks without blocking the UI
    *   **Real-time Updates:** Stream responses as they're generated

*   **Local First AI:** Chat with your PDFs without sending data to external servers. Choose from multiple local model providers:
    *   **Ollama:** Utilizes models like Mistral-7B running locally via the Ollama desktop application.
    *   **WebLLM:** Runs models like Phi-3.5 directly in your browser using WebAssembly.
    *   **Chrome AI (Experimental):** Leverages Chrome's built-in Gemini Nano model (requires program access).
*   **Secure Document Handling:** PDFs are processed and embedded locally.
*   **Modern User Interface:** Clean, responsive, and dark-mode themed interface for a seamless user experience.
*   **Clerk Authentication:** Secure user login and signup powered by Clerk, with a themed interface matching the application.
*   **Interactive Chat:** Real-time chat interface to ask questions and get insights from your documents.
*   **PDF Embedding:** Efficiently processes and prepares your PDF for querying.
*   **Clear Chat History:** Option to clear the current chat conversation.

## Tech Stack

*   **Frontend:**
    *   Next.js - React framework for server-side rendering and static site generation.
    *   Reactjs - JavaScript library for building user interfaces.
    *   Tailwind CSS - Utility-first CSS framework for rapid UI development.
    *   TypeScript - Typed superset of JavaScript.
*   **Authentication:**
    *   clerk/nextjs - User management and authentication.
    *   clerk/themes - Theming for Clerk components.
*   **AI & Machine Learning:**
    *   **Web Workers:** Offload intensive PDF processing and LLM interactions to background threads, keeping the UI responsive.
    *   **LangChain (conceptual, via worker):** Utilized within the worker for document processing, embedding, and LLM interaction logic. (Specific LangChain.js modules are used by the worker).
    *   **Model Providers:**
        *   Ollama integration for local model serving.
        *   WebLLM (MLC AI) for in-browser model execution.
        *   Chrome AI (experimental Gemini Nano).
*   **State Management:**
    *   React Hooks (`useState`, `useEffect`, `useRef`) for component-level state.
*   **Styling:**
    *   CSS Modules & Global Styles.
    *   Dark theme implemented with Tailwind CSS.
*   **Deployment:**
    *   (Assumed Vercel or similar Next.js hosting platform)

## User Experience (UX)

*   **Intuitive Workflow:**
    1.  Sign in/Sign up securely.
    2.  Select your preferred local LLM provider.
    3.  Upload your PDF document.
    4.  Embed the document with a single click.
    5.  Start chatting with your document through an interactive interface.
*   **Responsive Design:** Adapts to various screen sizes (though primarily desktop-focused for LLM tasks).
*   **Visual Feedback:** Loading indicators and toast notifications for ongoing processes (model loading, PDF embedding, etc.).
*   **Themed Consistency:** Clerk authentication pages are styled to match the application's dark theme.
*   **Helpful Instructions:** Clear guidance for setting up different LLM providers.

## Development Highlights

*   **Component-Based Architecture:** Modular UI built with React components.
*   **Fixed Layout:** Navbar fixed at the top, Footer at the bottom, with scrollable main content.
*   **Custom Clerk Theming:** Tailored Clerk's appearance to integrate seamlessly with the app's dark aesthetic.
*   **Dynamic Content:** Chat messages, model instructions, and UI states update dynamically based on user interaction and application state.
*   **Refactored Chat Flow:** Streamlined the process from model selection to PDF upload/embedding and finally to the chat interface

### Usage Flow

1.  Navigate to the application.
2.  You'll be prompted to **Sign In** or **Sign Up** using Clerk.
3.  Once logged in, you'll land on the `/app` page.
4.  **Select an LLM Provider:** Choose between Ollama, WebLLM, or Chrome AI. Instructions for each will appear on hover/click.
5.  **Upload PDF:** After selecting a model, the PDF upload interface will appear.
    *   Click "Choose PDF" to select your document.
    *   Click "Embed PDF". This will process the document and prepare it for querying. You'll see progress indicators.
6.  **Chat:** Once embedding is complete, the chat interface will load.
    *   Type your questions about the document into the input field and press Enter or click "Send".
    *   View the AI's responses.
    *   You can clear the chat history using the "Clear Messages" button.

## Screenshots

*   Main landing page (`/`)
*   Application page (`/app`) before model selection
*   Application page (`/app`) with model selected (PDF upload view)
*   Chat interface in action