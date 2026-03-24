// Short Portfolio script.js

document.addEventListener('DOMContentLoaded', () => {

    // Smooth Scroll
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            if (link.getAttribute('href') !== '#') {
                e.preventDefault();
                document.querySelector(link.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Contact Form
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                message: document.getElementById('message').value
            };

            try {
                const res = await fetch('http://localhost:5000/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    showSuccess();
                    form.reset();
                } else {
                    alert("Failed to send message");
                }
            } catch (err) {
                alert("Server error. Is backend running?");
            }
        });
    }

    loadProjects();
});

// Success Message
function showSuccess() {
    const msg = document.getElementById('successMessage');
    msg.classList.remove('hidden');
    setTimeout(() => msg.classList.add('hidden'), 4000);
}

// Projects Data & Render
const projects = [
    { title: "E-Commerce", desc: "Online store with cart & payment", tech: "Node.js, MongoDB" },
    { title: "TaskFlow", desc: "Real-time task management app", tech: "Next.js, Socket.io" },
    { title: "AI Portfolio", desc: "AI powered portfolio generator", tech: "Node.js, OpenAI" }
];

function loadProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    container.innerHTML = projects.map(p => `
        <div class="project-card bg-gray-900 border border-gray-700 rounded-2xl p-6 hover:border-cyan-400 transition">
            <div class="h-40 bg-gradient-to-br from-cyan-900 to-gray-800 rounded-xl flex items-center justify-center mb-4">
                <i class="fa-solid fa-laptop-code text-6xl text-cyan-400"></i>
            </div>
            <h3 class="text-lg font-semibold mb-2">${p.title}</h3>
            <p class="text-gray-400 text-sm mb-3">${p.desc}</p>
            <p class="text-cyan-400 text-xs">${p.tech}</p>
        </div>
    `).join('');
}