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

<section class="hero" id="home">
  <canvas id="field" aria-hidden="true"></canvas>
  <div class="hero-inner">
    <div>
      <p class="kicker">Ph.D. &middot; Iowa State University</p>
      <h1 id="intro-title">I study how <span class="em">AI and numerical software</span> break.</h1>
      <p class="intro-summary">
        I build testing and debugging tools that make machine-learning failures &mdash;
        numerical instability, hallucination, silent regressions &mdash; easier to detect,
        reproduce, and fix.
      </p>
      <nav class="intro-links" aria-label="Profile links">
        <a class="primary-link" href="#publications">Publications &rarr;</a>
        <a href="mailto:ahzahid@iastate.edu">Email</a>
        <a href="{{ '/files/resume.pdf' | relative_url }}">CV</a>
        <a href="https://github.com/AnwarXahid" rel="noopener">GitHub</a>
        <a href="https://scholar.google.com/citations?user=_ze57HEAAAAJ&hl=en" rel="noopener">Google Scholar</a>
      </nav>
    </div>
    <div class="finder">
      <span class="corner tl"></span><span class="corner tr"></span>
      <span class="corner bl"></span><span class="corner br"></span>
      <div class="frame">
        <span class="ph">Anwar Hossain Zahid</span>
        <img class="headshot"
             src="{{ '/assets/img/headshot.jpg' | relative_url }}"
             srcset="{{ '/assets/img/headshot.jpg' | relative_url }} 1x, {{ '/assets/img/headshot@2x.jpg' | relative_url }} 2x"
             alt="Portrait of Anwar Hossain Zahid"
             width="268" height="268"
             loading="eager" decoding="async">
      </div>
      <span class="readout">sig&nbsp;<span id="ro">0.420</span> &nbsp;&middot;&nbsp; drift&nbsp;<b id="ro2">+0.00</b></span>
    </div>
  </div>
</section>

<section class="section" id="news" aria-labelledby="news-title">
  <p class="section-label rv"><span class="mk">##</span> News &middot; recent log</p>
  <h2 id="news-title" class="rv">News</h2>
  <ul class="news-list rv">
    {% assign news_items = site.data.news | sort: "date" | reverse %}
    {% for item in news_items limit:6 %}
      <li>
        <time datetime="{{ item.date }}">{{ item.date | date: "%b %Y" }}</time>
        <span>{{ item.text }}{% if item.url %} <a href="{{ item.url }}" rel="noopener">link &rarr;</a>{% endif %}</span>
      </li>
    {% endfor %}
  </ul>
</section>

<section class="section" id="about" aria-labelledby="about-title">
  <p class="section-label rv"><span class="mk">##</span> About</p>
  <h2 id="about-title" class="rv">From shipping software to studying why it fails.</h2>
  <div class="rv">
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
  </div>
</section>

<section class="section" id="research" aria-labelledby="research-title">
  <p class="section-label rv"><span class="mk">##</span> Research interests</p>
  <h2 id="research-title" class="rv">Research Interests</h2>
  <ul class="interest-list rv">
    <li>LLM hallucination</li>
    <li>AI reliability</li>
    <li>Software engineering for AI systems</li>
    <li>Interpretable / white-box analysis</li>
    <li>Human-centered AI tools</li>
  </ul>
</section>

<section class="section" id="publications" aria-labelledby="publications-title">
  <div class="section-heading rv">
    <p class="section-label"><span class="mk">##</span> Publications</p>
    <h2 id="publications-title">Peer-reviewed &amp; preprint work</h2>
    <p>On ML reliability, LLM evaluation, and numerical correctness.</p>
  </div>

  <div class="publication-list">
    {% assign publications = site.publications | sort: "date" | reverse %}
    {% for paper in publications %}
      <article class="publication-card rv">
        {% if paper.image %}
          <img class="card-thumb" src="{{ paper.image | relative_url }}" alt="" loading="lazy">
        {% else %}
          <canvas class="card-thumb" data-seed="{{ forloop.index | times: 17 }}" data-mode="{{ forloop.index0 | modulo: 4 }}" aria-hidden="true"></canvas>
        {% endif %}
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
  <div class="section-heading rv">
    <p class="section-label"><span class="mk">##</span> Experience</p>
    <h2 id="experience-title">Four years in industry, then a national lab.</h2>
    <p>Software engineering across banking, e-governance, and mobile, plus a research internship at Lawrence Livermore.</p>
  </div>
  <ul class="timeline rv">
    {% for job in site.data.experience %}
      <li>
        <span class="timeline-dates">{{ job.dates }}</span>
        <div>
          <h3>{{ job.role }} &middot; {% if job.org_url %}<a href="{{ job.org_url }}" rel="noopener">{{ job.org }}</a>{% else %}{{ job.org }}{% endif %}</h3>
          <p>{{ job.note }}</p>
        </div>
      </li>
    {% endfor %}
  </ul>
