---
title: "PyTorch in One Hour: From Tensors to Training Neural Networks on Multiple GPUs"
source: "https://sebastianraschka.com/teaching/pytorch-1h/"
author:
  - "[[Sebastian Raschka]]"
description: "A curated introduction to PyTorch that gets you up to speed in about an hour."
tags:
  - "clippings"
---
Firstly, PyTorch is a *tensor library* that extends the concept of array-oriented programming library NumPy with the additional feature of accelerated computation on GPUs, thus providing a seamless switch between CPUs and GPUs.

Secondly, PyTorch is an *automatic differentiation engine*, also known as autograd, which enables the automatic computation of gradients for tensor operations, simplifying backpropagation and model optimization.

Finally, PyTorch is a *deep learning library*, meaning that it offers modular, flexible, and efficient building blocks (including pre-trained models, loss functions, and optimizers) for designing and training a wide range of deep learning models, catering to both researchers and developers

A **tensor** is just a generalization of the concept you already know from scalars, vectors, and matrices — it's a container for numbers, organized in a grid of some number of dimensions.

Here's the progression:

|Name|Dimensions|Example|
|---|---|---|
|Scalar|0|`5`|
|Vector|1|`[1, 2, 3]`|
|Matrix|2|`[[1, 2], [3, 4]]`|
|Tensor|3+ (or any n)|a cube of numbers, or higher|

Technically, a scalar and a vector are _also_ tensors (0-dimensional and 1-dimensional tensors, respectively) — in deep learning contexts, people just tend to use the word "tensor" to mean "an array with an arbitrary number of dimensions," and use it as the catch-all term regardless of rank.

so rank is basicalyhow many indexes required to grab a element ?
