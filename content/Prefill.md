---
categories:
  - Engineering
topics:
  - ai
sources:
updated: 2026-10-23
---

Prefill is the first phase of LLM Inference. Once it finishes, the [[Decode]] phase takes over and generates the rest of the answer one token at a time.

During prefill, given a prompt, all prompt tokens are processed at the same time, in parallel, in one pass through the model. Each transformer layer computes keys and values projections for every prompt token and stores them in KV Cache. 
The model then produces the probability distribution for the first output token.

### What the hardware does

The GPU reads the model weights from memory, runs one forward pass over the whole prompt, and writes the keys and values for every prompt token back to memory as the KV cache.

```mermaid
---
config:
  block:
    padding: 12
---
block-beta
  columns 3
  block:mem:3
    columns 3
    ML["Memory"]:3
    W["Weights"] space KV["KV Cache"]
  end
  space:3
  space:3
  GPU["GPU Compute<br/>one forward pass"]:3
  W -- "read weights" --> GPU
  GPU -- "write KV cache" --> KV
  style mem fill:#a78bfa1a,stroke:#a78bfa
  style ML fill:transparent,stroke:transparent
  style W fill:#facc1540,stroke:#c99a1e
  style KV fill:#f8717140,stroke:#d97777
  style GPU fill:#34d39933,stroke:#3f9f63
```

### What happens to the tokens

All prompt tokens go into the model together. Out comes the first generated token, plus the KV cache that the [[Decode|decode phase]] will reuse.

```mermaid
flowchart TB
    T1["The"] & T2["cat"] & T3["sat"] --> M["Model"]
    M --> O["on<br/>first generated token"]
    M --> C["KV Cache<br/>K, V for The, cat, sat"]

    classDef token fill:transparent,stroke:#888888
    classDef model fill:#34d39933,stroke:#3f9f63
    classDef output fill:#22c55e40,stroke:#3f9f63
    classDef cache fill:#facc1533,stroke:#c99a1e
    class T1,T2,T3 token
    class M model
    class O output
    class C cache
```


Prefill is usually compute-bound, because the whole sequence is processed in parallel, so prefill is limited by GPU FLOPs. 

### What makes Prefill phase slow ? 

- Longer Prompt
- Bigger model: more parameters means more FLOPs per token
- Less GPU compute: fewer FLOPs per second means the same work takes longer

### Time to first token (TTFT)

TTFT is the lag between submitting a prompt and seeing the first output token. It is essentially the time prefill takes.

In [[Building a Tiny Inference Server]], I saw this in practice: longer prompts made each request slower, partly because prefill had more tokens to process.

