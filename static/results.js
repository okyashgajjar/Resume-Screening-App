// Results Page JavaScript - Enhanced Functionality

document.addEventListener('DOMContentLoaded', function() {
    console.log('Results page loaded successfully!');
    
    // Update debug info
    const debugInfo = document.getElementById('debug-info');
    const loadTime = document.getElementById('load-time');
    if (loadTime) {
        loadTime.textContent = new Date().toLocaleTimeString();
    }
    
    // DOM elements
    const loading = document.getElementById('loading');
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    const roleText = document.getElementById('role-text');
    const confidenceFill = document.getElementById('confidence-fill');
    const confidencePercentage = document.getElementById('confidence-percentage');
    const atsScoreNumber = document.getElementById('ats-score-number');
    const atsScoreCircle = document.getElementById('ats-score-circle');
    const genaiSuggestions = document.getElementById('genai-suggestions');
    
    // Debug: Check if elements are found
    console.log('DOM Elements found:', {
        loading: !!loading,
        errorContainer: !!errorContainer,
        errorMessage: !!errorMessage,
        roleText: !!roleText,
        confidenceFill: !!confidenceFill,
        confidencePercentage: !!confidencePercentage,
        atsScoreNumber: !!atsScoreNumber,
        atsScoreCircle: !!atsScoreCircle,
        genaiSuggestions: !!genaiSuggestions
    });

    // Get data from multiple sources
    let resultData = window.resultData; // Flask template data
    console.log('Initial Flask data:', resultData);
    
    // If no Flask data, try URL parameters
    if (!resultData) {
        const urlParams = new URLSearchParams(window.location.search);
        const urlData = urlParams.get('data');
        console.log('URL parameters:', urlParams.toString());
        console.log('URL data:', urlData);
        
        if (urlData) {
            try {
                resultData = JSON.parse(decodeURIComponent(urlData));
                console.log('Using URL parameter data:', resultData);
            } catch (error) {
                console.error('Error parsing URL data:', error);
            }
        }
    }
    
    // If still no data, try sessionStorage
    if (!resultData) {
        const sessionData = sessionStorage.getItem('resumeAnalysisResults');
        console.log('Session storage data:', sessionData);
        
        if (sessionData) {
            try {
                resultData = JSON.parse(sessionData);
                console.log('Using sessionStorage data:', resultData);
            } catch (error) {
                console.error('Error parsing sessionStorage data:', error);
            }
        }
    }
    
    console.log('Final resultData:', resultData);

    // Initialize the page
    initializePage();
    
    // If no data is available, show sample data for testing
    if (!resultData) {
        console.log('No data available, showing sample data for testing');
        const sampleData = {
            predicted_role: "Software Engineer",
            extracted_text: "Sample resume text for testing purposes...",
            genai_suggestions: `
                <div style="line-height: 1.7; font-size: 15px; color: #374151; padding: 20px; background: #fafafa; border-radius: 8px; border-left: 4px solid #4f46e5; width: 100%;">
                    <strong style="font-size: 1.3em; color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; display: block; margin-bottom: 15px;">Sample Analysis</strong>
                    
                    <strong style="font-size: 1.1em; color: #059669; display: block; margin-bottom: 10px;">Strengths:</strong>
                    - Strong technical background in software development
                    - Experience with modern programming languages
                    - Good problem-solving skills
                    
                    <strong style="font-size: 1.1em; color: #059669; display: block; margin-bottom: 10px;">Areas for Enhancement:</strong>
                    - Could add more specific project details
                    - Consider including quantifiable achievements
                    - Add more technical skills
                    
                    <strong style="font-size: 1.1em; color: #059669; display: block; margin-bottom: 10px;">Suggestions:</strong>
                    - Include specific technologies used in projects
                    - Add metrics and results from your work
                    - Consider adding a professional summary
                </div>
            `
        };
        resultData = sampleData;
        displayResults(sampleData);
    }
    
    // Show loading state initially
    if (loading && loading.style.display !== 'none') {
        startLoadingTips();
    }
    

    
    // Debug: Check if all required elements are present
    function checkRequiredElements() {
        const requiredElements = [
            'role-text',
            'genai-suggestions'
        ];
        
        console.log('Checking required elements...');
        requiredElements.forEach(id => {
            const element = document.getElementById(id);
            console.log(`${id}:`, element ? 'Found' : 'Missing');
        });
    }
    
    // Check elements after a short delay
    setTimeout(checkRequiredElements, 1000);
    
    // Initialize Mobile Navigation
    initializeMobileNav();
    
    // Define functions inside the DOMContentLoaded scope
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
    
    function initializePage() {
        console.log('Initializing page...');
        console.log('Flask data:', resultData);
        
        if (resultData) {
            try {
                console.log('Using Flask data:', resultData);
                displayResults(resultData);
            } catch (error) {
                console.error('Error using Flask data:', error);
                showError('Error loading results. Please try analyzing your resume again.');
            }
        } else {
            // Check if we have data in sessionStorage as fallback
            const sessionData = sessionStorage.getItem('resumeAnalysisResults');
            console.log('Session storage data:', sessionData);
            
            if (sessionData) {
                try {
                    const data = JSON.parse(sessionData);
                    console.log('Parsed session data:', data);
                    
                    // Check if the data has the expected structure
                    if (data.predicted_role && data.extracted_text && data.genai_suggestions) {
                        displayResults(data);
                    } else {
                        console.error('Invalid data structure:', data);
                        showError('Invalid result data structure. Please try analyzing your resume again.');
                    }
                } catch (error) {
                    console.error('Error parsing session data:', error);
                    showError('Error loading results. Please try analyzing your resume again.');
                }
            } else {
                console.log('No data found, showing error');
                showError('No results found. Please analyze a resume first.');
            }
        }
    }

    function displayResults(data) {
        hideLoading();
        hideError();

        console.log('Displaying results:', data); // Debug log

        try {
            // Display predicted role
            if (data.predicted_role && roleText) {
                roleText.textContent = data.predicted_role;
                animateRoleBadge();
                console.log('Role updated:', data.predicted_role);
            }

            // Display AI suggestions
            if (data.genai_suggestions && genaiSuggestions) {
                genaiSuggestions.innerHTML = data.genai_suggestions;
                console.log('AI suggestions updated');
                console.log('AI suggestions element:', genaiSuggestions);
                
                // Ensure the content is visible
                genaiSuggestions.style.display = 'block';
            } else {
                console.error('Missing genai_suggestions or genaiSuggestions element:', { 
                    hasSuggestions: !!data.genai_suggestions, 
                    hasElement: !!genaiSuggestions 
                });
            }

            // Calculate and display ATS score
            const atsScore = calculateATSScore(data.genai_suggestions || '');
            displayATSScore(atsScore);

            // Animate confidence indicator
            animateConfidenceIndicator();

            // Add success animation
            addSuccessAnimation();

            // Show the results grid
            const resultsGrid = document.querySelector('.results-grid');
            if (resultsGrid) {
                resultsGrid.style.display = 'grid';
                console.log('Results grid displayed');
            }
            

            
            console.log('All results displayed successfully');
        } catch (error) {
            console.error('Error displaying results:', error);
            showError('Error displaying results: ' + error.message);
        }
    }



    function calculateATSScore(text) {
        if (!text) return 0;

        let score = 50; // Base score

        // Check for key resume elements in AI suggestions
        const checks = [
            { pattern: /\b(strengths|achievements|experience)\b/i, points: 15 },
            { pattern: /\b(improvements|suggestions|enhancement)\b/i, points: 15 },
            { pattern: /\b(ats|friendly|templates)\b/i, points: 10 },
            { pattern: /\b(skills|technologies|tools)\b/i, points: 10 },
            { pattern: /\b(quantifiable|results|impact)\b/i, points: 10 }
        ];

        checks.forEach(check => {
            if (check.pattern.test(text)) {
                score += check.points;
            }
        });

        // Bonus for comprehensive suggestions
        if (text.length > 1000) score += 5;
        if (text.length > 2000) score += 5;

        return Math.min(100, Math.max(0, score));
    }

    function displayATSScore(score) {
        atsScoreNumber.textContent = score;
        
        // Update ATS score description
        const scoreDescription = document.querySelector('.score-description h3');
        const scoreDescriptionText = document.querySelector('.score-description p');
        
        if (score >= 90) {
            scoreDescription.textContent = 'Excellent ATS Compatibility';
            scoreDescriptionText.textContent = 'Your resume is highly optimized for Applicant Tracking Systems';
        } else if (score >= 80) {
            scoreDescription.textContent = 'Very Good ATS Compatibility';
            scoreDescriptionText.textContent = 'Your resume has very good compatibility with ATS systems';
        } else if (score >= 70) {
            scoreDescription.textContent = 'Good ATS Compatibility';
            scoreDescriptionText.textContent = 'Your resume has good compatibility with Applicant Tracking Systems';
        } else if (score >= 60) {
            scoreDescription.textContent = 'Fair ATS Compatibility';
            scoreDescriptionText.textContent = 'Your resume has fair compatibility but could be improved';
        } else {
            scoreDescription.textContent = 'Needs Improvement';
            scoreDescriptionText.textContent = 'Your resume needs significant improvements for ATS compatibility';
        }

        // Animate the score circle
        animateScoreCircle(score);
    }

    function animateScoreCircle(score) {
        const circumference = 2 * Math.PI * 54; // r = 54
        const offset = circumference - (score / 100) * circumference;
        
        atsScoreCircle.style.strokeDashoffset = offset;
        
        // Animate the number
        let currentScore = 0;
        const targetScore = score;
        const increment = targetScore / 50;
        
        const scoreAnimation = setInterval(() => {
            currentScore += increment;
            if (currentScore >= targetScore) {
                currentScore = targetScore;
                clearInterval(scoreAnimation);
            }
            atsScoreNumber.textContent = Math.round(currentScore);
        }, 20);
    }



    function animateRoleBadge() {
        const roleBadge = document.querySelector('.role-badge');
        roleBadge.style.transform = 'scale(0.8)';
        roleBadge.style.opacity = '0';
        
        setTimeout(() => {
            roleBadge.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            roleBadge.style.transform = 'scale(1)';
            roleBadge.style.opacity = '1';
        }, 100);
    }

    function animateConfidenceIndicator() {
        const confidenceBar = document.querySelector('.confidence-fill');
        confidenceBar.style.width = '0%';
        
        setTimeout(() => {
            confidenceBar.style.transition = 'width 1.5s ease-in-out';
            confidenceBar.style.width = '85%';
        }, 500);
    }



    function addSuccessAnimation() {
        const cards = document.querySelectorAll('.result-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }

    function showError(message) {
        console.log('Showing error:', message);
        hideLoading();
        errorMessage.textContent = message;
        errorContainer.style.display = 'block';
        
        // Also hide the results grid when there's an error
        const resultsGrid = document.querySelector('.results-grid');
        if (resultsGrid) {
            resultsGrid.style.display = 'none';
        }
    }

    function hideError() {
        errorContainer.style.display = 'none';
    }

    function hideLoading() {
        if (loading) {
            loading.style.display = 'none';
            console.log('Loading hidden');
        }
    }





    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add loading tips rotation
    const loadingTips = [
        'Analyzing your resume with AI...',
        'Extracting key information...',
        'Identifying relevant skills...',
        'Generating personalized suggestions...',
        'Calculating ATS compatibility...',
        'Almost done, finalizing results...'
    ];

    let currentTipIndex = 0;
    let tipInterval;

    function startLoadingTips() {
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
    }

    function stopLoadingTips() {
        if (tipInterval) {
            clearInterval(tipInterval);
        }
    }

    // Start loading tips if loading is visible
    if (!loading.classList.contains('hidden')) {
        startLoadingTips();
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
        stopLoadingTips();
    });

    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        // Escape key to hide error
        if (e.key === 'Escape') {
            hideError();
        }
        
        // Enter key to expand/collapse cards when focused
        if (e.key === 'Enter' && document.activeElement.classList.contains('expand-btn')) {
            const cardId = document.activeElement.closest('.result-card').id;
            toggleCard(cardId);
        }
    });

    // Add intersection observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all cards for scroll animations
    document.querySelectorAll('.result-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease-out';
        observer.observe(card);
    });

    // Add print functionality enhancement
    window.addEventListener('beforeprint', function() {
        // Hide loading and error states before printing
        loading.classList.add('hidden');
        errorContainer.classList.add('hidden');
        
        // Expand all cards for better print layout
        document.querySelectorAll('.result-card').forEach(card => {
            const full = card.querySelector('[id$="-full"]');
            const preview = card.querySelector('[id$="-preview"]');
            if (full && preview) {
                full.classList.remove('hidden');
                preview.classList.add('hidden');
            }
        });
    });

    // Add responsive behavior
    function handleResize() {
        const isMobile = window.innerWidth <= 768;
        const cards = document.querySelectorAll('.result-card');
        
        cards.forEach(card => {
            if (isMobile) {
                card.style.marginBottom = '1rem';
            } else {
                card.style.marginBottom = '0';
            }
        });
    }

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    // Add accessibility enhancements
    document.querySelectorAll('.result-card').forEach(card => {
        card.setAttribute('role', 'region');
        const heading = card.querySelector('h2');
        if (heading && heading.id) {
            card.setAttribute('aria-labelledby', heading.id);
        }
    });

    // Add focus management for better accessibility
    document.querySelectorAll('.expand-btn').forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'Expand content');
        
        btn.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            this.setAttribute('aria-label', isExpanded ? 'Expand content' : 'Collapse content');
        });
    });
});
