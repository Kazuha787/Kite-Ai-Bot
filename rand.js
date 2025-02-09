const fs = require('fs');

const keywords = [
  "Kite AI", "blockchain", "AI", "Proof of AI", "decentralized", "transparency",
  "collaboration", "scalability", "data subnets", "model subnets", "agent subnets",
  "intelligent applications", "democratize AI", "open collaboration", "infrastructure",
  "smart contracts", "NFT", "DeFi", "crypto mining", "machine learning",
  "AI governance", "Web3", "DAO", "metaverse", "hashing", "public ledger",
  "crypto wallet", "Ethereum", "Bitcoin", "staking", "consensus mechanism",
  "privacy coins", "oracles", "layer 2 scaling", "quantum computing in blockchain",
  "AI-powered trading", "automated decision-making", "neural networks",
  "AI-driven security", "tokenomics", "game theory in crypto", "zero-knowledge proofs",
  "crypto regulation", "AI-generated content", "self-sovereign identity",
  "AI ethics", "cryptographic security", "AI and decentralized finance"
];

const extraPhrases = [
  "in the future", "impact on economy", "challenges faced", "advantages and disadvantages",
  "real-world applications", "security concerns", "scalability issues",
  "role in financial markets", "integration with IoT", "comparison with traditional systems",
  "future predictions", "ethical concerns", "adoption by enterprises",
  "potential for mass adoption", "innovation opportunities", "current trends"
];

function generateRandomQuestion() {
  const starters = [
    "What is", "How does", "Why is", "Can you explain", "What are the benefits of",
    "How can", "What makes", "What are the features of", "How does", "What is the purpose of",
    "Why should we use", "What are the risks of", "What are the future prospects of"
  ];
  const randomStarter = starters[Math.floor(Math.random() * starters.length)];
  const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
  const randomExtra = extraPhrases[Math.floor(Math.random() * extraPhrases.length)];
  
  return `${randomStarter} ${randomKeyword} ${randomExtra}?`;
}

function generateQuestions(count) {
  return Array.from({ length: count }, () => generateRandomQuestion());
}

const questionCount = 1000; // jumlah pertanyaan yang ingin dihasilkan
const randomQuestions = generateQuestions(questionCount);
fs.writeFileSync('random_questions.json', JSON.stringify(randomQuestions, null, 2));
console.log(`${questionCount} pertanyaan acak telah disimpan di random_questions.json`);
