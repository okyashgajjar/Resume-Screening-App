document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const form = document.getElementById('upload-form');
    const fileInput = document.getElementById('resume-file');
    const fileDropZone = document.getElementById('file-drop-zone');
    const fileName = document.getElementById('file-name');
    const submitBtn = document.getElementById('submit-btn');
    const loading = document.getElementById('loading');
    const resultsContainer = document.getElementById('results');
    const errorEl = document.getElementById('error-message');
    const predictedRole = document.getElementById('predicted-role');
    const extractedText = document.getElementById('extracted-text');
    const genaiSuggestions = document.getElementById('genai-suggestions');

    // File validation
    const validateFile = (file) => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        
        if (!allowedTypes.includes(file.type)) {
            return { valid: false, message: 'Please select a PDF or DOCX file.' };
        }
        
        if (file.size > maxSize) {
            return { valid: false, message: 'File size must be less than 10MB.' };
        }
        
        return { valid: true };
    };

    // File drop zone functionality
    fileDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileDropZone.classList.add('drag-over');
    });

    fileDropZone.addEventListener('dragleave', () => {
        fileDropZone.classList.remove('drag-over');
    });

    fileDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        fileDropZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            updateFileName(files[0]);
        }
    });

    // File input change handler
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            updateFileName(e.target.files[0]);
        }
    });

    // Update file name display
    const updateFileName = (file) => {
        fileName.textContent = file.name;
        fileDropZone.classList.add('file-selected');
    };

    // Show error message
    const showError = (message) => {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
        resultsContainer.classList.add('hidden');
        loading.classList.add('hidden');
        
        submitBtn.disabled = false;
        submitBtn.classList.remove('processing');
        submitBtn.innerHTML = '<i class="fas fa-search"></i> Analyze Resume';
    };

    // Hide error message
    const hideError = () => {
        errorEl.classList.add('hidden');
    };

    // Show results
    const showResults = (data) => {
        hideError();
        loading.classList.add('hidden');
        
        // Store results in sessionStorage for the results page
        if (data.data) {
            // Store the actual analysis data
            sessionStorage.setItem('resumeAnalysisResults', JSON.stringify(data.data));
        } else {
            // Fallback: store the entire response
            sessionStorage.setItem('resumeAnalysisResults', JSON.stringify(data));
        }
        
        // Redirect to results page
        if (data.redirect_url) {
            window.location.href = data.redirect_url;
        } else {
            // Fallback to showing results on same page
            resultsContainer.classList.remove('hidden');
            predictedRole.textContent = data.predicted_role;
            extractedText.textContent = data.extracted_text;
            genaiSuggestions.innerHTML = data.genai_suggestions;
            
            submitBtn.innerHTML = '<i class="fas fa-search"></i> Analyze Another Resume';
            submitBtn.disabled = false;
            submitBtn.classList.remove('processing');
        }
    };

    // Show loading state
    const showLoading = () => {
        loading.classList.remove('hidden');
        resultsContainer.classList.add('hidden');
        hideError();
        
        submitBtn.disabled = true;
        submitBtn.classList.add('processing');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    };

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate file before submission
        if (!fileInput.files.length) {
            showError('Please select a file first.');
            return;
        }

        const validation = validateFile(fileInput.files[0]);
        if (!validation.valid) {
            showError(validation.message);
            return;
        }

        // Show loading state
        showLoading();

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showResults(data);
            } else {
                showError(data.error || 'An error occurred while analyzing your resume.');
            }
        } catch (error) {
            console.error('Network error:', error);
            showError('Network error occurred. Please check your connection and try again.');
        } finally {
            loading.classList.add('hidden');
        }
    });

    // Enhanced keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Allow Enter key to trigger file selection when focused on upload area
        if (e.key === 'Enter' && document.activeElement === fileDropZone) {
            fileInput.click();
        }
        
        // Allow Escape key to clear error messages
        if (e.key === 'Escape') {
            hideError();
        }
    });

    // Add click handler to make entire drop zone clickable
    fileDropZone.addEventListener('click', (e) => {
        if (e.target !== fileInput) {
            fileInput.click();
        }
    });

    // Prevent default drag behaviors on document
    document.addEventListener('dragover', (e) => e.preventDefault());
    document.addEventListener('drop', (e) => e.preventDefault());

    // Add loading tips rotation
    const loadingTips = [
        'Analyzing your resume with AI...',
        'Extracting key information...',
        'Identifying relevant skills...',
        'Generating personalized suggestions...',
        'Almost done, finalizing results...'
    ];

    let currentTipIndex = 0;
    let tipInterval;

    const startLoadingTips = () => {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            tipInterval = setInterval(() => {
                currentTipIndex = (currentTipIndex + 1) % loadingTips.length;
                loadingText.style.opacity = '0';
                setTimeout(() => {
                    loadingText.textContent = loadingTips[currentTipIndex];
                    loadingText.style.opacity = '1';
                }, 150);
            }, 2000);
        }
    };

    const stopLoadingTips = () => {
        if (tipInterval) {
            clearInterval(tipInterval);
            tipInterval = null;
        }
    };

    // Override showLoading to include tips
    const originalShowLoading = showLoading;
    window.showLoading = () => {
        originalShowLoading();
        startLoadingTips();
    };

    // Override showResults to stop tips
    const originalShowResults = showResults;
    window.showResults = (data) => {
        stopLoadingTips();
        originalShowResults(data);
    };

    // Add smooth reveal animation for cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationDelay = `${Array.from(entry.target.parentNode.children).indexOf(entry.target) * 0.1}s`;
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe cards when they're added to the DOM
    const observeNewCards = () => {
        const cards = document.querySelectorAll('.card:not(.observed)');
        cards.forEach(card => {
            card.classList.add('observed');
            observer.observe(card);
        });
    };

    // Call initially and whenever results are shown
    observeNewCards();

    // Add CSS for card animations
    const style = document.createElement('style');
    style.textContent = `
        .card {
            opacity: 0;
            transform: translateY(20px);
        }
        
        .card.animate-in {
            animation: cardSlideIn 0.6s ease-out forwards;
        }
        
        @keyframes cardSlideIn {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);

    // Add file format helper
    const addFileFormatHelper = () => {
        const fileInfo = document.querySelector('.file-info');
        if (fileInfo) {
            fileInfo.innerHTML = `
                <i class="fas fa-info-circle"></i> 
                Supports PDF and DOCX files up to 10MB
                <br>
                <small style="opacity: 0.8; margin-top: 5px; display: block;">
                    <i class="fas fa-shield-alt"></i> Your data is processed securely and not stored
                </small>
            `;
        }
    };

    // Populate supported job roles
    const populateJobRoles = () => {
        const jobRolesGrid = document.getElementById('job-roles-grid');
        if (!jobRolesGrid) return;

        const jobRoles = [
            { name: 'Data Science', category: 'Analytics' },
            { name: 'HR', category: 'Management' },
            { name: 'Advocate', category: 'Legal' },
            { name: 'Arts', category: 'Creative' },
            { name: 'Web Designing', category: 'Design' },
            { name: 'Mechanical Engineer', category: 'Engineering' },
            { name: 'Sales', category: 'Business' },
            { name: 'Health and Fitness', category: 'Wellness' },
            { name: 'Civil Engineer', category: 'Engineering' },
            { name: 'Java Developer', category: 'Development' },
            { name: 'Business Analyst', category: 'Analytics' },
            { name: 'SAP Developer', category: 'Development' },
            { name: 'Automation Testing', category: 'Quality Assurance' },
            { name: 'Electrical Engineering', category: 'Engineering' },
            { name: 'Operations Manager', category: 'Management' },
            { name: 'Python Developer', category: 'Development' },
            { name: 'DevOps Engineer', category: 'Development' },
            { name: 'Network Security Engineer', category: 'Security' },
            { name: 'PMO', category: 'Management' },
            { name: 'Database', category: 'Data' },
            { name: 'Hadoop', category: 'Big Data' },
            { name: 'ETL Developer', category: 'Data' },
            { name: 'DotNet Developer', category: 'Development' },
            { name: 'Blockchain', category: 'Technology' },
            { name: 'Testing', category: 'Quality Assurance' }
        ];

        // Group job roles by category
        const groupedRoles = {};
        jobRoles.forEach(role => {
            if (!groupedRoles[role.category]) {
                groupedRoles[role.category] = [];
            }
            groupedRoles[role.category].push(role);
        });

        const categories = Object.keys(groupedRoles);
        const firstCategory = categories[0];

        // Create navigation bar and content area
        jobRolesGrid.innerHTML = `
            <div class="job-roles-nav">
                ${categories.map(category => `
                    <div class="job-role-nav-item ${category === firstCategory ? 'active' : ''}" 
                         onclick="showJobCategory('${category}')">
                        ${category} (${groupedRoles[category].length})
                    </div>
                `).join('')}
            </div>
            <div class="job-roles-content">
                <h4>${firstCategory} Roles</h4>
                <div class="job-roles-list">
                    ${groupedRoles[firstCategory].map(role => `
                        <div class="job-role-item" title="${role.name}">
                            <div class="job-role-name">${role.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Store grouped roles globally for navigation
        window.jobRolesData = groupedRoles;
    };

    // Show job category in navigation
    window.showJobCategory = (category) => {
        // Update active nav item
        document.querySelectorAll('.job-role-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.classList.add('active');

        // Update content
        const contentArea = document.querySelector('.job-roles-content');
        const roles = window.jobRolesData[category];
        
        contentArea.innerHTML = `
            <h4>${category} Roles</h4>
            <div class="job-roles-list">
                ${roles.map(role => `
                    <div class="job-role-item" title="${role.name}">
                        <div class="job-role-name">${role.name}</div>
                    </div>
                `).join('')}
            </div>
        `;
    };

    addFileFormatHelper();
    populateJobRoles();

    // Navigation functionality
    window.showSection = (sectionId) => {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[onclick="showSection('${sectionId}')"]`).classList.add('active');

        // Scroll to section
        const section = document.getElementById(sectionId);
        if (section) {
            const navHeight = document.querySelector('.main-nav').offsetHeight;
            const targetPosition = section.offsetTop - navHeight - 20;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    };

    // Handle scroll to update active nav
    window.addEventListener('scroll', () => {
        const sections = ['home', 'features', 'job-roles', 'about'];
        const navHeight = document.querySelector('.main-nav').offsetHeight;
        
        let currentSection = 'home';
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                const rect = section.getBoundingClientRect();
                if (rect.top <= navHeight + 50) {
                    currentSection = sectionId;
                }
            }
        });

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[onclick="showSection('${currentSection}')"]`)?.classList.add('active');
    });

    // Add copy to clipboard functionality for results
    const addCopyButtons = () => {
        const textAreas = document.querySelectorAll('.text-area, .suggestions-content');
        textAreas.forEach(area => {
            if (!area.querySelector('.copy-btn')) {
                const copyBtn = document.createElement('button');
                copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                copyBtn.className = 'copy-btn';
                copyBtn.style.cssText = `
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: var(--primary-solid);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 8px;
                    cursor: pointer;
                    font-size: 12px;
                    opacity: 0.7;
                    transition: opacity 0.3s ease;
                `;
                
                copyBtn.addEventListener('click', async () => {
                    try {
                        await navigator.clipboard.writeText(area.textContent);
                        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                        }, 2000);
                    } catch (err) {
                        console.error('Failed to copy text:', err);
                    }
                });

                area.style.position = 'relative';
                area.appendChild(copyBtn);
            }
        });
    };

    // Call addCopyButtons when results are shown
    const originalShowResultsWithCopy = showResults;
    window.showResults = (data) => {
        originalShowResultsWithCopy(data);
        setTimeout(addCopyButtons, 100);
        setTimeout(observeNewCards, 100);
    };

    // Enhanced error handling with retry functionality
    const showErrorWithRetry = (message, canRetry = true) => {
        let errorContent = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        
        if (canRetry) {
            errorContent += `
                <br><br>
                <button onclick="location.reload()" style="
                    background: var(--primary-solid);
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    margin-top: 10px;
                ">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            `;
        }
        
        errorEl.innerHTML = errorContent;
        errorEl.classList.remove('hidden');
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    // Add performance monitoring
    const startTime = performance.now();
    
    window.addEventListener('load', () => {
        const loadTime = performance.now() - startTime;
        console.log(`Page loaded in ${loadTime.toFixed(2)}ms`);
    });

    // Add connection status monitoring
    const checkConnection = () => {
        return navigator.onLine;
    };

    window.addEventListener('online', () => {
        hideError();
        console.log('Connection restored');
    });

    window.addEventListener('offline', () => {
        showError('You appear to be offline. Please check your internet connection.');
    });

    // Form validation enhancement
    const validateForm = () => {
        const file = fileInput.files[0];
        
        if (!file) {
            showError('Please select a resume file to analyze.');
            return false;
        }

        const validation = validateFile(file);
        if (!validation.valid) {
            showError(validation.message);
            return false;
        }

        if (!checkConnection()) {
            showError('Please check your internet connection and try again.');
            return false;
        }

        return true;
    };

    // Update the form submission to use enhanced validation
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        showLoading();
        startLoadingTips();

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                window.showResults(data);
            } else {
                showErrorWithRetry(data.error || 'An error occurred while analyzing your resume.');
            }
        } catch (error) {
            console.error('Network error:', error);
            showErrorWithRetry('Network error occurred. Please check your connection and try again.');
        } finally {
            stopLoadingTips();
            loading.classList.add('hidden');
        }
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + U to focus file upload
        if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
            e.preventDefault();
            fileInput.click();
        }
        
        // Ctrl/Cmd + Enter to submit form (if file is selected)
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && fileInput.files.length > 0) {
            e.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });

    // Add accessibility announcements
    const announceToScreenReader = (message) => {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.cssText = `
            position: absolute;
            left: -10000px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        announcement.textContent = message;
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    };

    // Use announcements in key functions
    const originalShowResultsWithAnnouncement = window.showResults || showResults;
    window.showResults = (data) => {
        originalShowResultsWithAnnouncement(data);
        announceToScreenReader(`Analysis complete. Predicted job role: ${data.predicted_role}`);
    };
    
    // Initialize Mobile Navigation
    initializeMobileNav();
});

// Mobile Navigation Toggle
function initializeMobileNav() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
}