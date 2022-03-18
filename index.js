const puppeteer = require('puppeteer');
const TelegramBot = require('node-telegram-bot-api');
var cron = require('node-cron');

let currentPostURL = ""

const TOKEN = "5298902875:AAH7RaGluYXceXZpwSnOgeiQuOZjXkJG9Cw";

// bot.sendMessage(-1001649307802, "Hy");

async function getData(el, queryString, defaultValue = null, isLink = false) {
  try {
    if (isLink) {
      return await el.$eval(queryString, (i) => i.href);
    }

    return await el.$eval(queryString, (i) => i.innerText);
  } catch (err) {
    return defaultValue;
  }
}


cron.schedule('*/20 * * * * *', () => {
  (async () => {
    try {
      // Setup BOT
      const bot = new TelegramBot(TOKEN, {
        polling: true,
      });

      // 
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      await page.goto('https://www.marketwatch.com/latest-news?messageNumber=0&channelId=e0893c81-6641-413b-a450-25c14139ffd0&position=1.2&partial=true', {
        waitUntil: 'load'
      });

      const posts = await page.$$('div[class="article__content"]');

      const jsonPost = [];
      for (const post of posts) {
        jsonPost.push({
          articleLink: await getData(post, 'a[class="link"]', '', true),
          label: (await getData(post, 'span.article__label', '')).trim(),
          heading: await getData(post, 'a.link', ''),
          summary: await getData(post, '.article__summary'),
          secondaryContent: {
            ticker: await getData(post, 'a[class="ticker qt-chip j-qt-chip"]', ''),
            tickerLink: await getData(post, 'a[class="ticker qt-chip j-qt-chip"]', '', true),
          },
          details: {
            timestamp: await getData(post, '.article__timestamp', ''),
            author: (await getData(post, '.article__author', '')).replace("by", "").trim(),
          }
        })
      }

      let newPosts = [];
      if (jsonPost[0].articleLink !== currentPostURL) {
        for (const post of jsonPost) {
          if (post.articleLink === currentPostURL) break;
          newPosts.push(post);
        }
      }

      let temp = currentPostURL;
      currentPostURL = jsonPost[0].articleLink;

      console.log("🚀 ~ file: index.js ~ line 61 ~ newPost", newPosts)

      // Sending new post through bot at telegram
      if (temp !== "") {
        for (const newPost of newPosts) {
          bot.sendMessage(-1001649307802, `NEW POST\n\n${newPost.heading}\n\n${newPost.articleLink}`);
        }
      }


    } catch (err) {
      console.log("🚀 ~ file: index.js ~ line 47 ~ err", err)
    }
  })();
});


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}