---
categories:
  - Engineering
topics:
  - ai
sources:
  - article
updated: 2026-10-12
---

This note builds on the gradient descent update rule covered in [[Flavors of Optimizers]].

In its classic form, L is the loss over the entire dataset, so every update requires a full pass through the data. On large datasets this is slow, which is where SGD comes in.

## Vanilla Stochastic Gradient Descent (SGD) 

SGD uses the same update rule, but computes the gradient from a small random batch of data instead of the whole dataset:

$$
w_{\text{new}} = w_{\text{old}} - \eta \cdot \frac{\partial L_{\text{batch}}}{\partial w}
$$

Each batch gives a slightly noisy estimate of the true gradient, which is the "stochastic" part. Because there are many cheap updates per epoch instead of one expensive one, training progresses much faster.

Every weight is updated with the same _fixed learning rate_. SGD keeps no memory of past steps: at each update it simply looks at the current gradient and takes a step.

An optimizer object performs exactly this update automatically, for every weight in the model, so the loop never has to be written by hand:

```python
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

optimizer.zero_grad()   # 1. reset gradients from the previous batch
loss.backward()         # 2. compute new gradients
optimizer.step()        # 3. apply w = w - lr * w.grad to every parameter
```

## SGD with momentum 

The main con in vanilla SGD is that it keeps no memory of past steps. Each batch gives a noisy gradient, so the weights jitter from step to step. 

Momentum fixes this by giving the optimizer a memory. Every weight keeps a running “velocity” built from its past gradients.The weight then moves using that velocity instead of the raw gradient, like a heavy ball rolling downhill that keeps most of its speed from one step to the next.

Here g is the batch gradient for the weight, the value stored in `w.grad`:

$$
g = \frac{\partial L_{\text{batch}}}{\partial w}
$$
The momentum buffer v is the running velocity:

$$
v \leftarrow \beta \, v + g
$$

The weight update uses v in place of the gradient:

$$
w_{\text{new}} = w_{\text{old}} - \eta \cdot v
$$
- Expanding v shows that it is a weighted sum of all past gradients, with older gradients fading away:

$$
v_t = g_t + \beta \, g_{t-1} + \beta^2 g_{t-2} + \dots
$$
```python
optimizer = torch.optim.SGD(model.parameters(), lr=0.01, momentum=0.9)
```

SGD still uses one fixed learning rate for every weight. [[Adam and AdamW]] address this by giving each parameter its own adaptive learning rate.
