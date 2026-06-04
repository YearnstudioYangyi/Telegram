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
            // Start sizing at target size, we will scale it to fit initial state
            flyingBubble.style.width = targetRect.width + 'px';
            flyingBubble.style.height = targetRect.height + 'px';
            // Use transform-origin top left for easier morph scaling
            flyingBubble.style.transformOrigin = 'top left';
            flyingContainer.appendChild(flyingBubble);

            // Create flying text
            const flyingText = document.createElement('div');
            flyingText.textContent = text;
            flyingText.style.position = 'absolute';
            flyingText.style.fontSize = '15px';
            // Use word-wrap and target width to allow multi-line text to render correctly during flight
            flyingText.style.width = (targetRect.width - 24) + 'px'; // width minus padding
            flyingText.style.wordWrap = 'break-word';
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

            // Text initial position for sliding (only text is visible initially)
            flyingText.style.transform = `translate(${textStartX}px, ${textStartY}px)`;

            // Bubble is fully hidden while text is still inside the input
            flyingBubble.style.opacity = '0';

            // Calculate starting scale based on the input box height vs target bubble height
            const startScaleY = (inputRect.height - 8) / targetRect.height;
            const startScaleX = isShortMessage ?
                (textWidth + 24) / targetRect.width :
                (inputRect.width - 24) / targetRect.width;

            let slideAnimation;

            if (isShortMessage) {
                // Short message: Slide right to edge, then show bubble and fly up

                slideAnimation = flyingText.animate([
                    { transform: `translate(${textStartX}px, ${textStartY}px)` },
                    { transform: `translate(${rightEdgeX}px, ${textStartY}px)` }
                ], {
                    duration: 150,
                    easing: 'ease-in'
                });

                slideAnimation.onfinish = () => {
                    // Make bubble fully visible instantly when it leaves the input area
                    flyingBubble.style.opacity = '1';

                    const startBubbleX = rightEdgeX - 12;
                    const startBubbleY = inputRect.top;

                    // Fly up and scale bubble to final size (no opacity changes)
                    const flyBubbleAnim = flyingBubble.animate([
                        { transform: `translate(${startBubbleX}px, ${startBubbleY}px) scale(${startScaleX}, ${startScaleY})` },
                        { transform: `translate(${targetRect.left}px, ${targetRect.top}px) scale(1, 1)` }
                    ], {
                        duration: 250,
                        easing: 'cubic-bezier(0.25, 1, 0.5, 1)' // smooth decelerating curve
                    });

                    const textTargetX = targetRect.left + 12;
                    const textTargetY = targetRect.top + 8;

                    const flyTextAnim = flyingText.animate([
                        { transform: `translate(${rightEdgeX}px, ${textStartY}px)` },
                        { transform: `translate(${textTargetX}px, ${textTargetY}px)` }
                    ], {
                        duration: 250,
                        easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
                    });

                    flyTextAnim.onfinish = () => {
                        bubbleEl.style.opacity = '1';
                        flyingContainer.remove();
                    };
                };
            } else {
                // Long message: No sliding, immediately show bubble and fly up fully opaque
                flyingBubble.style.opacity = '1';

                const startBubbleX = inputRect.left + 8;
                const startBubbleY = inputRect.top;

                const textStartXLong = startBubbleX + 12;

                // Align text initially for long messages
                flyingText.style.transform = `translate(${textStartXLong}px, ${textStartY}px)`;

                const flyBubbleAnim = flyingBubble.animate([
                    { transform: `translate(${startBubbleX}px, ${startBubbleY}px) scale(${startScaleX}, ${startScaleY})` },
                    { transform: `translate(${targetRect.left}px, ${targetRect.top}px) scale(1, 1)` }
                ], {
                    duration: 300,
                    easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
                });

                const textTargetX = targetRect.left + 12;
                const textTargetY = targetRect.top + 8;

                const flyTextAnim = flyingText.animate([
                    { transform: `translate(${textStartXLong}px, ${textStartY}px)` },
                    { transform: `translate(${textTargetX}px, ${textTargetY}px)` }
                ], {
                    duration: 300,
                    easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
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
