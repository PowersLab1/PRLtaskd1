// Task parameters one might want to change
const interTrialInterval = 500; // Time in milliseconds for the fixation cross inter-trial-interval
const feedbackDisplayTime = 1000; // Time in milliseconds for the feedback display
const maximumResponseTime = 3000; // Time in milliseconds until trial ends w/o  points and tells them they're too slow
const minimumResponseTime = 200; //how long participants cannot choose a stimulus (prevents button mashing)
const highProbability = 0.75;
const lowProbability = 0.25;
const trialsPerShuffle = 1; //the number of trials before the fractal images shuffle position
const totalTrials = 30; // Adjust as needed -- this n umber * ITI, max response time, and feeedback display should be less than 20 minutes!
const totalBlocks = 3;   // Total number of reward probability changes -- KEEP IN MIND meanTrialsPerBlock*TotalBlocks needs to = TotalTrials!!!!!
const meanTrialsPerBlock = 10; // Average trials per block
const maxTrialsPerBlock = 15;   // Max number of trials in a block
const minTrialsPerBlock = 5;   // Min number of trials in a block
const totalTrialVariability = 0; //number of trials the total number of trials can be off by


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


//Function that shuffles the fractals every 5 trials. 
function shuffleFractals() {
    const fractalIDs = ['fractal1', 'fractal2', 'fractal3']; // Use IDs instead of numbers
    for (let i = fractalIDs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [fractalIDs[i], fractalIDs[j]] = [fractalIDs[j], fractalIDs[i]];
    }
    return fractalIDs;
}

/* This function draws a random value from a specified distribution 
  – dist can take values such as "unif" (uniform), "norm" (normal), etc.
  – param is an array that specifies the parameters of the distribution
      uniform: [min, max]
      uniform integer: [min, max]
      normal:  [mean, sd] 
      exp:     lambda
  – n specifies the number of draws */
function drawRandom(dist = "unif", param = [0, 1]) {

// turn param into an object if not already an object:
var p;
if (typeof param !== 'object') {
  p = [param];
} else {
  p = param;
}

// ensure that every element of p is numeric:
// if (p.some(elem => isNaN(elem))) {
//   throw "Distribution parameters must be numeric."
// }

// initialize the output variable:
var x;

  // draw the random value based on the distribution chosen...
  switch(dist) { 

    case "unif": // if a uniform distribution, use Math.random classically:
      
      // if the distribution parameters are not in the right form, raise an error:
      if (param.length !== 2) {
        let errMsg = "2 parameters were expected for 'unif' but " + param.length + " were obtained.";
        throw errMsg;
      }

      let min_unif = Math.min(param[0], param[1]); 
      let max_unif = Math.max(param[0], param[1]);
      x = Math.random() * (max_unif - min_unif) + min_unif;
      break;

    case "unifInt": // if a uniform distribution, use Math.random classically:

      // if the distribution parameters are not in the right form, raise an error:
      if (param.length !== 2) {
        let errMsg = "2 parameters were expected for 'unifInt' but " + param.length + " were obtained.";
        throw errMsg;
      }

      let min_unifInt = Math.min(param[0], param[1]); 
      let max_unifInt = Math.max(param[0], param[1]);
      x = Math.floor(Math.random() * (max_unifInt - min_unifInt + 1) + min_unifInt);
      break;  

    case "norm": // if a normal distribution, use the Box-Muller algorithm to transform uniform to Gaussian

      // if the distribution parameters are not in the right form, raise an error:
      if (param.length !== 2) {
        let errMsg = "2 parameters were expected for 'norm' but " + param.length + " were obtained.";
        throw errMsg;
      } else if (param[1] < 0) {
        let errMsg = "For 'norm', the second parameter (SD) cannot be negative!";
        throw errMsg;
      }

      let mu_norm = param[0]; 
      let sigma_norm = param[1];
      let u_norm = 1 - Math.random(); // we need the uniform to be over (0,1] rather than [0,1)
      let v_norm = 1 - Math.random();
      let z_norm = Math.sqrt(-2.0 * Math.log(u_norm)) * Math.cos(2.0*Math.PI*v_norm);

      // determine a distribution value from the standard normal:
      x = z_norm * sigma_norm + mu_norm;
      break;
    
      case "pois": // Poisson distribution
        if (param.length !== 1) {
            let errMsg = "1 parameter was expected for 'pois' but " + param.length + " were obtained.";
            throw errMsg;
        } else if (param[0] < 0) {
            let errMsg = "For 'pois', parameter lambda cannot be negative!";
            throw errMsg;
        }

        let lambda = param[0];
        let L = Math.exp(-lambda);
        let k = 0;
        let p = 1;
        do {
            k++;
            p *= Math.random();
        } while (p > L);
        x = k - 1;
        break;

    // case "exp": // use the relation Y = - ln(U)/lambda

    //   // if the distribution parameters are not in the right form, raise an error:
    //   if (param.length !== 1) {
    //     let errMsg = "1 parameters were expected for 'exp' but " + param.length + " were obtained.";
    //     throw errMsg;
    //   } else if (param[0] < 0) {
    //     let errMsg = "For 'exp', parameter lambda cannot be negative!";
    //     throw errMsg;
    //   }

    //   let lambda = param;
    //   let u_exp = 1-Math.random();
    //   x = -Math.log(u_exp)/ lambda;
    //   break;

    default:
      let errMsg = "RANDTYPE " + dist + " not supported."
      throw errMsg;
  }

  return x;
  
}

/* This function returns a random number drawn from the poisson distribution with mean = mean. 
Truncates the distribution at maxVal (default = inf). 
Shifts distribution by minVal */
// function randExp(mean, maxVal = Infinity, minVal = 0) {

