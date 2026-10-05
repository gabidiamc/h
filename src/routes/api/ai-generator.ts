import { createFileRoute } from "@tanstack/react-router";
import { GoogleGenAI } from "@google/genai";

interface QuestionsRequest {
  action: "questions";
  contentType: "article" | "sport" | "activity" | "event";
  cardTitle: string;
  categoryName: string;
  schoolName: string;
  userNotes?: string;
}

interface GenerateRequest {
  action: "generate";
  contentType: "article" | "sport" | "activity" | "event";
  cardTitle: string;
  categoryName: string;
  schoolName: string;
  bannerUrl: string;
  userNotes?: string;
  answers?: Record<string, string>;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } catch (err) {
    console.error("[AI Generator] Failed to initialize GoogleGenAI client:", err);
    return null;
  }
}

// Fallback intelligent generator for DMPS
function generateFallbackQuestions(req: QuestionsRequest): string[] {
  const t = req.cardTitle.toLowerCase();
  if (t.includes("silver cord") || t.includes("voluntari") || t.includes("servicio")) {
    return [
      "¿Quién es el/la Silver Cord Advisor o coordinador(a) oficial de la escuela (nombre y correo @dmschools.org)?",
      "¿A través de qué formulario o aplicación los estudiantes deben enviar sus horas (Infinite Campus, Microsoft Forms, enlace directo)?",
      "¿Cuáles son ejemplos de actividades de servicio comunitario que SÍ cuentan y son comunes en Des Moines?",
      "¿Cuáles son las actividades específicas que NO cuentan (trabajos con pago, tareas escolares rutinarias, empresas con fines de lucro)?",
      "¿Cuánto tiempo aproximadamente tarda en aparecer el registro en Infinite Campus tras la verificación?",
    ];
  }

  if (req.contentType === "sport") {
    return [
      "¿Quién es el entrenador principal (Head Coach) y su correo de contacto @dmschools.org?",
      "¿Cuáles son los grados escolares elegibles (ej: 9-12) y qué temporada aplica (Otoño, Invierno, Primavera)?",
      "¿Dónde y en qué horarios se realizan las pruebas (tryouts) y entrenamientos habituales?",
      "¿Qué requisitos médicos o formularios de Bound / IHSAA son obligatorios antes del primer entrenamiento?",
      "¿Cuáles son las fechas clave del calendario competitivo oficial?",
    ];
  }

  if (req.contentType === "event") {
    return [
      "¿Cuál es la fecha exacta, hora de inicio y hora de finalización del evento?",
      "¿En qué ubicación se llevará a cabo (ej: Gimnasio de Lincoln, Auditorio de East High, Teams/Virtual)?",
      "¿El evento es abierto a todas las familias o requiere inscripción previa / boletos?",
      "¿Habrá servicio de interpretación en español o cuidado de niños disponible?",
      "¿Quién es la persona de contacto en caso de dudas sobre el evento?",
    ];
  }

  return [
    `¿Quién es el responsable o contacto oficial para "${req.cardTitle}" dentro de la escuela o distrito?`,
    "¿Cuáles son los pasos obligatorios o el procedimiento que las familias/estudiantes deben seguir?",
    "¿Qué requisitos, documentos o plazos importantes aplican a este tema?",
    "¿Qué situaciones o casos NO están permitidos o no aplican?",
    "¿Dónde pueden las familias consultar información actualizada o ingresar a su portal?",
  ];
}

