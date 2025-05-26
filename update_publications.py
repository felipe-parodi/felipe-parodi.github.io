from scholarly import scholarly
import yaml

# Configure with your Google Scholar ID
SCHOLAR_ID = "kqW-zA0A5dAC"
OUTPUT_FILE = "_data/scholar_publications.yml"


def _get_publication_year_key(pub):
    """Helper function to get a sortable key for publication year."""
    # Ensure year is treated as a string for isdigit() check
    year_val = pub.get('year', '0')
    year_str = str(year_val)  # Convert to string
    return int(year_str) if year_str.isdigit() else 0


def fetch_publications():
    """Fetches G Scholar publications and saves them to a YAML file."""
    print(f"Fetching publications for Google Scholar ID: {SCHOLAR_ID}")
    try:
        author = scholarly.search_author_id(SCHOLAR_ID)
        author = scholarly.fill(author, sections=['publications'])
    except Exception as e:
        print(f"Error fetching author details: {e}")
        return

    if not author or not author.get('publications'):
        print("No publications found or error fetching publications.")
        return

    print(f"Found {len(author['publications'])} publications.")

    publications_data = []
    for pub_stub in author['publications']:
        try:
            # Fill the individual publication to get more details
            pub_filled = scholarly.fill(pub_stub)

            venue = (pub_filled.get('bib', {}).get('venue') or
                     pub_filled.get('bib', {}).get('journal') or
                     pub_filled.get('bib', {}).get('conference') or
                     pub_filled.get('bib', {}).get('booktitle', 'N/A'))
            
            # Prioritize eprint_url (often PDF) over pub_url (Scholar entry)
            publication_url = pub_filled.get(
                'eprint_url', pub_filled.get('pub_url', '#')
            )

            pub_details = {
                'title': pub_filled.get('bib', {}).get('title', 'N/A'),
                'authors': pub_filled.get('bib', {}).get('author', 'N/A'),
                'venue': venue,
                'year': pub_filled.get('bib', {}).get('pub_year', 'N/A'),
                'url': publication_url
            }
            if isinstance(pub_details['authors'], list):
                pub_details['authors'] = ', '.join(pub_details['authors'])

            publications_data.append(pub_details)
            processed_title = pub_details['title'][:50]
            print(f"  Processed: {processed_title}...")
        except Exception as e:
            error_title = pub_stub.get('bib', {}).get(
                'title', 'Unknown publication stub'
            )
            print(f"  Error processing publication {error_title}: {e}")

    # Sort publications by year, most recent first
    publications_data.sort(key=_get_publication_year_key, reverse=True)

    try:
        with open(OUTPUT_FILE, 'w') as f:
            yaml.dump(
                publications_data, f,
                default_flow_style=False, sort_keys=False
            )
        count = len(publications_data)
        print(f"Successfully saved {count} publications to {OUTPUT_FILE}")
    except Exception as e:
        print(f"Error saving publications to YAML: {e}")


if __name__ == "__main__":
    fetch_publications() 