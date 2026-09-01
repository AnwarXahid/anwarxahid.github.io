---
layout: archive
title: "About"
permalink: /about-me/
redirect_from:
  - /resume
---

<section class="page-intro">
  <p class="eyebrow">About</p>
  <h1>Computer scientist focused on reliable ML and dependable software systems.</h1>
  <p>
    I am a Ph.D. candidate at Iowa State University working with
    <a href="https://weile.work/" rel="noopener">Prof. Wei Le</a> in the Program Analysis and AI Lab.
    Before graduate school, I spent four years building software for government, banking, AI, and
    mobile platforms. This page is the extended version of the
    <a href="{{ '/' | relative_url }}#about">homepage summary</a>.
  </p>
</section>

<section class="section">
  <div class="section-heading">
    <h2>Education</h2>
  </div>
  <ul class="timeline">
    <li>
      <span class="timeline-dates">Spring 2023 – Present</span>
      <h3>Ph.D. in Computer Science</h3>
      <p>Iowa State University, Ames, Iowa — Advisor: <a href="https://weile.work/" rel="noopener">Prof. Wei Le</a></p>
    </li>
    <li>
      <span class="timeline-dates">2018</span>
      <h3>B.Sc. in Computer Science and Engineering</h3>
      <p>Bangladesh University of Engineering and Technology (BUET)</p>
    </li>
  </ul>
</section>

<section class="section">
  <div class="section-heading">
    <h2>Research experience</h2>
  </div>
  <ul class="timeline">
    <li>
      <span class="timeline-dates">Fall 2023 – Present</span>
      <h3>Differential Debugging Framework for ML Model Versions</h3>
      <p>Developing methods to analyze behavioral inconsistencies across model versions using differential testing and invariant learning.</p>
    </li>
    <li>
      <span class="timeline-dates">Summer 2024 – Fall 2024</span>
      <h3>Floating-Point Arithmetic Across Compilers</h3>
      <p>At <a href="https://www.llnl.gov/" rel="noopener">Lawrence Livermore National Laboratory</a>, investigated numerical differences between NVIDIA and AMD GPUs across compiler toolchains.</p>
    </li>
    <li>
      <span class="timeline-dates">2020 – 2021</span>
      <h3>Virtual Internship System</h3>
      <p>Designed a virtual internship platform for benchmarking software development skills in blended academic and industry settings.</p>
    </li>
    <li>
      <span class="timeline-dates">2018 – 2019</span>
      <h3>Scene Reconstruction from Static CCTV Cameras</h3>
      <p>Proposed a multi-camera 3D scene reconstruction system for surveillance and smart-city applications.</p>
    </li>
  </ul>
</section>

<section class="section">
  <div class="section-heading">
    <h2>Professional experience</h2>
    <p>See the <a href="{{ '/' | relative_url }}#experience">homepage</a> for the condensed version.</p>
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

<section class="section">
  <div class="section-heading">
    <h2>Technical strengths</h2>
  </div>
  <ul class="chip-list">
    <li class="chip">Python</li><li class="chip">Java</li><li class="chip">C/C++</li>
    <li class="chip">JavaScript</li><li class="chip">PyTorch</li><li class="chip">TensorFlow</li>
    <li class="chip">Spring Boot</li><li class="chip">Flask</li><li class="chip">Django</li>
    <li class="chip">Docker</li><li class="chip">Linux</li><li class="chip">CUDA/HIP</li>
    <li class="chip">SQL</li><li class="chip">Program Analysis</li><li class="chip">ML Testing</li>
  </ul>
</section>
