---
layout: single
title: "Automatically Detecting Numerical Instability in ML via Soft Assertions"
categories: blog
comments: true
---

Machine learning (ML) models run on massive datasets and often perform billions of floating-point calculations.  
But here’s the problem: small numerical errors can snowball into **completely wrong predictions** — and sometimes, you won’t even see a NaN or an error message.  
This is **numerical instability**, and it’s sneaky.

In our **FSE 2025** paper, we introduce **Soft Assertions** — a new approach to detect and trigger these hidden bugs automatically.

---

## 🔍 Why Numerical Instability Matters

Numerical bugs in ML can:
- **Crash your application** (NaN / INF errors)
- **Quietly corrupt predictions** without warning
- Waste hours of compute on doomed training runs

**Example:**  
In one case study, a brain tumor detection model trained on MRI scans **predicted “no tumor”** when a tumor was clearly present — all because of an unstable function deep inside a neural network layer.

---

## 💡 What Are Soft Assertions?

Think of **soft assertions** as **learned runtime guards** for ML code.  
Instead of writing a rigid `assert` statement, we **train a small ML model** to recognize “dangerous” input values for certain functions — like `cosine_similarity`, `exp`, or `matmul`.

When the program runs:
1. The soft assertion checks the inputs at a *numerically unstable function*.
2. If instability is likely, it tells the fuzzer *how to mutate the inputs* to trigger the bug.

This is different from:
- Static analysis (can’t always handle high-dimensional tensors)
- Hard-coded assertions (hard to write for complex math)
- Random fuzzing (slow to find the right edge cases)

---

## 🛠️ How It Works

1. **Build a database** of unstable ML functions (we found 61 in PyTorch & TensorFlow).
2. **Design oracles** to decide if a function’s output is wrong (NaN/INF, out of range, wrong value, etc.).
3. **Generate training data** by running unit tests on these functions.
4. **Train a classifier** (we used Random Forest) to predict:
    - `increase` → increasing the value will cause instability
    - `decrease` → decreasing will cause instability
    - `no change` → this input already causes instability
5. **Guide fuzzing** using these predictions to reach instability faster.

---

## 📊 Key Results

We tested our Soft Assertion Fuzzer on:
- **79 benchmark ML programs** with known bugs (GRIST dataset)
- **15 real-world GitHub projects**

**Findings:**
- Detected **all 79 benchmark bugs**
- Found **13 previously unknown bugs** in real-world code
- Worked **faster** than 5 state-of-the-art fuzzers

---

## 🧠 Case Study: Tumor Detection Model

- Model: **TumorScope** (brain MRI classification)
- Problem: Vanishing gradient caused by **GlorotUniform** weight initialization in `Conv2D`
- Effect: Important features erased → wrong “no tumor” prediction
- Fix: Switched to stable `he_normal` initialization → correct “tumor” prediction

> *Before fix:*  
> Confidence in “no tumor” = 0.4990  
> *After fix:*  
> Confidence in “tumor” = 0.8874

<p align="center">
  <img src="/images/tumor_before_after.png" alt="Brain MRI before and after fix" width="600">
  <br>
  <em>Figure: Left — before fix, model incorrectly predicted “no tumor”; Right — after fix, correct “tumor” prediction.</em>
</p>


---

## 🚀 Why This Matters

Soft Assertions bridge a gap between:
- **Formal verification** (too rigid for real ML workloads)
- **Pure fuzzing** (too slow for targeted bugs)

They let developers:
- Detect **silent ML failures**
- Get **actionable guidance** on triggering bugs
- Extend the system to **new unstable functions**

---

📄 **Read the full paper:**  
[Automatically Detecting Numerical Instability in ML via Soft Assertions (FSE 2025)](https://arxiv.org/pdf/2504.15507)  
💻 **Source code:**  
[Soft Assertion Fuzzer on GitHub](https://github.com/ISU-PAAL/soft-assertion-fuzzer)
