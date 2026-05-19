---
layout: lab
permalink: /
title: ""
excerpt: "PhD candidate at Iowa State University researching ML reliability, LLM evaluation, numerical stability, and software engineering for trustworthy AI."
body_class: home
redirect_from:
  - /about/
  - /about.html
---

<section class="hero" id="home">
  <div class="hero-shell">
    <div class="hero-copy-block">
      <p class="eyebrow">PhD Candidate · Iowa State University · AI Reliability Lab</p>
      <h1><span class="gradient-text">Researching Reliable AI Systems</span> Through Software Engineering, Evaluation, and Model Behavior Analysis.</h1>
      <p class="hero-copy">
        I am Anwar Hossain Zahid, a computer science PhD candidate advised by
        <a href="https://weile.work/">Prof. Wei Le</a>. My work builds debugging and evaluation
        infrastructure for machine learning systems whose behavior shifts across model versions,
        compilers, GPU platforms, and real-world deployment conditions.
      </p>
      <div class="hero-actions">
        <a class="btn btn--primary" href="#research">View Research</a>
        <a class="btn" href="#projects">Explore Projects</a>
        <a class="btn" href="#contact">Contact</a>
      </div>
    </div>

    <div class="portrait-stage" data-depth>
      <div class="portrait-frame">
        <img src="{{ '/images/profile.jpg' | relative_url }}" alt="Portrait of Anwar Hossain Zahid">
        <div class="portrait-overlay"></div>
        <div class="status-chip">
          <strong>ML Model Debugging · AI Reliability · Software Engineering</strong>
          <span>Building tools for hallucination detection, numerical instability, cross-GPU analysis, and trustworthy AI evaluation.</span>
        </div>
      </div>
      <div class="signal-stack" aria-hidden="true">
        <div class="signal"><b>FSE</b>2025</div>
        <div class="signal"><b>LLNL</b>GPU Numerics</div>
        <div class="signal"><b>ISU</b>PhD Research</div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="about">
  <div class="section-heading">
    <div>
      <p class="eyebrow">About</p>
      <h2>Research engineering for AI systems that must be trusted.</h2>
    </div>
    <p>
      My work connects program analysis, machine learning, numerical computing, and production
      software engineering. Before graduate school, I spent four years building systems for
      government, banking, AI, and mobile platforms.
    </p>
  </div>
  <div class="about-grid">
    <article class="glass-card bio-card">
      <p>
        I study how AI systems fail, drift, hallucinate, and become numerically unstable. My
        research focuses on building practical tools that expose these failures early: differential
        model debugging, soft assertions for unstable ML code, cross-vendor GPU numerical testing,
        and evaluation workflows for LLM behavior.
      </p>
      <p>
        At Iowa State University, I work in the Program Analysis and AI Lab. At Lawrence Livermore
        National Laboratory, I worked on floating-point precision analysis across NVIDIA and AMD GPU
        platforms for high-performance scientific workloads.
      </p>
      <div class="skill-cloud">
        <span>Python</span><span>PyTorch</span><span>TensorFlow</span><span>C/C++</span><span>CUDA/HIP</span>
        <span>Program Analysis</span><span>ML Testing</span><span>LLM Evaluation</span><span>Docker</span>
      </div>
    </article>
    <div class="metric-grid">
      <article class="glass-card metric"><strong>6</strong><span>Core research tracks across AI reliability, debugging, evaluation, and HPC systems.</span></article>
      <article class="glass-card metric"><strong>4+</strong><span>Years of industry software engineering before PhD research.</span></article>
      <article class="glass-card metric"><strong>13</strong><span>Previously unknown real-world ML bugs found by Soft Assertion Fuzzer.</span></article>
      <article class="glass-card metric"><strong>GPU</strong><span>Cross-platform numerical analysis spanning NVIDIA and AMD systems.</span></article>
    </div>
  </div>
</section>

