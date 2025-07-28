// Attitude items for statistics
const attitudeItems = [
    "I enjoy learning about statistics",
    "Statistical analysis is fascinating to me",
    "I find data visualization appealing",
    "Probability concepts are intuitive",
    "I like working with numbers and data",
    "Statistical software is user-friendly",
    "I feel confident interpreting charts",
    "Data-driven decisions are important",
    "I understand correlation vs causation",
    "Statistical significance makes sense",
    "I enjoy hypothesis testing",
    "Regression analysis is clear to me",
    "I can spot misleading statistics",
    "Confidence intervals are intuitive",
    "I like exploring datasets"
];

// DOM elements
const scale = document.getElementById('likertScale');
const options = document.querySelectorAll('.likert-option');
const backBtn = document.getElementById('backBtn');
const questionEl = document.getElementById('question');
const currentItemEl = document.getElementById('currentItem');
const totalItemsEl = document.getElementById('totalItems');
const responseTextEl = document.getElementById('responseText');
const responseIndicatorEl = document.getElementById('responseIndicator');
const questionNumberEl = document.querySelector('.question-number');

// State
let currentItemIndex = 0;
let selectedValue = null;
let responseStart = Date.now();
let gesture = { type: null, startX: null, currentX: null };
let responses = [];

// Response text mappings
const responseTexts = {
    1: "Strongly Disagree",
    2: "Disagree", 
    3: "Neutral",
    4: "Agree",
    5: "Strongly Agree"
};

// Initialize
function init() {
    totalItemsEl.textContent = attitudeItems.length;
    updateQuestion();
    updateProgress();
}

function updateQuestion() {
    questionEl.textContent = attitudeItems[currentItemIndex];
    questionNumberEl.textContent = `#${currentItemIndex + 1}`;
    resetOptions();
    selectedValue = null;
    responseStart = Date.now();
    updateResponseDisplay();
}

function updateProgress() {
    currentItemEl.textContent = currentItemIndex + 1;
}

function updateResponseDisplay() {
    if (selectedValue) {
        responseTextEl.textContent = responseTexts[selectedValue];
        responseTextEl.style.fontSize = `${1.1 + (selectedValue - 1) * 0.1}em`;
        responseIndicatorEl.style.setProperty('--progress', `${(selectedValue - 1) * 25}%`);
    } else {
        responseTextEl.textContent = "Tap or slide to respond";
        responseTextEl.style.fontSize = "1.1em";
        responseIndicatorEl.style.setProperty('--progress', '0%');
    }
}

function resetOptions() {
    options.forEach(opt => opt.classList.remove('selected'));
}

function selectOption(value, method) {
    resetOptions();
    const opt = [...options].find(o => o.dataset.value === value.toString());
    if (opt) {
        opt.classList.add('selected');
        selectedValue = value;
        updateResponseDisplay();
        
        const duration = Date.now() - responseStart;
        console.log(`Selected: ${value}, via ${method}, time: ${duration}ms`);
        
        // Store response
        responses.push({
            itemIndex: currentItemIndex,
            question: attitudeItems[currentItemIndex],
            value: value,
            method: method,
            duration: duration,
            timestamp: Date.now()
        });
        
        // Auto-advance after a short delay
        setTimeout(() => {
            nextItem();
        }, 800);
    }
}

function nextItem() {
    if (currentItemIndex < attitudeItems.length - 1) {
        currentItemIndex++;
        updateQuestion();
        updateProgress();
    } else {
        // Completed all items
        showCompletion();
    }
}

function previousItem() {
    if (currentItemIndex > 0) {
        currentItemIndex--;
        updateQuestion();
        updateProgress();
        
        // Restore previous response if exists
        const prevResponse = responses.find(r => r.itemIndex === currentItemIndex);
        if (prevResponse) {
            selectedValue = prevResponse.value;
            selectOption(prevResponse.value, 'restored');
        }
    }
}

function showCompletion() {
    const avgResponse = responses.reduce((sum, r) => sum + r.value, 0) / responses.length;
    questionEl.textContent = "Survey Complete!";
    questionNumberEl.textContent = `Average: ${avgResponse.toFixed(1)}/5`;
    responseTextEl.textContent = `You responded to ${responses.length} items`;
    
    // Hide scale
    document.querySelector('.scale-container').style.display = 'none';
    
    console.log('All responses:', responses);
}

// Tapping
options.forEach(opt => {
    opt.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectOption(opt.dataset.value, 'tap');
    });
});

// Sliding with improved mobile handling
let isSliding = false;

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
        resetOptions();
        options[index].classList.add('selected');
        selectedValue = parseInt(options[index].dataset.value);
        updateResponseDisplay();
    }
});

scale.addEventListener('touchend', (e) => {
    if (isSliding && gesture.type === 'slide' && selectedValue) {
        selectOption(selectedValue, 'slide');
    }
    isSliding = false;
    gesture.type = null;
});

// Mouse events for desktop testing
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
        resetOptions();
        options[index].classList.add('selected');
        selectedValue = parseInt(options[index].dataset.value);
        updateResponseDisplay();
    }
});

document.addEventListener('mouseup', () => {
    if (isSliding && gesture.type === 'slide' && selectedValue) {
        selectOption(selectedValue, 'slide');
    }
    isSliding = false;
    gesture.type = null;
});

// Navigation
backBtn.addEventListener('click', () => {
    previousItem();
});

// Keyboard navigation for accessibility
document.addEventListener('keydown', (e) => {
    if (e.key >= '1' && e.key <= '5') {
        selectOption(parseInt(e.key), 'keyboard');
    } else if (e.key === 'ArrowLeft') {
        previousItem();
    } else if (e.key === 'ArrowRight') {
        nextItem();
    }
});

// Prevent page scrolling during interactions
document.addEventListener('touchmove', (e) => {
    if (e.target.closest('.likert-scale')) {
        e.preventDefault();
    }
}, { passive: false });

// Initialize the app
init();
