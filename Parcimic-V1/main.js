// ===== MOBILE NAVIGATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            mobileMenuBtn.innerHTML = navMenu.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
    }
    
    // Close mobile menu when clicking a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                if (mobileMenuBtn) {
                    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                }
            }
        });
    });
    
    // Set active nav link based on current page
    setActiveNavLink();
    
    // Initialize page-specific functionality
    initPageSpecificFeatures();
});

// ===== SET ACTIVE NAV LINK =====
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (currentPage === linkHref || 
            (currentPage === '' && linkHref === 'index.html') ||
            (currentPage.includes(linkHref.replace('.html', '')))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// ===== PAGE-SPECIFIC FUNCTIONALITY =====
function initPageSpecificFeatures() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    switch(currentPage) {
        case 'symptom-checker.html':
            initSymptomChecker();
            break;
        case 'first-aid.html':
            initFirstAidGuide();
            break;
        case 'emergency.html':
            initEmergencyPage();
            break;
    }
}

// ===== SYMPTOM CHECKER PAGE =====
function initSymptomChecker() {
    const symptomForm = document.getElementById('symptomForm');
    const resultsCard = document.getElementById('resultsCard');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    // Symptom analysis rules (predefined)
    const symptomRules = {
        // Symptom combinations and their severity
        'fever_cough': {
            condition: 'Common Cold / Flu',
            severity: 'moderate',
            advice: [
                'Rest and stay hydrated',
                'Take fever-reducing medication if needed',
                'Monitor temperature regularly',
                'If fever persists beyond 3 days, see a doctor'
            ]
        },
        'fever_headache_nausea': {
            condition: 'Possible Migraine or Infection',
            severity: 'moderate',
            advice: [
                'Rest in a dark, quiet room',
                'Stay hydrated with water',
                'Avoid bright lights and loud noises',
                'If symptoms worsen, seek medical attention'
            ]
        },
        'chest_pain_shortness_of_breath': {
            condition: 'Requires Immediate Attention',
            severity: 'serious',
            advice: [
                'This could be a medical emergency',
                'Call for help immediately',
                'Sit down and try to remain calm',
                'Do not attempt to drive yourself'
            ]
        },
        'stomach_pain_vomiting': {
            condition: 'Gastrointestinal Issue',
            severity: 'moderate',
            advice: [
                'Drink clear fluids in small amounts',
                'Avoid solid foods for a few hours',
                'Rest and monitor symptoms',
                'If pain is severe or persists, see a doctor'
            ]
        },
        'dizziness_fatigue': {
            condition: 'Low Blood Pressure or Dehydration',
            severity: 'mild',
            advice: [
                'Drink plenty of fluids',
                'Sit or lie down when dizzy',
                'Eat regular meals',
                'If fainting occurs, seek medical help'
            ]
        }
    };
    
    // Default advice for no specific pattern
    const defaultAdvice = {
        mild: {
            condition: 'Mild Symptoms',
            severity: 'mild',
            advice: [
                'Rest and stay hydrated',
                'Monitor your symptoms',
                'Over-the-counter medication may help',
                'If symptoms persist or worsen, consult a doctor'
            ]
        },
        moderate: {
            condition: 'Moderate Symptoms',
            severity: 'moderate',
            advice: [
                'Rest and take appropriate medication',
                'Drink plenty of fluids',
                'Monitor symptoms closely',
                'Consider seeing a doctor if no improvement in 2-3 days'
            ]
        },
        serious: {
            condition: 'Serious Symptoms',
            severity: 'serious',
            advice: [
                'Seek medical attention immediately',
                'Do not wait for symptoms to improve',
                'Call emergency services if needed',
                'Inform someone about your condition'
            ]
        }
    };
    
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', function() {
            // Get selected symptoms
            const selectedSymptoms = [];
            document.querySelectorAll('input[name="symptoms"]:checked').forEach(checkbox => {
                selectedSymptoms.push(checkbox.value);
            });
            
            // Get duration
            const duration = document.getElementById('duration').value;
            
            // Validate selection
            if (selectedSymptoms.length === 0) {
                alert('Please select at least one symptom');
                return;
            }
            
            // Show loading state
            analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
            analyzeBtn.disabled = true;
            
            // Simulate analysis delay
            setTimeout(() => {
                // Analyze symptoms
                const analysis = analyzeSymptoms(selectedSymptoms, duration);
                
                // Display results
                displayResults(analysis);
                
                // Reset button
                analyzeBtn.innerHTML = '<i class="fas fa-stethoscope"></i> Analyze Symptoms';
                analyzeBtn.disabled = false;
            }, 1000);
        });
    }
    
    function analyzeSymptoms(symptoms, duration) {
        // Convert symptoms array to string for pattern matching
        const symptomKey = symptoms.sort().join('_');
        
        // Check for specific patterns first
        for (const pattern in symptomRules) {
            const patternSymptoms = pattern.split('_');
            if (patternSymptoms.every(symptom => symptoms.includes(symptom))) {
                const result = { ...symptomRules[pattern] };
                result.duration = duration;
                result.selectedSymptoms = symptoms;
                
                // Adjust severity based on duration
                if (duration === 'today' && result.severity === 'moderate') {
                    result.severity = 'mild';
                } else if (duration === 'more' && result.severity !== 'serious') {
                    result.severity = 'moderate';
                }
                
                return result;
            }
        }
        
        // Determine severity based on symptom count and type
        let severity = 'mild';
        const seriousSymptoms = ['chest_pain', 'shortness_of_breath', 'severe_bleeding'];
        const moderateSymptoms = ['fever', 'vomiting', 'severe_headache'];
        
        if (symptoms.some(symptom => seriousSymptoms.includes(symptom))) {
            severity = 'serious';
        } else if (symptoms.length >= 3 || 
                   symptoms.some(symptom => moderateSymptoms.includes(symptom))) {
            severity = 'moderate';
        }
        
        // Adjust based on duration
        if (duration === 'more' && severity === 'mild') {
            severity = 'moderate';
        } else if (duration === 'more' && severity === 'moderate') {
            severity = 'serious';
        }
        
        // Return default advice for the determined severity
        const result = { ...defaultAdvice[severity] };
        result.duration = duration;
        result.selectedSymptoms = symptoms;
        
        return result;
    }
    
    function displayResults(analysis) {
        // Update results card content
        document.getElementById('conditionName').textContent = analysis.condition;
        document.getElementById('severityLevel').textContent = 
            analysis.severity.charAt(0).toUpperCase() + analysis.severity.slice(1);
        document.getElementById('severityLevel').className = `severity-badge severity-${analysis.severity}`;
        
        // Update advice list
        const adviceList = document.getElementById('adviceList');
        adviceList.innerHTML = '';
        
        analysis.advice.forEach(advice => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-check-circle" style="color: var(--success)"></i> ${advice}`;
            adviceList.appendChild(li);
        });
        
        // Show duration info
        document.getElementById('durationInfo').textContent = 
            `Based on symptoms lasting: ${getDurationText(analysis.duration)}`;
        
        // Show selected symptoms
        const symptomsText = analysis.selectedSymptoms
            .map(symptom => symptom.replace('_', ' '))
            .join(', ');
        document.getElementById('selectedSymptoms').textContent = symptomsText;
        
        // Show results card
        resultsCard.classList.add('show');
        
        // Scroll to results
        resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    function getDurationText(duration) {
        switch(duration) {
            case 'today': return 'Today';
            case '1-3': return '1-3 days';
            case 'more': return 'More than 3 days';
            default: return 'Unknown';
        }
    }
    
    // Add event listeners to symptom options for better UX
    document.querySelectorAll('.symptom-option').forEach(option => {
        option.addEventListener('click', function() {
            const checkbox = this.querySelector('input');
            checkbox.checked = !checkbox.checked;
            this.classList.toggle('active', checkbox.checked);
        });
    });
}

