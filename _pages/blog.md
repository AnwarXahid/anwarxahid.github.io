---
layout: archive
title: "Blog"
permalink: /blog/
author_profile: true
---

Welcome to the blog archive.

<div class="blog-cards">
{% for post in site.posts %}
  <a class="blog-card" href="{{ post.url | relative_url }}">
    <div class="blog-card-content">
      <h2>{{ post.title }}</h2>
      <p>{{ post.excerpt | strip_html | truncate: 160 }}</p>
    </div>
  </a>
{% endfor %}
</div>
