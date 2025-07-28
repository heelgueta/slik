// Survey Configuration
const surveyConfig = {
    sections: [
        {
            id: 1,
            title: "Attitudes Toward Statistics",
            description: "Let's explore your feelings about statistics and data analysis.",
            type: "likert",
            items: [
                "I enjoy learning about statistics",
                "Statistical analysis is fascinating to me",
                "I find data visualization appealing",
                "Probability concepts are intuitive",
                "I like working with numbers and data"
            ]
        },
        {
            id: 2,
            title: "Statistical Confidence",
            description: "How confident do you feel about various statistical concepts?",
            type: "likert",
            items: [
                "I feel confident interpreting charts",
                "Statistical software is user-friendly",
                "I understand correlation vs causation",
                "Statistical significance makes sense",
                "I can spot misleading statistics"
            ]
        },
        {
            id: 3,
            title: "Data Analysis Preferences",
            description: "Quick preferences about data analysis approaches.",
            type: "yesno",
            items: [
                "I prefer visual data over tables",
                "I enjoy hypothesis testing",
                "Regression analysis is clear to me",
                "I like exploring datasets",
                "Confidence intervals are intuitive"
            ]
        },
        {
            id: 4,
            title: "Statistical Concepts",
            description: "Rate your understanding of these concepts.",
            type: "semantic",
            items: [
                {
                    question: "Correlation vs Causation",
                    leftLabel: "Confusing",
                    rightLabel: "Clear"
                },
                {
                    question: "P-values",
                    leftLabel: "Mysterious",
                    rightLabel: "Intuitive"
                },
                {
                    question: "Confidence Intervals",
                    leftLabel: "Uncertain",
                    rightLabel: "Confident"
                },
                {
                    question: "Statistical Power",
                    leftLabel: "Weak",
                    rightLabel: "Strong"
                },
                {
                    question: "Effect Size",
                    leftLabel: "Small",
                    rightLabel: "Large"
                }
            ]
        }
    ]
};

// DOM Elements
const backBtn = document.getElementById('backBtn');
const themeBtn = document.getElementById('themeBtn');
const currentSectionEl = document.getElementById('currentSection');
const totalSectionsEl = document.getElementById('totalSections');
const currentItemEl = document.getElementById('currentItem');
const totalItemsEl = document.getElementById('totalItems');
const progressFillEl = document.getElementById('progressFill');
const contentContainerEl = document.getElementById('contentContainer');

// State
let currentSectionIndex = 0;
let currentItemIndex = 0;
let isInSection = false;
let responses = [];
let gesture = { type: null, startY: null, currentY: null, startX: null, currentX: null };
let isSliding = false;
let isSwipingCard = false;
let currentTheme = 'dark';

// Initialize
function init() {
    totalSectionsEl.textContent = surveyConfig.sections.length;
    showSectionIntro();
    updateProgress();
    setupThemeToggle();
    preventPullToRefresh();
}

function setupThemeToggle() {
    themeBtn.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        themeBtn.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
    });
}

function preventPullToRefresh() {
    // Prevent pull-to-refresh on mobile
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            gesture.startY = touch.clientY;
        }
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const deltaY = touch.clientY - gesture.startY;
            
            // Prevent pull-to-refresh
            if (deltaY > 0 && window.scrollY === 0) {
                e.preventDefault();
            }
        }
    }, { passive: false });
}

function showSectionIntro() {
    const section = surveyConfig.sections[currentSectionIndex];
    
    contentContainerEl.innerHTML = `
        <div class="section-intro">
            <h2 class="section-title">${section.title}</h2>
            <p class="section-description">${section.description}</p>
            <button class="start-section-btn" id="startSectionBtn">Start Section</button>
        </div>
    `;
    
    document.getElementById('startSectionBtn').addEventListener('click', startSection);
    
    isInSection = false;
}

function startSection() {
    const section = surveyConfig.sections[currentSectionIndex];
    currentItemIndex = 0;
    
    createCards(section);
    showCurrentCard();
    updateResponseInterface();
    
    isInSection = true;
    updateProgress();
}

