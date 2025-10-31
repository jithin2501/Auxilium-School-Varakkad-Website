// public/js/admin.js

const API_BASE = 'http://localhost:3000'; // Set API_BASE to the server root for consistency
let currentUserRole = null; // Variable to store the user's role

document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    if (currentPath.endsWith('/admin')) {
        // Run the role check first to set currentUserRole and restrict UI
        checkUserRoleAndRestrictUI();

        window.showAdminSection = (sectionId) => {
            // CRITICAL FIX: Ensure currentUserRole is checked against a valid state (admin or null)
            // If the role hasn't been set yet (null), it defaults to preventing access just in case.
            if (sectionId === 'user-management' && currentUserRole !== 'superadmin') {
                alert("ACCESS DENIED: Only the Superadmin can access User Management.");
                // Fallback to a non-restricted section
                showAdminSection('applications');
                return; 
            }
            
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('bg-indigo-600'));
            document.getElementById(`nav-${sectionId}`).classList.add('bg-indigo-600');

            document.querySelectorAll('.admin-section').forEach(section => section.classList.add('hidden'));
            const targetSection = document.getElementById(`${sectionId}-section`);
            if (targetSection) {
                // Update title dynamically based on section
                document.getElementById('section-title').textContent =
                    sectionId === 'applications' ? 'ADMISSION APPLICATION' :
                    sectionId === 'gallery' ? 'Gallery Management' :
                    sectionId === 'alumni' ? 'Alumni Management' :
                    sectionId === 'faculty' ? 'Faculty & Staff Management' :
                    sectionId === 'principal-message' ? "Principal's Message" :
                    sectionId === 'achievements' ? 'Achievements Management' : 
                    sectionId === 'results' ? 'ICSE & ISC Results Management' : 
                    sectionId === 'disclosure' ? 'Public Disclosure Management' : // NEW
                    'User Management';
                targetSection.classList.remove('hidden');
            }

            // Execute the data fetch for the newly visible section
            if (sectionId === 'applications') {
                fetchApplications();
            } else if (sectionId === 'gallery') {
                fetchGalleryItems();
            } else if (sectionId === 'alumni') {
                fetchAlumniProfiles();
            } else if (sectionId === 'faculty') {
                fetchFacultyProfiles();
            } else if (sectionId === 'principal-message') { 
                fetchPrincipalMessage();
            } else if (sectionId === 'achievements') { 
                fetchAchievements();
            } else if (sectionId === 'results') { 
                fetchResults();
            } else if (sectionId === 'disclosure') { // NEW
                fetchDisclosureDocuments();
            } else if (sectionId === 'user-management') {
                fetchAdminUsers(); 
            }
        };

        // Initial load on dashboard page entry
        showAdminSection('applications');

        const galleryForm = document.getElementById('galleryUploadForm');
        if (galleryForm) galleryForm.addEventListener('submit', handleGalleryUpload);

        const createUserForm = document.getElementById('createUserForm');
        if (createUserForm) createUserForm.addEventListener('submit', handleCreateUser);

        const alumniUploadForm = document.getElementById('alumniUploadForm');
        if (alumniUploadForm) alumniUploadForm.addEventListener('submit', handleAlumniUpload);
        
        const facultyUploadForm = document.getElementById('facultyUploadForm');
        if (facultyUploadForm) facultyUploadForm.addEventListener('submit', handleFacultyUpload);

        const principalMessageForm = document.getElementById('principalMessageForm');
        if (principalMessageForm) principalMessageForm.addEventListener('submit', handlePrincipalMessageSubmit);

        // NEW: Event listeners for Achievements and Results
        const achievementUploadForm = document.getElementById('achievementUploadForm');
        if (achievementUploadForm) achievementUploadForm.addEventListener('submit', handleAchievementUpload);

        const resultUploadForm = document.getElementById('resultUploadForm');
        if (resultUploadForm) resultUploadForm.addEventListener('submit', handleResultUpload);
        
        // NEW: Event listener for Disclosure Documents
        const disclosureUploadForm = document.getElementById('disclosureUploadForm');
        if (disclosureUploadForm) disclosureUploadForm.addEventListener('submit', handleDisclosureUpload);
    }
});

// NEW FUNCTION: Check role and restrict navigation element
async function checkUserRoleAndRestrictUI() {
    const userManagementNav = document.getElementById('nav-user-management');
    if (!userManagementNav) return;

    try {
        // Fetch a protected endpoint to determine role/permission
        const response = await fetch(`${API_BASE}/admin/users`);
        
        if (response.status === 401 || response.status === 302) {
             // Not authenticated (will redirect on first restricted call)
             // Set role to lowest level to restrict UI until redirect happens
             currentUserRole = 'admin'; 
             return; 
        }

        if (response.status === 403) {
            // Authenticated but forbidden from /admin/users endpoint (i.e., they are an 'admin' role)
            currentUserRole = 'admin';
            userManagementNav.classList.add('bg-gray-700', 'text-gray-500', 'cursor-not-allowed');
            // IMPORTANT: Remove the onclick attribute that calls window.showAdminSection
            userManagementNav.removeAttribute('onclick');
            userManagementNav.addEventListener('click', (e) => {
                e.preventDefault();
                alert("ACCESS DENIED: Only the Superadmin can access User Management.");
            });
        } else if (response.ok) {
            // Authenticated and permitted access (i.e., they are a 'superadmin' role)
            const data = await response.json();
            // Assuming if the fetch is OK, they are a superadmin or the response explicitly contains the role
            currentUserRole = data.currentUserRole || 'superadmin';
            userManagementNav.classList.remove('bg-gray-700', 'text-gray-500', 'cursor-not-allowed');
            // Ensure onclick is restored if it was removed in a previous session (though typically not needed here)
            userManagementNav.setAttribute('onclick', "showAdminSection('user-management')");
        }

    } catch (error) {
        console.error('Role check failed:', error);
        // Default to restricted view on network error
        currentUserRole = 'admin';
        userManagementNav.classList.add('bg-gray-700', 'text-gray-500', 'cursor-not-allowed');
    }
}

// --- Utility: Status Message (remains the same) ---
function displayStatus(message, isSuccess = true) {
    const box = document.getElementById('status-message');
    box.textContent = message;
    box.classList.remove('hidden', 'bg-red-100', 'border-red-500', 'text-red-700', 'bg-green-100', 'border-green-500', 'text-green-700');

    if (isSuccess) {
        box.classList.add('bg-green-100', 'border-green-500', 'text-green-700');
    } else {
        box.classList.add('bg-red-100', 'border-red-500', 'text-red-700');
    }

    setTimeout(() => box.classList.add('hidden'), 5000);
}

