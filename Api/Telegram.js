// Telegram Bot til PokeProfit - Send DBA link og få Cardmarket EX tjek
// Kør på Vercel - 100% gratis
// Denne fil skal ligge som api/telegram.js i dit GitHub repo

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'GET') {
    return res.status(200).send('PokeProfit Telegram Bot er online! Sæt webhook til denne URL');
  }

  try {
    const body = req.body;
    if (!body || !body.message) return res.status(200).send('ok');

    const chatId = body.message.chat.id;
    const text = body.message.text || '';
    8905726207:AAF7thmx_KKZ0JkSaAYSgj1KJ07WnCAD0WA

    if (!BOT_TOKEN) {
      await sendMessage(chatId, '⚠️ BOT_TOKEN mangler i Vercel env vars', '');
      return res.status(200).send('no token');
    }

    // Tjek om det er DBA link
    const dbaMatch = text.match(/dba\.dk\/(\d+)/i);
    if (!dbaMatch) {
      await sendMessage(chatId, 
        `👋 Hej! Send mig et DBA link så tjekker jeg det!\n\nEksempel:\nhttps://www.dba.dk/23457826\n\nJeg henter billeder, titel og pris, og giver dig Cardmarket EX tjek med det samme.`,
        BOT_TOKEN
      );
      return res.status(200).send('ok');
    }

    const dbaId = dbaMatch[1];
    const dbaUrl = `https://www.dba.dk/${dbaId}`;

    await sendMessage(chatId, `🔍 Henter DBA annonce ${dbaId}...`, BOT_TOKEN);

    // Hent DBA
    const response = await fetch(dbaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15',
        'Accept': 'text/html'
      }
    });
    const html = await response.text();

    let title = "";
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) title = titleMatch[1].split('|')[0].trim();

    let price = "Bud";
    const priceMatch = html.match(/"price"\s*:\s*"?(\d+)"?/);
    if (priceMatch) price = priceMatch[1] + " kr";

    // Find billeder
    const images = [];
    const imgRegex = /https:\/\/[^"']+dba[^"']+\.(jpg|jpeg|png|webp)/gi;
    let m;
    while ((m = imgRegex.exec(html)) !== null) {
      if (!images.includes(m[0]) && !m[0].includes('logo')) {
        images.push(m[0]);
      }
      if (images.length >= 8) break;
    }

    // Byg besked med EX tjek guide
    let message = `📦 *${title}*\n`;
    message += `💰 Pris: ${price}\n`;
    message += `🔗 ${dbaUrl}\n\n`;
    
    if (images.length > 0) {
      message += `🖼️ Fandt ${images.length} billeder\n\n`;
    }

    message += `💡 *Cardmarket EX Tjek (70% af NM):*\n`;
    message += `1. Åbn billederne og identificer kort\n`;
    message += `2. Søg på cardmarket.com for hvert kort\n`;
    message += `3. Tag AVG pris x 0.7 = EX værdi\n`;
    message += `4. Træk 11% fees + 45kr porto\n\n`;
    
    message += `📊 *Hurtig vurdering ${dbaId}:*\n`;
    if (parseInt(price) <= 150) {
      message += `✅ Under 150kr for blandet lot = ofte god deal\n`;
      message += `💸 Skambud: ${Math.round(parseInt(price || 100) * 0.6)}kr kontant, henter i dag\n`;
    }
    message += `\nSend næste DBA link!`;

    await sendMessage(chatId, message, BOT_TOKEN);

    // Send billeder som album hvis vi har dem
    if (images.length > 0) {
      // Telegram kan max sende 10 billeder af gangen
      for (let i = 0; i < Math.min(images.length, 5); i++) {
        try {
          await sendPhoto(chatId, images[i], BOT_TOKEN);
        } catch (e) {}
      }
    }

    return res.status(200).send('ok');

  } catch (e) {
    console.error(e);
    return res.status(200).send('error');
  }
}

async function sendMessage(chatId, text, token) {
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    })
  });
}

async function sendPhoto(chatId, photoUrl, token) {
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl
    })
  });
}
