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
  <h1 id="intro-title">Graduate student working on AI, software engineering, and LLM reliability.</h1>
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
    I am a graduate student in computer science at Iowa State University. My work is centered on
    reliable AI systems, with an emphasis on testing, debugging, and understanding how large
    language models and machine learning systems behave in practice.
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
  <h2 id="publications-title">Publications / Writing</h2>
  <p>Selected writing and publications will be added here.</p>
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
