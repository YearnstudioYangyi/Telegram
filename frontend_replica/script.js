document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const messageList = document.getElementById('message-list');
    const chatContainer = document.getElementById('chat-container');

    // Function to handle sending message
    function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;

        // 1. Get input position for animation start point
        const inputRect = messageInput.getBoundingClientRect();
        const chatRect = chatContainer.getBoundingClientRect();
        const listRect = messageList.getBoundingClientRect();

        // 2. Clear input
        messageInput.value = '';

        // 3. Create the message element
        const messageEl = document.createElement('div');
        messageEl.className = 'message sent';

        const bubbleEl = document.createElement('div');
        bubbleEl.className = 'bubble';
        bubbleEl.textContent = text;

        messageEl.appendChild(bubbleEl);

        // Append to get target dimensions
        messageList.appendChild(messageEl);

        // 4. Calculate animation values
        const targetRect = bubbleEl.getBoundingClientRect();

        // Telegram animation starts from the input text area and expands/flies to the final position
        const startX = inputRect.left - targetRect.left;
        const startY = inputRect.top - targetRect.top;

        // Apply initial state to bubble
        bubbleEl.style.transformOrigin = 'bottom right';
        bubbleEl.style.transform = `translate(${startX}px, ${startY}px) scale(0.5)`;
        bubbleEl.style.opacity = '0';

        // Force reflow
        void bubbleEl.offsetWidth;

        // Apply transition and final state
        bubbleEl.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.3s ease';
        bubbleEl.style.transform = 'translate(0, 0) scale(1)';
        bubbleEl.style.opacity = '1';

        // Scroll to bottom smoothly
        setTimeout(() => {
             chatContainer.scrollTo({
                 top: chatContainer.scrollHeight,
                 behavior: 'smooth'
             });
        }, 50);

        // Cleanup styles after animation
        setTimeout(() => {
            bubbleEl.style.transition = '';
            bubbleEl.style.transform = '';
            bubbleEl.style.transformOrigin = '';
        }, 300);
    }

    sendBtn.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
});
