# ChatPDF Interview Preparation

This guide explains the ChatPDF project in simple interview language. It is based on the implementation in this repository, not only the older project description in `README.md`.

## 1. Thirty-Second Introduction

> ChatPDF is a full-stack Next.js application that lets an authenticated user upload a PDF and ask questions about it. The PDF is stored in Amazon S3. On the server, the PDF is extracted, split into overlapping text chunks, converted into Gemini embeddings, and stored in Pinecone. When the user asks a question, the application embeds the question, retrieves the most relevant chunks from Pinecone, sends that context to Gemini, and stores both sides of the conversation in PostgreSQL through Drizzle ORM. Clerk handles authentication and Razorpay handles the payment flow.

The short technical name for this design is a **Retrieval-Augmented Generation (RAG)** application.

## 2. The Problem It Solves

A language model should not be expected to know the contents of a private PDF. ChatPDF gives the model relevant pieces of the user's document at question time:

1. Store the document.
2. Convert document text into searchable vectors.
3. Find the chunks closest to the user's question.
4. Give only those chunks to the model.
5. Generate an answer grounded in the retrieved context.

This is more scalable than putting the entire PDF into every prompt and helps reduce answers that are unrelated to the uploaded document.

## 3. Stack

| Area | Technology | Role |
| --- | --- | --- |
| Web framework | Next.js 15 App Router | Pages, server components, and API route handlers |
| Language | TypeScript | Type-safe application code |
| UI | React 19, Tailwind CSS, Radix utilities, Lucide | Chat, upload, sidebar, PDF viewer, theme support |
| Authentication | Clerk | Sign-in, sign-up, user identity, route protection |
| Relational database | Neon PostgreSQL | Chats, messages, and subscription records |
| ORM | Drizzle ORM | Typed schema and SQL operations |
| File storage | Amazon S3 | Original PDF storage |
| PDF processing | LangChain PDF loader | Extract pages and text from a PDF |
| Embeddings | Google Gemini `embedding-001` | Convert text and questions to vectors |
| Vector database | Pinecone | Similarity search over document chunks |
| Generation | Google Gemini | Answer questions using retrieved context |
| Payments | Razorpay | Orders, checkout, and webhook processing |
| PDF display | Google Docs Viewer iframe | Display the stored PDF in the chat workspace |

Some packages in `package.json` are leftovers from earlier experiments, including OpenAI and Vercel AI SDK packages. The active chat generation path is Gemini and returns a normal JSON response, not a streamed response.

## 4. High-Level Architecture

```text
Browser
  |
  | Clerk session
  v
Next.js App Router
  |
  +--> React pages and components
  |
  +--> API route handlers
          |
          +--> Clerk authentication
          +--> Drizzle --> Neon PostgreSQL
          +--> S3 --> original PDF
          +--> PDF loader --> text chunks
          +--> Gemini embeddings --> vectors
          +--> Pinecone --> similarity search
          +--> Gemini generation --> answer
          +--> Razorpay --> payment events
```

### Main responsibilities

- **Browser:** selects a PDF, uploads it, displays the chat, sends questions, and renders answers.
- **Next.js route handlers:** validate requests, coordinate services, retrieve context, call Gemini, and write database records.
- **PostgreSQL:** stores application metadata and conversation history.
- **S3:** stores the original binary PDF.
- **Pinecone:** stores searchable vector representations of PDF chunks.
- **Gemini:** provides embeddings and natural-language answers.
- **Clerk:** provides the authenticated `userId` used by application records.
- **Razorpay:** provides payment and subscription events.

## 5. Main User Flow

### A. Sign in

1. Clerk renders the sign-in or sign-up experience.
2. `src/middleware.ts` protects private pages and API routes.
3. Server code calls Clerk `auth()` when it needs the current user.

The public routes are `/`, `/sign-in`, and `/sign-up`. The rest of the application is protected by middleware. The webhook should be treated specially because Razorpay calls it without a Clerk browser session.

### B. Upload and create a chat

1. `FileUpload` accepts one PDF and checks the 10 MB client-side limit.
2. `uploadToS3` creates a browser-side presigned POST and uploads the file directly to S3.
3. The browser sends `{ file_key, file_name }` to `POST /api/create-chat`.
4. The server authenticates the user and checks database, Gemini, and Pinecone configuration.
5. The server downloads the PDF from S3.
6. `PDFLoader` extracts the pages.
7. Each page is normalized and split into chunks of about 2,000 characters with 200 characters of overlap.
8. Gemini creates a 768-dimensional embedding for each chunk.
9. The chunks are upserted into Pinecone in batches of 100.
10. The file key is converted to an ASCII namespace so each uploaded document has a logical vector partition.
11. A row is inserted into `chats`.
12. The response is `{ chat_id }`, and the browser navigates to `/chat/{chat_id}`.

