---
layout: archive
title: "Works"
permalink: /works/
excerpt: "Research papers, systems, and software projects by Anwar Hossain Zahid."
---

<section class="page-intro">
  <p class="eyebrow">{% t "works.eyebrow" %}Works{% endt %}</p>
  <h1>{% t "works.title" %}Research papers, systems, and applied software projects.{% endt %}</h1>
  <p>
    {% t "works.intro" %}A focused view of my work across AI reliability, numerical debugging, LLM evaluation,
    GPU numerics, and production software engineering.{% endt %}
  </p>
</section>

<section class="section">
  <div class="section-heading">
    <h2>{% t "works.pubs" %}Publications{% endt %}</h2>
    <p>{% t "works.pubsIntro" %}Peer-reviewed and preprint work spanning reliable ML, model evaluation, and numerical correctness.{% endt %}</p>
  </div>
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
        </div>
      </article>
    {% endfor %}
  </div>
</section>

<section class="section">
  <div class="section-heading">
    <h2>{% t "works.projects" %}Projects{% endt %}</h2>
    <p>{% t "works.projectsIntro" %}Systems and applied projects from research, national lab work, industry, and advanced coursework.{% endt %}</p>
  </div>
  <div class="project-grid">
    {% assign featured = site.portfolio | where: "tier", "featured" | sort: "path" %}
    {% for item in featured %}
      {% if item.title %}
        <article class="project-card">
          {% include work-cover.html work=item %}
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
            {% if item.demo and item.demo != "" %}<a href="{{ item.demo }}" rel="noopener">{% t "project.demo" %}Demo{% endt %}</a>{% endif %}
          </div>
        </article>
      {% endif %}
    {% endfor %}
  </div>

  <details class="other-repos">
    <summary>{% t "project.others" %}Other repositories{% endt %}</summary>
    <ul lang="en" dir="ltr">
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
