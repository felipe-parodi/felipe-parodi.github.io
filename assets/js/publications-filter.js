// Publications Tag Filter Functionality

document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const publicationCards = document.querySelectorAll('.publication-card');
    const noResultsMessage = document.getElementById('no-results');
    const publicationsGrid = document.getElementById('publications-grid');

    if (!filterButtons.length || !publicationCards.length) {
        return; // Not on publications page
    }

    // Add click event listeners to filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const selectedTag = this.getAttribute('data-tag');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filter publications
            filterPublications(selectedTag);
        });
    });

    function filterPublications(selectedTag) {
        let visibleCount = 0;
        
        publicationCards.forEach(card => {
            const cardTags = card.getAttribute('data-tags');
            
            if (selectedTag === 'all' || cardTags.includes(selectedTag)) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Show/hide no results message
        if (visibleCount === 0) {
            noResultsMessage.style.display = 'block';
            publicationsGrid.style.display = 'none';
        } else {
            noResultsMessage.style.display = 'none';
            publicationsGrid.style.display = 'grid';
        }
        
        // Add smooth animation
        addFilterAnimation();
    }

    function addFilterAnimation() {
        // Add a small delay and fade-in effect for visible cards
        const visibleCards = document.querySelectorAll('.publication-card[style*="block"]');
        
        visibleCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50); // Stagger the animation
        });
    }

    // Initialize with smooth appearance
    setTimeout(() => {
        addFilterAnimation();
    }, 100);

    // Add keyboard support for accessibility
    filterButtons.forEach(button => {
        button.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });

    // Add search functionality (bonus feature)
    const searchInput = document.getElementById('publication-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const activeTag = document.querySelector('.filter-btn.active').getAttribute('data-tag');
            
            let visibleCount = 0;
            
            publicationCards.forEach(card => {
                const title = card.querySelector('.card-title').textContent.toLowerCase();
                const authors = card.querySelector('.card-authors').textContent.toLowerCase();
                const venue = card.querySelector('.card-venue').textContent.toLowerCase();
                const cardTags = card.getAttribute('data-tags');
                
                const matchesSearch = title.includes(searchTerm) || 
                                    authors.includes(searchTerm) || 
                                    venue.includes(searchTerm);
                const matchesTag = activeTag === 'all' || cardTags.includes(activeTag);
                
                if (matchesSearch && matchesTag) {
                    card.style.display = 'block';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Update no results message
            if (visibleCount === 0) {
                noResultsMessage.style.display = 'block';
                publicationsGrid.style.display = 'none';
            } else {
                noResultsMessage.style.display = 'none';
                publicationsGrid.style.display = 'grid';
            }
        });
    }
});