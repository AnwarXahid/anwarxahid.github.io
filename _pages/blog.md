---
layout: archive
title: "Blog"
permalink: /blog/
author_profile: true
---

<section class="page-intro">
  <p class="eyebrow">Blog</p>
  <h1>Research notes, engineering lessons, and ideas in progress.</h1>
  <p>
    I write about ML reliability, numerical debugging, GPU portability, software engineering,
    and the practical details that do not always fit inside a paper.
  </p>
</section>

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
