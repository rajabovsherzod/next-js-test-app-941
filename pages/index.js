import { useState, useEffect } from 'react';
import Head from 'next/head';
import * as XLSX from 'xlsx';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [seconds, setSeconds] = useState(0);
  const [showResults, setShowResults] = useState(false);
  
  // Load Excel file on component mount
  useEffect(() => {
    async function loadExcelFile() {
      try {
        // Use fetch to get the Excel file from the public folder
        const response = await fetch('/Pedagogika Psixologiya yakuniy savollar bazasi.xlsx');
        const data = await response.arrayBuffer();
        
        // Process the Excel data
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });
        
        // Process data
        const processedQuestions = processExcelData(jsonData);
        setQuestions(processedQuestions);
        setLoading(false);
      } catch (error) {
        console.error('Error loading Excel file:', error);
        setLoading(false);
      }
    }
    
    loadExcelFile();
    
    // Start timer
    const timer = setInterval(() => {
      setSeconds(prevSeconds => prevSeconds + 1);
    }, 1000);
    
    // Clean up on component unmount
    return () => clearInterval(timer);
  }, []);
  
  // Process Excel data
  function processExcelData(jsonData) {
    const processedQuestions = [];
    
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
      processedQuestions.push({
        number: row.A,
        text: row.B,
        options: options,
        correct_answer: correctOption,
        correct_text: correctAnswerText
      });
    }
    
    return processedQuestions;
  }
  
  // Select option handler
  const selectOption = (key) => {
    // Store user's answer
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: key
    }));
    
    // No auto-advance - user must use Next button
  };
  
  // Navigate to previous question
  const showPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  // Navigate to next question
  const showNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  // Format timer display
  const formatTime = () => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Show results
  const handleShowResults = () => {
    setShowResults(true);
  };
  
  // Restart test
  const restartTest = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setSeconds(0);
    setShowResults(false);
  };
  
  // Calculate results stats
  const calculateStats = () => {
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
    
    return {
      totalQuestions,
      answeredQuestions,
      correctAnswers,
      percentage
    };
  };
  
  // Get current question
  const currentQuestion = questions[currentQuestionIndex];
  
  // Results stats
  const stats = showResults ? calculateStats() : null;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Test Platformasi</title>
        <meta name="description" content="Pedagogika Psixologiya Test Platformasi" />
      </Head>
      
      <header className="header text-white text-center">
        <div className="container mx-auto">
          <h1 className="header-title">Test Platformasi</h1>
          <p>Pedagogika Psixologiya yakuniy savollar</p>
        </div>
      </header>
      
      <div className="container mx-auto max-w-5xl px-3 flex-1">
        {loading ? (
          <div className="flex justify-center items-center py-12 text-lg text-primary">
            Savolllar yuklanmoqda...
          </div>
        ) : showResults ? (
          <div className="question-card">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold mb-1">Test natijalari</h2>
              <p className="text-gray-600 text-sm">Siz testni muvaffaqiyatli yakunladingiz</p>
            </div>
            
            <div className="stats-card mb-4">
              <div className="stat-item">
                <div className="stat-value">{stats.totalQuestions}</div>
                <div className="stat-label">Jami savollar</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.answeredQuestions}</div>
                <div className="stat-label">Javob berilgan</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.correctAnswers}</div>
                <div className="stat-label">To'g'ri javoblar</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{stats.percentage}%</div>
                <div className="stat-label">Natija</div>
              </div>
            </div>
            
            <div className="flex justify-center mb-4">
              <button 
                onClick={restartTest}
                className="btn btn-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Testni qaytadan boshlash
              </button>
            </div>
            
            <div className="mt-8">
              {questions.map((question, index) => {
                const userAnswer = userAnswers[index];
                const isCorrect = userAnswer === question.correct_answer;
                
                return (
                  <div key={index} className="bg-gray-100 p-3 rounded-lg mb-2 text-sm">
                    <div className="font-bold mb-2">
                      {index + 1}. {question.text}
                    </div>
                    
                    {userAnswer ? (
                      <>
                        <div className={isCorrect ? "text-success" : "text-error"}>
                          Sizning javobingiz: {userAnswer}. {question.options[userAnswer]} {isCorrect ? "✓" : "✗"}
                        </div>
                        
                        {!isCorrect && (
                          <div className="text-success">
                            To'g'ri javob: {question.correct_answer}. {question.options[question.correct_answer]}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-gray-500">
                        Javob berilmagan
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-md">
              <div className="text-lg font-medium flex items-center">
                <span className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center mr-2">
                  {currentQuestionIndex + 1}
                </span>
                <span className="text-gray-700">/ {questions.length}</span>
              </div>
              <div className="text-lg font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-primary font-bold">{formatTime()}</span>
              </div>
            </div>
            
            {currentQuestion && (
              <div className="question-card">
                <div className="text-lg mb-4 leading-relaxed font-medium text-gray-800">{currentQuestion.text}</div>
                
                <div className="flex flex-col gap-3">
                  {Object.entries(currentQuestion.options).map(([key, text]) => {
                    if (!text) return null;
                    
                    const userAnswer = userAnswers[currentQuestionIndex];
                    const isSelected = userAnswer === key;
                    const isCorrect = key === currentQuestion.correct_answer;
                    const isIncorrect = isSelected && !isCorrect;
                    const showCorrect = userAnswer && isCorrect;
                    
                    let className = "option-item border-2 border-gray-200";
                    if (isSelected) className += " selected";
                    if (showCorrect) className += " correct";
                    if (isIncorrect) className += " incorrect";
                    
                    return (
                      <div 
                        key={key}
                        className={className}
                        onClick={() => !userAnswers[currentQuestionIndex] && selectOption(key)}
                      >
                        <span className="option-marker">
                          {key}
                        </span>
                        <span className="option-text text-base">{text}</span>
                        {showCorrect && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-auto text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {isIncorrect && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-auto text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="navigation-buttons">
              <button 
                onClick={showPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="btn btn-primary disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Oldingi
              </button>
              
              {currentQuestionIndex === questions.length - 1 ? (
                <button 
                  onClick={handleShowResults}
                  className="btn btn-primary"
                >
                  Testni yakunlash
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </button>
              ) : (
                <button 
                  onClick={showNextQuestion}
                  className="btn btn-primary"
                >
                  Keyingi
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      <footer className="footer text-white text-center mt-auto">
        <div className="container mx-auto">
          <div className="flex justify-center items-center">
            <span className="text-sm">&copy; 2025 Test Platformasi</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
