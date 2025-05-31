"use client";

import { Id, ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useRef, useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";

import { ChatMessageBubble } from '@/components/ChatMessageBubble';
import { ChatWindowMessage } from '@/schema/ChatWindowMessage';
import { MobileWarningOverlay } from './MobileWarningOverlay';

type ModelProvider = "ollama";

const MODEL_DESCRIPTIONS = {
  ollama: "Local Chat Over Documents",
};

const MODEL_DESCRIPTIONS_LONG = {
  ollama: (
    <div className="prose dark:prose-invert">
      <p>
        The LLM is run using{" "}
        <a href="https://ollama.ai/" target="_blank" rel="noopener noreferrer">
          Ollama
        </a>
        . Make sure you have Ollama installed and running locally.
      </p>
      <p>
        You can use any model supported by Ollama. The default is{" "}
        <code>llama2</code>.
      </p>
    </div>
  ),
};

const MODEL_EMOJIS = {
  ollama: <span>🦙</span>,
};

const MODEL_CONFIGS = {
  ollama: {
    model: "llama2",
  },
};

export function ChatWindow(props: {
  placeholder?: string;
  modelProvider: ModelProvider;
}) {
  const { placeholder, modelProvider } = props;
  const [messages, setMessages] = useState<ChatWindowMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPDF, setSelectedPDF] = useState<File | null>(null);
  const [readyToChat, setReadyToChat] = useState(false);
  const initProgressToastId = useRef<Id | null>(null);
  const titleText = MODEL_DESCRIPTIONS[modelProvider];
  const emoji = MODEL_EMOJIS[modelProvider];

  const worker = useRef<Worker | null>(null);

  async function queryStore(messages: ChatWindowMessage[]) {
    if (!worker.current) {
      throw new Error("Worker is not ready.");
    }
    return new ReadableStream({
      start(controller) {
        if (!worker.current) {
          controller.close();
          return;
        }
        const modelConfigs: Record<ModelProvider, Record<string, any>> = {
          ollama: {
            baseUrl: "http://localhost:11435",
            temperature: 0.3,
            model: "mistral",
          },
        };
        const payload: Record<string, any> = {
          messages,
          modelProvider,
          modelConfig: modelConfigs[modelProvider],
        };
        if (
          process.env.NEXT_PUBLIC_LANGCHAIN_TRACING_V2 === "true" &&
          process.env.NEXT_PUBLIC_LANGCHAIN_API_KEY !== undefined
        ) {
          console.warn(
            "[WARNING]: You have set your LangChain API key publicly. This should only be done in local devlopment - remember to remove it before deploying!"
          );
          payload.DEV_LANGCHAIN_TRACING = {
            LANGCHAIN_TRACING_V2: "true",
            LANGCHAIN_API_KEY: process.env.NEXT_PUBLIC_LANGCHAIN_API_KEY,
            LANGCHAIN_PROJECT: process.env.NEXT_PUBLIC_LANGCHAIN_PROJECT,
          };
        }
        worker.current?.postMessage(payload);
        const onMessageReceived = async (e: any) => {
          switch (e.data.type) {
            case "log":
              console.log(e.data);
              break;
            case "init_progress":
              if (initProgressToastId.current === null) {
                initProgressToastId.current = toast(
                  "Loading model weights... This may take a while",
                  {
                    progress: e.data.data.progress || 0.01,
                    theme: "dark"
                  }
                );
              } else {
                if (e.data.data.progress === 1) {
                  await new Promise((resolve) => setTimeout(resolve, 2000));
                }
                toast.update(initProgressToastId.current, { progress: e.data.data.progress || 0.01 });
              }
              break
            case "chunk":
              controller.enqueue(e.data.data);
              break;
            case "error":
              worker.current?.removeEventListener("message", onMessageReceived);
              console.log(e.data.error);
              const error = new Error(e.data.error);
              controller.error(error);
              break;
            case "complete":
              worker.current?.removeEventListener("message", onMessageReceived);
              controller.close();
              break;
          }
        };
        worker.current?.addEventListener("message", onMessageReceived);
      },
    });

  }

  async function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isLoading || !input) {
      return;
    }

    const initialInput = input;
    const initialMessages = [...messages];
    const newMessages = [...initialMessages, { role: "user" as const, content: input }];

    setMessages(newMessages)
    setIsLoading(true);
    setInput("");

    try {
      const stream = await queryStore(newMessages);
      const reader = stream.getReader();

      let chunk = await reader.read();

      const aiResponseMessage: ChatWindowMessage = {
        content: "",
        role: "assistant" as const,
      };

      setMessages([...newMessages, aiResponseMessage]);

      while (!chunk.done) {
        aiResponseMessage.content = aiResponseMessage.content + chunk.value;
        setMessages([...newMessages, aiResponseMessage]);
        chunk = await reader.read();
      }

      setIsLoading(false);
    } catch (e: any) {
      setMessages(initialMessages);
      setIsLoading(false);
      setInput(initialInput);
      toast(`There was an issue with querying your PDF: ${e.message}`, {
        theme: "dark",
      });
    }
  }

  // We use the `useEffect` hook to set up the worker as soon as the `App` component is mounted.
  useEffect(() => {
    if (!worker.current) {
      // Create the worker if it does not yet exist.
      worker.current = new Worker(new URL('../app/worker.ts', import.meta.url), {
        type: 'module',
      });
      setIsLoading(false);
    }
  }, []);

  async function embedPDF (e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedPDF === null) {
      toast(`You must select a file to embed.`, {
        theme: "dark",
      });
      return;
    }
    setIsLoading(true);
    worker.current?.postMessage({ pdf: selectedPDF });
    const onMessageReceived = (e: any) => {
      switch (e.data.type) {
        case "log":
          console.log(e.data);
          break;
        case "error":
          worker.current?.removeEventListener("message", onMessageReceived);
          setIsLoading(false);
          console.log(e.data.error);
          toast(`There was an issue embedding your PDF: ${e.data.error}`, {
            theme: "dark",
          });
          break;
        case "complete":
          worker.current?.removeEventListener("message", onMessageReceived);
          setIsLoading(false);
          setReadyToChat(true);
          toast(`Embedding successful! Now try asking a question about your PDF.`, {
            theme: "dark",
          });
          break;
      }
    };
    worker.current?.addEventListener("message", onMessageReceived);
  }

  const pdfUploadAndEmbedComponent = (
    <div className="p-4 md:p-8 rounded-lg shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 w-full max-h-[90vh] overflow-y-auto flex flex-col text-gray-200">
      <MobileWarningOverlay />
      <div className="mb-8 p-6 bg-slate-800 rounded-lg shadow-md space-y-4">
        <h2 className="text-2xl font-semibold mb-4 text-sky-400">Embed your PDF</h2>
        <ul className="space-y-3 list-inside list-disc text-gray-300">
          <li className="flex items-start">
            <span className="text-sky-400 mr-2 text-xl">⦿</span>
            <span>Select your PDF file below.</span>
          </li>
          <li className="flex items-start">
            <span className="text-sky-400 mr-2 text-xl">⦿</span>
            <span>Click "Embed PDF" to process and prepare it for chat.</span>
          </li>
          <li className="flex items-start">
            <span className="text-sky-400 mr-2 text-xl">⦿</span>
            <span>Once embedded, the chat interface will appear.</span>
          </li>
        </ul>
      </div>
      <form onSubmit={embedPDF} className="mt-6 flex flex-col md:flex-row justify-between items-center w-full p-4 bg-slate-800 rounded-lg shadow-md">
        <div className="mb-4 md:mb-0 md:mr-4 flex-grow">
          <label htmlFor="file_input" className="sr-only">Choose PDF</label>
          <input
            id="file_input"
            type="file"
            accept=".pdf"
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700 cursor-pointer"
            onChange={(e) => e.target.files ? setSelectedPDF(e.target.files[0]) : null}
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !selectedPDF}
          className="shrink-0 px-8 py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md transition-all duration-200 ease-in-out flex items-center justify-center w-full md:w-auto"
        >
          {isLoading && !readyToChat ? ( // Show "Processing..." only during embedding
            <>
              <svg aria-hidden="true" className="w-5 h-5 mr-2 text-white animate-spin fill-sky-800" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
              </svg>
              Processing...
            </>
          ) : (
            "Embed PDF"
          )}
        </button>
      </form>
    </div>
  );

  const chatInterfaceComponent = (
    <>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Chat</h2>
        {messages.length > 0 && (
          <button 
            onClick={() => setMessages([])} 
            className="text-sm text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.24.03 3.22.077m3.22-.077L10.88 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0A48.971 48.971 0 0018.26 5.79m-12.56 0A48.971 48.971 0 015.74 5.79S5.866 17.64 5.866 17.64M18.26 5.79S18.134 17.64 18.134 17.64" />
            </svg>
            Clear Messages
          </button>
        )}
      </div>
      <div className="flex flex-col-reverse w-full mb-4 overflow-auto grow bg-slate-100 dark:bg-slate-800 p-4 rounded-lg" style={{minHeight: '300px'}}>
        {messages.length > 0 ? (
          [...messages]
            .reverse()
            .map((m, i) => (
              <ChatMessageBubble
                key={i}
                message={m}
                aiEmoji={<span>🦙</span>}
                onRemovePressed={() => setMessages(
                  (previousMessages) => {
                    const displayOrderedMessages = previousMessages.reverse();
                    const newReversedMessages = [...displayOrderedMessages.slice(0, i), ...displayOrderedMessages.slice(i + 1)];
                    return newReversedMessages.reverse();
                  }
                )}
              ></ChatMessageBubble>
            ))
        ) : (
          ""
        )}
      </div>
      <form onSubmit={sendMessage} className="flex w-full flex-col mt-2">
        <div className="flex w-full mt-4 items-center bg-slate-800 p-2 rounded-lg shadow-md">
          <input
            className="grow mr-4 p-3 rounded-lg bg-slate-700 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            value={input}
            placeholder={placeholder ?? "Ask about your document..."}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                sendMessage(e as any);
              }
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="shrink-0 px-6 py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md transition-all duration-200 ease-in-out flex items-center justify-center"
          >
            {isLoading ? (
              <svg aria-hidden="true" className="w-5 h-5 text-white animate-spin fill-sky-800" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
              </svg>
            ) : (
              "Send"
            )}
          </button>
        </div>
      </form>
    </>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full">
      {!readyToChat ? pdfUploadAndEmbedComponent : (
        <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col h-[70vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700 rounded-t-2xl bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center gap-2 text-xl font-bold text-indigo-600 dark:text-indigo-400">
              <span>{titleText}</span>
            </div>
            {messages.length > 0 && (
              <button 
                onClick={() => setMessages([])} 
                className="text-sm text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.24.03 3.22.077m3.22-.077L10.88 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0A48.971 48.971 0 0018.26 5.79m-12.56 0A48.971 48.971 0 015.74 5.79S5.866 17.64 5.866 17.64M18.26 5.79S18.134 17.64 18.134 17.64" />
                </svg>
                Clear Messages
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-slate-50 dark:bg-slate-900">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">No messages yet. Start the conversation!</div>
            ) : (
              messages.map((msg, idx) => (
                <ChatMessageBubble key={idx} message={msg} aiEmoji={<span>🦙</span>} />
              ))
            )}
          </div>
          <form
            className="flex items-center gap-2 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-2xl"
            onSubmit={sendMessage}
          >
            <input
              type="text"
              className="flex-1 rounded-lg border border-gray-300 dark:border-slate-600 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={placeholder || "Type your message..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading && readyToChat}
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
              disabled={(isLoading && readyToChat) || !input.trim()}
            >
              {(isLoading && readyToChat) ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}