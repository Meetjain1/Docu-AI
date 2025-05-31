"use client";

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ChatWindowMessage } from '@/schema/ChatWindowMessage';

import { useState, type FormEvent } from "react";
import { Feedback } from 'langsmith';

export function ChatMessageBubble(props: {
  message: ChatWindowMessage;
  aiEmoji?: React.JSX.Element;
  onRemovePressed?: () => void;
}) {
  const { role, content, runId } = props.message;

  const bubbleStyles = {
    user: "bg-sky-600 text-white self-end rounded-lg rounded-br-none",
    assistant: "bg-slate-700 text-gray-200 self-start rounded-lg rounded-bl-none",
  };
  const alignmentClassName = role === "user" ? "items-end" : "items-start";
  const prefix = role === "user" ? <span className="text-xl">🧑</span> : props.aiEmoji;

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [comment, setComment] = useState("");
  const [showCommentForm, setShowCommentForm] = useState(false);

  async function handleScoreButtonPress(e: React.MouseEvent<HTMLButtonElement, MouseEvent>, score: number) {
    e.preventDefault();
    setComment("");
    await sendFeedback(score);
  }

  async function handleCommentSubmission(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const score = typeof feedback?.score === "number" ? feedback.score : 0;
    await sendFeedback(score);
  }

  async function sendFeedback(score: number) {
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    const response = await fetch("api/feedback", {
      method: feedback?.id ? "PUT" : "POST",
      body: JSON.stringify({
        id: feedback?.id,
        run_id: runId,
        score,
        comment,
      })
    });

    const json = await response.json();

    if (json.error) {
      toast(json.error, {
        theme: "dark"
      });
      return;
    } else if (feedback?.id && comment) {
      toast("Response recorded! Go to https://smith.langchain.com and check it out in under your run's \"Feedback\" pane.", {
        theme: "dark",
        autoClose: 3000,
      });
      setComment("");
      setShowCommentForm(false);
    } else {
      setShowCommentForm(true);
    }

    if (json.feedback) {
      setFeedback(json.feedback);
    }

    setIsLoading(false);
  }
  return (
    <div
      className={`flex flex-col ${alignmentClassName} mb-4 group max-w-[90%] md:max-w-[80%]`}
    >
      <div
        className={`px-4 py-3 ${bubbleStyles[role]} shadow-md flex flex-col`}
      >
        <div className="flex items-start space-x-2">
          <div className="mt-0.5">
            {prefix}
          </div>
          <div className="whitespace-pre-wrap break-words">
            {/* TODO: Remove. Hacky fix, stop sequences don't seem to work with WebLLM yet. */}
            {content.trim().split("\nInstruct:")[0].split("\nInstruction:")[0]}
          </div>
        </div>
        {props.onRemovePressed && (
           <button
            onClick={props.onRemovePressed}
            className="self-end text-xs text-gray-400 hover:text-red-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label="Remove message"
          >
            Remove
          </button>
        )}
      </div>
      {runId && (
        <div className={`ml-auto mt-2 flex space-x-2 items-center ${role === "user" ? "self-end" : "self-start" }`}>
          <button 
            className={`p-1.5 border-2 rounded-md transition-colors duration-200 
              ${feedback && feedback.score === 1 
                ? "bg-green-500 border-green-600 text-white"
                : "border-gray-600 hover:bg-green-500 hover:border-green-600 hover:text-white text-gray-400"
              }`}
            onClick={(e) => handleScoreButtonPress(e, 1)}
            aria-label="Good response"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.424 2.008-1.09l-.462-1.618a.563.563 0 01.323-.672.563.563 0 01.672.323l.462 1.618A2.988 2.988 0 0011.88 9.75c1.199 0 2.24-.734 2.731-1.816l.462-1.618a.563.563 0 01.323-.672.563.563 0 01.672.323l.462 1.618a2.988 2.988 0 002.731 1.267c.412 0 .814-.095 1.184-.268l.462-1.618a.563.563 0 01.323-.672.563.563 0 01.672.323l.462 1.618a2.988 2.988 0 001.78 1.267 3.732 3.732 0 003.732-3.732V6.562c0-2.182-1.78-3.962-3.963-3.962H7.163c-1.35 0-2.559.684-3.244 1.779-.684 1.095-.83 2.44-.424 3.627l1.111 3.274c.097.285.097.586 0 .871l-1.111 3.274c-.406 1.188-.26 2.532.424 3.627.685 1.095 1.894 1.779 3.244 1.779h12.396c.596 0 1.12-.328 1.398-.834.279-.506.235-1.112-.108-1.56L19.03 14.25c-.342-.448-.974-.665-1.56-.665h-1.746c-.586 0-1.118.217-1.46.665l-1.11 1.56c-.343.448-.974.665-1.56.665H9.593c-.586 0-1.118.217-1.46.665L7.023 18.16c-.342.448-.298 1.053.108 1.56.278.505.802.833 1.398.833h.293z" /></svg>
          </button>
          <button 
            className={`p-1.5 border-2 rounded-md transition-colors duration-200 
              ${feedback && feedback.score === 0 
                ? "bg-red-500 border-red-600 text-white" 
                : "border-gray-600 hover:bg-red-500 hover:border-red-600 hover:text-white text-gray-400"
              }`}
            onClick={(e) => handleScoreButtonPress(e, 0)}
            aria-label="Bad response"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.367 13.5c-.806 0-1.533.424-2.008 1.09l.462 1.618a.563.563 0 01-.323.672.563.563 0 01-.672-.323l-.462-1.618A2.988 2.988 0 0012.12 14.25c-1.199 0-2.24.734-2.731 1.816l-.462 1.618a.563.563 0 01-.323.672.563.563 0 01-.672-.323l-.462-1.618a2.988 2.988 0 00-2.731-1.267c-.412 0-.814.095-1.184.268l-.462 1.618a.563.563 0 01-.323.672.563.563 0 01-.672-.323l-.462-1.618a2.988 2.988 0 00-1.78-1.267 3.732 3.732 0 00-3.732 3.732V17.438c0 2.182 1.78 3.962 3.963 3.962h12.396c1.35 0 2.559-.684 3.244-1.779.684-1.095.83-2.44.424-3.627l-1.111-3.274c-.097-.285-.097-.586 0-.871l1.111-3.274c.406-1.188.26-2.532-.424-3.627-.685-1.095-1.894-1.779-3.244-1.779H6.602c-.596 0-1.12.328-1.398.834-.279.506-.235 1.112.108 1.56L7.97 9.75c.342.448.974.665 1.56.665h1.746c.586 0 1.118-.217 1.46-.665l1.11-1.56c.343-.448.974-.665 1.56-.665h3.017c.586 0 1.118-.217 1.46.665l1.11 1.56c.342.448.298 1.053-.108 1.56-.278.505-.802.833-1.398.833h-.293z" /></svg>
          </button>
        </div>
      )}
      {feedback && showCommentForm && (
        <div className={`mt-2 w-full ${role === "user" ? "self-end" : "self-start" }`}>
          <form onSubmit={handleCommentSubmission} className="relative flex items-center">
            <input
              className="flex-grow p-2 rounded-md border border-gray-600 bg-slate-700 text-gray-200 placeholder-gray-400 focus:ring-1 focus:ring-sky-500 focus:border-transparent outline-none text-sm"
              value={comment}
              placeholder={feedback?.score === 1 ? "Add a comment..." : "What was wrong?"}
              onChange={(e) => setComment(e.target.value)}
            />
            <button 
              type="submit"
              disabled={isLoading}
              className="ml-2 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-md disabled:bg-gray-500 transition-colors duration-200"
            >
              {isLoading ? (
                <svg aria-hidden="true" className="w-4 h-4 animate-spin fill-sky-800" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/></svg>
              ) : "Submit"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}