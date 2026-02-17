// Main Application Script
class ParcimicApp {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'home';
        this.pages = {
            'home': 'pages/home.html',
            'medicine-reminder': 'pages/medicine-reminder.html',
            'emergency-map': 'pages/emergency-map.html',
            'ai-assistant': 'pages/ai-assistant.html',
            'health-records': 'pages/health-records.html',
            'profile': 'pages/profile.html'
        };
        
        this.init();
    }

    async init() {
        // Show loading screen
        this.showLoading();
        
        // Initialize Firebase
        await this.initFirebase();
        
        // Check auth state
        this.initAuth();
        
        // Initialize navigation
        this.initNavigation();
        
        // Load initial page
        await this.loadPage('home');
        
        // Hide loading
        this.hideLoading();
        
        // Show welcome notification
        setTimeout(() => {
            this.showToast('Welcome to Parcimic Medical Platform! 🏥', 'info');
        }, 1000);
    }

    showLoading() {
        let progress = 0;
        const progressFill = document.getElementById('progressFill');
        const interval = setInterval(() => {
            progress += Math.random() * 25;
            if (progress > 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressFill.style.width = `${progress}%`;
        }, 200);
    }

    hideLoading() {
        const loadingEl = document.getElementById('app-loading');
        loadingEl.style.opacity = '0';
        setTimeout(() => {
            loadingEl.style.display = 'none';
        }, 500);
    }

    async initFirebase() {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.showToast('Firebase initialization failed', 'error');
        }
    }

    initAuth() {
        firebase.auth().onAuthStateChanged((user) => {
            this.currentUser = user;
            this.updateAuthUI();
        });
    }

    updateAuthUI() {
        const userProfile = document.getElementById('userProfile');
        const loginButton = document.getElementById('loginButton');
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        
        if (this.currentUser) {
            userProfile.style.display = 'flex';
            loginButton.style.display = 'none';
            
            userName.textContent = this.currentUser.displayName || this.currentUser.email.split('@')[0];
            userEmail.textContent = this.currentUser.email;
            
            if (this.currentUser.photoURL) {
                userAvatar.innerHTML = `<img src="${this.currentUser.photoURL}" alt="Profile">`;
            } else {
                const initials = this.currentUser.displayName ? 
                    this.currentUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase() : 
                    this.currentUser.email[0].toUpperCase();
                userAvatar.innerHTML = `<span>${initials}</span>`;
            }
        } else {
            userProfile.style.display = 'none';
            loginButton.style.display = 'block';
        }
    }

    initNavigation() {
        // Handle top navigation clicks
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('.nav-link');
            if (navLink) {
                e.preventDefault();
                const page = navLink.getAttribute('href').replace('#', '');
                this.loadPage(page);
                this.updateActiveNav(page);
                this.closeMobileMenu();
            }
            
            // Handle bottom navigation clicks
            const bottomNavItem = e.target.closest('.bottom-nav-item');
            if (bottomNavItem) {
                e.preventDefault();
                const page = bottomNavItem.getAttribute('href').replace('#', '');
                this.loadPage(page);
                this.updateActiveBottomNav(page);
            }
            
            // Handle mobile menu button
            const mobileMenuBtn = e.target.closest('#mobileMenuBtn');
            if (mobileMenuBtn) {
                this.toggleMobileMenu();
            }
            
            // Handle mobile menu overlay
            const mobileMenuOverlay = e.target.closest('#mobileMenuOverlay');
            if (mobileMenuOverlay) {
                this.closeMobileMenu();
            }
        });
        
        // Initialize mobile menu
        this.initMobileMenu();
    }

    initMobileMenu() {
        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }
        });
        
        // Close menu on outside click (mobile only)
        document.addEventListener('click', (e) => {
            const navMenu = document.getElementById('navMenu');
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            
            if (navMenu.classList.contains('active') && 
                !navMenu.contains(e.target) && 
                !mobileMenuBtn.contains(e.target) &&
                window.innerWidth <= 992) {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        const navMenu = document.getElementById('navMenu');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
        
        navMenu.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
        mobileMenuOverlay.classList.toggle('active');
        
        if (navMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    closeMobileMenu() {
        const navMenu = document.getElementById('navMenu');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
        
        navMenu.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    async loadPage(page) {
        try {
            this.currentPage = page;
            
            // Show loading state
            const contentContainer = document.getElementById('page-content');
            contentContainer.innerHTML = '<div class="loading-spinner"></div>';
            
            // Load page content
            const response = await fetch(this.pages[page]);
            const content = await response.text();
            
            // Update content
            contentContainer.innerHTML = content;
            
            // Initialize page-specific functionality
            this.initPageFunctionality(page);
            
            // Scroll to top
            window.scrollTo(0, 0);
            
        } catch (error) {
            console.error('Error loading page:', error);
            this.showToast('Error loading page', 'error');
        }
    }

    initPageFunctionality(page) {
        switch(page) {
            case 'home':
                this.initHomePage();
                break;
            case 'medicine-reminder':
                this.initMedicineReminderPage();
                break;
            case 'emergency-map':
                this.initEmergencyMapPage();
                break;
            case 'ai-assistant':
                this.initAIAssistantPage();
                break;
            case 'health-records':
                this.initHealthRecordsPage();
                break;
            case 'profile':
                this.initProfilePage();
                break;
        }
    }

    initHomePage() {
        // Initialize home page features
        this.updateStats();
        
        // Add event listeners for quick actions
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const action = e.currentTarget.querySelector('h4').textContent.toLowerCase();
                this.handleQuickAction(action);
            });
        });
    }

    handleQuickAction(action) {
        switch(action) {
            case 'add reminder':
                if (this.currentUser) {
                    this.loadPage('medicine-reminder');
                } else {
                    this.openLoginModal();
                }
                break;
            case 'emergency':
                this.openEmergencyModal();
                break;
            case 'ai chat':
                if (this.currentUser) {
                    this.loadPage('ai-assistant');
                } else {
                    this.openLoginModal();
                }
                break;
            case 'records':
                if (this.currentUser) {
                    this.loadPage('health-records');
                } else {
                    this.openLoginModal();
                }
                break;
        }
    }

    updateStats() {
        // Update nearby hospitals count (would be fetched from API)
        document.getElementById('nearbyHospitals').textContent = '0';
        
        // Update active reminders count
        if (this.currentUser) {
            // Fetch from Firebase
            document.getElementById('activeReminders').textContent = '0';
        } else {
            document.getElementById('activeReminders').textContent = '0';
        }
    }

    initMedicineReminderPage() {
        if (!this.currentUser) {
            this.showAuthRequired('medicine-reminder');
            return;
        }
        
        // Load user's reminders
        this.loadReminders();
        
        // Add event listener for add reminder button
        const addReminderBtn = document.getElementById('addReminderBtn');
        if (addReminderBtn) {
            addReminderBtn.addEventListener('click', () => {
                this.openAddReminderModal();
            });
        }
    }

    initEmergencyMapPage() {
        // This page is accessible to everyone
        this.initMap();
    }

    initAIAssistantPage() {
        if (!this.currentUser) {
            this.showAuthRequired('ai-assistant');
            return;
        }
        
        // Initialize AI assistant functionality
        const startChatBtn = document.getElementById('startChatBtn');
        if (startChatBtn) {
            startChatBtn.addEventListener('click', () => {
                this.openPulseAI();
            });
        }
    }

    initHealthRecordsPage() {
        if (!this.currentUser) {
            this.showAuthRequired('health-records');
            return;
        }
        
        // Load user's health records
        this.loadHealthRecords();
    }

    initProfilePage() {
        if (!this.currentUser) {
            this.showAuthRequired('profile');
            return;
        }
        
        // Update profile information
        this.updateProfileInfo();
    }

    showAuthRequired(page) {
        const contentContainer = document.getElementById('page-content');
        contentContainer.innerHTML = `
            <div class="auth-required">
                <div class="auth-required-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h3>Authentication Required</h3>
                <p>Please sign in to access the ${page.replace('-', ' ')} features</p>
                <button class="btn btn-primary" onclick="app.openLoginModal()">
                    <i class="fas fa-sign-in-alt"></i> Sign In
                </button>
            </div>
        `;
    }

    updateActiveNav(page) {
        // Update top navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${page}`) {
                link.classList.add('active');
            }
        });
        
        // Update bottom navigation
        this.updateActiveBottomNav(page);
    }

    updateActiveBottomNav(page) {
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${page}`) {
                item.classList.add('active');
            }
        });
    }

    // Authentication Functions
    async signInWithGoogle() {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        const button = document.getElementById('googleLoginBtn');
        const spinner = document.getElementById('googleSpinner');
        
        spinner.style.display = 'inline-block';
        button.disabled = true;
        
        try {
            await firebase.auth().signInWithPopup(provider);
            this.closeLoginModal();
            this.showToast('Successfully signed in!', 'success');
            
            // Reload current page
            this.loadPage(this.currentPage);
            
        } catch (error) {
            console.error('Google sign-in error:', error);
            this.showToast('Sign in failed: ' + error.message, 'error');
        } finally {
            spinner.style.display = 'none';
            button.disabled = false;
        }
    }

    signInWithPhone() {
        this.showToast('Phone authentication coming soon!', 'info');
    }

    async signOut() {
        try {
            await firebase.auth().signOut();
            this.showToast('Successfully signed out', 'success');
            this.toggleUserDropdown();
            
            // Redirect to home page
            this.loadPage('home');
            
        } catch (error) {
            console.error('Sign out error:', error);
            this.showToast('Sign out failed', 'error');
        }
    }

    // Modal Functions
    openLoginModal() {
        document.getElementById('loginModal').classList.add('active');
    }

    closeLoginModal() {
        document.getElementById('loginModal').classList.remove('active');
    }

    openAddReminderModal() {
        // Implement add reminder modal
        this.showToast('Add reminder feature coming soon!', 'info');
    }

    openEmergencyModal() {
        if (confirm('🚨 **EMERGENCY CALL - INDIA**\n\nCall National Emergency (112) only for genuine emergencies:\n• Chest pain/difficulty breathing\n• Severe bleeding\n• Loss of consciousness\n• Stroke symptoms (FAST)\n• Severe allergic reactions\n\nPress OK to call or Cancel.')) {
            window.location.href = 'tel:112';
        }
    }

    openPulseAI() {
        window.open('https://cdn.botpress.cloud/webchat/v3.5/shareable.html?configUrl=https://files.bpcontent.cloud/2025/12/20/16/20251220165150-G2HH6L15.json', '_blank');
    }

    // User Dropdown
    toggleUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        dropdown.classList.toggle('active');
    }

    viewProfile() {
        this.loadPage('profile');
        this.toggleUserDropdown();
    }

    viewSettings() {
        this.showToast('Settings feature coming soon!', 'info');
        this.toggleUserDropdown();
    }

    showHealthRecords() {
        this.loadPage('health-records');
        this.toggleUserDropdown();
    }

    // Data Loading Functions
    async loadReminders() {
        if (!this.currentUser) return;
        
        try {
            // Fetch from Firebase
            const remindersContainer = document.getElementById('remindersContainer');
            remindersContainer.innerHTML = `
                <div class="reminder-card">
                    <div class="reminder-header">
                        <div class="reminder-title">No Reminders Yet</div>
                    </div>
                    <p>Add your first medicine reminder to get started</p>
                    <button class="btn btn-primary" onclick="app.openAddReminderModal()" style="margin-top: 20px;">
                        <i class="fas fa-plus"></i> Add Your First Reminder
                    </button>
                </div>
            `;
        } catch (error) {
            console.error('Error loading reminders:', error);
        }
    }

    async loadHealthRecords() {
        if (!this.currentUser) return;
        
        try {
            // Fetch from Supabase/Firebase
            const recordsContainer = document.getElementById('recordsContainer');
            recordsContainer.innerHTML = `
                <div class="record-card">
                    <div class="record-header">
                        <div class="record-title">No Health Records</div>
                    </div>
                    <p>No health records found. Records will appear here once added.</p>
                </div>
            `;
        } catch (error) {
            console.error('Error loading health records:', error);
        }
    }

    updateProfileInfo() {
        if (!this.currentUser) return;
        
        const profileAvatar = document.getElementById('profileAvatarLarge');
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        
        profileName.textContent = this.currentUser.displayName || this.currentUser.email.split('@')[0];
        profileEmail.textContent = this.currentUser.email;
        
        if (this.currentUser.photoURL) {
            profileAvatar.innerHTML = `<img src="${this.currentUser.photoURL}" alt="Profile">`;
        } else {
            const initials = this.currentUser.displayName ? 
                this.currentUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase() : 
                this.currentUser.email[0].toUpperCase();
            profileAvatar.innerHTML = `<span>${initials}</span>`;
        }
    }

    // Map Functions
    initMap() {
        // Initialize map if container exists
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;
        
        // Simple map initialization - would be expanded with Leaflet
        mapContainer.innerHTML = `
            <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f1f5f9; border-radius: 8px;">
                <div style="text-align: center;">
                    <i class="fas fa-map-marked-alt" style="font-size: 3rem; color: #64748b; margin-bottom: 20px;"></i>
                    <h3 style="color: #475569; margin-bottom: 10px;">Map Loading...</h3>
                    <p style="color: #64748b;">Interactive map will be displayed here</p>
                    <button class="btn btn-primary" onclick="app.getUserLocation()" style="margin-top: 20px;">
                        <i class="fas fa-location-dot"></i> Use My Location
                    </button>
                </div>
            </div>
        `;
    }

    getUserLocation() {
        if (!navigator.geolocation) {
            this.showToast('Geolocation not supported', 'error');
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                this.showToast(`Location found: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, 'success');
            },
            (error) => {
                console.error('Geolocation error:', error);
                this.showToast('Location access denied', 'error');
            }
        );
    }

    // Toast Notifications
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ParcimicApp();
});

// Global functions for HTML onclick handlers
function openLoginModal() {
    if (window.app) window.app.openLoginModal();
}

function closeLoginModal() {
    if (window.app) window.app.closeLoginModal();
}

function signInWithGoogle() {
    if (window.app) window.app.signInWithGoogle();
}

function signInWithPhone() {
    if (window.app) window.app.signInWithPhone();
}

function signOut() {
    if (window.app) window.app.signOut();
}

function toggleUserDropdown() {
    if (window.app) window.app.toggleUserDropdown();
}

function viewProfile() {
    if (window.app) window.app.viewProfile();
}

function viewSettings() {
    if (window.app) window.app.viewSettings();
}

function showHealthRecords() {
    if (window.app) window.app.showHealthRecords();
}

function openAddReminderModal() {
    if (window.app) window.app.openAddReminderModal();
}

function openEmergencyModal() {
    if (window.app) window.app.openEmergencyModal();
}

function openPulseAI() {
    if (window.app) window.app.openPulseAI();
}