function createCards(section) {
    contentContainerEl.innerHTML = '';
    
    if (section.type === 'semantic') {
        section.items.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.dataset.index = index;
            
            card.innerHTML = `
                <div class="item-number">Item ${index + 1}</div>
                <div class="item-question">${item.question}</div>
            `;
            
            contentContainerEl.appendChild(card);
        });
    } else {
        section.items.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.dataset.index = index;
            
            card.innerHTML = `
                <div class="item-number">Item ${index + 1}</div>
                <div class="item-question">${item}</div>
            `;
            
            contentContainerEl.appendChild(card);
        });
    }
}

function showCurrentCard() {
    const cards = document.querySelectorAll('.item-card');
    
    cards.forEach((card, index) => {
        card.classList.remove('active', 'previous', 'next', 'swiping-up', 'swiping-down');
        
        if (index === currentItemIndex) {
            card.classList.add('active');
        } else if (index < currentItemIndex) {
            card.classList.add('previous');
        } else {
            card.classList.add('next');
        }
    });
}

function updateResponseInterface() {
    const section = surveyConfig.sections[currentSectionIndex];
    
    if (section.type === 'likert') {
        createLikertResponse();
    } else if (section.type === 'yesno') {
        createYesNoResponse();
    } else if (section.type === 'semantic') {
        createSemanticResponse();
    }
}

function createLikertResponse() {
    const section = surveyConfig.sections[currentSectionIndex];
    const currentItem = section.items[currentItemIndex];
    
    const responseEl = document.createElement('div');
    responseEl.innerHTML = `
        <div class="response-instructions">Tap or slide to indicate your agreement</div>
        <div class="likert-scale" id="likertScale">
            <div class="likert-option" data-value="1">
                <div class="option-text">Strongly Disagree</div>
            </div>
            <div class="likert-option" data-value="2">
                <div class="option-text">Disagree</div>
            </div>
            <div class="likert-option" data-value="3">
                <div class="option-text">Neutral</div>
            </div>
            <div class="likert-option" data-value="4">
                <div class="option-text">Agree</div>
            </div>
            <div class="likert-option" data-value="5">
                <div class="option-text">Strongly Agree</div>
            </div>
        </div>
    `;
    
    contentContainerEl.appendChild(responseEl);
    setupLikertInteractions();
}

function createYesNoResponse() {
    const section = surveyConfig.sections[currentSectionIndex];
    const currentItem = section.items[currentItemIndex];
    
    const responseEl = document.createElement('div');
    responseEl.innerHTML = `
        <div class="yes-no-card" id="yesNoCard">
            <div class="yes-no-question">${currentItem}</div>
            <div class="yes-no-buttons">
                <button class="yes-no-btn no" data-value="no">NO</button>
                <button class="yes-no-btn yes" data-value="yes">YES</button>
            </div>
        </div>
    `;
    
    contentContainerEl.appendChild(responseEl);
    setupYesNoInteractions();
}

function createSemanticResponse() {
    const section = surveyConfig.sections[currentSectionIndex];
    const currentItem = section.items[currentItemIndex];
    
    const responseEl = document.createElement('div');
    responseEl.innerHTML = `
        <div class="semantic-scale" id="semanticScale">
            <div class="semantic-question">${currentItem.question}</div>
            <div class="semantic-bar" id="semanticBar">
                <div class="semantic-slider" id="semanticSlider"></div>
            </div>
            <div class="semantic-labels">
                <div class="semantic-label left">${currentItem.leftLabel}</div>
                <div class="semantic-label right">${currentItem.rightLabel}</div>
            </div>
        </div>
    `;
    
    contentContainerEl.appendChild(responseEl);
    setupSemanticInteractions();
}

