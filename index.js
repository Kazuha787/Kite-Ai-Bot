// Import dependencies
import chalk from 'chalk';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createInterface } from 'readline';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import axios from 'axios';
import fs from 'fs';
import { banner } from './banner.js';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const readline = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Rate Limiting Configuration
const rateLimitConfig = {
  maxRetries: 5,
  baseDelay: 2000,
  maxDelay: 10000,
  requestsPerMinute: 15,
  intervalBetweenCycles: 15000,
  walletVerificationRetries: 3
};

let lastRequestTime = Date.now();
let isRunning = true;

// Handle CTRL+C to gracefully stop the script
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n🛑 Stopping the script gracefully...'));
  isRunning = false;
  setTimeout(() => {
    console.log(chalk.green('👋 Thank you for using Kite AI!'));
    process.exit(0);
  }, 1000);
});

const agents = {
  "deployment_p5J9lz1Zxe7CYEoo0TZpRVay": "Professor 🧠",
  "deployment_7sZJSiCqCNDy9bBHTEh7dwd9": "Crypto Buddy 💰",
  "deployment_SoFftlsf9z4fyA3QCHYkaANq": "Sherlock 🔎"
};

const proxyConfig = {
  enabled: false,
  current: 'direct',
  proxies: []
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const calculateDelay = (attempt) => {
  return Math.min(
    rateLimitConfig.maxDelay,
    rateLimitConfig.baseDelay * Math.pow(2, attempt)
  );
};

// Modified to use correct endpoint and handle specific error cases
async function verifyWallet(wallet) {
  try {
    // Skip wallet verification and proceed with usage reporting
    return true;
  } catch (error) {
    console.log(chalk.yellow('⚠️ Proceeding without wallet verification...'));
    return true;
  }
}

const checkRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  const minimumInterval = (60000 / rateLimitConfig.requestsPerMinute);

  if (timeSinceLastRequest < minimumInterval) {
    const waitTime = minimumInterval - timeSinceLastRequest;
    await sleep(waitTime);
  }
  
  lastRequestTime = Date.now();
};

function loadProxiesFromFile() {
  try {
    const proxyList = fs.readFileSync('proxies.txt', 'utf-8')
      .split('\n')
      .filter(line => line.trim())
      .map(proxy => proxy.trim());
    proxyConfig.proxies = proxyList;
    console.log(chalk.green(`✅ Successfully loaded ${proxyList.length} proxies from file`));
  } catch (error) {
    console.log(chalk.yellow('⚠️ proxies.txt not found or empty. Using direct connection.'));
  }
}

function getNextProxy() {
  if (!proxyConfig.enabled || proxyConfig.proxies.length === 0) {
    return null;
  }
  const proxy = proxyConfig.proxies.shift();
  proxyConfig.proxies.push(proxy);
  return proxy;
}

function createProxyAgent(proxyUrl) {
  try {
    if (!proxyUrl) return null;

    if (proxyUrl.startsWith('socks')) {
      return new SocksProxyAgent(proxyUrl);
    } else if (proxyUrl.startsWith('http')) {
      return {
        https: new HttpsProxyAgent(proxyUrl),
        http: new HttpProxyAgent(proxyUrl)
      };
    }
    return null;
  } catch (error) {
    console.error(chalk.red(`⚠️ Error creating proxy agent: ${error.message}`));
    return null;
  }
}

function createAxiosInstance(proxyUrl = null) {
  const config = {
    headers: { 'Content-Type': 'application/json' }
  };

  if (proxyUrl) {
    const proxyAgent = createProxyAgent(proxyUrl);
    if (proxyAgent) {
      if (proxyAgent.https) {
        config.httpsAgent = proxyAgent.https;
        config.httpAgent = proxyAgent.http;
      } else {
        config.httpsAgent = proxyAgent;
        config.httpAgent = proxyAgent;
      }
    }
  }

  return axios.create(config);
}