<section class="section" id="research">
  <div class="section-heading">
    <div>
      <p class="eyebrow">Research</p>
      <h2>Failure analysis for next-generation AI systems.</h2>
    </div>
    <p>
      I work on reliability problems that appear when models, compilers, hardware, datasets, and
      user contexts interact in ways ordinary tests miss.
    </p>
  </div>
  <div class="research-grid">
    <article class="glass-card research-card">
      <span class="index">01</span>
      <h3>Hallucination Detection</h3>
      <p>Evaluation workflows for identifying unsupported, inconsistent, or context-sensitive LLM outputs.</p>
      <div class="tag-row"><span>LLMs</span><span>Evaluation</span></div>
    </article>
    <article class="glass-card research-card">
      <span class="index">02</span>
      <h3>ML Debugging</h3>
      <p>Differential methods for comparing model versions, surfacing behavioral regressions, and localizing failure causes.</p>
      <div class="tag-row"><span>Model Versions</span><span>Testing</span></div>
    </article>
    <article class="glass-card research-card">
      <span class="index">03</span>
      <h3>Numerical Stability</h3>
      <p>Soft assertions and guided fuzzing to trigger silent floating-point failures in ML applications.</p>
      <div class="tag-row"><span>FSE 2025</span><span>Fuzzing</span></div>
    </article>
    <article class="glass-card research-card">
      <span class="index">04</span>
      <h3>AI Reliability</h3>
      <p>Practical reliability techniques for detecting hidden defects before AI systems reach users.</p>
      <div class="tag-row"><span>Trustworthy AI</span><span>SE4AI</span></div>
    </article>
    <article class="glass-card research-card">
      <span class="index">05</span>
      <h3>LLM Evaluation</h3>
      <p>Testing LLM behavior under geographical, social, and contextual variation in high-impact classification tasks.</p>
      <div class="tag-row"><span>Social Good</span><span>Benchmarks</span></div>
    </article>
    <article class="glass-card research-card">
      <span class="index">06</span>
      <h3>HPC Systems</h3>
      <p>Numerical reproducibility and portability analysis across heterogeneous GPU architectures and compiler stacks.</p>
      <div class="tag-row"><span>CUDA</span><span>ROCm</span><span>LLNL</span></div>
    </article>
  </div>
</section>

<section class="section" id="projects">
  <div class="section-heading">
    <div>
      <p class="eyebrow">Research Projects</p>
      <h2>Research prototypes for reproducible evidence.</h2>
    </div>
    <p>
      These systems support measurable behavior, controlled experiments, and research workflows for
      studying AI reliability in practice.
    </p>
  </div>
  <div class="project-showcase">
    <article class="project-card featured">
      <div>
        <span class="index">NUMERICAL ML TESTING</span>
        <h3>Soft Assertion Fuzzer</h3>
        <p>
          A guided fuzzing system for detecting numerical instability bugs in ML applications using
          learned runtime guards around unstable functions.
        </p>
        <div class="tag-row"><span>Python</span><span>PyTorch</span><span>TensorFlow</span><span>FSE 2025</span></div>
        <div class="card-actions">
          <a class="btn btn--primary" href="https://github.com/ISU-PAAL/soft-assertion-fuzzer">GitHub</a>
          <a class="btn" href="https://arxiv.org/pdf/2504.15507">Paper</a>
        </div>
      </div>
      <div class="visual-module" aria-hidden="true"></div>
    </article>
    <article class="project-card">
      <span class="index">AI RESEARCH MONITORING</span>
      <h3>Today’s AI</h3>
      <p>A compact AI news and research tracking concept for following fast-moving model, tooling, and policy changes.</p>
      <div class="tag-row"><span>AI Trends</span><span>Knowledge Systems</span></div>
    </article>
    <article class="project-card">
      <span class="index">LLM BEHAVIOR EVALUATION</span>
      <h3>LLM Evaluation Tools</h3>
      <p>Testing harnesses for social-good classification, geography-aware hate speech detection, and model behavior analysis.</p>
      <div class="tag-row"><span>HuggingFace</span><span>Transformers</span></div>
    </article>
  </div>
</section>

