// DOM Elements
const menuBtn = document.getElementById('menuBtn');
const drawer = document.getElementById('drawer');
const overlay = document.getElementById('overlay');
const mainContent = document.getElementById('mainContent');
const loadingSpinner = document.getElementById('loadingSpinner');
const popupOverlay = document.getElementById('popupOverlay');
const popupTitle = document.getElementById('popupTitle');
const popupMessage = document.getElementById('popupMessage');
const popupOkBtn = document.getElementById('popupOkBtn');
const logoutBtn = document.getElementById('logoutBtn');
const homeBtn = document.getElementById('homeBtn');
const substituteBtn = document.getElementById('substituteBtn');
const timetableContainer = document.getElementById('timetableContainer');
const staffName = document.getElementById('staffName');
const currentDate = document.getElementById('currentDate');
const dayOrder = document.getElementById('dayOrder');
const userName = document.getElementById('userName');
const userRole = document.getElementById('userRole');
const userAvatar = document.getElementById('userAvatar');
const pageTitle = document.getElementById('pageTitle');
        
// Substitute screen elements
const substituteContent = document.getElementById('substituteContent');
const backBtn = document.getElementById('backBtn');
const substituteDate = document.getElementById('substituteDate');
const substituteLoading = document.getElementById('substituteLoading');
const subjectsList = document.getElementById('subjectsList');
const substituteError = document.getElementById('substituteError');

// State
let staffId = '';
let timetableData = [];
let attendanceStatusMap = {};
let userProfile = {};
let substituteSubjects = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
});

function setupEventListeners() {
    // Drawer toggle
    menuBtn.addEventListener('click', toggleDrawer);
    overlay.addEventListener('click', toggleDrawer);

    // Popup
    popupOkBtn.addEventListener('click', () => {
        popupOverlay.classList.remove('show');
    });

    // Logout
    logoutBtn.addEventListener('click', logout);

    // Home
    homeBtn.addEventListener('click', goToHome);

    // Substitute
    substituteBtn.addEventListener('click', showSubstituteScreen);
    
    // Back button from substitute screen
    backBtn.addEventListener('click', showMainScreen);
}

function toggleDrawer() {
    drawer.classList.toggle('open');
    overlay.classList.toggle('show');
}

function goToHome() {
    toggleDrawer();
    showMainScreen();
    // Refresh the home page data
    fetchTimetable();
}

function loadData() {
    staffId = localStorage.getItem('staffid') || '';
    if (!staffId) {
        window.location.href = 'login.html';
        return;
    }

    fetchTimetable();
    fetchUserProfile();
}

async function fetchTimetable() {
    showLoading(true);
    try {
        const response = await fetch(`http://localhost/sxc/get_timetable.php?staffid=${staffId}`);
        const data = await response.json();

        if (data.status === 'holiday') {
            renderHolidayView(data.message || 'Today is a Holiday');
            return;
        }

        if (data.status === 'success') {
            timetableData = data.data || [];
            userProfile = data.user || {};
            const dayOrderText = data.day_order || '';

            // Update UI
            updateUserProfile();
            currentDate.textContent = formatDate(new Date());
            if (dayOrderText) {
                dayOrder.textContent = `Day Order: ${dayOrderText}`;
            }

            // Check attendance status for each class
            await checkAttendanceStatuses();

            // Render timetable
            renderTimetable();
        } else {
            showPopup('Error', data.message || 'Error loading timetable', 'var(--error-color)');
        }
    } catch (error) {
        showPopup('Connection Error', `Failed to connect: ${error.message}`, 'var(--error-color)');
    } finally {
        showLoading(false);
    }
}

async function fetchUserProfile() {
    try {
        // In a real app, you might fetch this separately
        // For now, we're getting it with the timetable
    } catch (error) {
        console.error('Error fetching user profile:', error);
    }
}

function updateUserProfile() {
    userName.textContent = userProfile.name || staffId;
    userRole.textContent = userProfile.role || 'Staff';
    staffName.textContent = userProfile.name || 'Staff Name';
    
    if (userProfile && userProfile.photo_name) {
        userAvatar.src = `http://localhost/sxc/uploads/${userProfile.photo_name}`;
    } else {
        // Optional fallback image
        userAvatar.src = 'http://localhost/sxc/uploads/default-avatar.png';
    }
}

