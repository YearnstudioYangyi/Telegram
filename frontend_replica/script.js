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
            flyingBubble.style.borderRadius = '12px';
            flyingBubble.style.borderBottomRightRadius = '4px';
            flyingBubble.style.position = 'absolute';
            flyingBubble.style.maxWidth = 'none'; // Overide max-width

            flyingContainer.appendChild(flyingBubble);

            // Create flying text
            const flyingText = document.createElement('div');
            flyingText.textContent = text;
            flyingText.style.position = 'absolute';
            flyingText.style.fontSize = '15px';
            flyingText.style.fontFamily = inputStyle.fontFamily;
            flyingText.style.wordWrap = 'break-word';
            flyingText.style.whiteSpace = 'pre-wrap';
            flyingContainer.appendChild(flyingText);

            // Calculate start positions
            const maxInputWidth = inputRect.width;
            const isShortMessage = textWidth < maxInputWidth - 30; // giving a little more padding leeway

            const paddingLeft = parseFloat(inputStyle.paddingLeft);
            const textStartX = inputRect.left + paddingLeft;
            const textStartY = inputRect.top + parseFloat(inputStyle.paddingTop);

            // X position near the send button for short message
            const rightEdgeX = inputRect.right - textWidth;

            // Initialize text for sliding
            flyingText.style.transform = `translate(${textStartX}px, ${textStartY}px)`;

            // Text width needs to be bounded by target rect so it wraps identically
            flyingText.style.width = (targetRect.width - 24) + 'px'; // 24 is roughly padding left + right

            // Bubble is fully hidden initially
            flyingBubble.style.opacity = '0';

            // Calculate dimensions
            // To prevent border-radius distortion, we don't use scale().
            // We animate the width/height CSS properties directly.

            const startWidth = isShortMessage ? textWidth + 24 : inputRect.width;
            const startHeight = inputRect.height;

            const targetWidth = targetRect.width;
            const targetHeight = targetRect.height;

            let slideAnimation;

            if (isShortMessage) {
                // Short message: Slide right to edge, then show bubble and fly up
                flyingText.style.width = textWidth + 'px'; // during slide, it's a single line

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
                    const startBubbleY = inputRect.top;

                    flyingBubble.style.opacity = '1';

                    // Direct width/height/transform animation for Bubble
                    const flyBubbleAnim = flyingBubble.animate([
                        {
                            transform: `translate(${startBubbleX}px, ${startBubbleY}px)`,
                            width: `${startWidth}px`,
                            height: `${startHeight}px`
                        },
                        {
                            transform: `translate(${targetRect.left}px, ${targetRect.top}px)`,
                            width: `${targetWidth}px`,
                            height: `${targetHeight}px`
                        }
                    ], {
                        duration: 250,
                        easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
                    });

                    const textTargetX = targetRect.left + 12;
                    const textTargetY = targetRect.top + 8; // approx padding top inside bubble

                    // Update text to wrap correctly inside the bubble
                    flyingText.style.width = (targetWidth - 24) + 'px';

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
                // Long message: No sliding, immediately show bubble and fly up
                flyingBubble.style.opacity = '1';

                const startBubbleX = inputRect.left + 4; // match input box position roughly
                const startBubbleY = inputRect.top;

                const textStartXLong = startBubbleX + paddingLeft;

                // Set text start position to match bubble
                flyingText.style.transform = `translate(${textStartXLong}px, ${textStartY}px)`;

                const flyBubbleAnim = flyingBubble.animate([
                    {
                        transform: `translate(${startBubbleX}px, ${startBubbleY}px)`,
                        width: `${startWidth}px`,
                        height: `${startHeight}px`
                    },
                    {
                        transform: `translate(${targetRect.left}px, ${targetRect.top}px)`,
                        width: `${targetWidth}px`,
                        height: `${targetHeight}px`
                    }
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
