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

<section class="section">
  <div class="section-heading">
    <h2>Publications</h2>
    <p>Peer-reviewed and preprint work spanning reliable ML, model evaluation, and numerical correctness.</p>
  </div>
  <div class="publication-list">
    {% assign publications = site.publications | sort: "date" | reverse %}
    {% for paper in publications %}
      <article class="publication-card">
        <span class="badge">{{ paper.venue }}</span>
        <h3>{{ paper.title }}</h3>
        {% if paper.authors %}
          <p class="publication-authors">{{ paper.authors | replace: "Anwar Hossain Zahid", "<strong>Anwar Hossain Zahid</strong>" }}</p>
        {% endif %}
        {% if paper.excerpt %}<p>{{ paper.excerpt }}</p>{% endif %}
        <div class="publication-links">
          {% if paper.paperurl %}<a href="{{ paper.paperurl }}" rel="noopener">Paper</a>{% endif %}
          {% if paper.code %}<a href="{{ paper.code }}" rel="noopener">Code</a>{% endif %}
        </div>
      </article>
    {% endfor %}
  </div>
</section>

<section class="section">
  <div class="section-heading">
    <h2>Projects</h2>
    <p>Systems and applied projects from research, national lab work, industry, and advanced coursework.</p>
  </div>
  <div class="project-grid">
    {% assign featured = site.portfolio | where: "tier", "featured" | sort: "path" %}
    {% for item in featured %}
      {% if item.title %}
        <article class="project-card">
          <h3>{{ item.title }}</h3>
          <p>{{ item.excerpt }}</p>
          {% if item.tech %}
            <ul class="chip-list">
              {% assign chips = item.tech | split: ", " %}
              {% for chip in chips %}<li class="chip">{{ chip }}</li>{% endfor %}
            </ul>
          {% endif %}
          <div class="project-links">
            {% if item.github and item.github != "" %}<a href="{{ item.github }}" rel="noopener">GitHub</a>{% endif %}
            {% if item.demo and item.demo != "" %}<a href="{{ item.demo }}" rel="noopener">Demo</a>{% endif %}
          </div>
        </article>
      {% endif %}
    {% endfor %}
  </div>

  <details class="other-repos">
    <summary>Other repositories</summary>
    <ul>
      {% assign others = site.portfolio | where: "tier", "other" | sort: "path" %}
      {% for item in others %}
        {% if item.title %}
          <li>
            {% if item.github and item.github != "" %}<a href="{{ item.github }}" rel="noopener">{{ item.title }}</a>{% else %}{{ item.title }}{% endif %}
            &mdash; {{ item.excerpt }}
          </li>
        {% endif %}
      {% endfor %}
    </ul>
  </details>
</section>
