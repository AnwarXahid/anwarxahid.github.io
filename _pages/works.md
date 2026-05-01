---
layout: archive
title: "Works"
classes: no-header
permalink: /works/
author_profile: true
---

<section class="page-intro">
  <p class="eyebrow">Work</p>
  <h1>Research, systems, and applied software projects.</h1>
  <p>
    My strongest work combines program analysis, machine learning, numerical computing,
    and production software experience.
  </p>
</section>

<section class="content-band">
  <div class="section-heading">
    <p class="eyebrow">Publications</p>
    <h2>Selected papers</h2>
  </div>
  <div class="publication-list">
    <article>
      <h3>Automatically Detecting Numerical Instability in Machine Learning Applications via Soft Assertions</h3>
      <p>Shaila Sharmin, Anwar Hossain Zahid, et al. · Proceedings of the ACM on Software Engineering, FSE 2025</p>
      <a href="https://dl.acm.org/journal/pacmse">Paper</a>
    </article>
    <article>
      <h3>Evaluation of Hate Speech Detection Using Large Language Models and Geographical Contextualization</h3>
      <p>Anwar Hossain Zahid, Monoshi Kumar Roy, et al. · arXiv:2502.19612</p>
      <a href="https://arxiv.org/abs/2502.19612">Preprint</a>
    </article>
    <article>
      <h3>Testing GPU Numerics: Finding Numerical Differences Between NVIDIA and AMD GPUs</h3>
      <p>Anwar Hossain Zahid, Ignacio Laguna, Wei Le · arXiv:2410.09172</p>
      <a href="https://arxiv.org/abs/2410.09172">Preprint</a>
    </article>
    <article>
      <h3>A Conceptual Design of Virtual Internship System</h3>
      <p>Raihan Mia, Anwar Hossain Zahid, et al. · ICCIT 2020</p>
      <a href="https://ieeexplore.ieee.org/document/9392713">Paper</a>
    </article>
  </div>
</section>

<section class="content-band">
  <div class="section-heading">
    <p class="eyebrow">Projects</p>
    <h2>Selected implementation work</h2>
  </div>
  <div class="portfolio-grid">
    {% for item in site.portfolio %}
      <article class="portfolio-card">
        <h3>{{ item.title }}</h3>
        <p>{{ item.excerpt }}</p>
        <p class="tech-list">{{ item.tech }}</p>
        <div class="card-actions">
          {% if item.github %}<a href="{{ item.github }}">GitHub</a>{% endif %}
          {% if item.demo %}<a href="{{ item.demo }}">Demo</a>{% endif %}
        </div>
      </article>
    {% endfor %}
  </div>
</section>
