let attendanceData = {};
let timetableId = 0;
let subject = '';
let successModal;
let errorModal;

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");
    
    // Initialize modals
    successModal = new bootstrap.Modal(document.getElementById('successModal'));
    errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
    
    // Get data from localStorage
    const savedData = localStorage.getItem('attendanceData');
    console.log("Retrieved data from localStorage:", savedData);
    
    if (savedData) {
        try {
            attendanceData = JSON.parse(savedData);
            console.log("Parsed attendance data:", attendanceData);
            
            timetableId = attendanceData.timetableId;
            subject = attendanceData.subject;
            
            console.log("Timetable ID:", timetableId);
            console.log("Subject:", subject);
            console.log("Attendance date:", attendanceData.date);
            console.log("Number of students:", attendanceData.students.length);
            console.log("Students data:", attendanceData.students);
            
            // Update UI
            document.getElementById('subject-title').textContent = subject;
            document.getElementById('attendance-date').textContent = formatDate(attendanceData.date);
            document.getElementById('total-students').textContent = attendanceData.students.length;
            
            renderStudentTable();
            updateCounts();
        } catch (e) {
            console.error('Error parsing attendance data:', e);
            showError('Invalid attendance data. Please try again.', e.message);
            setTimeout(() => {
                window.location.href = 'home_screen.html';
            }, 3000);
        }
    } else {
        console.error('No attendance data found in localStorage');
        showError('No attendance data found. Please start again.');
        setTimeout(() => {
            window.location.href = 'home_screen.html';
        }, 3000);
    }
});

function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = new Date(dateString).toLocaleDateString(undefined, options);
    console.log("Formatting date:", dateString, "->", formattedDate);
    return formattedDate;
}

function renderStudentTable() {
    console.log("Rendering student table...");
    const tableBody = document.getElementById('student-table');
    tableBody.innerHTML = '';
    
    attendanceData.students.forEach(student => {
        console.log("Adding student row:", student);
        const row = document.createElement('tr');
        const statusClass = student.status === 'P' ? 'status-present' : 'status-absent';
        const statusIcon = student.status === 'P' ? '✅' : '❌';
        const statusText = student.status === 'P' ? 'Present' : 'Absent';
        
        row.innerHTML = `
            <td>${student.roll_number || 'N/A'}</td>
            <td>${student.name || ''}</td>
            <td class="${statusClass}">${statusIcon} ${statusText}</td>
        `;
        tableBody.appendChild(row);
    });
    console.log("Student table rendered with", attendanceData.students.length, "students");
}

function updateCounts() {
    const presentCount = attendanceData.students.filter(s => s.status === 'P').length;
    const absentCount = attendanceData.students.length - presentCount;
    
    console.log("Updating counts - Present:", presentCount, "Absent:", absentCount);
    
    document.getElementById('present-count').textContent = presentCount;
    document.getElementById('absent-count').textContent = absentCount;
}

async function submitAttendance() {
    console.log("Submit attendance button clicked");
    
    const submitBtn = document.getElementById('submit-btn');
    const spinner = submitBtn.querySelector('.loading-spinner');
    const icon = submitBtn.querySelector('.bi');
    
    // Show loading spinner and disable button
    spinner.style.display = 'inline-block';
    icon.style.display = 'none';
    submitBtn.disabled = true;
    
    try {
        console.log("Validating attendance data...");
        // Validate data before submission
        if (!attendanceData.students || attendanceData.students.length === 0) {
            throw new Error('No student data to submit');
        }

        // Prepare data for submission
        const submissionData = {
            hour_id: timetableId,
            attendance: attendanceData.students.map(student => ({
                rollno: student.roll_number ? student.roll_number.toString() : '',
                status: student.status === 'P' ? 'P' : 'A',
                name: student.name || ''
            }))
        };

        console.log("Prepared submission data:", submissionData);
        
        console.log("Calling API endpoint...");
        // Call the API endpoint
        const response = await fetch('http://localhost/sxc/submit_attendance.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(submissionData)
        });
        
        const result = await response.json();
        console.log('Server response:', result);
        
        if (!response.ok || !result.success) {
            const errorMsg = result.message || 'Failed to submit attendance';
            const details = result.processed ? `Processed ${result.processed} of ${attendanceData.students.length} records` : '';
            console.error("Submission failed:", errorMsg, details);
            throw new Error(`${errorMsg}. ${details}`);
        }
        
        console.log("Submission successful, clearing localStorage...");
        // Clear the attendance data from storage
        localStorage.removeItem('attendanceData');
        
        // Show success details
        const successDetails = `Processed ${result.processed} of ${attendanceData.students.length} records`;
        document.getElementById('success-details').textContent = successDetails;
        console.log("Success details:", successDetails);
        
        // Show success modal
        successModal.show();
    } catch (error) {
        console.error('Error submitting attendance:', error);
        showError(
            'An error occurred while submitting attendance.', 
            error.message
        );
    } finally {
        console.log("Finishing submission process...");
        // Hide loading spinner and re-enable button
        spinner.style.display = 'none';
        icon.style.display = 'inline-block';
        submitBtn.disabled = false;
    }
}

function showError(message, details = '') {
    console.error("Showing error modal:", message, details);
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-details').textContent = details;
    errorModal.show();
}

function redirectAfterSuccess() {
    console.log("Redirecting to home screen after successful submission");
    window.location.href = 'home_screen.html';
}

function goBack() {
    console.log("Going back to previous page");
    window.history.back();
}