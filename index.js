const beep = require("beepbeep");
const notifier = require("node-notifier");

const fetch = (url, params) =>
  import("node-fetch").then(({ default: fetch }) => fetch(url, params));

const getStat = async () => {
  try {
    const a = await fetch("https://api.tinkoff.ru/geo/withdraw/clusters", {
      headers: {
        accept: "*/*",
        "accept-language": "ru,en-US;q=0.9,en;q=0.8,es;q=0.7",
        "cache-control": "no-cache",
        "content-type": "application/json",
        pragma: "no-cache",
        "sec-ch-ua":
          '" Not A;Brand";v="99", "Chromium";v="98", "Google Chrome";v="98"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site",
        Referer: "https://www.tinkoff.ru/",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
      body: '{"bounds":{"bottomLeft":{"lat":47.208608055967176,"lng":39.62608000538524},"topRight":{"lat":47.329890980715085,"lng":39.77233549854932}},"filters":{"showUnavailable":true,"currencies":["USD"]},"zoom":12}',
      method: "POST",
    });

    const data = await a.json();
    return data.payload.clusters;
  } catch (e) {
    console.log("RequestError", e);
    return false;
  }
};

const notify = (remain, address) => {
  notifier.notify(
    {
      title: `Баксы появились – $${remain}!`,
      message: address,
      sound: true, // Only Notification Center or Windows Toasters
      wait: true // Wait with callback, until user action is taken against notification, does not apply to Windows Toasters as they always wait or notify-send as it does not support the wait option
    }
  );
}

const excludeIds = ['008002'];

let alreadyExists = {};

const resetTimer = (id) => {
  setTimeout(() => {
    delete alreadyExists[id];
  }, 5 * 60 * 1000);
};

setInterval(async () => {
  const clusters = await getStat();
  if (clusters?.length) {
    clusters.forEach(cluster => {
      const id = cluster.points[0].id;
      const address = cluster.points[0].address;
      const remain = cluster.points[0].atmInfo.limits[0].amount;

      if (remain >= 2000 && !alreadyExists[id] && !excludeIds.includes(id)) {
        console.log(
          `${new Date().toLocaleString()} - $${remain} - ${address}`
        );
        alreadyExists[id] = remain;
        notify(remain, address);
        beep();
        resetTimer(id);
      }
    })
  }

  if (!clusters?.length && Object.values(alreadyExists).length) {
    console.log(`${new Date().toLocaleString()} баксы закончились!`);
    alreadyExists = {};
  }
}, 10000);
