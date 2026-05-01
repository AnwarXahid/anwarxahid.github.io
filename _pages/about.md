---
permalink: /
title: ""
excerpt: "ML reliability, numerical debugging, and software engineering"
author_profile: true
redirect_from:
  - /about/
  - /about.html
---

<section class="home-hero">
  <p class="eyebrow">Ph.D. candidate in Computer Science · Iowa State University</p>
  <h1>I build tools that make machine learning systems easier to debug, test, and trust.</h1>
  <p class="hero-copy">
    I am Anwar Hossain Zahid, advised by <a href="https://weile.work/">Prof. Wei Le</a>.
    My work sits at the intersection of software engineering, machine learning reliability,
    and numerical analysis across model versions, compilers, and GPU platforms.
  </p>
  <div class="hero-actions">
    <a class="btn btn--primary" href="/works/">View work</a>
    <a class="btn btn--inverse" href="/blog/">Read blog</a>
    <a class="btn btn--inverse" href="mailto:ahzahid@iastate.edu">Contact</a>
  </div>
</section>

<section class="content-band">
  <div class="section-heading">
    <p class="eyebrow">Current Focus</p>
    <h2>Reliability for ML systems that change over time</h2>
  </div>
  <div class="focus-grid">
    <article>
      <h3>Differential ML Debugging</h3>
      <p>Finding behavioral regressions across model versions using differential testing, invariant learning, and targeted analysis.</p>
    </article>
    <article>
      <h3>Numerical Stability</h3>
      <p>Detecting silent failures caused by unstable floating-point behavior in ML applications and scientific workloads.</p>
    </article>
    <article>
      <h3>Cross-Platform GPU Testing</h3>
      <p>Comparing NVIDIA and AMD GPU computations to expose portability and reproducibility issues in high-performance code.</p>
    </article>
  </div>
</section>

<section class="content-band split-band">
  <div>
    <p class="eyebrow">Selected Work</p>
    <h2>Recent research and engineering</h2>
    <p>
      I have worked on Soft Assertions for ML numerical instability, GPU numerical testing at
      Lawrence Livermore National Laboratory, and LLM evaluation for social-good applications.
    </p>
    <a class="text-link" href="/works/">Explore publications and projects</a>
  </div>
  <div class="stat-grid">
    <div><strong>FSE 2025</strong><span>ML numerical instability detection</span></div>
    <div><strong>LLNL</strong><span>GPU numerics across heterogeneous architectures</span></div>
    <div><strong>4+ years</strong><span>Software engineering, R&D, integration systems</span></div>
    <div><strong>ML + SE</strong><span>Research grounded in production software experience</span></div>
  </div>
</section>

<section class="content-band">
  <div class="section-heading">
    <p class="eyebrow">Writing</p>
    <h2>Notes from research and practice</h2>
  </div>
  <div class="home-posts">
    {% for post in site.posts limit:3 %}
      <a class="blog-card compact" href="{{ post.url | relative_url }}">
        <span>{{ post.date | date: "%b %-d, %Y" }}</span>
        <h3>{{ post.title }}</h3>
        <p>{{ post.excerpt | strip_html | truncate: 130 }}</p>
      </a>
    {% endfor %}
  </div>
</section>

<section class="content-band contact-band">
  <div>
    <p class="eyebrow">Open To</p>
    <h2>Research collaboration, internships, and engineering conversations</h2>
    <p>
      I am especially interested in ML reliability, debugging infrastructure, numerical correctness,
      AI safety, and systems that connect research ideas with working software.
    </p>
  </div>
  <div class="contact-links">
    <a href="https://scholar.google.com/citations?user=_ze57HEAAAAJ&hl=en">Google Scholar</a>
    <a href="https://github.com/AnwarXahid">GitHub</a>
    <a href="https://www.linkedin.com/in/anwar-hossain-zahid-a46195108/">LinkedIn</a>
    <a href="mailto:ahzahid@iastate.edu">Email</a>
  </div>
</section>
