const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const submitBtn = form.querySelector('button[type="submit"]');
const clearBtn = document.getElementById('clear-chat');

// Array untuk menyimpan memori percakapan
let conversationHistory = [];

// Fungsi untuk mengirim pesan (dari input form maupun tombol rekomendasi)
async function processMessage(userMessage) {
    if (!userMessage) return;
    
    appendMessage('user', userMessage);
    input.value = '';
    
    // 1. Simpan pesan user ke dalam memori
    conversationHistory.push({ role: 'user', text: userMessage });
    
    input.disabled = true;
    submitBtn.disabled = true;

    const botMessageElement = document.createElement('div');
    botMessageElement.classList.add('message', 'bot');
    botMessageElement.innerHTML = `
        <div class="typing-indicator">
            <span></span><span></span><span></span>
        </div>
    `;
    chatBox.appendChild(botMessageElement);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // 2. Kirim seluruh memori percakapan, bukan cuma 1 pesan
            body: JSON.stringify({ conversation: conversationHistory }) 
        });

        if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
        
        const data = await response.json();
        if (data && data.result) {
            botMessageElement.innerHTML = marked.parse(data.result);
            
            // 3. Simpan jawaban bot ke dalam memori agar ia ingat
            // Ingat: Gemini menggunakan role 'model' untuk dirinya sendiri
            conversationHistory.push({ role: 'model', text: data.result });
        } else {
            botMessageElement.textContent = "Maaf, tidak ada respons yang diterima 🥺";
        }
    } catch (error) {
        botMessageElement.textContent = 'Gagal menghubungi server 😭';
        // Hapus pesan user terakhir dari memori jika gagal terkirim
        conversationHistory.pop(); 
    } finally {
        input.disabled = false;
        submitBtn.disabled = false;
        input.focus();
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Event Listener Form Submit Biasa
form.addEventListener('submit', function (e) {
    e.preventDefault();
    processMessage(input.value.trim());
});

// Fungsi untuk menangani klik dari tombol rekomendasi
function sendRecommendation(text) {
    processMessage(text);
}

// Fungsi untuk menghapus riwayat obrolan & memori
clearBtn.addEventListener('click', () => {
    // Kosongkan array memori
    conversationHistory = [];
    
    // Hapus tampilan chat, sisakan pesan pembuka saja
    chatBox.innerHTML = `
        <div class="message bot">
            Ingatan dihapus! Mari mulai obrolan baru. 🎀
        </div>
    `;
});

function appendMessage(sender, text) {
    const msg = document.createElement('div');
    msg.classList.add('message', sender);
    
    if (sender === 'bot') {
        msg.innerHTML = marked.parse(text);
    } else {
        msg.textContent = text;
    }
    
    chatBox.appendChild(msg);
}