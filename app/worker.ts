import { ChatWindowMessage } from "@/schema/ChatWindowMessage";

import { Voy as VoyClient } from "voy-search";

import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { VoyVectorStore } from "@langchain/community/vectorstores/voy";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { type BaseMessage, type MessageContent, AIMessage, HumanMessage } from "@langchain/core/messages";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { LanguageModelLike } from "@langchain/core/language_models/base";

import { LangChainTracer } from "@langchain/core/tracers/tracer_langchain";
import { Client } from "langsmith";

import { Document } from "@langchain/core/documents";
import { RunnableConfig } from "@langchain/core/runnables";
import { BaseLLM } from "@langchain/core/language_models/llms";

const embeddings = new HuggingFaceTransformersEmbeddings({
  modelName: "Xenova/all-MiniLM-L6-v2",
});

const voyClient = new VoyClient();
const vectorstore = new VoyVectorStore(voyClient, embeddings);

const embedPDF = async (pdfBlob: Blob) => {
  const text = await pdfBlob.text();
  const doc = new Document({ pageContent: text });

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const splitDocs = await splitter.splitDocuments([doc]);

  self.postMessage({
    type: "log",
    data: splitDocs,
  });

  await vectorstore.addDocuments(splitDocs);
};

const generateRAGResponse = async (
  messages: ChatWindowMessage[],
  {
    model,
    modelProvider,
    devModeTracer,
  }: {
    model: LanguageModelLike;
    modelProvider: "ollama" | "webllm" | "chrome_ai";
    devModeTracer?: LangChainTracer;
  },
) => {
  try {
    // Step 1: Rephrase the question
    const originalQuery = messages.at(-1)?.content as string;
    const rephrasePrompt = ChatPromptTemplate.fromMessages([
      ["placeholder", "{messages}"],
      [
        "user",
        "Given the above conversation, generate a natural language search query to look up in order to get information relevant to the conversation. Do not respond with anything except the query.",
      ],
    ]);
    const formattedPrompt = await rephrasePrompt.invoke(
      {
        messages: messages.map(msg => 
          msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
        ),
        input: originalQuery,
      },
      devModeTracer ? { callbacks: [devModeTracer] } : undefined,
    );

    const rephrasedResponse = await model.invoke(formattedPrompt);
    const rephrasedQuestion = typeof rephrasedResponse === "string" ? rephrasedResponse : rephrasedResponse.content.toString();

    // Step 2: Retrieve source documents
    const retriever = vectorstore.asRetriever();
    const docs = await retriever.invoke(rephrasedQuestion);

    // Step 3: Generate response
    const context = docs
      .map((sourceDoc: Document) => {
        return `<doc>\n${sourceDoc.pageContent}\n</doc>`;
      })
      .join("\n\n");

    const responseChainPrompt = ChatPromptTemplate.fromMessages<{
      context: string;
      messages: BaseMessage[];
    }>([
      ["system", `You are an experienced researcher, expert at interpreting and answering questions based on provided sources. Using the provided context, answer the user's question to the best of your ability using the resources provided.
Generate a concise answer for a given question based solely on the provided search results. You must only use information from the provided search results. Use an unbiased and journalistic tone. Combine search results together into a coherent answer. Do not repeat text.
If there is nothing in the context relevant to the question at hand, just say "Hmm, I'm not sure." Don't try to make up an answer.
Anything between the following \`context\` html blocks is retrieved from a knowledge bank, not part of the conversation with the user.
<context>
{context}
<context/>

REMEMBER: If there is no relevant information within the context, just say "Hmm, I'm not sure." Don't try to make up an answer. Anything between the preceding 'context' html blocks is retrieved from a knowledge bank, not part of the conversation with the user.`],
      ["placeholder", "{messages}"],
    ]);

    const formattedResponsePrompt = await responseChainPrompt.invoke(
      {
        context,
        messages: messages.map(msg => 
          msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
        ),
      },
      devModeTracer ? { callbacks: [devModeTracer] } : undefined,
    );

    const response = await model
      .withConfig({ tags: ["response_generator"] })
      .invoke(formattedResponsePrompt);

    self.postMessage({
      type: "chunk",
      data: typeof response === "string" ? response : response.content.toString(),
    });

    self.postMessage({
      type: "complete",
      data: "OK",
    });
  } catch (e) {
    console.error("Error generating response:", e);
    self.postMessage({
      type: "error",
      error: e instanceof Error ? e.message : "Unknown error",
    });
  }
};

// Listen for messages from the main thread
self.addEventListener("message", async (event: MessageEvent) => {
  self.postMessage({
    type: "log",
    data: `Received data!`,
  });

  let devModeTracer;
  if (
    event.data.DEV_LANGCHAIN_TRACING !== undefined &&
    typeof event.data.DEV_LANGCHAIN_TRACING === "object"
  ) {
    devModeTracer = new LangChainTracer({
      projectName: event.data.DEV_LANGCHAIN_TRACING.LANGCHAIN_PROJECT,
      client: new Client({
        apiKey: event.data.DEV_LANGCHAIN_TRACING.LANGCHAIN_API_KEY,
      }) as any,
    });
  }

  if (event.data.pdf) {
    try {
      await embedPDF(event.data.pdf);
    } catch (e: any) {
      self.postMessage({
        type: "error",
        error: e.message,
      });
      throw e;
    }
  } else {
    try {
      await generateRAGResponse(event.data.messages, {
        model: event.data.model,
        modelProvider: event.data.modelProvider,
        devModeTracer,
      });
    } catch (e: any) {
      self.postMessage({
        type: "error",
        error:
          event.data.modelProvider === "ollama"
            ? `${e.message}. Make sure you are running Ollama.`
            : `${e.message}. Make sure your browser supports WebLLM/WebGPU.`,
      });
      throw e;
    }
  }
});
