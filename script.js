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
const menuBtn = document.getElementById('menuBtn');
const currentSectionEl = document.getElementById('currentSection');
const totalSectionsEl = document.getElementById('totalSections');
const currentItemEl = document.getElementById('currentItem');
const totalItemsEl = document.getElementById('totalItems');
const progressFillEl = document.getElementById('progressFill');
const sectionIntroEl = document.getElementById('sectionIntro');
const sectionTitleEl = document.getElementById('sectionTitle');
const sectionDescriptionEl = document.getElementById('sectionDescription');
const startSectionBtn = document.getElementById('startSectionBtn');
const cardsContainerEl = document.getElementById('cardsContainer');
const cardNavEl = document.getElementById('cardNav');
const prevCardBtn = document.getElementById('prevCardBtn');
const nextCardBtn = document.getElementById('nextCardBtn');
const bottomAreaEl = document.getElementById('bottomArea');
const responseContainerEl = document.getElementById('responseContainer');

// State
let currentSectionIndex = 0;
let currentItemIndex = 0;
let isInSection = false;
let responses = [];
let gesture = { type: null, startY: null, currentY: null, startX: null, currentX: null };
let isSliding = false;
let isSwipingCard = false;

// Initialize
function init() {
    totalSectionsEl.textContent = surveyConfig.sections.length;
    showSectionIntro();
    updateProgress();
}

function showSectionIntro() {
    const section = surveyConfig.sections[currentSectionIndex];
    sectionTitleEl.textContent = section.title;
    sectionDescriptionEl.textContent = section.description;
    
    sectionIntroEl.style.display = 'flex';
    cardsContainerEl.innerHTML = '';
    cardNavEl.style.display = 'none';
    bottomAreaEl.style.display = 'none';
    
    isInSection = false;
}

function startSection() {
    const section = surveyConfig.sections[currentSectionIndex];
    currentItemIndex = 0;
    
    sectionIntroEl.style.display = 'none';
    cardNavEl.style.display = 'flex';
    bottomAreaEl.style.display = 'block';
    
    createCards(section);
    showCurrentCard();
    updateResponseInterface();
    updateCardNav();
    
    isInSection = true;
    updateProgress();
}

function createCards(section) {
    cardsContainerEl.innerHTML = '';
    
    if (section.type === 'semantic') {
        section.items.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.dataset.index = index;
            
            card.innerHTML = `
                <div class="item-number">Item ${index + 1}</div>
                <div class="item-question">${item.question}</div>
            `;
            
            cardsContainerEl.appendChild(card);
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
            
            cardsContainerEl.appendChild(card);
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

function updateCardNav() {
    const section = surveyConfig.sections[currentSectionIndex];
    
    prevCardBtn.disabled = currentItemIndex === 0;
    nextCardBtn.disabled = currentItemIndex === section.items.length - 1;
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
    
    responseContainerEl.innerHTML = `
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
    
    setupLikertInteractions();
}

function createYesNoResponse() {
    const section = surveyConfig.sections[currentSectionIndex];
    const currentItem = section.items[currentItemIndex];
    
    responseContainerEl.innerHTML = `
        <div class="yes-no-card" id="yesNoCard">
            <div class="yes-no-question">${currentItem}</div>
            <div class="yes-no-buttons">
                <button class="yes-no-btn no" data-value="no">NO</button>
                <button class="yes-no-btn yes" data-value="yes">YES</button>
            </div>
        </div>
    `;
    
    setupYesNoInteractions();
}

function createSemanticResponse() {
    const section = surveyConfig.sections[currentSectionIndex];
    const currentItem = section.items[currentItemIndex];
    
    responseContainerEl.innerHTML = `
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
    
    // Swipe gestures
    let startX = 0;
    let startY = 0;
    
    card.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwipingCard = true;
    });
    
    card.addEventListener('touchmove', (e) => {
        if (!isSwipingCard) return;
        e.preventDefault();
        
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - startX;
        
        if (Math.abs(deltaX) > 20) {
            if (deltaX > 0) {
                card.classList.add('swiping-right');
                card.classList.remove('swiping-left');
            } else {
                card.classList.add('swiping-left');
                card.classList.remove('swiping-right');
            }
        }
    });
    
    card.addEventListener('touchend', (e) => {
        if (!isSwipingCard) return;
        
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        
        card.classList.remove('swiping-right', 'swiping-left');
        
        // Check if it's a horizontal swipe (not vertical)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                selectYesNoOption('yes');
            } else {
                selectYesNoOption('no');
            }
        }
        
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
        updateCardNav();
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
        updateCardNav();
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
    
    sectionIntroEl.innerHTML = `
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
    `;
    
    sectionIntroEl.style.display = 'flex';
    cardNavEl.style.display = 'none';
    bottomAreaEl.style.display = 'none';
    
    console.log('All responses:', responses);
}

// Middle area swipe gestures with animations
cardsContainerEl.addEventListener('touchstart', (e) => {
    if (!isInSection) return;
    gesture.startY = e.touches[0].clientY;
});

cardsContainerEl.addEventListener('touchmove', (e) => {
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

cardsContainerEl.addEventListener('touchend', (e) => {
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

prevCardBtn.addEventListener('click', () => {
    if (isInSection) {
        previousItem();
    }
});

nextCardBtn.addEventListener('click', () => {
    if (isInSection) {
        nextItem();
    }
});

startSectionBtn.addEventListener('click', startSection);

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
