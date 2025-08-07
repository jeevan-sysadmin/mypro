let students = [];
let timetableId = 0;
let subject = '';

// Get parameters from URL
const urlParams = new URLSearchParams(window.location.search);
timetableId = urlParams.get('timetable_id');
subject = urlParams.get('subject') || '';

document.addEventListener('DOMContentLoaded', function() {
    if (subject) {
        document.getElementById('subject-title').textContent = `Attendance - ${subject}`;
    }

    if (timetableId) {
        fetchStudentsByTimetableId(timetableId);
    } else {
        showError("Missing timetable ID in URL parameters.");
        document.getElementById('loading-spinner').classList.add('d-none');
    }
});

function fetchStudentsByTimetableId(id) {
    fetch(`http://localhost/sxc/get_students_by_timetable.php?timetable_id=${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('loading-spinner').classList.add('d-none');

            if (data.status === 'success') {
                students = data.data.map(student => ({
                    ...student,
                    status: 'P' // Default to present
                }));
                renderStudentList();
            } else if (data.status === 'closed') {
                showInfo(data.message || 'Attendance window closed.');
                setTimeout(() => { window.history.back(); }, 3000);
            } else if (data.status === 'upcoming') {
                showInfo(data.message || 'Attendance is not open yet.');
                setTimeout(() => { window.history.back(); }, 3000);
            } else {
                showError(data.message || 'Failed to load students.');
            }
        })
        .catch(error => {
            document.getElementById('loading-spinner').classList.add('d-none');
            showError(`Error loading students: ${error.message}`);
        });
}

function renderStudentList() {
    const studentListElement = document.getElementById('student-list');
    studentListElement.innerHTML = '';

    if (students.length === 0) {
        studentListElement.innerHTML = '<div class="alert alert-info">No students found.</div>';
        studentListElement.classList.remove('d-none');
        return;
    }

    students.forEach((student, index) => {
        const studentCard = document.createElement('div');
        studentCard.className = 'card student-card';
        studentCard.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="card-title mb-1">${student.roll_number || 'No Roll Number'}</h5>
                        <p class="card-text text-muted mb-0">${student.name || ''}</p>
                    </div>
                    <div>
                        <button class="btn ${student.status === 'P' ? 'btn-present' : 'btn-inactive'}" 
                            onclick="setStatus(${index}, 'P')">P</button>
                        <button class="btn ${student.status === 'A' ? 'btn-absent' : 'btn-inactive'} ms-2" 
                            onclick="setStatus(${index}, 'A')">A</button>
                    </div>
                </div>
            </div>
        `;
        studentListElement.appendChild(studentCard);
    });

    studentListElement.classList.remove('d-none');
    document.getElementById('submit-btn').classList.remove('d-none');
}

function setStatus(index, status) {
    students[index].status = status;
    renderStudentList();
}

function goToConfirmation() {
    if (students.length === 0) {
        showError("No students available.");
        return;
    }

    // Save attendance data to localStorage temporarily
    localStorage.setItem('attendanceData', JSON.stringify({
        timetableId,
        subject,
        students,
        date: new Date().toISOString()
    }));

    // Redirect to confirmation page
    window.location.href = `confirm_attendance.html?timetable_id=${timetableId}&subject=${encodeURIComponent(subject)}`;
}

function goBack() {
    window.history.back();
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.classList.remove('d-none');
}

function showInfo(message) {
    const infoElement = document.getElementById('info-message');
    infoElement.textContent = message;
    infoElement.classList.remove('d-none');
}