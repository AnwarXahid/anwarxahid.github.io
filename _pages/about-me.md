---
layout: archive
title: "About"
excerpt: "Education, research, industry experience, and teaching of Anwar Hossain Zahid, a Ph.D. candidate in Computer Science at Iowa State University."
permalink: /about-me/
redirect_from:
  - /resume
---

<section class="page-intro">
  <p class="eyebrow">{% t "aboutMe.eyebrow" %}About{% endt %}</p>
  <h1>{% t "aboutMe.title" %}Computer scientist focused on reliable ML and dependable software systems.{% endt %}</h1>
  <p>
    {% t "aboutMe.intro" %}I am a Ph.D. candidate at Iowa State University working with
    <a href="https://weile.work/" rel="noopener">Prof. Wei Le</a> in the Program Analysis and AI Lab.
    Before graduate school, I spent four years building software for government, banking, AI, and
    mobile platforms. This page is the extended version of the
    <a href="{{ '/#about' | lurl }}">homepage summary</a>.{% endt %}
  </p>
</section>

<section class="section">
  <div class="section-heading">
    <h2>{% t "aboutMe.education" %}Education{% endt %}</h2>
  </div>
  <ul class="timeline">
    <li>
      <span class="timeline-dates">{% t "aboutMe.phd.dates" %}Spring 2023 – Present{% endt %}</span>
      <div>
        <h3>{% t "aboutMe.phd.degree" %}Ph.D. in Computer Science{% endt %}</h3>
        <p>{% t "aboutMe.phd.where" %}Iowa State University, Ames, Iowa — Advisor: <a href="https://weile.work/" rel="noopener">Prof. Wei Le</a>{% endt %}</p>
      </div>
    </li>
    <li>
      <span class="timeline-dates">{% t "aboutMe.bsc.dates" %}2018{% endt %}</span>
      <div>
        <h3>{% t "aboutMe.bsc.degree" %}B.Sc. in Computer Science and Engineering{% endt %}</h3>
        <p>{% t "aboutMe.bsc.where" %}Bangladesh University of Engineering and Technology (BUET){% endt %}</p>
      </div>
    </li>
  </ul>
</section>

<section class="section">
  <div class="section-heading">
    <h2>{% t "aboutMe.research" %}Research experience{% endt %}</h2>
  </div>
  <ul class="timeline">
    <li>
      <span class="timeline-dates">{% t "aboutMe.r1.dates" %}Fall 2023 – Present{% endt %}</span>
      <div>
        <h3>{% t "aboutMe.r1.title" %}Differential Debugging Framework for ML Model Versions{% endt %}</h3>
        <p>{% t "aboutMe.r1.text" %}Developing methods to analyze behavioral inconsistencies across model versions using differential testing and invariant learning.{% endt %}</p>
      </div>
    </li>
    <li>
      <span class="timeline-dates">{% t "aboutMe.r2.dates" %}Summer 2024 – Fall 2024{% endt %}</span>
      <div>
        <h3>{% t "aboutMe.r2.title" %}Floating-Point Arithmetic Across Compilers{% endt %}</h3>
        <p>{% t "aboutMe.r2.text" %}At <a href="https://www.llnl.gov/" rel="noopener">Lawrence Livermore National Laboratory</a>, investigated numerical differences between NVIDIA and AMD GPUs across compiler toolchains.{% endt %}</p>
      </div>
    </li>
    <li>
      <span class="timeline-dates">{% t "aboutMe.r3.dates" %}2020 – 2021{% endt %}</span>
      <div>
        <h3>{% t "aboutMe.r3.title" %}Virtual Internship System{% endt %}</h3>
        <p>{% t "aboutMe.r3.text" %}Designed a virtual internship platform for benchmarking software development skills in blended academic and industry settings.{% endt %}</p>
      </div>
    </li>
    <li>
      <span class="timeline-dates">{% t "aboutMe.r4.dates" %}2018 – 2019{% endt %}</span>
      <div>
        <h3>{% t "aboutMe.r4.title" %}Scene Reconstruction from Static CCTV Cameras{% endt %}</h3>
        <p>{% t "aboutMe.r4.text" %}Proposed a multi-camera 3D scene reconstruction system for surveillance and smart-city applications.{% endt %}</p>
      </div>
    </li>
  </ul>
</section>

<section class="section">
  <div class="section-heading">
    <h2>{% t "aboutMe.work" %}Professional experience{% endt %}</h2>
    <p>{% t "aboutMe.workIntro" %}See the <a href="{{ '/#experience' | lurl }}">homepage</a> for the condensed version.{% endt %}</p>
  </div>
  <ul class="timeline">
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

<section class="section">
  <div class="section-heading">
    <h2>{% t "aboutMe.teaching" %}Teaching{% endt %}</h2>
  </div>
  <ul class="timeline">
    {% include course-design.html %}
    <li>
      <span class="timeline-dates">{% t "ta.dates" %}Spring 2023 &ndash; present{% endt %}</span>
      <div>
        <h3>{% t "ta.role" %}Teaching Assistant{% endt %} · <a href="https://www.cs.iastate.edu/" rel="noopener">Iowa State University</a></h3>
        <p>
        {% t "ta.p1" %}Taught the lab and recitation sections for <strong>COM&nbsp;S&nbsp;127</strong> (introductory
          programming) &mdash; running weekly labs, developing course and assessment materials, designing
          grading rubrics, and grading assignments and exams.{% endt %}
        {% t "ta.p2" %}Delivered lectures for <strong>COM&nbsp;S&nbsp;472/572</strong> (Principles of Artificial
          Intelligence), covering for Prof. Jin Tian before he left the department and for
          Prof. Yan-Bin Jia.{% endt %}
      </p>
      </div>
    </li>
  </ul>
</section>

<section class="section">
  <div class="section-heading">
    <h2>{% t "aboutMe.skills" %}Technical strengths{% endt %}</h2>
  </div>
  <ul class="chip-list">
    <li class="chip">Python</li><li class="chip">Java</li><li class="chip">C/C++</li>
    <li class="chip">JavaScript</li><li class="chip">PyTorch</li><li class="chip">TensorFlow</li>
    <li class="chip">Spring Boot</li><li class="chip">Flask</li><li class="chip">Django</li>
    <li class="chip">Docker</li><li class="chip">Linux</li><li class="chip">CUDA/HIP</li>
    <li class="chip">SQL</li><li class="chip">{% t "aboutMe.skill.pa" %}Program Analysis{% endt %}</li><li class="chip">{% t "aboutMe.skill.mlt" %}ML Testing{% endt %}</li>
  </ul>
</section>
