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
    {% assign publications = site.publications | sort: "date" | reverse %}
    {% for paper in publications %}
      <article class="publication-card">
        <span class="publication-meta">{{ paper.venue }}{% if paper.date %} - {{ paper.date | date: "%Y" }}{% endif %}</span>
        <h3>{{ paper.title }}</h3>
        {% if paper.authors %}<p>{{ paper.authors }}</p>{% endif %}
        {% if paper.excerpt %}<p>{{ paper.excerpt }}</p>{% endif %}
        <div class="card-actions">
          {% if paper.paperurl %}<a class="btn" href="{{ paper.paperurl }}">Paper</a>{% endif %}
          {% if paper.code %}<a class="btn" href="{{ paper.code }}">Code</a>{% endif %}
        </div>
      </article>
    {% endfor %}
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
