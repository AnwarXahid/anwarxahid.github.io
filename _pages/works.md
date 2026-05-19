---
layout: archive
title: "Works"
permalink: /works/
excerpt: "Research papers, systems, and software projects by Anwar Hossain Zahid."
---

<section class="page-intro">
  <p class="eyebrow">Works</p>
  <h1>Research papers, systems, and applied software projects.</h1>
  <p>
    A focused view of my work across AI reliability, numerical debugging, LLM evaluation,
    GPU numerics, and production software engineering.
  </p>
</section>

<section class="content-band">
  <div class="section-heading">
    <div>
      <p class="eyebrow">Publications</p>
      <h2>Selected papers.</h2>
    </div>
    <p>Peer-reviewed and preprint work spanning reliable ML, model evaluation, and numerical correctness.</p>
  </div>
  <div class="publication-grid">
    <article class="publication-card">
      <span class="publication-meta">FSE 2025 · PACMSE</span>
      <h3>Automatically Detecting Numerical Instability in Machine Learning Applications via Soft Assertions</h3>
      <p>Shaila Sharmin, Anwar Hossain Zahid, et al. A method for finding hidden numerical instability bugs in ML applications.</p>
      <div class="card-actions"><a class="btn" href="https://arxiv.org/pdf/2504.15507">Paper</a></div>
    </article>
    <article class="publication-card">
      <span class="publication-meta">arXiv:2502.19612</span>
      <h3>Evaluation of Hate Speech Detection Using Large Language Models and Geographical Contextualization</h3>
      <p>Anwar Hossain Zahid, Monoshi Kumar Roy, et al. Evaluates context-sensitive LLM behavior for hate speech detection.</p>
      <div class="card-actions"><a class="btn" href="https://arxiv.org/abs/2502.19612">Preprint</a></div>
    </article>
    <article class="publication-card">
      <span class="publication-meta">arXiv:2410.09172</span>
      <h3>Testing GPU Numerics: Finding Numerical Differences Between NVIDIA and AMD GPUs</h3>
      <p>Anwar Hossain Zahid, Ignacio Laguna, Wei Le. Cross-platform GPU numerical analysis for heterogeneous systems.</p>
      <div class="card-actions"><a class="btn" href="https://arxiv.org/abs/2410.09172">Preprint</a></div>
    </article>
    <article class="publication-card">
      <span class="publication-meta">ICCIT 2020</span>
      <h3>A Conceptual Design of Virtual Internship System</h3>
      <p>Raihan Mia, Anwar Hossain Zahid, et al. A software engineering education and benchmarking platform concept.</p>
      <div class="card-actions"><a class="btn" href="https://ieeexplore.ieee.org/document/9392713">Paper</a></div>
    </article>
  </div>
</section>

<section class="content-band">
  <div class="section-heading">
    <div>
      <p class="eyebrow">Projects</p>
      <h2>Implementation work.</h2>
    </div>
    <p>Systems and applied projects from research, national lab work, industry, and advanced coursework.</p>
  </div>
  <div class="portfolio-grid">
    {% for item in site.portfolio %}
      {% if item.title %}
      <article class="portfolio-card">
        <span class="publication-meta">{{ item.tech }}</span>
        <h3>{{ item.title }}</h3>
        <p>{{ item.excerpt }}</p>
        <div class="card-actions">
          {% if item.github %}<a class="btn" href="{{ item.github }}">GitHub</a>{% endif %}
          {% if item.demo %}<a class="btn" href="{{ item.demo }}">Demo</a>{% endif %}
        </div>
      </article>
      {% endif %}
    {% endfor %}
  </div>
</section>
