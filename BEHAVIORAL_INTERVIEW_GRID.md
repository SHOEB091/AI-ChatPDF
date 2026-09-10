# Behavioral Interview Preparation Grid

Use this grid to rehearse real stories from the ChatPDF project. Keep each answer in this order:

- **Situation:** What was happening?
- **Task:** What responsibility or goal did you own?
- **Action:** What did you personally do, and why?
- **Result:** What changed, what did you learn, and what would you measure next?

Do not memorize every sentence. Replace the bracketed details with your real facts, such as the actual PDF size, latency, error, deadline, or number of users.

## Common Questions For The Projects You Worked On

| Common Questions | Project 1 | Project 2 | Project 3 |
| --- | --- | --- | --- |
| Challenges | Coordinate a user-facing upload, PDF processing pipeline, chat workspace, history, PDF viewer, authentication, and several external services. |  |  |
| Mistakes/Failures | The prototype treats a successful S3 upload as if the chat were ready, even though indexing can still fail. Retrieval can also fall back to generic context, and some chat routes need stronger ownership checks. |  |  |
| Technical Decisions | Use Next.js App Router for the UI, middleware, and API handlers; Gemini embeddings with Pinecone for RAG; a namespace per file; 2,000-character chunks with 200-character overlap; PostgreSQL and Drizzle for application data; and Clerk user IDs for ownership. |  |  |
| Enjoyed | Building the complete user journey from PDF drop zone to document-grounded chat and debugging the boundary between text extraction, vector similarity, context size, and model output. |  |  |
| Leadership | Defined the end-to-end flow, connected frontend and backend work, made the processing sequence explicit, and raised production concerns around secrets, authorization, webhook verification, cleanup, and payment activation. |  |  |
| Conflicts | A fast prototype favors simple synchronous processing, while a production design needs background jobs and visible processing status. Larger chunks preserve context but reduce retrieval precision, while smaller chunks may lose meaning. |  |  |
| Technology Used | Next.js, React, TypeScript, Tailwind, Clerk, React Query, Axios, AWS S3, PDFLoader, LangChain document utilities, Gemini, Pinecone, Neon PostgreSQL, Drizzle ORM, and Razorpay. |  |  |
| What You’d Do Differently | Add a document-processing state machine and background worker, move S3 presigning server-side, enforce ownership in every query, add citations and retrieval evaluation, remove manual payment activation, add webhook idempotency, and clean all storage on deletion. |  |  |

## Filled Story Bank

### Story 1: Building The End-to-End Product

**Situation:** I was building a ChatPDF product where a user should be able to upload a PDF and immediately ask questions about it.

**Task:** I needed to connect the browser upload experience, document processing, chat UI, persistence, and authentication into one usable flow.

**Action:** I used Next.js App Router for pages and API handlers. The upload component validates a PDF and a 10 MB limit, uploads the binary to S3, and calls the create-chat endpoint. The server indexes the document before inserting a chat row, and the chat page combines a sidebar, PDF viewer, and message panel. Clerk supplies the user identity, while Drizzle stores chats and messages.

**Result:** The project has a complete path from upload to document-grounded chat. The main lesson was that distributed workflows need explicit states: uploaded, processing, indexed, ready, failed, and deleted. A next iteration would expose those states instead of keeping processing inside one synchronous request.

### Story 2: Debugging RAG Retrieval

**Situation:** A language model can answer general questions, but the product needed answers about a user's private PDF.

**Task:** I needed to make document content searchable without sending the entire PDF in every prompt.

**Action:** I used `PDFLoader` to extract pages, normalized the text, split it into 2,000-character chunks with 200-character overlap, generated Gemini embeddings, and stored them in Pinecone. I used an ASCII-normalized file key as the namespace. For a question, I embed the question, retrieve five matches, apply similarity thresholds, concatenate at most 3,000 characters, and place that context in the Gemini prompt.

**Result:** The architecture follows the retrieval, augmentation, and generation pattern and isolates documents by namespace. The next technical improvement would be a retrieval evaluation set so chunk size and similarity thresholds are chosen from measured recall and answer faithfulness.

### Story 3: Handling An External AI Failure

**Situation:** The chat endpoint depends on an external model API, and model names or API versions can change.

**Task:** I wanted the application to fail in a controlled way instead of exposing a raw provider error to the user.

**Action:** The route discovers available models and prefers a non-preview Flash model. If the standard SDK call fails with a known model/API mismatch, it tries the direct Gemini API helper. If that also fails, it stores a user-friendly fallback response. Other provider failures return a `503`, while safety and input-length errors return specific `400` responses.

**Result:** The user sees a controlled response and the server logs the provider failure path. The improvement I would add is bounded retries with exponential backoff, metrics, circuit breaking, and no generic fallback that could be mistaken for document-grounded content.

### Story 4: Finding An Authorization Gap