</section>

<section class="section" id="projects" aria-labelledby="projects-title">
  <div class="section-heading rv">
    <p class="section-label"><span class="mk">##</span> Projects</p>
    <h2 id="projects-title">Selected systems &amp; applied work</h2>
    <p>Coursework and smaller repositories are collapsed below.</p>
  </div>

  <div class="project-grid">
    {% assign featured = site.portfolio | where: "tier", "featured" | sort: "path" %}
    {% for project in featured %}
      {% if project.title %}
        <article class="project-card rv">
          {% if project.image %}
            <img class="card-thumb" src="{{ project.image | relative_url }}" alt="" loading="lazy">
          {% else %}
            <canvas class="card-thumb" data-seed="{{ forloop.index | times: 23 | plus: 5 }}" data-mode="{{ forloop.index | modulo: 4 }}" aria-hidden="true"></canvas>
          {% endif %}
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
  <div class="section-heading rv">
    <p class="section-label"><span class="mk">##</span> Teaching</p>
    <h2 id="teaching-title">Running labs, writing rubrics, covering lectures.</h2>
    <p>
      Teaching assistant in the
      <a href="https://www.cs.iastate.edu/" rel="noopener">Department of Computer Science</a>
      at Iowa State University, across the introductory programming and artificial-intelligence courses.
    </p>
  </div>
  <ul class="timeline rv">
    <li>
      <span class="timeline-dates">Spring 2023 &ndash; present</span>
      <div>
        <h3>Teaching Assistant &middot; <a href="https://www.cs.iastate.edu/" rel="noopener">Iowa State University</a></h3>
        <p>
          Taught the lab and recitation sections for <strong>COM&nbsp;S&nbsp;127</strong> (introductory
          programming) &mdash; running weekly labs, developing course and assessment materials, designing
          grading rubrics, and grading assignments and exams.
        </p>
        <p>
          Delivered lectures for <strong>COM&nbsp;S&nbsp;472/572</strong> (Principles of Artificial
          Intelligence), covering for Prof. Jin Tian before he left the department and for
          Prof. Yan-Bin Jia.
        </p>
      </div>
    </li>
  </ul>
</section>

<section class="section" id="writing" aria-labelledby="writing-title">
  <div class="section-heading rv">
    <p class="section-label"><span class="mk">##</span> Writing</p>
    <h2 id="writing-title">Research notes &amp; engineering write-ups</h2>
  </div>

  <div class="post-list compact rv">
    {% for post in site.posts limit:3 %}
      <article class="post-card">
        <span>{{ post.date | date: "%b %-d, %Y" }}</span>
        <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
        <p>{{ post.excerpt | strip_html | truncate: 170 }}</p>
      </article>
    {% endfor %}
  </div>
  <a class="writing-more" href="{{ '/blog/' | relative_url }}">All posts &rarr;</a>
</section>

<section class="section contact" id="contact" aria-labelledby="contact-title">
  <p class="section-label rv"><span class="mk">##</span> Contact</p>
  <p class="rv">The fastest way to reach me is <a href="mailto:ahzahid@iastate.edu">email</a>.</p>
  <nav class="contact-links rv" aria-label="Contact links">
    <a class="primary-link" href="mailto:ahzahid@iastate.edu">Email</a>
    <a href="{{ '/files/resume.pdf' | relative_url }}">CV</a>
    <a href="https://github.com/AnwarXahid" rel="noopener">GitHub</a>
    <a href="https://scholar.google.com/citations?user=_ze57HEAAAAJ&hl=en" rel="noopener">Google Scholar</a>
    <a href="https://www.linkedin.com/in/anwar-hossain-zahid-a46195108/" rel="noopener">LinkedIn</a>
  </nav>
</section>
