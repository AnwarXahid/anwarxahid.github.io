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
  <div class="hero-grain" aria-hidden="true"></div>
  <div class="hero-inner">
    <div class="hero-copy">
      <p class="kicker"><span class="status-light" aria-hidden="true"></span> {% t "home.kicker.role" %}Researcher &amp; engineer{% endt %} <span class="kicker-sep" aria-hidden="true">/</span> {% t "home.kicker.org" %}Iowa State University{% endt %}</p>
      <h1 id="intro-title">{% t "home.hero.title" %}Finding the <span class="em">fault lines</span> in intelligent systems.{% endt %}</h1>
      <p class="intro-summary">
        {% t "home.hero.summary" %}I’m Anwar Zahid. I study how AI and numerical software fail, then build tools
        to make those failures easier to detect, reproduce, and fix.{% endt %}
      </p>
      <nav class="intro-links" aria-label="{% t "home.hero.linksLabel" %}Profile links{% endt %}">
        <a class="primary-link" href="#publications">{% t "home.hero.explore" %}Explore my research{% endt %} <span aria-hidden="true">↗</span></a>
        <a href="mailto:ahzahid@iastate.edu">{% t "home.hero.contact" %}Get in touch{% endt %} <span aria-hidden="true">↗</span></a>
      </nav>
      <p class="hero-keywords">{% t "home.hero.kw1" %}AI reliability{% endt %} <span aria-hidden="true">/</span> {% t "home.hero.kw2" %}Numerical debugging{% endt %} <span aria-hidden="true">/</span> {% t "home.hero.kw3" %}Software engineering{% endt %}</p>
    </div>
    <div class="finder">
      <div class="frame">
        <span class="ph">Anwar Hossain Zahid</span>
        <img class="headshot"
             src="{{ '/assets/img/headshot.jpg' | relative_url }}"
             srcset="{{ '/assets/img/headshot.jpg' | relative_url }} 1x, {{ '/assets/img/headshot@2x.jpg' | relative_url }} 2x"
             alt="{% t "home.portraitAlt" %}Portrait of Anwar Hossain Zahid{% endt %}"
             width="268" height="268"
             loading="eager" decoding="async">
      </div>
      <span class="portrait-caption"><span class="caption-index">{% t "home.portraitIndex" %}01 / PROFILE{% endt %}</span> Anwar Hossain Zahid</span>
    </div>
  </div>
  <div class="hero-bottom">
    <span class="hero-note">{% t "home.hero.note" %}Exploring reliability beneath the surface{% endt %}</span>
    <button class="motion-toggle" type="button" aria-pressed="false" data-label-play="{% t "home.motion.play" %}Play motion{% endt %}" data-label-pause="{% t "home.motion.pause" %}Pause motion{% endt %}" hidden><span class="motion-symbol" aria-hidden="true">Ⅱ</span><span class="motion-label">{% t "home.motion.pause" %}Pause motion{% endt %}</span></button>
    <a href="#news">{% t "home.scroll" %}Scroll to discover{% endt %} <span aria-hidden="true">↓</span></a>
  </div>
</section>

<section class="section" id="news" aria-labelledby="news-title">
  <p class="section-label rv"><span class="mk">##</span> {% t "home.news.label" %}News &middot; recent log{% endt %}</p>
  <h2 id="news-title" class="rv">{% t "home.news.title" %}News{% endt %}</h2>
  <ul class="news-list rv">
    {% assign news_items = site.data.news | sort: "date" | reverse %}
    {% for item in news_items limit:6 %}
      <li>
        <time datetime="{{ item.date }}">{{ item.date | ldate: "month" }}</time>
        <span>{{ item.text }}{% if item.url %} <a href="{{ item.url }}" rel="noopener">{% t "home.news.link" %}link &rarr;{% endt %}</a>{% endif %}</span>
      </li>
    {% endfor %}
  </ul>
</section>

<section class="section" id="about" aria-labelledby="about-title">
  <p class="section-label rv"><span class="mk">##</span> {% t "home.about.label" %}About{% endt %}</p>
  <h2 id="about-title" class="rv">{% t "home.about.title" %}From shipping software to studying why it fails.{% endt %}</h2>
  <div class="rv">
    <p>
      {% t "home.about.p1" %}I am a Ph.D. student in Computer Science at Iowa State University, advised by
      <a href="https://weile.work/" rel="noopener">Prof. Wei Le</a> in the Program Analysis and AI Lab. My
      research focuses on reliable AI systems, numerical debugging, and software engineering techniques
      for machine learning systems.{% endt %}
    </p>
    <p>
      {% t "home.about.p2" %}Before starting my Ph.D., I spent four years as a software engineer on banking, e-governance, AI,
      and mobile platforms. That industry background shapes how I approach research: I care about methods
      that can become practical tools for developers and researchers. A fuller timeline is on the
      <a href="{{ '/about-me/' | lurl }}">extended about page</a>.{% endt %}
    </p>
  </div>
</section>

