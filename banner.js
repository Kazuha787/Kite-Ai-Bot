// banner.js
import chalk from 'chalk';

export function displayBanner() {
    console.log(chalk.cyan(`

██╗  ██╗ █████╗ ███████╗██╗   ██╗██╗  ██╗ █████╗ 
██║ ██╔╝██╔══██╗╚══███╔╝██║   ██║██║  ██║██╔══██╗
█████╔╝ ███████║  ███╔╝ ██║   ██║███████║███████║
██╔═██╗ ██╔══██║ ███╔╝  ██║   ██║██╔══██║██╔══██║
██║  ██╗██║  ██║███████╗╚██████╔╝██║  ██║██║  ██║
╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
                                                 

                   ${chalk.yellow('KALEIDO AUTO - BOT')}                
     📢  ${chalk.blue('Telegram Channel: https://t.me/Kazuha_im_Offical')}
    `));
}
