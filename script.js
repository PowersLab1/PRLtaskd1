// Task parameters one might want to change
const interTrialInterval = 500; // change back to 750 Time in milliseconds for the fixation cross inter-trial-interval
const feedbackDisplayTime = 1500; // change back to 3000 Time in milliseconds for the feedback display
const timeoutDuration = 4000; // change back to 5000 Time in milliseconds until the timeout is active
const delayToChoose = 500; //how long participants cannot choose a stimulus (prevents button mashing)
const highProbability = 0.75;
const lowProbability = 0.25;
const trialsPerShuffle = 1; //the number of trials before the fractal images shuffle position
const block1 = 2;//change the block #s to change how many trials are done prior to reversals
const block2 = 2;//Cole did [55, 45, 20, 20, 20]
const block3 = 2;
const block4 = 2;
const block5 = 2;
const block6 = 2;
const block7 = 2;
const block8 = 2; // total is currently 150 trials


document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('instruction-screen1').style.display = 'block';
});

//These event listeners let participants proceed through the instructions creens
document.addEventListener('keydown', (event) => {
    if (document.getElementById('instruction-screen1').style.display === 'block') {
        document.getElementById('instruction-screen1').style.display = 'none';
        document.getElementById('instruction-screen2').style.display = 'block';
    } else if (document.getElementById('instruction-screen2').style.display === 'block') {
        document.getElementById('instruction-screen2').style.display = 'none';
        document.getElementById('instruction-screen3').style.display = 'block';
    } else if (document.getElementById('instruction-screen3').style.display === 'block') {
        document.getElementById('instruction-screen3').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        game.startTrial();
    }
});

//randomizes the block order once at the start of  the game; trialLimits used inside of game set equal to  blocks at the end. 
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
//
const blocks = [block1, block2, block3, block4, block5, block6, block7, block8];
shuffleArray(blocks);

//Function that shuffles the fractals every 5 trials. 
function shuffleFractals() {
    const fractalIDs = ['fractal1', 'fractal2', 'fractal3']; // Use IDs instead of numbers
    for (let i = fractalIDs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [fractalIDs[i], fractalIDs[j]] = [fractalIDs[j], fractalIDs[i]];
    }
    return fractalIDs;
}

