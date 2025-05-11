document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('reserveForm');
    const modal = document.getElementById('confirmationModal');
    const buttonGroups = document.querySelectorAll('.button-group');

    // Handle button group selections
    buttonGroups.forEach(group => {
        group.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                // Remove selected class from all buttons in this group
                group.querySelectorAll('button').forEach(btn => {
                    btn.classList.remove('selected');
                });
                // Add selected class to clicked button
                button.classList.add('selected');
            });
        });
    });

    // Handle form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Get all form values
        const formData = {
            date: document.getElementById('date').value,
            time: document.querySelector('.button-group:nth-child(1) button.selected')?.textContent,
            duration: document.querySelector('.button-group:nth-child(2) button.selected')?.textContent,
            number_of_people: parseInt(document.querySelector('.button-group:nth-child(3) button.selected')?.textContent),
            name: form.querySelector('input[type="text"]').value,
            email: form.querySelector('input[type="email"]').value,
            phone: form.querySelector('input[type="tel"]').value
        };

        // Validate all fields are filled
        if (!formData.date || !formData.time || !formData.duration || !formData.number_of_people) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                showModal(true);
                // Reset form
                form.reset();
                buttonGroups.forEach(group => {
                    group.querySelectorAll('button').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                });
            } else {
                const errorData = await response.json();
                showModal(false);
                console.error('Reservation failed:', errorData.message);
            }
        } catch (error) {
            console.error('Error:', error);
            showModal(false);
        }
    });
});

function showModal(success) {
    const modal = document.getElementById('confirmationModal');
    const modalTitle = modal.querySelector('h2');
    const modalText = modal.querySelector('p');

    if (success) {
        modalTitle.textContent = 'Reservation Confirmed!';
        modalText.textContent = 'Thank you for reserving with KanglungDine. We\'ll contact you shortly.';
    } else {
        modalTitle.textContent = 'Reservation Failed';
        modalText.textContent = 'Sorry, we couldn\'t process your reservation. Please try again later.';
    }

    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('confirmationModal');
    modal.style.display = 'none';
}