// // initialize the output variable:
// let out; 

// // determine the output variable:
// do {
//   out = drawRandom("exp", [1.0/(mean - minVal)]) + minVal;
// } while (out > maxVal)

// return out;

// }
function randPois(lambda, maxVal = Infinity, minVal = 0) {
  let out;
  do {
    out = drawRandom("pois", [lambda]) + minVal;
  } while (out > maxVal)
  return out;
}


function makeBlocks(nTrials, nBlocks, meanTrialsPerBlock, maxTrialsPerBlock, minTrialsPerBlock) {
    // Initialize an Array for block lengths:
    var blockLengths;

    // Declare variables used to check whether block criteria are met:
    let err;    

    do {
        blockLengths = [];

        for (var thisBlock = 0; thisBlock < nBlocks; thisBlock++) {
            // Draw some trials for the current block:
            //let nTrialsInThisBlock = Number.parseInt(Math.ceil(randExp(meanTrialsPerBlock, maxTrialsPerBlock, minTrialsPerBlock)));
            let nTrialsInThisBlock = Number.parseInt(Math.ceil(randPois(meanTrialsPerBlock, maxTrialsPerBlock, minTrialsPerBlock)));


            // Add a block of this length to the queue:
            blockLengths.push(nTrialsInThisBlock);
        }

        // Calculate the error:
        err = nTrials - blockLengths.reduce((a, x) => a + x);

    // Continue if error is greater than 5 or less than -5
    } while (Math.abs(err) > totalTrialVariability);

    // Adjust the last block to compensate for the remaining error:
    if (err !== 0 && blockLengths.length > 0) {
        blockLengths[blockLengths.length - 1] += err;
    }

    // Return the block lengths:
    return blockLengths;
}



// Generate block lengths nTrials = totalTrials set at the top, nBlocks = totalBlocks set at the top
const blocks = makeBlocks(totalTrials, totalBlocks, meanTrialsPerBlock, maxTrialsPerBlock, minTrialsPerBlock);
console.log(blocks)

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
        }, minimumResponseTime);

        //end trial set choice to -999 if no choice within maximumResponseTime
        this.timeout = setTimeout(() => this.endTrial(-999, -999, 0, maximumResponseTime), maximumResponseTime);//added another -999 for the 2 arguments at start of endTrial
        document.addEventListener('keydown', this.keydownHandler);
        this.earlyKeydown = false; // Flag to track early keydown
    },
    endTrial(keyChoice, fractalChoice, outcome, decisionTime) {
    clearTimeout(this.timeout);
    document.removeEventListener('keydown', this.keydownHandler);

    //snippet below shows what to do if participant hits a key too early during the "waiting" period
    // Inside the endTrial function
    if (this.earlyKeydown) {
        const feedback = document.getElementById("feedback");
        feedback.innerText = "You picked a picture too quickly to have been paying attention. You get $0 and have to wait 5 seconds";
        feedback.style.display = 'block';
    
        const currentBlock = this.getCurrentBlock(); // Get current block
        const trialData = {
            keyChoice,
            choice: -999, // No fractal choice made
            outcome: -999, // No outcome
            block: currentBlock,
            totalPoints: this.totalPoints,
            rewardProbFractal1: this.rewardProbs[this.currentProbIndex].fractal1,
            rewardProbFractal2: this.rewardProbs[this.currentProbIndex].fractal2,
            rewardProbFractal3: this.rewardProbs[this.currentProbIndex].fractal3,
            decisionTime
        };
        console.log(trialData); // Log trial data even if they picked too early
        this.trials.push(trialData); // Add trial data to this.trials even if they picked too early

        setTimeout(() => {
            feedback.style.display = 'none';
            this.startNextTrial();
        }, 5000); // 5-second delay before next trial
        this.earlyKeydown = false; // Reset the flag for the next trial
        return; // Exit the function early
    }

    
//     if (this.earlyKeydown) {
//     const feedback = document.getElementById("feedback");
//     feedback.innerText = "You picked a picture too quickly to have been paying attention. You get $0 and have to wait 5 seconds";
//     feedback.style.display = 'block';
//     setTimeout(() => {
//         feedback.style.display = 'none';
//         this.startNextTrial();
//     }, 5000); // 5-second delay before next trial
//     return; // Exit the function early
// }

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
            this.totalPoints += 0.25;
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
                console.log('Finished the game');
                window.postMessage({ //used to be window.parent.postMessage...
                    type: 'labjs.data',
                    json: JSON.stringify(this.trials)
                }, '*');
            document.getElementById('completion-message').style.display = 'block';
            document.getElementById('game-container').style.display = 'none';
            
            // Remove keydown event listener and set game state to 'ended'
            document.removeEventListener('keydown', this.keydownHandler);
            this.currentState = "ended";
        } else {//if the game is not completed, move onto the probability for the next trial and then move onto startTrial
            if (this.trials.length === this.trialLimits.slice(0, this.currentProbIndex + 1).reduce((a, b) => a + b, 0)) {
            this.switchProb();
        }
        this.startTrial();
    }
    },
};

game.keydownHandler = (event) => {
        // Check if the current state is 'choosing' and if key '1', '2', or '3' is pressed
     if (game.currentState === "waiting" && (event.key === "1" || event.key === "2" || event.key === "3")) {
        game.earlyKeydown = true;
        clearTimeout(game.timeout);
        game.endTrial(parseInt(event.key), -999, -999, Date.now() - game.trialStart); // Set fractalChoice and outcome to -999
        } else if (game.currentState === "choosing" && (event.key === "1" || event.key === "2" || event.key === "3")) {
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