<section class="section" id="publications">
  <div class="section-heading">
    <div>
      <p class="eyebrow">Publications</p>
      <h2>Selected research output.</h2>
    </div>
    <p>
      Publications and preprints spanning numerical instability detection, LLM evaluation, GPU
      numerical testing, and software engineering education systems.
    </p>
  </div>
  <div class="publication-grid">
    <article class="publication-card">
      <span class="publication-meta">FSE 2025 · PACMSE</span>
      <h3>Automatically Detecting Numerical Instability in Machine Learning Applications via Soft Assertions</h3>
      <p>Introduces learned soft assertions for triggering and detecting hidden numerical bugs in ML applications.</p>
      <div class="card-actions"><a class="btn" href="https://arxiv.org/pdf/2504.15507">Read</a></div>
    </article>
    <article class="publication-card">
      <span class="publication-meta">arXiv:2502.19612</span>
      <h3>Evaluation of Hate Speech Detection Using Large Language Models and Geographical Contextualization</h3>
      <p>Studies how geography and context affect LLM-based hate speech detection in social-good settings.</p>
      <div class="card-actions"><a class="btn" href="https://arxiv.org/abs/2502.19612">Read</a></div>
    </article>
    <article class="publication-card">
      <span class="publication-meta">arXiv:2410.09172</span>
      <h3>Testing GPU Numerics: Finding Numerical Differences Between NVIDIA and AMD GPUs</h3>
      <p>Analyzes cross-vendor numerical differences in GPU computations and their implications for reproducibility.</p>
      <div class="card-actions"><a class="btn" href="https://arxiv.org/abs/2410.09172">Read</a></div>
    </article>
    <article class="publication-card">
      <span class="publication-meta">ICCIT 2020</span>
      <h3>A Conceptual Design of Virtual Internship System</h3>
      <p>Proposes a virtual internship platform for benchmarking software development skills across academic and industry settings.</p>
      <div class="card-actions"><a class="btn" href="https://ieeexplore.ieee.org/document/9392713">Read</a></div>
    </article>
  </div>
</section>

<section class="section" id="experience">
  <div class="section-heading">
    <div>
      <p class="eyebrow">Experience</p>
      <h2>Academic research grounded in real systems.</h2>
    </div>
    <p>
      My background spans PhD research, national laboratory systems work, and software engineering
      in government, banking, AI, and device platforms.
    </p>
  </div>
  <div class="timeline">
    <article class="timeline-item">
      <time>Spring 2023 - Present</time>
      <h3>PhD Candidate · Iowa State University</h3>
      <p>Researching ML debugging, AI reliability, numerical instability, and software engineering for AI systems with Prof. Wei Le.</p>
    </article>
    <article class="timeline-item">
      <time>May 2024 - Aug 2024</time>
      <h3>Computing Graduate Intern · Lawrence Livermore National Laboratory</h3>
      <p>Built tooling for cross-platform floating-point precision analysis across heterogeneous GPU architectures.</p>
    </article>
    <article class="timeline-item">
      <time>Nov 2020 - May 2022</time>
      <h3>Software Engineer · Reve Systems</h3>
      <p>Worked on ERP, procurement, accounting, and compliance systems for government operations.</p>
    </article>
    <article class="timeline-item">
      <time>Nov 2019 - Nov 2020</time>
      <h3>Software Engineer · ERA-InfoTech Ltd.</h3>
      <p>Built FinTech chatbot, face recognition, remittance integration, and RPA systems for banking workflows.</p>
    </article>
    <article class="timeline-item">
      <time>Dec 2018 - Oct 2019</time>
      <h3>Junior Software Developer · Walton Digi-Tech Industries Limited</h3>
      <p>Developed Android ROM and feature-phone operating system enhancements for consumer devices.</p>
    </article>
  </div>
</section>

<section class="section" id="contact">
  <div class="glass-card contact-panel">
    <div>
      <p class="eyebrow">Contact</p>
      <h2>Let’s build reliable AI systems.</h2>
      <p>
        I am interested in research collaboration, internships, and engineering conversations around
        ML reliability, LLM evaluation, numerical correctness, AI safety, and systems that connect
        research ideas with working software.
      </p>
      <div class="contact-actions">
        <a class="btn btn--primary" href="mailto:ahzahid@iastate.edu">Email</a>
        <a class="btn" href="{{ '/files/resume.pdf' | relative_url }}">CV / Resume</a>
      </div>
    </div>
    <div class="contact-links">
      <a href="https://github.com/AnwarXahid">GitHub</a>
      <a href="https://www.linkedin.com/in/anwar-hossain-zahid-a46195108/">LinkedIn</a>
      <a href="mailto:ahzahid@iastate.edu">Email</a>
      <a href="https://scholar.google.com/citations?user=_ze57HEAAAAJ&hl=en">Google Scholar</a>
    </div>
  </div>
</section>
