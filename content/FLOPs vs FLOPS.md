---
categories:
  - Engineering
topics:
  - ai
sources:
updated: 2026-11-10
---

### FLOPs (Floating-Point Operations)

FLOPs stands for Floating-Point Operations. It means the total number of floating-point arithmetic operations, so it measures quantity of work. For example, “this task needs 500 FLOPs.”

Example: `a*x + b` has 2 FLOPs (one multiplication and one addition).


For any matrix multiply `[M×K] × [K×N] + [M×N]`:

- Each output value needs K multiplications + K additions = 2K FLOPs
- Number of output values = M × N
- Total FLOPs = 2 × M × N × K

### FLOPS (Floating-Point Operations per Second)

FLOPS, also written as FLOP/s, means Floating-Point Operations per Second. It’s the number of operations executed each second, so it measures computational performance (speed). For example, “the H100 runs at 67 TFLOPS.” See [[H100 GPU Architecture]] for where that number comes from.
Time = Total work (FLOPs) ÷ Performance (FLOPS