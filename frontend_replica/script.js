document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const messageList = document.getElementById('message-list');
    const chatContainer = document.getElementById('chat-container');

    // Utility function to measure text width
    function getTextWidth(text, font) {
        const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
        const context = canvas.getContext("2d");
        context.font = font;
        const metrics = context.measureText(text);
        return metrics.width;
    }

    function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) return;

        // 1. Get input styling and dimensions
        const inputStyle = window.getComputedStyle(messageInput);
        const inputFont = `${inputStyle.fontWeight} ${inputStyle.fontSize} ${inputStyle.fontFamily}`;
        const textWidth = getTextWidth(text, inputFont);

        const inputRect = messageInput.getBoundingClientRect();
        const sendBtnRect = sendBtn.getBoundingClientRect();

        // 2. Clear input
        messageInput.value = '';

        // 3. Create actual message in list to get its final target position
        const messageEl = document.createElement('div');
        messageEl.className = 'message sent';
        const bubbleEl = document.createElement('div');
        bubbleEl.className = 'bubble';
        // Hide temporarily while animating
        bubbleEl.style.opacity = '0';
        bubbleEl.textContent = text;
        messageEl.appendChild(bubbleEl);
        messageList.appendChild(messageEl);

        // Scroll to make sure target is visible, then get target rect
        chatContainer.scrollTo(0, chatContainer.scrollHeight);

        // Use requestAnimationFrame to let the browser compute layout and scroll
        requestAnimationFrame(() => {
            const targetRect = bubbleEl.getBoundingClientRect();

            // Create a floating container for animation
            const flyingContainer = document.createElement('div');
            flyingContainer.style.position = 'fixed';
            flyingContainer.style.zIndex = '9999';
            flyingContainer.style.left = '0';
            flyingContainer.style.top = '0';
            flyingContainer.style.pointerEvents = 'none';
            document.body.appendChild(flyingContainer);

            // Create flying bubble background
            const flyingBubble = document.createElement('div');
            flyingBubble.className = 'bubble sent'; // to inherit style
            flyingBubble.style.backgroundColor = '#e3f2fd';
            flyingBubble.style.color = '#000000';
            flyingBubble.style.padding = '8px 12px';
            flyingBubble.style.borderRadius = '12px';
            flyingBubble.style.borderBottomRightRadius = '4px';
            flyingBubble.style.fontSize = '15px';
            flyingBubble.style.lineHeight = '1.4';
            flyingBubble.style.position = 'absolute';
            flyingBubble.style.width = targetRect.width + 'px';
            flyingBubble.style.height = targetRect.height + 'px';
            flyingContainer.appendChild(flyingBubble);

            // Create flying text
            const flyingText = document.createElement('div');
            flyingText.textContent = text;
            flyingText.style.position = 'absolute';
            flyingText.style.fontSize = '15px';
            flyingText.style.whiteSpace = 'nowrap';
            flyingContainer.appendChild(flyingText);

            // Calculate start positions
            const maxInputWidth = inputRect.width;
            const isShortMessage = textWidth < maxInputWidth - 20;

            const paddingLeft = parseFloat(inputStyle.paddingLeft);
            const textStartX = inputRect.left + paddingLeft;
            const textStartY = inputRect.top + parseFloat(inputStyle.paddingTop);

            // X position near the send button for short message
            const rightEdgeX = inputRect.right - textWidth;

            // Text initial position
            flyingText.style.transform = `translate(${textStartX}px, ${textStartY}px)`;

            // Bubble initial state (transparent and positioned with the text)
            flyingBubble.style.opacity = '0';
            flyingBubble.style.transform = `translate(${textStartX - paddingLeft}px, ${inputRect.top}px)`;

            let slideAnimation;
            let flyAnimation;

            if (isShortMessage) {
                // Short message: Slide right to edge, then show bubble and fly up
                const slideDist = rightEdgeX - textStartX;

                slideAnimation = flyingText.animate([
                    { transform: `translate(${textStartX}px, ${textStartY}px)` },
                    { transform: `translate(${rightEdgeX}px, ${textStartY}px)` }
                ], {
                    duration: 150,
                    easing: 'ease-in'
                });

                slideAnimation.onfinish = () => {
                    // Start flying to target
                    const startBubbleX = rightEdgeX - 12; // approximate padding
                    const startBubbleY = inputRect.top - 4;

                    flyingBubble.style.opacity = '1';

                    const flyBubbleAnim = flyingBubble.animate([
                        { transform: `translate(${startBubbleX}px, ${startBubbleY}px)`, opacity: 0 },
                        { transform: `translate(${startBubbleX}px, ${startBubbleY}px)`, opacity: 1, offset: 0.1 },
                        { transform: `translate(${targetRect.left}px, ${targetRect.top}px)`, opacity: 1 }
                    ], {
                        duration: 200,
                        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
                    });

                    const textTargetX = targetRect.left + 12; // text inside bubble
                    const textTargetY = targetRect.top + 8;

                    const flyTextAnim = flyingText.animate([
                        { transform: `translate(${rightEdgeX}px, ${textStartY}px)` },
                        { transform: `translate(${textTargetX}px, ${textTargetY}px)` }
                    ], {
                        duration: 200,
                        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
                    });

                    flyTextAnim.onfinish = () => {
                        bubbleEl.style.opacity = '1';
                        flyingContainer.remove();
                    };
                };
            } else {
                // Long message: No sliding, immediately show bubble and fly up
                flyingBubble.style.opacity = '1';

                const startBubbleX = inputRect.right - targetRect.width - 12;
                const startBubbleY = inputRect.top - 4;

                const textStartXLong = startBubbleX + 12;

                const flyBubbleAnim = flyingBubble.animate([
                    { transform: `translate(${startBubbleX}px, ${startBubbleY}px) scale(0.9)`, opacity: 0.5 },
                    { transform: `translate(${targetRect.left}px, ${targetRect.top}px) scale(1)`, opacity: 1 }
                ], {
                    duration: 250,
                    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
                });

                const textTargetX = targetRect.left + 12;
                const textTargetY = targetRect.top + 8;

                const flyTextAnim = flyingText.animate([
                    { transform: `translate(${textStartXLong}px, ${textStartY}px)` },
                    { transform: `translate(${textTargetX}px, ${textTargetY}px)` }
                ], {
                    duration: 250,
                    easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
                });

                flyTextAnim.onfinish = () => {
                    bubbleEl.style.opacity = '1';
                    flyingContainer.remove();
                };
            }
        });
    }

    sendBtn.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
});
