import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { mensaje } = req.body;

  if (!mensaje) return res.status(400).json({ error: 'Falta el mensaje' });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Eres un asistente amigable que responde en español de forma clara y humana.' },
        { role: 'user', content: mensaje }
      ],
      temperature: 0.7
    });

    const respuesta = completion.choices[0].message.content.trim();
    res.json({ respuesta });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al contactar al modelo' });
  }
}
