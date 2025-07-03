import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import md5 from "md5";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "./gemini-embeddings";
import { convertToAscii } from "./utils";
// Define PDFPage interface
type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
}

let pineconeInstance: Pinecone | null = null;

export const getPineconeClient = async () => {
  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_ENVIRONMENT || !process.env.PINECONE_INDEX_NAME) {
    throw new Error("Pinecone environment variables are not set");
  }

  if (!pineconeInstance) {
    try {
      console.log("Initializing Pinecone client...");
      pineconeInstance = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY
      });

      // Verify connection by listing indexes
      await pineconeInstance.listIndexes();
      console.log("Pinecone client initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Pinecone client:", error);
      pineconeInstance = null;
      throw error;
    }
  }
  
  return pineconeInstance;
};

export const createPineconeIndex = async () => {
  const pinecone = await getPineconeClient();
  const indexName = process.env.PINECONE_INDEX_NAME!;

  try {
    // Check if index already exists
    const existingIndexes = await pinecone.listIndexes();
    const indexExists = existingIndexes.indexes?.some(index => index.name === indexName) || false;
    
    if (!indexExists) {
      console.log(`Creating new index: ${indexName}`);
      
      await pinecone.createIndex({
        name: indexName,
        dimension: 768, // Gemini's embedding dimension
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });

      console.log(`Successfully created index: ${indexName}`);
      
      // Wait for index to be ready
      console.log('Waiting for index to be ready...');
      await new Promise((resolve) => setTimeout(resolve, 30000)); // 30 seconds wait time
    } else {
      console.log(`Index ${indexName} already exists`);
    }

    return pinecone;
  } catch (error) {
    console.error('Error managing Pinecone index:', error);
    throw error;
  }
};

export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

async function prepareDocument(page: PDFPage) {
  const { metadata } = page;
  let { pageContent } = page;
  pageContent = pageContent.replace(/\n/g, " ").trim();
  
  // split the docs into smaller chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2000,    // Smaller chunk size
    chunkOverlap: 200,  // Some overlap to maintain context
    separators: ["\n\n", "\n", " ", ""] // Custom separators for better splitting
  });
  
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(pageContent, 36000),
      },
    }),
  ]);
  return docs;
}

async function embedDocument(doc: Document) {
  try {
    const embeddings = await getEmbeddings(doc.metadata.text as string);
    const hash = md5(doc.metadata.text as string);

    // Convert embeddings to number array and ensure it's the correct format for Pinecone
    const embeddingArray = Object.values(embeddings).map(Number);

    return {
      id: hash,
      values: embeddingArray,
      metadata: {
        text: doc.metadata.text as string,
        pageNumber: doc.metadata.pageNumber as number,
      },
    } as PineconeRecord;
  } catch (error) {
    console.error("Error embedding document:", error);
    throw error;
  }
}

export async function loadS3IntoPinecone(fileKey: string) {
  try {
    // 1. obtain the pdf -> download and read from pdf
    console.log("Starting PDF processing for file:", fileKey);
    
    console.log("Downloading file from S3...");
    const file_name = await downloadFromS3(fileKey);
    if (!file_name) {
      throw new Error("Could not download file from S3");
    }
    
    console.log("Loading PDF into memory:", file_name);
    const loader = new PDFLoader(file_name);
    const pages = await loader.load() as PDFPage[];
    
    // 2. split and segment the pdf
    console.log("Processing PDF pages...");
    const documents = await Promise.all(pages.map(prepareDocument));
    
    // 3. vectorise and embed individual documents
    console.log("Creating embeddings...");
    const vectors = await Promise.all(documents.flat().map(embedDocument));
    
    // 4. upload to pinecone
    console.log("Uploading vectors to Pinecone...");
    const client = await getPineconeClient();
    const indexName = process.env.PINECONE_INDEX_NAME!;
    const pineconeIndex = client.index(indexName);
    
    // Convert file key to a valid namespace format
    const namespace = convertToAscii(fileKey);
    console.log("Using namespace:", namespace);
    
    // Add namespace to each vector record
    const vectorsWithNamespace = vectors.map(vector => ({
      ...vector,
      namespace
    }));
    
    // Batch upsert vectors in chunks of 100 to avoid rate limits
    const BATCH_SIZE = 100;
    for (let i = 0; i < vectorsWithNamespace.length; i += BATCH_SIZE) {
      const batch = vectorsWithNamespace.slice(i, i + BATCH_SIZE);
      await pineconeIndex.upsert(batch);
      console.log(`Uploaded batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(vectorsWithNamespace.length/BATCH_SIZE)}`);
    }
    
    console.log("Successfully uploaded all vectors to Pinecone");
    
    return documents[0];
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in loadS3IntoPinecone:", errorMessage);
    throw error;
  }
}
