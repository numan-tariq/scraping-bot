const puppeteer = require('puppeteer');

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

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto('https://www.marketwatch.com/latest-news?messageNumber=0&channelId=e0893c81-6641-413b-a450-25c14139ffd0&position=1.2&partial=true', {
      waitUntil: 'load'
    });

    const posts = await page.$$('div[class="article__content"]');

    const jsonPost = [];
    for (const post of posts) {
      jsonPost.push({
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

    console.log("🚀 ~ file: index.js ~ line 45 ~ jsonPost", jsonPost)
  } catch (err) {
    console.log("🚀 ~ file: index.js ~ line 47 ~ err", err)
  }

});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}