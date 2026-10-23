---
categories:
  - Engineering
topics:
  - ai
sources:
updated: 2026-10-23
---

Decode is the second phase of LLM inference: generating the answer one token at a time, after [[Prefill|prefill]] has finished.

It is an autoregressive loop. The model generates a token, appends it to the sequence, then generates the next one using everything so far.

### Sampling with the KV cache

Prefill runs the whole prompt once, fills the KV cache, and produces the first token. Each decode step then feeds in only the newest token, reads the KV cache for everything before it, adds one new K, V entry, and produces the next token.

![[Screenshot 2026-10-23 at 3.26.11 PM.png]]


Each step's output token becomes the next step's input, and the KV cache grows by one entry per generated token.

- Prefill is compute bound: lots of math on many tokens at once.
- Decode is memory-bandwidth bound: each step does little math for one token, but still has to read all the model weights and the whole KV cache from memory.

### What makes the decode phase slow?

- Bigger model: more weight bytes to read per token
- Lower memory bandwidth: each read takes longer
- Longer context: a bigger KV cache to read every step
- Higher precision: 16-bit weights are more bytes than 8-bit or 4-bit
- More output tokens: total decode time grows linearly

### Metrics

- **Time between tokens (TBT)**, also called **time per output token (TPOT)**: the gap between consecutive output tokens. This is how fast the response feels as it streams.
- **Output throughput:** output tokens generated per second.
- **End-to-end latency:** approximately [[Prefill#Time to first token (TTFT)|TTFT]] + number of output tokens × TPOT.

In [[Building a Tiny Inference Server]], latency grew almost perfectly linearly with output tokens, at about 8 ms per decode step.