### C. Ask a question

1. `ChatComponent` sends `{ messages, chatId }` to `POST /api/chat`.
2. The route finds the chat and gets its `fileKey`.
3. The latest user message is embedded with Gemini.
4. Pinecone is queried with `topK: 5` in the file's namespace.
5. Matches above `0.7` similarity are preferred, then matches above `0.5`, then all available matches if necessary.
6. Retrieved text is concatenated and capped at 3,000 characters.
7. The route builds a prompt containing the context and question.
8. Gemini generates the answer.
9. The user message and assistant message are inserted into PostgreSQL.
10. The route returns a JSON assistant message containing `id`, `content`, `role`, and `createdAt`.

If the normal Gemini model call fails because of a model/API mismatch, the code tries a direct Gemini API path. If that also fails for that class of error, it stores and returns a user-friendly fallback message.

### D. View history and delete a chat

- `GET /api/chats` returns chats for the authenticated user.
- `POST /api/get-messages` returns messages for a chat.
- `DELETE /api/delete-chat` checks ownership, deletes messages, then deletes the chat row.

At present, deleting the database chat does not remove the S3 file or Pinecone vectors. That is an important improvement to mention in an interview.

### E. Subscription flow

1. The user requests `GET /api/razorpay` and the server creates or fetches payment metadata.
2. The client opens Razorpay Checkout.
3. Razorpay can send a signed webhook to `POST /api/webhook`.
4. The webhook validates the signature and writes subscription data.
5. `GET /api/subscription` checks whether the stored period end, with a one-day grace period, is still valid.

The current `POST /api/subscription` is a manual activation path and should not be considered production payment verification. A production version would activate access only after a verified payment event.

## 6. API Design

The API uses Next.js App Router route handlers. Requests and responses are JSON unless a route is receiving the raw Razorpay webhook body.

### `GET /api/chats`

**Purpose:** List the current user's chats.

**Authentication:** Clerk user required.

**Request:** No body.

**Response:**

```json
{
  "chats": [
    {
      "id": 1,
      "pdfName": "resume.pdf",
      "pdfUrl": "https://...",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "userId": "user_123",
      "fileKey": "1700000000000-resume.pdf"
    }
  ]
}
```

### `POST /api/create-chat`

**Purpose:** Process an already uploaded PDF and create its chat record.

**Authentication:** Clerk user required.

**Request:**

```json
{
  "file_key": "1700000000000-report.pdf",
  "file_name": "report.pdf"
}
```

**Success:**

```json
{ "chat_id": 1 }
```

**Common failures:** `401` unauthenticated, `400` missing fields, `500` configuration, S3, PDF, embedding, Pinecone, or database failure.

**Side effects:** Downloads from S3, writes vectors to Pinecone, inserts a chat row.

### `POST /api/chat`

**Purpose:** Answer a question about one chat's PDF.

**Request:**

```json
{
  "chatId": 1,
  "messages": [
    { "role": "user", "content": "Summarize the conclusion." }
  ]
}
```

**Success:**