function setupLikertInteractions() {
    const scale = document.getElementById('likertScale');
    const options = document.querySelectorAll('.likert-option');
    
    // Tapping
    options.forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectLikertOption(opt.dataset.value);
        });
    });
    
    // Sliding
    scale.addEventListener('touchstart', (e) => {
        e.preventDefault();
        gesture.type = 'slide';
        gesture.startX = e.touches[0].clientX;
        isSliding = true;
    });
    
    scale.addEventListener('touchmove', (e) => {
        if (!isSliding) return;
        e.preventDefault();
        
        gesture.currentX = e.touches[0].clientX;
        const scaleRect = scale.getBoundingClientRect();
        const relativeX = gesture.currentX - scaleRect.left;
        const part = scaleRect.width / options.length;
        const index = Math.floor(relativeX / part);
        
        if (index >= 0 && index < options.length) {
            resetLikertOptions();
            options[index].classList.add('selected');
        }
    });
    
    scale.addEventListener('touchend', (e) => {
        if (isSliding && gesture.type === 'slide') {
            const selected = document.querySelector('.likert-option.selected');
            if (selected) {
                selectLikertOption(selected.dataset.value);
            }
        }
        isSliding = false;
        gesture.type = null;
    });
    
    // Mouse events for desktop
    scale.addEventListener('mousedown', (e) => {
        gesture.type = 'slide';
        gesture.startX = e.clientX;
        isSliding = true;
    });
    
    scale.addEventListener('mousemove', (e) => {
        if (!isSliding) return;
        e.preventDefault();
        
        gesture.currentX = e.clientX;
        const scaleRect = scale.getBoundingClientRect();
        const relativeX = gesture.currentX - scaleRect.left;
        const part = scaleRect.width / options.length;
        const index = Math.floor(relativeX / part);
        
        if (index >= 0 && index < options.length) {
            resetLikertOptions();
            options[index].classList.add('selected');
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isSliding && gesture.type === 'slide') {
            const selected = document.querySelector('.likert-option.selected');
            if (selected) {
                selectLikertOption(selected.dataset.value);
            }
        }
        isSliding = false;
        gesture.type = null;
    });
}

function setupYesNoInteractions() {
    const card = document.getElementById('yesNoCard');
    const yesBtn = card.querySelector('.yes');
    const noBtn = card.querySelector('.no');
    
    // Button clicks
    yesBtn.addEventListener('click', () => selectYesNoOption('yes'));
    noBtn.addEventListener('click', () => selectYesNoOption('no'));
    
    // Swipe gestures with improved behavior
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    
    card.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
        isSwipingCard = true;
    });
    
    card.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - startX;
        
        // Allow movement but keep centered position
        if (Math.abs(deltaX) > 20) {
            if (deltaX > 0) {
                card.classList.add('swiping-right');
                card.classList.remove('swiping-left', 'swiping-center');
            } else {
                card.classList.add('swiping-left');
                card.classList.remove('swiping-right', 'swiping-center');
            }
        } else {
            card.classList.add('swiping-center');
            card.classList.remove('swiping-right', 'swiping-left');
        }
    });
    
    card.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        
        card.classList.remove('swiping-right', 'swiping-left', 'swiping-center');
        
        // Only proceed if it's a clear horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 80) {
            if (deltaX > 0) {
                selectYesNoOption('yes');
            } else {
                selectYesNoOption('no');
            }
        }
        
        isDragging = false;
        isSwipingCard = false;
    });
}

function setupSemanticInteractions() {
    const bar = document.getElementById('semanticBar');
    const slider = document.getElementById('semanticSlider');
    let isDragging = false;
    let startX = 0;
    let sliderStartX = 0;
    
    function updateSliderPosition(x) {
        const barRect = bar.getBoundingClientRect();
        const relativeX = x - barRect.left;
        const maxX = barRect.width - 50; // 50 is slider width
        const clampedX = Math.max(10, Math.min(relativeX, maxX));
        
        slider.style.left = `${clampedX}px`;
        
        // Calculate value (1-5)
        const percent = (clampedX - 10) / (maxX - 10);
        const value = Math.round(percent * 4) + 1;
        
        return value;
    }
    
    bar.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        sliderStartX = parseInt(slider.style.left) || 10;
        e.preventDefault();
    });
    
    bar.addEventListener('touchstart', (e) => {
        isDragging = true;
        startX = e.touches[0].clientX;
        sliderStartX = parseInt(slider.style.left) || 10;
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const value = updateSliderPosition(e.clientX);
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const value = updateSliderPosition(e.touches[0].clientX);
        e.preventDefault();
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            const value = updateSliderPosition(startX);
            selectSemanticOption(value);
            isDragging = false;
        }
    });
    
    document.addEventListener('touchend', () => {
        if (isDragging) {
            const value = updateSliderPosition(startX);
            selectSemanticOption(value);
            isDragging = false;
        }
    });
    
    // Tap to set position
    bar.addEventListener('click', (e) => {
        const value = updateSliderPosition(e.clientX);
        selectSemanticOption(value);
    });
    
    bar.addEventListener('touchend', (e) => {
        const value = updateSliderPosition(e.changedTouches[0].clientX);
        selectSemanticOption(value);
    });
}

