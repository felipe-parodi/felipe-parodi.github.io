import yaml
import requests
import os
from urllib.parse import urlparse
import hashlib
from PIL import Image
import fitz  # PyMuPDF
import io

# Configuration
PUBLICATIONS_FILE = "_data/scholar_publications.yml"
THUMBNAILS_DIR = "images/publications"
DEFAULT_THUMBNAIL = "images/publications/default.png"
THUMBNAIL_SIZE = (300, 200)  # width, height


def create_thumbnails_directory():
    """Create the thumbnails directory if it doesn't exist."""
    os.makedirs(THUMBNAILS_DIR, exist_ok=True)


def create_default_thumbnail():
    """Create a default thumbnail for papers without PDFs."""
    if os.path.exists(DEFAULT_THUMBNAIL):
        return
    
    # Create a simple default thumbnail
    img = Image.new('RGB', THUMBNAIL_SIZE, color=(240, 240, 240))
    
    try:
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(img)
        
        # Try to use a system font, fallback to default
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 20)
        except:
            font = ImageFont.load_default()
        
        text = "📄\nPaper"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        x = (THUMBNAIL_SIZE[0] - text_width) // 2
        y = (THUMBNAIL_SIZE[1] - text_height) // 2
        
        draw.text((x, y), text, fill=(100, 100, 100), font=font, align="center")
    except ImportError:
        # If PIL ImageDraw is not available, just save the gray rectangle
        pass
    
    img.save(DEFAULT_THUMBNAIL)
    print(f"Created default thumbnail: {DEFAULT_THUMBNAIL}")


def generate_filename_from_url(url, title):
    """Generate a consistent filename from URL and title."""
    # Create a hash from URL and title for uniqueness
    content = f"{url}_{title}"
    hash_obj = hashlib.md5(content.encode())
    return f"{hash_obj.hexdigest()}.png"


def download_pdf(url, filename):
    """Download PDF from URL."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        with open(filename, 'wb') as f:
            f.write(response.content)
        return True
    except Exception as e:
        print(f"Failed to download PDF from {url}: {e}")
        return False


def extract_thumbnail_from_pdf(pdf_path, output_path):
    """Extract first page/figure from PDF as thumbnail."""
    try:
        doc = fitz.open(pdf_path)
        
        if len(doc) == 0:
            return False
        
        # Get the first page
        page = doc[0]
        
        # Render page to image
        mat = fitz.Matrix(2.0, 2.0)  # zoom factor
        pix = page.get_pixmap(matrix=mat)
        img_data = pix.tobytes("png")
        
        # Open with PIL and resize
        img = Image.open(io.BytesIO(img_data))
        
        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize to thumbnail size
        img.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
        
        # Create a new image with the exact thumbnail size (padding if needed)
        thumb = Image.new('RGB', THUMBNAIL_SIZE, (255, 255, 255))
        
        # Center the image
        x = (THUMBNAIL_SIZE[0] - img.width) // 2
        y = (THUMBNAIL_SIZE[1] - img.height) // 2
        thumb.paste(img, (x, y))
        
        thumb.save(output_path, 'PNG', quality=85)
        doc.close()
        
        print(f"Generated thumbnail: {output_path}")
        return True
        
    except Exception as e:
        print(f"Failed to extract thumbnail from {pdf_path}: {e}")
        return False


def process_publication(pub):
    """Process a single publication to generate thumbnail."""
    title = pub.get('title', 'Unknown')
    url = pub.get('url', '')
    
    # Skip if no URL or URL is just '#'
    if not url or url == '#':
        pub['thumbnail'] = DEFAULT_THUMBNAIL
        return
    
    # Check if URL is likely a PDF
    if not (url.endswith('.pdf') or 'pdf' in url.lower() or 
            'arxiv.org' in url or 'biorxiv.org' in url or 'nature.com' in url):
        pub['thumbnail'] = DEFAULT_THUMBNAIL
        return
    
    # Generate filename
    thumbnail_filename = generate_filename_from_url(url, title)
    thumbnail_path = os.path.join(THUMBNAILS_DIR, thumbnail_filename)
    
    # If thumbnail already exists, use it
    if os.path.exists(thumbnail_path):
        pub['thumbnail'] = thumbnail_path
        print(f"Using existing thumbnail: {thumbnail_path}")
        return
    
    # Try to download and process PDF
    temp_pdf = f"/tmp/{thumbnail_filename}.pdf"
    
    if download_pdf(url, temp_pdf):
        if extract_thumbnail_from_pdf(temp_pdf, thumbnail_path):
            pub['thumbnail'] = thumbnail_path
        else:
            pub['thumbnail'] = DEFAULT_THUMBNAIL
        
        # Clean up temp file
        try:
            os.remove(temp_pdf)
        except:
            pass
    else:
        pub['thumbnail'] = DEFAULT_THUMBNAIL


def generate_thumbnails():
    """Main function to generate thumbnails for all publications."""
    print("Starting thumbnail generation...")
    
    # Create directories
    create_thumbnails_directory()
    create_default_thumbnail()
    
    # Load publications
    try:
        with open(PUBLICATIONS_FILE, 'r') as f:
            publications = yaml.safe_load(f)
    except Exception as e:
        print(f"Error loading publications file: {e}")
        return
    
    if not publications:
        print("No publications found.")
        return
    
    print(f"Processing {len(publications)} publications...")
    
    # Process each publication
    for i, pub in enumerate(publications, 1):
        print(f"\n[{i}/{len(publications)}] Processing: {pub.get('title', 'Unknown')[:50]}...")
        process_publication(pub)
    
    # Save updated publications with thumbnail paths
    try:
        with open(PUBLICATIONS_FILE, 'w') as f:
            yaml.dump(publications, f, default_flow_style=False, sort_keys=False)
        print(f"\nSuccessfully updated {PUBLICATIONS_FILE} with thumbnail information.")
    except Exception as e:
        print(f"Error saving publications file: {e}")


if __name__ == "__main__":
    generate_thumbnails()