<section class="section" id="research" aria-labelledby="research-title">
  <p class="section-label rv"><span class="mk">##</span> {% t "home.research.label" %}Research interests{% endt %}</p>
  <h2 id="research-title" class="rv">{% t "home.research.title" %}What happens beneath the surface?{% endt %}</h2>
  <div class="research-areas">
    <article class="research-area rv">
      <span class="area-number" aria-hidden="true">01</span>
      <div class="area-symbol symbol-rings" aria-hidden="true"><i></i><i></i><i></i></div>
      <h3>{% t "home.research.q1" %}Can we trust the answer?{% endt %}</h3>
      <p>{% t "home.research.a1" %}Studying LLM hallucination and evaluating where intelligent systems lose their reliability.{% endt %}</p>
    </article>
    <article class="research-area rv">
      <span class="area-number" aria-hidden="true">02</span>
      <div class="area-symbol symbol-wave" aria-hidden="true"><i></i><i></i><i></i></div>
      <h3>{% t "home.research.q2" %}Where does a number go wrong?{% endt %}</h3>
      <p>{% t "home.research.a2" %}Tracing numerical instability and silent regressions through the software that powers machine learning.{% endt %}</p>
    </article>
    <article class="research-area rv">
      <span class="area-number" aria-hidden="true">03</span>
      <div class="area-symbol symbol-grid" aria-hidden="true"><i></i><i></i><i></i></div>
      <h3>{% t "home.research.q3" %}How do we make it useful?{% endt %}</h3>
      <p>{% t "home.research.a3" %}Building interpretable testing and debugging tools that help people understand and fix failures.{% endt %}</p>
    </article>
  </div>
  <ul class="interest-list rv">
    <li>{% t "interest.hallucination" %}LLM hallucination{% endt %}</li>
    <li>{% t "interest.reliability" %}AI reliability{% endt %}</li>
    <li>{% t "interest.se4ai" %}Software engineering for AI systems{% endt %}</li>
    <li>{% t "interest.whitebox" %}Interpretable / white-box analysis{% endt %}</li>
    <li>{% t "interest.humanCentered" %}Human-centered AI tools{% endt %}</li>
  </ul>
</section>

<section class="section" id="publications" aria-labelledby="publications-title">
  <div class="section-heading rv">
    <p class="section-label"><span class="mk">##</span> {% t "home.pubs.label" %}Publications{% endt %}</p>
    <h2 id="publications-title">{% t "home.pubs.title" %}Peer-reviewed &amp; preprint work{% endt %}</h2>
    <p>{% t "home.pubs.intro" %}On ML reliability, LLM evaluation, and numerical correctness.{% endt %}</p>
  </div>

  <div class="publication-list">
    {% assign publications = site.publications | sort: "date" | reverse %}
    {% for paper in publications %}
      <article class="publication-card rv">
        {% include work-cover.html work=paper %}
        <span class="badge">{{ paper.venue }}</span>
        <h3 lang="en"><a href="{{ paper.url | lurl }}">{{ paper.title }}</a></h3>
        {% if paper.authors %}
          <p class="publication-authors" lang="en">{{ paper.authors | replace: "Anwar Hossain Zahid", "<strong>Anwar Hossain Zahid</strong>" }}</p>
        {% endif %}
        {% if paper.excerpt %}
          <p>{{ paper.excerpt }}</p>
        {% endif %}
        <div class="publication-links">
          {% if paper.paperurl %}<a href="{{ paper.paperurl }}" rel="noopener">{% t "pub.paper" %}Paper{% endt %}</a>{% endif %}
          {% if paper.code %}<a href="{{ paper.code }}" rel="noopener">{% t "pub.code" %}Code{% endt %}</a>{% endif %}
        </div>
        {% if paper.bibtex %}
          <details class="bibtex">
            <summary>BibTeX</summary>
            <pre id="bibtex-{{ forloop.index }}" dir="ltr">{{ paper.bibtex }}</pre>
            <button type="button" class="copy-btn" data-copy-target="bibtex-{{ forloop.index }}" data-copied="{% t "common.copied" %}Copied{% endt %}" data-copy-failed="{% t "common.copyFailed" %}Copy failed{% endt %}">{% t "common.copy" %}Copy{% endt %}</button>
          </details>
        {% endif %}
      </article>
    {% endfor %}
  </div>
</section>

<section class="section" id="experience" aria-labelledby="experience-title">
  <div class="section-heading rv">
    <p class="section-label"><span class="mk">##</span> {% t "home.exp.label" %}Experience{% endt %}</p>
    <h2 id="experience-title">{% t "home.exp.title" %}Research grounded in real-world software.{% endt %}</h2>
    <p>{% t "home.exp.intro" %}Experience across research, banking, e-governance, and mobile software.{% endt %}</p>
  </div>
  <ul class="timeline rv">
    {% for job in site.data.experience %}
      <li>
        <span class="timeline-dates">{{ job.dates }}</span>
        <div>
          <h3>{{ job.role }} &middot; {% if job.org_url %}<a href="{{ job.org_url }}" rel="noopener"><bdi>{{ job.org }}</bdi></a>{% else %}<bdi>{{ job.org }}</bdi>{% endif %}</h3>
          <p>{{ job.note }}</p>
        </div>
      </li>
    {% endfor %}
  </ul>
