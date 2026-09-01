---
title: "Automatically Detecting Numerical Instability in Machine Learning Applications via Soft Assertions"
collection: publications
permalink: /publication/soft-assertions/
excerpt: "Introduces Soft Assertions, a method for detecting and triggering hidden numerical instability bugs in machine learning applications."
date: 2025-07-01
venue: "FSE 2025 / PACMSE"
authors: "Shaila Sharmin, Anwar Hossain Zahid, and collaborators"
paperurl: "https://arxiv.org/pdf/2504.15507"
code: "https://github.com/ISU-PAAL/soft-assertion-fuzzer"
citation: "Shaila Sharmin, Anwar Hossain Zahid, et al. Automatically Detecting Numerical Instability in Machine Learning Applications via Soft Assertions. FSE 2025 / PACMSE."
bibtex: |
  % TODO: verify full author list — "et al." is a placeholder.
  @article{sharmin2025softassertions,
    title   = {Automatically Detecting Numerical Instability in Machine Learning Applications via Soft Assertions},
    author  = {Sharmin, Shaila and Zahid, Anwar Hossain and others},
    journal = {Proceedings of the ACM on Software Engineering (PACMSE), issue FSE 2025},
    year    = {2025},
    url     = {https://arxiv.org/pdf/2504.15507}
  }
---

This paper presents Soft Assertions, a technique for detecting and triggering numerical instability bugs in machine learning applications. The approach learns runtime guards around numerically sensitive operations and uses those guards to guide fuzzing toward inputs that expose instability.

The work targets silent ML failures where numerical issues corrupt predictions without producing obvious crashes, NaNs, or infinities.