function resetLikertOptions() {
    document.querySelectorAll('.likert-option').forEach(opt => {
        opt.classList.remove('selected');
    });
}

function selectLikertOption(value) {
    const section = surveyConfig.sections[currentSectionIndex];
    const currentItem = section.items[currentItemIndex];
    
    responses.push({
        sectionId: section.id,
        sectionTitle: section.title,
        itemIndex: currentItemIndex,
        question: currentItem,
        value: parseInt(value),
        type: 'likert',
        timestamp: Date.now()
    });
    
    console.log(`Likert response: ${value} for "${currentItem}"`);
    
    setTimeout(() => {
        nextItem();
    }, 500);
}

function selectYesNoOption(value) {
    const section = surveyConfig.sections[currentSectionIndex];
    const currentItem = section.items[currentItemIndex];
    
    responses.push({
        sectionId: section.id,
        sectionTitle: section.title,
        itemIndex: currentItemIndex,
        question: currentItem,
        value: value,
        type: 'yesno',
        timestamp: Date.now()
    });
    
    console.log(`Yes/No response: ${value} for "${currentItem}"`);
    
    setTimeout(() => {
        nextItem();
    }, 500);
}

function selectSemanticOption(value) {
    const section = surveyConfig.sections[currentSectionIndex];
    const currentItem = section.items[currentItemIndex];
    
    responses.push({
        sectionId: section.id,
        sectionTitle: section.title,
        itemIndex: currentItemIndex,
        question: currentItem.question,
        value: value,
        type: 'semantic',
        timestamp: Date.now()
    });
    
    console.log(`Semantic response: ${value} for "${currentItem.question}"`);
    
    setTimeout(() => {
        nextItem();
    }, 500);
}

function nextItem() {
    const section = surveyConfig.sections[currentSectionIndex];
    
    if (currentItemIndex < section.items.length - 1) {
        currentItemIndex++;
        showCurrentCard();
        updateResponseInterface();
        updateProgress();
    } else {
        nextSection();
    }
}

function previousItem() {
    if (currentItemIndex > 0) {
        currentItemIndex--;
        showCurrentCard();
        updateResponseInterface();
        updateProgress();
    } else {
        previousSection();
    }
}

function nextSection() {
    if (currentSectionIndex < surveyConfig.sections.length - 1) {
        currentSectionIndex++;
        showSectionIntro();
    } else {
        showCompletion();
    }
}

function previousSection() {
    if (currentSectionIndex > 0) {
        currentSectionIndex--;
        showSectionIntro();
    }
}

function updateProgress() {
    const section = surveyConfig.sections[currentSectionIndex];
    currentSectionEl.textContent = currentSectionIndex + 1;
    currentItemEl.textContent = currentItemIndex + 1;
    totalItemsEl.textContent = section.items.length;
    
    // Calculate overall progress
    let totalItems = 0;
    let completedItems = 0;
    
    surveyConfig.sections.forEach((s, sIndex) => {
        totalItems += s.items.length;
        if (sIndex < currentSectionIndex) {
            completedItems += s.items.length;
        } else if (sIndex === currentSectionIndex) {
            completedItems += currentItemIndex;
        }
    });
    
    const progressPercent = (completedItems / totalItems) * 100;
    progressFillEl.style.width = `${progressPercent}%`;
}

