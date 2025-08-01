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
let isHorizontalSwiping = false;
let swipeHintInterval = null;
let swipeHintTimers = [];

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
                    <span class="check-tick" id="checkIcon${index}" style="display: none;">✓</span>
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
        
        // Add swipe hints only for text cards
        if (card.type === 'text') {
            cardHTML += `<div class="swipe-hint top" id="swipeHintTop${index}"></div>`;
            cardHTML += `<div class="swipe-hint bottom" id="swipeHint${index}"></div>`;
        }
        
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
            const cardIndex = parseInt(box.closest('.card').dataset.index);
            if (responses[cardIndex] === 'check') {
                // Undo the check
                toggleCheckBox(cardIndex, true);
            } else {
                // Check the box
                toggleCheckBox(cardIndex, false);
                setTimeout(() => nextCard(), 350);
            }
        });
    });
    
    // Yes/No button interactions
    document.querySelectorAll('.yes-no-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cardIndex = parseInt(btn.dataset.card);
            const value = btn.dataset.value;
            if (responses[cardIndex] === value) {
                // Undo the selection - clicking the same button that's already selected
                selectYesNo(cardIndex, null);
            } else {
                // Select the option - clicking a different button or no button is selected
                selectYesNo(cardIndex, value);
                setTimeout(() => nextCard(), 350);
            }
        });
    });
}