//defining the game object; most functions live within it.
const game = {
    currentState: "choosing",
    trialStart: null,
    trials: [],
    totalPoints: 0,
    rewardProbs: [
        {fractal1: highProbability, fractal2: lowProbability, fractal3: 0.50},
        {fractal1: lowProbability, fractal2: highProbability, fractal3: 0.50},
        {fractal1: highProbability, fractal2: lowProbability, fractal3: 0.50},
        {fractal1: lowProbability, fractal2: highProbability, fractal3: 0.50},
        {fractal1: highProbability, fractal2: lowProbability, fractal3: 0.50},
        {fractal1: lowProbability, fractal2: highProbability, fractal3: 0.50},
        {fractal1: highProbability, fractal2: lowProbability, fractal3: 0.50},
        {fractal1: lowProbability, fractal2: highProbability, fractal3: 0.50},
    ],
    currentProbIndex: 0,
    currentFractalPositions: ['fractal1', 'fractal2', 'fractal3'], // Initial order
    trialLimits: blocks, //"blocks" is currently randomized outside game object
    timeout: null,
    keydownHandler: null,

    updateFractalPositions() {
    const container = document.getElementById('fractals');
    const newOrder = this.currentFractalPositions.map(id => document.getElementById(id));
    newOrder.forEach(element => {
        if (element) {
            container.appendChild(element); // This moves the element to the end of the container
        } else {
            console.error('Fractal element not found:', element);
        }
    });
},
    switchProb() {
        this.currentProbIndex++;
    },
    getCurrentBlock() {
    let totalTrials = 0;
    for (let i = 0; i < this.trialLimits.length; i++) {
        totalTrials += this.trialLimits[i];
        if (this.trials.length < totalTrials) {
            return i + 1;
        }
    }
    return this.trialLimits.length; // In case all trials are completed
    },
    startTrial() {
        this.currentState = "waiting"; // Change state to 'waiting'
        this.trialStart = Date.now();

        document.getElementById('fractals').style.display = 'block';
        document.getElementById('instruction').style.display = 'block';
        document.getElementById('feedback').style.display = 'none';
        document.getElementById('points').style.display = 'none';
        document.getElementById('fixation-cross').style.display = 'none';
    
        // Delay for 200ms before accepting key presses
        setTimeout(() => {
            this.currentState = "choosing";
        }, 200);

        //end trial set choice to -999 if no choice within timeoutDuration
        this.timeout = setTimeout(() => this.endTrial(-999, -999, 0, timeoutDuration), timeoutDuration);//added another -999 for the 2 arguments at start of endTrial
        document.addEventListener('keydown', this.keydownHandler);
    },
    endTrial(keyChoice, fractalChoice, outcome, decisionTime) {
    clearTimeout(this.timeout);
    document.removeEventListener('keydown', this.keydownHandler);
   
    // Choose the correct indicator based on the choice
    let indicatorId;
    if (keyChoice === 1) {
        indicatorId = 'left-indicator';
    } else if (keyChoice === 2) {
        indicatorId = 'middle-indicator';
    } else { // keyChoice === 3
        indicatorId = 'right-indicator';
    }

    // If the participant didn't make a choice, set outcome to -999
    if (keyChoice === -999 && fractalChoice === -999) {
        outcome = -999;
        // Skipping indicator display
        this.showFeedback(keyChoice, fractalChoice, outcome, decisionTime);
        return; // Exit the function early
    }
    const indicator = document.getElementById(indicatorId);
    if (!indicator) {
        console.error('Indicator not found:', indicatorId); // New error log
        return; // Prevent further execution if indicator is null
    }
    indicator.style.display = 'inline-block';
    setTimeout(() => {
        indicator.style.display = 'none';
        this.showFeedback(keyChoice, fractalChoice, outcome, decisionTime);
    }, 250);
},

    showFeedback(keyChoice, choice, outcome, decisionTime) {
    const {fractal1, fractal2, fractal3} = this.rewardProbs[this.currentProbIndex];
    const currentBlock = this.getCurrentBlock();
    const trialData = {
        keyChoice,
        choice,
        outcome,
        block: currentBlock, // Add the current block
        totalPoints: this.totalPoints,
        rewardProbFractal1: fractal1,
        rewardProbFractal2: fractal2,
        rewardProbFractal3: fractal3,
        decisionTime
    };
    console.log(trialData)
    this.trials.push(trialData);

        document.getElementById('fractals').style.display = 'none';
        document.getElementById('instruction').style.display = 'none';
        document.getElementById('feedback').style.display = 'block';
        document.getElementById('points').innerText = `Winnings: $${this.totalPoints}`;
        document.getElementById('points').style.display = 'block';
        
        const feedback = document.getElementById("feedback");
        if (choice === -999) {
            feedback.innerText = "Too slow! You get $0";
        } else if (outcome) {
            feedback.classList.add('positive-feedback');
            feedback.innerText = "You get $0.75";
            this.totalPoints += 0.75;
        } else {
            feedback.classList.add('negative-feedback');
            feedback.innerText = "You get $0.25";
            this.totalPoints -= 0.25;
        }

        setTimeout(() => {
            feedback.classList.remove('positive-feedback');
            feedback.classList.remove('negative-feedback');
            feedback.style.display = 'none';
            document.getElementById('points').style.display = 'none';
            document.getElementById('fixation-cross').style.display = 'block';
            setTimeout(() => {
                this.startNextTrial();
            }, interTrialInterval);
        }, feedbackDisplayTime);
    },
    startNextTrial() {
        if (this.trials.length % trialsPerShuffle === 0) { // Every trialsPerShuffle trials, shuffle fractals
        this.currentFractalPositions = shuffleFractals();
        this.updateFractalPositions();
    }
        if (this.trials.length === this.trialLimits.reduce((a, b) => a + b, 0)) {
            console.log(this.trials);
            //if (window.parent == window) {
                console.log('in if statement for startNextTrial');
                window.postMessage({ //used to be window.parent.postMessage...
                    type: 'labjs.data',
                    json: JSON.stringify(this.trials)
                }, '*');
           // }
            document.getElementById('completion-message').style.display = 'block';
            document.getElementById('game-container').style.display = 'none';
        } else if (this.trials.length === this.trialLimits.slice(0, this.currentProbIndex + 1).reduce((a, b) => a + b, 0)) {
            this.switchProb();
        }
        this.startTrial();
    },
};

game.keydownHandler = (event) => {
        // Check if the current state is 'choosing' and if key '1', '2', or '3' is pressed
    if (game.currentState === "choosing" && (event.key === "1" || event.key === "2" || event.key === "3")) {
        clearTimeout(game.timeout);

        const keyChoice = parseInt(event.key); // Key pressed by the user
        const fractalChoice = game.currentFractalPositions[keyChoice - 1]; // Directly use the shuffled fractal ID

        // Get the reward probabilities for the current trial
        const { fractal1, fractal2, fractal3 } = game.rewardProbs[game.currentProbIndex];

        // Determine the probability based on the chosen fractal
        let prob;
        switch(fractalChoice) {
            case 'fractal1':
                prob = fractal1;
                break;
            case 'fractal2':
                prob = fractal2;
                break;
            case 'fractal3':
                prob = fractal3;
                break;
        }
        // Log the probability being used
        console.log(`Probability for ${fractalChoice}:`, prob);
        // Calculate the outcome: 1 for reward, 0 for no reward
        const outcome = Math.random() < prob ? 1 : 0;
        //calculate the decision time
        const decisionTime = Date.now() - game.trialStart;
        // End the trial with the key choice, actual fractal choice, outcome, and decision time
        game.endTrial(keyChoice, fractalChoice, outcome, decisionTime);
    }
};