</section>

<section class="section" id="projects" aria-labelledby="projects-title">
  <div class="section-heading rv">
    <p class="section-label"><span class="mk">##</span> {% t "home.projects.label" %}Projects{% endt %}</p>
    <h2 id="projects-title">{% t "home.projects.title" %}Selected systems &amp; applied work{% endt %}</h2>
    <p>{% t "home.projects.intro" %}Coursework and smaller repositories are collapsed below.{% endt %}</p>
  </div>

  <div class="project-grid">
    {% assign featured = site.portfolio | where: "tier", "featured" | sort: "path" %}
    {% for project in featured %}
      {% if project.title %}
        <article class="project-card rv">
          {% include work-cover.html work=project %}
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
              <a href="{{ project.demo }}" rel="noopener">{% t "project.demo" %}Demo{% endt %}</a>
            {% endif %}
          </div>
        </article>
      {% endif %}
    {% endfor %}
  </div>

  <details class="other-repos">
    <summary>{% t "project.others" %}Other repositories{% endt %}</summary>
    <ul lang="en" dir="ltr">
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
    <p class="section-label"><span class="mk">##</span> {% t "home.teaching.label" %}Teaching{% endt %}</p>
    <h2 id="teaching-title">{% t "home.teaching.title" %}Designing courses. Teaching through practice.{% endt %}</h2>
    <p>
      {% t "home.teaching.intro" %}Teaching assistant in the
      <a href="https://www.cs.iastate.edu/" rel="noopener">Department of Computer Science</a>
      at Iowa State University, contributing to course design, introductory programming, and artificial intelligence.{% endt %}
    </p>
  </div>
  <ul class="timeline rv">
    {% include course-design.html %}
    <li>
      <span class="timeline-dates">{% t "ta.dates" %}Spring 2023 &ndash; present{% endt %}</span>
      <div>
        <h3>{% t "ta.role" %}Teaching Assistant{% endt %} &middot; <a href="https://www.cs.iastate.edu/" rel="noopener">Iowa State University</a></h3>
        <p>
          {% t "ta.p1" %}Taught the lab and recitation sections for <strong>COM&nbsp;S&nbsp;127</strong> (introductory
          programming) &mdash; running weekly labs, developing course and assessment materials, designing
          grading rubrics, and grading assignments and exams.{% endt %}
        </p>
        <p>
          {% t "ta.p2" %}Delivered lectures for <strong>COM&nbsp;S&nbsp;472/572</strong> (Principles of Artificial
          Intelligence), covering for Prof. Jin Tian before he left the department and for
          Prof. Yan-Bin Jia.{% endt %}
        </p>
      </div>
    </li>
  </ul>
</section>

<section class="section" id="writing" aria-labelledby="writing-title">
  <div class="section-heading rv">
    <p class="section-label"><span class="mk">##</span> {% t "home.writing.label" %}Writing{% endt %}</p>
    <h2 id="writing-title">{% t "home.writing.title" %}Research notes &amp; engineering write-ups{% endt %}</h2>
    {% if locale != 'en' %}<p>{% t "home.writing.englishNote" %}The articles themselves are written in English.{% endt %}</p>{% endif %}
  </div>

  <div class="post-list compact rv">
    {% for post in site.posts limit:3 %}
      <article class="post-card">
        <span>{{ post.date | ldate: "medium" }}</span>
        <h3 lang="en"><a href="{{ post.url | lurl }}">{{ post.title }}</a></h3>
        <p lang="en">{{ post.excerpt | strip_html | truncate: 170 }}</p>
      </article>
    {% endfor %}
  </div>
  <a class="writing-more" href="{{ '/blog/' | lurl }}">{% t "home.writing.all" %}All posts &rarr;{% endt %}</a>
</section>

<section class="section contact" id="contact" aria-labelledby="contact-title">
  <p class="section-label rv"><span class="mk">##</span> {% t "home.contact.label" %}Contact{% endt %}</p>
  <h2 id="contact-title" class="rv">{% t "home.contact.title" %}Let’s connect.{% endt %}</h2>
  <p class="rv">{% t "home.contact.text" %}The fastest way to reach me is <a href="mailto:ahzahid@iastate.edu">email</a>.{% endt %}</p>
  <nav class="contact-links rv" aria-label="{% t "home.contact.linksLabel" %}Contact links{% endt %}">
    <a class="primary-link" href="mailto:ahzahid@iastate.edu">{% t "footer.email" %}Email{% endt %}</a>
    <a href="{{ '/files/resume.pdf' | relative_url }}">{% t "footer.cv" %}CV{% endt %}</a>
    <a href="https://github.com/AnwarXahid" rel="noopener">GitHub</a>
    <a href="https://scholar.google.com/citations?user=_ze57HEAAAAJ&hl=en" rel="noopener">Google Scholar</a>
    <a href="https://www.linkedin.com/in/anwar-hossain-zahid-a46195108/" rel="noopener">LinkedIn</a>
  </nav>
</section>
