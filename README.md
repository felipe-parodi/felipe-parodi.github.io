# Felipe Parodi's Personal Website

Welcome to my personal academic website repository! This site showcases my research in computational neuroscience, machine learning, and primate behavior.

## About

I'm a PhD candidate at the University of Pennsylvania working in the Konrad Kording and Michael Platt labs. My research focuses on understanding social interactions in primates using AI and computational methods.

## Website Features

- **Research:** Automated publication system with thumbnail generation and tag-based filtering
- **Dark Mode:** Toggle between light and dark themes
- **Responsive Design:** Optimized for desktop and mobile viewing
- **Google Scholar Integration:** Automatic publication updates via Python scripts

## Tech Stack

- **Jekyll** static site generator with Minimal Mistakes theme
- **GitHub Pages** hosting
- **Python** scripts for publication management and thumbnail generation
- **JavaScript** for interactive filtering and dark mode

## Local Development

```bash
git clone https://github.com/felipe-parodi/felipe-parodi.github.io.git
cd felipe-parodi.github.io
bundle install
bundle exec jekyll serve
```

Visit `http://localhost:4000` to view locally.

## Key Scripts

- `update_publications.py` - Fetches publications from Google Scholar with automatic tagging
- `generate_thumbnails.py` - Extracts thumbnails from PDFs using PyMuPDF

## Contact

Feel free to reach out if you have questions about the research or the website implementation!
