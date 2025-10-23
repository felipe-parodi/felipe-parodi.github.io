---
layout: single
permalink: /
title: "Felipe Parodi"
excerpt: "PhD Candidate in Computational Neuroscience at UPenn, studying social intelligence in primates and machines. Co-advised by Konrad Kording and Michael Platt."
author_profile: true
redirect_from: 
  - about/
  - /about.html
---

Hello, I'm Felipe — a PhD Candidate in the [Computational Neuroscience Initiative](https://cni.upenn.edu/) at the University of Pennsylvania. I study how primate brains encode social intelligence and how these principles can inform artificial ones.

I completed my B.S. in Neuroscience and B.A. in Economics at the University of Miami, and worked as a Psychometrician before graduate school.

My research combines **neuroethology**, **machine learning**, and **neurotechnology** to model natural social behavior from neural and video data. I've applied these methods at <span style="color:#4285F4;">G</span><span style="color:#EA4335;">o</span><span style="color:#FBBC05;">o</span><span style="color:#4285F4;">g</span><span style="color:#34A853;">l</span><span style="color:#EA4335;">e</span> and [Colossal Biosciences](https://colossal.com/), where I worked on LLM evaluation and behavioral modeling.

I'm co-advised by [Konrad Kording](http://kordinglab.com/) and [Michael Platt](http://plattlabs.rocks/).

**Recent work:**
1. [Primate neuroethology: a new synthesis](https://authors.elsevier.com/c/1lqx54sIRvW-Qk) — why we should study primate intelligence in more natural conditions.
2. [PrimateFace](https://www.biorxiv.org/content/10.1101/2025.08.12.669927v2) — a machine learning resource for cross-species primate facial analysis.

I am currently seeking **Research Scientist** and **Machine Learning Engineer** roles focused on **AI for Science, social intelligence, and biologically-inspired learning**. [Get in touch](/contact/) if you'd like to connect.

I also maintain [awesome-computational-primatology](https://github.com/KordingLab/awesome-computational-primatology), a community resource at the intersection of machine learning and primatology. Contributions welcome!


## Latest News

<div class="news-container">
  <ul id="news-list" class="news-feed-condensed">
    {% assign news_items = site.data.news | sort: 'date' | reverse %}
    {% for item in news_items limit:5 %}
      <li>
        <span class="news-date">{{ item.date | date: "%b %Y" }}:</span>
        <span class="news-event">{{ item.event | markdownify | remove: '<p>' | remove: '</p>' }}</span>
      </li>
    {% endfor %}
  </ul>

  {% if site.data.news.size > 5 %}
    <ul id="older-news-list" class="news-feed-condensed" style="display:none;">
      {% for item in news_items offset:5 %}
        <li>
          <span class="news-date">{{ item.date | date: "%b %Y" }}:</span>
          <span class="news-event">{{ item.event | markdownify | remove: '<p>' | remove: '</p>' }}</span>
        </li>
      {% endfor %}
    </ul>
    <button id="toggle-news-btn" class="toggle-news-btn">Show older news</button>
  {% endif %}
</div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('toggle-news-btn');
    const olderNewsList = document.getElementById('older-news-list');

    if (toggleButton && olderNewsList) {
      toggleButton.addEventListener('click', function() {
        const isHidden = olderNewsList.style.display === 'none';
        olderNewsList.style.display = isHidden ? 'block' : 'none';
        toggleButton.textContent = isHidden ? 'Hide older news' : 'Show older news';
      });
    }
  });
</script>
