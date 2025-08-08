---
layout: single
title: "Testing GPU Numerics: Finding Numerical Differences Between NVIDIA and AMD GPUs"
categories: blog
comments: true
---

When you run the **same GPU program** on an NVIDIA GPU and an AMD GPU, you might expect *identical results*.  
Surprisingly, that’s not always the case — even small floating-point differences can lead to divergent outcomes in high-performance computing (HPC) and machine learning workloads.

Our **SC24-W workshop paper** presents a **systematic method** to detect and analyze these cross-vendor numerical differences.

---

## 🔍 Why This Problem Exists

Numerical results can differ between GPUs because of:
- **Floating-point precision differences** in hardware units
- **Vendor-specific math library implementations** (cuBLAS vs rocBLAS, cuDNN vs MIOpen)
- **Compiler optimizations** that change operation order or use fused multiply-add (FMA)
- **Handling of special values** like denormals, NaNs, and infinities

In HPC, where **bitwise reproducibility** can be crucial for scientific validation, these differences matter.

---

## 🎯 Our Research Goals

1. **Detect**: Identify workloads where NVIDIA and AMD GPUs produce different outputs.
2. **Quantify**: Measure the severity of differences using **ULP (Units in the Last Place)**.
3. **Explain**: Trace differences back to likely causes.
4. **Guide**: Offer strategies for developers to control or mitigate discrepancies.

---

## 🛠️ Our Testing Framework

We developed a **vendor-agnostic GPU numeric testing tool** that:

1. **Selects Kernels**
    - Linear algebra (GEMM, LU decomposition)
    - Signal processing (FFT)
    - Element-wise operations (exp, log, sin, cos)
    - Reduction operations (sum, dot product)

2. **Runs on Both Platforms**
    - NVIDIA A100 with CUDA toolkit
    - AMD MI250X with ROCm stack

3. **Compares Outputs**
    - Element-wise comparison
    - ULP measurement for floating-point differences
    - Relative error checks against tolerance thresholds

4. **Classifies Differences**
    - Hardware-specific rounding
    - Math library implementation differences
    - Precision truncation or extension
    - Algorithm choice (e.g., blocked vs unblocked GEMM)

---

## 📊 Key Findings

- Most kernels show differences within **1–2 ULP**, which is generally acceptable.
- Certain functions, especially **transcendental math** (`exp`, `log`, `tanh`), had larger deviations.
- Differences in **reduction operations** were traced to accumulation order and parallelization strategy.
- Tensor Core usage on NVIDIA vs MFMA units on AMD produced measurable variation in matrix multiplications.

---

## 🧠 Example: Exponential Function (`exp`)

For large positive inputs, NVIDIA’s implementation used a fused polynomial approximation, while AMD’s used a different approximation table.  
Result: up to **3 ULP** difference for extreme values.

---

## 🚀 Recommendations for Developers

- **Test across vendors** before deploying multi-platform HPC applications.
- Use **reproducibility flags** where possible (e.g., `--fmad=false` in CUDA).
- Avoid relying on exact bitwise results unless absolutely necessary.
- For critical workloads, choose algorithms with **numerical stability guarantees**.

---

## 📌 Conclusion

Our work shows that **GPU vendor choice can subtly impact numerical results**.  
By understanding and measuring these differences, developers can make informed decisions about portability, reproducibility, and reliability in HPC and ML applications.

---

📄 **Read the full paper:**  
[Testing GPU Numerics: Finding Numerical Differences Between NVIDIA and AMD GPUs (SC24-W)](https://arxiv.org/pdf/2410.09172)

💻 **Source code (if available):**  
[GitHub Repository](https://github.com/ISU-PAAL/soft-assertion-fuzzer) *(update if separate repo is used)*
