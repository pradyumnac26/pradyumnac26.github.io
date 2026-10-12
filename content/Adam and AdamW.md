---
categories:
  - Engineering
topics:
  - ai
sources:
  - article
updated: 2026-10-12
---

This note builds on the gradient descent update rule covered in [[Flavors of Optimizers]] and on [[SGD and SGD with Momentum]].

## Adam 

The main con in SGD was that some parameters receive large, frequent gradients and need small, careful steps. Others receive small or rare gradients and need larger steps to make progress at all. One learning rate cannot suit both. 

So Adam resolves this by giving every parameter its own adaptive learning rate, which adjusts itself automatically by looking at the gradient's history. 

It tracks two running statistics for each parameter: the average of its past gradients (the first moment) and the average of its past squared gradients (the second moment). Together, these determine how large a step each parameter should take.

first moment m is the running mean of gradients : 

$$ 
m\leftarrow\beta_1 m+(1-\beta_1)g
$$
Result of the first moment is : 
- If the gradients point consistently in one direction, m builds up in that direction, and the weight takes near-full steps that way.
- If the gradients keep flipping between positive and negative, they cancel each other out in the average, so m stays small and the weight moves only a little. And if just one batch gives an unusual gradient, it gets only a small share of the average, so it slows the weight down slightly instead of pushing it in the wrong direction.

second moment v is the running mean of squared gradients : 

$$ 
v\leftarrow\beta_2 v+(1-\beta_2)g^2
$$
Result of the second moment is : 
- Different weights effectively get different learning rates. Weights with consistently large gradients have a large v, so their steps are scaled down compared with plain SGD. Weights with small gradients have a small v, so their steps are scaled up.
- Gradients are normalized to the same scale. Dividing by √v̂ removes the effect of raw gradient size, so a weight with gradients around 100 and a weight with gradients around 0.01 both move by roughly η per step.

Bias Correction : 
$$  
\hat m_t=\frac{m_t}{1-\beta_1^t},\quad\hat v_t=\frac{v_t}{1-\beta_2^t}  
$$
Result of the Bias Correction : 
- Bias correction fixes the fact that m and v start at zero, which makes both averages too small during the first few steps (Initialization bias). Dividing by (1 − βᵗ) scales them back up, and the correction fades away as training continues.
- The step count t starts at 1. At t = 0, the denominator (1 − β⁰) would be 0, causing a division by zero. If steps are numbered from 0, as in a typical Python loop, the exponent should be t + 1 instead.

Adam Optimizer formula : 

$$
w_{t} = w_{t-1} - \eta \cdot \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon}
$$

Here ε is epsilon, Its default value in PyTorch is 10⁻⁸, which is 0.00000001. Why we need it is that incase the gradient is 0 or near 0, then √v̂  tends to be near 0 which would divide by zero, so for that matter epsilon is added. 


In PyTorch, where lr is the initial learning rate to start from: 
```python
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
```

PyTorch also lets us set different initial values to different parameters this way : 

```python
optimizer = torch.optim.Adam([
    {"params": weights, "lr": 0.001},
    {"params": biases, "lr": 0.01},
])
```

## AdamW 

- AdamW modifies Adam by adding decoupled weight decay, which shrinks every weight slightly toward zero on each step:

$$
w_t = w_{t-1} - \eta \cdot \frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon} - \eta\lambda\, w_{t-1}
$$

The decay term −ηλ w_{t−1} sits outside Adam’s adaptive scaling, so every weight is shrunk by the same proportion regardless of its gradient history

```python
torch.optim.AdamW([
    {'params': decay_params, 'weight_decay': 0.01},
    {'params': no_decay_params, 'weight_decay': 0.0},
], lr=1e-3)

```
Keyword arguments such as `lr=1e-3` become the defaults, used by any group that does not set its own value. 

Here λ
- λ = 0: no decay at all. AdamW behaves exactly like Adam.
- Small λ, like 0.01: a gentle pull toward zero that discourages weights from growing very large, which can help reduce overfitting.
- Large λ, like 0.5: a strong pull that can shrink weights so much the model struggles to learn.


η, β₁, β₂, ε, and λ are all hyperparameters, they’re never learned; they stay fixed. 
