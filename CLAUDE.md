# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Install dependencies
bundle install

# Serve locally (http://localhost:4000)
bundle exec jekyll serve

# Build site (outputs to _site/)
bundle exec jekyll build
```

## Publication Management Scripts

```bash
# Fetch publications from Google Scholar and save to _data/scholar_publications.yml
python update_publications.py

# Generate PDF thumbnails for publications (requires PyMuPDF, Pillow, requests)
python generate_thumbnails.py
```

Dependencies: `scholarly`, `pyyaml`, `pymupdf`, `pillow`, `requests`

## Architecture Overview

This is a Jekyll-based academic website using the **Minimal Mistakes** remote theme (`mmistakes/minimal-mistakes`).

### Key Directories
- `_pages/` - Main site pages (about.md is the homepage at `/`)
- `_data/` - YAML data files for publications, news, navigation
- `_layouts/` - Custom layout overrides (extends Minimal Mistakes)
- `_includes/` - Partial templates (author-profile, head, masthead, etc.)
- `_sass/` - SCSS style customizations
- `assets/js/` - JavaScript for dark mode toggle and publication filtering

### Data Flow for Publications
1. `update_publications.py` fetches from Google Scholar → `_data/scholar_publications.yml`
2. `generate_thumbnails.py` creates thumbnails → `images/publications/`
3. `_pages/research.html` renders publications with tag filtering via `assets/js/publications-filter.js`

### Features
- **Dark mode**: Toggle via `#theme-toggle` button, persisted in localStorage
- **Publication filtering**: Tag-based filtering on `/research/` page
- **News feed**: Expandable news list on homepage from `_data/news.yml`

### Configuration
- `_config.yml` - Main Jekyll config (author, social links, plugins, collections)
- `_config.dev.yml` - Development overrides (disables analytics, uses localhost)
