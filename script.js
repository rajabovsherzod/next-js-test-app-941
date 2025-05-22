// Variables
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let timerInterval;
let seconds = 0;

// DOM Elements
const loadingEl = document.getElementById('loading');
const testContainerEl = document.getElementById('test-container');
const resultsContainerEl = document.getElementById('results-container');
const currentQuestionEl = document.getElementById('current-question');
const totalQuestionsEl = document.getElementById('total-questions');
const questionTextEl = document.getElementById('question-text');
const optionsContainerEl = document.getElementById('options-container');
const prevBtnEl = document.getElementById('prev-btn');
const nextBtnEl = document.getElementById('next-btn');
const finishBtnEl = document.getElementById('finish-btn');
const timerEl = document.getElementById('timer');
const restartBtnEl = document.getElementById('restart-btn');

// Results elements
const totalStatEl = document.getElementById('total-stat');
const answeredStatEl = document.getElementById('answered-stat');
const correctStatEl = document.getElementById('correct-stat');
const percentageStatEl = document.getElementById('percentage-stat');
const resultsQuestionsEl = document.getElementById('results-questions');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadExcelFile();
});

// Set up event listeners
function setupEventListeners() {
    prevBtnEl.addEventListener('click', showPreviousQuestion);
    nextBtnEl.addEventListener('click', showNextQuestion);
    finishBtnEl.addEventListener('click', showResults);
    restartBtnEl.addEventListener('click', restartTest);
}

// Load Excel file automatically
async function loadExcelFile() {
    try {
        // Path to Excel file
        const excelUrl = '../testfolder/Pedagogika Psixologiya yakuniy savollar bazasi.xlsx';
        
        // Fetch the Excel file
        const response = await fetch(excelUrl);
        const data = await response.arrayBuffer();
        
        // Process the Excel data
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });
        
        // Process data
        processExcelData(jsonData);
        
        // Show test if questions loaded
        if (questions.length > 0) {
            loadingEl.classList.add('hidden');
            testContainerEl.classList.remove('hidden');
            
            totalQuestionsEl.textContent = questions.length;
            startTimer();
            showQuestion(0);
        } else {
            loadingEl.textContent = 'Savollar topilmadi';
        }
    } catch (error) {
        console.error('Error loading Excel file:', error);
        loadingEl.textContent = 'Faylni yuklashda xatolik yuz berdi: ' + error.message;
    }
}

// Process Excel data
function processExcelData(jsonData) {
    questions = [];
    
    // Skip header row
    for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        // Skip empty rows
        if (!row.B) continue;
        
        // Get answer options
        const options = {
            A: row.C || '',
            B: row.D || '',
            C: row.E || '',
            D: row.F || ''
        };
        
        // Get correct answer text
        const correctAnswerText = row.G || '';
        
        // Find which option matches the correct answer text
        let correctOption = null;
        for (const [key, text] of Object.entries(options)) {
            if (text && correctAnswerText && text.trim() === correctAnswerText.trim()) {
                correctOption = key;
                break;
            }
        }
        
        // If no match found, use the first option as fallback
        if (!correctOption && options.A) {
            correctOption = 'A';
            console.warn(`Warning: No matching option found for answer '${correctAnswerText}' in question ${row.A}`);
        }
        
        // Add question to list
        questions.push({
            number: row.A,
            text: row.B,
            options: options,
            correct_answer: correctOption,
            correct_text: correctAnswerText
        });
    }
}

// Show question at specified index
function showQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    
    currentQuestionIndex = index;
    const question = questions[index];
    
    // Update UI
    currentQuestionEl.textContent = index + 1;
    questionTextEl.textContent = question.text;
    
    // Generate options
    optionsContainerEl.innerHTML = '';
    for (const [key, text] of Object.entries(question.options)) {
        if (!text) continue; // Skip empty options
        
        const optionEl = document.createElement('div');
        optionEl.className = 'option-item border-2 border-gray-200 p-2 rounded-lg';
        optionEl.dataset.key = key;
        
        // Check if this option was previously selected
        if (userAnswers[index] === key) {
            optionEl.classList.add('selected');
            
            // Show if the answer is correct or incorrect immediately
            if (key === question.correct_answer) {
                optionEl.classList.add('correct');
            } else {
                optionEl.classList.add('incorrect');
                
                // Find and mark the correct answer
                setTimeout(() => {
                    const correctEl = document.querySelector(`.option-item[data-key="${question.correct_answer}"]`);
                    if (correctEl) {
                        correctEl.classList.add('correct');
                    }
                }, 100);
            }
        }
        
        optionEl.innerHTML = `
            <span class="inline-block w-6 h-6 bg-gray-200 rounded-full text-center leading-6 mr-2 font-bold text-sm">${key}</span>
            <span class="align-middle text-sm">${text}</span>
        `;
        
        optionEl.addEventListener('click', () => selectOption(key));
        optionsContainerEl.appendChild(optionEl);
    }
    
    // Update navigation buttons
    prevBtnEl.disabled = index === 0;
    
    if (index === questions.length - 1) {
        nextBtnEl.classList.add('hidden');
        finishBtnEl.classList.remove('hidden');
    } else {
        nextBtnEl.classList.remove('hidden');
        finishBtnEl.classList.add('hidden');
    }
}

