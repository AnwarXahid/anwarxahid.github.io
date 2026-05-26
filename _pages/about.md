---
layout: lab
permalink: /
title: ""
excerpt: "Graduate student working on AI, software engineering, and LLM reliability."
body_class: home
redirect_from:
  - /about/
  - /about.html
---

<section class="intro" id="home" aria-labelledby="intro-title">
  <p class="kicker">Anwar Zahid</p>
  <h1 id="intro-title">Ph.D. student working on reliable machine learning and software systems.</h1>
  <p class="intro-summary">
    I study how AI and numerical software fail in practice, then build testing and debugging tools
    that make those failures easier to detect, reproduce, and fix.
  </p>
  <nav class="intro-links" aria-label="Profile links">
    <a href="https://github.com/AnwarXahid">GitHub</a>
    <a href="https://scholar.google.com/citations?user=_ze57HEAAAAJ&hl=en">Google Scholar</a>
    <a href="https://www.linkedin.com/in/anwar-hossain-zahid-a46195108/">LinkedIn</a>
    <a href="mailto:ahzahid@iastate.edu">Email</a>
  </nav>
</section>

<section class="section" id="about" aria-labelledby="about-title">
  <h2 id="about-title">About</h2>
  <p>
    I am a Ph.D. student in Computer Science at Iowa State University, advised by
    <a href="https://weile.work/">Prof. Wei Le</a> in the Program Analysis and AI Lab. My research
    focuses on reliable AI systems, numerical debugging, and software engineering techniques for
    machine learning systems.
  </p>
  <p>
    Before starting my Ph.D., I worked as a software engineer on government, banking, AI, and mobile
    platforms. That industry background shapes how I approach research: I care about methods that
    can become practical tools for developers and researchers.
  </p>
</section>

<section class="section" id="research" aria-labelledby="research-title">
  <h2 id="research-title">Research Interests</h2>
  <ul class="interest-list">
    <li>LLM hallucination</li>
    <li>AI reliability</li>
    <li>Software engineering for AI systems</li>
    <li>Interpretable / white-box analysis</li>
    <li>Human-centered AI tools</li>
  </ul>
</section>

<section class="section" id="projects" aria-labelledby="projects-title">
  <div class="section-heading">
    <h2 id="projects-title">Projects</h2>
    <p>Selected projects from existing repository entries.</p>
  </div>

  <div class="project-grid">
    {% assign projects = site.portfolio | sort: "path" %}
    {% for project in projects %}
      {% if project.title %}
        <article class="project-card">
          <h3>{{ project.title }}</h3>
          {% if project.excerpt %}
            <p>{{ project.excerpt }}</p>
          {% endif %}
          <div class="project-links">
            {% if project.github and project.github != "" %}
              <a href="{{ project.github }}">GitHub</a>
            {% endif %}
            {% if project.demo and project.demo != "" %}
              <a href="{{ project.demo }}">Demo</a>
            {% endif %}
          </div>
        </article>
      {% endif %}
    {% endfor %}
  </div>
</section>

<section class="section" id="publications" aria-labelledby="publications-title">
  <div class="section-heading">
    <h2 id="publications-title">Publications</h2>
    <p>Peer-reviewed and preprint work on ML reliability, LLM evaluation, and numerical correctness.</p>
  </div>

  <div class="publication-list">
    {% assign publications = site.publications | sort: "date" | reverse %}
    {% for paper in publications %}
      <article class="publication-card">
        <span class="publication-meta">{{ paper.venue }}{% if paper.date %} - {{ paper.date | date: "%Y" }}{% endif %}</span>
        <h3>{{ paper.title }}</h3>
        {% if paper.authors %}
          <p class="publication-authors">{{ paper.authors }}</p>
        {% endif %}
        {% if paper.excerpt %}
          <p>{{ paper.excerpt }}</p>
        {% endif %}
        <div class="publication-links">
          {% if paper.paperurl %}<a href="{{ paper.paperurl }}">Paper</a>{% endif %}
          {% if paper.code %}<a href="{{ paper.code }}">Code</a>{% endif %}
        </div>
      </article>
    {% endfor %}
  </div>
</section>

<section class="section" id="writing" aria-labelledby="writing-title">
  <div class="section-heading">
    <h2 id="writing-title">Writing</h2>
    <p>Short research notes and engineering write-ups.</p>
  </div>

  <div class="post-list">
    {% for post in site.posts limit:3 %}
      <article class="post-card">
        <span>{{ post.date | date: "%B %-d, %Y" }}</span>
        <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
        <p>{{ post.excerpt | strip_html | truncate: 170 }}</p>
      </article>
    {% endfor %}
  </div>
</section>

<section class="section contact" id="contact" aria-labelledby="contact-title">
  <h2 id="contact-title">Contact</h2>
  <p>
    The easiest way to reach me is by email. You can also find my code and academic profiles through
    the links below.
  </p>
  <nav class="contact-links" aria-label="Contact links">
    <a href="mailto:ahzahid@iastate.edu">ahzahid@iastate.edu</a>
    <a href="https://github.com/AnwarXahid">GitHub</a>
    <a href="https://scholar.google.com/citations?user=_ze57HEAAAAJ&hl=en">Google Scholar</a>
    <a href="https://www.linkedin.com/in/anwar-hossain-zahid-a46195108/">LinkedIn</a>
  </nav>
</section>
