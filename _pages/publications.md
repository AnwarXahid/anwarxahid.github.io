---
layout: archive
title: "Publications"
permalink: /publications/
excerpt: "Publications by Anwar Hossain Zahid."
---

<section class="page-intro">
  <p class="eyebrow">{% t "pubs.eyebrow" %}Publications{% endt %}</p>
  <h1>{% t "pubs.title" %}Research on reliable ML, numerical debugging, and AI evaluation.{% endt %}</h1>
  <p>
    {% t "pubs.intro" %}Peer-reviewed and preprint work spanning machine learning reliability, GPU numerical
    correctness, LLM evaluation, and software engineering education.{% endt %}
  </p>
</section>

<section class="section">
  <div class="publication-list">
    {% assign publications = site.publications | sort: "date" | reverse %}
    {% for paper in publications %}
      <article class="publication-card">
        {% include work-cover.html work=paper %}
        <span class="badge">{{ paper.venue }}</span>
        <h3 lang="en"><a href="{{ paper.url | lurl }}">{{ paper.title }}</a></h3>
        {% if paper.authors %}
          <p class="publication-authors" lang="en">{{ paper.authors | replace: "Anwar Hossain Zahid", "<strong>Anwar Hossain Zahid</strong>" }}</p>
        {% endif %}
        {% if paper.excerpt %}<p>{{ paper.excerpt }}</p>{% endif %}
        <div class="publication-links">
          {% if paper.paperurl %}<a href="{{ paper.paperurl }}" rel="noopener">{% t "pub.paper" %}Paper{% endt %}</a>{% endif %}
          {% if paper.code %}<a href="{{ paper.code }}" rel="noopener">{% t "pub.code" %}Code{% endt %}</a>{% endif %}
          <a href="{{ paper.url | lurl }}">{% t "pub.details" %}Details &amp; BibTeX{% endt %}</a>
        </div>
      </article>
    {% endfor %}
  </div>
</section>