// ===== FIRST AID GUIDE PAGE =====
function initFirstAidGuide() {
    // First aid data
    const firstAidData = {
        'fever': {
            title: 'Fever',
            icon: 'fas fa-thermometer-half',
            steps: [
                'Rest in a cool, comfortable environment',
                'Drink plenty of fluids (water, clear soups)',
                'Take fever-reducing medication like acetaminophen or ibuprofen as directed',
                'Use a damp cloth on forehead to help cool down',
                'Monitor temperature every 4 hours',
                'Seek medical help if fever is above 103°F (39.4°C) or lasts more than 3 days'
            ],
            dos: [
                'Stay hydrated',
                'Get plenty of rest',
                'Wear lightweight clothing',
                'Monitor temperature regularly'
            ],
            donts: [
                'Don\'t bundle up in heavy blankets',
                'Don\'t take aspirin (for children/teens)',
                'Don\'t ignore persistent high fever',
                'Don\'t use alcohol baths'
            ]
        },
        'cuts': {
            title: 'Minor Cuts & Scrapes',
            icon: 'fas fa-cut',
            steps: [
                'Wash your hands with soap and water',
                'Clean the wound with running water',
                'Apply gentle pressure with clean cloth to stop bleeding',
                'Apply antibiotic ointment',
                'Cover with sterile bandage or dressing',
                'Change dressing daily or when it gets wet/dirty'
            ],
            dos: [
                'Clean wound thoroughly',
                'Keep the area clean and dry',
                'Watch for signs of infection',
                'Update tetanus shot if needed'
            ],
            donts: [
                'Don\'t blow on the wound',
                'Don\'t use harsh chemicals like hydrogen peroxide',
                'Don\'t pick at scabs',
                'Don\'t ignore signs of infection'
            ]
        },
        'burns': {
            title: 'Minor Burns',
            icon: 'fas fa-fire',
            steps: [
                'Cool the burn under cool (not cold) running water for 10-15 minutes',
                'Remove tight items before swelling occurs',
                'Apply moisturizer or aloe vera gel',
                'Cover with sterile non-stick bandage',
                'Take over-the-counter pain reliever if needed',
                'Protect from sun while healing'
            ],
            dos: [
                'Cool with running water',
                'Keep the burn clean',
                'Use loose bandages',
                'Watch for infection signs'
            ],
            donts: [
                'Don\'t use ice directly on burn',
                'Don\'t pop blisters',
                'Don\'t apply butter or oil',
                'Don\'t use adhesive bandages directly on burn'
            ]
        },
        'headache': {
            title: 'Headache',
            icon: 'fas fa-head-side-virus',
            steps: [
                'Rest in a quiet, dark room',
                'Apply cold or warm compress to forehead or neck',
                'Drink plenty of water',
                'Massage temples and neck muscles',
                'Take over-the-counter pain medication as directed',
                'Practice relaxation techniques like deep breathing'
            ],
            dos: [
                'Stay hydrated',
                'Get adequate sleep',
                'Manage stress levels',
                'Maintain good posture'
            ],
            donts: [
                'Don\'t skip meals',
                'Don\'t consume excessive caffeine',
                'Don\'t strain your eyes',
                'Don\'t ignore persistent headaches'
            ]
        },
        'food_poisoning': {
            title: 'Food Poisoning',
            icon: 'fas fa-utensils',
            steps: [
                'Stop eating solid foods for a few hours',
                'Sip small amounts of clear liquids (water, broth)',
                'Try eating bland foods once vomiting stops (bananas, rice, toast)',
                'Avoid dairy, fatty, or spicy foods',
                'Get plenty of rest',
                'Seek medical help if symptoms last more than 48 hours'
            ],
            dos: [
                'Stay hydrated with electrolyte solutions',
                'Eat bland foods when ready',
                'Wash hands frequently',
                'Rest as much as possible'
            ],
            donts: [
                'Don\'t take anti-diarrhea medication immediately',
                'Don\'t eat dairy or fatty foods',
                'Don\'t ignore severe symptoms',
                'Don\'t prepare food for others'
            ]
        }
    };
    
    // Handle category card clicks
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            showFirstAidGuide(category);
        });
    });
    
    function showFirstAidGuide(category) {
        const guide = firstAidData[category];
        if (!guide) return;
        
        // Update guide content
        document.getElementById('guideTitle').textContent = guide.title;
        document.getElementById('guideIcon').className = guide.icon;
        
        // Update steps
        const stepsList = document.getElementById('stepsList');
        stepsList.innerHTML = '';
        guide.steps.forEach((step, index) => {
            const li = document.createElement('li');
            li.className = 'step-item';
            li.innerHTML = `<strong>Step ${index + 1}:</strong> ${step}`;
            stepsList.appendChild(li);
        });
        
        // Update dos
        const dosList = document.getElementById('dosList');
        dosList.innerHTML = '';
        guide.dos.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-check-circle" style="color: var(--success)"></i> ${item}`;
            dosList.appendChild(li);
        });
        
        // Update don'ts
        const dontsList = document.getElementById('dontsList');
        dontsList.innerHTML = '';
        guide.donts.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-times-circle" style="color: var(--danger)"></i> ${item}`;
            dontsList.appendChild(li);
        });
        
        // Show guide content
        document.getElementById('guideContent').classList.add('active');
        
        // Scroll to guide
        document.getElementById('guideContent').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
    
    // Show first category by default
    showFirstAidGuide('fever');
}

