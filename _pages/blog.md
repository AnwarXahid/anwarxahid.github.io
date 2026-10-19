---
layout: archive
title: "Research Notes"
permalink: /blog/
excerpt: "Research notes on ML reliability, numerical debugging, GPU portability, and AI evaluation."
---

<section class="page-intro">
  <p class="eyebrow">{% t "blog.eyebrow" %}Notes{% endt %}</p>
  <h1>{% t "blog.title" %}Research notes, engineering lessons, and ideas in progress.{% endt %}</h1>
  <p>
    {% t "blog.intro" %}Short technical writing on ML reliability, numerical debugging, GPU portability,
    software engineering, and the practical decisions behind research systems.{% endt %}
  </p>
  {% if locale != 'en' %}<p>{% t "home.writing.englishNote" %}The articles themselves are written in English.{% endt %}</p>{% endif %}
</section>

<section class="section">
  <div class="blog-cards">
  {% for post in site.posts %}
    <a class="blog-card" href="{{ post.url | lurl }}">
      <span>{{ post.date | ldate: "long" }}</span>
      <h2 lang="en">{{ post.title }}</h2>
      <p lang="en">{{ post.excerpt | strip_html | truncate: 180 }}</p>
      <span class="read-more">{% t "blog.read" %}Read note &rarr;{% endt %}</span>
    </a>
  {% endfor %}
  </div>
</section>
