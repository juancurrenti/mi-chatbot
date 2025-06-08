// api/chat.js (Versión para Groq)

// 1. Importar la librería de Groq
const Groq = require("groq-sdk");

// 2. Inicializar el cliente con la clave API desde las variables de entorno
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

module.exports = async (req, res) => {
  // Verificación del método (sin cambios)
  if (req.method !== "POST") {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Obtener el mensaje del cuerpo de la solicitud (sin cambios)
  const { mensaje } = req.body;
  if (!mensaje) {
    return res.status(400).json({ error: "Falta el mensaje" });
  }

  try {
    // 3. Llamar a la API de Groq (la estructura es igual a la de OpenAI)
    const completion = await groq.chat.completions.create({
      // Elige el modelo que quieres usar. Llama 3 (8b) es rápido y muy bueno.
      // Otros modelos disponibles: "llama3-70b-8192", "mixtral-8x7b-32768"
      model: "llama3-8b-8192", 
      messages: [
        {
          role: "system",
          content: "Eres un asistente amigable que responde en español de forma clara y humana.",
        },
        { 
          role: "user", 
          content: mensaje 
        },
      ],
      temperature: 0.7,
    });

    // Procesar la respuesta (sin cambios)
    const respuesta = completion.choices[0].message.content.trim();
    res.json({ respuesta });

  } catch (err) {
    // Manejo de errores
    console.error("Error en la API de Groq:", err);
    res.status(500).json({ error: "Error al contactar al modelo de IA." });
  }
};