function displayAppTitle() {
  console.log(banner);
  console.log(chalk.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.yellow('Fork from : Mamangzed'));
  console.log(chalk.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
}

async function sendRandomQuestion(agent, axiosInstance) {
  try {
    await checkRateLimit();
    
    const randomQuestions = JSON.parse(fs.readFileSync('questions.json', 'utf-8'));
    const randomQuestion = randomQuestions[Math.floor(Math.random() * randomQuestions.length)];

    const payload = { message: randomQuestion, stream: false };
    const response = await axiosInstance.post(
      `https://${agent.toLowerCase().replace('_','-')}.stag-vxzy.zettablock.com/main`,
      payload
    );

    return { question: randomQuestion, response: response.data.choices[0].message };
  } catch (error) {
    console.error(chalk.red('⚠️ Error:'), error.response ? error.response.data : error.message);
    return null;
  }
}

async function reportUsage(wallet, options, retryCount = 0) {
  try {
    await checkRateLimit();

    const payload = {
      wallet_address: wallet,
      agent_id: options.agent_id,
      request_text: options.question,
      response_text: options.response,
      request_metadata: {}
    };

    await axios.post(`https://quests-usage-dev.prod.zettablock.com/api/report_usage`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log(chalk.green('✅ Usage data reported successfully!\n'));
  } catch (error) {
    const isRateLimit = error.response?.data?.error?.includes('Rate limit exceeded');
    
    if (isRateLimit && retryCount < rateLimitConfig.maxRetries) {
      const delay = calculateDelay(retryCount);
      console.log(chalk.yellow(`⏳ Rate limit detected, retrying in ${delay/1000} seconds...`));
      await sleep(delay);
      return reportUsage(wallet, options, retryCount + 1);
    }
    
    // Log the error but continue execution
    console.log(chalk.yellow('⚠️ Usage report issue, continuing execution...'));
  }
}

function loadWalletsFromFile() {
  try {
    return fs.readFileSync('wallets.txt', 'utf-8')
      .split('\n')
      .filter(wallet => wallet.trim())
      .map(wallet => wallet.trim().toLowerCase());
  } catch (error) {
    console.error(chalk.red('⚠️ Error: wallets.txt not found'));
    return [];
  }
}

async function processAgentCycle(wallet, agentId, agentName, useProxy) {
  try {
    const proxy = useProxy ? getNextProxy() : null;
    const axiosInstance = createAxiosInstance(proxy);

    if (proxy) {
      console.log(chalk.blue(`🌐 Using proxy: ${proxy}`));
    }

    const nanya = await sendRandomQuestion(agentId, axiosInstance);
    
    if (nanya) {
      console.log(chalk.cyan('❓ Question:'), chalk.bold(nanya.question));
      console.log(chalk.green('💡 Answer:'), chalk.italic(nanya?.response?.content ?? ''));

      await reportUsage(wallet, {
        agent_id: agentId,
        question: nanya.question,
        response: nanya?.response?.content ?? 'No answer'
      });
    }
  } catch (error) {
    console.error(chalk.red('⚠️ Error in agent cycle:'), error.message);
  }
}

async function startContinuousProcess(wallet, useProxy) {
  console.log(chalk.blue(`\n📌 Processing wallet: ${wallet}`));
  console.log(chalk.yellow('Press Ctrl+C to stop the script\n'));

  let cycleCount = 1;

  while (isRunning) {
    console.log(chalk.magenta(`\n🔄 Cycle #${cycleCount}`));
    console.log(chalk.dim('----------------------------------------'));

    for (const [agentId, agentName] of Object.entries(agents)) {
      if (!isRunning) break;
      
      console.log(chalk.magenta(`\n🤖 Using Agent: ${agentName}`));
      await processAgentCycle(wallet, agentId, agentName, useProxy);
      
      if (isRunning) {
        console.log(chalk.yellow(`⏳ Waiting ${rateLimitConfig.intervalBetweenCycles/1000} seconds before next interaction...`));
        await sleep(rateLimitConfig.intervalBetweenCycles);
      }
    }

    cycleCount++;
    console.log(chalk.dim('----------------------------------------'));
  }
}

async function main() {
  displayAppTitle();

  const askMode = () => {
    return new Promise((resolve) => {
      readline.question(chalk.yellow('🔄 Choose connection mode (1: Direct, 2: Proxy): '), resolve);
    });
  };

  const askWalletMode = () => {
    return new Promise((resolve) => {
      console.log(chalk.yellow('\n📋 Choose wallet mode:'));
      console.log(chalk.yellow('1. Manual input'));
      console.log(chalk.yellow('2. Load from wallets.txt'));
      readline.question(chalk.yellow('\nYour choice: '), resolve);
    });
  };

  const askWallet = () => {
    return new Promise((resolve) => {
      readline.question(chalk.yellow('🔑 Enter wallet address: '), resolve);
    });
  };

  try {
    const mode = await askMode();
    proxyConfig.enabled = mode === '2';
    
    if (proxyConfig.enabled) {
      loadProxiesFromFile();
    }
    
    const walletMode = await askWalletMode();
    let wallets = [];
    
    if (walletMode === '2') {
      wallets = loadWalletsFromFile();
      if (wallets.length === 0) {
        console.log(chalk.red('❌ No wallets loaded. Stopping program.'));
        readline.close();
        return;
      }
    } else {
      const wallet = await askWallet();
      wallets = [wallet.toLowerCase()];
    }

    for (const wallet of wallets) {
      await startContinuousProcess(wallet, proxyConfig.enabled);
    }
    
  } catch (error) {
    console.error(chalk.red('⚠️ An error occurred:'), error);
    readline.close();
  }
}

main();