// ===== EMERGENCY PAGE =====
function initEmergencyPage() {
    // Emergency contact buttons
    document.querySelectorAll('.emergency-call-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const contactType = this.getAttribute('data-contact');
            const number = this.querySelector('.emergency-number').textContent;
            
            // Confirm before calling
            if (confirm(`Call ${contactType} at ${number}?`)) {
                // In a real app, this would initiate a phone call
                // For web demo, show a message
                alert(`In a real app, this would call ${contactType} at ${number}\n\nFor demo purposes only - please use real emergency services in actual emergencies.`);
                
                // Add visual feedback
                this.classList.add('pulse');
                setTimeout(() => {
                    this.classList.remove('pulse');
                }, 2000);
            }
        });
    });
    
    // Emergency tips toggle
    const emergencyTipsBtn = document.getElementById('emergencyTipsBtn');
    const emergencyTips = document.getElementById('emergencyTips');
    
    if (emergencyTipsBtn && emergencyTips) {
        emergencyTipsBtn.addEventListener('click', function() {
            emergencyTips.classList.toggle('active');
            this.innerHTML = emergencyTips.classList.contains('active') 
                ? '<i class="fas fa-chevron-up"></i> Hide Tips' 
                : '<i class="fas fa-chevron-down"></i> Show Emergency Tips';
        });
    }
}

