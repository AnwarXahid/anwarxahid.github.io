---
layout: archive
title: "Publications"
permalink: /publications/
excerpt: "Publications by Anwar Hossain Zahid."
---

<section class="page-intro">
  <p class="eyebrow">Publications</p>
  <h1>Research on reliable ML, numerical debugging, and AI evaluation.</h1>
  <p>
    Peer-reviewed and preprint work spanning machine learning reliability, GPU numerical
    correctness, LLM evaluation, and software engineering education.
  </p>
</section>

<section class="section">
  <div class="publication-list">
    {% assign publications = site.publications | sort: "date" | reverse %}
    {% for paper in publications %}
      <article class="publication-card">
        <span class="badge">{{ paper.venue }}</span>
        <h3><a href="{{ paper.url | relative_url }}">{{ paper.title }}</a></h3>
        {% if paper.authors %}
          <p class="publication-authors">{{ paper.authors | replace: "Anwar Hossain Zahid", "<strong>Anwar Hossain Zahid</strong>" }}</p>
        {% endif %}
        {% if paper.excerpt %}<p>{{ paper.excerpt }}</p>{% endif %}
        <div class="publication-links">
          {% if paper.paperurl %}<a href="{{ paper.paperurl }}" rel="noopener">Paper</a>{% endif %}
          {% if paper.code %}<a href="{{ paper.code }}" rel="noopener">Code</a>{% endif %}
          <a href="{{ paper.url | relative_url }}">Details &amp; BibTeX</a>
        </div>
      </article>
    {% endfor %}
  </div>
</section>