**Situation:** Middleware protects routes from unauthenticated requests, but a request can still contain another user's valid numeric `chatId`.

**Task:** I needed to reason about authentication separately from authorization.

**Action:** I checked the route behavior and found that delete performs an ownership check, while chat retrieval and message generation primarily query by chat ID. I would centralize an ownership-aware lookup that filters by both `chatId` and Clerk `userId`, then use it in the page and every chat API route.

**Result:** The design lesson is that “the user is signed in” does not mean “the user owns this resource.” The fix prevents cross-user document and message access and should be covered with a regression test using two users.

### Story 5: Improving Payment Trust

**Situation:** Local development needed an easy way to simulate a subscription, but production access must depend on a successful payment.

**Task:** I needed to separate a development shortcut from the production authorization model.

**Action:** I reviewed the Razorpay order, checkout, webhook, and subscription routes. The webhook already validates a Razorpay signature, but the manual POST route can create a 30-day period without proof of payment. I would remove that path in production, make the signed webhook the source of truth, verify order and user linkage, and make event handling idempotent.

**Result:** Subscription access becomes based on a provider-verified event rather than a client-triggered request. The broader lesson is to make external payment events durable, replay-safe, and independently verifiable.

### Story 6: Designing Deletion Correctly

**Situation:** A chat is represented in more than one system: PostgreSQL metadata, an S3 object, and Pinecone vectors.

**Task:** I needed to define what “delete chat” should mean.

**Action:** The current route deletes messages and the chat row after checking ownership. I identified that the S3 object and Pinecone namespace remain, so a production design should publish an idempotent cleanup job, record deletion status, delete the external resources, and retry failures safely.

**Result:** The key insight is that relational deletion alone does not delete the user's document data. The improved design would provide a consistent data lifecycle and reduce storage leakage.

## Easy Answer Frameworks

### “Tell me about yourself and this project.”

> I am a TypeScript/Next.js developer interested in full-stack and AI-backed products. In this project I built a ChatPDF workflow: authenticated users upload a PDF, the system indexes it with Gemini embeddings and Pinecone, and a chat endpoint retrieves relevant chunks before generating an answer. I also worked through the practical concerns around PostgreSQL persistence, S3 storage, Clerk authentication, Razorpay payments, failure handling, and production security.

### “What was your biggest challenge?”

> The biggest challenge was coordinating several systems in one user action. Uploading a file, processing it, indexing it, creating relational metadata, and making it chat-ready are separate operations. That taught me to think in workflow states and partial failure recovery rather than treating one HTTP request as the whole transaction.

### “Tell me about a mistake.”

> One important mistake in the prototype was treating authentication as sufficient protection for every chat operation. A signed-in user still needs ownership authorization for a requested chat ID. I identified that gap and would fix it with a shared ownership query and tests involving two users. I also learned to review browser bundles carefully because secrets must never be represented by `NEXT_PUBLIC_*` variables.

### “Tell me about a disagreement.”

> The reasonable disagreement is between prototype speed and production reliability. A synchronous `create-chat` route is easy to understand and useful for an MVP, but large PDFs can exceed request limits. I would keep the simple path for a small prototype, then move indexing to a queue with status updates as scale and file size increase.

### “What did you enjoy?”

> I enjoyed working across the whole flow rather than only one screen. The most interesting part was seeing how a product decision in the UI, such as “the chat is ready,” depends on storage, parsing, embedding, vector indexing, and model availability underneath.

### “What did you lead?”

> I led the shape of the end-to-end workflow: upload, process, index, persist, retrieve, answer, and manage history. I made the service boundaries explicit and used the code review of the prototype to identify the security and reliability work needed before production.

### “What would you do differently?”

> I would prioritize correctness at the boundaries earlier: server-side S3 presigning, ownership checks on every read, a document status state machine, asynchronous processing, verified payment activation, coordinated deletion, schema validation, and automated tests. Those changes reduce security and operational risk before adding more features.

## STAR Checklist Before The Interview

- State the product and your personal responsibility in the first two sentences.
- Use a concrete technical detail: 10 MB upload limit, 2,000-character chunks, 200-character overlap, top five matches, or 3,000-character context.
- Explain why you chose the approach, not only what library you used.
- Mention the result honestly. If there was no measured metric, say what worked and what you would measure.
- Own prototype limitations without hiding them.
- End with the lesson or the next improvement.
- Avoid claiming team size, traffic, latency, or business impact unless you can supply the real number.

## Questions You Can Ask The Interviewer

- How do you evaluate retrieval quality and answer faithfulness in your AI products?
- What is the expected document size and processing-time target?
- Is document processing synchronous, queued, or event-driven in production?
- How do you handle deletion and retention across object storage and vector databases?
- What is the ownership model for API resources and service-to-service credentials?
- How are payment webhooks made idempotent and replay-safe?
- Which engineering metric matters most for this product: latency, cost, retrieval recall, conversion, or reliability?
