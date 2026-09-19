---
categories:
  - Engineering
topics:
  - ai
sources:
  - article
updated: 2026-09-18
---
Sources : 
- https://www.maartengrootendorst.com/blog/quantization/ 
- 

Large Language Models (LLMs) are often too large to run on consumer hardware. These models may exceed billions of parameters and generally need GPUs with large amounts of VRAM to speed up inference

As such, more and more research has been focused on making these models smaller through improved training, adapters, etc. One major technique in this field is called *quantization*

## The Problem with LLMs

LLMs get their name due to the number of parameters they contain. Nowadays, these models typically have billions of parameters (mostly *weights* ) which can be quite expensive to store.

During inference, activations are created as a product of the input and the weights, which similarly can be quite large.

![](https://substackcdn.com/image/fetch/w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fb99fe2ba-d4f4-4046-850c-e3f469add123_1368x708.png)

As a result, we would like to represent billions of values as efficiently as possible, minimizing the amount of space we need to store a given value.

These values are represented by *bits

A nifty feature of these bits is that we can calculate how much memory your device needs to store a given value. Since there are 8 bits in a byte of memory, we can create a basic formula for most forms of floating point representation.

![](https://substackcdn.com/image/fetch/w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fe146740d-72e9-44dc-99e1-f7bc42737cec_1128x144.png)

Now let’s assume that we have a model with 70 billion parameters. Most models are natively represented with float 32-bit (often called *full-precision* ), which would require **280GB** of memory just to load the model.

![](https://substackcdn.com/image/fetch/w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F9c28e9b0-c002-4a49-9441-af24f261df40_1128x548.png)

As such, it is very compelling to minimize the number of bits to represent the parameters of your model (as well as during training!). However, as the precision decreases the accuracy of the models generally does as well.

We want to reduce the number of bits representing values while maintaining accuracy… This is where *quantization* comes in!