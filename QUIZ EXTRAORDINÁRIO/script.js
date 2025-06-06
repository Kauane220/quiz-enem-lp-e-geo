document.addEventListener('DOMContentLoaded', () => {
    // Seleção de todos os elementos HTML pelo seus IDs
    const startScreen = document.getElementById('start-screen');
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const restartQuizBtn = document.getElementById('restart-quiz-btn');
    const questionCountSpan = document.getElementById('question-count');
    const scoreSpan = document.getElementById('score');
    const questionAreaSpan = document.getElementById('question-area');
    const questionLevelSpan = document.getElementById('question-level');
    const questionTextP = document.getElementById('question-text');
    const questionBaseTextP = document.getElementById('question-base-text');
    const optionsContainerDiv = document.getElementById('options-container');
    const prevQuestionBtn = document.getElementById('prev-question-btn');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const finishQuizBtn = document.getElementById('finish-quiz-btn');
    const feedbackDiv = document.getElementById('feedback');
    const finalScoreSpan = document.getElementById('final-score');
    const totalQuestionsSpan = document.getElementById('total-questions');
    const percentageScoreP = document.getElementById('percentage-score');
    const incorrectListUl = document.getElementById('incorrect-list');

    // Elementos de seleção de área e nível
    const areaSelect = document.getElementById('area-select');
    const levelSelect = document.getElementById('level-select');


    // Variáveis de estado do quiz
    let allQuestions = []; // Armazena todas as questões carregadas do JSON
    let filteredQuestions = []; // Armazena as questões após filtragem por área e nível
    let currentQuestionIndex = 0;
    let score = 0;
    let userAnswers = [];
    let questionsAnswered = new Set();
    let incorrectAnswers = [];

    // --- Funções para Gerenciamento de Telas ---
    // Esta função garante que apenas a tela desejada seja visível
    function showScreen(screenToShow) {
        // Oculta todas as telas primeiro
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        // Depois, exibe apenas a tela que foi passada como argumento
        screenToShow.classList.add('active');
    }

    // --- Carregar Questões do JSON ---
    async function loadQuestions() {
        try {
            const response = await fetch('questions.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allQuestions = await response.json();
            if (allQuestions.length === 0) {
                console.error("Nenhuma questão encontrada no arquivo questions.json. O quiz não pode ser iniciado.");
                alert('Não foi possível carregar as questões do quiz. O arquivo está vazio ou com formato inválido.');
                return;
            }
            // Após carregar, sempre garante que a tela inicial seja exibida
            showScreen(startScreen);
        } catch (error) {
            console.error('Erro ao carregar as questões:', error);
            alert('Não foi possível carregar as questões do quiz. Por favor, verifique o arquivo questions.json e o console.');
        }
    }

    // --- Filtrar Questões com base na seleção do usuário ---
    function filterQuestions() {
        const selectedArea = areaSelect.value;
        const selectedLevel = levelSelect.value;

        filteredQuestions = allQuestions.filter(question => {
            const matchesArea = (selectedArea === 'all' || question.area === selectedArea);
            const matchesLevel = (selectedLevel === 'all' || question.nivel === selectedLevel);
            return matchesArea && matchesLevel;
        });

        if (filteredQuestions.length === 0) {
            alert('Não há questões disponíveis para a área e nível selecionados. Por favor, escolha outras opções.');
            return false;
        }
        return true;
    }

    // --- Inicializar (ou Reiniciar) Quiz com questões filtradas ---
    function initializeQuiz() {
        currentQuestionIndex = 0;
        score = 0;
        userAnswers = new Array(filteredQuestions.length).fill(null);
        questionsAnswered.clear();
        incorrectAnswers = [];
        scoreSpan.textContent = `Pontuação: ${score}`;
        updateQuestionCount();
        showScreen(quizScreen); // Vai direto para a tela do quiz
        displayQuestion();
    }

    // --- Exibir Questão Atual ---
    function displayQuestion() {
        const question = filteredQuestions[currentQuestionIndex];
        if (!question) {
            console.error("Questão não encontrada para o índice:", currentQuestionIndex);
            return;
        }

        questionAreaSpan.textContent = `Área: ${question.area}`;
        questionLevelSpan.textContent = `Nível: ${question.nivel}`;
        questionTextP.textContent = question.pergunta;

        if (question.textoBase) {
            questionBaseTextP.textContent = question.textoBase;
            questionBaseTextP.style.display = 'block';
        } else {
            questionBaseTextP.textContent = '';
            questionBaseTextP.style.display = 'none';
        }

        optionsContainerDiv.innerHTML = '';
        question.opcoes.forEach((option, index) => {
            const button = document.createElement('button');
            button.classList.add('option-btn');
            button.textContent = option;
            button.dataset.option = option;
            button.addEventListener('click', () => selectOption(button, option));
            optionsContainerDiv.appendChild(button);
        });

        restoreUserSelection();
        updateNavigationButtons();
        feedbackDiv.textContent = '';
        feedbackDiv.className = 'feedback';
    }

    // --- Selecionar Opção ---
    function selectOption(selectedButton, selectedAnswer) {
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('selected', 'correct', 'incorrect');
            btn.disabled = false;
        });
        feedbackDiv.textContent = '';
        feedbackDiv.className = 'feedback';

        selectedButton.classList.add('selected');

        userAnswers[currentQuestionIndex] = selectedAnswer;
        questionsAnswered.add(currentQuestionIndex);
        
        updateNavigationButtons();
    }

    // --- Restaurar Seleção do Usuário ---
    function restoreUserSelection() {
        const userAnswer = userAnswers[currentQuestionIndex];
        const question = filteredQuestions[currentQuestionIndex];

        if (userAnswer !== null) {
            document.querySelectorAll('.option-btn').forEach(btn => {
                btn.disabled = true;
                if (btn.dataset.option === userAnswer) {
                    btn.classList.add('selected');
                }
                if (questionsAnswered.has(currentQuestionIndex)) {
                     if (btn.dataset.option === question.respostaCorreta) {
                         btn.classList.add('correct');
                     } else if (btn.dataset.option === userAnswer && userAnswer !== question.respostaCorreta) {
                         btn.classList.add('incorrect');
                     }
                     checkAnswer(userAnswer, question.respostaCorreta, false);
                }
            });
        } else {
            document.querySelectorAll('.option-btn').forEach(btn => {
                btn.disabled = false;
            });
        }
    }

    // --- Verificar Resposta ---
    function checkAnswer(selectedAnswer, correctAnswer, updateScoreFlag = true) {
        if (selectedAnswer === correctAnswer) {
            feedbackDiv.textContent = 'Correto!';
            feedbackDiv.classList.add('correct');
            if (updateScoreFlag) {
                score++;
                scoreSpan.textContent = `Pontuação: ${score}`;
            }
        } else {
            feedbackDiv.textContent = `Incorreto. A resposta correta era: ${correctAnswer}`;
            feedbackDiv.classList.add('incorrect');
            if (updateScoreFlag) {
                const exists = incorrectAnswers.some(item => item.question === filteredQuestions[currentQuestionIndex].pergunta);
                if (!exists) {
                    incorrectAnswers.push({
                        question: filteredQuestions[currentQuestionIndex].pergunta,
                        yourAnswer: selectedAnswer,
                        correctAnswer: correctAnswer
                    });
                }
            }
        }
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.disabled = true;
            if (btn.dataset.option === correctAnswer) {
                btn.classList.add('correct');
            } else if (btn.dataset.option === selectedAnswer && selectedAnswer !== correctAnswer) {
                btn.classList.add('incorrect');
            }
        });
        questionsAnswered.add(currentQuestionIndex);
    }

    // --- Navegação ---
    function updateQuestionCount() {
        questionCountSpan.textContent = `Questão: ${currentQuestionIndex + 1}/${filteredQuestions.length}`;
    }

    function updateNavigationButtons() {
        prevQuestionBtn.disabled = currentQuestionIndex === 0;
        nextQuestionBtn.disabled = userAnswers[currentQuestionIndex] === null;

        if (currentQuestionIndex === filteredQuestions.length - 1) {
            nextQuestionBtn.style.display = 'none';
            finishQuizBtn.style.display = 'block';
            finishQuizBtn.disabled = userAnswers[currentQuestionIndex] === null;
        } else {
            nextQuestionBtn.style.display = 'block';
            finishQuizBtn.style.display = 'none';
        }
    }

    function goToNextQuestion() {
        if (userAnswers[currentQuestionIndex] !== null) {
            if (!questionsAnswered.has(currentQuestionIndex)) {
                 checkAnswer(userAnswers[currentQuestionIndex], filteredQuestions[currentQuestionIndex].respostaCorreta);
            }
            currentQuestionIndex++;
            if (currentQuestionIndex < filteredQuestions.length) {
                displayQuestion();
                updateQuestionCount();
            }
        }
    }

    function goToPrevQuestion() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion();
            updateQuestionCount();
        }
    }

    // --- Finalizar Quiz e Exibir Resultados ---
    function finalizeQuiz() {
        // Garante que a última questão seja verificada e pontuada se ainda não foi
        if (userAnswers[currentQuestionIndex] !== null && !questionsAnswered.has(currentQuestionIndex)) {
            checkAnswer(userAnswers[currentQuestionIndex], filteredQuestions[currentQuestionIndex].respostaCorreta);
        }

        finalScoreSpan.textContent = score;
        totalQuestionsSpan.textContent = filteredQuestions.length;
        const percentage = (score / filteredQuestions.length) * 100;
        percentageScoreP.textContent = `Você acertou ${percentage.toFixed(2)}% das questões.`;

        incorrectListUl.innerHTML = '';
        if (incorrectAnswers.length > 0) {
            incorrectAnswers.forEach((item, index) => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${item.question}</strong><br>
                                Sua resposta: <span class="your-answer">${item.yourAnswer}</span><br>
                                Resposta correta: <span class="correct-answer">${item.correctAnswer}</span>`;
                incorrectListUl.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'Parabéns! Você não errou nenhuma questão.';
            incorrectListUl.appendChild(li);
        }

        // Esta é a linha que mostra a tela de resultados -- ÚNICA CHAMADA APÓS FINALIZAR
        showScreen(resultScreen);
    }

    // --- Event Listeners ---
    startQuizBtn.addEventListener('click', () => {
        if (filterQuestions()) {
            initializeQuiz();
        }
    });

    nextQuestionBtn.addEventListener('click', goToNextQuestion);
    prevQuestionBtn.addEventListener('click', goToPrevQuestion);
    // Este é o ÚNICO ponto onde finalizeQuiz é chamado para exibir os resultados
    finishQuizBtn.addEventListener('click', finalizeQuiz);
    restartQuizBtn.addEventListener('click', () => {
        initializeQuiz();
        showScreen(startScreen); // Volta para a tela de seleção inicial
        areaSelect.value = 'all'; // Reseta seleção de área
        levelSelect.value = 'all'; // Reseta seleção de nível
    });


    // Carrega todas as questões ao iniciar o aplicativo e mostra a tela inicial
    loadQuestions();
});