function escapeHtml(str) {
    if (str === undefined || str === null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// =========================================================================
// PRINCIPAL MESSAGE MANAGEMENT LOGIC
// =========================================================================

/**
 * Renders the existing principal message for the admin dashboard.
 */
async function fetchPrincipalMessage() {
    const container = document.getElementById('existing-principal-messages');
    if (!container) return; 
    container.innerHTML = '<p class="text-gray-500 text-center">Loading current message...</p>';

    try {
        const response = await fetch(`${API_BASE}/admin/principal-message`, { credentials: 'include' });
        // CRITICAL: Check for redirects/unauthorized status
        if (response.status === 401 || response.status === 302) return window.location.replace('/admin');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        const messages = data.profiles || []; 

        if (data.success && messages.length > 0) {
            container.innerHTML = renderPrincipalMessageCard(messages[0]);
            
            // Populate the form with current message data for easy update
            populatePrincipalMessageForm(messages[0]);
        } else {
            container.innerHTML = '<p class="text-gray-500 text-center">No principal message currently saved. Use the form above to add one.</p>';
            populatePrincipalMessageForm({});
        }
    } catch (error) {
        console.error('Fetch Principal Message Error:', error);
        container.innerHTML = `<p class="text-red-600 text-center">Error loading principal message.</p>`;
    }
}

/**
 * Renders a single message card for the admin dashboard.
 */
function renderPrincipalMessageCard(message) {
    const safeName = escapeHtml(message.principalName);
    const safeQual = escapeHtml(message.qualification || 'N/A');
    const safeYears = `${escapeHtml(message.fromYear || 'N/A')} - ${escapeHtml(message.toYear || 'Present')}`;
    const safeMessageText = escapeHtml(message.messageText).substring(0, 300) + '...'; 
    const safeNameForDelete = safeName.replace(/'/g, "\\'");
    
    const safeJsonData = escapeHtml(JSON.stringify(message));

    return `
        <div id="message-card-${message._id}" 
             class="bg-white rounded-xl shadow-lg p-6 flex items-start space-x-6 border border-gray-100 relative"
             data-message-data='${safeJsonData}'>
            <div class="flex-shrink-0 w-32 text-center">
                <img src="${message.cloudinaryUrl}" alt="${safeName}"
                     class="w-32 h-32 object-cover rounded-full mx-auto mb-3 border-4 border-indigo-500">
                <h4 class="font-bold text-md text-gray-900">${safeName}</h4>
                <p class="text-sm text-gray-600">${safeQual}</p>
                <p class="text-xs text-indigo-600 mt-1">Tenure: ${safeYears}</p>
            </div>
            <div class="flex-1">
                <h5 class="font-semibold text-gray-800 mb-2">Message Preview:</h5>
                <p class="text-sm text-gray-700 italic mb-4">${safeMessageText}</p>
                <div class="flex gap-2">
                    <button onclick="handlePrincipalMessageDelete('${message._id}', '${safeNameForDelete}')"
                        class="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition">Delete</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Populates the submission form with data from the latest message (for updating).
 */
function populatePrincipalMessageForm(messageOrId) {
    const form = document.getElementById('principalMessageForm');
    if (!form) return;

    let message = {};
    if (typeof messageOrId === 'object' && messageOrId !== null) {
        message = messageOrId;
    } else if (typeof messageOrId === 'string') {
        const card = document.getElementById(`message-card-${messageOrId}`);
        const dataAttr = card.getAttribute('data-message-data');
        if (dataAttr) {
            try {
                message = JSON.parse(dataAttr.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
            } catch (e) {
                console.error('JSON parse error on card data:', e);
                return;
            }
        } else {
             return;
        }
    }

    form.dataset.messageId = message._id || '';
    form.elements.principalName.value = message.principalName || '';
    form.elements.qualification.value = message.qualification || '';
    form.elements.fromYear.value = message.fromYear || '';
    form.elements.toYear.value = message.toYear || '';
    form.elements.messageText.value = message.messageText || '';
    
    const photoInput = form.elements.principalPhoto;
    photoInput.value = null; 
    
    const photoLabelSpan = photoInput.closest('div').querySelector('.block.text-sm.font-medium.text-gray-700');

    if (message._id) {
        photoInput.removeAttribute('required'); 
        if (photoLabelSpan) {
            photoLabelSpan.innerHTML = "Principal Photo (Optional for Update)";
        }
    } else {
        photoInput.setAttribute('required', 'required');
        if (photoLabelSpan) {
            photoLabelSpan.innerHTML = "Principal Photo (Required for New Message/Optional for Update) <span class='text-red-500'>*</span>";
        }
    }
}


/**
 * Handles submission (POST/PUT) of the Principal's Message form.
 */
async function handlePrincipalMessageSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const button = document.getElementById('principal-msg-submit-btn');
    const originalText = button.innerHTML;
    const messageId = form.dataset.messageId;

    button.disabled = true;
    button.innerHTML = '<div class="spinner mr-2"></div> Saving...';
    button.classList.add('flex', 'items-center', 'justify-center');

    try {
        const url = messageId ? `${API_BASE}/admin/principal-message/${messageId}` : `${API_BASE}/admin/principal-message`;
        const method = messageId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            body: new FormData(form),
            credentials: 'include'
        });

        if (response.status === 401 || response.status === 302) return window.location.replace('/admin');
        
        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: `Server error or received non-JSON response (Status: ${response.status}).` }));
            throw new Error(err.message || 'Submission failed.');
        }

        displayStatus(`Principal's Message ${messageId ? 'updated' : 'created'} successfully!`, true);
        form.reset();
        
        fetchPrincipalMessage(); 
        
        populatePrincipalMessageForm({});

    } catch (err) {
        console.error('Principal Message Submission Error:', err);
        displayStatus(`Submission failed: ${err.message}`, false);
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
        button.classList.remove('flex', 'items-center', 'justify-center');
    }
}


/**
 * Handles deletion of the Principal's Message.
 */
window.handlePrincipalMessageDelete = async function (id, name) {
    const confirmDelete = prompt(`Type DELETE to confirm deletion for the Principal's Message by "${name}". This is the *only* active message.\nType 'DELETE' to confirm.`);
    if (confirmDelete !== 'DELETE') return displayStatus('Deletion cancelled.', false);

    try {
        const res = await fetch(`${API_BASE}/admin/principal-message/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);

        displayStatus(`Principal's Message by "${name}" deleted successfully!`, true);
        fetchPrincipalMessage();
        
        populatePrincipalMessageForm({});
    } catch (err) {
        console.error('Principal Message Delete Error:', err);
        displayStatus(`Deletion failed: ${err.message}`, false);
    }
};

// =========================================================================
// END PRINCIPAL MESSAGE MANAGEMENT LOGIC
// =========================================================================

// =========================================================================
// FACULTY MANAGEMENT LOGIC (EXISTING)
// =========================================================================

async function fetchFacultyProfiles() {
    const container = document.getElementById('existing-faculty-profiles');
    if (!container) return; 
    container.innerHTML = '<p class="text-gray-500 text-center col-span-full">Loading faculty profiles...</p>';

    try {
        const response = await fetch(`${API_BASE}/faculty`); 
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        const profiles = data.profiles || []; 

        if (data.success && profiles.length > 0) {
            container.innerHTML = profiles.map(renderFacultyCard).join('');
        } else {
            container.innerHTML = '<p class="text-gray-500 text-center col-span-full">No faculty profiles added yet.</p>';
        }
    } catch (error) {
        console.error('Fetch Faculty Error:', error);
        container.innerHTML = `<p class="text-red-600 text-center col-span-full">Error loading faculty profiles.</p>`;
    }
}

async function handleFacultyUpload(event) {
    event.preventDefault();
    const form = event.target;
    const button = document.getElementById('faculty-submit-btn');
    const originalText = button.innerHTML;

    button.disabled = true;
    button.innerHTML = '<div class="spinner mr-2"></div> Uploading...';
    button.classList.add('flex', 'items-center', 'justify-center');

    try {
        const response = await fetch(`${API_BASE}/admin/faculty`, {
            method: 'POST',
            body: new FormData(form),
            credentials: 'include'
        });

        if (response.status === 401 || response.status === 302) return window.location.replace('/admin');
        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: `Server error or received non-JSON response (Status: ${response.status}).` }));
            throw new Error(err.message || 'Upload failed.');
        }

        displayStatus('Faculty profile uploaded successfully!', true);
        form.reset();
        fetchFacultyProfiles();
    } catch (err) {
        console.error('Faculty Upload Error:', err);
        displayStatus(`Upload failed: ${err.message}`, false);
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
        button.classList.remove('flex', 'items-center', 'justify-center');
    }
}