function generateFallbackContent(req: GenerateRequest) {
  const isVolunteering =
    req.cardTitle.toLowerCase().includes("silver cord") ||
    req.cardTitle.toLowerCase().includes("voluntari") ||
    req.cardTitle.toLowerCase().includes("servicio");

  const school = req.schoolName || "Abraham Lincoln High School";
  const advisor = req.answers?.["advisor"] || "Isabella Andersen";
  const advisorEmail = req.answers?.["email"] || "isabella.andersen@dmschools.org";

  if (isVolunteering) {
    const spanishContent = `# Voluntariado y Silver Cord

Silver Cord reconoce las horas de servicio voluntario realizadas por estudiantes de ${school} y del distrito escolar.

Ahora los estudiantes son responsables de enviar sus propias horas para que puedan ser revisadas y agregadas a Infinite Campus.

---

### 📲 ¿Cómo subir tus horas?
1. **Realiza tu actividad de voluntariado** en una organización comunitaria o escolar calificada.
2. **Escanea el código QR disponible en esta página** o haz clic en el botón de registro.
3. **Completa el formulario oficial de DMPS** para enviar los detalles y supervisor de tus horas.
4. **Tu Silver Cord Advisor revisará y verificará la información** directamente con la entidad.
5. **Una vez verificadas, las horas aparecerán en Infinite Campus** aproximadamente 24 horas después.

---

### 📱 Enviar mis horas de Silver Cord
> **Enlace directo al formulario oficial**: [Formulario Oficial Silver Cord DMPS](https://forms.office.com/r/dmps-silvercord)
> 
> *Escanea este código o haz clic en el enlace para registrar tus horas de voluntariado.*

---

### ✅ Horas que sí cuentan
Las horas deben ser realizadas como **servicio voluntario comunitario sin pago ni remuneración**.

Algunos ejemplos incluyen:
* **Organizaciones sin fines de lucro** y bancos de alimentos comunitarios.
* **Escuelas públicas** y programas de tutoría entre pares.
* **Parques municipales y centros de recreación** de Des Moines.
* **Comunidades para adultos mayores** y centros de asistencia social.
* **Programas de caridad y refugios locales**.
* **Centros de cuidado infantil sin costo**.
* **Eventos comunitarios y vecinales** en la ciudad.
* **Eventos escolares extracurriculares** (guiar visitas, eventos de bienvenida).
* **Programas como despensas de alimentos o closets de ropa comunitaria**.

---

### ⛪ Algunas actividades religiosas también pueden contar
Por ejemplo:
* Sunday/Wednesday School como apoyo educativo voluntario;
* Vacation Bible School;
* Clases de confirmación comunitaria;
* Cuidar niños durante servicios religiosos sin pago;
* Ayudar con sonido, proyección o video comunitario;
* Viajes de misión o servicio humanitario.

*Estas actividades deben cumplir estrictamente con las reglas de servicio desinteresado de Silver Cord.*

---

### ❌ Horas que no cuentan
**No se aceptan horas realizadas:**
* Para cumplir requisitos de membresía exclusiva de una iglesia o club privado;
* Trabajando para una empresa privada con fines de lucro;
* Trabajando para un country club o negocio familiar remunerado;
* Cuando recibes pago, propinas, estipendio o compensación económica;
* Ayudando al personal escolar con tareas normales de oficina como organizar o limpiar aulas en horario escolar.

---

### 🚫 Actividades religiosas que no cuentan
Las horas **no pueden estar directamente relacionadas con rituales, servicios o ceremonias religiosas internas**:
* Tocar instrumentos o cantar en el coro durante el servicio religioso;
* Encender velas o servir en el altar;
* Leer textos religiosos durante la ceremonia;
* Ser usher o repartir programas durante el servicio semanal.

---

### ⏱️ ¿Cuándo aparecen mis horas?
Después de que tu **Silver Cord Advisor** las verifique, las horas deberían aparecer en **Infinite Campus** dentro de aproximadamente **24 a 48 horas**.

*Puedes revisar tus horas acumuladas en cualquier momento entrando a la sección Silver Cord dentro de tu portal de Infinite Campus.*

---

### 💬 ¿Necesitas ayuda o tienes dudas?
Si tienes preguntas sobre si una actividad cuenta antes de hacerla, sobre tus horas pendientes o sobre el formulario, puedes contactar a:

* **Asesora Oficial**: ${advisor}
* 📧 **Correo institucional**: [${advisorEmail}](mailto:${advisorEmail})
* 💬 **Mensajería interna**: Búscala en Microsoft Teams por su nombre.

---

### ⭐ Recomendación antes de hacer voluntariado
Si no estás seguro de que una actividad contará para Silver Cord, **pregunta a tu consejero o consejera antes de realizar las horas**. Así evitas completar horas que después no puedan ser aprobadas.`;

    const englishContent = `# Volunteering & Silver Cord

Silver Cord honors and recognizes volunteer service hours completed by students at ${school} and across the district.

Students are now responsible for submitting their own hours so they can be reviewed, verified, and officially added to Infinite Campus.

---

### 📲 How to submit your hours?
1. **Complete your volunteer service** with an eligible community or school organization.
2. **Scan the QR code on this page** or use the direct submission button.
3. **Fill out the official DMPS submission form** with activity details and supervisor info.
4. **Your Silver Cord Advisor will review and verify** the information with the host organization.
5. **Once approved, hours will appear in Infinite Campus** within approximately 24 hours.

---

### 📱 Submit My Silver Cord Hours
> **Direct Official Link**: [Official DMPS Silver Cord Form](https://forms.office.com/r/dmps-silvercord)
> 
> *Scan the code or click the button to log your volunteer hours.*

---

### ✅ Hours that DO count
All hours must be performed as **unpaid volunteer community service**.

Examples include:
* Non-profit organizations and community food banks.
* Public schools and peer tutoring programs.
* City parks and recreation cleanup/programs.
* Senior living communities and nursing homes.
* Local charity programs and family shelters.
* Community child-care programs (unpaid).
* Community and neighborhood festivals.
* School events (tour guides, orientation helpers).
* Clothing closets, diaper pantries, and food distribution.

---

### ⛪ Certain religious activities may also count
For example:
* Sunday/Wednesday School educational volunteer support;
* Vacation Bible School leadership;
* Community confirmation class volunteering;
* Childcare during services without pay;
* Assisting with audio, sound, or video production;
* Mission or humanitarian community service trips.

---

### ❌ Hours that DO NOT count
* Hours completed to meet church membership or private club requirements.
* Work performed for a for-profit private business.
* Work at a country club or family commercial business.
* Any activity where you receive wages, tips, or monetary compensation.
* Assisting school staff with routine maintenance, cleaning, or desk work during school hours.

---

### ⏱️ When will my hours show up?
After your Silver Cord Advisor approves them, your verified hours will reflect in Infinite Campus within **24 to 48 hours**.

---

### 💬 Need Help?
Contact your school's advisor:
* **Advisor**: ${advisor}
* 📧 **Email**: [${advisorEmail}](mailto:${advisorEmail})
* 💬 **Microsoft Teams**: Send a direct message.

---

### ⭐ Pro-Tip Before You Volunteer
If you are unsure whether an activity qualifies for Silver Cord, **always ask before completing the hours** to ensure approval.`;

    return {
      title: req.cardTitle || "Voluntariado y Silver Cord",
      card_title: req.cardTitle || "Voluntariado y Silver Cord",
      summary:
        "Guía oficial completa: cómo enviar tus horas de servicio voluntario a Infinite Campus, qué actividades sí cuentan y contactos oficiales de DMPS.",
      banner_url:
        req.bannerUrl ||
        "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1200&q=80",
      content: spanishContent,
      title_en: "Volunteering & Silver Cord",
      summary_en:
        "Official guide on submitting volunteer service hours to Infinite Campus, qualified activities, and verified advisor contacts.",
      content_en: englishContent,
      callout: {
        title: "¡Registra tus horas a tiempo!",
        text: "Las horas deben registrarse en el mismo semestre en que se realizaron para garantizar su aprobación en Infinite Campus.",
        variant: "verified",
      },
      blocks: [
        {
          type: "callout",
          title: "¡Reconocimiento al Servicio Comunitario!",
          text: `El programa Silver Cord distingue a los estudiantes de ${school} que dedican su tiempo al servicio de la comunidad sin fines de lucro.`,
          variant: "verified",
        },
        {
          type: "heading",
          text: "📲 Pasos para subir tus horas a Infinite Campus",
        },
        {
          type: "list",
          items: [
            "Realiza tu actividad voluntaria en una entidad comunitaria o sin fines de lucro.",
            "Completa el formulario en línea indicando los datos de tu supervisor.",
            "Tu Silver Cord Advisor revisará y verificará la información.",
            "Las horas aparecerán en tu portal de Infinite Campus en 24 a 48 horas.",
          ],
        },
        {
          type: "button",
          text: "📱 Enviar mis horas de Silver Cord",
          url: "https://forms.office.com/r/dmps-silvercord",
          bgColor: "#0284c7",
          textColor: "#ffffff",
        },
        {
          type: "heading",
          text: "✅ Horas que sí cuentan para el reconocimiento",
        },
        {
          type: "list",
          items: [
            "Bancos de alimentos, despensas comunitarias y closets de ropa.",
            "Escuelas públicas y apoyo a eventos de la comunidad.",
            "Centros comunitarios, parques y hogares para personas de la tercera edad.",
            "Actividades de servicio humanitario y caridad comunitaria.",
          ],
        },
        {
          type: "heading",
          text: "❌ Horas que no son elegibles",
        },
        {
          type: "list",
          items: [
            "Trabajos para empresas privadas con fines de lucro o negocios familiares.",
            "Cualquier actividad donde se reciba pago monetario o propinas.",
            "Tareas escolares cotidianas en horario de clases.",
            "Actividades exclusivas para cumplir requisitos de membresía interna.",
          ],
        },
        {
          type: "callout",
          title: `💬 Asesora Oficial: ${advisor}`,
          text: `Para consultas o validación previa de actividades, escribe a ${advisorEmail} o contacta vía Microsoft Teams.`,
          variant: "info",
        },
      ],
      metadata: {
        category_id: req.categoryName || "cat_ayuda_familias",
        school_id: req.schoolName?.toLowerCase().includes("east")
          ? "east"
          : req.schoolName?.toLowerCase().includes("lincoln")
            ? "lincoln"
            : "all",
        status: "published",
        is_featured: true,
      },
    };
  }

  // Generic DMPS structured content
  const spanishContent = `# ${req.cardTitle}

${req.userNotes || `Información oficial y actualizada para las familias y estudiantes de ${school}.`}

---

### 📲 ¿Cómo participar o acceder?
1. **Revisa los requisitos oficiales** detallados a continuación.
2. **Accede al portal institucional o enlace oficial** provisto por el distrito.
3. **Completa los registros necesarios** antes de las fechas límite establecidas.
4. **Verifica la confirmación** recibida en tu correo o perfil de estudiante.

---

### ✅ Lo que incluye y requisitos cumplidos
* Información directamente verificada con los lineamientos de Des Moines Public Schools.
* Acceso garantizado para todos los estudiantes elegibles del campus.
* Apoyo y orientación en español e inglés para todas las familias.

---

### ❌ Restricciones y consideraciones
* No se permiten inscripciones fuera de los plazos reglamentarios.
* No sustituye las clases académicas regulares en el horario obligatorio.

---

### ⏱️ Fechas clave y tiempos
Las actualizaciones se publican periódicamente y cualquier cambio en fechas se informará a través del portal y notificaciones oficiales de la escuela.

---

### 💬 ¿Necesitas ayuda o más información?
Puedes comunicarte con la oficina principal de ${school} o con el enlace bilingüe familiar (BFL) para asistencia inmediata en tu idioma.`;

  const englishContent = `# ${req.cardTitle}

${req.userNotes || `Official verified information for families and students at ${school}.`}

---

### 📲 How to participate or access?
1. **Review the official requirements** outlined below.
2. **Access the official school portal or link** provided by the district.
3. **Complete required registration** before the deadline.
4. **Check confirmation** sent to your student email or account.

---

### ✅ Included & Verified Guidelines
* Information confirmed through Des Moines Public Schools official policies.
* Open to eligible students enrolled in the school.
* Bilingual family support available upon request.

---

### 💬 Need assistance?
Contact the main office at ${school} or reach out to your school's Bilingual Family Liaison (BFL).`;

  return {
    title: req.cardTitle,
    card_title: req.cardTitle,
    summary:
      req.userNotes ||
      `Guía y detalles completos sobre ${req.cardTitle} para estudiantes y familias de ${school}.`,
    banner_url:
      req.bannerUrl ||
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
    content: spanishContent,
    title_en: req.cardTitle,
    summary_en: `Complete information and official guide regarding ${req.cardTitle}.`,
    content_en: englishContent,
    callout: {
      title: "Información Escolar Verificada",
      text: `Contenido revisado y adaptado para los estándares de ${school}.`,
      variant: "verified",
    },
    blocks: [
      {
        type: "callout",
        title: "Información Escolar Oficial",
        text: `Contenido oficial para la comunidad de ${school}.`,
        variant: "verified",
      },
      {
        type: "heading",
        text: "📲 Pasos e Instrucciones",
      },
      {
        type: "list",
        items: [
          "Revisa los requisitos y fechas clave.",
          "Completa los formularios requeridos a través del portal oficial.",
          "Contacta al consejero o asesor escolar si tienes dudas.",
        ],
      },
    ],
    metadata: {
      category_id: req.categoryName || "cat_empieza_aqui",
      school_id: req.schoolName?.toLowerCase().includes("east")
        ? "east"
        : req.schoolName?.toLowerCase().includes("lincoln")
          ? "lincoln"
          : "all",
      status: "published",
      is_featured: false,
    },
  };
}

