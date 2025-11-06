// public/js/script.js

document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('.top-header-bar');
    const scrollThreshold = 50; 
    
    function checkScroll() {
        if (window.scrollY > scrollThreshold) {
            header.classList.add('scrolled-nav');
        } else {
            header.classList.remove('scrolled-nav');
        }
    }

    window.addEventListener('scroll', checkScroll);
    checkScroll();
    
    // ----------------------------------------------------
    // Path-based Anchor Scroll Logic (Updated)
    // ----------------------------------------------------

    /**
     * Checks the URL pathname for a secondary anchor (e.g., /home/section-id) 
     * and scrolls the target element into view.
     * @param {string} [behavior='smooth'] - The scroll behavior ('smooth' or 'instant').
     */
    window.handleAnchorScroll = function(behavior = 'smooth') {
        const fullPath = window.location.pathname;
        const parts = fullPath.split('/');
        
        // Check for a secondary path segment (e.g., 'academics-section' in /home/academics-section)
        const anchorId = parts.length > 2 ? parts[2] : ''; 
        const headerHeight = header.offsetHeight + 10; // Fixed header height + extra margin

        if (anchorId) {
            const targetElement = document.getElementById(anchorId);

            if (targetElement) {
                // Ensure the target is within the currently visible page section
                // We check if the target's parent is visible
                if (targetElement.closest('.page-section') && targetElement.closest('.page-section').style.display !== 'none') {
                     
                    // 🎯 CRITICAL FIX: Calculate scroll position considering the fixed header offset
                    const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;
                     
                    window.scrollTo({ 
                        top: targetPosition, 
                        behavior: behavior 
                    }); 
                }
            }
        } else if (fullPath.length > 1) {
            // If it's a primary page path (e.g., /knowus or /home), scroll instantly.
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    }
    
    // ----------------------------------------------------
    // SINGLE-PAGE APPLICATION (SPA) ROUTING LOGIC (Refactored for Paths)
    // ----------------------------------------------------

    function setupRouting() {
        // Target all main navigation and footer links that use the data-page attribute
        const pageLinks = document.querySelectorAll('a[data-page]');
        
        pageLinks.forEach(link => {
            link.addEventListener('click', function(event) {
                
                // CRITICAL: Prevent default browser navigation
                event.preventDefault(); 
                
                const targetHref = this.getAttribute('href');
                
                // Only push state if the href starts with '/' (a defined path)
                if (targetHref.startsWith('/')) {
                    
                    window.history.pushState(null, null, targetHref);
                    
                    if (typeof window.initializePublicRouting === 'function') {
                        window.initializePublicRouting();
                    }
                    
                    // Call handleAnchorScroll to jump to the subsection if one exists.
                    window.handleAnchorScroll('instant');
                    
                    // Close all navigation dropdowns when a page is successfully routed
                    document.querySelectorAll('.nav-dropdown-wrapper').forEach(wrapper => {
                        wrapper.classList.remove('open');
                    });
                }
            });
        });

        // Ensure anchor scrolling runs on load/refresh if the URL already has a sub-path
        window.handleAnchorScroll();
    }
    
    setupRouting();
    
    // This function handles simple in-page anchors (e.g. accordion toggles) 
    // and is now left to default browser behavior since the main navigation is handled above.
    function setupAnchorLinks() {
        // No change needed here, as the links in index.html were either paths or non-navigational links.
    }
    setupAnchorLinks();

    // ----------------------------------------------------
    // CONTACT FORM LOGIC (API Submission) - No change needed
    // ----------------------------------------------------
    
    const formContainer = document.getElementById('contactFormContainer');
    const contactForm = document.getElementById('contactForm');

    if (contactForm && formContainer) {
        contactForm.addEventListener('submit', async function(event) {
            event.preventDefault(); 
            
            const formData = {
                name: contactForm.elements.name.value,
                email: contactForm.elements.email.value,
                mobile: contactForm.elements.mobile.value,
                subject: contactForm.elements.subject.value,
                message: contactForm.elements.message.value,
            };
            
            formContainer.innerHTML = '<h2 style="text-align:center; padding:30px; color:#444;">Sending... Please Wait.</h2>';
            
            try {
                const response = await fetch(`${API_BASE}/api/contact`, { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                const result = await response.json();
                
                const responseMessage = document.createElement('h2');
                responseMessage.style.color = response.ok ? '#1a4d40' : '#b91c1c'; 
                responseMessage.style.textAlign = 'center';
                responseMessage.style.padding = '30px';
                
                if (response.ok) {
                    responseMessage.textContent = '✅ Message Sent Successfully!';
                } else {
                    responseMessage.textContent = `❌ Submission Failed: ${result.message || 'Server error occurred.'}`;
                }

                formContainer.innerHTML = '';
                formContainer.appendChild(responseMessage);

            } catch (error) {
                console.error('Client-side fetch error:', error);
                formContainer.innerHTML = `<h2 style="color:#b91c1c;padding:30px;text-align:center;">Error: Cannot connect to the backend server (Is Node.js running on port 3000? Check the console for details).</h2>`;
            }
        });
    }

    // ----------------------------------------------------
    // DROPDOWN CLICK/ARROW ROTATION LOGIC - No change needed
    // ----------------------------------------------------

    const dropdownToggles = document.querySelectorAll('.nav-links .js-dropdown-toggle');
    const allDropdownWrappers = document.querySelectorAll('.nav-links .nav-dropdown-wrapper');

    dropdownToggles.forEach(toggle => {
        
        // Listener on the main clickable DIV (.js-dropdown-toggle)
        toggle.addEventListener('click', function(event) {
            
            // Check if the click directly landed on the ARROW ICON or its wrapper.
            const clickedLink = event.target.closest('a.nav-link-page');
            const clickedArrowArea = event.target.closest('.dropdown-toggle-arrow');

            if (clickedLink) {
                // CASE 1: Clicked the LINK TEXT
                // The standard data-page listeners handle the navigation above.
                event.stopPropagation();
                
                // CRITICAL: Close the dropdown immediately when the link is clicked to navigate away.
                this.closest('.nav-dropdown-wrapper').classList.remove('open');
                
            } else if (clickedArrowArea) {
                // CASE 2: Clicked the ARROW ICON
                event.stopPropagation(); // Stop propagation for the document listener
                
                const parentWrapper = this.closest('.nav-dropdown-wrapper');
                
                // Close all other open dropdowns
                allDropdownWrappers.forEach(wrapper => {
                    if (wrapper !== parentWrapper) {
                        wrapper.classList.remove('open');
                    }
                });

                // Toggle the 'open' class on the current dropdown
                parentWrapper.classList.toggle('open');
            }
        });
    });

    // Close desktop dropdowns if clicking anywhere else on the page
    document.addEventListener('click', function(event) {
        let isClickInsideDropdown = false;
        allDropdownWrappers.forEach(wrapper => {
            if (wrapper.contains(event.target)) {
                isClickInsideDropdown = true;
            }
        });

        if (!isClickInsideDropdown) {
            allDropdownWrappers.forEach(wrapper => {
                wrapper.classList.remove('open');
            });
        }
    });
    
    // ----------------------------------------------------
    // NEW MOBILE MENU TOGGLE LOGIC (FIXED) - No change needed
    // ----------------------------------------------------
    
    const toggleButton = document.getElementById('hamburger-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeButton = document.getElementById('mobile-menu-close');
    const mobileDropdownToggles = document.querySelectorAll('.mobile-nav-menu .js-mobile-dropdown-toggle');
    
    const closeMobileMenu = () => {
        if (toggleButton) toggleButton.classList.remove('open');
        if (mobileMenu) mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
    };

    if (toggleButton && mobileMenu) {
        toggleButton.addEventListener('click', () => {
             if (mobileMenu.classList.contains('open')) {
                closeMobileMenu();
            } else {
                toggleButton.classList.add('open');
                mobileMenu.classList.add('open');
                document.body.style.overflow = 'hidden';
            }
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', closeMobileMenu);
    }

    mobileDropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const parentWrapper = toggle.closest('.nav-dropdown-wrapper');
            
            mobileDropdownToggles.forEach(otherToggle => {
                const otherWrapper = otherToggle.closest('.nav-dropdown-wrapper');
                if (otherWrapper !== parentWrapper) {
                    otherWrapper.classList.remove('open');
                }
            });

            parentWrapper.classList.toggle('open');
        });
    });
    
    mobileMenu.querySelectorAll('a[data-page]').forEach(link => {
        link.addEventListener('click', function() {
            setTimeout(closeMobileMenu, 100); 
        });
    });

    // NOTE: The original `setupRouting` now handles both desktop and mobile link clicks.
});

