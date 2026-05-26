---
layout: archive
title: "Publications"
permalink: /publications/
excerpt: "Publications by Anwar Hossain Zahid."
author_profile: true
---

<section class="page-intro">
  <p class="eyebrow">Publications</p>
  <h1>Research on reliable ML, numerical debugging, and AI evaluation.</h1>
  <p>
    Peer-reviewed and preprint work spanning machine learning reliability, GPU numerical
    correctness, LLM evaluation, and software engineering education.
  </p>
</section>

<section class="content-band">
  <div class="publication-list">
    {% assign publications = site.publications | sort: "date" | reverse %}
    {% for post in publications %}
      <article>
        <span class="post-date">{{ post.venue }}{% if post.date %} - {{ post.date | date: "%Y" }}{% endif %}</span>
        <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
        {% if post.authors %}<p>{{ post.authors }}</p>{% endif %}
        {% if post.excerpt %}<p>{{ post.excerpt }}</p>{% endif %}
        {% if post.paperurl %}<a href="{{ post.paperurl }}">Paper</a>{% endif %}
      </article>
    {% endfor %}
  </div>
</section>
