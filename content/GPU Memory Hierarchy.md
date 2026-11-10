---
categories:
  - Engineering
topics:
  - ai
sources:
updated: 2026-11-10
---

The memory closer to the compute core is always smaller, but faster. Memory farther away has more capacity but is much slower to access. This is because SRAM takes up more chip area and is expensive, while DRAM is dense and cheap.

### CPU vs GPU

GPU is the graphical processing unit. It is used for parallel processing. CPU can do parallel processing too, but it is designed for latency (finish one task as fast as possible), while GPU is designed for throughout (finish as many tasks as quickly as possible)  

### Inside an H100 GPU

Below is just an inside view of how GPU looks like.

![[h100-board-die-sm-labeled.png]]

### The GH100 chip: SMs, L2 cache and HBM3

Let's try to dissect and see what are the components that are inside H100 GPU. Please zoom in and see if you're not able to look at this image clearly.

![[images/Full-H100-GPU-with-144-SMs-1536x686.png]]

The full H100 GPU has around 144 SMs, out of which 132 are enabled and are usable. (some are disabled for manufacturing yield reasons). 

As you can see from the image, there is an L2 cache in the middle and HBM3 stacks on the left and the right edges. HBMs are basically the storage or GPU's DRAM. The memory controllers connect the HBM3 and the L2 cache. 

The six HBM3 boxes on the far left and right edges, are not on the chip they are separate memory stacks that sits next to the chip in the same package.

### Inside one Streaming Multiprocessor (SM)

If we zoom into one Streaming Multiprocessor (SM), it’s split into 4 quadrants (sub-partitions). Each SM contains an L0 instruction cache, warp schedulers, register files, FP32/INT32/FP64 cores (CUDA cores), Tensor Cores, and a shared L1 cache.


![[images/H100-Streaming-Multiprocessor-SM.png]]

### CUDA cores: FLOPs per cycle

Each SM here has 128 FP32 blocks, which NVIDIA calls as CUDA cores. These are more like arithmetic units that do floating point operations. Where each FP32 core can do operations like `a * x + b` .This is also called as fused multiply-add (FMA). And this operation counts as 2 [[FLOPs vs FLOPS|FLOPs]].

```text
128 cores × 2 FLOPs = 256 FLOPs per cycle per SM
132 SMs × 256 FLOPs per cycle per SM = 33,792 FLOPs per cycle for the whole GPU.
 
If i Multiply  this by the clock speed considering it to be ~1.98 GHz we get about 67 TFLOPS. 
```

### Tensor Cores: FLOPs per cycle

Each SM also has 4 Tensor Cores and these Tensor Cores multiply matrices like AX + B
Consider an example 

```text
A[16×4] × X[4×8] + B[16×8] → D[16×8] 

The result has 16 × 8 = 128 values. Each value needs 4 multiplications and 4 additions (a row of A times a column of X, plus B), so the total is:

Per Tensor Core: 2xMxNxK = 2 x 16 × 8 × 4  = 1,024 FLOPs per cycle
Per SM: 4 Tensor Cores × 1,024 = 4,096 FLOPs per cycle
Whole GPU: 4,096 × 132 SMs × ~1.83 GHz ≈ 989 TFLOPS FP16
```

In other words, one Tensor Core does the work of 512 CUDA-core FMAs at once.

To calculate for each SM the Tensor Cores are `4,096 ÷ 256 = 16 times` more FLOPs per cycle than the CUDA cores. Since neural networks are mostly matrix multiplications, this is what makes GPUs so fast for AI:

### The memory hierarchy

Here comes the memory hierarchy table : 

| Memory                   | Type | Location                 | Size                    | Shared by                                                                                      |
| ------------------------ | ---- | ------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------- |
| Registers                | SRAM | Inside each SM           | 256 KB per SM           | **Not shared.** Each thread gets its own private registers.                                    |
| L1 cache / shared memory | SRAM | Inside each SM           | 256 KB per SM           | **Shared within one SM.** All threads in the same thread block can share data through it.      |
| L2 cache                 | SRAM | Middle of the chip       | 50 MB                   | **Shared by all 132 SMs** on the chip.                                                         |
| HBM3                     | DRAM | Off-chip, on the package | 80 GB, 3 TB/s bandwidth | **Shared by all SMs**, and also reachable by the CPU (over PCIe) and other GPUs (over NVLink). |

This memory hierarchy table later helps understand what compute bound is and what memory bound is, and why it matters. For example, [[Prefill]] is compute bound, while [[Decode]] is memory-bandwidth bound.

References  -> 
- https://www.youtube.com/watch?v=9MvD-XsowsE&t=1045s
- https://developer.nvidia.com/blog/nvidia-hopper-architecture-in-depth/