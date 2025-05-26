---
title: "Publications | Computational Neuroscience & AI Research"
excerpt: "Academic publications in computational neuroscience, machine learning, and primate behavior research."
layout: archive
permalink: /publications/
author_profile: true
---

{% assign publications_by_year = site.data.scholar_publications | group_by: "year" %}
{% assign years = publications_by_year | map: "name" | sort | reverse %}

{% for year in years %}
### {{ year }}
{% assign year_publications = publications_by_year | where: "name", year | first %}
{% for pub in year_publications.items %}
- **[{{ pub.title }}]({{ pub.url }})**  
  _{{ pub.authors }}_  
  {% if pub.journal_conference %}*{{ pub.journal_conference }}*.{% endif %}
  {% if pub.annotation %}
  <p style="margin-left: 1.5em; font-size: 0.9em; color: #555;">🔑 <strong>Key Insight:</strong> {{ pub.annotation.key_insight }}  
  {% if pub.annotation.domain %}
  <span class="domain-tag">{{ pub.annotation.domain }}</span>
  {% endif %}
  </p>
  {% endif %}
{% endfor %}
{% endfor %}

<style>
.domain-tag {
  display: inline-block;
  font-size: 0.8em;
  color: #666;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  margin-left: 8px;
}
</style>

<sup>†</sup> denotes shared authorship.
