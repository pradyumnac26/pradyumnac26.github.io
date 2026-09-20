---
categories:
  - Engineering
topics:
  - ai
sources:
  - article
updated: 2026-09-20
---

![[jev.mov]]
video credits to https://x.com/BenjDicken

Jev is an AI model that consumes input and produces output VERY differently than ChatGPT, Claude, Grok. 
  
The models we're used to often give us long written answers, with explanations and reasoning jev returns structured answers your app can use directly, instead of generating those explanations.. 

The input is two things: 
- Text state to assess. Email, html, code, whatever. 
- A set of questions which will be asked about the attached state. 

The canonical example from TypeSafe's docs (the company that came up with Jev) is to identify the urgency of a support ticket. 

We pass the model the customer text + a single noul question "is this urgent?". 
Jev returns a full set of JSON. 
This JSON is not generated with token-by-token autoregression. Jev is not trained to produce sequences of text tokens, rather to answer questions, and guarantees well-formed responses. 

In the example below, we see it produces a 0.99 probability (on a 0-1.0 scale) that the answer is "yes." 
Jev supports exactly three types of questions (seconds example in video): 
- Noul: 0–1 probability that the answer to a yes/no question is "yes."
- Choice: Ask question with pre-defined set of answers. Jev chooses the best and assigns probabilities to each. 
- Score: Ask question with pre-defined scale of answers. Jev produces a position on the scale. 

Jev computes answers for all questions in parallel, making responses super fast even for many questions in a single request. And Jev is super cheap and fast. 

This might seem like a narrow set of capabilities, but in the right contexts leads to incredible potential. It also makes for a useful API / primitive for programming, since the outputs are type-safe and predictable in structure.


