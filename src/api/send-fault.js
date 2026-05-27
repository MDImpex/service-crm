// api/send-fault.js
export default async function handler(req, res) {
  // Leidžiame užklausas tik iš jūsų svetainės (Apeiname CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { client, address, equipment, serial, details } = req.body;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer re_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudWNydHJqYW9ha2FjaHNydWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMzA5NjgsImV4cCI6MjA5MzcwNjk2OH0.srfXrYR5MCzUMBwV-mm7mkiepg2ATOW2WsG8ldm920k', // ⚠️ ĮRAŠYKITE RESEND RAKTĄ
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MD Impex CRM <onboarding@resend.dev>',
        to: ['valdasjanciauskas@gmail.com'], // ⚠️ ĮRAŠYKITE SAVO PAŠTĄ
        subject: `🚨 SKUBUS IŠKVIETIMAS: Gedimas - ${client}`,
        html: `
          <div style="font-family:Arial,sans-serif;padding:20px;line-height:1.6;">
            <h2 style="color:#e30613;margin-top:0;">Užregistruotas skubios reakcijos reikalaujantis gedimas!</h2>
            <p><strong>Klientas:</strong> ${client}</p>
            <p><strong>Adresas:</strong> ${address}</p>
            <p><strong>Įranga:</strong> ${equipment}</p>
            <p><strong>Serijos numeris:</strong> ${serial}</p>
            <p><strong>Informacija:</strong> <span style="color:#e30613;font-weight:bold;">${details}</span></p>
          </div>
        `
      }),
    });

    if (response.ok) {
      return res.status(200).json({ success: true });
    } else {
      const errText = await response.text();
      return res.status(500).json({ error: errText });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}