function showCurrentCard() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach((card, index) => {
        card.classList.remove('active', 'previous', 'next', 'swiping-up', 'swiping-down', 'swiping-left', 'swiping-right', 'swiping-center');
        
        if (index === currentCardIndex) {
            card.classList.add('active');
            showResponseIndicator(index);
            
            // Reset button states to match current response
            const currentCard = cardConfig[currentCardIndex];
            if (currentCard.type === 'yesno') {
                const yesBtn = card.querySelector('.yes-no-btn.yes');
                const noBtn = card.querySelector('.yes-no-btn.no');
                if (yesBtn && noBtn) {
                    yesBtn.classList.remove('selected');
                    noBtn.classList.remove('selected');
                    
                    if (responses[currentCardIndex] === 'yes') {
                        yesBtn.classList.add('selected');
                    } else if (responses[currentCardIndex] === 'no') {
                        noBtn.classList.add('selected');
                    }
                }
            }
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
        indicator.innerHTML = '<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="14" fill="black"/><path d="M8 14.5L12 18.5L20 10.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    } else if (indicator) {
        indicator.classList.remove('show');
        indicator.innerHTML = '✓';
    }
}

function toggleCheckBox(cardIndex, undo = false) {
    const card = document.querySelector(`[data-index="${cardIndex}"]`);
    const box = card.querySelector('.check-box');
    const icon = card.querySelector('.check-tick');
    const indicator = card.querySelector('.response-indicator');
    
    if (!box || !icon || !indicator) {
        console.error('Checkbox elements not found for card', cardIndex);
        return;
    }
    
    if (undo) {
        box.classList.remove('checked');
        icon.style.display = 'none';
        delete responses[cardIndex];
        indicator.classList.remove('show');
    } else {
        box.classList.add('checked');
        icon.style.display = 'block';
        responses[cardIndex] = 'check';
        indicator.classList.add('show');
    }
    
    updateSwipeHints();
    console.log(`Check response for card ${cardIndex}:`, responses[cardIndex]);
}

function selectYesNo(cardIndex, value) {
    const card = document.querySelector(`[data-index="${cardIndex}"]`);
    const yesBtn = card.querySelector('.yes-no-btn.yes');
    const noBtn = card.querySelector('.yes-no-btn.no');
    const indicator = card.querySelector('.response-indicator');
    
    console.log(`selectYesNo called with cardIndex: ${cardIndex}, value: ${value}`);
    console.log(`Current responses[${cardIndex}]:`, responses[cardIndex]);
    console.log(`Found yesBtn:`, yesBtn);
    console.log(`Found noBtn:`, noBtn);
    
    // Reset both buttons completely to default state
    yesBtn.classList.remove('selected');
    noBtn.classList.remove('selected');
    
    console.log(`After removing selected classes - yesBtn.selected:`, yesBtn.classList.contains('selected'));
    console.log(`After removing selected classes - noBtn.selected:`, noBtn.classList.contains('selected'));
    
    card.classList.remove('swiping-left', 'swiping-right', 'swiping-center');
    
    if (!value) {
        delete responses[cardIndex];
        indicator.classList.remove('show');
        console.log(`Unselected - responses[${cardIndex}]:`, responses[cardIndex]);
        
    } else {
        if (value === 'yes') {
            yesBtn.classList.add('selected');
            responses[cardIndex] = 'yes';
            console.log(`Selected YES - yesBtn.selected:`, yesBtn.classList.contains('selected'));
        } else {
            noBtn.classList.add('selected');
            responses[cardIndex] = 'no';
            console.log(`Selected NO - noBtn.selected:`, noBtn.classList.contains('selected'));
        }
        indicator.classList.add('show');
    }
    
    updateSwipeHints();
    console.log(`Final responses[${cardIndex}]:`, responses[cardIndex]);
}

function updateSwipeHints() {
    // Only show hints on text cards
    cardConfig.forEach((card, index) => {
        if (card.type !== 'text') return;
        
        const hintTop = document.getElementById(`swipeHintTop${index}`);
        const hintBottom = document.getElementById(`swipeHint${index}`);
        if (!hintTop || !hintBottom) return;
        
        // Set text
        hintTop.textContent = 'Swipe down to go back';
        hintBottom.textContent = 'Swipe up to continue';
        
        // Reset opacity
        hintTop.style.opacity = '1';
        hintBottom.style.opacity = '1';
        
        // Dissolve after 3 pulses (6s)
        setTimeout(() => { hintTop.style.opacity = '0'; }, 6000);
        setTimeout(() => { hintBottom.style.opacity = '0'; }, 6000);
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
        gesture.currentY = e.touches[0].clientY;
        gesture.currentX = e.touches[0].clientX;
        isSwiping = true;
        isHorizontalSwiping = false;
    });
    
    cardContainerEl.addEventListener('mousedown', (e) => {
        if (isCompleted) return;
        
        // Don't start swipe if clicking on interactive elements
        if (e.target.closest('.check-box') || e.target.closest('.yes-no-btn')) {
            return;
        }
        
        gesture.startY = e.clientY;
        gesture.startX = e.clientX;
        gesture.currentY = e.clientY;
        gesture.currentX = e.clientX;
        isSwiping = true;
        isHorizontalSwiping = false;
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
        
        const currentCard = cardConfig[currentCardIndex];
        
        // For yes/no cards, check if horizontal swiping is happening
        if (currentCard.type === 'yesno' && Math.abs(deltaX) > 30) {
            isHorizontalSwiping = true;
        }
        
        // If we're horizontally swiping on yes/no, only show horizontal feedback
        if (currentCard.type === 'yesno' && isHorizontalSwiping) {
            if (Math.abs(deltaX) < 50) {
                activeCard.classList.add('swiping-center');
                activeCard.classList.remove('swiping-left', 'swiping-right', 'swiping-up', 'swiping-down');
            } else if (deltaX > 50) {
                activeCard.classList.add('swiping-right');
                activeCard.classList.remove('swiping-left', 'swiping-center', 'swiping-up', 'swiping-down');
            } else if (deltaX < -50) {
                activeCard.classList.add('swiping-left');
                activeCard.classList.remove('swiping-right', 'swiping-center', 'swiping-up', 'swiping-down');
            }
        } else {
            // For all cards, allow vertical swiping
            if (Math.abs(deltaY) > Math.abs(deltaX)) {
                if (deltaY > 30) {
                    activeCard.classList.add('swiping-down');
                    activeCard.classList.remove('swiping-up', 'swiping-left', 'swiping-right', 'swiping-center');
                } else if (deltaY < -30) {
                    activeCard.classList.add('swiping-up');
                    activeCard.classList.remove('swiping-down', 'swiping-left', 'swiping-right', 'swiping-center');
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
        
        const currentCard = cardConfig[currentCardIndex];
        
        // For yes/no cards, check if horizontal swiping is happening
        if (currentCard.type === 'yesno' && Math.abs(deltaX) > 30) {
            isHorizontalSwiping = true;
        }
        
        // If we're horizontally swiping on yes/no, only show horizontal feedback
        if (currentCard.type === 'yesno' && isHorizontalSwiping) {
            if (Math.abs(deltaX) < 50) {
                activeCard.classList.add('swiping-center');
                activeCard.classList.remove('swiping-left', 'swiping-right', 'swiping-up', 'swiping-down');
            } else if (deltaX > 50) {
                activeCard.classList.add('swiping-right');
                activeCard.classList.remove('swiping-left', 'swiping-center', 'swiping-up', 'swiping-down');
            } else if (deltaX < -50) {
                activeCard.classList.add('swiping-left');
                activeCard.classList.remove('swiping-right', 'swiping-center', 'swiping-up', 'swiping-down');
            }
        } else {
            // For all cards, allow vertical swiping
            if (Math.abs(deltaY) > Math.abs(deltaX)) {
                if (deltaY > 30) {
                    activeCard.classList.add('swiping-down');
                    activeCard.classList.remove('swiping-up', 'swiping-left', 'swiping-right', 'swiping-center');
                } else if (deltaY < -30) {
                    activeCard.classList.add('swiping-up');
                    activeCard.classList.remove('swiping-down', 'swiping-left', 'swiping-right', 'swiping-center');
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
            activeCard.classList.remove('swiping-up', 'swiping-down', 'swiping-left', 'swiping-right', 'swiping-center');
            activeCard.style.borderColor = '';
        }
        
        const currentCard = cardConfig[currentCardIndex];
        
        // Only trigger navigation if there's a significant swipe
        const minSwipeDistance = 100;
        
        // Check if this was actually a swipe (not just a tap)
        const isActualSwipe = Math.abs(deltaY) > minSwipeDistance || Math.abs(deltaX) > minSwipeDistance;
        
        if (!isActualSwipe) {
            isSwiping = false;
            isHorizontalSwiping = false;
            return;
        }
        
        // Handle navigation based on card type and swipe direction
        if (currentCard.type === 'yesno' && Math.abs(deltaX) > minSwipeDistance) {
            // Horizontal swipe for yes/no cards
            if (deltaX > 50) {
                selectYesNo(currentCardIndex, responses[currentCardIndex] === 'yes' ? null : 'yes');
                setTimeout(() => nextCard(), 350);
            } else if (deltaX < -50) {
                selectYesNo(currentCardIndex, responses[currentCardIndex] === 'no' ? null : 'no');
                setTimeout(() => nextCard(), 350);
            }
        } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
            // Vertical swipe for all cards
            if (deltaY > 0) {
                // Swipe down - go back
                previousCard();
            } else {
                // Swipe up - go forward or auto-advance if responded
                if ((currentCard.type === 'check' && responses[currentCardIndex]) || (currentCard.type === 'yesno' && responses[currentCardIndex])) {
                    setTimeout(() => nextCard(), 150);
                } else {
                    nextCard();
                }
            }
        }
        
        isSwiping = false;
        isHorizontalSwiping = false;
    });
    
    cardContainerEl.addEventListener('mouseup', (e) => {
        if (!isSwiping || isCompleted) return;
        
        const deltaY = gesture.currentY - gesture.startY;
        const deltaX = gesture.currentX - gesture.startX;
        
        const activeCard = document.querySelector('.card.active');
        if (activeCard) {
            activeCard.classList.remove('swiping-up', 'swiping-down', 'swiping-left', 'swiping-right', 'swiping-center');
            activeCard.style.borderColor = '';
        }
        
        const currentCard = cardConfig[currentCardIndex];
        
        // Only trigger navigation if there's a significant swipe
        const minSwipeDistance = 100;
        
        // Check if this was actually a swipe (not just a tap)
        const isActualSwipe = Math.abs(deltaY) > minSwipeDistance || Math.abs(deltaX) > minSwipeDistance;
        
        if (!isActualSwipe) {
            isSwiping = false;
            isHorizontalSwiping = false;
            return;
        }
        
        // Handle navigation based on card type and swipe direction
        if (currentCard.type === 'yesno' && Math.abs(deltaX) > minSwipeDistance) {
            // Horizontal swipe for yes/no cards
            if (deltaX > 50) {
                selectYesNo(currentCardIndex, responses[currentCardIndex] === 'yes' ? null : 'yes');
                setTimeout(() => nextCard(), 350);
            } else if (deltaX < -50) {
                selectYesNo(currentCardIndex, responses[currentCardIndex] === 'no' ? null : 'no');
                setTimeout(() => nextCard(), 350);
            }
        } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
            // Vertical swipe for all cards
            if (deltaY > 0) {
                // Swipe down - go back
                previousCard();
            } else {
                // Swipe up - go forward or auto-advance if responded
                if ((currentCard.type === 'check' && responses[currentCardIndex]) || (currentCard.type === 'yesno' && responses[currentCardIndex])) {
                    setTimeout(() => nextCard(), 150);
                } else {
                    nextCard();
                }
            }
        }
        
        isSwiping = false;
        isHorizontalSwiping = false;
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

