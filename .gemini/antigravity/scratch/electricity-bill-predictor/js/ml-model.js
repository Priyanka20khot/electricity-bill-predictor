// ML Model — TensorFlow.js Neural Network
// Predicts corrected kWh consumption from base estimates + usage patterns

let model = null;
let isModelReady = false;

// Generate synthetic training data
function generateTrainingData(numSamples = 400) {
  const xs = [], ys = [];
  for (let i = 0; i < numSamples; i++) {
    const baseUnits   = Math.random() * 600 + 20;   // 20–620 kWh raw
    const numAppliances = Math.floor(Math.random() * 12) + 1;
    const avgHours    = Math.random() * 14 + 2;     // 2–16 hrs/day avg
    const peakFactor  = Math.random() * 0.5 + 0.8; // 0.8–1.3 peak usage factor

    // Real-world correction factor (efficiency loss, standby, etc.)
    const noise       = (Math.random() - 0.5) * 0.12;
    const corrected   = baseUnits * (1.08 + noise) * (1 + (numAppliances * 0.005)) * peakFactor;

    xs.push([baseUnits / 700, numAppliances / 15, avgHours / 16, peakFactor / 1.5]);
    ys.push([Math.min(corrected, 900) / 900]);
  }
  return { xs, ys };
}

// Build and train model
export async function initModel(onProgress) {
  if (isModelReady) return;

  const { xs, ys } = generateTrainingData(400);
  const xTensor = tf.tensor2d(xs);
  const yTensor = tf.tensor2d(ys);

  model = tf.sequential({
    layers: [
      tf.layers.dense({ inputShape: [4], units: 32, activation: 'relu',
        kernelInitializer: 'glorotUniform' }),
      tf.layers.dropout({ rate: 0.1 }),
      tf.layers.dense({ units: 16, activation: 'relu' }),
      tf.layers.dense({ units: 1, activation: 'sigmoid' })
    ]
  });

  model.compile({
    optimizer: tf.train.adam(0.005),
    loss: 'meanSquaredError',
    metrics: ['mse']
  });

  await model.fit(xTensor, yTensor, {
    epochs: 80,
    batchSize: 32,
    validationSplit: 0.1,
    callbacks: {
      onEpochEnd: (epoch) => {
        if (onProgress) onProgress(Math.round((epoch / 80) * 100));
      }
    }
  });

  xTensor.dispose();
  yTensor.dispose();
  isModelReady = true;
}

// Predict corrected monthly kWh from appliance data
export function predict(selectedAppliances) {
  if (!isModelReady || !model) return null;

  const baseUnits = selectedAppliances.reduce((sum, a) => {
    return sum + (a.watts * a.hours * a.days * a.qty) / 1000;
  }, 0);

  const numAppliances = selectedAppliances.length;
  const avgHours = numAppliances > 0
    ? selectedAppliances.reduce((s, a) => s + a.hours, 0) / numAppliances
    : 0;

  // Compute peak factor: appliances with high wattage running long hours
  const peakFactor = Math.min(1.3, 0.85 + (selectedAppliances
    .filter(a => a.watts > 500 && a.hours > 4).length * 0.08));

  const input = tf.tensor2d([[
    Math.min(baseUnits / 700, 1),
    Math.min(numAppliances / 15, 1),
    Math.min(avgHours / 16, 1),
    Math.min(peakFactor / 1.5, 1)
  ]]);

  const result = model.predict(input);
  const correctedNorm = result.dataSync()[0];
  input.dispose();
  result.dispose();

  const correctedUnits = correctedNorm * 900;
  return {
    baseUnits: Math.round(baseUnits * 10) / 10,
    predictedUnits: Math.round(correctedUnits * 10) / 10,
    peakFactor: Math.round(peakFactor * 100) / 100
  };
}

export function isReady() { return isModelReady; }