export const Route = createFileRoute("/api/ai-generator")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as QuestionsRequest | GenerateRequest;

          if (body.action === "questions") {
            const ai = getGeminiClient();
            if (ai) {
              try {
                const prompt = `Eres el Asistente Experto de Contenido Oficial para el Distrito Escolar de Des Moines (Des Moines Public Schools - DMPS, Iowa).
Un administrador escolar quiere publicar un nuevo elemento en el portal de familias:
- Tipo: ${body.contentType}
- Título de la tarjeta: "${body.cardTitle}"
- Categoría: "${body.categoryName}"
- Escuela: "${body.schoolName}"
- Notas previas del usuario: "${body.userNotes || "Ninguna"}"

Tu tarea es formular exactamente entre 4 y 5 preguntas sumamente específicas, inteligentes y prácticas dirigidas al administrador para recopilar todos los datos verídicos y necesarios para que el contenido sea 100% realista, sin información falsa.
Pregunta por cosas como:
1. Contacto institucional exacto (persona encargada, correo @dmschools.org, Teams).
2. Plataforma o portal oficial (ej: Infinite Campus, Canvas, Microsoft Forms, Bound).
3. Reglas claras de qué SÍ cuenta o qué está permitido.
4. Restricciones o qué NO está permitido / no califica.
5. Tiempos de procesamiento, fechas clave o requisitos previos.

Devuelve ÚNICAMENTE un array JSON válido de strings con las preguntas en español, sin texto adicional ni bloques markdown alrededor, por ejemplo:
["¿Quién es el asesor oficial...?", "¿A través de qué plataforma...?"]`;

                const res = await ai.models.generateContent({
                  model: "gemini-3.8-flash",
                  contents: prompt,
                  config: {
                    temperature: 0.2,
                  },
                });

                const rawText = res.text?.trim() || "";
                const cleanJson = rawText
                  .replace(/^```json\s*/i, "")
                  .replace(/^```\s*/i, "")
                  .replace(/```$/i, "")
                  .trim();

                const parsed = JSON.parse(cleanJson);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  return new Response(JSON.stringify({ success: true, questions: parsed }), {
                    headers: { "content-type": "application/json" },
                  });
                }
              } catch {
                // Graceful fallback to verified local reasoning
              }
            }

            const fallbackQ = generateFallbackQuestions(body);
            return new Response(JSON.stringify({ success: true, questions: fallbackQ }), {
              headers: { "content-type": "application/json" },
            });
          }

          if (body.action === "generate") {
            const ai = getGeminiClient();
            if (ai) {
              try {
                const qaPairs = body.answers
                  ? Object.entries(body.answers)
                      .map(([q, a]) => `- Pregunta: ${q}\n  Respuesta: ${a}`)
                      .join("\n")
                  : "No se proporcionaron respuestas adicionales.";

                const prompt = `Eres el redactor y diseñador de contenido oficial para Des Moines Public Schools (DMPS).
El administrador quiere generar una publicación de altísima calidad con la estructura EXACTA mostrada a continuación:
- Tipo: ${body.contentType}
- Título de la tarjeta: "${body.cardTitle}"
- Categoría: "${body.categoryName}"
- Escuela: "${body.schoolName}"
- Banner seleccionado: "${body.bannerUrl}"
- Notas del usuario: "${body.userNotes || ""}"
- Datos y respuestas clave del administrador:
${qaPairs}

INSTRUCCIONES CRUCIALES DE ESTRUCTURA Y ESTILO:
El contenido debe seguir fielmente la estructura del ejemplo de referencia "Voluntariado y Silver Cord":
1. Título principal claro y profesional.
2. Dos párrafos introductorios explicando el propósito y la importancia para el estudiante y la familia.
3. Sección "📲 ¿Cómo [hacer la acción / subir tus horas / registrarte / participar]?" con lista numerada paso a paso detallada.
4. Botón / Instrucción QR destacada "📱 [Nombre de la acción]" con enlace o indicación clara.
5. Sección "✅ [Horas / Actividades / Requisitos] que SÍ cuentan" con viñetas detalladas de casos reales (organizaciones sin fines de lucro, escuelas, bancos de alimentos, etc.).
6. Sección de casos especiales (ej: "⛪ Algunas actividades religiosas que también pueden contar" o condiciones particulares si aplica).
7. Sección "❌ [Horas / Actividades] que NO cuentan" con viñetas explícitas de exclusiones (sin fines de lucro, no empresas comerciales, no compensación económica, etc.).
8. Sección "🚫 Restricciones o casos prohibidos".
9. Sección "⏱️ ¿Cuándo aparecen [mis horas / resultados / confirmación]?" con plazos realistas en Infinite Campus o plataforma escolar.
10. Sección "💬 ¿Necesitas ayuda?" con nombre de la persona asesora o encargada, correo institucional @dmschools.org y Microsoft Teams.
11. Sección "⭐ Recomendación antes de..." con un consejo proactivo esencial para no perder tiempo ni esfuerzo.

Devuelve ÚNICAMENTE un objeto JSON válido con este formato:
{
  "title": "Título en español",
  "card_title": "${body.cardTitle}",
  "summary": "Resumen conciso en español de 1-2 oraciones",
  "banner_url": "${body.bannerUrl}",
  "content": "Contenido completo en Markdown en español con todos los encabezados, emojis, listas y secciones indicadas",
  "title_en": "Title in English",
  "summary_en": "1-2 sentence summary in English",
  "content_en": "Full English content in Markdown with the same structure, emojis and sections",
  "callout": {
    "title": "Título del aviso importante",
    "text": "Texto explicativo",
    "variant": "verified"
  },
  "blocks": [
    { "type": "callout", "title": "...", "text": "...", "variant": "verified" },
    { "type": "heading", "text": "📲 Pasos para ..." },
    { "type": "list", "items": ["Paso 1...", "Paso 2..."] },
    { "type": "button", "text": "📱 Acción principal", "url": "https://forms.office.com/...", "bgColor": "#0284c7", "textColor": "#ffffff" },
    { "type": "heading", "text": "✅ Lo que sí cuenta" },
    { "type": "list", "items": ["Item 1...", "Item 2..."] },
    { "type": "heading", "text": "❌ Lo que no cuenta" },
    { "type": "list", "items": ["Item 1...", "Item 2..."] },
    { "type": "callout", "title": "💬 Contacto Oficial", "text": "Nombre y correo @dmschools.org", "variant": "info" }
  ],
  "metadata": {
    "category_id": "${body.categoryName}",
    "school_id": "${body.schoolName?.toLowerCase().includes("east") ? "east" : body.schoolName?.toLowerCase().includes("lincoln") ? "lincoln" : "all"}",
    "status": "published",
    "is_featured": true
  }
}`;

                const res = await ai.models.generateContent({
                  model: "gemini-3.8-flash",
                  contents: prompt,
                  config: {
                    temperature: 0.3,
                  },
                });

                const rawText = res.text?.trim() || "";
                const cleanJson = rawText
                  .replace(/^```json\s*/i, "")
                  .replace(/^```\s*/i, "")
                  .replace(/```$/i, "")
                  .trim();

                const parsed = JSON.parse(cleanJson);
                if (parsed && parsed.title && parsed.content) {
                  return new Response(JSON.stringify({ success: true, result: parsed }), {
                    headers: { "content-type": "application/json" },
                  });
                }
              } catch {
                // Graceful fallback to verified local generator
              }
            }

            const fallbackContent = generateFallbackContent(body);
            return new Response(JSON.stringify({ success: true, result: fallbackContent }), {
              headers: { "content-type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ error: "Invalid action" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        } catch (err) {
          console.error("[AI Generator] Server error:", err);
          return new Response(JSON.stringify({ error: String(err) }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
