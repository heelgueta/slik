// Card Configuration
const cardConfig = [
    // Text Cards (2)
    {
        id: 1,
        type: 'text',
        presentation: 'Welcome',
        mainText: 'Welcome to SLIK Survey',
        description: 'This is a prototype of our new card-based survey system. Swipe up or down to navigate between cards.'
    },
    {
        id: 2,
        type: 'text',
        presentation: 'Instructions',
        mainText: 'How to Use',
        description: '• Swipe up/down to navigate\n• Tap checkboxes to verify\n• Swipe left/right for yes/no\n• Your responses are saved automatically'
    },
    
    // Check Cards (2)
    {
        id: 3,
        type: 'check',
        presentation: 'Verification',
        mainText: 'I have read the instructions',
        description: 'Please check this box to confirm you understand how to use this survey.'
    },
    {
        id: 4,
        type: 'check',
        presentation: 'Consent',
        mainText: 'I agree to participate',
        description: 'By checking this box, you consent to participate in this survey.'
    },
    
    // Yes/No Cards (6)
    {
        id: 5,
        type: 'yesno',
        presentation: 'Attitude',
        mainText: 'I enjoy learning about statistics',
        description: 'Do you find statistics interesting and engaging?'
    },
    {
        id: 6,
        type: 'yesno',
        presentation: 'Confidence',
        mainText: 'I feel confident with data analysis',
        description: 'Are you comfortable working with data and making analytical decisions?'
    },
    {
        id: 7,
        type: 'yesno',
        presentation: 'Preference',
        mainText: 'I prefer visual data over tables',
        description: 'Do you find charts and graphs more useful than numerical tables?'
    },
    {
        id: 8,
        type: 'yesno',
        presentation: 'Experience',
        mainText: 'I have used statistical software',
        description: 'Have you ever used tools like R, Python, SPSS, or Excel for analysis?'
    },
    {
        id: 9,
        type: 'yesno',
        presentation: 'Interest',
        mainText: 'I want to learn more about data science',
        description: 'Are you interested in developing your data science skills further?'
    },
    {
        id: 10,
        type: 'yesno',
        presentation: 'Application',
        mainText: 'I use data in my daily work',
        description: 'Do you regularly work with data in your professional or academic life?'
    }
];

// DOM Elements
const currentCardEl = document.getElementById('currentCard');
const totalCardsEl = document.getElementById('totalCards');
const progressFillEl = document.getElementById('progressFill');
const cardContainerEl = document.getElementById('cardContainer');

// State
let currentCardIndex = 0;
let responses = {};
let gesture = { startY: null, startX: null, currentY: null, currentX: null };
let isSwiping = false;
let isCompleted = false;

// Initialize
function init() {
    totalCardsEl.textContent = cardConfig.length;
    createCards();
    showCurrentCard();
    updateProgress();
    setupSwipeGestures();
    preventPullToRefresh();
}