// Select an option for the current question
function selectOption(key) {
    userAnswers[currentQuestionIndex] = key;
    
    // Clear all selected options
    const options = document.querySelectorAll('.option-item');
    options.forEach(opt => {
        opt.classList.remove('selected', 'correct', 'incorrect');
    });
    
    // Mark selected option
    const selectedOption = document.querySelector(`.option-item[data-key="${key}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
        
        // Show if the answer is correct or incorrect
        const correctKey = questions[currentQuestionIndex].correct_answer;
        if (key === correctKey) {
            selectedOption.classList.add('correct');
        } else {
            selectedOption.classList.add('incorrect');
            
            // Find and mark the correct answer
            const correctOption = document.querySelector(`.option-item[data-key="${correctKey}"]`);
            if (correctOption) {
                correctOption.classList.add('correct');
            }
        }
        
        // Automatically move to next question after a short delay
        if (currentQuestionIndex < questions.length - 1) {
            setTimeout(() => {
                showNextQuestion();
            }, 1000);
        }
    }
}

// Show previous question
function showPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        showQuestion(currentQuestionIndex - 1);
    }
}

// Show next question
function showNextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        showQuestion(currentQuestionIndex + 1);
    }
}

// Show test results
function showResults() {
    // Calculate results
    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(userAnswers).length;
    let correctAnswers = 0;
    
    for (const [index, answer] of Object.entries(userAnswers)) {
        if (answer === questions[index].correct_answer) {
            correctAnswers++;
        }
    }
    
    const percentage = answeredQuestions > 0 
        ? Math.round((correctAnswers / answeredQuestions) * 100) 
        : 0;
    
    // Update stats
    totalStatEl.textContent = totalQuestions;
    answeredStatEl.textContent = answeredQuestions;
    correctStatEl.textContent = correctAnswers;
    percentageStatEl.textContent = `${percentage}%`;
    
    // Generate question results
    resultsQuestionsEl.innerHTML = '';
    questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === question.correct_answer;
        
        const resultItem = document.createElement('div');
        resultItem.className = 'bg-gray-100 p-3 rounded-lg mb-2 text-sm';
        
        const resultQuestion = document.createElement('div');
        resultQuestion.className = 'font-bold mb-2';
        resultQuestion.textContent = `${index + 1}. ${question.text}`;
        
        resultItem.appendChild(resultQuestion);
        
        if (userAnswer) {
            const resultAnswer = document.createElement('div');
            resultAnswer.className = isCorrect ? 'text-success' : 'text-error';
            
            if (isCorrect) {
                resultAnswer.textContent = `Sizning javobingiz: ${userAnswer}. ${question.options[userAnswer]} ✓`;
            } else {
                resultAnswer.textContent = `Sizning javobingiz: ${userAnswer}. ${question.options[userAnswer]} ✗`;
                
                const correctAnswer = document.createElement('div');
                correctAnswer.className = 'text-success';
                correctAnswer.textContent = `To'g'ri javob: ${question.correct_answer}. ${question.options[question.correct_answer]}`;
                resultItem.appendChild(correctAnswer);
            }
            
            resultItem.appendChild(resultAnswer);
        } else {
            const resultAnswer = document.createElement('div');
            resultAnswer.className = 'text-gray-500';
            resultAnswer.textContent = 'Javob berilmagan';
            resultItem.appendChild(resultAnswer);
        }
        
        resultsQuestionsEl.appendChild(resultItem);
    });
    
    // Show results container
    testContainerEl.classList.add('hidden');
    resultsContainerEl.classList.remove('hidden');
    
    // Stop timer
    clearInterval(timerInterval);
}

// Restart test
function restartTest() {
    currentQuestionIndex = 0;
    userAnswers = {};
    seconds = 0;
    updateTimer();
    
    resultsContainerEl.classList.add('hidden');
    testContainerEl.classList.remove('hidden');
    
    showQuestion(0);
    startTimer();
}

// Start timer
function startTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    updateTimer();
    
    timerInterval = setInterval(() => {
        seconds++;
        updateTimer();
    }, 1000);
}

// Update timer display
function updateTimer() {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
