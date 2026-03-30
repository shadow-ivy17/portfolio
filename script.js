const form = document.getElementById('contactForm');
const successMessage = document.getElementById('successMessage');
const API_BASE_URL = '';

function showMessage(text, ok) {
  successMessage.textContent = text;
  successMessage.classList.remove('hidden', 'text-green-400', 'text-red-400');
  successMessage.classList.add(ok ? 'text-green-400' : 'text-red-400');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();

  if (!name || !email || !message) {
    showMessage('All fields are required.', false);
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, email, message })
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : { message: `Request failed (${response.status}). Open app from http://localhost:3000` };

    if (!response.ok || !data.success) {
      showMessage(data.message || 'Unable to send message.', false);
      return;
    }

    form.reset();
    showMessage('Message sent successfully!', true);
  } catch (error) {
    showMessage('Cannot reach backend. Try again in a moment.', false);
  }
});
