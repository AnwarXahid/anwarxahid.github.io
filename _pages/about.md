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
  <!-- TODO: replace assets/img/headshot.jpg (and headshot@2x.jpg) with a real photo — this is a neutral placeholder. -->
  <img
    class="headshot"
    src="{{ '/assets/img/headshot.jpg' | relative_url }}"
    srcset="{{ '/assets/img/headshot.jpg' | relative_url }} 1x, {{ '/assets/img/headshot@2x.jpg' | relative_url }} 2x"
    alt="Portrait of Anwar Hossain Zahid"
    width="200" height="200"
    loading="eager" decoding="async">
  <p class="kicker">Anwar Hossain Zahid</p>
  <h1 id="intro-title">Ph.D. student studying how AI and numerical software fail.</h1>
  <p class="intro-summary">
    I build testing and debugging tools that make ML reliability failures — numerical instability,
    hallucination, silent regressions — easier to detect, reproduce, and fix.
  </p>
  <nav class="intro-links" aria-label="Profile links">
    <a class="primary-link" href="mailto:ahzahid@iastate.edu">Email</a>
    <a class="primary-link" href="{{ '/files/resume.pdf' | relative_url }}">CV</a>
    <a href="https://github.com/AnwarXahid" rel="noopener">GitHub</a>
    <a href="https://scholar.google.com/citations?user=_ze57HEAAAAJ&hl=en" rel="noopener">Google Scholar</a>
    <a href="https://www.linkedin.com/in/anwar-hossain-zahid-a46195108/" rel="noopener">LinkedIn</a>
  </nav>
</section>

<section class="section" id="news" aria-labelledby="news-title">
  <h2 id="news-title">News</h2>
  <ul class="news-list">
    {% assign news_items = site.data.news | sort: "date" | reverse %}
    {% for item in news_items limit:6 %}
      <li>
        <time datetime="{{ item.date }}">{{ item.date | date: "%b %Y" }}</time>
        {{ item.text }}{% if item.url %} <a href="{{ item.url }}" rel="noopener">link</a>{% endif %}
      </li>
    {% endfor %}
  </ul>
</section>

<section class="section" id="about" aria-labelledby="about-title">
  <h2 id="about-title">About</h2>
  <p>
    I am a Ph.D. student in Computer Science at Iowa State University, advised by
    <a href="https://weile.work/" rel="noopener">Prof. Wei Le</a> in the Program Analysis and AI Lab. My
    research focuses on reliable AI systems, numerical debugging, and software engineering techniques
    for machine learning systems.
  </p>
  <p>
    Before starting my Ph.D., I spent four years as a software engineer on banking, e-governance, AI,
    and mobile platforms. That industry background shapes how I approach research: I care about methods
    that can become practical tools for developers and researchers. A fuller timeline is on the
    <a href="{{ '/about-me/' | relative_url }}">extended about page</a>.
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

<section class="section" id="publications" aria-labelledby="publications-title">
  <div class="section-heading">
    <h2 id="publications-title">Publications</h2>
    <p>Peer-reviewed and preprint work on ML reliability, LLM evaluation, and numerical correctness.</p>
  </div>

  <div class="publication-list">
    {% assign publications = site.publications | sort: "date" | reverse %}
    {% for paper in publications %}
      <article class="publication-card">
        <span class="badge">{{ paper.venue }}</span>
        <h3>{{ paper.title }}</h3>
        {% if paper.authors %}
          <p class="publication-authors">{{ paper.authors | replace: "Anwar Hossain Zahid", "<strong>Anwar Hossain Zahid</strong>" }}</p>
        {% endif %}
        {% if paper.excerpt %}
          <p>{{ paper.excerpt }}</p>
        {% endif %}
        <div class="publication-links">
          {% if paper.paperurl %}<a href="{{ paper.paperurl }}" rel="noopener">Paper</a>{% endif %}
          {% if paper.code %}<a href="{{ paper.code }}" rel="noopener">Code</a>{% endif %}
        </div>
        {% if paper.bibtex %}
          <details class="bibtex">
            <summary>BibTeX</summary>
            <pre id="bibtex-{{ forloop.index }}">{{ paper.bibtex }}</pre>
            <button type="button" class="copy-btn" data-copy-target="bibtex-{{ forloop.index }}">Copy</button>
          </details>
        {% endif %}
      </article>
    {% endfor %}
  </div>
