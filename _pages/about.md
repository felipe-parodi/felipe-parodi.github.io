---
permalink: /
title: "Felipe Parodi"
excerpt: "PhD Candidate in Computational Neuroscience at UPenn, studying social intelligence in primates and machines. Co-advised by Konrad Kording and Michael Platt."
author_profile: true
redirect_from: 
  - about/
  - /about.html
---

Hello, I'm Felipe — a PhD Candidate in the [Computational Neuroscience Initiative](https://cni.upenn.edu/) at the University of Pennsylvania (2020–Present). I study how the brain supports social intelligence, with a focus on natural primate interactions.  

I completed my B.S. in Neuroscience and B.A. in Economics (2015–2019) at the University of Miami, and worked as a Psychometrician before graduate school.  

My research combines **computational neuroethology**, **deep learning**, and **neurotechnology** to understand how neurons in the superior temporal sulcus encode complex social cues. Beyond biology, I’m interested in how these insights can inspire AI systems and tools for decoding non-human cognition, with applications to both basic science and human-centered technologies.  

I am co-advised by [Konrad Kording](http://kordinglab.com/) and [Michael Platt](http://plattlabs.rocks/). Along the way, I’ve also interned at <span style="color:#4285F4;">G</span><span style="color:#EA4335;">o</span><span style="color:#FBBC05;">o</span><span style="color:#4285F4;">g</span><span style="color:#34A853;">l</span><span style="color:#EA4335;">e</span> and [Colossal Biosciences](https://colossal.com/).  

I am currently seeking opportunities in **Research Scientist** and **Machine Learning Engineer** roles, particularly at the intersection of **AI for Science, social intelligence, and neurotechnology**. [Get in touch](/contact/) if you'd like to connect.  

I also maintain [awesome-computational-primatology](https://github.com/KordingLab/awesome-computational-primatology), a community resource on the interface of machine learning and primatology. Contributions welcome!


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
