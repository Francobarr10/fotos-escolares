const path = require("path");
const express = require("express");
const { MercadoPagoConfig, Preference } = require("mercadopago");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 🔐 CONFIG NUEVA
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_TOKEN
});

// 🧪 Ruta base
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/crear-pago", async (req, res) => {
  const { alumno, curso, paquete } = req.body;

  console.log("Datos recibidos:", alumno, curso, paquete);

  const precios = {
    "Básico": 100,
    "Intermedio": 5000,
    "Completo": 8000
  };

  try {
    const preference = new Preference(client);

const response = await preference.create({
  body: {
    items: [
      {
        title: `Fotos escolares - ${paquete}`,
        quantity: 1,
        unit_price: Number(precios[paquete]),
        currency_id: "ARS"
      }
    ],
    back_urls: {
      success: "https://fotos-escolares-en0h.onrender.com",
      failure: "https://fotos-escolares-en0h.onrender.com"
    },
    notification_url: "https://fotos-escolares-en0h.onrender.com/webhook"
  }
});
    res.json({ init_point: response.init_point });

  }catch (error) {
  console.log("=== ERROR MP ===");
  console.log(error);
  console.log("STATUS:", error?.status);
  console.log("MESSAGE:", error?.message);
  console.log("CAUSE:", error?.cause);
  console.log("FULL:", JSON.stringify(error, null, 2));
  res.status(500).send("Error al crear pago");
}
});
app.post("/webhook", (req, res) => {
  console.log("WEBHOOK RECIBIDO:", req.body);

  // acá después vamos a validar el pago

  res.sendStatus(200);
});
app.listen(3000, () => {
  console.log("Servidor corriendo en puerto 3000");
});