</section>

<section class="section" id="experience" aria-labelledby="experience-title">
  <div class="section-heading">
    <h2 id="experience-title">Experience</h2>
    <p>Four years in industry software engineering before the Ph.D., plus a national-lab research internship.</p>
  </div>
  <ul class="timeline">
    {% for job in site.data.experience %}
      <li>
        <span class="timeline-dates">{{ job.dates }}</span>
        <h3>{{ job.role }} &middot; {% if job.org_url %}<a href="{{ job.org_url }}" rel="noopener">{{ job.org }}</a>{% else %}{{ job.org }}{% endif %}</h3>
        <p>{{ job.note }}</p>
      </li>
    {% endfor %}
  </ul>
</section>

<section class="section" id="projects" aria-labelledby="projects-title">
  <div class="section-heading">
    <h2 id="projects-title">Projects</h2>
    <p>Selected systems and applied work; coursework and smaller repositories are collapsed below.</p>
  </div>

  <div class="project-grid">
    {% assign featured = site.portfolio | where: "tier", "featured" | sort: "path" %}
    {% for project in featured %}
      {% if project.title %}
        <article class="project-card">
          <h3>{{ project.title }}</h3>
          {% if project.excerpt %}
            <p>{{ project.excerpt }}</p>
          {% endif %}
          {% if project.tech %}
            <ul class="chip-list">
              {% assign chips = project.tech | split: ", " %}
              {% for chip in chips %}<li class="chip">{{ chip }}</li>{% endfor %}
            </ul>
          {% endif %}
          <div class="project-links">
            {% if project.github and project.github != "" %}
              <a href="{{ project.github }}" rel="noopener">GitHub</a>
            {% endif %}
            {% if project.demo and project.demo != "" %}
              <a href="{{ project.demo }}" rel="noopener">Demo</a>
            {% endif %}
          </div>
        </article>
      {% endif %}
    {% endfor %}
  </div>

  <details class="other-repos">
    <summary>Other repositories</summary>
    <ul>
      {% assign others = site.portfolio | where: "tier", "other" | sort: "path" %}
      {% for project in others %}
        {% if project.title %}
          <li>
            {% if project.github and project.github != "" %}
              <a href="{{ project.github }}" rel="noopener">{{ project.title }}</a>
            {% else %}
              {{ project.title }}
            {% endif %}
            &mdash; {{ project.excerpt }}
          </li>
        {% endif %}
      {% endfor %}
    </ul>
  </details>
</section>

<section class="section" id="teaching" aria-labelledby="teaching-title">
  <h2 id="teaching-title">Teaching</h2>
  <p>
    I am a teaching assistant for the AI course sequence in the
    <a href="https://www.cs.iastate.edu/" rel="noopener">Department of Computer Science</a> at Iowa State University.
  </p>
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
  <a class="writing-more" href="{{ '/blog/' | relative_url }}">All posts &rarr;</a>
</section>

<section class="section contact" id="contact" aria-labelledby="contact-title">
  <h2 id="contact-title">Contact</h2>
  <p>
    The easiest way to reach me is by email. You can also find my code and academic profiles through
    the links below.
  </p>
  <nav class="contact-links" aria-label="Contact links">
    <a class="primary-link" href="mailto:ahzahid@iastate.edu">Email</a>
    <a class="primary-link" href="{{ '/files/resume.pdf' | relative_url }}">CV</a>
    <a href="https://github.com/AnwarXahid" rel="noopener">GitHub</a>
    <a href="https://scholar.google.com/citations?user=_ze57HEAAAAJ&hl=en" rel="noopener">Google Scholar</a>
    <a href="https://www.linkedin.com/in/anwar-hossain-zahid-a46195108/" rel="noopener">LinkedIn</a>
    <!-- TODO: add ORCID profile link, e.g. https://orcid.org/XXXX-XXXX-XXXX-XXXX -->
    <!-- TODO: add DBLP profile link -->
    <!-- TODO: add Semantic Scholar profile link -->
  </nav>
</section>
