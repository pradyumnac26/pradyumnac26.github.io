---
categories:
  - Engineering
topics:
  - ai
sources:
  - article
updated: 2026-10-12
---

In PyTorch, optimizers update a model's weights using the gradients computed by the autograd engine. 

There are several strategies for making these updates, and PyTorch provides a different optimizer for each. All of them build on the same basic idea: the gradient descent update rule.

When gradient descent is worked out by hand, each weight is updated with the following rule:

$$
w_{\text{new}} = w_{\text{old}} - \eta \cdot \frac{\partial L}{\partial w}
$$

Here η is the learning rate, a small number that controls the step size, and ∂L/∂w is the gradient of the loss with respect to the weight. In PyTorch, this gradient is the value stored in `w.grad` after calling `.backward()`. Subtracting the gradient moves the weight downhill, toward a lower loss.

In its classic form, L is the loss over the entire dataset, so every update requires a full pass through the data. On large datasets this is slow, which is why practical optimizers work on small batches instead.

## The flavors

- [[SGD and SGD with Momentum]]: vanilla SGD uses one fixed learning rate and no memory of past steps. Momentum adds a running velocity that smooths out noisy gradients.
- [[Adam and AdamW]]: Adam gives every parameter its own adaptive learning rate using running averages of past gradients and squared gradients. AdamW adds decoupled weight decay on top.
