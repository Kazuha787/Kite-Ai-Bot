const axios = require('axios');
const fs = require('fs');
const figlet = require('figlet');
const chalk = require('chalk');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

const agents = {
  "deployment_p5J9lz1Zxe7CYEoo0TZpRVay": "Professor 🧠",
  "deployment_7sZJSiCqCNDy9bBHTEh7dwd9": "Crypto Buddy 💰",
  "deployment_SoFftlsf9z4fyA3QCHYkaANq": "Sherlock 🔎"
};

function displayAppTitle() {
  console.log(chalk.cyan(figlet.textSync(' TEAM HUNTER ', { horizontalLayout: 'full' })));
  console.log(chalk.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.gray('BY TEAM HUNTERS '));
  console.log(chalk.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.yellow('🔗 Telegram: https://t.me/team_hunters0'));
  console.log(chalk.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
}

async function sendRandomQuestion(agent) {
  try {
    const randomQuestions = JSON.parse(fs.readFileSync('random_questions.json', 'utf-8'));
    const randomQuestion = randomQuestions[Math.floor(Math.random() * randomQuestions.length)];

    const payload = { message: randomQuestion, stream: false };
    const response = await axios.post(`https://${agent.toLowerCase().replace('_','-')}.stag-vxzy.zettablock.com/main`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    return { question: randomQuestion, response: response.data.choices[0].message };
  } catch (error) {
    console.error(chalk.red('⚠️ Error:'), error.response ? error.response.data : error.message);
  }
}

async function reportUsage(wallet, options) {
  try {
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

    console.log(chalk.green('✅ Usage data successfully reported!\n'));
  } catch (error) {
    console.error(chalk.red('⚠️ Failed to report usage:'), error.response ? error.response.data : error.message);
  }
}

async function main() {
  displayAppTitle();

  readline.question(chalk.yellow('🔑 Enter your wallet address: '), async (wallet) => {
    readline.question(chalk.yellow('🔢 Enter the number of iterations per agent: '), async (input) => {
      const iterations = parseInt(input) || 1;
      console.log(chalk.blue(`\n📌 Wallet address: ${wallet}`));
      console.log(chalk.blue(`📊 Iterations per agent: ${iterations}\n`));

      for (const [agentId, agentName] of Object.entries(agents)) {
        console.log(chalk.magenta(`\n🤖 Using Agent: ${agentName}`));
        console.log(chalk.dim('----------------------------------------'));

        for (let i = 0; i < iterations; i++) {
          console.log(chalk.yellow(`🔄 Iterasi ke-${i + 1}`));
          const nanya = await sendRandomQuestion(agentId);
          console.log(chalk.cyan('❓ Question:'), chalk.bold(nanya.question));
          console.log(chalk.green('💡 Answer:'), chalk.italic(nanya?.response?.content ?? ''));

          await reportUsage(wallet.toLowerCase(), {
            agent_id: agentId,
            question: nanya.question,
            response: nanya?.response?.content ?? 'Tidak ada jawaban'
          });
        }

        console.log(chalk.dim('----------------------------------------'));
      }

      console.log('\n🎉 Session complete! Thank you for using Hunter AI.');
      readline.close();
    });
  });
}

main();
