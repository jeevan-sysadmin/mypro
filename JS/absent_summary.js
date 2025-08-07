let absentStudents = [];
let timetableId = 0;
let subject = '';

document.addEventListener('DOMContentLoaded', function() {
    // Get data from localStorage
    const savedData = localStorage.getItem('absentSummaryData');
    if (savedData) {
        const data = JSON.parse(savedData);
        timetableId = data.timetableId;
        subject = data.subject;
        absentStudents = data.absentStudents || [];
        
        // Update UI
        document.getElementById('summary-subject').textContent = subject;
        document.getElementById('summary-date').textContent = new Date().toLocaleDateString();
        document.getElementById('total-absent').textContent = absentStudents.length;
        
        document.getElementById('summary-info').classList.remove('d-none');
        document.getElementById('home-btn').classList.remove('d-none');
        renderAbsentList();
    } else {
        // No data found, try to get from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        timetableId = urlParams.get('timetable_id');
        subject = urlParams.get('subject') || '';
        
        if (timetableId) {
            fetchAbsentStudents();
        } else {
            showError("No attendance data found.");
            document.getElementById('home-btn').classList.remove('d-none');
        }
    }
});

function fetchAbsentStudents() {
    document.getElementById('loading-spinner').classList.remove('d-none');
    
    fetch(`http://localhost/sxc/get_absentees.php?timetable_id=${timetableId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('loading-spinner').classList.add('d-none');
            document.getElementById('home-btn').classList.remove('d-none');

            if (data.success === true) {
                absentStudents = data.students || [];
                
                // Update UI
                document.getElementById('summary-subject').textContent = subject;
                document.getElementById('summary-date').textContent = new Date().toLocaleDateString();
                document.getElementById('total-absent').textContent = absentStudents.length;
                
                document.getElementById('summary-info').classList.remove('d-none');
                renderAbsentList();
            } else {
                throw new Error(data.message || 'Failed to fetch data');
            }
        })
        .catch(error => {
            document.getElementById('loading-spinner').classList.add('d-none');
            showError(`Error: ${error.message}`);
            document.getElementById('home-btn').classList.remove('d-none');
        });
}

function renderAbsentList() {
    const absentListElement = document.getElementById('absent-list');
    const noDataElement = document.getElementById('no-data');

    absentListElement.innerHTML = '';
    absentListElement.classList.add('d-none');
    noDataElement.classList.add('d-none');

    if (absentStudents.length === 0) {
        noDataElement.classList.remove('d-none');
        return;
    }

    absentStudents.forEach(student => {
        const studentCard = document.createElement('div');
        studentCard.className = 'card student-card';
        studentCard.innerHTML = `
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <i class="bi bi-person-x absent-icon me-3"></i>
                    <div>
                        <h5 class="card-title mb-1">${student.roll_number || student.rollno || 'N/A'}</h5>
                        <p class="card-text text-muted mb-0">${student.name || ''}</p>
                    </div>
                </div>
            </div>
        `;
        absentListElement.appendChild(studentCard);
    });

    absentListElement.classList.remove('d-none');
}

function goToHomePage() {
    window.location.href = 'home_screen.html';
}

function goBack() {
    window.history.back();
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.classList.remove('d-none');
}