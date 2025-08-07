let subjects = [];
let staffId = '';
const messageModal = new bootstrap.Modal(document.getElementById('messageModal'));

document.addEventListener('DOMContentLoaded', function() {
    // Set current date
    document.getElementById('current-date').textContent = moment().format('dddd, D MMMM YYYY');
    
    // In a real app, you would get staffId from session/localStorage
    staffId = localStorage.getItem('staffid') || '';
    
    if (staffId) {
        fetchSubjects();
    } else {
        showError("Staff ID not found. Please login again.");
        // Redirect to login page after 3 seconds
        setTimeout(() => { window.location.href = 'login.html'; }, 3000);
    }
});

function fetchSubjects() {
    fetch(`http://localhost/sxc/get_subjects_by_staff.php?staffid=${staffId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('loading-spinner').classList.add('d-none');
            
            if (data.status === 'success' && Array.isArray(data.data)) {
                subjects = data.data;
                renderSubjects();
            } else {
                showMessage("Access Denied", data.message || "Unexpected error.", "danger");
            }
        })
        .catch(error => {
            document.getElementById('loading-spinner').classList.add('d-none');
            showError(`Connection Error: ${error.message}`);
        });
}

function renderSubjects() {
    const subjectsListElement = document.getElementById('subjects-list');
    const contentArea = document.getElementById('content-area');
    
    subjectsListElement.innerHTML = '';
    
    if (subjects.length === 0) {
        subjectsListElement.innerHTML = `
            <div class="no-subjects">
                <i class="bi bi-journal-x" style="font-size: 2.5rem;"></i>
                <p class="mt-3">No subjects found for today.</p>
            </div>
        `;
    } else {
        subjects.forEach(subject => {
            const subjectCard = document.createElement('div');
            subjectCard.className = 'card subject-card';
            subjectCard.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title subject-title">Subject: ${subject.subject || 'Unknown Subject'}</h5>
                    <p class="card-text">Paper Code: ${subject.papercode || 'N/A'}</p>
                    <p class="card-text">Hour: ${subject.hour || 'N/A'}</p>
                    ${subject.start_time ? `<p class="card-text">Start Time: ${subject.start_time}</p>` : ''}
                    <button class="btn select-btn mt-2" onclick="handleSubjectSelection(${JSON.stringify(subject).replace(/"/g, '&quot;')})">
                        <i class="bi bi-check-circle me-2"></i>Select Substitute
                    </button>
                </div>
            `;
            subjectsListElement.appendChild(subjectCard);
        });
    }
    
    contentArea.classList.remove('d-none');
}

async function handleSubjectSelection(subjectData) {
    const timetableId = subjectData.timetable_id || 0;
    const paperName = subjectData.subject || 'Subject';
    const startStr = subjectData.start_time || '';
    
    if (!startStr) {
        showMessage("Missing Time", "Start time is not available for this class.", "danger");
        return;
    }
    
    try {
        // Check if attendance already submitted
        const date = moment().format('YYYY-MM-DD');
        const response = await fetch(`http://localhost/sxc/check_attendance.php?timetable_id=${timetableId}&date=${date}`);
        
        if (response.ok) {
            const data = await response.json();
            if (data.submitted) {
                showMessage("Already Submitted", "Attendance already submitted for this subject.", "success");
                return;
            }
        }
        
        // Check time window
        const now = moment();
        const openTime = moment(startStr, "HH:mm:ss");
        const closeTime = moment(openTime).add(15, 'minutes');
        
        if (now.isBefore(openTime)) {
            showMessage("Too Early", `Attendance opens at ${openTime.format('hh:mm A')}`, "warning");
        } else if (now.isAfter(closeTime)) {
            showMessage("Too Late", `Attendance window closed at ${closeTime.format('hh:mm A')}.`, "secondary");
        } else {
            // Redirect to student list page with parameters
            window.location.href = `student_list.html?timetable_id=${timetableId}&subject=${encodeURIComponent(paperName)}`;
        }
    } catch (error) {
        showMessage("Error", `Failed to check attendance: ${error.message}`, "danger");
    }
}

function showMessage(title, message, type) {
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    
    // Set modal header color based on type
    const modalHeader = document.querySelector('#messageModal .modal-header');
    modalHeader.className = `modal-header bg-${type} text-white`;
    
    messageModal.show();
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.classList.remove('d-none');
}