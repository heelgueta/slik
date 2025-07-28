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
const bottomAreaEl = document.getElementById('bottomArea');
const responseContainerEl = document.getElementById('responseContainer');

// State
let currentSectionIndex = 0;
let currentItemIndex = 0;
let isInSection = false;
let responses = [];
let gesture = { type: null, startY: null, currentY: null };
let isSliding = false;

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
    bottomAreaEl.style.display = 'none';
    
    isInSection = false;
}

function startSection() {
    const section = surveyConfig.sections[currentSectionIndex];
    currentItemIndex = 0;
    
    sectionIntroEl.style.display = 'none';
    bottomAreaEl.style.display = 'block';
    
    createCards(section);
    showCurrentCard();
    updateResponseInterface();
    
    isInSection = true;
    updateProgress();
}

function createCards(section) {
    cardsContainerEl.innerHTML = '';
    
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

function showCurrentCard() {
    const cards = document.querySelectorAll('.item-card');
    
    cards.forEach((card, index) => {
        card.classList.remove('active', 'previous', 'next');
        
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
    const currentItem = section.items[currentItemIndex];
    
    if (section.type === 'likert') {
        createLikertResponse();
    } else if (section.type === 'yesno') {
        createYesNoResponse();
    }
}

function createLikertResponse() {
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
    responseContainerEl.innerHTML = `
        <div class="response-instructions">Swipe left for NO, right for YES</div>
        <div class="yes-no-container" id="yesNoContainer">
            <button class="yes-no-btn no" data-value="no">NO</button>
            <button class="yes-no-btn yes" data-value="yes">YES</button>
        </div>
    `;
    
    setupYesNoInteractions();
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
    const container = document.getElementById('yesNoContainer');
    const yesBtn = container.querySelector('.yes');
    const noBtn = container.querySelector('.no');
    
    // Button clicks
    yesBtn.addEventListener('click', () => selectYesNoOption('yes'));
    noBtn.addEventListener('click', () => selectYesNoOption('no'));
    
    // Swipe gestures
    let startX = 0;
    let startY = 0;
    
    container.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    });
    
    container.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        
        // Check if it's a horizontal swipe (not vertical)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                selectYesNoOption('yes');
            } else {
                selectYesNoOption('no');
            }
        }
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
    
    let avgLikert = 0;
    if (likertResponses.length > 0) {
        avgLikert = likertResponses.reduce((sum, r) => sum + r.value, 0) / likertResponses.length;
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
            Yes/No ratio: ${yesCount} yes, ${noCount} no
        </p>
    `;
    
    sectionIntroEl.style.display = 'flex';
    bottomAreaEl.style.display = 'none';
    
    console.log('All responses:', responses);
}

// Middle area swipe gestures
cardsContainerEl.addEventListener('touchstart', (e) => {
    if (!isInSection) return;
    gesture.startY = e.touches[0].clientY;
});

cardsContainerEl.addEventListener('touchend', (e) => {
    if (!isInSection) return;
    const deltaY = e.changedTouches[0].clientY - gesture.startY;
    
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
    }
    
    if (e.key === 'ArrowLeft') {
        previousItem();
    } else if (e.key === 'ArrowRight') {
        nextItem();
    }
});

// Prevent page scrolling during interactions
document.addEventListener('touchmove', (e) => {
    if (e.target.closest('.likert-scale') || e.target.closest('.yes-no-container')) {
        e.preventDefault();
    }
}, { passive: false });

// Initialize
init();
