---
title: "What Matters in Production RAG"
source: "https://arpitbhayani.me/blogs/rag-production"
author:
  - "[[Arpit Bhayani]]"
description: "Most of us build RAG the same way: follow a tutorial that embeds a handful of PDFs, stores the vectors in a local Chroma instance, and chains everything together with LangChain (if that's still a thing). The demo works. The answer looks reasonable. Then you take it to production and it falls apart in quiet, hard-to-diagnose ways."
tags:
  - "clippings"
---
Always store metadata with each chunk: the source document ID, section heading, page number, creation timestamp, and a content hash. You will need all of these later, both for filtering and for keeping the index current

The embedding model you choose during indexing is a ‘long-term commitment’

Every vector in your index was produced by that model. If you switch models, every vector is now incommensurable with the new query embeddings, and you must re-embed the entire corpus.

A document that is split into 15 chunks produces 15 separate vectors, each stored with its own ID. When that document is updated, you cannot simply update a row as you would in a relational database. You need to:

- Identify all 15 chunk IDs that belong to the old version of the document

- Delete them from the vector store

- Re-chunk the updated document (which may now produce 17 chunks)

- Re-embed and insert the 17 new chunks

This requires a mapping layer that vector databases do not provide natively. The standard approach is a document registry, a simple relational table ([Postgres](https://www.postgresql.org/) works fine) that maps each `doc_id` to the list of chunk vector IDs currently in the index:

Re-embedding is expensive. A 100,000-document corpus with an average of 10 chunks per document means 1 million embedding API calls for a full rebuild. You want to re-embed only what changed.

Content hashing is the first gate. When a document arrives, compute a hash of its content. If the hash matches what is in the registry, skip it entirely. Most “updates” in practice are metadata changes (a title change, a timestamp update) that do not affect the text content and therefore do not require re-embedding.

For large documents, you can go further: hash at the chunk level, and re-embed only the chunks whose content changed. This is more complex to implement but pays off for long

The most underappreciated failure mode in RAG is the partial update. You start reindexing 10,000 documents, the pipeline crashes at document 6,000, and now your index is a flux: some documents are at version N, some at version N+1, and the seam between them is invisible to the retrieval layer.

When a better embedding model is released, every vector in your index is now wrong in a specific sense: it was produced by a different model, so its geometric position in the vector space is incommensurable with query embeddings from the new model. You cannot query with model B and retrieve vectors from model A.

This means embedding model upgrades require full corpus re-embedding. In practice, the migration strategy is:

- Build a shadow index with the new model running in parallel

- Route a small percentage of queries to the shadow index and compare results

- Gradually shift traffic using the alias pattern above

- Keep the old index warm until you are confident in the new one

The operational cost of this is why embedding model choice deserves more up-front  thought than it typically gets. Treat it like a database schema migration: painful to undo, so choose carefully.

A common question in production is not just “what was retrieved?” but “why did the system think this was relevant?”

---
title: "Embedding Models Make Or Break Your Ai App"
source: "https://arpitbhayani.me/blogs/embedding-models-make-or-break-your-ai-app"
author:
  - "[[Arpit Bhayani]]"
description: "Most of us building AI applications spend the bulk of their time on the LLM - picking the right model, tuning the prompt, evaluating output quality. The embedding model gets a passing thought."
tags:
  - "clippings"
---
The reason is straightforward: your embedding model cannot fix a bad chunk. If a sentence is split mid-thought across two chunks, neither chunk will retrieve correctly for a query about that fact. If a table is flattened to text without its headers, the embedding of that text is semantically meaningless noise.

Small chunks produce precise embeddings that represent one idea clearly, which makes them easy to retrieve. But they lose surrounding context, so the LLM may not have enough information to answer from that chunk alone. Large chunks preserve context but produce averaged embeddings that represent many ideas at once, which makes them hard to retrieve with precision for any single idea.

The practical sweet spot is 256-512 tokens with 10-20% overlap. The overlap ensures that facts near chunk boundaries appear in at least one chunk with enough surrounding context

Pure vector search misses documents with specific technical terms, product names, or codes that the model has not seen enough times to generalize over. Hybrid search combines dense vector retrieval with sparse BM25 retrieval and merges the results. The standard fusion technique is Reciprocal Rank Fusion (RRF).

RAGAS is the standard framework for measuring RAG pipeline quality. It computes four metrics:

- Context Recall: what fraction of relevant information was retrieved

- Context Precision: what fraction of retrieved information was relevant

- Answer Faithfulness: does the generated answer stay grounded in the retrieved context

- Answer Relevancy: does the answer actually address the query

Use RAGAS as a before/after instrument every time you change the pipeline — when you added hybrid search, did Context Recall improve? When you added reranking, did Context Precision improve without destroying Recall?

### Context Window Mismatch

Most production embedding models have an 8K token context window (OpenAI, BGE-M3). If a chunk exceeds the model’s context window, the model silently truncates the input and embeds only the beginning of the chunk. You get no error — you get a vector that represents half your document. Keep assembled context under 8K tokens for most queries, and validate that no chunk exceeds the model’s maximum input length at indexing time.

The embedding landscape is moving in two directions simultaneously. The first is multimodality: the ability to embed text, images, PDFs, and video into the same vector space, which eliminates the need for preprocessing pipelines that extract text from non-text documents. The second is long context: models with 32K and 128K context windows that can embed entire documents as a single unit, reducing the sensitivity of the pipeline to chunking decisions.