async function checkAttendanceStatuses() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const promises = timetableData.map(async (item) => {
        const timetableId = parseInt(item.id) || 0;
        if (timetableId > 0) {
            try {
                const response = await fetch(`http://localhost/sxc/check_attendance.php?timetable_id=${timetableId}&date=${today}`);
                const data = await response.json();
                attendanceStatusMap[timetableId] = data.submitted === true;
            } catch (error) {
                attendanceStatusMap[timetableId] = false;
            }
        }
    });
    
    await Promise.all(promises);
}

function renderTimetable() {
    const now = new Date();
    timetableContainer.innerHTML = '';

    // Filter classes that are currently open for attendance
    const openClasses = timetableData.filter(item => {
        const startTimeStr = item.start_time || '00:00:00';
        const [hours, minutes] = startTimeStr.split(':').map(Number);
        const classTime = new Date();
        classTime.setHours(hours, minutes, 0, 0);
        
        const openTime = new Date(classTime);
        const closeTime = new Date(classTime);
        closeTime.setMinutes(closeTime.getMinutes() + 15);
        
        return now >= openTime && now <= closeTime;
    });

    if (openClasses.length === 0) {
        const noClassesMsg = document.createElement('div');
        noClassesMsg.className = 'no-classes';
        noClassesMsg.textContent = 'No classes currently open for attendance.';
        timetableContainer.appendChild(noClassesMsg);
        return;
    }

    openClasses.forEach(item => {
        const timetableId = parseInt(item.id) || 0;
        const isSubmitted = attendanceStatusMap[timetableId] || false;
        const startTimeStr = item.start_time || '00:00:00';
        const [hours, minutes] = startTimeStr.split(':').map(Number);
        
        const classTime = new Date();
        classTime.setHours(hours, minutes, 0, 0);
        
        const openTime = new Date(classTime);
        const closeTime = new Date(classTime);
        closeTime.setMinutes(closeTime.getMinutes() + 15);
        
        const withinWindow = now >= openTime && now <= closeTime;

        const card = document.createElement('div');
        card.className = 'timetable-card';
        card.innerHTML = `
            <div class="hour">Hour: ${item.hour || 'N/A'}</div>
            <div class="paper-name">Paper Name: ${item.papername || 'N/A'}</div>
            <div class="paper-code">Paper Code: ${item.papercode || 'N/A'}</div>
            <button class="attendance-btn ${isSubmitted ? 'submitted' : withinWindow ? 'open' : 'closed'}" 
                    data-id="${timetableId}" ${isSubmitted ? 'disabled' : ''}>
                <span class="material-icons icon">${isSubmitted ? 'done' : 'check_circle_outline'}</span>
                ${isSubmitted ? 'Already Submitted' : 'Take Attendance'}
            </button>
        `;

        // Add click handler if not submitted
        if (!isSubmitted) {
            const btn = card.querySelector('.attendance-btn');
            btn.addEventListener('click', () => handlePaperTap(item));
        }

        timetableContainer.appendChild(card);
    });
}

function renderHolidayView(message) {
    timetableContainer.innerHTML = `
        <div class="holiday-container">
            <span class="material-icons holiday-icon">beach_access</span>
            <div class="holiday-message">${message}</div>
        </div>
    `;
}

function handlePaperTap(item) {
    const timetableId = parseInt(item.id) || 0;
    const paperName = item.papername || 'Subject';
    const isSubmitted = attendanceStatusMap[timetableId] || false;

    const now = new Date();
    const startTimeStr = item.start_time || '00:00:00';
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    
    const classTime = new Date();
    classTime.setHours(hours, minutes, 0, 0);
    
    const openTime = new Date(classTime);
    const closeTime = new Date(classTime);
    closeTime.setMinutes(closeTime.getMinutes() + 15);

    if (isSubmitted) {
        showPopup('Already Submitted', 'Attendance already submitted for this paper.', 'var(--success-color)');
    } else if (now < openTime) {
        const openTimeStr = formatTime(openTime);
        showPopup('Not Yet Open', `Attendance opens at ${openTimeStr}`, 'var(--warning-color)');
    } else if (now > closeTime) {
        showPopup('Closed', 'Attendance window closed.', 'var(--disabled-color)');
    } else {
        // Redirect to student list page with parameters
        window.location.href = `student_list.html?timetable_id=${timetableId}&subject=${encodeURIComponent(paperName)}`;
    }
}

function logout() {
    localStorage.removeItem('staffid');
    window.location.href = 'login.html';
}

function showLoading(show) {
    loadingSpinner.style.display = show ? 'block' : 'none';
    mainContent.style.display = show ? 'none' : 'block';
}

