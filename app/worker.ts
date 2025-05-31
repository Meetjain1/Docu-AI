import { ChatWindowMessage } from "@/schema/ChatWindowMessage";
import { Voy as VoyClient } from "voy-search";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { VoyVectorStore } from "@langchain/community/vectorstores/voy";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { BaseMessage } from "@langchain/core/messages";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { LangChainTracer } from "langchain/callbacks";
// @ts-ignore - LangSmith types are not up to date
import { Client } from "langsmith";
import { ChatOllama } from "@langchain/ollama";
import { Document } from "@langchain/core/documents";
import { LanguageModelLike } from "@langchain/core/language_models/base";

const embeddings = new HuggingFaceTransformersEmbeddings({
  modelName: "Xenova/all-MiniLM-L6-v2",
});

const voyClient = new VoyClient();
const vectorstore = new VoyVectorStore(voyClient, embeddings);

const SYSTEM_TEMPLATE = `You are an experienced researcher, expert at interpreting and answering questions based on provided sources. Using the provided context, answer the user's question to the best of your ability using the resources provided.
Generate a concise answer for a given question based solely on the provided search results. You must only use information from the provided search results. Use an unbiased and journalistic tone. Combine search results together into a coherent answer. Do not repeat text.
If there is nothing in the context relevant to the question at hand, just say "Hmm, I'm not sure." Don't try to make up an answer.
Anything between the following \`context\` html blocks is retrieved from a knowledge bank, not part of the conversation with the user.
<context>
{context}
<context/>

REMEMBER: If there is no relevant information within the context, just say "Hmm, I'm not sure." Don't try to make up an answer. Anything between the preceding 'context' html blocks is retrieved from a knowledge bank, not part of the conversation with the user.`;

const embedPDF = async (pdfBlob: Blob) => {
  const pdfLoader = new PDFLoader(pdfBlob, { parsedItemSeparator: " " });
  const docs = await pdfLoader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });

  const splitDocs = await splitter.splitDocuments(docs);

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
    devModeTracer,
  }: {
    model: LanguageModelLike;
    devModeTracer?: LangChainTracer;
  },
) => {
  const lastMessage = messages[messages.length - 1];
  const query = lastMessage.content;

  // Get relevant documents
  const retriever = vectorstore.asRetriever();
  const docs = await retriever.invoke(query);

  // Format documents into context
  const context = docs
    .map((doc: Document) => {
      return `<doc>\n${doc.pageContent}\n</doc>`;
    })
    .join("\n\n");

  // Create prompt
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_TEMPLATE],
    ["placeholder", "{messages}"],
  ]);

  // Generate response
  const formattedPrompt = await prompt.invoke({
    context,
    messages,
  });

  const callbacks = devModeTracer ? [devModeTracer] : undefined;
  // @ts-ignore - LangChain types are not up to date
  const response = await model.invoke(formattedPrompt, { callbacks });

  self.postMessage({
    type: "chunk",
    // @ts-ignore - LangChain types are not up to date
    data: response.content,
  });

  self.postMessage({
    type: "complete",
    data: "OK",
  });
};

// Listen for messages from the main thread
self.addEventListener("message", async (event: { data: any }) => {
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
      // @ts-ignore - LangSmith types are not up to date
      client: new Client({
        apiKey: event.data.DEV_LANGCHAIN_TRACING.LANGCHAIN_API_KEY,
      }),
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
    const modelConfig = event.data.modelConfig;
    // @ts-ignore - LangChain types are not up to date
    const model = new ChatOllama(modelConfig);
    
    try {
      await generateRAGResponse(event.data.messages, {
        devModeTracer,
        model,
      });
    } catch (e: any) {
      self.postMessage({
        type: "error",
        error: `${e.message}. Make sure you are running Ollama.`,
      });
      throw e;
    }
  }

  self.postMessage({
    type: "complete",
    data: "OK",
  });
});