function createCards() {
    cardContainerEl.innerHTML = '';
    
    cardConfig.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${card.type}-card`;
        cardEl.dataset.index = index;
        
        let cardHTML = '';
        
        if (card.presentation) {
            cardHTML += `<div class="card-presentation">${card.presentation}</div>`;
        }
        
        cardHTML += `<div class="card-main-text">${card.mainText}</div>`;
        
        if (card.description) {
            cardHTML += `<div class="card-description">${card.description}</div>`;
        }
        
        // Add response elements based on card type
        if (card.type === 'check') {
            cardHTML += `
                <div class="check-box" id="checkBox${index}">
                    <span id="checkIcon${index}">☐</span>
                </div>
                <div class="response-indicator check" id="responseIndicator${index}">✓</div>
            `;
        } else if (card.type === 'yesno') {
            cardHTML += `
                <div class="yes-no-buttons">
                    <button class="yes-no-btn no" data-value="no" data-card="${index}">NO</button>
                    <button class="yes-no-btn yes" data-value="yes" data-card="${index}">YES</button>
                </div>
                <div class="response-indicator yes" id="responseIndicator${index}">✓</div>
            `;
        }
        
        // Add swipe hints (will be updated dynamically)
        cardHTML += `<div class="swipe-hint" id="swipeHint${index}"></div>`;
        
        cardEl.innerHTML = cardHTML;
        cardContainerEl.appendChild(cardEl);
    });
    
    setupCardInteractions();
    updateSwipeHints();
}

function setupCardInteractions() {
    // Check box interactions
    document.querySelectorAll('.check-box').forEach((box, index) => {
        box.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCheckBox(index);
        });
    });
    
    // Yes/No button interactions
    document.querySelectorAll('.yes-no-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cardIndex = parseInt(btn.dataset.card);
            const value = btn.dataset.value;
            selectYesNo(cardIndex, value);
        });
    });
}

function showCurrentCard() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach((card, index) => {
        card.classList.remove('active', 'previous', 'next', 'swiping-up', 'swiping-down', 'swiping-left', 'swiping-right');
        
        if (index === currentCardIndex) {
            card.classList.add('active');
            showResponseIndicator(index);
        } else if (index < currentCardIndex) {
            card.classList.add('previous');
        } else {
            card.classList.add('next');
        }
    });
    
    updateSwipeHints();
}

function showResponseIndicator(cardIndex) {
    const card = cardConfig[cardIndex];
    const indicator = document.getElementById(`responseIndicator${cardIndex}`);
    
    if (indicator && responses[cardIndex]) {
        indicator.classList.add('show');
        
        if (card.type === 'check') {
            indicator.className = 'response-indicator check show';
        } else if (card.type === 'yesno') {
            const response = responses[cardIndex];
            indicator.className = `response-indicator ${response} show`;
        }
    } else if (indicator) {
        indicator.classList.remove('show');
    }
}

function toggleCheckBox(cardIndex) {
    const box = document.getElementById(`checkBox${cardIndex}`);
    const icon = document.getElementById(`checkIcon${cardIndex}`);
    const indicator = document.getElementById(`responseIndicator${cardIndex}`);
    
    if (responses[cardIndex]) {
        // Uncheck
        box.classList.remove('checked');
        icon.textContent = '☐';
        delete responses[cardIndex];
        indicator.classList.remove('show');
    } else {
        // Check
        box.classList.add('checked');
        icon.textContent = '☑';
        responses[cardIndex] = 'check';
        indicator.classList.add('show');
    }
    
    updateSwipeHints();
    console.log(`Check response for card ${cardIndex}:`, responses[cardIndex]);
}

function selectYesNo(cardIndex, value) {
    const card = document.querySelector(`[data-index="${cardIndex}"]`);
    const yesBtn = card.querySelector('.yes');
    const noBtn = card.querySelector('.no');
    const indicator = document.getElementById(`responseIndicator${cardIndex}`);
    
    // Update button states
    yesBtn.classList.remove('selected');
    noBtn.classList.remove('selected');
    
    if (value === 'yes') {
        yesBtn.classList.add('selected');
        responses[cardIndex] = 'yes';
    } else {
        noBtn.classList.add('selected');
        responses[cardIndex] = 'no';
    }
    
    // Show indicator
    indicator.classList.add('show');
    indicator.className = `response-indicator ${value} show`;
    
    updateSwipeHints();
    console.log(`Yes/No response for card ${cardIndex}:`, value);
}

function updateSwipeHints() {
    cardConfig.forEach((card, index) => {
        const hint = document.getElementById(`swipeHint${index}`);
        if (!hint) return;
        
        let hintText = '';
        
        if (index === 0) {
            hintText = 'Swipe up to continue';
        } else if (index === cardConfig.length - 1) {
            hintText = 'Swipe down to go back';
        } else {
            if (card.type === 'yesno') {
                if (responses[index]) {
                    hintText = 'Swipe up to continue | Swipe down to go back';
                } else {
                    hintText = 'Swipe left for NO | Swipe right for YES | Swipe up to skip';
                }
            } else if (card.type === 'check') {
                if (responses[index]) {
                    hintText = 'Swipe up to continue | Swipe down to go back';
                } else {
                    hintText = 'Swipe up to skip | Swipe down to go back';
                }
            } else {
                hintText = 'Swipe up to continue | Swipe down to go back';
            }
        }
        
        hint.textContent = hintText;
    });
}

function setupSwipeGestures() {
    cardContainerEl.addEventListener('touchstart', (e) => {
        if (isCompleted) return;
        
        // Don't start swipe if clicking on interactive elements
        if (e.target.closest('.check-box') || e.target.closest('.yes-no-btn')) {
            return;
        }
        
        gesture.startY = e.touches[0].clientY;
        gesture.startX = e.touches[0].clientX;
        isSwiping = true;
    });
    
    cardContainerEl.addEventListener('mousedown', (e) => {
        if (isCompleted) return;
        
        // Don't start swipe if clicking on interactive elements
        if (e.target.closest('.check-box') || e.target.closest('.yes-no-btn')) {
            return;
        }
        
        gesture.startY = e.clientY;
        gesture.startX = e.clientX;
        isSwiping = true;
    });
    
    cardContainerEl.addEventListener('touchmove', (e) => {
        if (!isSwiping || isCompleted) return;
        e.preventDefault();
        
        gesture.currentY = e.touches[0].clientY;
        gesture.currentX = e.touches[0].clientX;
        
        const deltaY = gesture.currentY - gesture.startY;
        const deltaX = gesture.currentX - gesture.startX;
        
        const activeCard = document.querySelector('.card.active');
        if (!activeCard) return;
        
        // Determine swipe direction
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
            // Vertical swipe
            if (deltaY > 20) {
                activeCard.classList.add('swiping-down');
                activeCard.classList.remove('swiping-up');
            } else if (deltaY < -20) {
                activeCard.classList.add('swiping-up');
                activeCard.classList.remove('swiping-down');
            }
        } else {
            // Horizontal swipe (for yes/no cards)
            const currentCard = cardConfig[currentCardIndex];
            if (currentCard.type === 'yesno') {
                if (deltaX > 20) {
                    activeCard.classList.add('swiping-right');
                    activeCard.classList.remove('swiping-left');
                } else if (deltaX < -20) {
                    activeCard.classList.add('swiping-left');
                    activeCard.classList.remove('swiping-right');
                }
            }
        }
    });
    
    cardContainerEl.addEventListener('mousemove', (e) => {
        if (!isSwiping || isCompleted) return;
        e.preventDefault();
        
        gesture.currentY = e.clientY;
        gesture.currentX = e.clientX;
        
        const deltaY = gesture.currentY - gesture.startY;
        const deltaX = gesture.currentX - gesture.startX;
        
        const activeCard = document.querySelector('.card.active');
        if (!activeCard) return;
        
        // Determine swipe direction
        if (Math.abs(deltaY) > Math.abs(deltaX)) {
            // Vertical swipe
            if (deltaY > 20) {
                activeCard.classList.add('swiping-down');
                activeCard.classList.remove('swiping-up');
            } else if (deltaY < -20) {
                activeCard.classList.add('swiping-up');
                activeCard.classList.remove('swiping-down');
            }
        } else {
            // Horizontal swipe (for yes/no cards)
            const currentCard = cardConfig[currentCardIndex];
            if (currentCard.type === 'yesno') {
                if (deltaX > 20) {
                    activeCard.classList.add('swiping-right');
                    activeCard.classList.remove('swiping-left');
                } else if (deltaX < -20) {
                    activeCard.classList.add('swiping-left');
                    activeCard.classList.remove('swiping-right');
                }
            }
        }
    });
    
    cardContainerEl.addEventListener('touchend', (e) => {
        if (!isSwiping || isCompleted) return;
        
        const deltaY = gesture.currentY - gesture.startY;
        const deltaX = gesture.currentX - gesture.startX;
        
        const activeCard = document.querySelector('.card.active');
        if (activeCard) {
            activeCard.classList.remove('swiping-up', 'swiping-down', 'swiping-left', 'swiping-right');
        }
        
        // Handle navigation
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
            if (deltaY > 0) {
                // Swipe down - go back
                previousCard();
            } else {
                // Swipe up - go forward
                nextCard();
            }
        } else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 80) {
            // Handle yes/no swipe
            const currentCard = cardConfig[currentCardIndex];
            if (currentCard.type === 'yesno') {
                if (deltaX > 0) {
                    selectYesNo(currentCardIndex, 'yes');
                } else {
                    selectYesNo(currentCardIndex, 'no');
                }
            }
        }
        
        isSwiping = false;
    });
    
    cardContainerEl.addEventListener('mouseup', (e) => {
        if (!isSwiping || isCompleted) return;
        
        const deltaY = gesture.currentY - gesture.startY;
        const deltaX = gesture.currentX - gesture.startX;
        
        const activeCard = document.querySelector('.card.active');
        if (activeCard) {
            activeCard.classList.remove('swiping-up', 'swiping-down', 'swiping-left', 'swiping-right');
        }
        
        // Handle navigation
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50) {
            if (deltaY > 0) {
                // Swipe down - go back
                previousCard();
            } else {
                // Swipe up - go forward
                nextCard();
            }
        } else if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 80) {
            // Handle yes/no swipe
            const currentCard = cardConfig[currentCardIndex];
            if (currentCard.type === 'yesno') {
                if (deltaX > 0) {
                    selectYesNo(currentCardIndex, 'yes');
                } else {
                    selectYesNo(currentCardIndex, 'no');
                }
            }
        }
        
        isSwiping = false;
    });
}

function preventPullToRefresh() {
    document.addEventListener('touchmove', (e) => {
        if (e.target.closest('.card-container')) {
            e.preventDefault();
        }
    }, { passive: false });
}

function nextCard() {
    if (currentCardIndex < cardConfig.length - 1) {
        currentCardIndex++;
        showCurrentCard();
        updateProgress();
    } else {
        // At the end - show completion
        showCompletion();
    }
}

function previousCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        showCurrentCard();
        updateProgress();
    } else {
        // At the beginning - give feedback
        showStartFeedback();
    }
}

function updateProgress() {
    currentCardEl.textContent = currentCardIndex + 1;
    
    const progressPercent = (currentCardIndex / (cardConfig.length - 1)) * 100;
    progressFillEl.style.width = `${progressPercent}%`;
}

function showStartFeedback() {
    const activeCard = document.querySelector('.card.active');
    if (activeCard) {
        activeCard.classList.add('swiping-down');
        setTimeout(() => {
            activeCard.classList.remove('swiping-down');
        }, 300);
    }
}

function showCompletion() {
    isCompleted = true;
    
    const totalResponses = Object.keys(responses).length;
    const checkResponses = Object.values(responses).filter(r => r === 'check').length;
    const yesResponses = Object.values(responses).filter(r => r === 'yes').length;
    const noResponses = Object.values(responses).filter(r => r === 'no').length;
    
    cardContainerEl.innerHTML = `
        <div class="card text-card active">
            <div class="card-presentation">Complete</div>
            <div class="card-main-text">Survey Complete!</div>
            <div class="card-description">
                You responded to ${totalResponses} out of ${cardConfig.length} cards.
                <br><br>
                Check responses: ${checkResponses}
                <br>
                Yes responses: ${yesResponses}
                <br>
                No responses: ${noResponses}
                <br><br>
                Thank you for participating!
            </div>
        </div>
    `;
    
    console.log('All responses:', responses);
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (isCompleted) return;
    
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
        nextCard();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
        previousCard();
    } else if (e.key === ' ') {
        // Space bar for check boxes
        const currentCard = cardConfig[currentCardIndex];
        if (currentCard.type === 'check') {
            toggleCheckBox(currentCardIndex);
        }
    } else if (e.key === 'y' || e.key === 'Y') {
        // Y for yes
        const currentCard = cardConfig[currentCardIndex];
        if (currentCard.type === 'yesno') {
            selectYesNo(currentCardIndex, 'yes');
        }
    } else if (e.key === 'n' || e.key === 'N') {
        // N for no
        const currentCard = cardConfig[currentCardIndex];
        if (currentCard.type === 'yesno') {
            selectYesNo(currentCardIndex, 'no');
        }
    }
});

// Initialize
init();