function showPopup(title, message, color) {
    popupTitle.textContent = title;
    popupMessage.textContent = message;
    popupOverlay.style.display = 'flex';
    setTimeout(() => {
        popupOverlay.classList.add('show');
    }, 10);
}

function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Substitute Screen Functions
function showSubstituteScreen() {
    toggleDrawer();
    mainContent.style.display = 'none';
    substituteContent.style.display = 'block';
    pageTitle.textContent = 'Substitute Subjects';
    
    // Set current date
    substituteDate.textContent = moment().format('dddd, D MMMM YYYY');
    
    // Load substitute subjects
    loadSubstituteSubjects();
}

function showMainScreen() {
    substituteContent.style.display = 'none';
    mainContent.style.display = 'block';
    pageTitle.textContent = 'Current Attendance';
}

function loadSubstituteSubjects() {
    substituteLoading.style.display = 'flex';
    subjectsList.innerHTML = '';
    substituteError.classList.add('d-none');
    
    fetch(`http://localhost/sxc/get_subjects_by_staff.php?staffid=${staffId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            substituteLoading.style.display = 'none';
            
            if (data.status === 'success' && Array.isArray(data.data)) {
                substituteSubjects = data.data;
                renderSubstituteSubjects();
            } else {
                showSubstituteError(data.message || "No substitute subjects found.");
            }
        })
        .catch(error => {
            substituteLoading.style.display = 'none';
            showSubstituteError(`Connection Error: ${error.message}`);
        });
}

function renderSubstituteSubjects() {
    subjectsList.innerHTML = '';
    
    if (substituteSubjects.length === 0) {
        subjectsList.innerHTML = `
            <div class="no-subjects">
                <i class="bi bi-journal-x" style="font-size: 2.5rem;"></i>
                <p class="mt-3">No substitute subjects found for today.</p>
            </div>
        `;
        return;
    }
    
    substituteSubjects.forEach(subject => {
        const subjectCard = document.createElement('div');
        subjectCard.className = 'card subject-card';
        subjectCard.innerHTML = `
            <div class="card-body">
                <h5 class="card-title subject-title">Subject: ${subject.subject || 'Unknown Subject'}</h5>
                <p class="card-text">Paper Code: ${subject.papercode || 'N/A'}</p>
                <p class="card-text">Hour: ${subject.hour || 'N/A'}</p>
                ${subject.start_time ? `<p class="card-text">Start Time: ${subject.start_time}</p>` : ''}
                <button class="btn select-btn mt-2">
                    <i class="bi bi-check-circle me-2"></i>Select Substitute
                </button>
            </div>
        `;
        
        // Add click handler for the select button
        const selectBtn = subjectCard.querySelector('.select-btn');
        selectBtn.addEventListener('click', () => handleSubstituteSelection(subject));
        
        subjectsList.appendChild(subjectCard);
    });
}

async function handleSubstituteSelection(subjectData) {
    const timetableId = subjectData.timetable_id || 0;
    const paperName = subjectData.subject || 'Subject';
    const startStr = subjectData.start_time || '';
    
    if (!startStr) {
        showPopup("Missing Time", "Start time is not available for this class.", "danger");
        return;
    }
    
    try {
        // Check if attendance already submitted
        const date = moment().format('YYYY-MM-DD');
        const response = await fetch(`http://localhost/sxc/check_attendance.php?timetable_id=${timetableId}&date=${date}`);
        
        if (response.ok) {
            const data = await response.json();
            if (data.submitted) {
                showPopup("Already Submitted", "Attendance already submitted for this subject.", "success");
                return;
            }
        }
        
        // Check time window
        const now = moment();
        const openTime = moment(startStr, "HH:mm:ss");
        const closeTime = moment(openTime).add(15, 'minutes');
        
        if (now.isBefore(openTime)) {
            showPopup("Too Early", `Attendance opens at ${openTime.format('hh:mm A')}`, "warning");
        } else if (now.isAfter(closeTime)) {
            showPopup("Too Late", `Attendance window closed at ${closeTime.format('hh:mm A')}.`, "secondary");
        } else {
            // Redirect to student list page with parameters
            window.location.href = `student_list.html?timetable_id=${timetableId}&subject=${encodeURIComponent(paperName)}`;
        }
    } catch (error) {
        showPopup("Error", `Failed to check attendance: ${error.message}`, "danger");
    }
}

function showSubstituteError(message) {
    substituteError.textContent = message;
    substituteError.classList.remove('d-none');
}