// =========================================================================
// FUNCTION TO HANDLE PAGE VISIBILITY AND CONTENT LOADING (Refactored for Paths)
// =========================================================================
const API_BASE = '';

function getCleanPath() {
    // Get the path and clean it up, e.g., '/home/academics-section' -> 'home'
    const fullPath = window.location.pathname.startsWith('/') ? window.location.pathname.substring(1) : window.location.pathname;
    
    // Split the path (e.g., 'home/academics-section' -> ['home', 'academics-section'])
    const parts = fullPath.split('/');
    const primaryPath = parts[0] || 'home'; 

    // Check if the primaryPath is actually a recognized page ID, otherwise default to home
    const pageElement = document.getElementById(primaryPath);
    return pageElement && pageElement.classList.contains('page-section') ? primaryPath : 'home';
}

function initializePublicRouting() {
    const targetPageId = getCleanPath();
    const isHomePage = targetPageId === 'home';
    
    // 1. Hide all page sections
    document.querySelectorAll('.page-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // 2. Show the target page section
    const targetSection = document.getElementById(targetPageId);
    if (targetSection) {
        targetSection.style.display = 'block';
    } else {
        // Fallback to home page if path is invalid/missing
        document.getElementById('home').style.display = 'block';
        return; 
    }

    // 3. Handle banner visibility
    const banner = document.querySelector('.top-banner-bg');
    
    if (banner) {
        // Hide the main home banner unless the page ID is explicitly 'home'
        banner.style.display = isHomePage ? 'flex' : 'none';
    }


    // 4. Trigger specific data loads for dynamic sections
    if (targetPageId === 'principal-message' && typeof window.loadPrincipalMessageContent === 'function') {
        window.loadPrincipalMessageContent();
    } else if (targetPageId === 'alumni' && typeof window.loadAlumniProfiles === 'function') {
        window.loadAlumniProfiles();
    } else if (targetPageId === 'faculty' && typeof window.loadFacultyProfiles === 'function') {
        window.loadFacultyProfiles();
    } else if (targetPageId === 'photogallery' && typeof window.loadPublicGallery === 'function') {
        loadPublicGallery('photo'); 
        loadPublicGallery('video');
    } 
    else if (targetPageId === 'achievements' && typeof window.loadAchievements === 'function') {
        window.loadAchievements();
    }
    else if (targetPageId === 'icse-isc-results' && typeof window.loadResults === 'function') {
        window.loadResults();
    }
    else if (targetPageId === 'administration' && typeof window.loadDisclosures === 'function') {
        window.loadDisclosures();
    }
    else if (targetPageId === 'rules' && typeof window.setupRulesAccordion === 'function') {
        window.setupRulesAccordion(); 
    }
    else if (targetPageId === 'admission' && typeof window.setupAdmissionMultiStepForm === 'function') {
        window.setupAdmissionMultiStepForm(); 
    }
    
    // 5. Navigation dropdown closing logic is now in setupRouting click listener
}
window.initializePublicRouting = initializePublicRouting; // Expose globally

// 5. Attach event listeners
document.addEventListener('DOMContentLoaded', () => {
    // FIX 1: Initial call on DOMContentLoaded
    initializePublicRouting(); 
    
    // **CRITICAL CHANGE**: The logic for a[data-page] clicks has been moved to setupRouting 
    // to handle the pushState and initial route processing.
    
    // Also, ensure a clean initial path if the URL is just '/'
    if (window.location.pathname === '/') {
        history.replaceState(null, null, '/home');
    }

    // The logic below is removed as it's handled in setupRouting now:
    /*
    document.querySelectorAll('a[data-page]').forEach(anchor => {
        // ... (removed click listener for simplified path-based routing) ...
    });
    */
});

// FIX 3: Set up listener for browser back/forward buttons (popstate)
window.addEventListener('popstate', () => {
    initializePublicRouting();
    // Re-run handleAnchorScroll with default 'smooth' behavior for back/forward buttons
    if (typeof window.handleAnchorScroll === 'function') {
        // Use smooth scroll for popstate (browser history navigation)
        window.handleAnchorScroll('smooth'); 
    } else {
        // Default scroll to top if not handling sub-anchors
        window.scrollTo({ top: 0, behavior: 'instant' });
    }
});


// =========================================================================
// ALL DATA FETCH AND RENDER LOGIC (UPDATED FETCH URLs)
// =========================================================================

async function loadAlumniProfiles() {
    const container = document.getElementById('alumni-profiles-container');
    if (!container) return; 
    container.innerHTML = '<p style="color: #444; text-align: center;">Fetching featured alumni...</p>';

    try {
        // 🚨 FIXED: Changed from /alumni to /api/alumni
        const response = await fetch(`${API_BASE}/api/alumni`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        // 🎯 NEW: Transformation for Alumni Image
        const alumniTransform = "w_150,h_150,c_fill,q_auto,f_auto,g_face";

        if (data.success && data.profiles.length > 0) {
            container.innerHTML = data.profiles.map(alumnus => {
                
                // Inject the transformation into the URL path
                let imageUrl = alumnus.cloudinaryUrl.replace('/upload/', `/upload/${alumniTransform}/`);

                return `
                    <div class="alumni-profile-wrapper">
                        <div class="alumni-info-card">
                            <div class="alumni-image-container">
                                <img src="${imageUrl}" alt="${alumnus.name}" class="alumni-profile-img" /> 
                            </div>
                         <h4 class="alumni-name">${alumnus.name}</h4> 
                         <p class="alumni-achievement">${alumnus.titleOrAchievement}</p>
                         ${alumnus.graduationYear ? `<p class="alumni-year">Graduated: ${alumnus.graduationYear}</p>` : ''}
                         </div>
                        <div class="alumni-description-box">
                            <h3>Alumni Overview</h3>
                            <p>${alumnus.description}</p>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p style="color: #444; text-align: center;">No alumni profiles have been added yet.</p>';
        }
    } catch (err) {
        console.error('Alumni load error:', err);
        container.innerHTML = `<p class="text-red-600 text-center">Error loading alumni profiles. (Check console)</p>`;
    }
}
window.loadAlumniProfiles = loadAlumniProfiles;


function createFacultyHtml(faculty, index) {
    const isReverse = index % 2 !== 0; 
    const layoutClass = isReverse ? 'reverse' : ''; 
    const animationClass = isReverse ? 'animate-right' : 'animate-left'; 
    
    // 🎯 NEW: Transformation for Faculty Image (w:350, h:350 for the card)
    const facultyTransform = "w_350,h_350,c_fill,q_auto,f_auto,g_face";
    let imageUrl = (faculty.cloudinaryUrl || './images/placeholder-staff.jpg');
    
    // Only apply transformation if it's a Cloudinary URL
    if (imageUrl.includes('/upload/')) {
         imageUrl = imageUrl.replace('/upload/', `/upload/${facultyTransform}/`);
    }

    return `
        <section class="faculty-section-layout">
            <div class="faculty-box-content-wrapper ${layoutClass} ${animationClass} js-animate-on-scroll"> 
                
                <div class="faculty-image-box">
                    <img src="${imageUrl}" alt="${faculty.name} Photo" /> 
                </div>
                
                <div class="faculty-text-box">
                    <h3 class="faculty-name">${faculty.name}</h3>
                    <span class="faculty-subj-qual">${faculty.subjectOrDesignation || 'N/A'} | ${faculty.qualification || 'N/A'}</span>
                    <p class="faculty-quote">"${faculty.description || 'A dedicated member of our teaching staff.'}"</p>
                </div>
            </div>
        </section>
    `;
}
function setupScrollAnimation() {
    const observerOptions = {
        root: null, 
        rootMargin: '0px',
        threshold: 0.2 
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated'); 
                observer.unobserve(entry.target); 
            }
        });
    }, observerOptions);

    document.querySelectorAll('.js-animate-on-scroll').forEach(section => {
        observer.observe(section);
    });
}
async function loadFacultyProfiles() {
    const container = document.getElementById('faculty-profiles-container');
    if (!container) return; 
    container.innerHTML = '<p style="color: #444; text-align: center;">Fetching faculty details...</p>';

    try {
        // 🚨 FIXED: Changed from /faculty to /api/faculty
        const response = await fetch(`${API_BASE}/api/faculty`); 
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        const profiles = Array.isArray(data.profiles) ? data.profiles : []; 
        
        if (profiles.length > 0) {
            container.innerHTML = profiles.map((faculty, index) => 
                createFacultyHtml(faculty, index)
            ).join('');
            
            setupScrollAnimation(); 
            
        } else {
            container.innerHTML = '<p style="color: #444; text-align: center;">No faculty profiles have been added yet.</p>';
        }
    } catch (err) {
        console.error('Faculty load error:', err);
        container.innerHTML = `<p class="text-red-600 text-center">Error loading faculty profiles. (Check console)</p>`;
    }
}
window.loadFacultyProfiles = loadFacultyProfiles; 


async function loadPublicGallery(type, page = 1) {
  const container = document.getElementById(type === 'photo' ? 'photos-container' : 'videos-container');
  const controlsContainer = document.getElementById(type === 'photo' ? 'photo-pagination-controls' : 'video-pagination-controls');
  const ITEMS_PER_PAGE = 9;

  container.innerHTML = `<p style="color: #444; text-align: center; grid-column: 1 / -1;">Fetching latest ${type}s...</p>`;
  if(controlsContainer) controlsContainer.innerHTML = '';
  
  try {
    // 🚨 FIXED: Changed from /gallery to /api/gallery
    const res = await fetch(`${API_BASE}/api/gallery`);
    
    if (!res.ok) {
        container.innerHTML = `<p class="text-red-600 text-center" style="grid-column: 1 / -1;">Error: Cannot connect to the server or fetch data. Status: ${res.status}</p>`;
        throw new Error(`HTTP ${res.status}`);
    }
    
    const data = await res.json();
    if (!data.success) throw new Error('API returned failure');

    const items = data.items.filter(i => i.type === type);

    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const visibleItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

   if (visibleItems.length > 0) {
       
        // 🎯 NEW: Transformation for Gallery Photos (500x500 square and optimized)
        const photoTransform = "w_500,h_500,c_fill,q_auto,f_auto"; 

        container.innerHTML = `
            <div class="gallery-wrapper">
                <div class="gallery-grid">
                ${visibleItems.map(item => {
                    
                    let mediaUrl = item.cloudinaryUrl;

                    if (item.type === 'photo') {
                        // Inject the transformation string into the URL path
                        mediaUrl = mediaUrl.replace('/upload/', `/upload/${photoTransform}/`);
                    } 
                    // Note: Video URLs are left as original Cloudinary URLs.
                    
                    const mediaTag = item.type === 'photo'
                        ? `<img src="${mediaUrl}" alt="${item.title}" class="gallery-media-img">`
                        : `<video controls playsinline preload="metadata" src="${mediaUrl}" class="gallery-media-img"></video>`;
                    
                    return `
                        <div class="gallery-content-card">
                            <div class="gallery-media-box-custom">
                                ${mediaTag}
                            </div>
                            
                        </div>
                    `;
                }).join('')}
                </div>
            </div>
        `;
        
        // 🎯 CRITICAL FIX: Anchor the scroll to the main content title area.
        const targetElement = document.querySelector('.about-us-main-wrapper .academics-main-heading');
        
        if (targetElement) {
            const headerHeight = document.querySelector('.top-header-bar').offsetHeight || 70;
            // Target the element's position minus the fixed header height
            const targetScrollPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;
            
            window.scrollTo({
                top: targetScrollPosition,
                behavior: 'instant' 
            });
        }
        // 🎯 END CRITICAL FIX

    } else {
        container.innerHTML = `<p style="color: #444; text-align: center; grid-column: 1 / -1;">No ${type}s available yet. Add some in the Admin panel!</p>`;
    }

   if(controlsContainer && totalPages > 1) {
        controlsContainer.innerHTML = `
            <div class="pagination-center-wrapper"> 
                <div class="pagination">
                    <button class="pagination-button" ${page === 1 ? 'disabled' : ''} onclick="loadPublicGallery('${type}', ${page - 1})">Previous</button>
                    <span class="pagination-text">Page <span class="current-page-number">${page}</span> of ${totalPages}</span>
                    <button class="pagination-button" ${page === totalPages ? 'disabled' : ''} onclick="loadPublicGallery('${type}', ${page + 1})">Next</button>
                </div>
            </div>
        `;
    } else if (controlsContainer) {
        controlsContainer.innerHTML = '';
    }

  } catch (err) {
    console.error('Gallery load error:', err);
    if (container.innerHTML.includes('Fetching latest')) {
        container.innerHTML = `<p class="text-red-600 text-center" style="grid-column: 1 / -1;">Error loading ${type} gallery. Please check your browser console for details.</p>`;
    }
  }
}
window.loadPublicGallery = loadPublicGallery;

async function loadPrincipalMessageContent() {
    const container = document.getElementById('principal-message-content');
    if (!container) return; 
    container.innerHTML = '<p style="color: #444; text-align: center;">Fetching message...</p>';

    try {
        // 🚨 FIXED: Changed from /principal-message to /api/principal-message
        const response = await fetch(`${API_BASE}/api/principal-message`); 
        
        if (!response.ok) {
            if (response.status === 404) {
                 return container.innerHTML = '<p style="color: #444; text-align: center;">No principal message is currently available. Add one via the Admin Panel.</p>';
            }
            throw new Error(`HTTP ${response.status}`);
        }
        
        // **CRITICAL FIX:** Read response as text first, then parse.
        const rawResponseText = await response.text(); 
        
        let data;
        try {
            data = JSON.parse(rawResponseText);
        } catch (e) {
            console.error('Failed to parse JSON response:', e, 'Raw text:', rawResponseText.substring(0, 200));
            // If parsing fails, display the raw text (which is the JSON string) as a temporary error.
            return container.innerHTML = `<p class="text-red-600 text-center">Parsing Error: Data received was not valid JSON. Check Admin Panel configuration.</p>`;
        }
        
        const profile = data.profile; 
        
        if (data.success && profile) {
            
            // 🎯 NEW: Transformation for Principal Photo (max width 450px, optimized)
            const principalPhotoTransform = "w_450,c_fill,q_auto,f_auto"; 
            let imageUrl = profile.cloudinaryUrl;

            if (imageUrl.includes('/upload/')) {
                 imageUrl = imageUrl.replace('/upload/', `/upload/${principalPhotoTransform}/`);
            }
            
            const tenureText = (profile.fromYear || profile.toYear) ? 
                                `<span class="principal-tenure-detail">${profile.fromYear || 'N/A'} - ${profile.toYear || 'Present'}</span>` : 
                                '';
            
            // ============================================================
            // *** CRITICAL FIX: Format the message text into paragraphs ***
            // 1. Replace all line breaks (\n, including \r\n from Windows) with </p><p> tags.
            // 2. Wrap the entire text in a starting <p> and ending </p> tag.
            // ============================================================
            const formattedMessageBlocks = `<p>${profile.messageText.replace(/\r?\n/g, '</p><p>')}</p>`;

            // Combine starting quote with the formatted paragraphs
            const messageContentWithQuotes = `<span class="start-quote-lg">“</span>${formattedMessageBlocks}`;
            
            container.innerHTML = `
                <div class="principal-content-box new-format-layout">
                    <div class="principal-image-box new-format-image">
                        <img src="${imageUrl || './images/principal_meghana_placeholder.jpg'}" 
                             alt="${profile.principalName}" 
                             class="principal-img new-format-img" />
                    </div>
                    
                    <div class="principal-quote-box new-format-quote">
                        
                        <div class="principal-message-text principal-long-quote">
                            ${messageContentWithQuotes}
                            <span class="end-quote-lg">”</span> 
                        </div>
                        

                        <div class="principal-signature-box">
                            <p class="principal-name-signature">
                                - Principal, ${profile.principalName}
                            </p>
                            ${tenureText}
                        </div>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = '<p style="color: #444; text-align: center;">No principal message is currently available. Add one via the Admin Panel.</p>';
        }
    } catch (err) {
        console.error('Principal Message load error:', err);
        container.innerHTML = `<p class="text-red-600 text-center">Error loading Principal's Message. (Check console)</p>`;
    }
}
window.loadPrincipalMessageContent = loadPrincipalMessageContent; 

async function loadAchievements() {
    const container = document.getElementById('achievements-display-container');
    if (!container) return; 

    // Reset container and ensure it's a grid container before starting load
    container.innerHTML = '<p style="color: #444; text-align: center; grid-column: 1 / -1;">Fetching latest achievements...</p>';
    container.style.display = 'grid'; // Ensure grid display for the cards

    try {
        // 🚨 FIXED: Changed from /achievements to /api/achievements
        const response = await fetch(`${API_BASE}/api/achievements`); 
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        const achievements = data.achievements || []; 
        
        // 🎯 NEW: Transformation for Achievement Images (400x400 square and optimized)
        const achievementTransform = "w_400,h_400,c_fill,q_auto,f_auto";

        if (data.success && achievements.length > 0) {
            container.innerHTML = achievements.map(ach => {
                
                let imageUrl = ach.cloudinaryUrl.replace('/upload/', `/upload/${achievementTransform}/`);
                
                return `
                    <div class="achievement-card">
                        <div class="achievement-image-box">
                            <img src="${imageUrl}" alt="${ach.title}" class="achievement-img" onerror="this.src='./images/placeholder-achievement.jpg';">
                        </div>
                        <div class="achievement-content">
                            <h3 class="achievement-title">${ach.title}</h3>
                            <p class="achievement-description">${ach.description}</p>
                        </div>
                    </div>
                `;
            }).join('');
            
        } else {
            container.innerHTML = '<p style="color: #444; text-align: center; grid-column: 1 / -1;">No school or student achievements have been added yet.</p>';
        }
    } catch (err) {
        console.error('Achievements load error:', err);
        container.innerHTML = `<p class="text-red-600 text-center" style="grid-column: 1 / -1;">Error loading achievements. (Check console)</p>`;
    }
}
window.loadAchievements = loadAchievements;

async function loadResults() {
    const container = document.getElementById('results-display-container');
    if (!container) return; 

    // Reset container
    container.innerHTML = '<p style="color: #444; text-align: center;">Fetching latest board results...</p>';
    container.style.display = 'block'; // Reset to block container for stacked sections

    try {
        // 🚨 FIXED: Changed from /results to /api/results
        const response = await fetch(`${API_BASE}/api/results`); 
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        const allResults = data.results || []; 
        
        // 🎯 NEW: Transformation for Result Photos (150x150, face-aware, optimized)
        const resultTransform = "w_150,h_150,c_fill,g_face,q_auto,f_auto"; 

        if (data.success && allResults.length > 0) {
            let icseResults = allResults.filter(r => r.type === 'ICSE');
            let iscResults = allResults.filter(r => r.type === 'ISC');
            
            const renderSection = (title, results, type) => {
                if (results.length === 0) return '';
                
                // Sort by percentage descending just in case the API endpoint didn't fully sort
                results.sort((a, b) => b.percentage - a.percentage);

                return `
                    <div class="result-section-wrapper">
                        <h3 class="result-section-title ${type.toLowerCase()}-color">${title}</h3>
                        <div class="result-cards-grid">
                            ${results.map(r => {
                                // Inject transformation into the image URL
                                let imageUrl = r.cloudinaryUrl.replace('/upload/', `/upload/${resultTransform}/`);
                                
                                return `
                                    <div class="result-card-item">
                                        <div class="result-photo-container ${type.toLowerCase()}-border">
                                            <img src="${imageUrl}" alt="${r.studentName}" class="result-photo" onerror="this.src='./images/placeholder-student.jpg';">
                                        </div>
                                        <div class="result-info">
                                            <p class="result-name">${r.studentName}</p>
                                            <p class="result-percentage ${type.toLowerCase()}-text-color">${r.percentage.toFixed(2)}%</p>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            };

            container.innerHTML = `
                ${renderSection('ICSE (Grade 10) Toppers', icseResults, 'ICSE')}
                ${renderSection('ISC (Grade 12) Toppers', iscResults, 'ISC')}
            `;
            
        } else {
            container.innerHTML = '<p style="color: #444; text-align: center;">No ICSE or ISC results have been added yet.</p>';
        }
    } catch (err) {
        console.error('Results load error:', err);
        container.innerHTML = `<p class="text-red-600 text-center">Error loading board results. (Check console)</p>`;
    }
}
window.loadResults = loadResults;

const DISCLOSURE_TYPES_PUBLIC = [
    'Affiliation',
    'NOC', // NEW TYPE
    'Minority Certificate', // NEW TYPE
    'Building Fitness Certificate' // NEW TYPE
];

async function loadDisclosures() {
    const container = document.getElementById('disclosure-display-container');
    if (!container) return; 

    // Reset container (important: now using grid, so center with grid-column)
    container.innerHTML = '<p style="color: #444; text-align: center; grid-column: 1 / -1;">Fetching mandatory disclosure documents...</p>';

    try {
        // 🚨 FIXED: Changed from /disclosure to /api/disclosure
        const response = await fetch(`${API_BASE}/api/disclosure`); 
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        const allDisclosures = data.disclosures || []; 

        if (data.success && allDisclosures.length > 0) {
            
            let html = '';
            
            // Loop through the fixed order of sections
            DISCLOSURE_TYPES_PUBLIC.forEach(type => {
                const list = allDisclosures.filter(d => d.type === type);
                
                // 🎯 CRITICAL FIX: The entire section is wrapped in disclosure-section-card 🎯
                html += `
                    <div class="disclosure-section-card">
                        <h3 class="disclosure-section-title">${type}</h3>
                        <div class="disclosure-list-group space-y-3">
                            ${list.length > 0 ? list.map(d => {
                                const isPdf = d.cloudinaryUrl.toLowerCase().endsWith('.pdf') || d.cloudinaryUrl.includes('f_pdf');
                                return `
                                    <a href="${d.cloudinaryUrl}" target="_blank" class="disclosure-item-link">
                                        <span class="disclosure-item-icon">${isPdf ? '📄' : '🖼️'}</span>
                                        <span class="disclosure-item-title">${d.title}</span>
                                        <span class="disclosure-item-action">View Document →</span>
                                    </a>
                                `;
                            }).join('') : 
                            `<p class="text-gray-500 text-sm italic p-3 bg-gray-50 rounded-lg">No official documents are currently uploaded for this category.</p>`}
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
            
        } else {
            container.innerHTML = '<p style="color: #444; text-align: center; grid-column: 1 / -1;">No mandatory disclosure documents are currently available.</p>';
        }
    } catch (err) {
        console.error('Disclosure load error:', err);
        container.innerHTML = `<p class="text-red-600 text-center" style="grid-column: 1 / -1;">Error loading disclosure documents. (Check console)</p>`;
    }
}
window.loadDisclosures = loadDisclosures;

// =========================================================================
// NEW: RULES PAGE ACCORDION LOGIC
// =========================================================================

function setupRulesAccordion() {
    const toggles = document.querySelectorAll('.accordion-toggle');

    toggles.forEach(toggle => {
        // Find the target content element ID from the data-target attribute
        const targetId = toggle.getAttribute('data-target');
        const content = document.getElementById(targetId);

        if (content) {
            // Check for initial state and apply base styles for transition
            if (!content.classList.contains('active')) {
                content.style.maxHeight = '0';
                content.style.paddingTop = '0';
                content.style.paddingBottom = '0';
                content.style.overflow = 'hidden';
                content.style.transition = 'max-height 0.4s ease-out, padding 0.4s ease-out';
                toggle.querySelector('.accordion-icon').textContent = '+';
            } else {
                // If marked active in HTML, set initial height (though typically accordions start closed)
                content.style.maxHeight = content.scrollHeight + 30 + 'px'; 
                content.style.paddingTop = '15px';
                content.style.paddingBottom = '15px';
                content.style.overflow = 'hidden';
                content.style.transition = 'max-height 0.4s ease-out, padding 0.4s ease-out';
                toggle.querySelector('.accordion-icon').textContent = '-';
            }

            // Remove previous listeners to prevent multiple toggles if the page is re-routed
            toggle.removeEventListener('click', toggleAccordionHandler);
            toggle.addEventListener('click', toggleAccordionHandler);
        }
    });
}

function toggleAccordionHandler() {
    const toggle = this;
    const targetId = toggle.getAttribute('data-target');
    const content = document.getElementById(targetId);

    if (content) {
        const isCurrentlyOpen = content.classList.contains('active');

        // Close all other open accordion items first
        document.querySelectorAll('.accordion-toggle').forEach(otherToggle => {
            const otherContentId = otherToggle.getAttribute('data-target');
            const otherContent = document.getElementById(otherContentId);

            if (otherContent && otherContent !== content && otherContent.classList.contains('active')) {
                otherContent.style.maxHeight = '0';
                otherContent.style.paddingTop = '0';
                otherContent.style.paddingBottom = '0';
                otherContent.classList.remove('active');
                otherToggle.querySelector('.accordion-icon').textContent = '+';
            }
        });

        // Toggle the clicked item
        if (isCurrentlyOpen) {
            content.style.maxHeight = '0';
            content.style.paddingTop = '0';
            content.style.paddingBottom = '0';
            toggle.querySelector('.accordion-icon').textContent = '+';
            content.classList.remove('active');
        } else {
            // Reset height to auto first, then calculate scrollHeight
            content.style.maxHeight = 'none'; 
            const scrollHeight = content.scrollHeight;
            
            // Set max-height to the calculated height to start the opening transition
            content.style.maxHeight = scrollHeight + 30 + 'px'; // +30px for padding
            content.style.paddingTop = '15px';
            content.style.paddingBottom = '15px';
            toggle.querySelector('.accordion-icon').textContent = '-';
            content.classList.add('active');
            
            // After transition finishes (optional, for optimization), set maxHeight back to 'none' 
            // so content expands properly if inner content changes.
            setTimeout(() => {
                if (content.classList.contains('active')) {
                    content.style.maxHeight = 'none';
                }
            }, 400); 
        }
    }
}

window.setupRulesAccordion = setupRulesAccordion;


// ... [window.handleFileUpload function] ...
window.handleFileUpload = function(event) {
    const fileInput = event.target;
    const fileNameDisplay = fileInput.parentElement.querySelector('.file-name');
    
    if (fileInput.files.length > 0) {
        const fileCount = fileInput.files.length;
        const fileName = fileCount === 1 ? fileInput.files[0].name : `${fileCount} files selected`;
        fileNameDisplay.textContent = `Attached: ${fileName}`;
    } else {
        fileNameDisplay.textContent = 'No file chosen';
    }
}

// ... [renderModal function] ...
function renderModal(title, message, isSuccess) {
    if (document.getElementById('submissionModal')) {
        document.getElementById('submissionModal').remove();
    }

    // 🎯 CRITICAL FIX 1: Temporarily set body overflow to hidden to prevent background scrolling
    // when the modal is open. This is key for mobile devices, resolving the invisibility issue.
    document.body.style.overflow = 'hidden'; 
    
    // 🎯 CRITICAL FIX 2: Define a function to clean up the body style and remove the modal.
    window.closeSubmissionModal = function() {
        document.getElementById('submissionModal').remove();
        document.body.style.overflow = ''; // Reset body overflow to default
    }

    const bgColor = isSuccess ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-100 border-red-500 text-red-800';
    const icon = isSuccess ? '✅' : '❌';
    const modalHtml = `
        <div id="submissionModal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1000]">
            <div class="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6 border-t-4 border-b-4 ${bgColor}">
                <div class="text-center">
                    <div class="text-4xl mb-3">${icon}</div>
                    <h3 class="text-xl font-bold mb-2">${title}</h3>
                    <p class="text-gray-600 mb-6">${message}</p>
                    <button onclick="closeSubmissionModal()" 
                            class="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition">
                        OKAY
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ... [window.handleSubmit function] ...
window.handleSubmit = async function(event) {
    event.preventDefault(); 
    
    // 🎯 CRITICAL: Final validation check before submission
    if (!validateStep(3)) {
        // Validation failed, which means the checkbox is not ticked. The function should stop here.
        return; 
    }
    
    const submitButton = event.submitter;
    const originalButtonContent = submitButton.innerHTML;
    const form = document.getElementById('admissionForm');
    const formData = new FormData(form);

    const backendUrl = `${API_BASE}/api/submit-application`; 

    // Disable button and checkbox during submission process
    submitButton.disabled = true;
    document.getElementById('declaration-agree').disabled = true; 
    
    submitButton.innerHTML = '<div class="spinner"></div> Submitting...';
    submitButton.classList.add('flex', 'items-center', 'justify-center');

    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            body: formData 
        });

        if (!response.ok) {
            let errorDetails = 'Unknown server error.';
            try {
                const errorJson = await response.json();
                errorDetails = errorJson.error || errorJson.message || errorDetails;
            } catch (e) {
                errorDetails = `Status ${response.status}: Failed to parse server response.`;
            }

            throw new Error(`Submission failed. Details: ${errorDetails}`);
        }
        
        // Success Modal (Remains)
        renderModal(
            "Application Submitted Successfully!",
             `Your application has been successfully submitted. We will contact you shortly.`,
            true
        );
        
        // Reset form fields and file names
        form.reset();
        document.querySelectorAll('#admissionForm .file-name').forEach(span => {
            span.textContent = 'No file chosen';
        });
        
        // Reset to Step 1 after successful submission
        showStep(1);

    } catch (error) {
        console.error('Admission Submission error:', error);

        // Failure Modal (Remains)
        renderModal(
            "Submission Failed",
            'An error occurred while submitting your application. Please check your internet connection or try again later. (See console for details)',
            false
        );

    } finally {
        // Re-enable the checkbox (it will be unchecked due to form.reset())
        document.getElementById('declaration-agree').disabled = false;
        
        // Reset submit button state, which will automatically disable it if the checkbox is unchecked
        toggleSubmitButton(document.getElementById('declaration-agree').checked);
        
        submitButton.innerHTML = originalButtonContent;
        submitButton.classList.remove('flex', 'items-center', 'justify-center');
    }
}


// =========================================================================
// NEW: MULTI-STEP ADMISSION FORM LOGIC 
// =========================================================================
let currentStep = 1;
const stepContainers = document.querySelectorAll('.multi-step-content'); 

/**
 * Validates the required fields for the current step.
 * @param {number} step - The current step number to validate.
 * @returns {boolean} - True if validation passes, false otherwise.
 */
function validateStep(step) {
    const currentContainer = document.getElementById(`step-${step}`);
    if (!currentContainer) return true;

    // Target all required inputs/selects/textareas/files within the current step
    const requiredFields = currentContainer.querySelectorAll('[required]');
    let isValid = true;
    
    // --- Phase 1: Check standard text/date inputs ---
    requiredFields.forEach(field => {
        // IMPORTANT: Clear any previous custom validity message first
        field.setCustomValidity(""); 
        
        const isFileUpload = field.type === 'file';

        if (!isFileUpload && field.value.trim() === '') {
            isValid = false;
            // Set the custom validation message (This triggers the tooltip on the next attempt)
            field.setCustomValidity("Please fill out this field.");
        } 
    });

    // --- Phase 2: Check file inputs (mainly Step 2: Required Documents) ---
    if (step === 2) {
         requiredFields.forEach(field => {
            if (field.type === 'file') {
                field.setCustomValidity(""); // Clear previous message
                
                if (field.files.length === 0) {
                    isValid = false;
                    field.setCustomValidity("Please fill out this field.");
                } 
            }
         });
    }
    
    // --- Phase 3: Check Declaration Checkbox (Step 3 only) ---
    if (step === 3) {
        const declarationCheckbox = document.getElementById('declaration-agree');
        // CRITICAL: Clear validity first, then check state.
        declarationCheckbox.setCustomValidity(""); 

        if (declarationCheckbox && !declarationCheckbox.checked) {
            isValid = false;
            // Set message only if unchecked
            declarationCheckbox.setCustomValidity("Please check this box to agree to the declaration.");
        } 
    }

    // CRITICAL: If validation fails, we manually call checkValidity() on one element 
    // to trigger the tooltip on the *first* invalid element.
    if (!isValid) {
        // Find the first invalid element that can show a validity bubble
        const firstInvalidField = Array.from(requiredFields).find(field => field.checkValidity() === false);
        if (firstInvalidField) {
            // Trigger the native browser tooltip on the invalid field
            firstInvalidField.reportValidity();
        }
    }

    // The function returns 'isValid', which determines if the user can proceed/submit.
    return isValid;
}

/**
 * Executes specific setup logic when the declaration step is shown.
 */
function setupDeclarationStep() {
    const declarationCheckbox = document.getElementById('declaration-agree');
    const submitButton = document.getElementById('admission-submit-final');
    
    // 1. Ensure the checkbox is NOT disabled 
    if (declarationCheckbox) {
        declarationCheckbox.disabled = false;
        
        // 2. Immediately call toggleSubmitButton to reflect the current checked state 
        toggleSubmitButton(declarationCheckbox.checked);

        // 3. Set the initial validity state based on checked status when the step loads
        if (declarationCheckbox.checked) {
            declarationCheckbox.setCustomValidity(""); 
        } else {
             declarationCheckbox.setCustomValidity("Please check this box to agree to the declaration."); 
        }

        // 4. Update the onchange handler logic to ensure it clears native validation message
        declarationCheckbox.onchange = function() {
            // Call the button toggle (which is the primary function of this handler)
            toggleSubmitButton(this.checked);
            
            // IMPORTANT: Manually clear/set the validation message to manage the native tooltip
            if (this.checked) {
                this.setCustomValidity(""); // Clear error when checked
            } else {
                this.setCustomValidity("Please check this box to agree to the declaration."); // Set error when unchecked
            }
        };
    } else if (submitButton) {
        toggleSubmitButton(false);
    }
}
window.setupDeclarationStep = setupDeclarationStep;


/**
 * Shows the target step and hides all others.
 * @param {number} step - The step number to display.
 */
function showStep(step) {
    const stepContainers = document.querySelectorAll('.multi-step-content'); 
    stepContainers.forEach(container => {
        if (parseInt(container.dataset.step) === step) {
            container.classList.remove('hidden');
            
            // 🆕 NEW: Call setup for the Declaration Step when it's displayed
            if (step === 3) {
                setupDeclarationStep(); 
            }
            
        } else {
            container.classList.add('hidden');
        }
    });
    currentStep = step;
}

/**
 * Toggles the disabled state and styling of the final submission button.
 * @param {boolean} isChecked - True if the declaration checkbox is ticked.
 */
function toggleSubmitButton(isChecked) {
    const submitButton = document.getElementById('admission-submit-final');
    if (submitButton) {
        // Submit button is enabled ONLY if the checkbox is checked (isChecked is true)
        submitButton.disabled = !isChecked;
        
        // Change button appearance to indicate disabled state
        if (!isChecked) {
            submitButton.classList.add('opacity-50', 'cursor-not-allowed');
            submitButton.classList.remove('shadow-lg', 'hover:bg-indigo-700', 'transform', 'hover:scale-[1.02]');
        } else {
            submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
            submitButton.classList.add('shadow-lg', 'hover:bg-indigo-700', 'transform', 'hover:scale-[1.02]');
        }
    }
}
window.toggleSubmitButton = toggleSubmitButton;


/**
 * Sets up event listeners for the navigation buttons.
 */
function setupAdmissionMultiStepForm() {
    // Initial display: only show step 1 on page load/initialization
    showStep(1); 
    
    // Add event listener to all navigation buttons
    const navButtons = document.querySelectorAll('.multi-step-nav');
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const nextStep = parseInt(this.dataset.nextStep);
            const prevStep = parseInt(this.dataset.prevStep);

            if (nextStep) {
                // If moving forward, run validation. If validation passes, proceed.
                if (validateStep(currentStep)) {
                    showStep(nextStep);
                } 
            } else if (prevStep) {
                // Moving backward: just switch the step without validation
                showStep(prevStep);
            }
        });
    });
}
window.setupAdmissionMultiStepForm = setupAdmissionMultiStepForm; // Expose globally


// Call the setup function when the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Ensure that if the path is '/admission', the form setup runs.
    if (window.location.pathname.includes('/admission') && document.getElementById('admissionForm') && document.querySelector('.multi-step-content')) {
        setupAdmissionMultiStepForm();
    }
});