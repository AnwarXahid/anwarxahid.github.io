---
layout: single
title: "What I Want This Blog to Become"
categories: blog
comments: true
---

I want this blog to be a working notebook for the problems I keep returning to:
machine learning reliability, numerical instability, debugging, and the engineering decisions that make research code usable.

Academic papers are necessarily compressed. They describe the method, the evaluation, and the result, but they often leave out the messy middle: why a test design changed, why one metric was misleading, why a small floating-point detail created a large behavioral difference, or what it takes to move a prototype toward a tool someone else can run.

That is the space I want to use here.

## Themes I expect to write about

- **ML model debugging:** how to compare model versions, detect regressions, and reason about behavioral changes.
- **Numerical reliability:** examples of silent failures, unstable functions, tolerance choices, and cross-platform differences.
- **GPU portability:** practical lessons from testing computations across NVIDIA and AMD systems.
- **Research engineering:** how to structure experiments, build reproducible pipelines, and keep tools maintainable.
- **LLMs and social-good evaluation:** what makes evaluation difficult when language, geography, and social context interact.

## The format

Some posts will be short research notes. Some will be paper walkthroughs. Some will be engineering write-ups with code, experiment design, and failure cases. I also want to write occasional reflections on Ph.D. work, internships, and the transition between industry software engineering and research.

The goal is not to make every post polished like a publication. The goal is to make the thinking useful.

## What readers should get

If you work on ML systems, testing, program analysis, or scientific computing, I hope the posts here help you recognize failure modes earlier and design better checks around them. If you are a student, I hope the posts make research feel more concrete by showing the decisions behind the finished paper.

That is the plan: fewer empty updates, more useful notes.
