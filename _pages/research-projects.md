---
layout: archive
title: "Research & Projects"
classes: no-header
permalink: /research-projects/
author_profile: true
---
# <span style="color:#2E8B57;">Selected Publications</span>
1. **Automatically Detecting Numerical Instability in Machine Learning Applications via Soft Assertions**
   *Shaila Sharmin, Anwar Hossain Zahid, et al.*
   **Proceedings of the ACM on Software Engineering (FSE 2025)**
   [[Paper]](https://dl.acm.org/journal/pacmse)

2. **Evaluation of Hate Speech Detection Using Large Language Models and Geographical Contextualization**
   *Anwar Hossain Zahid, Monoshi Kumar Roy, et al.*
   arXiv:2502.19612
   [[Preprint]](https://arxiv.org/abs/2502.19612)

3. **Testing GPU Numerics: Finding Numerical Differences Between NVIDIA and AMD GPUs**
   *Anwar Hossain Zahid, Ignacio Laguna, Wei Le*
   arXiv:2410.09172
   [[Preprint]](https://arxiv.org/abs/2410.09172)

4. **A Conceptual Design of Virtual Internship System**
   *Raihan Mia, Anwar Hossain Zahid, et al.*
   ICCIT 2020
   [[Paper]](https://ieeexplore.ieee.org/document/9392713)

# <span style="color:#2E8B57;">Projects</span>
{% include base_path %}

<div class="portfolio-grid">
  {% for item in site.portfolio %}
    <div class="portfolio-card">
      <h3>{{ item.title }}</h3>
      <p>{{ item.excerpt }}</p>
      <p><strong>Tech:</strong> {{ item.tech }}</p>
      <p>
        <a href="{{ item.github }}">GitHub</a>{% if item.demo %} | <a href="{{ item.demo }}">Demo</a>{% endif %}
      </p>
    </div>
  {% endfor %}
</div>
