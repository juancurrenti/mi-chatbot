// api/chat.js (Versión para Google Gemini)
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

// Inicializa el cliente de Google Generative AI con tu clave API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configuración de seguridad (ajusta según tus necesidades)
// Esto ayuda a bloquear contenido dañino.
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Configuración opcional para la generación de texto (ej. temperatura)
const generationConfig = {
  temperature: 0.7, // Controla la aleatoriedad. Similar a OpenAI.
  // maxOutputTokens: 2048, // Puedes definir un máximo de tokens si es necesario
};

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { mensaje } = req.body;
  if (!mensaje) {
    return res.status(400).json({ error: "Falta el mensaje" });
  }

  try {
    // Obtén el modelo generativo (gemini-pro es bueno para chat)
    const model = genAI.getGenerativeModel({
      model: "gemini-pro",
      safetySettings,
      generationConfig,
    });

    // Para simular un "system prompt" y mantener una conversación, usamos startChat
    const systemInstruction = "Eres un asistente amigable que responde en español de forma clara y humana.";

    const chat = model.startChat({
      history: [
        {
          role: "user", // El "system prompt" se puede enmarcar como una instrucción inicial del usuario
          parts: [{ text: systemInstruction }],
        },
        {
          role: "model", // Una respuesta hipotética del modelo para establecer el contexto
          parts: [{ text: "Entendido. Estoy listo para ayudarte en español." }],
        },
      ],
      // safetySettings y generationConfig también se pueden pasar aquí
    });

    // Envía el mensaje del usuario real como parte de la conversación
    const result = await chat.sendMessage(mensaje);
    const response = result.response;

    // Verifica si la respuesta fue bloqueada por seguridad
    if (!response.candidates || response.candidates.length === 0 || response.promptFeedback && response.promptFeedback.blockReason) {
      let blockMessage = "La respuesta fue bloqueada por las políticas de contenido.";
      if (response.promptFeedback && response.promptFeedback.blockReason) {
        blockMessage = `Respuesta bloqueada debido a: ${response.promptFeedback.blockReason}.`;
        console.error("Safety Ratings:", response.promptFeedback.safetyRatings);
      }
      return res.status(400).json({ error: blockMessage, details: response.promptFeedback });
    }

    const respuesta = response.text().trim();
    res.json({ respuesta });

  } catch (err) {
    console.error("Error en la API de Gemini:", err);
    let errorMessage = "Error al contactar al modelo de IA.";
    if (err.message) {
        if (err.message.includes('API key not valid') || err.message.includes('permission denied')) {
            errorMessage = "Clave API de Gemini no válida o sin permisos. Verifica la configuración.";
        } else if (err.message.toLowerCase().includes('quota') || err.message.includes('billing')) {
            errorMessage = "Se ha excedido la cuota de la API de Gemini. Revisa tu plan y facturación en Google AI Studio.";
        } else if (err.message.includes('Deadline exceeded') || err.message.includes('timed out')) {
            errorMessage = "La solicitud a la API de Gemini tardó demasiado y fue cancelada (timeout). Intenta de nuevo.";
        }
    }
    res.status(500).json({ error: errorMessage });
  }
};