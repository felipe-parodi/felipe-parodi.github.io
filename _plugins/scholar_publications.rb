require 'nokogiri'
require 'open-uri'
require 'yaml'

module Jekyll
  class ScholarPublications < Generator
    safe true
    priority :high

    def generate(site)
      # Google Scholar ID from config
      scholar_id = site.config['author']['googlescholar'].split('user=').last.split('&').first
      
      # Load custom annotations
      annotations = YAML.load_file('_data/paper_annotations.yml') rescue {}

      begin
        # Fetch from Google Scholar
        url = "https://scholar.google.com/citations?user=#{scholar_id}&hl=en"
        doc = Nokogiri::HTML(URI.open(url))
        
        publications = []
        
        doc.css('#gsc_a_b .gsc_a_tr').each do |paper|
          title = paper.css('.gsc_a_t a').text
          authors = paper.css('.gsc_a_t .gsc_a_at').text
          year = paper.css('.gsc_a_y span').text
          url = "https://scholar.google.com#{paper.css('.gsc_a_t a').attr('href')}"
          
          # Get annotation if exists
          annotation = annotations[title]
          
          publications << {
            'title' => title,
            'authors' => authors,
            'year' => year,
            'url' => url,
            'annotation' => annotation
          }
        end
        
        # Store in site data
        site.data['scholar_publications'] = publications
      rescue => e
        puts "Warning: Could not fetch Google Scholar publications: #{e.message}"
        site.data['scholar_publications'] = []
      end
    end
  end
end 