```json
{
  "id": "1710000000000",
  "content": "The conclusion says ...",
  "role": "assistant",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

**Side effects:** Retrieves vectors, calls Gemini, inserts a user message and an assistant message.

### `POST /api/get-messages`

**Purpose:** Load the conversation for a chat.

**Request:**

```json
{ "chatId": 1 }
```

**Response:** A formatted array of stored messages containing message id, role, content, and creation time.

### `DELETE /api/delete-chat`

**Purpose:** Delete a user's chat and its relational messages.

**Request:**

```json
{ "chatId": 1 }
```

**Success:**

```json
{ "success": true }
```

**Authorization:** This route checks that the chat's `userId` equals the authenticated user. The same ownership check should also be added to chat reads and chat generation.

### `GET /api/subscription`

**Purpose:** Return the current user's subscription status.

**Response:**

```json
{ "isPro": true }
```

The implementation considers the subscription valid until `periodEnd + one day`.

### `POST /api/subscription`

**Purpose:** Current manual subscription activation/update path.

**Response:** Contains `success`, `message`, `userId`, and `periodEnd`.

**Interview note:** This is convenient for local testing but is not secure payment authorization. It should be removed or restricted before production.

### `GET /api/razorpay`

**Purpose:** Create or retrieve Razorpay order/checkout metadata for the authenticated user.

### `POST /api/webhook`

**Purpose:** Receive Razorpay events.

**Security:** Reads the raw body and validates `x-razorpay-signature` before processing events.

**Handled events:** `subscription.activated`, `subscription.charged`, `payment.captured`, and `payment.authorized`.

**Production requirements:** Make the webhook publicly reachable to Razorpay, keep signature verification, add idempotency, validate event payloads, and avoid trusting arbitrary user IDs without tying them to a verified Razorpay order.

### Debug endpoints

The project also contains `/api/test-embeddings`, `/api/debug-pinecone`, `/api/debug-upload`, `/api/debug-pdf-text`, and `/api/debug-namespace`. These are useful during development but should be disabled, protected more strongly, or removed in production because they can expose document and infrastructure details.

## 7. Database Design

The schema is in `src/lib/db/schema.ts`.

### `chats`

- `id`: serial primary key.
- `pdfName`: original/display name.
- `pdfUrl`: URL used by the PDF viewer.
- `createdAt`: creation timestamp.
- `userId`: Clerk user identifier.
- `fileKey`: S3 key and Pinecone namespace input.

### `messages`

- `id`: serial primary key.
- `chatId`: foreign key to `chats`.
- `content`: message text.
- `createdAt`: creation timestamp.
- `role`: PostgreSQL enum containing `system`, `user`, or `assistant`.

### `user_subscriptions`

- `id`: serial primary key.
- `userId`: unique Clerk user identifier.
- Razorpay customer, subscription, and plan identifiers.
- `razorpayCurrentPeriodEnd`: access expiration timestamp.

The relational database stores metadata and conversation history. It does not store the PDF's extracted chunks; those live as vector metadata in Pinecone.

## 8. RAG Concepts You Should Explain

### What is an embedding?

An embedding is a list of numbers representing the semantic meaning of text. Similar meanings produce vectors that are close under a similarity metric such as cosine similarity.

### Why split the document?

A large PDF may exceed model context limits and is too broad for precise retrieval. Chunks make indexing and question-specific retrieval possible. The overlap helps avoid losing meaning at chunk boundaries.

### Why use Pinecone?

PostgreSQL is excellent for structured records, but a vector database is optimized for nearest-neighbor similarity search over embeddings. Pinecone also supports namespaces, which the project uses to separate each file's vectors.

### Why retrieve before generating?

The model receives relevant document evidence instead of relying only on its pretrained knowledge. This is the retrieval, augmentation, and generation sequence.

### What happens when retrieval fails?

The code catches retrieval errors and can fall back to generic context or an empty context. The answer path then tells the user that document processing is unavailable. In a stronger production design, retrieval failure should be observable and should not silently produce a confident answer.

## 9. Security and Production Review

These are strong interview talking points because they show engineering judgment.

### Highest-priority fixes

1. **Enforce ownership everywhere.** `GET /api/get-messages`, `POST /api/chat`, and the chat page must verify that `chat.userId` matches the Clerk user. A chat ID alone is not authorization.
2. **Never expose AWS secrets in client variables.** The current S3 module uses `NEXT_PUBLIC_AWS_ACCESS_KEY_ID` and `NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY`. Move presigned POST creation to a server route and expose only the short-lived upload result to the browser.
3. **Require verified payment for Pro access.** Remove the unrestricted manual activation route and make the webhook the source of truth.
4. **Fix webhook routing.** Ensure the Razorpay webhook is publicly reachable while retaining raw-body signature validation.
5. **Clean up external data.** Delete the S3 object and Pinecone namespace/vectors when a chat is deleted, or run an asynchronous cleanup job.
6. **Move PDF processing to a job.** Large PDFs can exceed a serverless request timeout. Upload first, enqueue processing, show processing status, then enable chat when indexing finishes.
7. **Validate all inputs.** Validate `chatId`, message shape, message length, PDF metadata, and request size with a schema library such as Zod.
8. **Remove or gate debug endpoints.** They expose operational details and document text.
9. **Make migration and schema names consistent.** Current SQL migrations and the Drizzle schema have naming differences around subscription timestamps.
10. **Add observability.** Track upload duration, pages/chunks, embedding failures, Pinecone latency, model latency, token usage, and webhook outcomes without logging sensitive document content.

### Data lifecycle answer

> The database row is not the entire document. The original PDF is in S3, searchable chunks are in Pinecone, and metadata/conversation state is in PostgreSQL. Therefore deletion must be coordinated across all three systems, ideally through an idempotent cleanup job.

### Authorization answer

> Middleware proves that a request comes from an authenticated user, but it does not prove that the requested `chatId` belongs to that user. Authorization has to be enforced in the database query or a shared ownership helper, for example by filtering on both `chats.id` and `chats.userId`.

## 10. Failure Handling

- Missing Clerk user: return `401`.
- Missing request field: return `400`.
- Missing environment configuration: return a clear server error and log the missing service category.
- Database failure: return `500`.
- Gemini unavailable: try the direct fallback path for known model/API errors, otherwise return `503`.
- Safety-filtered Gemini response: return `400`.
- Input too long: return `400`.
- Invalid Razorpay signature: return `400`.
- Pinecone retrieval issue: currently fall back; production should alert and expose a controlled processing state.

## 11. Likely Interview Questions and Short Answers

### Why Next.js?

> It gives the project one TypeScript codebase for the React UI, server-rendered pages, middleware, and API route handlers. That keeps the initial product simple while allowing server-only access to database and AI services.

### Why both PostgreSQL and Pinecone?

> They solve different problems. PostgreSQL stores transactional application data such as users' chats and messages. Pinecone stores embeddings and performs semantic nearest-neighbor search over document chunks.

### Why use a namespace per file?

> It prevents retrieval for one document from mixing with another document. The file key is normalized into the namespace, and every indexing and query operation uses that same namespace.

### Why use chunk overlap?

> Important sentences can cross a chunk boundary. A 200-character overlap preserves some surrounding context while keeping chunks small enough for embedding and retrieval.

### How would you improve answer quality?

> I would add page-aware metadata, reranking, better chunking for headings and tables, citations in the response, evaluation questions with expected answers, and a stricter no-context behavior. I would measure retrieval recall and answer faithfulness rather than tuning only by intuition.

### How would you scale it?

> Move ingestion to a queue and worker, process pages incrementally, batch embeddings with rate-limit handling, use idempotent document versions, cache model and Pinecone clients, stream answer tokens, and add per-user quotas and observability.

### What was the hardest part?

> The hardest boundary is coordinating binary storage, PDF extraction, embeddings, vector indexing, and database state. A successful upload is not enough; the system must know whether indexing completed and must clean up partial work when one downstream service fails.

### What would you test?

> I would test authorization for every chat operation, upload validation, chunking determinism, embedding dimensions, Pinecone namespace isolation, model failure behavior, webhook signature validation and idempotency, deletion across all stores, and an end-to-end upload-to-answer flow.

## 12. Testing and Running

Useful commands from `package.json`:

```bash
npm install --legacy-peer-deps
npm run check-env
npm run dev
npm run build
npm run check-db
npm run migrate:init
npm run migrate:roles
```

The repository does not define a formal automated test script. `scripts/test-chat.ts`, the debug page, database checks, and manual smoke testing provide development verification. In an interview, state this directly and describe the test plan you would add rather than claiming coverage that is not present.

## 13. A Strong Two-Minute Project Explanation

> I built a ChatPDF application with a Next.js App Router frontend and server-side API routes. Clerk authenticates users, and each user can upload a PDF. The browser uploads the binary directly to S3 using a presigned form, then the server downloads the file and extracts its pages. I split the text into overlapping chunks, generate Gemini embeddings, and upsert those vectors into Pinecone under a namespace derived from the file key. The chat endpoint embeds the latest question, retrieves the top matching chunks, limits the context, and asks Gemini to answer only from that context. Chats and messages are stored in Neon PostgreSQL with Drizzle, while Razorpay handles the subscription flow.
>
> The main production improvements I would make are server-side presigning so cloud secrets never reach the browser, ownership checks on every chat read and write, verified payment-only subscription activation, asynchronous document processing, coordinated cleanup of S3 and Pinecone data, input validation, and automated tests for authorization and retrieval quality.

## 14. Source Map

- Application pages: `src/app/page.tsx`, `src/app/chat/[chatId]/page.tsx`.
- UI behavior: `src/components/FileUpload.tsx`, `ChatComponent.tsx`, `ChatSideBar.tsx`, `PDFViewer.tsx`.
- Authentication: `src/middleware.ts`, `src/app/layout.tsx`.
- API routes: `src/app/api/`.
- Database: `src/lib/db/schema.ts`, `src/lib/db/index.ts`.
- S3: `src/lib/s3.ts`, `src/lib/s3-server.ts`.
- PDF and vector indexing: `src/lib/pinecone.ts`.
- Retrieval: `src/lib/context.ts`.
- Embeddings and generation: `src/lib/gemini-embeddings.ts`, `src/lib/gemini-config.ts`, `src/lib/gemini-direct-api.ts`.
- Payments: `src/lib/razorpay.ts`, `src/app/api/webhook/route.ts`.