// ===== SIMPLE FORM VALIDATION =====
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    const requiredInputs = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = 'var(--danger)';
            isValid = false;
            
            // Add error message
            let errorMsg = input.parentElement.querySelector('.error-message');
            if (!errorMsg) {
                errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                errorMsg.style.color = 'var(--danger)';
                errorMsg.style.fontSize = '0.875rem';
                errorMsg.style.marginTop = '0.25rem';
                input.parentElement.appendChild(errorMsg);
            }
            errorMsg.textContent = 'This field is required';
        } else {
            input.style.borderColor = 'var(--gray)';
            
            // Remove error message
            const errorMsg = input.parentElement.querySelector('.error-message');
            if (errorMsg) {
                errorMsg.remove();
            }
        }
    });
    
    return isValid;
}

// ===== SIMPLE TOAST NOTIFICATION =====
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--primary)'};
        color: white;
        border-radius: var(--radius);
        box-shadow: var(--shadow-lg);
        z-index: 9999;
        animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
        max-width: 300px;
    `;
    
    // Add icon based on type
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 'info-circle';
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// Add CSS for toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== SESSION MANAGEMENT =====
// Simple session tracking for demo purposes
function initSession() {
    // Check if first visit
    if (!localStorage.getItem('medai_first_visit')) {
        localStorage.setItem('medai_first_visit', new Date().toISOString());
        showToast('Welcome to MedAI! Remember: This is for educational purposes only.', 'info');
    }
    
    // Track page views (demo only)
    const pageViews = parseInt(localStorage.getItem('medai_page_views') || '0');
    localStorage.setItem('medai_page_views', (pageViews + 1).toString());
}

// ===== DEMO MODE HELPERS =====
// Show disclaimer on symptom checker
function showSymptomDisclaimer() {
    const disclaimer = document.createElement('div');
    disclaimer.className = 'disclaimer';
    disclaimer.innerHTML = `
        <div class="disclaimer-content">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
                <h4>Important Medical Disclaimer</h4>
                <p>This symptom checker provides general information only and is not a medical diagnosis. Always consult with a healthcare professional for proper medical advice. In case of emergency, call your local emergency number immediately.</p>
            </div>
        </div>
    `;
    
    // Insert at the beginning of symptom checker page
    const symptomChecker = document.querySelector('.symptom-checker');
    if (symptomChecker) {
        symptomChecker.insertBefore(disclaimer, symptomChecker.firstChild);
    }
}

// ===== INITIALIZE APP =====
// Run on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all core functionality
    initSession();
    
    // Show disclaimer on symptom checker page
    if (window.location.pathname.includes('symptom-checker')) {
        showSymptomDisclaimer();
    }
    
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
});

// ===== ACCESSIBILITY HELPERS =====
// Add keyboard navigation support
document.addEventListener('keydown', function(e) {
    // Escape key closes mobile menu
    if (e.key === 'Escape') {
        const navMenu = document.querySelector('.nav-menu');
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        
        if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            if (mobileMenuBtn) {
                mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            }
        }
    }
    
    // Enter key on symptom options
    if (e.key === 'Enter' && e.target.classList.contains('symptom-option')) {
        e.target.click();
    }
});

// ===== OFFLINE SUPPORT (Basic) =====
// Show offline warning
window.addEventListener('online', function() {
    showToast('You are back online', 'success');
});

window.addEventListener('offline', function() {
    showToast('You are offline. Some features may not work.', 'warning');
});

// ===== PRINT SUPPORT =====
// Add print button functionality
function addPrintButtons() {
    const printSections = document.querySelectorAll('.print-section');
    
    printSections.forEach(section => {
        const printBtn = document.createElement('button');
        printBtn.className = 'btn btn-secondary btn-small';
        printBtn.innerHTML = '<i class="fas fa-print"></i> Print';
        printBtn.style.marginTop = '1rem';
        
        printBtn.addEventListener('click', function() {
            const printContent = section.innerHTML;
            const originalContent = document.body.innerHTML;
            
            document.body.innerHTML = `
                <div style="padding: 20px; font-family: 'Inter', sans-serif;">
                    <h1 style="color: var(--primary);">MedAI - Medical Information</h1>
                    <hr style="margin: 20px 0;">
                    ${printContent}
                    <hr style="margin: 20px 0;">
                    <p style="font-size: 0.9rem; color: var(--secondary);">
                        Printed from MedAI - Quick Medical Help for Students<br>
                        Date: ${new Date().toLocaleDateString()}
                    </p>
                </div>
            `;
            
            window.print();
            document.body.innerHTML = originalContent;
            location.reload(); // Refresh to restore functionality
        });
        
        section.appendChild(printBtn);
    });
}

// Initialize print buttons on appropriate pages
if (document.querySelector('.first-aid') || document.querySelector('.emergency')) {
    addPrintButtons();
}

// ===== DEMO MODE INDICATOR =====
// Add a subtle demo mode indicator
function addDemoIndicator() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const demoIndicator = document.createElement('div');
        demoIndicator.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: var(--warning);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            z-index: 9999;
            opacity: 0.7;
        `;
        demoIndicator.textContent = 'DEMO MODE';
        document.body.appendChild(demoIndicator);
    }
}

// Add demo indicator
addDemoIndicator();