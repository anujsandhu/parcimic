// Main Application Script
class ParcimicApp {
    constructor() {
        this.currentUser = null;
        this.reminders = [];
        this.healthRecords = [];
        this.map = null;
        this.userMarker = null;
        this.placeMarkers = [];
        this.currentSearchRadius = 10;
        this.mapInteractionEnabled = false;
        this.deferredPrompt = null;
        this.notificationInterval = null;
        
        this.INDIAN_CITIES = [
            { lat: 28.6139, lng: 77.2090, name: 'Delhi' },
            { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
            { lat: 13.0827, lng: 80.2707, name: 'Chennai' },
            { lat: 12.9716, lng: 77.5946, name: 'Bangalore' },
            { lat: 22.5726, lng: 88.3639, name: 'Kolkata' },
            { lat: 17.3850, lng: 78.4867, name: 'Hyderabad' }
        ];
        
        this.init();
    }

    async init() {
        // Show loading screen
        this.showLoading();
        
        // Initialize Firebase
        await this.initFirebase();
        
        // Check auth state
        this.initAuth();
        
        // Initialize components
        this.initMobileMenu();
        this.initScrollEffects();
        this.initMap();
        this.initRangeSelector();
        this.initEventListeners();
        this.initNotificationSystem();
        this.initPWA();
        
        // Hide loading
        setTimeout(() => {
            this.hideLoading();
            this.showWelcomeNotification();
        }, 1500);
    }

    showLoading() {
        const loadingShown = sessionStorage.getItem('parcimic_first_load');
        
        if (!loadingShown) {
            let progress = 0;
            const progressFill = document.getElementById('progressFill');
            const interval = setInterval(() => {
                progress += Math.random() * 25;
                if (progress > 100) {
                    progress = 100;
                    clearInterval(interval);
                    sessionStorage.setItem('parcimic_first_load', 'true');
                }
                progressFill.style.width = `${progress}%`;
            }, 200);
        } else {
            document.getElementById('app-loading').style.display = 'none';
        }
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
            // Check if Firebase is already initialized
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
            this.updateUserUI(user);
            
            if (user) {
                this.loadUserData();
                this.scheduleReminderCheck();
            } else {
                this.reminders = [];
                this.healthRecords = [];
                this.updateRemindersUI();
                this.updateHealthRecordsUI();
                clearInterval(this.notificationInterval);
            }
        });
    }

    updateUserUI(user) {
        const userProfile = document.getElementById('userProfile');
        const loginButton = document.getElementById('loginButton');
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const profileAvatar = document.getElementById('profileAvatar');
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        
        if (user) {
            // Show user profile, hide login button
            userProfile.style.display = 'flex';
            loginButton.style.display = 'none';
            
            // Update user info
            userName.textContent = user.displayName || user.email.split('@')[0];
            userEmail.textContent = user.email;
            profileName.textContent = user.displayName || user.email.split('@')[0];
            profileEmail.textContent = user.email;
            
            // Update avatars
            if (user.photoURL) {
                userAvatar.innerHTML = `<img src="${user.photoURL}" alt="Profile">`;
                profileAvatar.innerHTML = `<img src="${user.photoURL}" alt="Profile">`;
            } else {
                const initials = user.displayName ? 
                    user.displayName.split(' ').map(n => n[0]).join('').toUpperCase() : 
                    user.email[0].toUpperCase();
                userAvatar.innerHTML = `<span>${initials}</span>`;
                profileAvatar.innerHTML = `<span>${initials}</span>`;
            }
            
            // Store user data locally
            localStorage.setItem('parcimic_user', JSON.stringify({
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                timestamp: Date.now()
            }));
        } else {
            // Show login button, hide user profile
            userProfile.style.display = 'none';
            loginButton.style.display = 'block';
            
            // Reset profile info
            profileName.textContent = 'Guest User';
            profileEmail.textContent = 'Sign in to access profile';
            profileAvatar.innerHTML = '<i class="fas fa-user"></i>';
            
            localStorage.removeItem('parcimic_user');
        }
    }

    // Mobile Menu Functions
    initMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const navMenu = document.getElementById('navMenu');
        const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
        const navLinks = document.querySelectorAll('.nav-link');
        const bottomNavItems = document.querySelectorAll('.bottom-nav-item');

        if (!mobileMenuBtn || !navMenu) return;

        let menuOpen = false;

        const openMobileMenu = () => {
            mobileMenuBtn.classList.add('active');
            navMenu.classList.add('active');
            mobileMenuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            menuOpen = true;
        };

        const closeMobileMenu = () => {
            mobileMenuBtn.classList.remove('active');
            navMenu.classList.remove('active');
            mobileMenuOverlay.classList.remove('active');
            document.body.style.overflow = '';
            menuOpen = false;
        };

        const toggleMobileMenu = () => {
            menuOpen ? closeMobileMenu() : openMobileMenu();
        };

        // Mobile menu button
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMobileMenu();
        });

        // Overlay click
        mobileMenuOverlay.addEventListener('click', closeMobileMenu);

        // Nav links click
        navLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        // Bottom nav items click
        bottomNavItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetId = item.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
                
                // Update active states
                bottomNavItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menuOpen) {
                closeMobileMenu();
            }
        });

        // Close on outside click (mobile only)
        document.addEventListener('click', (e) => {
            if (!menuOpen || window.innerWidth > 992) return;
            if (!navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                closeMobileMenu();
            }
        });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const targetElement = document.querySelector(targetId);
                if (!targetElement) return;

                e.preventDefault();

                if (window.innerWidth <= 992) closeMobileMenu();

                setTimeout(() => {
                    window.scrollTo({
                        top: targetElement.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }, 300);
            });
        });

        // Handle resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 992 && menuOpen) {
                closeMobileMenu();
            }
            
            // Show/hide bottom nav based on screen size
            const bottomNav = document.getElementById('bottomNav');
            if (window.innerWidth <= 992) {
                bottomNav.style.display = 'flex';
            } else {
                bottomNav.style.display = 'none';
            }
        });

        // Initial bottom nav state
        const bottomNav = document.getElementById('bottomNav');
        if (window.innerWidth <= 992) {
            bottomNav.style.display = 'flex';
        }
    }

    initScrollEffects() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;

        // Navbar scroll effect
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });

        // Section active state
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        window.addEventListener('scroll', () => {
            let current = '';

            sections.forEach(section => {
                if (window.scrollY >= section.offsetTop - 150) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.toggle(
                    'active',
                    link.getAttribute('href') === `#${current}`
                );
            });
        });
    }

    // Map Functions
    initMap() {
        try {
            const defaultCity = this.INDIAN_CITIES[0];
            
            this.map = L.map("map").setView([defaultCity.lat, defaultCity.lng], 12);
            
            // Disable map interactions initially
            this.map.dragging.disable();
            this.map.touchZoom.disable();
            this.map.doubleClickZoom.disable();
            this.map.scrollWheelZoom.disable();
            this.map.boxZoom.disable();
            this.map.keyboard.disable();
            
            // Add tile layer
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap contributors",
                maxZoom: 19,
            }).addTo(this.map);
            
            // Add legend
            this.addMapLegend();
            
            // Initialize map controls
            this.initMapControls();
            
        } catch (error) {
            console.error('Error initializing map:', error);
            this.showToast('Map initialization failed', 'error');
        }
    }

    addMapLegend() {
        const legend = L.control({position: 'bottomright'});
        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'legend');
            div.innerHTML = `
                <div style="padding: 15px; background: rgba(255, 255, 255, 0.95); border-radius: 12px; border: 1px solid rgba(0,0,0,0.1); box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <h4 style="margin: 0 0 12px 0; font-size: 0.9rem; color: #0f172a; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600;">Medical Facilities</h4>
                    <div class="legend-item">
                        <div class="legend-icon" style="background: #2563eb;"></div>
                        <span>Hospital</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-icon" style="background: #06b6d4;"></div>
                        <span>Pharmacy</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-icon" style="background: #10b981;"></div>
                        <span>Clinic</span>
                    </div>
                </div>
            `;
            return div;
        };
        legend.addTo(this.map);
    }

    initMapControls() {
        // Locate button
        document.getElementById('locateBtn').addEventListener('click', () => {
            this.getUserLocation();
        });
    }

    initRangeSelector() {
        const rangeSlider = document.getElementById('rangeSlider');
        const rangeValue = document.getElementById('rangeValue');
        
        rangeSlider.addEventListener('input', () => {
            this.currentSearchRadius = parseInt(rangeSlider.value);
            rangeValue.textContent = this.currentSearchRadius + ' km';
            
            if (this.userMarker) {
                const latlng = this.userMarker.getLatLng();
                this.searchNearbyFacilities(latlng.lat, latlng.lng, this.currentSearchRadius * 1000);
            }
        });
    }

    async getUserLocation() {
        if (!navigator.geolocation) {
            this.showToast('Geolocation not supported', 'error');
            this.useCityLocation(this.INDIAN_CITIES[0]);
            return;
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });
            
            const { latitude, longitude } = position.coords;
            this.updateLocation(latitude, longitude);
            
        } catch (error) {
            console.error('Geolocation error:', error);
            this.showToast('Location access denied', 'error');
            this.useCityLocation(this.INDIAN_CITIES[0]);
        }
    }

    useCityLocation(city) {
        this.showToast(`Searching in ${city.name}...`, 'info');
        this.updateLocation(city.lat, city.lng);
    }

    updateLocation(lat, lng) {
        this.map.setView([lat, lng], 13);
        
        // Clear previous markers
        if (this.userMarker) {
            this.map.removeLayer(this.userMarker);
        }
        this.placeMarkers.forEach(marker => this.map.removeLayer(marker));
        this.placeMarkers = [];
        
        // Add user marker
        const userIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="width: 40px; height: 40px; background: #8b5cf6; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem; border: 3px solid white; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">
                    <i class="fas fa-user"></i>
                </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });
        
        this.userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(this.map);
        
        // Search for facilities
        this.searchNearbyFacilities(lat, lng, this.currentSearchRadius * 1000);
    }

    async searchNearbyFacilities(lat, lng, radius) {
        const query = `
            [out:json];
            (
                node["amenity"="hospital"](around:${radius},${lat},${lng});
                node["amenity"="clinic"](around:${radius},${lat},${lng});
                node["amenity"="pharmacy"](around:${radius},${lat},${lng});
                node["healthcare"="hospital"](around:${radius},${lat},${lng});
                node["healthcare"="clinic"](around:${radius},${lat},${lng});
            );
            out body;
            >;
            out skel qt;
        `;
        
        try {
            const response = await fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query));
            const data = await response.json();
            
            if (data.elements && data.elements.length > 0) {
                this.renderFacilities(data.elements);
                
                // Update nearby hospitals count
                document.getElementById('nearbyHospitals').textContent = data.elements.length;
                
                this.showToast(`Found ${data.elements.length} medical facilities`, 'success');
            } else {
                this.showToast('No facilities found. Expanding search...', 'info');
                setTimeout(() => {
                    this.searchInExpandedRadius(lat, lng);
                }, 1500);
            }
        } catch (error) {
            console.error('Error fetching facilities:', error);
            this.showToast('Unable to load facilities data', 'error');
        }
    }

    async searchInExpandedRadius(lat, lng) {
        const expandedQuery = `
            [out:json];
            (
                node["amenity"="hospital"](around:50000,${lat},${lng});
                node["amenity"="clinic"](around:50000,${lat},${lng});
                node["amenity"="pharmacy"](around:50000,${lat},${lng});
            );
            out body;
            >;
            out skel qt;
        `;
        
        try {
            const response = await fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(expandedQuery));
            const data = await response.json();
            
            if (data.elements && data.elements.length > 0) {
                const facilities = data.elements.slice(0, 5);
                this.renderFacilities(facilities);
                this.showToast(`Found ${facilities.length} nearest facilities`, 'success');
            } else {
                this.showToast('No medical facilities found in the area', 'error');
            }
        } catch (error) {
            console.error('Error in expanded search:', error);
            this.showToast('Search service unavailable', 'error');
        }
    }

    renderFacilities(facilities) {
        facilities.forEach(facility => {
            if (!facility.lat || !facility.lon) return;
            
            const amenity = facility.tags?.amenity || facility.tags?.healthcare || 'medical';
            let iconColor, iconType;
            
            if (amenity === 'pharmacy') {
                iconColor = '#06b6d4';
                iconType = 'pills';
            } else if (amenity === 'clinic') {
                iconColor = '#10b981';
                iconType = 'stethoscope';
            } else {
                iconColor = '#2563eb';
                iconType = 'hospital';
            }
            
            const customIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="width: 40px; height: 40px; background: ${iconColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                        <i class="fas fa-${iconType}"></i>
                    </div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            });
            
            const marker = L.marker([facility.lat, facility.lon], { icon: customIcon }).addTo(this.map);
            
            const popupContent = `
                <div style="min-width: 250px; padding: 15px;">
                    <strong style="font-size: 1.1rem; color: #0f172a;">${facility.tags?.name || "Medical Facility"}</strong><br>
                    <small style="color: #64748b;">${this.getFacilityType(amenity)}</small>
                    ${facility.tags?.['addr:street'] ? `<p style="margin: 8px 0; color: #475569;"><i class="fas fa-map-marker-alt"></i> ${facility.tags['addr:street']}</p>` : ''}
                    <a href="${this.getNavigationLink(facility.lat, facility.lon)}" target="_blank" 
                       style="display: block; padding: 8px 16px; background: ${iconColor}; color: white; text-align: center; border-radius: 8px; text-decoration: none; margin-top: 12px; font-weight: 600;">
                        <i class="fas fa-directions"></i> Get Directions
                    </a>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            this.placeMarkers.push(marker);
        });
    }

    getFacilityType(amenity) {
        const types = {
            'hospital': 'Hospital',
            'clinic': 'Medical Clinic',
            'pharmacy': 'Pharmacy',
            'medical': 'Medical Facility'
        };
        return types[amenity] || 'Medical Facility';
    }

    getNavigationLink(lat, lng) {
        return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    }

    // User Data Management
    async loadUserData() {
        if (!this.currentUser) return;
        
        await Promise.all([
            this.loadReminders(),
            this.loadHealthRecords()
        ]);
        
        this.updateDashboardStats();
    }

    async loadReminders() {
        if (!this.currentUser) {
            this.updateRemindersUI();
            return;
        }
        
        try {
            const querySnapshot = await firebase.firestore()
                .collection('users')
                .doc(this.currentUser.uid)
                .collection('reminders')
                .orderBy('createdAt', 'desc')
                .get();
            
            this.reminders = [];
            querySnapshot.forEach((doc) => {
                this.reminders.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            this.updateRemindersUI();
            
        } catch (error) {
            console.error('Error loading reminders:', error);
            this.showToast('Failed to load reminders', 'error');
        }
    }

    updateRemindersUI() {
        const container = document.getElementById('remindersList');
        
        if (!this.currentUser) {
            container.innerHTML = `
                <div class="reminder-item">
                    <div class="reminder-header">
                        <div class="reminder-title">Sign In to Manage Reminders</div>
                    </div>
                    <p>Sign in to add, edit, and track your medicine reminders</p>
                    <button class="btn btn-primary" onclick="app.openLoginModal()" style="margin-top: 20px;">
                        <i class="fas fa-sign-in-alt"></i> Sign In
                    </button>
                </div>
            `;
            return;
        }
        
        if (!this.reminders.length) {
            container.innerHTML = `
                <div class="reminder-item">
                    <div class="reminder-header">
                        <div class="reminder-title">No Reminders Yet</div>
                    </div>
                    <p>Add your first medicine reminder to get started</p>
                    <button class="btn btn-primary" onclick="app.openAddReminderModal()" style="margin-top: 20px;">
                        <i class="fas fa-plus"></i> Add Your First Reminder
                    </button>
                </div>
            `;
            return;
        }
        
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        container.innerHTML = this.reminders.map(reminder => {
            const isToday = reminder.days && reminder.days.includes(now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase());
            const isUrgent = reminder.time && new Date(`${today}T${reminder.time}`) < new Date(now.getTime() + 30 * 60000);
            
            return `
                <div class="reminder-item ${isUrgent ? 'urgent' : ''}">
                    <div class="reminder-header">
                        <div class="reminder-title">${reminder.medicineName}</div>
                        <div class="reminder-status ${reminder.status === 'taken' ? 'status-taken' : 'status-pending'}">
                            ${reminder.status === 'taken' ? 'Taken' : 'Pending'}
                        </div>
                    </div>
                    <div class="reminder-time">
                        <i class="fas fa-clock"></i>
                        ${reminder.time} | ${reminder.dosageAmount} ${reminder.dosageUnit}
                    </div>
                    <div class="reminder-dosage">
                        ${reminder.notes || 'No additional notes'}
                    </div>
                    <div class="reminder-actions">
                        <button class="btn btn-success" onclick="app.markReminderAsTaken('${reminder.id}')">
                            <i class="fas fa-check"></i> Mark Taken
                        </button>
                        <button class="btn btn-outline" onclick="app.deleteReminder('${reminder.id}')" style="color: var(--danger);">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Update active reminders count
        const activeReminders = this.reminders.filter(r => r.status === 'pending').length;
        document.getElementById('activeReminders').textContent = activeReminders;
    }

    async loadHealthRecords() {
        if (!this.currentUser) {
            this.updateHealthRecordsUI();
            return;
        }
        
        try {
            // Here you would fetch from Supabase or Firebase
            // For now, we'll use mock data
            this.healthRecords = [
                {
                    id: '1',
                    title: 'Annual Checkup',
                    date: '2024-01-15',
                    doctor: 'Dr. Sharma',
                    details: 'Complete blood work, blood pressure normal, cholesterol levels good.'
                },
                {
                    id: '2',
                    title: 'Dental Cleaning',
                    date: '2024-02-20',
                    doctor: 'Dr. Gupta',
                    details: 'Routine dental cleaning, no cavities found.'
                }
            ];
            
            this.updateHealthRecordsUI();
            
        } catch (error) {
            console.error('Error loading health records:', error);
        }
    }

    updateHealthRecordsUI() {
        const container = document.getElementById('recordsList');
        
        if (!this.currentUser) {
            container.innerHTML = `
                <div class="record-card">
                    <div class="record-header">
                        <div class="record-title">Sign In to View Records</div>
                    </div>
                    <p>Sign in to access your health records</p>
                    <button class="btn btn-primary" onclick="app.openLoginModal()" style="margin-top: 20px;">
                        <i class="fas fa-sign-in-alt"></i> Sign In
                    </button>
                </div>
            `;
            return;
        }
        
        if (!this.healthRecords.length) {
            container.innerHTML = `
                <div class="record-card">
                    <div class="record-header">
                        <div class="record-title">No Health Records</div>
                    </div>
                    <p>No health records found. Records will appear here once added.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.healthRecords.map(record => `
            <div class="record-card">
                <div class="record-header">
                    <div class="record-title">${record.title}</div>
                    <div class="record-date">${record.date}</div>
                </div>
                <div class="record-details">
                    <p><strong>Doctor:</strong> ${record.doctor}</p>
                    <p>${record.details}</p>
                </div>
            </div>
        `).join('');
    }

    updateDashboardStats() {
        // Calculate today's reminders
        const today = new Date().toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
        const todayReminders = this.reminders.filter(r => 
            r.status === 'pending' && 
            r.days && 
            r.days.includes(today)
        );
        
        document.getElementById('upcomingAppointments').textContent = todayReminders.length;
    }

    // Reminder Management
    async addReminder(reminderData) {
        if (!this.currentUser) {
            this.openLoginModal();
            return;
        }
        
        try {
            await firebase.firestore()
                .collection('users')
                .doc(this.currentUser.uid)
                .collection('reminders')
                .add({
                    ...reminderData,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'pending'
                });
            
            this.showToast('Reminder added successfully!', 'success');
            this.closeModal('addReminderModal');
            await this.loadReminders();
            
        } catch (error) {
            console.error('Error saving reminder:', error);
            this.showToast('Failed to save reminder', 'error');
        }
    }

    async markReminderAsTaken(reminderId) {
        if (!this.currentUser) return;
        
        try {
            await firebase.firestore()
                .collection('users')
                .doc(this.currentUser.uid)
                .collection('reminders')
                .doc(reminderId)
                .update({
                    status: 'taken',
                    takenAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            
            this.showToast('Medicine marked as taken', 'success');
            await this.loadReminders();
            
        } catch (error) {
            console.error('Error updating reminder:', error);
            this.showToast('Failed to update reminder', 'error');
        }
    }

    async deleteReminder(reminderId) {
        if (!confirm('Are you sure you want to delete this reminder?')) return;
        
        try {
            await firebase.firestore()
                .collection('users')
                .doc(this.currentUser.uid)
                .collection('reminders')
                .doc(reminderId)
                .delete();
            
            this.showToast('Reminder deleted', 'success');
            await this.loadReminders();
            
        } catch (error) {
            console.error('Error deleting reminder:', error);
            this.showToast('Failed to delete reminder', 'error');
        }
    }

    // Notification System
    initNotificationSystem() {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return;
        }
        
        if (Notification.permission === 'granted') {
            this.scheduleReminderCheck();
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.scheduleReminderCheck();
                }
            });
        }
    }

    scheduleReminderCheck() {
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
        }
        
        // Check every minute for reminders
        this.notificationInterval = setInterval(() => {
            this.checkReminders();
        }, 60000);
        
        // Initial check
        this.checkReminders();
    }

    checkReminders() {
        if (!this.currentUser || !this.reminders.length) return;
        
        const now = new Date();
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase();
        
        this.reminders.forEach(reminder => {
            if (reminder.status !== 'pending') return;
            if (!reminder.days || !reminder.days.includes(currentDay)) return;
            
            const [reminderHour, reminderMinute] = reminder.time.split(':').map(Number);
            const nowHour = now.getHours();
            const nowMinute = now.getMinutes();
            
            // Check if it's time for the reminder (within 1 minute)
            if (Math.abs((nowHour * 60 + nowMinute) - (reminderHour * 60 + reminderMinute)) <= 1) {
                this.showReminderNotification(reminder);
            }
        });
    }

    showReminderNotification(reminder) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        
        const notification = new Notification('Parcimic Medicine Reminder', {
            body: `Time to take ${reminder.medicineName}: ${reminder.dosageAmount} ${reminder.dosageUnit}`,
            icon: 'icons/icon-72x72.png',
            tag: `reminder-${reminder.id}`
        });
        
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
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
        } catch (error) {
            console.error('Google sign-in error:', error);
            this.showToast('Sign in failed: ' + error.message, 'error');
        } finally {
            spinner.style.display = 'none';
            button.disabled = false;
        }
    }

    async signInWithPhone() {
        // Implement phone authentication
        this.showToast('Phone authentication coming soon!', 'info');
    }

    async signOut() {
        try {
            await firebase.auth().signOut();
            this.showToast('Successfully signed out', 'success');
            this.toggleUserDropdown();
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
        if (!this.currentUser) {
            this.openLoginModal();
            return;
        }
        
        const modal = document.getElementById('addReminderModal');
        const form = document.getElementById('reminderForm');
        
        // Set default values
        form.innerHTML = `
            <div class="form-group">
                <label class="form-label">Medicine Name</label>
                <input type="text" class="form-control" id="medicineName" required placeholder="e.g., Paracetamol 500mg">
            </div>
            
            <div class="form-group">
                <label class="form-label">Dosage</label>
                <div class="form-row">
                    <input type="number" class="form-control" id="dosageAmount" required placeholder="Amount" min="1">
                    <select class="form-control" id="dosageUnit" required>
                        <option value="tablet">Tablet(s)</option>
                        <option value="ml">ml</option>
                        <option value="mg">mg</option>
                        <option value="tsp">Teaspoon(s)</option>
                    </select>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Time</label>
                <input type="time" class="form-control" id="reminderTime" required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Frequency</label>
                <div class="checkbox-group">
                    <label class="checkbox-label">
                        <input type="checkbox" name="days" value="mon"> Mon
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" name="days" value="tue"> Tue
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" name="days" value="wed"> Wed
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" name="days" value="thu"> Thu
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" name="days" value="fri"> Fri
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" name="days" value="sat"> Sat
                    </label>
                    <label class="checkbox-label">
                        <input type="checkbox" name="days" value="sun"> Sun
                    </label>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Notes (Optional)</label>
                <textarea class="form-control" id="reminderNotes" rows="3" placeholder="Any special instructions..."></textarea>
            </div>
            
            <button type="submit" class="btn btn-primary" style="width: 100%;">
                <i class="fas fa-bell"></i> Set Reminder
            </button>
        `;
        
        // Set current time as default
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        document.getElementById('reminderTime').value = `${hours}:${minutes}`;
        
        // Handle form submission
        form.onsubmit = (e) => {
            e.preventDefault();
            
            const selectedDays = Array.from(document.querySelectorAll('input[name="days"]:checked'))
                .map(checkbox => checkbox.value);
            
            const reminderData = {
                medicineName: document.getElementById('medicineName').value,
                dosageAmount: document.getElementById('dosageAmount').value,
                dosageUnit: document.getElementById('dosageUnit').value,
                time: document.getElementById('reminderTime').value,
                days: selectedDays,
                notes: document.getElementById('reminderNotes').value,
                status: 'pending'
            };
            
            this.addReminder(reminderData);
        };
        
        modal.classList.add('active');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    // User Dropdown
    toggleUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        dropdown.classList.toggle('active');
    }

    viewProfile() {
        this.showToast('Profile view feature coming soon!', 'info');
        this.toggleUserDropdown();
    }

    viewSettings() {
        this.showToast('Settings feature coming soon!', 'info');
        this.toggleUserDropdown();
    }

    showHealthRecords() {
        window.scrollTo({
            top: document.getElementById('health-records').offsetTop - 100,
            behavior: 'smooth'
        });
    }

    // Emergency Functions
    openEmergencyModal() {
        if (confirm('🚨 **EMERGENCY CALL - INDIA**\n\nCall National Emergency (112) only for genuine emergencies:\n• Chest pain/difficulty breathing\n• Severe bleeding\n• Loss of consciousness\n• Stroke symptoms (FAST)\n• Severe allergic reactions\n\nPress OK to call or Cancel.')) {
            window.location.href = 'tel:112';
        }
    }

    callEmergency(number = '112') {
        if (confirm(`Call ${number} - Emergency Services?\n\nPress OK to call or Cancel.`)) {
            window.location.href = `tel:${number}`;
        }
    }

    // AI Assistant Functions
    openPulseAI() {
        window.open('https://cdn.botpress.cloud/webchat/v3.5/shareable.html?configUrl=https://files.bpcontent.cloud/2025/12/20/16/20251220165150-G2HH6L15.json', '_blank');
    }

    openChatbotLink() {
        window.open('https://cdn.botpress.cloud/webchat/v3.5/shareable.html?configUrl=https://files.bpcontent.cloud/2025/12/20/16/20251220165150-G2HH6L15.json', '_blank');
    }

    // Sync Function
    async syncReminders() {
        if (!this.currentUser) {
            this.openLoginModal();
            return;
        }
        
        await this.loadReminders();
        this.showToast('Reminders synced!', 'success');
    }

    // PWA Functions
    initPWA() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            
            // Show install button
            const installBtn = document.getElementById('installBtn');
            installBtn.style.display = 'flex';
            
            installBtn.addEventListener('click', async () => {
                if (!this.deferredPrompt) return;
                
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    this.showToast('App installed successfully!', 'success');
                }
                
                this.deferredPrompt = null;
                installBtn.style.display = 'none';
            });
        });
        
        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            document.getElementById('installBtn').style.display = 'none';
        });
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

    showWelcomeNotification() {
        setTimeout(() => {
            this.showToast('Welcome to Parcimic Medical Platform! 🏥', 'info');
        }, 1000);
    }

    // Event Listeners
    initEventListeners() {
        // Close modals on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
        
        // Close modals on overlay click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // Install button
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.addEventListener('click', () => this.installPWA());
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
        
        // Also close user dropdown
        document.getElementById('userDropdown').classList.remove('active');
    }

    async installPWA() {
        if (!this.deferredPrompt) {
            this.showToast('App installation not available', 'info');
            return;
        }
        
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            this.showToast('App installed successfully!', 'success');
        }
        
        this.deferredPrompt = null;
        document.getElementById('installBtn').style.display = 'none';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ParcimicApp();
});

// Global functions for HTML onclick handlers
function openPulseAI() {
    if (window.app) window.app.openPulseAI();
}

function openChatbotLink() {
    if (window.app) window.app.openChatbotLink();
}

function openEmergencyModal() {
    if (window.app) window.app.openEmergencyModal();
}

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

function closeModal(modalId) {
    if (window.app) window.app.closeModal(modalId);
}

function syncReminders() {
    if (window.app) window.app.syncReminders();
}

function markReminderAsTaken(reminderId) {
    if (window.app) window.app.markReminderAsTaken(reminderId);
}

function deleteReminder(reminderId) {
    if (window.app) window.app.deleteReminder(reminderId);
}