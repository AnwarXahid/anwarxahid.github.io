---
layout: archive
title: "Research Notes"
permalink: /blog/
excerpt: "Research notes on ML reliability, numerical debugging, GPU portability, and AI evaluation."
---

<section class="page-intro">
  <p class="eyebrow">Notes</p>
  <h1>Research notes, engineering lessons, and ideas in progress.</h1>
  <p>
    Short technical writing on ML reliability, numerical debugging, GPU portability,
    software engineering, and the practical decisions behind research systems.
  </p>
</section>

<section class="content-band">
  <div class="blog-cards">
  {% for post in site.posts %}
    <a class="blog-card" href="{{ post.url | relative_url }}">
      <span class="post-date">{{ post.date | date: "%B %-d, %Y" }}</span>
      <h2>{{ post.title }}</h2>
      <p>{{ post.excerpt | strip_html | truncate: 180 }}</p>
      <span class="read-more">Read note</span>
    </a>
  {% endfor %}
  </div>
</section>