function showCompletion() {
    const totalResponses = responses.length;
    const likertResponses = responses.filter(r => r.type === 'likert');
    const yesNoResponses = responses.filter(r => r.type === 'yesno');
    const semanticResponses = responses.filter(r => r.type === 'semantic');
    
    let avgLikert = 0;
    if (likertResponses.length > 0) {
        avgLikert = likertResponses.reduce((sum, r) => sum + r.value, 0) / likertResponses.length;
    }
    
    let avgSemantic = 0;
    if (semanticResponses.length > 0) {
        avgSemantic = semanticResponses.reduce((sum, r) => sum + r.value, 0) / semanticResponses.length;
    }
    
    const yesCount = yesNoResponses.filter(r => r.value === 'yes').length;
    const noCount = yesNoResponses.filter(r => r.value === 'no').length;
    
    contentContainerEl.innerHTML = `
        <div class="section-intro">
            <h2 class="section-title">Survey Complete!</h2>
            <p class="section-description">
                You responded to ${totalResponses} items across ${surveyConfig.sections.length} sections.
                <br><br>
                Average Likert score: ${avgLikert.toFixed(1)}/5
                <br>
                Average Semantic score: ${avgSemantic.toFixed(1)}/5
                <br>
                Yes/No ratio: ${yesCount} yes, ${noCount} no
            </p>
        </div>
    `;
    
    console.log('All responses:', responses);
}

// Swipe gestures for navigation
contentContainerEl.addEventListener('touchstart', (e) => {
    if (!isInSection) return;
    gesture.startY = e.touches[0].clientY;
});

contentContainerEl.addEventListener('touchmove', (e) => {
    if (!isInSection) return;
    const deltaY = e.touches[0].clientY - gesture.startY;
    
    if (Math.abs(deltaY) > 20) {
        const activeCard = document.querySelector('.item-card.active');
        if (activeCard) {
            if (deltaY > 0) {
                activeCard.classList.add('swiping-down');
                activeCard.classList.remove('swiping-up');
            } else {
                activeCard.classList.add('swiping-up');
                activeCard.classList.remove('swiping-down');
            }
        }
    }
});

contentContainerEl.addEventListener('touchend', (e) => {
    if (!isInSection) return;
    const deltaY = e.changedTouches[0].clientY - gesture.startY;
    
    const activeCard = document.querySelector('.item-card.active');
    if (activeCard) {
        activeCard.classList.remove('swiping-up', 'swiping-down');
    }
    
    if (Math.abs(deltaY) > 50) {
        if (deltaY > 0) {
            // Swipe down - go back
            previousItem();
        } else {
            // Swipe up - skip
            nextItem();
        }
    }
});

// Navigation
backBtn.addEventListener('click', () => {
    if (isInSection) {
        previousItem();
    } else {
        previousSection();
    }
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!isInSection) return;
    
    const section = surveyConfig.sections[currentSectionIndex];
    
    if (section.type === 'likert') {
        if (e.key >= '1' && e.key <= '5') {
            selectLikertOption(parseInt(e.key));
        }
    } else if (section.type === 'yesno') {
        if (e.key === 'y' || e.key === 'Y') {
            selectYesNoOption('yes');
        } else if (e.key === 'n' || e.key === 'N') {
            selectYesNoOption('no');
        }
    } else if (section.type === 'semantic') {
        if (e.key >= '1' && e.key <= '5') {
            selectSemanticOption(parseInt(e.key));
        }
    }
    
    if (e.key === 'ArrowLeft') {
        previousItem();
    } else if (e.key === 'ArrowRight') {
        nextItem();
    }
});

// Prevent page scrolling during interactions
document.addEventListener('touchmove', (e) => {
    if (e.target.closest('.likert-scale') || 
        e.target.closest('.yes-no-card') || 
        e.target.closest('.semantic-bar')) {
        e.preventDefault();
    }
}, { passive: false });

// Initialize
init();