function renderFacultyCard(faculty) {
    const safeName = escapeHtml(faculty.name);
    const safeSubj = escapeHtml(faculty.subjectOrDesignation);
    const safeQual = escapeHtml(faculty.qualification);
    const safeDesc = escapeHtml(faculty.description);
    
    const jsonData = JSON.stringify(faculty);
    
    const safeJsonData = escapeHtml(jsonData); 
    
    const safeNameForDelete = safeName.replace(/'/g, "\\'");

    return `
        <div id="faculty-card-${faculty._id}" 
             class="bg-white rounded-xl shadow-lg p-4 flex flex-col items-center text-center space-y-3 border border-gray-100 relative"
             data-faculty-data='${safeJsonData}'> 
            
            <div class="flex-shrink-0 w-32 h-32 text-center">
                <img src="${faculty.cloudinaryUrl}" alt="${safeName}"
                     class="w-full h-full object-cover rounded-full mx-auto mb-3 border-4 border-indigo-500">
            </div>
            
            <div class="flex-1 w-full">
                <h4 class="font-bold text-lg text-gray-900">${safeName}</h4>
                <p class="text-sm text-indigo-600 font-semibold">${safeSubj}</p>
                <p class="text-xs text-gray-500 mb-2">${safeQual}</p>
                <p class="text-sm text-gray-700 italic mb-4">"${safeDesc}"</p>
                
                <div class="flex justify-center gap-2">
                    <button onclick="renderFacultyEditModal('${faculty._id}')"
                        class="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition">Edit</button>
                    <button onclick="handleFacultyDelete('${faculty._id}', '${safeNameForDelete}')"
                        class="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition">Delete</button>
                </div>
            </div>
        </div>
    `;
}

window.renderFacultyEditModal = function (facultyId) {
    const modalId = 'editFacultyModal';
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const card = document.getElementById(`faculty-card-${facultyId}`);
    if (!card) return displayStatus('Profile not found.', false);

    const dataAttr = card.getAttribute('data-faculty-data');
    if (!dataAttr) return displayStatus('Missing profile data.', false);

    let faculty;
    try {
        faculty = JSON.parse(dataAttr.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
    } catch (e) {
        console.error('JSON parse error:', e);
        return displayStatus('Invalid profile data.', false);
    }

    const modal = `
        <div id="${modalId}" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 relative">
                <button class="absolute top-3 right-3 text-gray-600 hover:text-black text-xl font-bold"
                    onclick="document.getElementById('${modalId}').remove()">&times;</button>
                <h2 class="text-2xl font-bold mb-6 text-indigo-700">Edit Faculty Profile</h2>

                <form id="facultyEditForm" onsubmit="handleFacultyUpdate(event, '${facultyId}')">
                    <div class="space-y-4">
                        <label class="block">
                            <span class="text-gray-700 font-semibold">Full Name:</span>
                            <input type="text" name="name" value="${escapeHtml(faculty.name)}" required
                                class="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        </label>
                        <label class="block">
                            <span class="text-gray-700 font-semibold">Subject / Designation:</span>
                            <input type="text" name="subjectOrDesignation" value="${escapeHtml(faculty.subjectOrDesignation)}" required
                                class="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        </label>
                        <label class="block">
                            <span class="text-gray-700 font-semibold">Qualification:</span>
                            <input type="text" name="qualification" value="${escapeHtml(faculty.qualification)}" required
                                class="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        </label>
                        <label class="block">
                            <span class="text-gray-700 font-semibold">Description / Quote:</span>
                            <textarea name="description" maxlength="500" required
                                class="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">${escapeHtml(faculty.description)}</textarea>
                        </label>
                    </div>

                    <div class="flex justify-end space-x-3 mt-6">
                        <button type="button" onclick="document.getElementById('${modalId}').remove()"
                            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" id="update-faculty-btn"
                            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modal);
};

window.handleFacultyUpdate = async function (event, facultyId) {
    event.preventDefault();

    const form = event.target;
    const button = document.getElementById('update-faculty-btn');
    const originalText = button.innerHTML;

    const updatedData = {
        name: form.elements.name.value.trim(),
        subjectOrDesignation: form.elements.subjectOrDesignation.value.trim(),
        qualification: form.elements.qualification.value.trim(),
        description: form.elements.description.value.trim()
    };

    button.disabled = true;
    button.innerHTML = '<div class="spinner mr-2"></div> Saving...';
    button.classList.add('flex', 'items-center', 'justify-center');

    try {
        const res = await fetch(`${API_BASE}/admin/faculty/${facultyId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (res.status === 401 || res.status === 302) return window.location.replace('/admin');
        const data = await res.json();

        if (!res.ok || !data.success) throw new Error(data.message || 'Update failed.');

        displayStatus('Faculty profile updated successfully!', true);
        document.getElementById('editFacultyModal')?.remove();
        fetchFacultyProfiles();
    } catch (err) {
        console.error('Faculty Update Error:', err);
        displayStatus(`Update failed: ${err.message}`, false);
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
        button.classList.remove('flex', 'items-center', 'justify-center');
    }
};

window.handleFacultyDelete = async function (id, name) {
    const confirmDelete = prompt(`Type DELETE to confirm deletion for faculty member "${name}"`);
    if (confirmDelete !== 'DELETE') return displayStatus('Deletion cancelled.', false);

    try {
        const res = await fetch(`${API_BASE}/admin/faculty/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);

        displayStatus(`Faculty member "${name}" deleted successfully!`, true);
        fetchFacultyProfiles();
    } catch (err) {
        console.error('Faculty Delete Error:', err);
        displayStatus(`Deletion failed: ${err.message}`, false);
    }
};

// =========================================================================
// END FACULTY MANAGEMENT LOGIC
// =========================================================================


// =========================================================================
// ALUMNI MANAGEMENT LOGIC (EXISTING)
// =========================================================================

async function fetchAlumniProfiles() {
    const container = document.getElementById('existing-alumni-profiles');
    container.innerHTML = '<p class="text-gray-500 text-center">Loading alumni profiles...</p>';

    try {
        const response = await fetch(`${API_BASE}/alumni`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (data.success && data.profiles.length > 0) {
            container.innerHTML = data.profiles.map(renderAlumnusCard).join('');
        } else {
            container.innerHTML = '<p class="text-gray-500 text-center">No alumni profiles added yet.</p>';
        }
    } catch (error) {
        console.error('Fetch Alumni Error:', error);
        container.innerHTML = `<p class="text-red-600 text-center">Error loading alumni profiles.</p>`;
    }
}

async function handleAlumniUpload(event) {
    event.preventDefault();
    const form = event.target;
    const button = document.getElementById('alumni-submit-btn');
    const originalText = button.innerHTML;

    button.disabled = true;
    button.innerHTML = '<div class="spinner mr-2"></div> Uploading...';
    button.classList.add('flex', 'items-center', 'justify-center');

    try {
        const response = await fetch(`${API_BASE}/admin/alumni`, {
            method: 'POST',
            body: new FormData(form),
            credentials: 'include'
        });

        if (response.status === 401 || response.status === 302) return window.location.replace('/admin');
        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: `Server error or received non-JSON response (Status: ${response.status}).` }));
            throw new Error(err.message || 'Upload failed.');
        }

        displayStatus('Alumnus profile uploaded successfully!', true);
        form.reset();
        fetchAlumniProfiles();
    } catch (err) {
        console.error('Alumni Upload Error:', err);
        displayStatus(`Upload failed: ${err.message}`, false);
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
        button.classList.remove('flex', 'items-center', 'justify-center');
    }
}

function renderAlumnusCard(alumnus) {
    const safeName = escapeHtml(alumnus.name);
    const safeTitle = escapeHtml(alumnus.titleOrAchievement);
    const safeDesc = escapeHtml(alumnus.description);
    const safeYear = escapeHtml(alumnus.graduationYear || 'N/A');
    
    const safeJsonData = escapeHtml(JSON.stringify(alumnus));
    
    const safeNameForDelete = safeName.replace(/'/g, "\\'");

    return `
        <div id="alumnus-card-${alumnus._id}" 
             class="bg-white rounded-xl shadow-lg p-6 flex items-start space-x-6 border border-gray-100 relative"
             data-alumnus-data='${safeJsonData}'>
            <div class="flex-shrink-0 w-32 text-center">
                <img src="${alumnus.cloudinaryUrl}" alt="${safeName}"
                     class="w-32 h-32 object-cover rounded-full mx-auto mb-3 border-4 border-indigo-500">
                <h4 class="font-bold text-md text-gray-900">${safeName}</h4>
                <p class="text-sm text-indigo-600">${safeTitle}</p>
                <p class="text-xs text-gray-500 mt-1">Graduated: ${safeYear}</p>
            </div>
            <div class="flex-1">
                <p class="text-sm text-gray-700 mb-4">${safeDesc}</p>
                <div class="flex gap-2">
                    <button onclick="renderAlumnusEditModal('${alumnus._id}')"
                        class="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition">Edit</button>
                    <button onclick="handleAlumnusDelete('${alumnus._id}', '${safeNameForDelete}')"
                        class="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition">Delete</button>
                </div>
            </div>
        </div>
    `;
}

window.renderAlumnusEditModal = function (alumnusId) {
    const modalId = 'editAlumnusModal';
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const card = document.getElementById(`alumnus-card-${alumnusId}`);
    if (!card) return displayStatus('Profile not found.', false);

    const dataAttr = card.getAttribute('data-alumnus-data');
    if (!dataAttr) return displayStatus('Missing profile data.', false);

    let alumnus;
    try {
        const unescapedData = dataAttr.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        alumnus = JSON.parse(unescapedData);
    } catch (e) {
        console.error('JSON parse error:', e);
        return displayStatus('Invalid profile data.', false);
    }

    const currentYear = alumnus.graduationYear || '';

    const modal = `
        <div id="${modalId}" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 relative">
                <button class="absolute top-3 right-3 text-gray-600 hover:text-black text-xl font-bold"
                    onclick="document.getElementById('${modalId}').remove()">&times;</button>
                <h2 class="text-2xl font-bold mb-6 text-indigo-700">Edit Alumni Profile</h2>

                <form id="alumnusEditForm" onsubmit="handleAlumnusUpdate(event, '${alumnusId}')">
                    <div class="space-y-4">
                        <label class="block">
                            <span class="text-gray-700 font-semibold">Full Name:</span>
                            <input type="text" name="name" value="${escapeHtml(alumnus.name)}" required
                                class="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        </label>
                        <label class="block">
                            <span class="text-gray-700 font-semibold">Title / Achievement:</span>
                            <input type="text" name="titleOrAchievement" value="${escapeHtml(alumnus.titleOrAchievement)}"
                                class="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        </label>
                        <label class="block">
                            <span class="text-gray-700 font-semibold">Graduation Year:</span>
                            <input type="text" name="graduationYear" value="${escapeHtml(currentYear)}"
                                class="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., 2010">
                        </label>
                        <label class="block">
                            <span class="text-gray-700 font-semibold">Description / Bio:</span>
                            <textarea name="description" maxlength="800" required
                                class="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">${escapeHtml(alumnus.description)}</textarea>
                        </label>
                    </div>

                    <div class="flex justify-end space-x-3 mt-6">
                        <button type="button" onclick="document.getElementById('${modalId}').remove()"
                            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" id="update-alumnus-btn"
                            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modal);
};

window.handleAlumnusUpdate = async function (event, alumnusId) {
    event.preventDefault();
    console.log("✅ handleAlumnusUpdate triggered for:", alumnusId);

    const form = event.target;
    const button = document.getElementById('update-alumnus-btn');
    const originalText = button.innerHTML;

    const updatedData = {
        name: form.elements.name.value.trim(),
        titleOrAchievement: form.elements.titleOrAchievement.value.trim(),
        graduationYear: form.elements.graduationYear.value.trim(),
        description: form.elements.description.value.trim()
    };

    console.log("Updating alumnus ID:", alumnusId, "Data:", updatedData);

    button.disabled = true;
    button.innerHTML = '<div class="spinner mr-2"></div> Saving...';
    button.classList.add('flex', 'items-center', 'justify-center');

    try {
        const res = await fetch(`${API_BASE}/admin/alumni/${alumnusId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (res.status === 401 || res.status === 302) return window.location.replace('/admin');
        const data = await res.json();

        if (!res.ok || !data.success) throw new Error(data.message || 'Update failed.');

        displayStatus('Alumnus profile updated successfully!', true);
        document.getElementById('editAlumnusModal')?.remove();
        fetchAlumniProfiles();
    } catch (err) {
        console.error('Alumnus Update Error:', err);
        displayStatus(`Update failed: ${err.message}`, false);
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
        button.classList.remove('flex', 'items-center', 'justify-center');
    }
};

window.handleAlumnusDelete = async function (id, name) {
    const confirmDelete = prompt(`Type DELETE to confirm deletion for "${name}"`);
    if (confirmDelete !== 'DELETE') return displayStatus('Deletion cancelled.', false);

    try {
        const res = await fetch(`${API_BASE}/admin/alumni/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);

        displayStatus(`Alumnus "${name}" deleted successfully!`, true);
        fetchAlumniProfiles();
    } catch (err) {
        console.error('Alumnus Delete Error:', err);
        displayStatus(`Deletion failed: ${err.message}`, false);
    }
};

// =========================================================================
// END ALUMNI MANAGEMENT LOGIC
// =========================================================================


// --- Fetch Applications (remains the same) ---
async function fetchApplications() {
    const section = document.getElementById('applications-section').querySelector('.bg-white');
    section.innerHTML = '<p class="text-gray-500 text-center">Loading applications...</p>';

    try {
        const response = await fetch(`${API_BASE}/admin/applications`);
        if (response.status === 302 || response.status === 401) return window.location.replace('/admin');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        if (data.success && data.applications.length > 0) {
            section.innerHTML = renderApplicationsTable(data.applications);
        } else {
            section.innerHTML = '<p class="text-gray-500 text-center">No applications or messages submitted yet.</p>';
        }
    } catch (error) {
        console.error('Fetch Applications Error:', error);
        section.innerHTML = `<p class="text-red-600 text-center">Error: Cannot connect to server or authentication failed.</p>`;
    }
}

// --- Fetch Gallery Items (remains the same) ---
async function fetchGalleryItems() {
    const container = document.getElementById('existing-gallery-items');
    container.innerHTML = '<p class="text-gray-500 text-center col-span-full">Loading gallery items...</p>';

    try {
        const response = await fetch(`${API_BASE}/gallery`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (data.success && data.items.length > 0) {
            container.innerHTML = data.items.map(renderGalleryCard).join('');
        } else {
            container.innerHTML = '<p class="text-gray-500 text-center col-span-full">No gallery items uploaded yet.</p>';
        }
    } catch (error) {
        console.error('Fetch Gallery Error:', error);
        container.innerHTML = `<p class="text-red-600 text-center col-span-full">Error: Cannot connect to server or authentication failed.</p>`;
    }
}

// --- Gallery Upload (remains the same) ---
async function handleGalleryUpload(event) {
    event.preventDefault();
    const form = event.target;
    const button = document.getElementById('gallery-submit-btn');
    const originalText = button.innerHTML;

    button.disabled = true;
    button.innerHTML = '<div class="spinner mr-2"></div> Uploading...';
    button.classList.add('flex', 'items-center', 'justify-center');

    try {
        const response = await fetch(`${API_BASE}/admin/gallery/upload`, { method: 'POST', body: new FormData(form) });
        
        // CRITICAL FIX: Check for 401 or 302 first.
        if (response.status === 302 || response.status === 401) return window.location.replace('/admin');
        
        if (!response.ok) {
            // Attempt to read JSON error message, fall back to generic if parsing fails
            const errorJson = await response.json().catch(() => ({ message: `Server error or received non-JSON response (Status: ${response.status}).` }));
            throw new Error(errorJson.message || `Upload failed with status ${response.status}.`);
        }

        displayStatus('Gallery item uploaded successfully!', true);
        form.reset();
        fetchGalleryItems();
    } catch (error) {
        console.error('Gallery Upload Error:', error);
        const errorMessage = error.message.includes('MulterError: File too large') ? 
                             'Upload failed: File is too large. Max size is 100MB for gallery items.' : 
                             `Upload failed: ${error.message}`;
                             
        displayStatus(errorMessage, false);
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
        button.classList.remove('flex', 'items-center', 'justify-center');
    }
}

// --- Gallery Delete (remains the same) ---
window.handleGalleryDelete = async function(itemId, title) {
    const confirmation = prompt(`Are you sure you want to DELETE "${title}"?\nType 'DELETE' to confirm.`);
    if (confirmation !== 'DELETE') return displayStatus('Deletion cancelled.', false);

    const itemCard = document.getElementById(`gallery-item-${itemId}`);
    if (itemCard) itemCard.innerHTML = '<div class="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center"><p class="text-red-600 font-semibold">Deleting...</p></div>';

    try {
        const response = await fetch(`${API_BASE}/admin/gallery/${itemId}`, { method: 'DELETE' });
        if (response.status === 302 || response.status === 401) return window.location.replace('/admin');
        if (!response.ok) {
            const errorJson = await response.json();
            throw new Error(errorJson.message || `Update failed with status ${response.status}.`);
        }

        displayStatus(`Gallery item "${title}" deleted successfully!`, true);
        itemCard.remove();
    } catch (error) {
        console.error('Gallery Deletion Error:', error);
        displayStatus(`Deletion failed: ${error.message}`, false);
        fetchGalleryItems();
    }
};


// =========================================================================
// USER MANAGEMENT LOGIC (EXISTING)
// =========================================================================

async function fetchAdminUsers() {
    const section = document.getElementById('user-management-section');
    let container = section.querySelector('#admin-user-list');
    const formWrapper = section.querySelector('.bg-white.p-6.rounded-xl.shadow-lg');
    
    if (!container) {
        if (formWrapper) {
            formWrapper.insertAdjacentHTML('afterend', '<h3 class="text-2xl font-bold text-gray-800 my-4 pt-4 border-t">Existing Admin Users</h3><div id="admin-user-list"><p class="text-gray-500 text-center">Loading admin users...</p></div>');
            container = section.querySelector('#admin-user-list');
        } else {
             container = section; 
        }
    }


    container.innerHTML = '<p class="text-gray-500 text-center">Loading admin users...</p>';

    try {
        const response = await fetch(`${API_BASE}/admin/users`);
        if (response.status === 401 || response.status === 302) return window.location.replace('/admin');

        if (response.status === 403) {
             container.innerHTML = `<p class="text-red-600 text-center font-bold text-lg p-8">❌ ACCESS DENIED: Only the Superadmin can view and manage user accounts.</p>`;
             if (formWrapper) formWrapper.classList.add('hidden');
             return;
        }
        
        if (formWrapper) formWrapper.classList.remove('hidden');


        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (data.success && data.users.length > 0) {
            container.innerHTML = renderAdminUsers(data.users, data.currentUserRole); 
        } else {
            container.innerHTML = '<p class="text-gray-500 text-center">No admin users found.</p>';
        }
    } catch (error) {
        console.error('Fetch Admin Users Error:', error);
        container.innerHTML = `<p class="text-red-600 text-center">Error loading admin users. Check server console.</p>`;
    }
}

function renderAdminUsers(users, currentUserRole) {
    const canDelete = currentUserRole === 'superadmin';

    return `
        <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                        <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${users.map(user => {
                        const isSuperAdminUser = user.role === 'superadmin';
                        const safeUsername = escapeHtml(user.username).replace(/'/g, "\\'");
                        const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never';

                        return `
                            <tr id="user-row-${user._id}" class="hover:bg-gray-50 transition">
                                <td class="px-6 py-4 text-sm font-medium text-gray-900">${escapeHtml(user.username)}</td>
                                <td class="px-6 py-4 text-sm">
                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isSuperAdminUser ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}">
                                        ${escapeHtml(user.role)}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-500">${lastLogin}</td>
                                <td class="px-6 py-4 text-center">
                                    ${canDelete && !isSuperAdminUser ? `
                                        <button onclick="handleDeleteUser('${user._id}', '${safeUsername}')" 
                                            class="bg-red-500 text-white text-xs px-3 py-1 rounded-full hover:bg-red-600 transition">
                                            Delete
                                        </button>
                                    ` : `
                                        <button disabled 
                                            class="bg-gray-300 text-gray-500 text-xs px-3 py-1 rounded-full cursor-not-allowed"
                                            title="${isSuperAdminUser ? 'Cannot delete Superadmin' : 'Superadmin permission required'}">
                                            Delete
                                        </button>
                                    `}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

window.handleDeleteUser = async function(userId, username) {
    const confirmation = prompt(`Type DELETE to confirm deletion for admin user "${username}". This action cannot be undone.`);
    if (confirmation !== 'DELETE') return displayStatus('Deletion cancelled.', false);

    const userRow = document.getElementById(`user-row-${userId}`);
    if (userRow) userRow.style.opacity = '0.5';

    try {
        const response = await fetch(`${API_BASE}/admin/users/${userId}`, { 
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.status === 401 || response.status === 302) return window.location.replace('/admin');
        if (!response.ok) {
            const errorJson = await response.json();
            throw new Error(errorJson.message || `Deletion failed with status ${response.status}.`);
        }

        displayStatus(`Admin user "${username}" deleted successfully!`, true);
        fetchAdminUsers();
    } catch (error) {
        console.error('User Deletion Error:', error);
        displayStatus(`Deletion failed: ${error.message}`, false);
        if (userRow) userRow.style.opacity = '1'; 
        fetchAdminUsers();
    }
};


async function handleCreateUser(event) {
    event.preventDefault();
    const form = event.target;
    const button = form.querySelector('#create-user-btn');
    const originalText = button.innerHTML;

    button.disabled = true;
    button.innerHTML = '<div class="spinner mr-2"></div> Creating...';
    button.classList.add('flex', 'items-center', 'justify-center');
    
    const userData = {
        username: form.elements.username.value,
        password: form.elements.password.value
    };

    try {
        const response = await fetch(`${API_BASE}/admin/create-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (response.status === 302 || response.status === 401) return window.location.replace('/admin');
        
        if (response.status === 403) {
            const errorJson = await response.json();
            throw new Error(errorJson.message || 'Forbidden: Superadmin access required.');
        }

        if (!response.ok) {
            const errorJson = await response.json().catch(() => ({ message: `Server error or received non-JSON response (Status: ${response.status}).` }));
            throw new Error(errorJson.message || `Creation failed with status ${response.status}.`);
        }

        displayStatus(`Admin user ${userData.username} created successfully!`, true);
        form.reset();
        fetchAdminUsers();
        
    } catch (error) {
        console.error('User Creation Error:', error);
        let errorMessage = 'Creation failed.';
        if (error.message.includes('User already exists')) {
             errorMessage = 'Creation failed: This username is already taken.';
        } else if (error.message.includes('password')) {
             errorMessage = 'Creation failed: Password is too weak or invalid.';
        } else {
             errorMessage = `Creation failed: ${error.message}`;
        }
        displayStatus(errorMessage, false);
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
        button.classList.remove('flex', 'items-center', 'justify-center');
    }
}


// =========================================================================
// GALLERY MANAGEMENT LOGIC (EXISTING)
// =========================================================================

// ... (existing gallery functions) ...

window.renderGalleryEditModal = function(itemId) {
    const modalId = 'editGalleryModal';
    
    const dataElement = document.getElementById(`data-${itemId}`);
    if (!dataElement) {
        return console.error("Error: Could not find data for item ID:", itemId);
    }
    const item = JSON.parse(dataElement.textContent);

    if (document.getElementById(modalId)) {
        document.getElementById(modalId).remove();
    }

    const modalHtml = `
        <div id="${modalId}" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 relative overflow-y-auto max-h-[90vh]">
                <button class="absolute top-3 right-3 text-gray-600 hover:text-black text-xl font-bold" 
                        onclick="document.getElementById('${modalId}').remove()">×</button>
                <h2 class="text-2xl font-bold mb-6 text-indigo-700">Edit Gallery Item (${item.type.toUpperCase()})</h2>
                
                <form id="galleryEditForm" onsubmit="handleGalleryUpdate(event, '${item._id}')">
                    <div class="space-y-4">
                        <label class="block">
                            <span class="text-gray-700 font-semibold">Title:</span>
                            <input type="text" name="title" value="${item.title || ''}" required 
                                class="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        </label>
                        <label class="block">
                            <span class="text-gray-700 font-semibold">Description:</span>
                            <textarea name="description" maxlength="250" 
                                class="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">${item.description || ''}</textarea>
                        </label>
                        
                        <div class="text-sm text-gray-500 pt-2">
                           Media file URL: <a href="${item.cloudinaryUrl}" target="_blank" class="text-indigo-600 truncate inline-block w-4/5">${item.cloudinaryUrl}</a>
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 mt-6">
                        <button type="button" onclick="document.getElementById('${modalId}').remove()" 
                                class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                            Cancel
                        </button>
                        <button type="submit" id="update-item-btn"
                                class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.handleGalleryUpdate = async function(event, itemId) {
    event.preventDefault();
    const form = event.target;
    const button = document.getElementById('update-item-btn');
    const originalText = button.innerHTML;

    button.disabled = true;
    button.innerHTML = '<div class="spinner mr-2"></div> Saving...';
    button.classList.add('flex', 'items-center', 'justify-center');

    const updatedData = {
        title: form.elements.title.value,
        description: form.elements.description.value
    };

    try {
        const response = await fetch(`${API_BASE}/admin/gallery/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (response.status === 302 || response.status === 401) return window.location.replace('/admin');
        if (!response.ok) {
            const errorJson = await response.json();
            throw new Error(errorJson.message || `Update failed with status ${response.status}.`);
        }

        document.getElementById('editGalleryModal').remove();
        displayStatus('Gallery item updated successfully!', true);
        fetchGalleryItems();
    } catch (error) {
        console.error('Gallery Update Error:', error);
        displayStatus(`Update failed: ${error.message}`, false);
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
        button.classList.remove('flex', 'items-center', 'justify-center');
    }
};

function renderGalleryCard(item) {
    const mediaTag = item.type === 'photo'
        ? `<img src="${item.cloudinaryUrl}" alt="${item.title}" class="w-full h-40 object-cover rounded-t-xl">`
        : `<video controls src="${item.cloudinaryUrl}" class="w-full h-40 object-cover rounded-t-xl bg-black"></video>`;
        
    const safeTitle = item.title.replace(/'/g, "\\'");
    
    const itemDataJson = JSON.stringify(item);

    return `
        <div id="gallery-item-${item._id}" class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300 relative">
            
            <script type="application/json" id="data-${item._id}">${itemDataJson}</script>
            
            ${mediaTag}
            <div class="p-4">
                <h4 class="font-bold text-lg text-gray-900">${item.title}</h4>
                <p class="text-sm text-gray-600 mt-1">${item.description || 'No description provided.'}</p>
                <div class="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                    <button onclick="renderGalleryEditModal('${item._id}')"
                            class="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition duration-150 font-semibold"
                            title="Edit Title and Description">
                        Edit
                    </button>
                    <button onclick="handleGalleryDelete('${item._id}', '${safeTitle}')" 
                            class="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition duration-150 font-semibold"
                            title="Delete this item">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `;
}

// =========================================================================
// APPLICATION / MESSAGE MANAGEMENT LOGIC (EXISTING)
// =========================================================================

// ... (existing application/message functions) ...

window.viewContactMessage = function(appId, name, email, mobile, subject, message, date) {
    const modal = document.createElement('div');
    modal.id = "messageModal";
    modal.className = "fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50";

    const safeMessage = message ? message.replace(/\n/g, '<br>') : 'N/A';

    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-xl max-w-xl w-full mx-4 p-8 relative overflow-y-auto max-h-[90vh]">
            <button class="absolute top-3 right-3 text-gray-600 hover:text-black text-xl font-bold" 
                    onclick="document.getElementById('messageModal').remove()">×</button>
            <h2 class="text-2xl font-bold mb-4 text-indigo-700 border-b pb-2">Contact Message Details</h2>

            <div class="space-y-3 text-sm">
                <p><strong>Date:</strong> ${new Date(date).toLocaleString()}</p>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> <a href="mailto:${email}" class="text-blue-600">${email}</a></p>
                <p><strong>Mobile:</strong> ${mobile || 'N/A'}</p>
                <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
            </div>

            <h3 class="text-lg font-semibold mt-6 mb-3 border-b pt-4">Message Content</h3>
            <div class="bg-gray-100 p-4 rounded-lg">
                <p class="text-gray-700 whitespace-pre-wrap">${safeMessage}</p>
            </div>
            
            <div class="flex justify-end mt-6">
                <button onclick="document.getElementById('messageModal').remove()" 
                        class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.handleApplicationDelete = async function(appId, applicantName) {
    const confirmation = prompt(`Are you sure you want to delete the application from ${applicantName}?\nType 'DELETE' to confirm.`);
    if (confirmation !== 'DELETE') return displayStatus('Deletion cancelled.', false);

    const applicationRow = document.getElementById(`app-row-${appId}`);
    if (applicationRow) applicationRow.style.opacity = '0.5';

    try {
        const response = await fetch(`${API_BASE}/admin/applications/${appId}`, { method: 'DELETE' });
        
        if (response.status === 302 || response.status === 401) return window.location.replace('/admin');
        if (!response.ok) {
            const errorJson = await response.json();
            throw new Error(errorJson.message || `Update failed with status ${response.status}.`);
        }

        displayStatus(`Application from ${applicantName} deleted successfully!`, true);
        fetchApplications();
    } catch (error) {
        console.error('Application Deletion Error:', error);
        displayStatus(`Deletion failed: ${error.message}`, false);
        if (applicationRow) applicationRow.style.opacity = '1';
        fetchApplications();
    }
};


function renderApplicationsTable(applications) {
    return `
        <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class / Message</th>
                        <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${applications.map(app => {
                        const isAdmission = app.type === 'Admission';
                        const formDetails = app.formDetails || {};
                        const applicantName = isAdmission ? app.pupilName : app.name;
                        const mainDetail = isAdmission 
                            ? `Class: ${app.admissionClass}` 
                            : `Msg: ${app.message ? app.message.substring(0, 30) + '...' : 'N/A'}`;
                        const statusColor = isAdmission ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800';
                        const safeApplicantName = (applicantName || 'N/A').replace(/'/g, "\\'");
                        
                        const contactArgs = isAdmission ? '' : 
                            `'${app._id}', 
                            '${(app.name || 'N/A').replace(/'/g, "\\'")}', 
                            '${(app.email || 'N/A').replace(/'/g, "\\'")}', 
                            '${(app.mobile || 'N/A').replace(/'/g, "\\'")}', 
                            '${(app.subject || 'N/A').replace(/'/g, "\\'")}', 
                            '${(app.message || 'N/A').replace(/'/g, "\\'")}', 
                            '${app.date}'`;

                        return `
                            <tr id="app-row-${app._id}" class="hover:bg-gray-50 transition">
                                <td class="px-6 py-4 text-sm text-gray-500">${new Date(app.date).toLocaleDateString()}</td>
                                <td class="px-6 py-4 text-sm">
                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">
                                        ${app.type}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-sm font-medium text-gray-900">${applicantName || 'N/A'}</td>
                                <td class="px-6 py-4 text-sm text-gray-900">
                                    ${isAdmission ? formDetails.fatherMobile : app.mobile}<br>
                                    <span class="text-xs text-gray-500">${isAdmission ? formDetails.fatherName : app.email}</span>
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-900">${mainDetail}</td>
                                <td class="px-6 py-4 text-center space-x-2">
                                    ${app.type === 'Admission' ? `
                                        <button onclick="viewAdmission('${app._id}')" 
                                            class="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full hover:bg-indigo-700 transition">
                                            View
                                        </button>
                                    ` : `
                                        <button onclick="viewContactMessage(${contactArgs})" 
                                            class="bg-blue-500 text-white text-xs px-3 py-1 rounded-full hover:bg-blue-600 transition">
                                            View
                                        </button>
                                    `}
                                    <button onclick="handleApplicationDelete('${app._id}', '${safeApplicantName}')" 
                                        class="bg-red-500 text-white text-xs px-3 py-1 rounded-full hover:bg-red-600 transition">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

window.viewAdmission = async function(appId) {
    try {
        const res = await fetch(`${API_BASE}/admin/applications/${appId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error("Failed to load details");
        const app = data.application;

        const modal = document.createElement('div');
        modal.id = "admissionModal";
        modal.className = "fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50";
        
        const getValue = (field) => app.formDetails[field] || 'N/A';
        const getDateValue = (field) => {
            const date = app.formDetails[field];
            return date ? new Date(date).toLocaleDateString() : 'N/A';
        };

        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 p-8 relative overflow-y-auto max-h-[90vh]">
                <button class="absolute top-3 right-3 text-gray-600 hover:text-black text-xl font-bold" 
                        onclick="document.getElementById('admissionModal').remove()">×</button>
                <h2 class="text-2xl font-bold mb-4 text-indigo-700 border-b pb-2">Admission Application Details</h2>

                <div class="space-y-6 text-sm">
                    <h3 class="text-lg font-semibold text-gray-800">Pupil Details</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <p><strong>Name:</strong> ${app.pupilName}</p>
                        <p><strong>Aadhar No:</strong> ${getValue('pupilAadhar')}</p>
                        <p><strong>DOB:</strong> ${getDateValue('dateOfBirth')}</p>
                        <p><strong>Class Applied:</strong> ${app.admissionClass}</p>
                        <p><strong>Religion:</strong> ${getValue('religion')}</p>
                        <p><strong>Caste:</strong> ${getValue('caste')}</p>
                        <p><strong>Second Language:</strong> ${getValue('secondLanguage')}</p>
                        <p><strong>Mother Tongue:</strong> ${getValue('motherTongue')}</p>
                    </div>

                    <h3 class="text-lg font-semibold text-gray-800 border-t pt-4">Parent Details & Contact</h3>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <p class="col-span-2"><strong>Father Name:</strong> ${getValue('fatherName')}</p>
                        <p class="col-span-2"><strong>Mother Name:</strong> ${getValue('motherName')}</p>
                        
                        <p><strong>Father Occupation:</strong> ${getValue('fatherOccupation')}</p>
                        <p><strong>Father Income:</strong> ${getValue('fatherIncome')}</p>
                        <p><strong>Father Mobile:</strong> ${getValue('fatherMobile')}</p>
                        <p><strong>Father Nationality:</strong> ${getValue('fatherNationality')}</p>
                        
                        <p><strong>Mother Occupation:</strong> ${getValue('motherOccupation')}</p>
                        <p><strong>Mother Income:</strong> ${getValue('motherIncome')}</p>
                        <p><strong>Mother Mobile:</strong> ${getValue('motherMobile') || 'N/A'}</p>
                        <p><strong>Mother Nationality:</strong> ${getValue('motherNationality')}</p>
                    </div>
                    
                    <h3 class="text-lg font-semibold text-gray-800 border-t pt-4">Address & Previous School</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <p><strong>Address Line 1:</strong> ${getValue('addressLine1')}</p>
                        <p><strong>Address Line 2:</strong> ${getValue('addressLine2') || 'N/A'}</p>
                        <p><strong>Previous School:</strong> ${getValue('previousSchoolName') || 'N/A'}</p>
                        <p><strong>Date Left Previous School:</strong> ${getDateValue('leavingDate')}</p>
                        <p><strong>TC Details:</strong> ${getValue('tcDetails') || 'N/A'}</p>
                        <p><strong>ID Mark 1:</strong> ${getValue('idMark1') || 'N/A'}</p>
                        <p><strong>ID Mark 2:</strong> ${getValue('idMark2') || 'N/A'}</p>
                    </div>
                </div>

                <h3 class="text-lg font-semibold mt-6 mb-3 border-b pt-4">Uploaded Documents</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    ${renderDocLink('Birth Certificate', app.documents?.file_birth)}
                    ${renderDocLink('Aadhaar Card', app.documents?.file_aadhar)}
                    ${renderDocLink('Transfer Certificate', app.documents?.file_tc)}
                    ${renderDocLink('Student Photo (View Multiple)', app.documents?.file_student_photo)}
                    ${renderDocLink('Parent ID Proof', app.documents?.file_parent_id)}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    } catch (err) {
        console.error("View Admission Error:", err);
        alert("Failed to load admission details.");
    }
};

function renderDocLink(label, url) {
    if (!url) return `<div class="text-gray-400">${label}: Not Uploaded</div>`;
    return `
        <div>
            <p class="text-gray-700 font-medium">${label}</p>
            <a href="${url}" target="_blank" class="text-indigo-600 underline text-sm">View / Download</a>
        </div>
    `;
}
// =========================================================================
// NEW: ACHIEVEMENTS MANAGEMENT LOGIC
// =========================================================================

async function fetchAchievements() {
    const container = document.getElementById('existing-achievements');
    if (!container) return; 
    container.innerHTML = '<p class="text-gray-500 text-center col-span-full">Loading achievements...</p>';

    try {
        // NOTE: Uses the public endpoint as the admin controller implements getAdminAchievements on the adminRoutes.js file.
        const response = await fetch(`${API_BASE}/achievements`); 
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        const achievements = data.achievements || []; 

        if (data.success && achievements.length > 0) {
            container.innerHTML = achievements.map(renderAchievementCard).join('');
        } else {
            container.innerHTML = '<p class="text-gray-500 text-center col-span-full">No achievements added yet.</p>';
        }
    } catch (error) {
        console.error('Fetch Achievements Error:', error);
        container.innerHTML = `<p class="text-red-600 text-center col-span-full">Error loading achievements.</p>`;
    }
}

async function handleAchievementUpload(event) {
    event.preventDefault();
    const form = event.target;
    const button = document.getElementById('achievement-submit-btn');
    const originalText = button.innerHTML;

    button.disabled = true;
    button.innerHTML = '<div class="spinner mr-2"></div> Uploading...';
    button.classList.add('flex', 'items-center', 'justify-center');

    try {
        const response = await fetch(`${API_BASE}/admin/achievements`, {
            method: 'POST',
            body: new FormData(form),
            credentials: 'include'
        });

        if (response.status === 401 || response.status === 302) return window.location.replace('/admin');
        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: `Server error or received non-JSON response (Status: ${response.status}).` }));
            throw new Error(err.message || 'Upload failed.');
        }

        displayStatus('Achievement uploaded successfully!', true);
        form.reset();
        fetchAchievements();
    } catch (err) {
        console.error('Achievement Upload Error:', err);
        displayStatus(`Upload failed: ${err.message}`, false);
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
        button.classList.remove('flex', 'items-center', 'justify-center');
    }
}

function renderAchievementCard(achievement) {
    const safeTitle = escapeHtml(achievement.title);
    const safeDesc = escapeHtml(achievement.description);
    const safeJsonData = escapeHtml(JSON.stringify(achievement));
    const safeTitleForDelete = safeTitle.replace(/'/g, "\\'");

    return `
        <div id="achievement-card-${achievement._id}" 
             class="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 relative"
             data-achievement-data='${safeJsonData}'> 
            
            <img src="${achievement.cloudinaryUrl}" alt="${safeTitle}" 
                 class="w-full h-40 object-cover">
            
            <div class="p-4">
                <h4 class="font-bold text-lg text-gray-900 mb-1">${safeTitle}</h4>
                <p class="text-sm text-gray-600">${safeDesc.substring(0, 100)}...</p>
                <div class="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                    <button onclick="renderAchievementEditModal('${achievement._id}')"
                        class="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition">Edit</button>
                    <button onclick="handleAchievementDelete('${achievement._id}', '${safeTitleForDelete}')"
                        class="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition">Delete</button>
                </div>
            </div>
        </div>
    `;
}

window.renderAchievementEditModal = function (achievementId) {
    const modalId = 'editAchievementModal';
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const card = document.getElementById(`achievement-card-${achievementId}`);
    if (!card) return displayStatus('Achievement not found.', false);

    const dataAttr = card.getAttribute('data-achievement-data');
    if (!dataAttr) return displayStatus('Missing achievement data.', false);

    let achievement;
    try {
        const unescapedData = dataAttr.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        achievement = JSON.parse(unescapedData);
    } catch (e) {
        console.error('JSON parse error:', e);
        return displayStatus('Invalid achievement data.', false);
    }

    const modal = `
        <div id="${modalId}" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 relative">
                <button class="absolute top-3 right-3 text-gray-600 hover:text-black text-xl font-bold"
                    onclick="document.getElementById('${modalId}').remove()">&times;</button>
                <h2 class="text-2xl font-bold mb-6 text-indigo-700">Edit Achievement</h2>

                <form id="achievementEditForm" onsubmit="handleAchievementUpdate(event, '${achievementId}')">
                    <div class="space-y-4">
                        <label class="block">
                            <span class="text-gray-700 font-semibold">Title:</span>
                            <input type="text" name="title" value="${escapeHtml(achievement.title)}" required
                                class="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        </label>
                        <label class="block">
                            <span class="text-gray-700 font-semibold">Description:</span>
                            <textarea name="description" maxlength="1000" rows="5" required
                                class="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">${escapeHtml(achievement.description)}</textarea>
                        </label>
                    </div>

                    <div class="flex justify-end space-x-3 mt-6">
                        <button type="button" onclick="document.getElementById('${modalId}').remove()"
                            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" id="update-achievement-btn"
                            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modal);
};

window.handleAchievementUpdate = async function (event, achievementId) {
    event.preventDefault();

    const form = event.target;
    const button = document.getElementById('update-achievement-btn');
    const originalText = button.innerHTML;

    const updatedData = {
        title: form.elements.title.value.trim(),
        description: form.elements.description.value.trim()
    };

    button.disabled = true;
    button.innerHTML = '<div class="spinner mr-2"></div> Saving...';
    button.classList.add('flex', 'items-center', 'justify-center');

    try {
        const res = await fetch(`${API_BASE}/admin/achievements/${achievementId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (res.status === 401 || res.status === 302) return window.location.replace('/admin');
        const data = await res.json();

        if (!res.ok || !data.success) throw new Error(data.message || 'Update failed.');

        displayStatus('Achievement updated successfully!', true);
        document.getElementById('editAchievementModal')?.remove();
        fetchAchievements();
    } catch (err) {
        console.error('Achievement Update Error:', err);
        displayStatus(`Update failed: ${err.message}`, false);
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
        button.classList.remove('flex', 'items-center', 'justify-center');
    }
};

window.handleAchievementDelete = async function (id, title) {
    const confirmDelete = prompt(`Type DELETE to confirm deletion for achievement "${title}"`);
    if (confirmDelete !== 'DELETE') return displayStatus('Deletion cancelled.', false);

    try {
        const res = await fetch(`${API_BASE}/admin/achievements/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);

        displayStatus(`Achievement "${title}" deleted successfully!`, true);
        fetchAchievements();
    } catch (err) {
        console.error('Achievement Delete Error:', err);
        displayStatus(`Deletion failed: ${err.message}`, false);
    }
};

// =========================================================================
// NEW: RESULTS MANAGEMENT LOGIC (ICSE & ISC)
// =========================================================================

async function fetchResults() {
    const container = document.getElementById('existing-results');
    if (!container) return; 
    container.innerHTML = '<p class="text-gray-500 text-center">Loading results...</p>';

    try {
        // NOTE: Uses the public endpoint as the admin controller implements getAdminResults on the adminRoutes.js file.
        const response = await fetch(`${API_BASE}/results`); 
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        const results = data.results || []; 

        if (data.success && results.length > 0) {
            container.innerHTML = renderResultsCards(results);
        } else {
            container.innerHTML = '<p class="text-gray-500 text-center">No board results added yet.</p>';
        }
    } catch (error) {
        console.error('Fetch Results Error:', error);
        container.innerHTML = `<p class="text-red-600 text-center">Error loading results.</p>`;
    }
}

function renderResultsCards(results) {
    let icseResults = results.filter(r => r.type === 'ICSE');
    let iscResults = results.filter(r => r.type === 'ISC');

    const renderSection = (title, list) => {
        if (list.length === 0) return '';
        return `
            <div class="w-full">
                <h4 class="text-xl font-bold text-gray-800 border-b pb-2 mb-4">${title}</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    ${list.map(renderResultCard).join('')}
                </div>
            </div>
        `;
    };

    return `
        <div class="space-y-8">
            ${renderSection('ICSE Results', icseResults)}
            ${renderSection('ISC Results', iscResults)}
        </div>
    `;
}

async function handleResultUpload(event) {
    event.preventDefault();
    const form = event.target;
    const button = document.getElementById('result-submit-btn');
    const originalText = button.innerHTML;

    button.disabled = true;
    button.innerHTML = '<div class="spinner mr-2"></div> Uploading...';
    button.classList.add('flex', 'items-center', 'justify-center');

    try {
        const response = await fetch(`${API_BASE}/admin/results`, {
            method: 'POST',
            body: new FormData(form),
            credentials: 'include'
        });

        if (response.status === 401 || response.status === 302) return window.location.replace('/admin');
        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: `Server error or received non-JSON response (Status: ${response.status}).` }));
            throw new Error(err.message || 'Upload failed.');
        }

        // 🎯 FIX: Updated success message to encourage multiple, sequential uploads.
        displayStatus('Result entry for one student created successfully! You can now add the next student.', true);
        form.reset();
        fetchResults();
    } catch (err) {
        console.error('Result Upload Error:', err);
        displayStatus(`Upload failed: ${err.message}`, false);
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
        button.classList.remove('flex', 'items-center', 'justify-center');
    }
}

function renderResultCard(result) {
    const safeName = escapeHtml(result.studentName);
    const safeType = escapeHtml(result.type);
    // Use Number.isFinite check before toFixed to prevent errors if percentage is missing
    const safePercentage = Number.isFinite(result.percentage) ? result.percentage.toFixed(2) : 'N/A';
    const safeJsonData = escapeHtml(JSON.stringify(result));
    const safeNameForDelete = safeName.replace(/'/g, "\\'");

    return `
        <div id="result-card-${result._id}" 
             class="bg-white rounded-xl shadow-lg p-4 flex flex-col items-center text-center space-y-3 border border-gray-100 relative"
             data-result-data='${safeJsonData}'> 
            
            <div class="flex-shrink-0 w-24 h-24 text-center">
                <img src="${result.cloudinaryUrl}" alt="${safeName}"
                     class="w-full h-full object-cover rounded-full mx-auto border-4 ${safeType === 'ICSE' ? 'border-blue-500' : 'border-green-500'}">
            </div>
            
            <div class="flex-1 w-full">
                <span class="text-xs px-2 py-0.5 rounded-full ${safeType === 'ICSE' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'} font-semibold">${safeType}</span>
                <h4 class="font-bold text-lg text-gray-900 mt-1">${safeName}</h4>
                <p class="text-xl font-extrabold ${safeType === 'ICSE' ? 'text-blue-600' : 'text-green-600'}">${safePercentage}%</p>
                
                <div class="flex justify-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button onclick="renderResultEditModal('${result._id}')"
                        class="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition">Edit</button>
                    <button onclick="handleResultDelete('${result._id}', '${safeNameForDelete}', '${safeType}')"
                        class="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition">Delete</button>
                </div>
            </div>
        </div>
    `;
}

window.renderResultEditModal = function (resultId) {
    const modalId = 'editResultModal';
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const card = document.getElementById(`result-card-${resultId}`);
    if (!card) return displayStatus('Result not found.', false);

    const dataAttr = card.getAttribute('data-result-data');
    if (!dataAttr) return displayStatus('Missing result data.', false);

    let result;
    try {
        const unescapedData = dataAttr.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        result = JSON.parse(unescapedData);
    } catch (e) {
        console.error('JSON parse error:', e);
        return displayStatus('Invalid result data.', false);
    }

    const modal = `
        <div id="${modalId}" class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div class="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 relative">
                <button class="absolute top-3 right-3 text-gray-600 hover:text-black text-xl font-bold"
                    onclick="document.getElementById('${modalId}').remove()">&times;</button>
                <h2 class="text-2xl font-bold mb-6 text-indigo-700">Edit ${result.type} Result</h2>

                <form id="resultEditForm" onsubmit="handleResultUpdate(event, '${resultId}')">
                    <div class="space-y-4">
                        <label class="block">
                            <span class="text-gray-700 font-semibold">Board Type:</span>
                            <select name="type" required 
                                class="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                                <option value="ICSE" ${result.type === 'ICSE' ? 'selected' : ''}>ICSE</option>
                                <option value="ISC" ${result.type === 'ISC' ? 'selected' : ''}>ISC</option>
                            </select>
                        </label>
                        <label class="block">
                            <span class="text-gray-700 font-semibold">Student Name:</span>
                            <input type="text" name="studentName" value="${escapeHtml(result.studentName)}" required
                                class="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        </label>
                        <label class="block">
                            <span class="text-gray-700 font-semibold">Percentage:</span>
                            <input type="number" name="percentage" value="${result.percentage.toFixed(2)}" step="0.1" min="0" max="100" required
                                class="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                        </label>
                    </div>

                    <div class="flex justify-end space-x-3 mt-6">
                        <button type="button" onclick="document.getElementById('${modalId}').remove()"
                            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" id="update-result-btn"
                            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modal);
};

window.handleResultUpdate = async function (event, resultId) {
    event.preventDefault();

    const form = event.target;
    const button = document.getElementById('update-result-btn');
    const originalText = button.innerHTML;

    const updatedData = {
        type: form.elements.type.value.trim(),
        studentName: form.elements.studentName.value.trim(),
        percentage: form.elements.percentage.value.trim()
    };

    button.disabled = true;
    button.innerHTML = '<div class="spinner mr-2"></div> Saving...';
    button.classList.add('flex', 'items-center', 'justify-center');

    try {
        const res = await fetch(`${API_BASE}/admin/results/${resultId}`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (res.status === 401 || res.status === 302) return window.location.replace('/admin');
        const data = await res.json();

        if (!res.ok || !data.success) throw new Error(data.message || 'Update failed.');

        displayStatus('Result updated successfully!', true);
        document.getElementById('editResultModal')?.remove();
        fetchResults();
    } catch (err) {
        console.error('Result Update Error:', err);
        displayStatus(`Update failed: ${err.message}`, false);
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
        button.classList.remove('flex', 'items-center', 'justify-center');
    }
};

window.handleResultDelete = async function (id, name, type) {
    const confirmDelete = prompt(`Type DELETE to confirm deletion for ${type} result for student "${name}"`);
    if (confirmDelete !== 'DELETE') return displayStatus('Deletion cancelled.', false);

    try {
        const res = await fetch(`${API_BASE}/admin/results/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);

        displayStatus(`${type} Result for "${name}" deleted successfully!`, true);
        fetchResults();
    } catch (err) {
        console.error('Result Delete Error:', err);
        displayStatus(`Deletion failed: ${err.message}`, false);
    }
};

// =========================================================================
// NEW: DISCLOSURE DOCUMENT MANAGEMENT LOGIC
// =========================================================================

async function fetchDisclosureDocuments() {
    const container = document.getElementById('existing-disclosure-documents');
    if (!container) return; 
    container.innerHTML = '<p class="text-gray-500 text-center">Loading documents...</p>';

    try {
        const response = await fetch(`${API_BASE}/admin/disclosure`); 
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        const documents = data.documents || []; 
        const DISCLOSURE_ORDER = ['Affiliation', 'NOC', 'Minority Certificate', 'Building Fitness Certificate'];
        
        if (data.success && documents.length > 0) {
            
            // Group documents by type
            const groups = documents.reduce((acc, doc) => {
                const type = doc.type || 'Other';
                if (!acc[type]) acc[type] = [];
                acc[type].push(doc);
                return acc;
            }, {});
            
            // Render HTML in the specified order
            let html = '';
            DISCLOSURE_ORDER.forEach(type => {
                if (groups[type]) {
                    html += `
                        <div class="disclosure-group-wrapper space-y-3">
                            <h4 class="text-xl font-bold text-gray-800 border-b pb-1 mt-4">${type} Documents</h4>
                            ${groups[type].map(renderDisclosureCard).join('')}
                        </div>
                    `;
                }
            });
            
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p class="text-gray-500 text-center">No mandatory disclosure documents added yet.</p>';
        }
    } catch (error) {
        console.error('Fetch Disclosure Documents Error:', error);
        container.innerHTML = `<p class="text-red-600 text-center">Error loading disclosure documents.</p>`;
    }
}

async function handleDisclosureUpload(event) {
    event.preventDefault();
    const form = event.target;
    const button = document.getElementById('disclosure-submit-btn');
    const originalText = button.innerHTML;

    button.disabled = true;
    button.innerHTML = '<div class="spinner mr-2"></div> Uploading...';
    button.classList.add('flex', 'items-center', 'justify-center');

    try {
        const response = await fetch(`${API_BASE}/admin/disclosure`, {
            method: 'POST',
            body: new FormData(form),
            credentials: 'include'
        });

        if (response.status === 401 || response.status === 302) return window.location.replace('/admin');
        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: `Server error or received non-JSON response (Status: ${response.status}).` }));
            throw new Error(err.message || 'Upload failed.');
        }

        displayStatus('Document uploaded successfully!', true);
        form.reset();
        fetchDisclosureDocuments();
    } catch (err) {
        console.error('Disclosure Upload Error:', err);
        displayStatus(`Upload failed: ${err.message}`, false);
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
        button.classList.remove('flex', 'items-center', 'justify-center');
    }
}

function renderDisclosureCard(doc) {
    const safeTitle = escapeHtml(doc.title);
    const safeTitleForDelete = safeTitle.replace(/'/g, "\\'");
    const isPdf = doc.cloudinaryUrl.toLowerCase().endsWith('.pdf') || doc.cloudinaryUrl.includes('f_pdf');
    const icon = isPdf ? '📄' : '🖼️';

    return `
        <div id="disclosure-card-${doc._id}" 
             class="bg-gray-50 rounded-lg shadow-sm p-4 flex justify-between items-center border border-gray-200 hover:shadow-md transition"> 
            
            <div class="flex items-center space-x-3">
                <span class="text-2xl">${icon}</span>
                <div>
                    <h4 class="font-semibold text-gray-900">${safeTitle}</h4>
                    <p class="text-xs text-indigo-600">${doc.type}</p>
                </div>
            </div>
            
            <div class="flex space-x-2">
                <a href="${doc.cloudinaryUrl}" target="_blank"
                    class="text-xs bg-blue-500 text-white px-3 py-1 rounded-full hover:bg-blue-600 transition font-semibold">
                    View
                </a>
                <button onclick="handleDisclosureDelete('${doc._id}', '${safeTitleForDelete}', '${doc.type}')"
                    class="text-xs bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 transition font-semibold">
                    Delete
                </button>
            </div>
        </div>
    `;
}

window.handleDisclosureDelete = async function (id, title, type) {
    const confirmDelete = prompt(`Type DELETE to confirm deletion for the ${type} document: "${title}"`);
    if (confirmDelete !== 'DELETE') return displayStatus('Deletion cancelled.', false);

    try {
        const res = await fetch(`${API_BASE}/admin/disclosure/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);

        displayStatus(`Document "${title}" deleted successfully!`, true);
        fetchDisclosureDocuments();
    } catch (err) {
        console.error('Disclosure Delete Error:', err);
        displayStatus(`Deletion failed: ${err.message}`, false);
    }
};