"use client";

import { useState } from 'react';
import { SignedIn, SignedOut, RedirectToSignUp } from '@clerk/nextjs';
import { Navbar } from '@/components/Navbar';
import { ChatWindow } from '@/components/ChatWindow';
import { CubeIcon, GlobeAltIcon, PuzzlePieceIcon, ExclamationTriangleIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';

type ModelProvider = "ollama" | "webllm" | "chrome_ai";

const modelInstructions = {
  ollama: (
    <div className="prose prose-sm prose-invert mt-4 p-4 bg-slate-800 rounded-md">
      <p>The LLM is <code>Mistral-7B</code> run locally by Ollama. You&apos;ll need to install <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer">the Ollama desktop app</a> and run the following commands to give this site access to the locally running model:</p>
      <pre><code>$ OLLAMA_ORIGINS=https://webml-demo.vercel.app OLLAMA_HOST=127.0.0.1:11435 ollama serve</code></pre>
      <p>Then, in another window:</p>
      <pre><code>$ OLLAMA_HOST=127.0.0.1:11435 ollama pull mistral</code></pre>
    </div>
  ),
  webllm: (
    <div className="prose prose-sm prose-invert mt-4 p-4 bg-slate-800 rounded-md">
      <p>The LLM is <code>Phi-3.5</code> run using <a href="https://webllm.mlc.ai/" target="_blank" rel="noopener noreferrer">WebLLM</a>. The first time you start a chat, the app will automatically download the weights and cache them in your browser.</p>
      <div className="flex items-center mt-2 text-sm text-slate-400">
        <CloudArrowDownIcon className="h-5 w-5 mr-2 text-sky-400" />
        <span>These weights are several GB in size, so it may take some time. Make sure you have a good internet connection!</span>
      </div>
    </div>
  ),
  chrome_ai: (
    <div className="prose prose-sm prose-invert mt-4 p-4 bg-slate-800 rounded-md">
      <p>It uses the experimental preview of <code>Chrome&apos;s built-in Gemini Nano</code> model. You will need access to the program to use this mode.</p>
      <div className="flex items-center mt-2 text-sm text-yellow-400">
        <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
        <span>Note that the built-in Gemini Nano model is experimental and is not chat tuned, so results may vary!</span>
      </div>
    </div>
  ),
};

export default function App() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedModel, setSelectedModel] = useState<ModelProvider | null>(null);
  const [showInstructions, setShowInstructions] = useState<ModelProvider | null>(null);

  const models: { id: ModelProvider; name: string; description: string; icon: React.ElementType; }[] = [
    {
      id: "ollama",
      name: "Ollama (Mistral)",
      description: "Run locally for privacy.",
      icon: CubeIcon
    },
    {
      id: "webllm",
      name: "WebLLM (Phi-3.5)",
      description: "In-browser, good balance.",
      icon: GlobeAltIcon
    },
    {
      id: "chrome_ai",
      name: "Chrome AI (Gemini Nano)",
      description: "Experimental, Chrome-native.",
      icon: PuzzlePieceIcon
    }
  ];

  return (
    <>
      <SignedOut>
        <RedirectToSignUp />
      </SignedOut>
      <SignedIn>
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center">
            {step === 1 && (
              <div className="w-full max-w-3xl text-center">
                <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Select Your Language Model</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-10">Choose an AI model to power your document chat experience.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {models.map((model) => {
                    const IconComponent = model.icon;
                    return (
                      <div key={model.id} 
                           className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 
                                       ${selectedModel === model.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-2xl' : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-lg'}`}
                           onClick={() => {
                              setSelectedModel(model.id);
                              setShowInstructions(model.id);
                           }}
                           onMouseEnter={() => setShowInstructions(model.id)}
                           onMouseLeave={() => {
                              if (selectedModel !== model.id) {
                                setShowInstructions(null);
                              }
                           }}
                      >
                        <IconComponent className="h-12 w-12 mx-auto mb-4 text-indigo-500" />
                        <h3 className="text-xl font-semibold mb-2">{model.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{model.description}</p>
                        {selectedModel === model.id && (
                          <button 
                            onClick={() => setStep(2)}
                            className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                          >
                            Confirm & Continue
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 min-h-[150px] text-left">
                  {(showInstructions || selectedModel) && modelInstructions[showInstructions || selectedModel!]}
                </div>

              </div>
            )}
            {step === 2 && selectedModel && (
              <ChatWindow modelProvider={selectedModel} />
            )}
          </main>
        </div>
      </SignedIn>
    </>
  );
} 