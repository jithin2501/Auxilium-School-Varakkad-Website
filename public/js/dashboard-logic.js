// Function to show the selected admin section
function showAdminSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => { 
        section.classList.add('hidden'); // [cite: 118, 119]
    });

    // Show the requested section
    document.getElementById(`${sectionId}-section`).classList.remove('hidden'); // [cite: 120]
    
    // Update title
    const navText = document.getElementById(`nav-${sectionId}`).textContent.trim(); // [cite: 121]
    document.getElementById('section-title').textContent = navText; // [cite: 121]

    // Update active nav item styling
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('bg-indigo-600', 'font-semibold');
    });
    document.getElementById(`nav-${sectionId}`).classList.add('bg-indigo-600', 'font-semibold'); // [cite: 122]

    // Close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
        toggleSidebar(); // [cite: 123]
    }
}

// Function to toggle the sidebar for mobile view
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar'); // [cite: 124]
    const overlay = document.getElementById('sidebar-overlay'); // [cite: 124]
    
    // Toggle the 'open' class for the slide-in/out effect
    sidebar.classList.toggle('open'); // [cite: 125]
    // Toggle the overlay visibility
    overlay.classList.toggle('hidden'); // [cite: 126]
    // Prevent body scrolling when the sidebar is open on mobile
    document.body.classList.toggle('overflow-hidden'); // [cite: 127]
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => { // [cite: 127]
    // Show the default section (applications)
    showAdminSection('applications');
    
    // Handle table scroll indicators
    const tableWrappers = document.querySelectorAll('.table-scroll-wrapper');
    tableWrappers.forEach(wrapper => {
        const checkScroll = () => { // [cite: 128]
            if (wrapper.scrollWidth > wrapper.clientWidth) {
                wrapper.classList.add('has-overflow');
            } else {
               wrapper.classList.remove('has-overflow'); // [cite: 129]
            }
        };
        
        // Check on load and resize
        checkScroll(); // [cite: 130]
        window.addEventListener('resize', checkScroll); // [cite: 130]
        
        // Remove the indicator once user starts scrolling
        wrapper.addEventListener('scroll', () => {
            if (wrapper.scrollLeft > 0) {
               wrapper.classList.remove('has-overflow'); // [cite: 131]
            }
        });
    });
});